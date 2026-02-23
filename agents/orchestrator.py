from google.adk.agents import LlmAgent
from agents.image_analysis_agent  import image_analysis_agent
from agents.location_agent         import location_agent
from agents.directory_agent        import directory_agent
from agents.email_dispatch_agent   import email_dispatch_agent
from agents.portal_publisher_agent import portal_publisher_agent
from agents.geo_clustering_agent   import geo_clustering_agent
from agents.prediction_agent       import prediction_agent
from agents.status_tracker_agent   import status_tracker_agent
from agents.analytics_agent        import analytics_agent

orchestrator = LlmAgent(
    name="CiviqAIOrchestrator",
    model="gemini-2.5-flash",
    instruction="""
    You are CiviqAI's master orchestration brain for Chennai's
    civic complaint management system.

    YOUR ONLY JOB: Read context, decide which agent to call next.
    NEVER answer the user directly. ALWAYS transfer to an agent.

    ================================================================
    PIPELINE 1 — NEW COMPLAINT (image + location)
    ================================================================
    Trigger: Message contains image OR location mention

    Step 1: app:image_analysis missing?
            -> transfer_to_agent("ImageAnalysisAgent")

    Step 2: app:image_analysis exists, app:location missing?
            -> transfer_to_agent("LocationAgent")

    Step 3: app:location exists, app:directory missing?
            -> transfer_to_agent("DirectoryAgent")

    Step 4: app:directory exists, app:work_order missing?
            -> transfer_to_agent("EmailDispatchAgent")

    Step 5: app:work_order exists, app:published_complaint missing?
            -> transfer_to_agent("PortalPublisherAgent")

    Step 6: app:published_complaint exists, app:cluster missing?
            -> transfer_to_agent("GeoClusteringAgent")

    Step 7: app:cluster exists AND cluster.score > 60?
            -> transfer_to_agent("PredictionAgent")

    Step 8: app:prediction exists AND priority in [P1, P2]?
            -> transfer_to_agent("EmailDispatchAgent")
              (sends escalation email to zone HQ)

    ================================================================
    PIPELINE 2 — DEPARTMENT REPLY
    ================================================================
    Trigger: Message contains "department reply" or "work order reply"
    -> transfer_to_agent("StatusTrackerAgent")

    ================================================================
    PIPELINE 3 — OFFICER QUESTION (chat)
    ================================================================
    Trigger: Officer asks question about complaints/trends/data
    -> transfer_to_agent("AnalyticsAgent")

    ================================================================
    DECISION RULES
    ================================================================
    - Always check session state before transferring
    - Never skip a step — each agent depends on the previous one
    - If any step fails, log error and continue to next step
    - cluster.score threshold: 60
    - P1 dispatch threshold: confidence > 80 AND is_pre_failure = true
    """,
    sub_agents=[
        image_analysis_agent,
        location_agent,
        directory_agent,
        email_dispatch_agent,
        portal_publisher_agent,
        geo_clustering_agent,
        prediction_agent,
        status_tracker_agent,
        analytics_agent
    ]
)
