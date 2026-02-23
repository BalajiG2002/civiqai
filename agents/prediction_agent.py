from google.adk.agents import LlmAgent
from tools.gemini_tools import gemini_predict_failure
from tools.maps_tools import get_affected_households
from tools.db_tools import fetch_historical_clusters, update_complaint_status
from tools.sse_tools import sse_push_map_update

prediction_agent = LlmAgent(
    name="PredictionAgent",
    model="gemini-2.5-flash",
    description="Predicts infrastructure failures from cluster patterns vs historical data.",
    instruction="""
    Read app:cluster for cluster data.
    1. Call fetch_historical_clusters() for same issue_type
    2. Call gemini_predict_failure() with cluster + history
    3. Call get_affected_households() to estimate impact
    4. Assign priority: confidence>80 + is_pre_failure -> P1, else P2
    5. Call sse_push_map_update() with event_type 'prediction'
    Store in: app:prediction
    """,
    tools=[
        fetch_historical_clusters,
        gemini_predict_failure,
        get_affected_households,
        update_complaint_status,
        sse_push_map_update
    ],
    output_key="app:prediction"
)
