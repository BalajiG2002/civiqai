from core.sse_queue import sse_queue
from datetime import datetime
from typing import Optional
import json

def sse_push_map_update(event_type: str, complaint_id: str,
                         lat: Optional[float] = None, lng: Optional[float] = None,
                         status: Optional[str] = None, priority: Optional[str] = None,
                         issue_type: Optional[str] = None,
                         cluster_size: Optional[int] = None,
                         prediction_json: Optional[str] = None) -> dict:
    """Push real-time map update to all connected dashboard clients."""
    prediction = None
    if prediction_json:
        try:
            prediction = json.loads(prediction_json)
        except Exception:
            prediction = {"raw": prediction_json}

    event = {
        "type": event_type,      # new_pin / pin_update / new_cluster / prediction
        "complaint_id": complaint_id,
        "lat": lat, "lng": lng,
        "status": status,
        "priority": priority,
        "issue_type": issue_type,
        "cluster_size": cluster_size,
        "prediction": prediction,
        "timestamp": datetime.utcnow().isoformat()
    }
    sse_queue.publish(event)
    return {"published": True, "event_type": event_type}
