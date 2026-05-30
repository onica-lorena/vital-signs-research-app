from collections import defaultdict
from datetime import datetime, timezone
from io import BytesIO
from pathlib import Path

from reportlab.graphics.charts.barcharts import HorizontalBarChart, VerticalBarChart
from reportlab.graphics.shapes import Drawing
from reportlab.lib import colors
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    KeepTogether,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.models.analysis import AnalysisRun, AnalysisResult
from app.models.participant import StudyParticipant
from app.models.user import User
from app.schemas.participant import ParticipantSummaryResponse, StudyDataSummaryResponse
from app.schemas.report import (
    AnalysisRunReportParticipantItem,
    AnalysisRunReportParticipantResultItem,
    AnalysisRunReportResponse,
    ReportAnalysisResultItem,
    StudyReportResponse,
)
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

RISK_LABELS = {
    "high_risk": "Risc ridicat",
    "low_risk": "Risc scăzut",
}

SCOPE_LABELS = {
    "last_24h": "Ultimele 24h",
    "last_48h": "Ultimele 48h",
    "last_7_days": "Ultimele 7 zile",
    "custom": "Interval personalizat",
}

SEX_LABELS = {
    "female": "Feminin",
    "male": "Masculin",
    "other": "Altul",
    "prefer_not_to_say": "Preferă să nu spună",
}

ACTIVITY_LEVEL_LABELS = {
    "sedentary": "Sedentar",
    "light": "Activitate ușoară",
    "moderate": "Activitate moderată",
    "active": "Activ",
    "athlete": "Sportiv",
    "unknown": "Necunoscut",
}

CONDITION_TYPE_LABELS = {
    "cardiovascular": "Cardiovasculară",
    "respiratory": "Respiratorie",
    "metabolic": "Metabolică",
    "neurological": "Neurologică",
    "endocrine": "Endocrină",
    "other": "Altă afecțiune",
    "none_declared": "Nicio afecțiune declarată",
    "prefer_not_to_say": "Preferă să nu spună",
}

MEASUREMENT_CONTEXT_LABELS = {
    "rest": "Repaus",
    "during_effort": "În timpul efortului",
    "after_effort": "După efort",
    "after_meal": "După masă",
    "stress": "Stres / emoții",
    "sleep": "Somn / odihnă",
    "unknown": "Necunoscut",
}

PARAMETER_COLORS = {
    "heartRate": HexColor("#cf6b64"),
    "respiratoryRate": HexColor("#6f9fc7"),
    "spo2": HexColor("#5fae9b"),
    "temperature": HexColor("#ef9647"),
}

REPORT_GREEN = HexColor("#76b65c")
REPORT_DARK = HexColor("#12383d")
REPORT_SOFT_TEXT = HexColor("#66767b")
REPORT_BORDER = HexColor("#e2e9e2")
REPORT_BG = HexColor("#f6f8f5")
REPORT_RED = HexColor("#cf6b64")
REPORT_ORANGE = HexColor("#ef9647")
REPORT_BLUE = HexColor("#6f9fc7")

def _format_datetime(value: datetime | None) -> str:
    if value is None:
        return "—"

    return value.astimezone(timezone.utc).strftime("%d.%m.%Y %H:%M")


def _format_date(value: datetime | None) -> str:
    if value is None:
        return "—"

    return value.astimezone(timezone.utc).strftime("%d.%m.%Y")


def _format_probability(value: float | None) -> str:
    if value is None:
        return "—"

    return f"{value * 100:.1f}%"


def _format_interval(start_date: datetime | None, end_date: datetime | None, scope: str) -> str:
    if start_date and end_date:
        return f"{_format_date(start_date)} - {_format_date(end_date)}"

    return SCOPE_LABELS.get(scope, scope)


def _risk_text(value: str) -> str:
    return RISK_LABELS.get(value, value)


def _parameter_text(value) -> str:
    raw_value = value.value if hasattr(value, "value") else str(value)
    return PARAMETER_LABELS.get(raw_value, raw_value)


def _model_text(value) -> str:
    raw_value = value.value if hasattr(value, "value") else str(value)
    return MODEL_LABELS.get(raw_value, raw_value)


