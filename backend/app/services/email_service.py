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