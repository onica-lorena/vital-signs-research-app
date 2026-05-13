import smtplib
from email.message import EmailMessage

from app.core.config import settings


def send_email(to_email: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = f"{settings.smtp_from_name} <{settings.smtp_from_email}>"
    message["To"] = to_email
    message.set_content(body)

    with smtplib.SMTP(settings.smtp_host, settings.smtp_port) as server:
        if settings.smtp_use_tls:
            server.starttls()

        server.login(settings.smtp_username, settings.smtp_password)
        server.send_message(message)


def send_password_reset_email(to_email: str, reset_link: str) -> None:
    subject = "Resetare parolă VitalStudy"
    body = f"""
Salut,

Am primit o cerere de resetare a parolei pentru contul tău VitalStudy.

Pentru a seta o parolă nouă, accesează link-ul de mai jos:
{reset_link}

Acest link expiră în {settings.reset_password_token_expire_minutes} de minute.

Dacă nu tu ai făcut această cerere, poți ignora acest email.

Cu drag,
Echipa VitalStudy
""".strip()

    send_email(to_email=to_email, subject=subject, body=body)


def send_researcher_access_approved_email(to_email: str, reset_link: str) -> None:
    subject = "Solicitare aprobată - setează parola contului VitalStudy"
    body = f"""
Salut,

Solicitarea ta de acces în platforma VitalStudy a fost aprobată.

Pentru a activa contul de cercetător și a seta parola, accesează link-ul de mai jos:
{reset_link}

Acest link expiră în {settings.reset_password_token_expire_minutes} de minute.

Dacă nu ai inițiat această solicitare, te rugăm să ignori acest mesaj.

Cu drag,
Echipa VitalStudy
""".strip()

    send_email(to_email=to_email, subject=subject, body=body)

def send_access_request_rejected_email(to_email: str, reason: str | None) -> None:
    subject = "Solicitare respinsă - VitalStudy"
    body = f"""
Salut,

Solicitarea ta de acces în platforma VitalStudy nu a fost aprobată.

{f"Motiv: {reason}" if reason else ""}

Dacă ai întrebări, te rugăm să contactezi administratorul.

Cu drag,
Echipa VitalStudy
""".strip()

    send_email(to_email=to_email, subject=subject, body=body)


def send_participant_invitation_email(
    to_email: str,
    study_title: str,
    study_code: str,
    participant_code: str,
    temporary_pin: str,
    portal_link: str,
) -> None:
    subject = "Invitație participare studiu VitalStudy"

    body = f"""
Salut,

Ai fost invitat să participi la studiul "{study_title}" în platforma VitalStudy.

Pentru autentificare, folosește următoarele date:

Cod studiu: {study_code}
Cod participant: {participant_code}
PIN temporar: {temporary_pin}

Poți accesa portalul participantului aici:
{portal_link}

Te rugăm să păstrezi aceste date confidențiale și să nu le transmiți altor persoane.

Cu drag,
Echipa VitalStudy
""".strip()

    send_email(
        to_email=to_email,
        subject=subject,
        body=body,
    )