def _label_text(value, labels: dict[str, str]) -> str:
    if value is None:
        return "—"

    raw_value = value.value if hasattr(value, "value") else str(value)

    return labels.get(raw_value, raw_value)


def _build_criteria_labels(report: AnalysisRunReportResponse) -> list[str]:
    labels = []

    if report.filter_activity_level:
        labels.append(
            f"Nivel activitate: {_label_text(report.filter_activity_level, ACTIVITY_LEVEL_LABELS)}"
        )

    if report.filter_measurement_context:
        labels.append(
            f"Context măsurare: {_label_text(report.filter_measurement_context, MEASUREMENT_CONTEXT_LABELS)}"
        )

    if report.filter_sex:
        labels.append(
            f"Sex: {_label_text(report.filter_sex, SEX_LABELS)}"
        )

    if report.filter_age_min is not None and report.filter_age_max is not None:
        labels.append(f"Vârstă: {report.filter_age_min}-{report.filter_age_max} ani")
    elif report.filter_age_min is not None:
        labels.append(f"Vârstă minimă: {report.filter_age_min} ani")
    elif report.filter_age_max is not None:
        labels.append(f"Vârstă maximă: {report.filter_age_max} ani")

    if report.filter_participant_group:
        labels.append(f"Grup: {report.filter_participant_group}")

    if report.filter_condition_type:
        labels.append(
            f"Afecțiune: {_label_text(report.filter_condition_type, CONDITION_TYPE_LABELS)}"
        )

    return labels or ["Toată cohorta"]


def build_analysis_run_report_conclusions(
    analysis_run: AnalysisRun,
    participants: list[AnalysisRunReportParticipantItem],
    average_risk_by_parameter: list[dict],
) -> list[str]:
    conclusions = []

    conclusions.append(
        f"Analiza a inclus {analysis_run.participants_analyzed} participanți și a generat {analysis_run.total_results} rezultate predictive pe parametrii configurați."
    )

    if analysis_run.high_risk_results > 0:
        conclusions.append(
            f"Au fost identificate {analysis_run.high_risk_results} rezultate cu risc ridicat, care necesită interpretare atentă în contextul datelor colectate."
        )
    else:
        conclusions.append(
            "Nu au fost identificate rezultate cu risc ridicat în această rulare de analiză."
        )

    if average_risk_by_parameter:
        top_parameter = average_risk_by_parameter[0]

        conclusions.append(
            f"Parametrul cu cea mai mare probabilitate medie de risc este {top_parameter['label']}, cu o valoare medie de {_format_probability(top_parameter['average_risk_probability'])}."
        )

    if participants:
        top_participant = participants[0]

        conclusions.append(
            f"Participantul cu cel mai mare risc maxim este {top_participant.participant_code}, cu o probabilitate maximă de {_format_probability(top_participant.highest_risk_probability)}."
        )

    conclusions.append(
        "Rezultatele generate de modelele ML sunt orientative și trebuie corelate cu observațiile clinice, contextul măsurării și calitatea datelor introduse."
    )

    return conclusions


def _make_kpi_table(items: list[tuple[str, str, str, colors.Color]]) -> Table:
    row = []

    for title, value, subtitle, accent_color in items:
        cell = Table(
            [
                [Paragraph(title, _pdf_styles()["KpiTitle"])],
                [Paragraph(value, _pdf_styles()["KpiValue"])],
                [Paragraph(subtitle, _pdf_styles()["KpiSubtitle"])],
            ],
            colWidths=[4.15 * cm],
        )

        cell.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                    ("BOX", (0, 0), (-1, -1), 0.8, REPORT_BORDER),
                    ("LEFTPADDING", (0, 0), (-1, -1), 10),
                    ("RIGHTPADDING", (0, 0), (-1, -1), 10),
                    ("TOPPADDING", (0, 0), (-1, -1), 8),
                    ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
                    ("LINEBEFORE", (0, 0), (0, -1), 3, accent_color),
                ]
            )
        )

        row.append(cell)

    table = Table([row], colWidths=[4.25 * cm] * len(items))
    table.setStyle(
        TableStyle(
            [
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 3),
                ("RIGHTPADDING", (0, 0), (-1, -1), 3),
                ("TOPPADDING", (0, 0), (-1, -1), 3),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 3),
            ]
        )
    )

    return table


