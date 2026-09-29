"""Alerts API endpoints."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
import uuid
import structlog

logger = structlog.get_logger(__name__)
router = APIRouter()

_subscriptions: List[dict] = []


class AlertSubscribeRequest(BaseModel):
    region_id: str
    threshold: float = Field(default=0.7, ge=0.0, le=1.0)
    email: Optional[str] = None
    webhook_url: Optional[str] = None


@router.post("/")
async def create_alert_subscription(request: AlertSubscribeRequest):
    """Subscribe to bust alerts for a region."""
    sub = {
        "id": str(uuid.uuid4()),
        "region_id": request.region_id,
        "threshold": request.threshold,
        "email": request.email,
        "webhook_url": request.webhook_url,
        "is_active": True,
        "trigger_count": 0,
        "created_at": datetime.utcnow().isoformat(),
    }
    _subscriptions.append(sub)
    return {"message": "Alert subscription created", "subscription": sub}


@router.get("/")
async def list_alert_subscriptions():
    """List all alert subscriptions."""
    return {"subscriptions": _subscriptions, "total": len(_subscriptions)}


@router.delete("/{alert_id}")
async def delete_alert_subscription(alert_id: str):
    """Delete an alert subscription."""
    global _subscriptions
    before = len(_subscriptions)
    _subscriptions = [s for s in _subscriptions if s["id"] != alert_id]
    if len(_subscriptions) == before:
        raise HTTPException(status_code=404, detail="Subscription not found")
    return {"message": "Subscription deleted"}


@router.get("/live")
async def get_live_alerts():
    """Get recent live alerts."""
    from app.utils.synthetic_data import SyntheticWeatherGenerator
    gen = SyntheticWeatherGenerator(seed=int(datetime.utcnow().hour))
    busts = gen.inject_bust_events(n_events=10)
    alerts = [
        {
            "type": "bust_alert",
            "alert_id": str(uuid.uuid4()),
            "region_name": b["region_name"],
            "region_id": b["region_id"],
            "bust_probability": b["bust_probability"],
            "severity": b["severity"],
            "lead_day": b["lead_day"],
            "triggered_at": datetime.utcnow().isoformat(),
        }
        for b in busts if b["bust_probability"] > 0.7
    ]
    return {"alerts": alerts, "total": len(alerts)}
