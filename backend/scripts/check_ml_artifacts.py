import json
import os
import sys
from pathlib import Path

os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"

BACKEND_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_DIR))

import joblib
import tensorflow as tf

from app.core.config import settings


TASKS = ["hr", "rr", "spo2", "temp"]

CLASSICAL_MODEL_NAMES = [
    "logistic_regression",
    "decision_tree",
    "random_forest",
    "knn",
    "xgboost",
]

SEQUENCE_MODEL_NAMES = [
    "rnn",
    "lstm",
]

HYBRID_MODEL_NAMES = [
    "lstm_rf",
    "lstm_xgb",
]

MODEL_LABELS = {
    "logistic_regression": "Logistic Regression",
    "decision_tree": "Decision Tree",
    "random_forest": "Random Forest",
    "knn": "KNN",
    "xgboost": "XGBoost",
    "rnn": "RNN",
    "lstm": "LSTM",
    "lstm_rf": "LSTM + Random Forest",
    "lstm_xgb": "LSTM + XGBoost",
}


def artifact_path(*parts: str) -> Path:
    return Path(settings.ml_artifacts_dir).resolve().joinpath(*parts)


def print_header(title: str) -> None:
    print()
    print("=" * 90)
    print(title)
    print("=" * 90)


def check_exists(path: Path, label: str) -> bool:
    if path.exists():
        print(f"[OK]     {label}: {path}")
        return True

    print(f"[LIPSĂ]  {label}: {path}")
    return False


def check_joblib(path: Path, label: str) -> bool:
    if not check_exists(path, label):
        return False

    try:
        joblib.load(path)
        print(f"[OK]     {label} se poate încărca")
        return True
    except Exception as exc:
        print(f"[EROARE] {label} există, dar nu se poate încărca: {exc}")
        return False


def check_json(path: Path, label: str) -> bool:
    if not check_exists(path, label):
        return False

    try:
        with open(path, encoding="utf-8") as file:
            json.load(file)

        print(f"[OK]     {label} este JSON valid")
        return True
    except Exception as exc:
        print(f"[EROARE] {label} există, dar JSON-ul nu este valid: {exc}")
        return False


def check_keras_model(path: Path, label: str, compile_model: bool = False) -> bool:
    if not check_exists(path, label):
        return False

    try:
        tf.keras.models.load_model(path, compile=compile_model)
        print(f"[OK]     {label} se poate încărca")
        return True
    except Exception as exc:
        print(f"[EROARE] {label} există, dar nu se poate încărca: {exc}")
        return False


def check_classical_model(task: str, model_name: str) -> bool:
    model_path = artifact_path("models", f"{task}_{model_name}.pkl")
    preprocess_path = artifact_path("scalers", f"{task}_{model_name}_preprocess.pkl")

    ok_model = check_joblib(
        model_path,
        f"{task}/{model_name} model clasic",
    )
    ok_preprocess = check_joblib(
        preprocess_path,
        f"{task}/{model_name} preprocess",
    )

    return ok_model and ok_preprocess


def check_lstm_model(task: str) -> bool:
    model_path = artifact_path("models", f"{task}_lstm_final.keras")
    scaler_path = artifact_path("scalers", f"{task}_scaler_final.pkl")
    config_path = artifact_path("configs", f"{task}_config_hibrid.json")

    ok_model = check_keras_model(
        model_path,
        f"{task}/lstm model",
        compile_model=False,
    )
    ok_scaler = check_joblib(
        scaler_path,
        f"{task}/lstm scaler",
    )
    ok_config = check_json(
        config_path,
        f"{task}/lstm config",
    )

    return ok_model and ok_scaler and ok_config


