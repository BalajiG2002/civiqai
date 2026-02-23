from google.adk.agents import LlmAgent
from tools.directory_tools import search_municipal_directory

directory_agent = LlmAgent(
    name="DirectoryAgent",
    model="gemini-2.5-flash",
    description="Finds responsible municipal officer from Redis directory",
    instruction="""
    You are a municipal directory lookup specialist.

    When called:
    1. Read app:ward and app:issue_type from session state
    2. Call search_municipal_directory with ward and issue_type
    3. Store results in session:
       - app:officer_name
       - app:dept_email
       - app:department
       - app:depot_address

    If ward is unknown, use the zone-level fallback.
    Always return the officer name and department found.
    """,
    tools=[search_municipal_directory],
    output_key="app:directory"
)
