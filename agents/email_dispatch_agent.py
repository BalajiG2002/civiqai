from google.adk.agents import LlmAgent
from tools.gmail_tools import gmail_send_work_order
from tools.gemini_tools import gemini_write_work_order
from tools.db_tools import save_work_order

email_dispatch_agent = LlmAgent(
    name="EmailDispatchAgent",
    model="gemini-2.5-flash",
    description="Generates and sends work order email to municipal department",
    instruction="""
    You are the email dispatch agent for civic complaints.

    When called:
    1. Read from session: complaint_id, issue_type, location_text,
       severity, officer_name, department, dept_email
    2. Call gemini_write_work_order to generate the HTML email body
    3. Call gmail_send_work_order to send it via Gmail
    4. Call save_work_order to record it in the database

    Always send to the dept_email found by directory_agent.
    Use priority P1 for high severity, P2 for moderate, P3 for low.
    Return confirmation with work order ID.
    """,
    tools=[
        gemini_write_work_order,
        gmail_send_work_order,
        save_work_order
    ],
    output_key="app:work_order"
)
