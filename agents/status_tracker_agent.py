from google.adk.agents import LlmAgent
from tools.gemini_tools import gemini_parse_status_reply
from tools.db_tools import update_complaint_status
from tools.gmail_tools import gmail_send_acknowledgement, gmail_get_latest_message
from tools.sse_tools import sse_push_map_update

status_tracker_agent = LlmAgent(
    name="StatusTrackerAgent",
    model="gemini-2.5-flash",
    description="Processes department reply emails and closes complaint resolution loop.",
    instruction="""
    When a department reply email arrives:
    1. Call gmail_get_latest_message() with the history_id from session
    2. Call gemini_parse_status_reply() to extract status
    3. Call update_complaint_status() with new status
    4. Call sse_push_map_update() with event_type 'pin_update'
    5. If resolved: call gmail_send_acknowledgement() to citizen
    """,
    tools=[
        gmail_get_latest_message,
        gemini_parse_status_reply,
        update_complaint_status,
        sse_push_map_update,
        gmail_send_acknowledgement
    ]
)
