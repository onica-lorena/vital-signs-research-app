import os
import json
from pathlib import Path
from datetime import date, datetime, timedelta, timezone

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

import joblib
import numpy as np
import tensorflow as tf

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.core.config import settings
from app.models.analysis import AnalysisModelType, AnalysisRun, AnalysisResult
from app.models.participant import (
    ActivityLevel,
    MeasurementContext,
    ParticipantCondition,
    ParticipantConditionType,
    ParticipantSex,
    ParticipantSubmission,
    ParticipantSubmissionSession,
    ParticipantSubmissionStatus,
    ParticipantSubmissionValue,
    StudyParticipant,
)
from app.models.study import StudyParameterKey
from app.models.user import User
from app.services.ml_feature_service import (
    REQUIRED_FEATURE_COLUMNS,
    build_prediction_features_from_submissions,
    filter_task_prediction_rows,
)
from app.services.participant_service import get_study_for_current_user
from app.schemas.analysis import AnalysisScope

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

TASK_RISK_THRESHOLDS = {
    "hr": 0.087,
    "spo2": 0.125,
    "rr": 0.122,      
    "temp": 0.728,
}

_MODEL_CACHE = {}

def _resolve_analysis_interval(
    scope: AnalysisScope,
    start_date: datetime | None,
    end_date: datetime | None,
) -> tuple[datetime, datetime]:
    now = datetime.now(timezone.utc)

    if scope == AnalysisScope.LAST_24H:
        return now - timedelta(hours=24), now

    if scope == AnalysisScope.LAST_48H:
        return now - timedelta(hours=48), now

    if scope == AnalysisScope.LAST_7_DAYS:
        return now - timedelta(days=7), now

    if scope == AnalysisScope.CUSTOM:
        if start_date is None or end_date is None:
            raise ValueError("Pentru interval personalizat trebuie completate start_date și end_date.")
        return start_date, end_date

    return now - timedelta(hours=48), now


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
    analysis_start_date: datetime,
    analysis_end_date: datetime,
    measurement_context: MeasurementContext | None = None,
) -> list[ParticipantSubmission]:
    filters = [
        ParticipantSubmission.study_id == study_id,
        ParticipantSubmission.participant_id == participant_id,
        ParticipantSubmission.status.in_(
            [
                ParticipantSubmissionStatus.SUBMITTED,
                ParticipantSubmissionStatus.VALIDATED,
            ]
        ),
        ParticipantSubmissionValue.measured_at >= analysis_start_date,
        ParticipantSubmissionValue.measured_at <= analysis_end_date,
    ]

    if measurement_context is not None:
        filters.append(
            ParticipantSubmissionSession.measurement_context == measurement_context
        )

    stmt = (
        select(ParticipantSubmission)
        .options(selectinload(ParticipantSubmission.values))
        .join(ParticipantSubmission.values)
        .join(ParticipantSubmission.session)
        .where(*filters)
        .order_by(ParticipantSubmission.submitted_at.asc())
        .distinct()
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

    probabilities = model.predict_proba(X_processed)[:, 1]
    probability = float(np.max(probabilities))

    return probability


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

def _calculate_age(birth_date, reference_date: date) -> int | None:
    if birth_date is None:
        return None

    return (
        reference_date.year
        - birth_date.year
        - ((reference_date.month, reference_date.day) < (birth_date.month, birth_date.day))
    )

def run_analysis_for_study(
    db: Session,
    study_id: int,
    current_user: User,
    participant_id: int | None = None,
    scope: AnalysisScope = AnalysisScope.LAST_48H,
    start_date: datetime | None = None,
    end_date: datetime | None = None,
    age_min: int | None = None,
    age_max: int | None = None,
    sex: ParticipantSex | None = None,
    participant_group: str | None = None,
    activity_level: ActivityLevel | None = None,
    condition_type: ParticipantConditionType | None = None,
    measurement_context: MeasurementContext | None = None,
) -> tuple[AnalysisRun, list[AnalysisResult]]:
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
        load_parameters=True,
    )

    if study is None:
        raise LookupError("Studiul nu a fost găsit.")
    
    analysis_start_date, analysis_end_date = _resolve_analysis_interval(
        scope=scope,
        start_date=start_date,
        end_date=end_date,
    )

    participant_filters = [StudyParticipant.study_id == study_id]

    if participant_id is not None:
        participant_filters.append(StudyParticipant.id == participant_id)

    if sex is not None:
        participant_filters.append(StudyParticipant.sex == sex)

    if participant_group:
        participant_filters.append(StudyParticipant.participant_group == participant_group)

    if activity_level is not None:
        participant_filters.append(StudyParticipant.activity_level == activity_level)

    stmt = (
        select(StudyParticipant)
        .options(selectinload(StudyParticipant.conditions))
        .where(*participant_filters)
    )

    if condition_type is not None:
        stmt = stmt.join(ParticipantCondition).where(
            ParticipantCondition.condition_type == condition_type
        )

    participants = list(db.execute(stmt).scalars().unique().all())

    if age_min is not None or age_max is not None:
        reference_date = analysis_end_date.date()
        filtered_participants = []

        for participant in participants:
            age = _calculate_age(participant.birth_date, reference_date)

            if age is None:
                continue

            if age_min is not None and age < age_min:
                continue

            if age_max is not None and age > age_max:
                continue

            filtered_participants.append(participant)

        participants = filtered_participants

    if not participants:
        raise ValueError("Nu există participanți disponibili pentru analiză.")

    analysis_run = AnalysisRun(
        study_id=study_id,
        requested_participant_id=participant_id,
        analysis_scope=scope.value,
        analysis_start_date=analysis_start_date,
        analysis_end_date=analysis_end_date,
        filter_age_min=age_min,
        filter_age_max=age_max,
        filter_sex=sex.value if sex else None,
        filter_participant_group=participant_group,
        filter_activity_level=activity_level.value if activity_level else None,
        filter_condition_type=condition_type.value if condition_type else None,
        filter_measurement_context=measurement_context.value if measurement_context else None,
        participants_analyzed=0,
        total_results=0,
        high_risk_results=0,
        low_risk_results=0,
        records_used=0,
        max_risk_probability=None,
        max_risk_parameter_key=None,
    )

    db.add(analysis_run)
    db.flush()

    study_parameters = {parameter.parameter_key for parameter in study.parameters}
    results: list[AnalysisResult] = []

    for participant in participants:
        submissions = _load_participant_submissions(
            db=db,
            study_id=study_id,
            participant_id=participant.id,
            analysis_start_date=analysis_start_date,
            analysis_end_date=analysis_end_date,
            measurement_context=measurement_context,
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
                start_date=analysis_start_date,
                end_date=analysis_end_date,
            )

            if features_df.empty:
                continue

            try:
                prediction_df = filter_task_prediction_rows(features_df, task)

                if prediction_df.empty:
                    continue

                if cfg["model_type"] == AnalysisModelType.LSTM:
                    probability, window_size = _predict_lstm(task, prediction_df)
                else:
                    probability = _predict_classical(
                        task=task,
                        model_name=cfg["model_name"],
                        features_df=prediction_df,
                    )
                    window_size = None

                threshold = TASK_RISK_THRESHOLDS.get(task, settings.analysis_risk_threshold)

                risk_label = (
                    "high_risk"
                    if probability >= threshold
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
                    analysis_start_date=analysis_start_date,
                    analysis_end_date=analysis_end_date,
                    analysis_scope=scope.value,

                    filter_age_min=age_min,
                    filter_age_max=age_max,
                    filter_sex=sex.value if sex else None,
                    filter_participant_group=participant_group,
                    filter_activity_level=activity_level.value if activity_level else None,
                    filter_condition_type=condition_type.value if condition_type else None,
                    filter_measurement_context=measurement_context.value if measurement_context else None,
                )

                db.add(result)
                results.append(result)

            except ValueError as exc:
                print(f"[ANALYSIS SKIP] participant={participant.id}, task={task}, reason={exc}")
                continue

    if not results:
        db.rollback()
        raise ValueError("Nu au existat suficiente date compatibile pentru rularea analizei.")

    participants_analyzed = len({result.participant_id for result in results})
    high_risk_results = sum(1 for result in results if result.risk_label == "high_risk")
    low_risk_results = sum(1 for result in results if result.risk_label == "low_risk")
    records_used = sum(result.records_used or 0 for result in results)
    max_risk_result = max(results, key=lambda result: result.risk_probability)

    analysis_run.participants_analyzed = participants_analyzed
    analysis_run.total_results = len(results)
    analysis_run.high_risk_results = high_risk_results
    analysis_run.low_risk_results = low_risk_results
    analysis_run.records_used = records_used
    analysis_run.max_risk_probability = max_risk_result.risk_probability
    analysis_run.max_risk_parameter_key = max_risk_result.parameter_key

    db.add(analysis_run)
    db.commit()

    db.refresh(analysis_run)

    for result in results:
        db.refresh(result)

    return analysis_run, results