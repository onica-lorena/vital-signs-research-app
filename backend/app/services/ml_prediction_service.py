import json
from pathlib import Path

import joblib
import numpy as np
import tensorflow as tf

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.analysis import AnalysisModelType, AnalysisResult
from app.models.participant import (
    ParticipantSubmission,
    ParticipantSubmissionStatus,
    StudyParticipant,
)
from app.models.study import StudyParameterKey
from app.models.user import User
from app.services.ml_feature_service import (
    REQUIRED_FEATURE_COLUMNS,
    build_prediction_features_from_submissions,
)
from app.services.participant_service import get_study_for_current_user


TASK_MODEL_CONFIG = {
    "hr": {
        "parameter_key": StudyParameterKey.HEART_RATE,
        "model_type": AnalysisModelType.RANDOM_FOREST,
        "model_name": "random_forest",
    },
    "spo2": {
        "parameter_key": StudyParameterKey.SPO2,
        "model_type": AnalysisModelType.RANDOM_FOREST,
        "model_name": "random_forest",
    },
    "rr": {
        "parameter_key": StudyParameterKey.RESPIRATORY_RATE,
        "model_type": AnalysisModelType.LSTM,
        "model_name": "lstm",
    },
    "temp": {
        "parameter_key": StudyParameterKey.TEMPERATURE,
        "model_type": AnalysisModelType.XGBOOST,
        "model_name": "xgboost",
    },
}

_MODEL_CACHE = {}


def _artifact_path(*parts: str) -> Path:
    return Path(settings.ml_artifacts_dir).resolve().joinpath(*parts)


def _load_classical_model(task: str, model_name: str):
    cache_key = f"{task}_{model_name}"

    if cache_key not in _MODEL_CACHE:
        model_path = _artifact_path("models", f"{task}_{model_name}.pkl")
        preprocess_path = _artifact_path(
            "scalers",
            f"{task}_{model_name}_preprocess.pkl",
        )

        model = joblib.load(model_path)
        preprocess = joblib.load(preprocess_path)

        _MODEL_CACHE[cache_key] = (model, preprocess)

    return _MODEL_CACHE[cache_key]


def _build_lstm_model(window_size: int, feature_count: int):
    model = tf.keras.Sequential(
        [
            tf.keras.layers.Input(shape=(window_size, feature_count)),
            tf.keras.layers.LSTM(64),
            tf.keras.layers.Dropout(0.3),
            tf.keras.layers.Dense(1, activation="sigmoid"),
        ]
    )
    return model


def _load_lstm(task: str):
    cache_key = f"{task}_lstm"

    if cache_key not in _MODEL_CACHE:
        weights_path = _artifact_path("models", f"{task}_lstm_final.weights.h5")
        scaler_path = _artifact_path("scalers", f"{task}_scaler_final.pkl")
        config_path = _artifact_path("configs", f"{task}_config_hibrid.json")

        with open(config_path, encoding="utf-8") as f:
            config = json.load(f)

        feature_cols = config.get("FEATURE_COLS", REQUIRED_FEATURE_COLUMNS)
        window_size = int(config.get("WINDOW_SIZE", 24))

        model = _build_lstm_model(
            window_size=window_size,
            feature_count=len(feature_cols),
        )
        model.load_weights(weights_path)

        scaler = joblib.load(scaler_path)

        _MODEL_CACHE[cache_key] = (model, scaler, config)

    return _MODEL_CACHE[cache_key]

def _load_participant_submissions(
    db: Session,
    study_id: int,
    participant_id: int,
) -> list[ParticipantSubmission]:
    stmt = (
        select(ParticipantSubmission)
        .options(selectinload(ParticipantSubmission.values))
        .where(
            ParticipantSubmission.study_id == study_id,
            ParticipantSubmission.participant_id == participant_id,
            ParticipantSubmission.status.in_(
                [
                    ParticipantSubmissionStatus.SUBMITTED,
                    ParticipantSubmissionStatus.VALIDATED,
                ]
            ),
        )
        .order_by(ParticipantSubmission.submitted_at.asc())
    )

    return list(db.execute(stmt).scalars().all())


