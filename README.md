# VitalStudy – Vital Signs Research Platform

VitalStudy is a full-stack web application designed to support research involving physiological vital signs. The platform enables researchers to manage studies, participants, and submitted measurements while integrating machine learning models capable of estimating the risk of abnormal vital signs.

The application was developed as part of a bachelor's thesis focused on combining modern web technologies with artificial intelligence for medical research environments.

> **Note:** This application is intended exclusively for research and educational purposes. It does not provide medical diagnosis or clinical decision support.

---

# Features

## User Management

- User registration and authentication.
- Secure login using JWT authentication.
- Password reset functionality.
- User profile management.

## Study Management

- Create and manage research studies.
- Configure study settings.
- Generate unique study codes.
- Define participant inclusion criteria.
- Configure analysis periods.

## Participant Management

- Invite participants.
- Manage participant status.
- Track participation history.
- Submit physiological measurements.

## Data Collection

Participants can submit measurements for:

- Heart Rate (HR)
- Respiratory Rate (RR)
- Oxygen Saturation (SpO₂)
- Body Temperature

## Machine Learning Analysis

The platform integrates trained machine learning and deep learning models capable of estimating the probability that future measurements will fall outside normal physiological ranges.

Features include:

- Automatic feature extraction.
- Model selection.
- Risk prediction.
- Probability estimation.
- Batch analysis for entire studies.

## Reports

- Analysis summaries.
- Individual participant reports.
- Study reports.
- Exportable analysis results.

---

# Technologies

## Frontend

- React
- TypeScript
- Vite
- HTML5
- CSS3

## Backend

- FastAPI
- Python
- SQLAlchemy
- Alembic
- Pydantic

## Machine Learning

- Scikit-learn
- TensorFlow
- Keras
- XGBoost

## Database

- PostgreSQL

## Deployment

- Docker
- Docker Compose

---

# Project Architecture

The application follows a modular architecture composed of:

```
React Frontend
        │
REST API (FastAPI)
        │
Business Services
        │
Machine Learning Services
        │
SQLAlchemy ORM
        │
PostgreSQL
```

Machine learning predictions are performed through dedicated services that load trained models and generate risk estimates for submitted physiological measurements.

---

# Main Modules

## Authentication

- User registration
- Login
- Password reset
- JWT authorization

## Studies

- Create studies
- Edit studies
- Manage study settings
- Generate study codes

## Participants

- Invite participants
- Participant access management
- Submission history

## Data Submission

- Submit vital sign measurements
- Store participant observations

## Machine Learning

- Automatic feature generation
- Prediction services
- Multiple model support
- Risk estimation
- Analysis history

## Reports

- Study reports
- Participant reports
- Export analysis results

---

# Project Structure

```
frontend/
    React application

backend/
    FastAPI application

backend/app/
    api/
    models/
    schemas/
    services/
    ml_artifacts/
    core/

docker-compose.yml
README.md
```

---

# Getting Started

## Prerequisites

Before running the project, install:

- Docker
- Docker Compose

or

- Python 3.10+
- Node.js
- PostgreSQL

---

## Clone the Repository

```bash
git clone https://github.com/onica-lorena/vital-signs-research-app.git
```

---

## Running with Docker

```bash
docker compose up --build
```

---

## Backend

Navigate to the backend folder:

```bash
cd backend
```

Install dependencies:

```bash
pip install -r requirements.txt
```

Run the API:

```bash
uvicorn app.main:app --reload
```

---

## Frontend

Navigate to the frontend folder:

```bash
cd frontend
npm install
npm run dev
```

---

# Machine Learning Integration

The platform integrates pre-trained machine learning models capable of predicting abnormal physiological measurements.

Supported prediction targets include:

- Heart Rate
- Respiratory Rate
- Oxygen Saturation
- Body Temperature

The application automatically:

- extracts features,
- loads trained models,
- performs inference,
- computes prediction probabilities,
- stores analysis results.

---

# Future Improvements

Potential future enhancements include:

- additional physiological parameters,
- real-time wearable integration,
- advanced dashboards,
- explainable AI techniques,
- longitudinal participant analysis.

---

# License

This project is distributed under the MIT License.

---

# Author

**Lorena-Andreea Onica**

GitHub: https://github.com/onica-lorena