def _pdf_styles():
    styles = getSampleStyleSheet()

    for style in styles.byName.values():
        style.fontName = PDF_FONT_NAME

    styles.add(
        ParagraphStyle(
            name="ReportTitle",
            parent=styles["Title"],
            fontName=PDF_FONT_NAME,
            fontSize=22,
            leading=26,
            textColor=REPORT_DARK,
            alignment=TA_LEFT,
            spaceAfter=8,
        )
    )

    styles.add(
        ParagraphStyle(
            name="ReportSubtitle",
            parent=styles["Normal"],
            fontName=PDF_FONT_NAME,
            fontSize=9,
            leading=13,
            textColor=REPORT_SOFT_TEXT,
            spaceAfter=12,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SectionTitle",
            parent=styles["Heading2"],
            fontName=PDF_FONT_NAME,
            fontSize=13,
            leading=16,
            textColor=REPORT_DARK,
            spaceBefore=10,
            spaceAfter=8,
        )
    )

    styles.add(
        ParagraphStyle(
            name="SmallText",
            parent=styles["Normal"],
            fontName=PDF_FONT_NAME,
            fontSize=8,
            leading=11,
            textColor=REPORT_SOFT_TEXT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="KpiTitle",
            parent=styles["Normal"],
            fontName=PDF_FONT_NAME,
            fontSize=7.5,
            leading=10,
            textColor=REPORT_SOFT_TEXT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="KpiValue",
            parent=styles["Normal"],
            fontName=PDF_FONT_NAME,
            fontSize=17,
            leading=20,
            textColor=REPORT_DARK,
            spaceBefore=3,
            spaceAfter=3,
        )
    )

    styles.add(
        ParagraphStyle(
            name="KpiSubtitle",
            parent=styles["Normal"],
            fontName=PDF_FONT_NAME,
            fontSize=7,
            leading=9,
            textColor=REPORT_SOFT_TEXT,
        )
    )

    styles.add(
        ParagraphStyle(
            name="CenteredSmall",
            parent=styles["Normal"],
            fontName=PDF_FONT_NAME,
            fontSize=8,
            leading=10,
            textColor=REPORT_SOFT_TEXT,
            alignment=TA_CENTER,
        )
    )

    return styles


def _build_parameter_risk_chart(report: AnalysisRunReportResponse) -> Drawing:
    drawing = Drawing(460, 210)

    chart = VerticalBarChart()
    chart.x = 45
    chart.y = 35
    chart.height = 130
    chart.width = 370

    values = [
        round(item["average_risk_probability"] * 100, 1)
        for item in report.average_risk_by_parameter
    ]

    labels = [
        item["label"]
        for item in report.average_risk_by_parameter
    ]

    if not values:
        values = [0]
        labels = ["Fără date"]

    chart.data = [values]
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(100, max(values))
    chart.valueAxis.valueStep = 20
    chart.categoryAxis.categoryNames = labels
    chart.categoryAxis.labels.angle = 0
    chart.categoryAxis.labels.fontName = PDF_FONT_NAME
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.labels.fontName = PDF_FONT_NAME
    chart.valueAxis.labels.fontSize = 7

    chart.bars[0].fillColor = REPORT_GREEN
    chart.bars[0].strokeColor = None

    drawing.add(chart)

    return drawing


def _build_top_participants_chart(report: AnalysisRunReportResponse) -> Drawing:
    drawing = Drawing(460, 220)

    top_participants = report.participants[:5]

    values = [
        round(item.highest_risk_probability * 100, 1)
        for item in top_participants
    ]

    labels = [
        item.participant_code
        for item in top_participants
    ]

    if not values:
        values = [0]
        labels = ["Fără date"]

    chart = HorizontalBarChart()
    chart.x = 90
    chart.y = 35
    chart.height = 140
    chart.width = 320

    chart.data = [values]
    chart.valueAxis.valueMin = 0
    chart.valueAxis.valueMax = max(100, max(values))
    chart.valueAxis.valueStep = 20
    chart.categoryAxis.categoryNames = labels

    chart.categoryAxis.labels.fontName = PDF_FONT_NAME
    chart.categoryAxis.labels.fontSize = 7
    chart.valueAxis.labels.fontName = PDF_FONT_NAME
    chart.valueAxis.labels.fontSize = 7

    chart.bars[0].fillColor = REPORT_RED
    chart.bars[0].strokeColor = None

    drawing.add(chart)

    return drawing