def _predict_classical(task: str, model_name: str, features_df) -> float:
    model, preprocess = _load_classical_model(task, model_name)

    X = features_df[REQUIRED_FEATURE_COLUMNS].copy()

    if hasattr(preprocess, "feature_names_in_"):
        required_cols = list(preprocess.feature_names_in_)
        missing = [col for col in required_cols if col not in X.columns]

        if missing:
            raise ValueError(
                f"Date insuficiente pentru modelul {task}_{model_name}. Lipsesc coloanele: {missing}"
            )

        X = X[required_cols]

    X_processed = preprocess.transform(X)
    probability = model.predict_proba(X_processed)[-1, 1]

    return float(probability)


def _predict_lstm(task: str, features_df) -> tuple[float, int]:
    model, scaler, config = _load_lstm(task)

    feature_cols = config.get("FEATURE_COLS", REQUIRED_FEATURE_COLUMNS)
    window_size = int(config.get("WINDOW_SIZE", 24))

    missing = [col for col in feature_cols if col not in features_df.columns]
    if missing:
        raise ValueError(
            f"Date insuficiente pentru modelul LSTM {task}. Lipsesc coloanele: {missing}"
        )

    if len(features_df) < window_size:
        raise ValueError(
            f"Modelul LSTM necesită cel puțin {window_size} înregistrări orare valide."
        )

    X = features_df[feature_cols].copy()
    X = X.ffill().bfill()

    if X.isna().any().any():
        raise ValueError("Datele conțin valori lipsă care nu pot fi completate.")

    X_window = X.tail(window_size)
    X_scaled = scaler.transform(X_window.values)
    X_scaled = X_scaled.reshape(1, window_size, -1)

    probability = model.predict(X_scaled, verbose=0)[0][0]

    return float(probability), window_size


def run_analysis_for_study(
    db: Session,
    study_id: int,
    current_user: User,
    participant_id: int | None = None,
) -> list[AnalysisResult]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
        load_parameters=True,
    )

    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    participant_filters = [StudyParticipant.study_id == study_id]

    if participant_id is not None:
        participant_filters.append(StudyParticipant.id == participant_id)

    participants = list(
        db.execute(
            select(StudyParticipant).where(*participant_filters)
        ).scalars().all()
    )

    if not participants:
        raise ValueError("Nu există participanți disponibili pentru analiză.")

    study_parameters = {parameter.parameter_key for parameter in study.parameters}
    results: list[AnalysisResult] = []

    for participant in participants:
        submissions = _load_participant_submissions(
            db=db,
            study_id=study_id,
            participant_id=participant.id,
        )

        if not submissions:
            continue

        for task, cfg in TASK_MODEL_CONFIG.items():
            parameter_key = cfg["parameter_key"]

            if parameter_key not in study_parameters:
                continue

            features_df = build_prediction_features_from_submissions(
                submissions=submissions,
                task=task,
            )

            if features_df.empty:
                continue

            try:
                if cfg["model_type"] == AnalysisModelType.LSTM:
                    probability, window_size = _predict_lstm(task, features_df)
                else:
                    probability = _predict_classical(
                        task=task,
                        model_name=cfg["model_name"],
                        features_df=features_df,
                    )
                    window_size = None

                risk_label = (
                    "high_risk"
                    if probability >= settings.analysis_risk_threshold
                    else "low_risk"
                )

                result = AnalysisResult(
                    study_id=study_id,
                    participant_id=participant.id,
                    parameter_key=parameter_key,
                    model_type=cfg["model_type"],
                    model_name=cfg["model_name"],
                    risk_probability=probability,
                    risk_label=risk_label,
                    records_used=len(features_df),
                    window_size=window_size,
                )

                db.add(result)
                results.append(result)

            except ValueError as exc:
                print(f"[ANALYSIS SKIP] participant={participant.id}, task={task}, reason={exc}")
                continue

    if not results:
        raise ValueError("Nu au existat suficiente date compatibile pentru rularea analizei.")

    db.commit()

    for result in results:
        db.refresh(result)

    return results