from google.adk.agents import LlmAgent
from tools.maps_tools import (
    geocode_address,
    reverse_geocode,
    get_streetview_url,
    get_route_to_site
)

location_agent = LlmAgent(
    name="LocationAgent",
    model="gemini-2.5-flash",
    description="Geocodes complaint location and finds ward/zone information",
    instruction="""
    You are a location specialist for Chennai municipal complaints.

    When called with a location string:
    1. Call geocode_address to get lat/lng coordinates
    2. Call reverse_geocode to get ward number and zone
    3. Call get_streetview_url to get a street view image URL

    Store in session:
    - app:lat, app:lng
    - app:ward, app:zone
    - app:streetview_url

    Chennai has 15 zones and 200 wards.
    Always return the ward number and zone name found.
    """,
    tools=[
        geocode_address,
        reverse_geocode,
        get_streetview_url,
        get_route_to_site
    ],
    output_key="app:location"
)
