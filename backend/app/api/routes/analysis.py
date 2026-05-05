from datetime import datetime, time, timezone
from math import ceil
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.deps import require_role
from app.core.database import get_db
from app.models.analysis import AnalysisModelType, AnalysisRun, AnalysisResult
from app.models.participant import (
    MeasurementContext,
    ParticipantSubmission,
    ParticipantSubmissionValue,
    StudyParticipant,
)
from app.models.study import StudyParameterKey
from app.models.user import User, UserRole
from app.schemas.analysis import (
    AnalysisAverageRiskByParameterItem,
    AnalysisObservedParameterSummary,
    AnalysisObservedRecordResponse,
    AnalysisObservedValuesResponse,
    AnalysisResultListResponse,
    AnalysisResultResponse,
    AnalysisResultSortBy,
    AnalysisRiskDistributionItem,
    AnalysisRunRequest,
    AnalysisRunResponse,
    AnalysisSummaryResponse,
    AnalysisTimelinePointResponse,
    SortOrder,
    AnalysisRunDetailResponse,
    AnalysisRunListItemResponse,
    AnalysisRunListResponse,
)
from app.services.ml_prediction_service import run_analysis_for_study
from app.services.participant_service import get_study_for_current_user


router = APIRouter(
    prefix="/studies/{study_id}/analysis",
    tags=["Analysis"],
)


def _parse_datetime(value: str | None, *, end_of_day: bool = False) -> datetime | None:
    if not value:
        return None

    try:
        if len(value) == 10:
            parsed_date = datetime.fromisoformat(value).date()
            parsed = datetime.combine(
                parsed_date,
                time.max if end_of_day else time.min,
            )
        else:
            parsed = datetime.fromisoformat(value)

        if parsed.tzinfo is None or parsed.utcoffset() is None:
            return parsed.replace(tzinfo=timezone.utc)

        return parsed.astimezone(timezone.utc)

    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Formatul datei nu este valid. Folosește format ISO, de exemplu 2026-05-01 sau 2026-05-01T00:00:00.",
        ) from exc


def _build_analysis_filters(
    study_id: int,
    participant_id: int | None = None,
    parameter_key: StudyParameterKey | None = None,
    risk_label: str | None = None,
    model_type: AnalysisModelType | None = None,
    created_start_date: datetime | None = None,
    created_end_date: datetime | None = None,
):
    filters = [AnalysisResult.study_id == study_id]

    if participant_id is not None:
        filters.append(AnalysisResult.participant_id == participant_id)

    if parameter_key is not None:
        filters.append(AnalysisResult.parameter_key == parameter_key)

    if risk_label is not None:
        filters.append(AnalysisResult.risk_label == risk_label)

    if model_type is not None:
        filters.append(AnalysisResult.model_type == model_type)

    if created_start_date is not None:
        filters.append(AnalysisResult.created_at >= created_start_date)

    if created_end_date is not None:
        filters.append(AnalysisResult.created_at <= created_end_date)

    return filters


@router.post("/run", response_model=AnalysisRunResponse)
def run_study_analysis(
    study_id: int,
    payload: AnalysisRunRequest,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER)),
    ],
):
    try:
        analysis_run, results = run_analysis_for_study(
            db=db,
            study_id=study_id,
            current_user=current_user,
            participant_id=payload.participant_id,
            scope=payload.scope,
            start_date=payload.start_date,
            end_date=payload.end_date,
            age_min=payload.age_min,
            age_max=payload.age_max,
            sex=payload.sex,
            participant_group=payload.participant_group,
            activity_level=payload.activity_level,
            condition_type=payload.condition_type,
            measurement_context=payload.measurement_context,
        )
    except LookupError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc

    result_ids = [item.id for item in results]

    refreshed_results = list(
        db.execute(
            select(AnalysisResult)
            .options(selectinload(AnalysisResult.participant))
            .where(AnalysisResult.id.in_(result_ids))
            .order_by(AnalysisResult.created_at.desc())
        )
        .scalars()
        .all()
    )

    refreshed_run = db.execute(
        select(AnalysisRun)
        .options(
            selectinload(AnalysisRun.results).selectinload(AnalysisResult.participant)
        )
        .where(AnalysisRun.id == analysis_run.id)
    ).scalar_one()

    return AnalysisRunResponse(
        message="Analiza a fost finalizată cu succes.",
        analysis_run=AnalysisRunDetailResponse.model_validate(refreshed_run),
        results=[AnalysisResultResponse.model_validate(item) for item in refreshed_results],
    )


