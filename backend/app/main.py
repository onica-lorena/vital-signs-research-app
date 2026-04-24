from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.routes.auth import router as auth_router
from app.api.routes.access_requests import router as access_requests_router
from app.api.routes.participant_access import router as participant_access_router
from app.api.routes.studies import router as studies_router
from app.api.routes.study_participants import router as study_participants_router
from app.api.routes.study_submissions import router as study_submissions_router
from app.api.routes.users import router as users_router
from app.api.routes.analysis import router as analysis_router

app = FastAPI(
    title="VitalStudy API",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(access_requests_router)
app.include_router(users_router)
app.include_router(studies_router)
app.include_router(study_participants_router)
app.include_router(study_submissions_router)
app.include_router(participant_access_router)
app.include_router(analysis_router)


@app.get("/")
def healthcheck():
    return {"message": "VitalStudy API is running"}