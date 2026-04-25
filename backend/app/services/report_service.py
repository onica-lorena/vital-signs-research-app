from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.analysis import AnalysisResult
from app.models.participant import StudyParticipant
from app.models.user import User
from app.schemas.participant import ParticipantSummaryResponse, StudyDataSummaryResponse
from app.schemas.report import ReportAnalysisResultItem, StudyReportResponse
from app.schemas.study import StudyDetailResponse
from app.services.participant_service import (
    get_participants_summary_for_study,
    get_study_data_summary,
)
from app.services.study_service import get_study_by_id_for_current_user


PARAMETER_LABELS = {
    "heartRate": "Ritm cardiac",
    "respiratoryRate": "Frecvență respiratorie",
    "spo2": "Saturația de oxigen",
    "temperature": "Temperatură corporală",
}


def build_study_report(
    db: Session,
    study_id: int,
    current_user: User,
) -> StudyReportResponse:
    study = get_study_by_id_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

    participants_summary = get_participants_summary_for_study(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    data_summary = get_study_data_summary(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    stmt = (
        select(AnalysisResult, StudyParticipant)
        .join(StudyParticipant, StudyParticipant.id == AnalysisResult.participant_id)
        .where(AnalysisResult.study_id == study_id)
        .order_by(AnalysisResult.created_at.desc())
    )

    rows = db.execute(stmt).all()

    latest_by_participant_and_parameter = {}

    for result, participant in rows:
        key = (result.participant_id, result.parameter_key)

        if key in latest_by_participant_and_parameter:
            continue

        latest_by_participant_and_parameter[key] = ReportAnalysisResultItem(
            id=result.id,
            participant_id=result.participant_id,
            participant_code=participant.participant_code,
            participant_full_name=participant.full_name,
            parameter_key=result.parameter_key,
            model_type=result.model_type,
            model_name=result.model_name,
            risk_probability=result.risk_probability,
            risk_label=result.risk_label,
            records_used=result.records_used,
            window_size=result.window_size,
            analysis_start_date=result.analysis_start_date,
            analysis_end_date=result.analysis_end_date,
            analysis_scope=result.analysis_scope,
            created_at=result.created_at,
        )

    analysis_results = list(latest_by_participant_and_parameter.values())

    conclusions = build_report_conclusions(
        participants_summary=participants_summary,
        data_summary=data_summary,
        analysis_results=analysis_results,
    )

    return StudyReportResponse(
        generated_at=datetime.now(timezone.utc),
        study=StudyDetailResponse.model_validate(study),
        participants_summary=ParticipantSummaryResponse(**participants_summary),
        data_summary=StudyDataSummaryResponse(**data_summary),
        analysis_results=analysis_results,
        conclusions=conclusions,
    )


def build_report_conclusions(
    participants_summary: dict,
    data_summary: dict,
    analysis_results: list[ReportAnalysisResultItem],
) -> list[str]:
    conclusions = []

    total_participants = participants_summary.get("total_participants", 0)
    total_submissions = data_summary.get("total_submissions", 0)

    conclusions.append(
        f"Studiul include {total_participants} participanți și {total_submissions} trimiteri de date fiziologice."
    )

    high_risk_results = [
        result for result in analysis_results if result.risk_label == "high_risk"
    ]

    if high_risk_results:
        conclusions.append(
            f"Au fost identificate {len(high_risk_results)} rezultate cu risc ridicat."
        )
    else:
        conclusions.append(
            "Rezultatele analizelor disponibile indică un nivel scăzut de risc pentru datele evaluate."
        )

    if not analysis_results:
        conclusions.append(
            "Nu există încă rezultate de analiză predictivă pentru acest studiu."
        )

    return conclusions

WINDOWS_FONT_PATH = Path("C:/Windows/Fonts/arial.ttf")

pdfmetrics.registerFont(TTFont("AppFont", str(WINDOWS_FONT_PATH)))

def build_report_pdf(report: StudyReportResponse) -> bytes:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=40,
        leftMargin=40,
        topMargin=40,
        bottomMargin=40,
    )

    styles = getSampleStyleSheet()

    for style in styles.byName.values():
        style.fontName = "AppFont"

    story = []

    story.append(Paragraph("Raport studiu VitalStudy", styles["Title"]))
    story.append(Spacer(1, 12))

    story.append(Paragraph(f"Titlu studiu: {report.study.title}", styles["Normal"]))
    story.append(Paragraph(f"Cod studiu: {report.study.code}", styles["Normal"]))
    story.append(Paragraph(f"Status: {report.study.status.value}", styles["Normal"]))
    story.append(Paragraph(f"Generat la: {report.generated_at.isoformat()}", styles["Normal"]))
    story.append(Spacer(1, 16))

    story.append(Paragraph("Rezumat participanți", styles["Heading2"]))

    participants_table = Table([
        ["Total", "Invitați", "Activi", "Suspendați", "Finalizați", "Retrăși"],
        [
            report.participants_summary.total_participants,
            report.participants_summary.invited_participants,
            report.participants_summary.active_participants,
            report.participants_summary.suspended_participants,
            report.participants_summary.completed_participants,
            report.participants_summary.withdrawn_participants,
        ],
    ])

    participants_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "AppFont"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))

    story.append(participants_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Rezumat date colectate", styles["Heading2"]))

    data_table = Table([
        ["Total trimiteri", "Total valori", "Trimise", "Validate", "Respinse"],
        [
            report.data_summary.total_submissions,
            report.data_summary.total_values,
            report.data_summary.submitted_count,
            report.data_summary.validated_count,
            report.data_summary.rejected_count,
        ],
    ])

    data_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "AppFont"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))

    story.append(data_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Rezultate analiză predictivă", styles["Heading2"]))

    analysis_rows = [["Participant", "Parametru", "Model", "Probabilitate", "Risc", "Interval"]]

    for item in report.analysis_results:
        interval_text = "-"

        if item.analysis_start_date and item.analysis_end_date:
            interval_text = (
                f"{item.analysis_start_date.date().isoformat()} - "
                f"{item.analysis_end_date.date().isoformat()}"
            )

        analysis_rows.append([
            item.participant_code,
            PARAMETER_LABELS.get(item.parameter_key.value, item.parameter_key.value),
            item.model_name,
            f"{item.risk_probability:.4f}",
            item.risk_label,
            interval_text,
        ])

    if len(analysis_rows) == 1:
        analysis_rows.append(["-", "-", "-", "-", "-", "Nu există rezultate."])

    analysis_table = Table(analysis_rows)

    analysis_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), "AppFont"),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))

    story.append(analysis_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Concluzii", styles["Heading2"]))

    for conclusion in report.conclusions:
        story.append(Paragraph(f"• {conclusion}", styles["Normal"]))

    doc.build(story)

    pdf = buffer.getvalue()
    buffer.close()

    return pdf