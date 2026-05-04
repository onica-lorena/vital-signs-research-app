import pandas as pd


VALID_RANGES = {
    "heart_rate": (30, 220),
    "resp_rate": (5, 80),
    "spo2": (50, 100),
    "temperature": (30, 43),
}

PARAMETER_COLUMN_MAP = {
    "heartRate": "heart_rate",
    "respiratoryRate": "resp_rate",
    "spo2": "spo2",
    "temperature": "temperature",
}

REQUIRED_FEATURE_COLUMNS = [
    "heart_rate",
    "resp_rate",
    "spo2",
    "temperature",
    "hr_mean_3h",
    "hr_std_3h",
    "hr_mean_5h",
    "hr_std_5h",
    "rr_mean_3h",
    "rr_std_3h",
    "rr_mean_5h",
    "rr_std_5h",
    "spo2_mean_3h",
    "spo2_std_3h",
    "spo2_mean_5h",
    "spo2_std_5h",
    "temp_mean_3h",
    "temp_std_3h",
    "temp_mean_5h",
    "temp_std_5h",
]


def build_hourly_vitals_dataframe(
    submissions,
    start_date=None,
    end_date=None,
) -> pd.DataFrame:
    rows = []

    for submission in submissions:
        for value in submission.values:
            if start_date is not None and value.measured_at < start_date:
                continue

            if end_date is not None and value.measured_at > end_date:
                continue

            rows.append(
                {
                    "submission_id": submission.id,
                    "participant_id": submission.participant_id,
                    "hour_ts": value.measured_at.replace(
                        minute=0,
                        second=0,
                        microsecond=0,
                    ),
                    "measured_at": value.measured_at,
                    "parameter_key": value.parameter_key.value,
                    "value": value.value,
                }
            )

    if not rows:
        return pd.DataFrame()

    raw_df = pd.DataFrame(rows)
    raw_df["column_name"] = raw_df["parameter_key"].map(PARAMETER_COLUMN_MAP)
    raw_df = raw_df.dropna(subset=["column_name"])
    raw_df = raw_df.sort_values("measured_at")

    last_df = (
        raw_df.groupby(
            ["participant_id", "hour_ts", "column_name"],
            as_index=False,
        )
        .last()
    )

    wide_df = (
        last_df.pivot_table(
            index=["participant_id", "hour_ts"],
            columns="column_name",
            values="value",
            aggfunc="last",
        )
        .reset_index()
    )

    wide_df.columns.name = None

    required = ["heart_rate", "resp_rate", "spo2", "temperature"]

    for col in required:
        if col not in wide_df.columns:
            return pd.DataFrame()

    wide_df = wide_df.dropna(subset=required)

    return wide_df.sort_values("hour_ts").reset_index(drop=True)


def filter_valid_physiological_ranges(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    mask = pd.Series(True, index=df.index)

    for col, (low, high) in VALID_RANGES.items():
        mask &= df[col].between(low, high)

    return df.loc[mask].copy().reset_index(drop=True)


def add_rolling_features(df: pd.DataFrame) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.sort_values("hour_ts").copy()
    df = df.set_index("hour_ts")

    vital_map = {
        "heart_rate": "hr",
        "resp_rate": "rr",
        "spo2": "spo2",
        "temperature": "temp",
    }

    for source_col, prefix in vital_map.items():
        df[f"{prefix}_mean_3h"] = df[source_col].rolling("3h", min_periods=2).mean()
        df[f"{prefix}_std_3h"] = df[source_col].rolling("3h", min_periods=2).std()

        df[f"{prefix}_mean_5h"] = df[source_col].rolling("5h", min_periods=2).mean()
        df[f"{prefix}_std_5h"] = df[source_col].rolling("5h", min_periods=2).std()

    return df.reset_index()


def filter_task_prediction_rows(df: pd.DataFrame, task: str) -> pd.DataFrame:
    if df.empty:
        return df

    df = df.dropna(subset=REQUIRED_FEATURE_COLUMNS).copy()

    if task == "hr":
        df = df[df["heart_rate"].between(50, 130)]
    elif task == "rr":
        df = df[df["resp_rate"].between(8, 30)]
    elif task == "spo2":
        df = df[df["spo2"].between(90, 100)]
    elif task == "temp":
        df = df[df["temperature"].between(36.1, 37.5)]

    return df.reset_index(drop=True)

def build_prediction_features_from_submissions(
    submissions,
    task: str,
    start_date=None,
    end_date=None,
) -> pd.DataFrame:
    hourly_df = build_hourly_vitals_dataframe(
        submissions,
        start_date=start_date,
        end_date=end_date,
    )

    if hourly_df.empty:
        return pd.DataFrame()

    clean_df = filter_valid_physiological_ranges(hourly_df)
    features_df = add_rolling_features(clean_df)

    return features_df.reset_index(drop=True)