def build_analysis_run_report_pdf(report: AnalysisRunReportResponse) -> bytes:
    buffer = BytesIO()

    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=34,
        leftMargin=34,
        topMargin=34,
        bottomMargin=34,
    )

    styles = _pdf_styles()
    story = []

    story.append(Paragraph("Raport analiză predictivă", styles["ReportTitle"]))
    story.append(
        Paragraph(
            f"VitalStudy · {report.study.title} · cod studiu {report.study.code}",
            styles["ReportSubtitle"],
        )
    )

    status_text = "Necesită atenție" if report.high_risk_results > 0 else "Stabilă"
    interval_text = _format_interval(
        report.analysis_start_date,
        report.analysis_end_date,
        report.analysis_scope,
    )

    header_table = Table(
        [
            ["Data rulării", _format_datetime(report.created_at)],
            ["Interval analizat", interval_text],
            ["Tip interval", SCOPE_LABELS.get(report.analysis_scope, report.analysis_scope)],
            ["Status general", status_text],
            ["Generat la", _format_datetime(report.generated_at)],
        ],
        colWidths=[4.2 * cm, 12.5 * cm],
    )

    header_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), colors.white),
                ("BOX", (0, 0), (-1, -1), 0.8, REPORT_BORDER),
                ("INNERGRID", (0, 0), (-1, -1), 0.4, HexColor("#edf1ed")),
                ("FONTNAME", (0, 0), (-1, -1), PDF_FONT_NAME),
                ("TEXTCOLOR", (0, 0), (0, -1), REPORT_SOFT_TEXT),
                ("TEXTCOLOR", (1, 0), (1, -1), REPORT_DARK),
                ("FONTSIZE", (0, 0), (-1, -1), 8),
                ("LEFTPADDING", (0, 0), (-1, -1), 9),
                ("RIGHTPADDING", (0, 0), (-1, -1), 9),
                ("TOPPADDING", (0, 0), (-1, -1), 7),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 7),
            ]
        )
    )

    story.append(header_table)
    story.append(Spacer(1, 12))

    story.append(
        _make_kpi_table(
            [
                (
                    "Participanți",
                    str(report.participants_count),
                    "incluși în analiză",
                    REPORT_BLUE,
                ),
                (
                    "Rezultate generate",
                    str(report.total_results),
                    "pe parametrii evaluați",
                    REPORT_GREEN,
                ),
                (
                    "Rezultate cu risc",
                    str(report.high_risk_results),
                    "necesită interpretare",
                    REPORT_RED,
                ),
                (
                    "Înregistrări folosite",
                    str(report.records_used),
                    "date procesate",
                    REPORT_ORANGE,
                ),
            ]
        )
    )

    story.append(Spacer(1, 12))

    story.append(Paragraph("Criterii selectate", styles["SectionTitle"]))

    criteria_rows = [
        [Paragraph(item, styles["SmallText"])]
        for item in _build_criteria_labels(report)
    ]

    criteria_table = Table(
        criteria_rows,
        colWidths=[16.7 * cm],
    )
    criteria_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), HexColor("#f8fbf7")),
                ("BOX", (0, 0), (-1, -1), 0.8, REPORT_BORDER),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 6),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
            ]
        )
    )

    story.append(criteria_table)
    story.append(Spacer(1, 10))

    story.append(Paragraph("Risc mediu pe parametri", styles["SectionTitle"]))
    story.append(_build_parameter_risk_chart(report))
    story.append(Spacer(1, 8))

    story.append(Paragraph("Top participanți după risc maxim", styles["SectionTitle"]))
    story.append(_build_top_participants_chart(report))
    story.append(Spacer(1, 10))

    story.append(Paragraph("Rezultate pe parametri", styles["SectionTitle"]))

    result_rows = [
        [
            "Participant",
            "Parametru",
            "Model",
            "Probabilitate",
            "Risc",
            "Înregistrări",
        ]
    ]

    for participant in report.participants:
        for result in participant.results:
            result_rows.append(
                [
                    participant.participant_code,
                    _parameter_text(result.parameter_key),
                    _model_text(result.model_type),
                    _format_probability(result.risk_probability),
                    _risk_text(result.risk_label),
                    str(result.records_used),
                ]
            )

    if len(result_rows) == 1:
        result_rows.append(["—", "—", "—", "—", "—", "—"])

    result_table = Table(
        result_rows,
        colWidths=[2.2 * cm, 3.4 * cm, 2.7 * cm, 2.6 * cm, 2.5 * cm, 2.4 * cm],
        repeatRows=1,
    )

    result_table.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, 0), HexColor("#f0f5ef")),
                ("TEXTCOLOR", (0, 0), (-1, 0), REPORT_DARK),
                ("FONTNAME", (0, 0), (-1, -1), PDF_FONT_NAME),
                ("FONTSIZE", (0, 0), (-1, -1), 7.4),
                ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#e3ebe3")),
                ("LEFTPADDING", (0, 0), (-1, -1), 5),
                ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                ("ALIGN", (3, 1), (-1, -1), "CENTER"),
            ]
        )
    )

    story.append(result_table)
    story.append(Spacer(1, 12))

    story.append(Paragraph("Concluzii", styles["SectionTitle"]))

    for conclusion in report.conclusions:
        story.append(Paragraph(f"• {conclusion}", styles["SmallText"]))
        story.append(Spacer(1, 4))

    if report.participants:
        story.append(PageBreak())
        story.append(Paragraph("Detalii participanți", styles["ReportTitle"]))
        story.append(
            Paragraph(
                "Rezultatele sunt grupate pe participant, similar cu detaliile afișate în interfața aplicației.",
                styles["ReportSubtitle"],
            )
        )

        for participant in report.participants:
            participant_block = []

            participant_block.append(
                Paragraph(
                    f"{participant.participant_code} · {participant.participant_full_name}",
                    styles["SectionTitle"],
                )
            )

            participant_block.append(
                _make_kpi_table(
                    [
                        (
                            "Risc maxim",
                            _format_probability(participant.highest_risk_probability),
                            "cea mai mare probabilitate",
                            REPORT_RED if participant.high_risk_count else REPORT_GREEN,
                        ),
                        (
                            "Parametri cu risc",
                            str(participant.high_risk_count),
                            "rezultate high_risk",
                            REPORT_RED,
                        ),
                        (
                            "Parametri stabili",
                            str(participant.low_risk_count),
                            "rezultate low_risk",
                            REPORT_GREEN,
                        ),
                        (
                            "Înregistrări",
                            str(participant.records_used),
                            "folosite în predicție",
                            REPORT_ORANGE,
                        ),
                    ]
                )
            )

            participant_block.append(Spacer(1, 8))

            participant_rows = [["Parametru", "Model", "Probabilitate", "Risc", "Înregistrări"]]

            for result in participant.results:
                participant_rows.append(
                    [
                        _parameter_text(result.parameter_key),
                        _model_text(result.model_type),
                        _format_probability(result.risk_probability),
                        _risk_text(result.risk_label),
                        str(result.records_used),
                    ]
                )

            participant_table = Table(
                participant_rows,
                colWidths=[4 * cm, 3.2 * cm, 3 * cm, 3 * cm, 2.7 * cm],
                repeatRows=1,
            )

            participant_table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), HexColor("#f0f5ef")),
                        ("FONTNAME", (0, 0), (-1, -1), PDF_FONT_NAME),
                        ("FONTSIZE", (0, 0), (-1, -1), 7.5),
                        ("GRID", (0, 0), (-1, -1), 0.35, HexColor("#e3ebe3")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 0), (-1, -1), 5),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
                    ]
                )
            )

            participant_block.append(participant_table)
            participant_block.append(Spacer(1, 12))

            story.append(KeepTogether(participant_block))

    doc.build(story)

    pdf = buffer.getvalue()
    buffer.close()

    return pdf


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
            analysis_run_id=result.analysis_run_id,
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


