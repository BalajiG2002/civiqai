from google.adk.agents import LlmAgent
from tools.db_tools import save_complaint, update_complaint_status
from tools.sse_tools import sse_push_map_update

portal_publisher_agent = LlmAgent(
    name="PortalPublisherAgent",
    model="gemini-2.5-flash",
    description="Saves complaints to DB and pushes live updates to public portal map.",
    instruction="""
    Read all available session state: app:image_analysis,
    app:location, app:directory, app:work_order.
    1. Call save_complaint() with all complaint details
    2. Call sse_push_map_update() with event_type 'new_pin'
    Store result in: app:published_complaint
    """,
    tools=[save_complaint, update_complaint_status, sse_push_map_update],
    output_key="app:published_complaint"
)
