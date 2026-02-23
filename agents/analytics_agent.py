from google.adk.agents import LlmAgent
from tools.db_tools import query_complaints_by_filter, fetch_historical_clusters, get_trend_data
from tools.gemini_tools import gemini_summarize_trends
from tools.sse_tools import sse_push_map_update

analytics_agent = LlmAgent(
    name="AnalyticsAgent",
    model="gemini-2.5-flash",
    description="Answers officer questions about complaint trends, clusters, and summaries.",
    instruction="""
    You answer officer questions about civic data.
    Use query_complaints_by_filter() to fetch data.
    Use get_trend_data() for zone/type trend breakdowns.
    Use gemini_summarize_trends() for narrative summaries.
    Use sse_push_map_update() to highlight relevant pins on map.
    Always respond with counts, locations, and actionable insights.
    """,
    tools=[
        query_complaints_by_filter,
        fetch_historical_clusters,
        get_trend_data,
        gemini_summarize_trends,
        sse_push_map_update
    ]
)   
