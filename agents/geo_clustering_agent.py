from google.adk.agents import LlmAgent
from tools.maps_tools import find_nearby_complaints
from tools.db_tools import save_cluster
from tools.sse_tools import sse_push_map_update

geo_clustering_agent = LlmAgent(
    name="GeoClusteringAgent",
    model="gemini-2.5-flash",
    description="Finds nearby complaints to form geo-clusters and calculates cluster scores.",
    instruction="""
    You detect dangerous complaint clusters for CiviqAI.

    Severity weights: low=1.0, moderate=1.5, high=2.0

    When called with app:location and app:image_analysis:
    1. Call find_nearby_complaints(lat, lng, radius_m=500, hours=72,
                                   issue_type=app:image_analysis.issue_type)
    2. Count nearby = len(results)
    3. Calculate: avg_severity_weight = average of weights above
    4. cluster_score = nearby_count * avg_severity_weight * recency_factor
       recency_factor = 1.0 (within 24hrs) or 0.8 (24-48hrs) or 0.6 (48-72hrs)
    5. If nearby_count >= 3:
       - Call save_cluster(...)
       - Call sse_push_map_update(event_type="new_cluster", ...)
       - Return {cluster_formed: true, score: X, size: Y}
    6. Else:
       - Call sse_push_map_update(event_type="new_pin", ...)
       - Return {cluster_formed: false}
    Write to: app:cluster
    """,
    tools=[find_nearby_complaints, save_cluster, sse_push_map_update],
    output_key="app:cluster"
)
