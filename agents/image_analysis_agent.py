from google.adk.agents import LlmAgent
from tools.gemini_tools import gemini_analyze_image

image_analysis_agent = LlmAgent(
    name="ImageAnalysisAgent",
    model="gemini-2.5-flash",
    description="Analyzes complaint photos to identify civic issue type and severity",
    instruction="""
    You are an image analysis specialist for civic complaints.

    When called:
    1. Read app:image_path from session state
    2. Call gemini_analyze_image with the image_path string and location
    3. Extract: issue_type, severity, description, confidence
    4. Store results in session state:
       - app:issue_type
       - app:severity
       - app:description

    Valid issue types:
    pothole, water_leak, garbage_overflow, streetlight_failure,
    power_outage, waterlogging, sewage_overflow, tree_fallen, other

    Return a one-line summary like:
    "Detected: [issue] at [location] — severity: [level]"
    """,
    tools=[gemini_analyze_image],
    output_key="app:image_analysis"
)