@router.get("/runs", response_model=AnalysisRunListResponse)
def read_analysis_runs(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER)),
    ],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
):
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    filters = [AnalysisRun.study_id == study_id]

    total = db.execute(
        select(func.count()).select_from(AnalysisRun).where(*filters)
    ).scalar_one()

    stmt = (
        select(AnalysisRun)
        .where(*filters)
        .order_by(AnalysisRun.created_at.desc(), AnalysisRun.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(db.execute(stmt).scalars().all())
    total_pages = ceil(total / page_size) if total > 0 else 1

    return AnalysisRunListResponse(
        items=[AnalysisRunListItemResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/runs/{analysis_run_id}", response_model=AnalysisRunDetailResponse)
def read_analysis_run_detail(
    study_id: int,
    analysis_run_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER)),
    ],
):
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    analysis_run = db.execute(
        select(AnalysisRun)
        .options(
            selectinload(AnalysisRun.results).selectinload(AnalysisResult.participant)
        )
        .where(
            AnalysisRun.id == analysis_run_id,
            AnalysisRun.study_id == study_id,
        )
    ).scalar_one_or_none()

    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analiza rulată nu a fost găsită.",
        )

    return AnalysisRunDetailResponse.model_validate(analysis_run)


@router.get(
    "/runs/{analysis_run_id}/participants/{participant_id}/observed-values",
    response_model=AnalysisObservedValuesResponse,
    summary="Valorile observate pentru un participant într-o rulare de analiză",
)
def read_analysis_run_participant_observed_values(
    study_id: int,
    analysis_run_id: int,
    participant_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER)),
    ],
):
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    analysis_run = db.execute(
        select(AnalysisRun).where(
            AnalysisRun.id == analysis_run_id,
            AnalysisRun.study_id == study_id,
        )
    ).scalar_one_or_none()

    if analysis_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Analiza rulată nu a fost găsită.",
        )
    
    if analysis_run.analysis_start_date is None or analysis_run.analysis_end_date is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Această rulare de analiză nu are interval valid asociat.",
        )

    participant = db.execute(
        select(StudyParticipant).where(
            StudyParticipant.id == participant_id,
            StudyParticipant.study_id == study_id,
        )
    ).scalar_one_or_none()

    if participant is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participantul nu a fost găsit.",
        )

    has_result_in_run = db.execute(
        select(AnalysisResult.id).where(
            AnalysisResult.analysis_run_id == analysis_run_id,
            AnalysisResult.study_id == study_id,
            AnalysisResult.participant_id == participant_id,
        )
    ).first()

    if has_result_in_run is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Participantul nu are rezultate în această rulare de analiză.",
        )

    filters = [
        ParticipantSubmission.study_id == study_id,
        ParticipantSubmission.participant_id == participant_id,
        ParticipantSubmissionValue.measured_at >= analysis_run.analysis_start_date,
        ParticipantSubmissionValue.measured_at <= analysis_run.analysis_end_date,
    ]

    if analysis_run.filter_measurement_context:
        filters.append(
            ParticipantSubmission.session.has(
                measurement_context=MeasurementContext(analysis_run.filter_measurement_context)
            )
        )

    rows = list(
        db.execute(
            select(
                ParticipantSubmissionValue.measured_at,
                ParticipantSubmissionValue.parameter_key,
                ParticipantSubmissionValue.value,
            )
            .join(
                ParticipantSubmission,
                ParticipantSubmission.id == ParticipantSubmissionValue.submission_id,
            )
            .where(*filters)
            .order_by(ParticipantSubmissionValue.measured_at.asc())
        ).all()
    )

    records_map: dict[datetime, dict[str, object]] = {}
    summary_map: dict[StudyParameterKey, list[float]] = {}

    parameter_field_map = {
        StudyParameterKey.HEART_RATE: "heart_rate",
        StudyParameterKey.RESPIRATORY_RATE: "respiratory_rate",
        StudyParameterKey.SPO2: "spo2",
        StudyParameterKey.TEMPERATURE: "temperature",
    }

    for measured_at, parameter_key, value in rows:
        if measured_at not in records_map:
            records_map[measured_at] = {
                "measured_at": measured_at,
                "heart_rate": None,
                "respiratory_rate": None,
                "spo2": None,
                "temperature": None,
            }

        field_name = parameter_field_map.get(parameter_key)

        if field_name is not None:
            records_map[measured_at][field_name] = value

        if parameter_key not in summary_map:
            summary_map[parameter_key] = []

        summary_map[parameter_key].append(value)

    summaries = []

    for parameter_key, values in summary_map.items():
        summaries.append(
            AnalysisObservedParameterSummary(
                parameter_key=parameter_key,
                count=len(values),
                min_value=min(values) if values else None,
                max_value=max(values) if values else None,
                average_value=(sum(values) / len(values)) if values else None,
            )
        )

    records = [
        AnalysisObservedRecordResponse(**record)
        for _, record in sorted(records_map.items(), key=lambda item: item[0])
    ]

    return AnalysisObservedValuesResponse(
        analysis_run_id=analysis_run.id,
        study_id=study_id,
        participant_id=participant.id,
        participant_code=participant.participant_code,
        participant_full_name=participant.full_name,
        analysis_start_date=analysis_run.analysis_start_date,
        analysis_end_date=analysis_run.analysis_end_date,
        analysis_scope=analysis_run.analysis_scope,
        records_count=len(records),
        values_count=len(rows),
        summaries=summaries,
        records=records,
    )


