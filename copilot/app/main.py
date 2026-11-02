"""FastAPI entry point: JSON API under /api, HTML/CSS/JS UI served from web/.

Run:  uvicorn app.main:app --host 127.0.0.1 --port 8000
"""
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api import routes_documents, routes_policy
from app.core.config import ROOT, settings
from app.core.errors import HTTP_STATUS

app = FastAPI(title=settings()["app"]["name"], docs_url="/api/docs", redoc_url=None)

app.include_router(routes_documents.router)
app.include_router(routes_policy.router)


def _domain_error(_request: Request, exc: Exception) -> JSONResponse:
    """One place that turns domain errors into HTTP responses for every route."""
    return JSONResponse(status_code=HTTP_STATUS[type(exc)], content={"detail": str(exc)})


for error_class in HTTP_STATUS:
    app.add_exception_handler(error_class, _domain_error)


@app.get("/api/health")
def health() -> dict:
    """Liveness check; the UI also reads the standards version from here."""
    return {"status": "ok", "standards_version": settings()["app"]["standards_version"]}


# Mounted last so /api routes take priority. html=True serves web/index.html at "/".
app.mount("/", StaticFiles(directory=ROOT / "web", html=True), name="web")