def check_rnn_model(task: str) -> bool:
    model_path = artifact_path("models", f"{task}_rnn_final.keras")
    scaler_path = artifact_path("scalers", f"{task}_scaler_final.pkl")
    config_path = artifact_path("configs", f"{task}_rnn_config.json")

    ok_model = check_keras_model(
        model_path,
        f"{task}/rnn model",
        compile_model=True,
    )
    ok_scaler = check_joblib(
        scaler_path,
        f"{task}/rnn scaler",
    )
    ok_config = check_json(
        config_path,
        f"{task}/rnn config",
    )

    return ok_model and ok_scaler and ok_config


def check_hybrid_model(task: str, model_name: str) -> bool:
    extractor_path = artifact_path("models", f"{task}_lstm_hybrid_extractor.keras")
    classifier_path = artifact_path("models", f"{task}_{model_name}_classifier.pkl")
    scaler_path = artifact_path("scalers", f"{task}_hybrid_scaler.pkl")
    config_path = artifact_path("configs", f"{task}_{model_name}_config.json")

    ok_extractor = check_keras_model(
        extractor_path,
        f"{task}/{model_name} extractor hibrid",
        compile_model=True,
    )
    ok_classifier = check_joblib(
        classifier_path,
        f"{task}/{model_name} classifier hibrid",
    )
    ok_scaler = check_joblib(
        scaler_path,
        f"{task}/{model_name} scaler hibrid",
    )
    ok_config = check_json(
        config_path,
        f"{task}/{model_name} config hibrid",
    )

    return ok_extractor and ok_classifier and ok_scaler and ok_config


def check_threshold_file_if_needed(task: str, model_name: str) -> bool:
    """
    În backend, fișierul de threshold este obligatoriu doar dacă vrei prag specific
    pentru RNN/LSTM/hibrid. Dacă lipsește, backend-ul folosește fallback și nu crapă.
    De aceea aici îl marchez doar ca warning, nu ca eroare.
    """
    if model_name not in {"rnn", "lstm", "lstm_rf", "lstm_xgb"}:
        return True

    threshold_path = artifact_path("thresholds", f"{task}_{model_name}_threshold.json")

    if not threshold_path.exists():
        print(
            f"[WARN]   {task}/{model_name} threshold lipsește, "
            f"dar backend-ul folosește fallback: {threshold_path}"
        )
        return True

    return check_json(threshold_path, f"{task}/{model_name} threshold")


def check_model(task: str, model_name: str) -> bool:
    print()
    print(f"-- {task} / {MODEL_LABELS.get(model_name, model_name)}")

    if model_name in CLASSICAL_MODEL_NAMES:
        ok = check_classical_model(task, model_name)
    elif model_name == "lstm":
        ok = check_lstm_model(task)
    elif model_name == "rnn":
        ok = check_rnn_model(task)
    elif model_name in HYBRID_MODEL_NAMES:
        ok = check_hybrid_model(task, model_name)
    else:
        print(f"[EROARE] Model necunoscut: {model_name}")
        ok = False

    ok_threshold = check_threshold_file_if_needed(task, model_name)

    return ok and ok_threshold


def main() -> int:
    print_header("Verificare artifacte ML VitalStudy")
    print(f"ML_ARTIFACTS_DIR: {Path(settings.ml_artifacts_dir).resolve()}")

    total = 0
    valid = 0
    invalid = 0

    for task in TASKS:
        print_header(f"Parametru: {task}")

        for model_name in (
            CLASSICAL_MODEL_NAMES + SEQUENCE_MODEL_NAMES + HYBRID_MODEL_NAMES
        ):
            total += 1

            if check_model(task, model_name):
                valid += 1
            else:
                invalid += 1

    print_header("Rezumat")
    print(f"Combinații verificate: {total}")
    print(f"Combinații valide:     {valid}")
    print(f"Combinații cu probleme:{invalid}")

    if invalid > 0:
        print()
        print(
            "Există combinații pentru care lipsesc fișiere sau fișierele nu se pot încărca. "
            "Acele modele nu ar trebui afișate în frontend pentru parametrul respectiv "
            "sau trebuie adăugate artifactele lipsă."
        )
        return 1

    print()
    print("Toate combinațiile verificate au artifactele necesare.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())