@router.get("/results", response_model=AnalysisResultListResponse)
def read_analysis_results(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER)),
    ],
    page: int = Query(1, ge=1),
    page_size: int = Query(10, ge=1, le=100),
    participant_id: int | None = Query(None, ge=1),
    parameter_key: StudyParameterKey | None = Query(None),
    risk_label: str | None = Query(None, pattern="^(high_risk|low_risk)$"),
    model_type: AnalysisModelType | None = Query(None),
    created_start_date: str | None = Query(None),
    created_end_date: str | None = Query(None),
    sort_by: AnalysisResultSortBy = Query(AnalysisResultSortBy.CREATED_AT),
    sort_order: SortOrder = Query(SortOrder.DESC),
):
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    filters = _build_analysis_filters(
        study_id=study_id,
        participant_id=participant_id,
        parameter_key=parameter_key,
        risk_label=risk_label,
        model_type=model_type,
        created_start_date=_parse_datetime(created_start_date),
        created_end_date=_parse_datetime(created_end_date, end_of_day=True),
    )

    total = db.execute(
        select(func.count()).select_from(AnalysisResult).where(*filters)
    ).scalar_one()

    sort_columns = {
        AnalysisResultSortBy.CREATED_AT: AnalysisResult.created_at,
        AnalysisResultSortBy.RISK_PROBABILITY: AnalysisResult.risk_probability,
        AnalysisResultSortBy.RECORDS_USED: AnalysisResult.records_used,
    }

    sort_column = sort_columns[sort_by]

    if sort_order == SortOrder.ASC:
        order_clause = sort_column.asc()
    else:
        order_clause = sort_column.desc()

    stmt = (
        select(AnalysisResult)
        .options(selectinload(AnalysisResult.participant))
        .where(*filters)
        .order_by(order_clause, AnalysisResult.id.desc())
        .offset((page - 1) * page_size)
        .limit(page_size)
    )

    items = list(db.execute(stmt).scalars().all())
    total_pages = ceil(total / page_size) if total > 0 else 1

    return AnalysisResultListResponse(
        items=[AnalysisResultResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=total_pages,
    )


@router.get("/summary", response_model=AnalysisSummaryResponse)
def read_analysis_summary(
    study_id: int,
    db: Annotated[Session, Depends(get_db)],
    current_user: Annotated[
        User,
        Depends(require_role(UserRole.RESEARCHER)),
    ],
    participant_id: int | None = Query(None, ge=1),
    parameter_key: StudyParameterKey | None = Query(None),
    risk_label: str | None = Query(None, pattern="^(high_risk|low_risk)$"),
    model_type: AnalysisModelType | None = Query(None),
    created_start_date: str | None = Query(None),
    created_end_date: str | None = Query(None),
):
    study = get_study_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Studiul nu a fost găsit.",
        )

    filters = _build_analysis_filters(
        study_id=study_id,
        participant_id=participant_id,
        parameter_key=parameter_key,
        risk_label=risk_label,
        model_type=model_type,
        created_start_date=_parse_datetime(created_start_date),
        created_end_date=_parse_datetime(created_end_date, end_of_day=True),
    )

    results = list(
        db.execute(
            select(AnalysisResult)
            .where(*filters)
            .order_by(AnalysisResult.created_at.asc())
        )
        .scalars()
        .all()
    )

    total_results = len(results)
    high_risk_results = sum(1 for item in results if item.risk_label == "high_risk")
    low_risk_results = sum(1 for item in results if item.risk_label == "low_risk")
    participants_analyzed = len({item.participant_id for item in results})
    records_used = sum(item.records_used or 0 for item in results)

    parameter_groups: dict[StudyParameterKey, dict[str, float | int]] = {}

    for item in results:
        if item.parameter_key not in parameter_groups:
            parameter_groups[item.parameter_key] = {
                "total_probability": 0.0,
                "count": 0,
            }

        parameter_groups[item.parameter_key]["total_probability"] += item.risk_probability
        parameter_groups[item.parameter_key]["count"] += 1

    average_risk_by_parameter = []

    for current_parameter_key, values in parameter_groups.items():
        count = int(values["count"])
        total_probability = float(values["total_probability"])

        average_risk_by_parameter.append(
            AnalysisAverageRiskByParameterItem(
                parameter_key=current_parameter_key,
                average_risk_probability=total_probability / count if count else 0,
                results_count=count,
            )
        )

    risk_distribution = [
        AnalysisRiskDistributionItem(
            risk_label="high_risk",
            count=high_risk_results,
            percentage=round((high_risk_results / total_results) * 100, 2) if total_results else 0,
        ),
        AnalysisRiskDistributionItem(
            risk_label="low_risk",
            count=low_risk_results,
            percentage=round((low_risk_results / total_results) * 100, 2) if total_results else 0,
        ),
    ]

    timeline_map: dict[str, dict[str, int]] = {}

    for item in results:
        label = item.created_at.astimezone(timezone.utc).date().isoformat()

        if label not in timeline_map:
            timeline_map[label] = {
                "high_risk_count": 0,
                "low_risk_count": 0,
                "total_results": 0,
            }

        if item.risk_label == "high_risk":
            timeline_map[label]["high_risk_count"] += 1
        elif item.risk_label == "low_risk":
            timeline_map[label]["low_risk_count"] += 1

        timeline_map[label]["total_results"] += 1

    timeline = [
        AnalysisTimelinePointResponse(
            label=label,
            high_risk_count=values["high_risk_count"],
            low_risk_count=values["low_risk_count"],
            total_results=values["total_results"],
        )
        for label, values in sorted(timeline_map.items(), key=lambda item: item[0])
    ]

    return AnalysisSummaryResponse(
        total_results=total_results,
        participants_analyzed=participants_analyzed,
        high_risk_results=high_risk_results,
        low_risk_results=low_risk_results,
        records_used=records_used,
        average_risk_by_parameter=average_risk_by_parameter,
        risk_distribution=risk_distribution,
        timeline=timeline,
    )