def build_analysis_run_report(
    db: Session,
    study_id: int,
    analysis_run_id: int,
    current_user: User,
) -> AnalysisRunReportResponse:
    study = get_study_by_id_for_current_user(
        db=db,
        study_id=study_id,
        current_user=current_user,
    )

    if study is None:
        raise LookupError("Studiul nu a fost găsit.")

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
        raise LookupError("Analiza rulată nu a fost găsită.")

    results = sorted(
        analysis_run.results,
        key=lambda item: item.risk_probability,
        reverse=True,
    )

    parameter_groups: dict[str, dict[str, float | int]] = {}

    for result in results:
        parameter_key = result.parameter_key.value

        if parameter_key not in parameter_groups:
            parameter_groups[parameter_key] = {
                "total_probability": 0.0,
                "count": 0,
                "high_risk_count": 0,
            }

        parameter_groups[parameter_key]["total_probability"] += result.risk_probability
        parameter_groups[parameter_key]["count"] += 1

        if result.risk_label == "high_risk":
            parameter_groups[parameter_key]["high_risk_count"] += 1

    average_risk_by_parameter = []

    for parameter_key, values in parameter_groups.items():
        count = int(values["count"])
        total_probability = float(values["total_probability"])
        high_risk_count = int(values["high_risk_count"])

        average_risk_by_parameter.append(
            {
                "parameter_key": parameter_key,
                "label": PARAMETER_LABELS.get(parameter_key, parameter_key),
                "average_risk_probability": total_probability / count if count else 0,
                "results_count": count,
                "high_risk_count": high_risk_count,
            }
        )

    average_risk_by_parameter.sort(
        key=lambda item: item["average_risk_probability"],
        reverse=True,
    )

    participant_map: dict[int, list[AnalysisResult]] = defaultdict(list)

    for result in results:
        participant_map[result.participant_id].append(result)

    participant_items: list[AnalysisRunReportParticipantItem] = []

    for participant_id, participant_results in participant_map.items():
        participant_results = sorted(
            participant_results,
            key=lambda item: item.risk_probability,
            reverse=True,
        )

        first_result = participant_results[0]
        participant = first_result.participant

        if participant is None:
            participant_code = f"P-{participant_id}"
            participant_name = "Participant necunoscut"
        else:
            participant_code = participant.participant_code
            participant_name = participant.full_name

        result_items = [
            AnalysisRunReportParticipantResultItem(
                id=result.id,
                participant_id=result.participant_id,
                participant_code=participant_code,
                participant_full_name=participant_name,
                parameter_key=result.parameter_key,
                model_type=result.model_type,
                model_name=result.model_name,
                risk_probability=result.risk_probability,
                risk_label=result.risk_label,
                records_used=result.records_used,
                window_size=result.window_size,
            )
            for result in participant_results
        ]

        participant_items.append(
            AnalysisRunReportParticipantItem(
                participant_id=participant_id,
                participant_code=participant_code,
                participant_full_name=participant_name,
                highest_risk_probability=participant_results[0].risk_probability,
                high_risk_count=sum(1 for item in participant_results if item.risk_label == "high_risk"),
                low_risk_count=sum(1 for item in participant_results if item.risk_label == "low_risk"),
                records_used=max(item.records_used for item in participant_results),
                results=result_items,
            )
        )

    participant_items.sort(
        key=lambda item: item.highest_risk_probability,
        reverse=True,
    )

    conclusions = build_analysis_run_report_conclusions(
        analysis_run=analysis_run,
        participants=participant_items,
        average_risk_by_parameter=average_risk_by_parameter,
    )

    return AnalysisRunReportResponse(
        generated_at=datetime.now(timezone.utc),
        study=StudyDetailResponse.model_validate(study),
        analysis_run_id=analysis_run.id,
        analysis_scope=analysis_run.analysis_scope,
        analysis_start_date=analysis_run.analysis_start_date,
        analysis_end_date=analysis_run.analysis_end_date,
        created_at=analysis_run.created_at,
        filter_age_min=analysis_run.filter_age_min,
        filter_age_max=analysis_run.filter_age_max,
        filter_sex=analysis_run.filter_sex,
        filter_participant_group=analysis_run.filter_participant_group,
        filter_activity_level=analysis_run.filter_activity_level,
        filter_condition_type=analysis_run.filter_condition_type,
        filter_measurement_context=analysis_run.filter_measurement_context,
        participants_count=analysis_run.participants_analyzed,
        total_results=analysis_run.total_results,
        high_risk_results=analysis_run.high_risk_results,
        low_risk_results=analysis_run.low_risk_results,
        records_used=analysis_run.records_used,
        max_risk_probability=analysis_run.max_risk_probability,
        max_risk_parameter_key=analysis_run.max_risk_parameter_key,
        average_risk_by_parameter=average_risk_by_parameter,
        participants=participant_items,
        conclusions=conclusions,
    )


