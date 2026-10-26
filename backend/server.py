"""LearnSpace API entry point."""
import logging
from pathlib import Path

from dotenv import load_dotenv
from fastapi import APIRouter, FastAPI
from starlette.middleware.cors import CORSMiddleware

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

from auth import migrate_auth_data, router as auth_router  # noqa: E402
from courses import router as courses_router  # noqa: E402
from dashboard import router as dashboard_router  # noqa: E402
from db import client, ensure_indexes  # noqa: E402
from discussion import router as discussion_router  # noqa: E402
from pretest import router as pretest_router  # noqa: E402
from seed_data import seed_database  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="LearnSpace API")

api_router = APIRouter(prefix="/api")


@api_router.get("/")
async def root():
    return {"service": "learnspace", "status": "ok"}


@api_router.get("/health")
async def health():
    return {"ok": True}


api_router.include_router(auth_router)
api_router.include_router(dashboard_router)
api_router.include_router(courses_router)
api_router.include_router(pretest_router)
api_router.include_router(discussion_router)
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
async def _startup():
    await ensure_indexes()
    await migrate_auth_data()
    await seed_database()
    logger.info("LearnSpace API started")


@app.on_event("shutdown")
async def _shutdown():
    client.close()