def build_report_conclusions(
    participants_summary: dict,
    data_summary: dict,
    analysis_results: list[ReportAnalysisResultItem],
) -> list[str]:
    conclusions = []

    total_participants = participants_summary.get("total_participants", 0)
    total_sessions = data_summary.get("total_sessions", data_summary.get("total_submissions", 0))
    total_records = data_summary.get("total_records", 0)
    total_values = data_summary.get("total_values", 0)

    conclusions.append(
        f"Studiul include {total_participants} participanți, {total_sessions} sesiuni de trimitere, {total_records} înregistrări și {total_values} valori fiziologice colectate."
    )

    high_risk_results = [
        result for result in analysis_results if result.risk_label == "high_risk"
    ]

    if high_risk_results:
        conclusions.append(
            f"Pe baza celor mai recente rezultate predictive disponibile, au fost identificate {len(high_risk_results)} rezultate cu risc ridicat."
        )
    else:
        conclusions.append(
            "Cele mai recente rezultate predictive disponibile indică un nivel scăzut de risc pentru datele evaluate."
        )

    if not analysis_results:
        conclusions.append(
            "Nu există încă rezultate de analiză predictivă pentru acest studiu."
        )

    return conclusions

WINDOWS_FONT_PATH = Path("C:/Windows/Fonts/arial.ttf")
PDF_FONT_NAME = "Helvetica"

if WINDOWS_FONT_PATH.exists():
    pdfmetrics.registerFont(TTFont("AppFont", str(WINDOWS_FONT_PATH)))
    PDF_FONT_NAME = "AppFont"

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
        style.fontName = PDF_FONT_NAME

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
        ("FONTNAME", (0, 0), (-1, -1), PDF_FONT_NAME),
        ("BACKGROUND", (0, 0), (-1, 0), colors.lightgrey),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
        ("ALIGN", (0, 0), (-1, -1), "CENTER"),
    ]))

    story.append(participants_table)
    story.append(Spacer(1, 16))

    story.append(Paragraph("Rezumat date colectate", styles["Heading2"]))

    data_table = Table([
        ["Sesiuni", "Înregistrări", "Valori", "În așteptare", "Validate", "Respinse", "Parțiale"],
        [
            report.data_summary.total_sessions,
            report.data_summary.total_records,
            report.data_summary.total_values,
            report.data_summary.submitted_count,
            report.data_summary.validated_count,
            report.data_summary.rejected_count,
            report.data_summary.partial_count,
        ],
    ])

    data_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), PDF_FONT_NAME),
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
            _parameter_text(item.parameter_key),
            _model_text(item.model_type),
            _format_probability(item.risk_probability),
            _risk_text(item.risk_label),
            interval_text,
        ])

    if len(analysis_rows) == 1:
        analysis_rows.append(["-", "-", "-", "-", "-", "Nu există rezultate."])

    analysis_table = Table(analysis_rows)

    analysis_table.setStyle(TableStyle([
        ("FONTNAME", (0, 0), (-1, -1), PDF_FONT_NAME),
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