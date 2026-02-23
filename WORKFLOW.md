# CiviqAI — System Workflow Documentation

> **CiviqAI** is an AI-powered civic complaint management platform built for Indian municipalities. Citizens submit geo-tagged complaints with photos; the system automatically analyzes, routes, and tracks them through a multi-agent AI pipeline.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Stack](#2-technology-stack)
3. [AI Agent System](#3-ai-agent-system)
4. [Pipeline 1 — New Complaint (7 Steps)](#4-pipeline-1--new-complaint-7-steps)
5. [Pipeline 2 — Department Reply](#5-pipeline-2--department-reply)
6. [Pipeline 3 — Officer Chat](#6-pipeline-3--officer-chat)
7. [AI Prediction & Escalation](#7-ai-prediction--escalation)
8. [Status Update Flow](#8-status-update-flow)
9. [SSE Real-Time Events](#9-sse-real-time-events)
10. [API Endpoints](#10-api-endpoints)
11. [Frontend Applications](#11-frontend-applications)
12. [Data Models](#12-data-models)
13. [Municipality Directory](#13-municipality-directory)

---

## 1. Architecture Overview

```
┌─────────────────────┐   ┌─────────────────────┐   ┌─────────────────────┐
│   Public Portal     │   │   Admin Dashboard   │   │   Gmail Webhook     │
│   (React — :3000)   │   │   (React — :3002)   │   │   (Pub/Sub)         │
└────────┬────────────┘   └────────┬────────────┘   └────────┬────────────┘
         │                         │                          │
         ▼                         ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     FastAPI Backend (:8080)                              │
│                                                                         │
│  POST /complaint ──► 7-Step Deterministic Pipeline                      │
│  POST /chat      ──► Google ADK Orchestrator → AnalyticsAgent           │
│  POST /inbox     ──► Google ADK Orchestrator → StatusTrackerAgent       │
│  PATCH /complaints/{id}/status ──► Manual status update                 │
│  GET  /stream    ──► SSE (Server-Sent Events)                           │
│  GET  /complaints ──► Complaint list (filtered)                         │
└───────────┬───────────────────────┬────────────────────┬────────────────┘
            │                       │                    │
            ▼                       ▼                    ▼
   ┌───────────────┐    ┌────────────────┐    ┌──────────────────┐
   │  SQLite DB    │    │  In-Memory     │    │  Gemini 2.5      │
   │  (complaints, │    │  Redis Store   │    │  Flash API       │
   │   clusters,   │    │  (directory,   │    │  (vision, text,  │
   │   work orders)│    │   status logs) │    │   predictions)   │
   └───────────────┘    └────────────────┘    └──────────────────┘
```

---

## 2. Technology Stack

| Layer         | Technology                                      |
|---------------|------------------------------------------------|
| **Backend**   | Python 3.14, FastAPI, Uvicorn                   |
| **AI Engine** | Google ADK (Agent Development Kit), Gemini 2.5 Flash |
| **Database**  | SQLAlchemy + SQLite (`civiqai.db`)               |
| **Cache**     | In-memory Redis-compatible store (`_MemoryStore`) |
| **Geocoding** | OpenStreetMap Nominatim (free, no API key)       |
| **Maps**      | Leaflet + OpenStreetMap tiles (dashboard)        |
| **Email**     | Gmail API with OAuth2 (sender: `4032annaunivtvl@gmail.com`) |
| **Frontend**  | React (CRA), Tailwind CSS, Recharts, Lucide icons |
| **Real-time** | Server-Sent Events (SSE)                        |
| **Auth**      | SessionStorage-based (admin/admin for dashboard) |

---

## 3. AI Agent System

CiviqAI uses **Google ADK** with a master **Orchestrator** and **9 specialized sub-agents**, all powered by `gemini-2.5-flash`.

```
                    ┌──────────────────────┐
                    │  CiviqAIOrchestrator │
                    │  (gemini-2.5-flash)  │
                    └──────────┬───────────┘
                               │
       ┌───────────┬───────────┼───────────┬───────────┐
       │           │           │           │           │
       ▼           ▼           ▼           ▼           ▼
 ┌───────────┐┌──────────┐┌──────────┐┌──────────┐┌──────────┐
 │ Image     ││ Location ││Directory ││ Email    ││ Portal   │
 │ Analysis  ││ Agent    ││ Agent    ││ Dispatch ││Publisher │
 └───────────┘└──────────┘└──────────┘└──────────┘└──────────┘

       ┌───────────┬───────────┬───────────┐
       │           │           │           │
       ▼           ▼           ▼           ▼
 ┌───────────┐┌──────────┐┌──────────┐┌──────────┐
 │ Geo       ││Prediction││ Status   ││Analytics │
 │ Clustering││ Agent    ││ Tracker  ││ Agent    │
 └───────────┘└──────────┘└──────────┘└──────────┘
```

### Agent Summary

| Agent                  | Purpose                                      | Key Tools                                                |
|------------------------|----------------------------------------------|----------------------------------------------------------|
| **ImageAnalysisAgent** | Analyze complaint photos with Gemini Vision  | `gemini_analyze_image`                                   |
| **LocationAgent**      | Geocode/reverse-geocode addresses            | `geocode_address`, `reverse_geocode`                     |
| **DirectoryAgent**     | Find responsible municipal officer           | `search_municipal_directory`                             |
| **EmailDispatchAgent** | Draft & send work order emails               | `gemini_write_work_order`, `gmail_send_work_order`       |
| **PortalPublisherAgent** | Save complaint to DB & push SSE update     | `save_complaint`, `sse_push_map_update`                  |
| **GeoClusteringAgent** | Detect spatial complaint clusters            | `find_nearby_complaints`, `save_cluster`                 |
| **PredictionAgent**    | Predict infrastructure failures from clusters| `gemini_predict_failure`, `get_affected_households`      |
| **StatusTrackerAgent** | Process department email replies             | `gmail_get_latest_message`, `gemini_parse_status_reply`  |
| **AnalyticsAgent**     | Answer officer queries with data insights    | `query_complaints_by_filter`, `gemini_summarize_trends`  |

---

## 4. Pipeline 1 — New Complaint (7 Steps)

When a citizen submits a complaint via `POST /complaint` (image + location + optional GPS), the system runs a **deterministic 7-step pipeline** (no LLM orchestration — tools are called directly for reliability).

```
Citizen submits complaint (image + location + GPS)
│
▼
┌─────────────────────────────────────────────┐
│  Step 1: IMAGE ANALYSIS (Gemini Vision)     │
│  • Identifies: issue_type, severity,        │
│    description, confidence                  │
│  • Issue types: pothole, water_leak,        │
│    garbage_overflow, streetlight_failure,    │
│    power_outage, waterlogging,              │
│    sewage_overflow, tree_fallen, other      │
│  • Gracefully degrades if API fails         │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Step 2: GEOCODING (Nominatim / OSM)        │
│  • Uses GPS coordinates if provided         │
│  • Otherwise forward-geocodes the address   │
│  • Returns: lat, lng, formatted address     │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Step 3: REVERSE GEOCODE                    │
│  • Determines: ward, zone, municipality     │
│  • Matches to nearest seeded municipality   │
│    (within ~15km threshold)                 │
│  • Gets formatted address                   │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Step 4: DIRECTORY LOOKUP (Redis)           │
│  • Searches by: municipality + issue_type   │
│  • Returns: officer_name, email, department │
│  • Falls back to default duty officer       │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Step 5: SAVE TO DATABASE (SQLite)          │
│  • Creates complaint record with ID         │
│    (format: CIV-XXXXXXXX)                   │
│  • Stores all metadata: location, severity, │
│    issue_type, image_url, ward, zone        │
│  • Status initialized to "open"             │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Step 6: EMAIL DISPATCH (Gmail API)         │
│  • Sends HTML work order to municipal       │
│    officer via Gmail OAuth                  │
│  • Includes: complaint details, location,   │
│    severity color-coded, officer name       │
│  • Attaches complaint image                 │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Step 7: SSE PUSH (Dashboard Update)        │
│  • Broadcasts "new_pin" event via SSE       │
│  • Payload: complaint_id, lat, lng,         │
│    status, issue_type                       │
│  • Dashboard map adds marker in real-time   │
└─────────────────────────────────────────────┘
```

### Example Response

```
✅ Complaint #CIV-A3F8B2C1 registered!

📍 Location: Anna Nagar, Chennai
🔍 Issue: pothole (high severity)
📝 Large pothole on main road near bus stop
🏛️ Municipality: Greater Chennai Corporation
👤 Assigned to: Rajesh Kumar (Roads & Infrastructure)
📧 Work order emailed to: roads@chennaicorp.gov.in
```

---

## 5. Pipeline 2 — Department Reply

When a municipal officer replies to a work order email, Gmail Pub/Sub triggers `POST /inbox`.

```
Municipal officer replies to work order email
│
▼
┌─────────────────────────────────────────────┐
│  Gmail Pub/Sub Webhook → POST /inbox        │
│  • Receives historyId from Google           │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  ADK Orchestrator → StatusTrackerAgent      │
│                                             │
│  Tools used:                                │
│  1. gmail_get_latest_message                │
│     • Fetches the actual email content      │
│                                             │
│  2. gemini_parse_status_reply               │
│     • AI extracts: complaint_id, new_status,│
│       officer_remarks, ETA                  │
│                                             │
│  3. update_complaint_status                 │
│     • Updates DB record                     │
│                                             │
│  4. sse_push_map_update (pin_update)        │
│     • Broadcasts status change to dashboard │
│                                             │
│  5. gmail_send_acknowledgement              │
│     • Sends confirmation back to officer    │
└─────────────────────────────────────────────┘
```

---

## 6. Pipeline 3 — Officer Chat

Municipal officers can ask questions through the dashboard chat panel. Uses the **full ADK orchestrator** with LLM reasoning.

```
Officer types: "Show me all open critical complaints in Ward 5"
│
▼
┌─────────────────────────────────────────────┐
│  POST /chat                                 │
│  • Greeting detection (hi/hello → static)   │
│  • Otherwise → ADK Orchestrator             │
└──────────────────┬──────────────────────────┘
                   ▼
┌─────────────────────────────────────────────┐
│  Orchestrator → AnalyticsAgent              │
│                                             │
│  Tools available:                           │
│  • query_complaints_by_filter               │
│    → Filter by status, issue_type, ward,    │
│      severity, date range                   │
│                                             │
│  • get_trend_data                           │
│    → Time-series complaint volumes,         │
│      resolution rates, avg response time    │
│                                             │
│  • gemini_summarize_trends                  │
│    → AI generates natural language summary  │
│      of patterns and recommendations        │
└─────────────────────────────────────────────┘
```

### Example Queries

- *"How many complaints this week?"*
- *"Show open P1 complaints"*
- *"What's the trend for potholes in Zone 3?"*
- *"Which ward has the most unresolved issues?"*

---

## 7. AI Prediction & Escalation

The **PredictionAgent** activates when geo-clustering detects a hotspot. This is the system's **proactive intelligence** — predicting infrastructure failures *before* they cascade.

### Geo-Clustering (Step 6 in Pipeline 1)

```
New complaint saved
│
▼
┌─────────────────────────────────────────────┐
│  GeoClusteringAgent                         │
│                                             │
│  find_nearby_complaints()                   │
│  • Radius: 500 meters                      │
│  • Time window: last 72 hours              │
│  • Uses Haversine formula for distance     │
│                                             │
│  Scoring Formula:                           │
│  score = count × severity_weight            │
│          × recency_factor                   │
│                                             │
│  • severity_weight: critical=3, high=2,     │
│    moderate=1.5, low=1                      │
│  • recency_factor: newer = higher weight    │
│  • Threshold: ≥ 3 complaints in cluster     │
│  • Cluster score > 60 → triggers prediction │
└──────────────────┬──────────────────────────┘
                   ▼ (if score > 60)
┌─────────────────────────────────────────────┐
│  PredictionAgent                            │
│                                             │
│  1. fetch_historical_clusters               │
│     • Loads past failure patterns           │
│                                             │
│  2. gemini_predict_failure                  │
│     • AI analyzes cluster pattern against   │
│       historical data                       │
│     • Predicts: failure_type, confidence,   │
│       time_to_failure, affected_area        │
│                                             │
│  3. get_affected_households                 │
│     • Estimates population impact using     │
│       Overpass API (OpenStreetMap buildings) │
│                                             │
│  Decision:                                  │
│  • confidence > 80 AND is_pre_failure       │
│    → Priority P1 (escalation email)         │
│  • Otherwise → Priority P2                  │
└──────────────────┬──────────────────────────┘
                   ▼ (if P1)
┌─────────────────────────────────────────────┐
│  EmailDispatchAgent (Escalation)            │
│  • Sends urgent P1 email to zone HQ        │
│  • Includes: prediction details, affected   │
│    households, recommended action           │
└─────────────────────────────────────────────┘
```

### Example Prediction

> **⚠️ P1 — Predicted Water Main Failure**
>
> 5 water leak complaints within 400m in last 48 hours.
> Historical pattern match: 87% confidence.
> Estimated time to failure: 12-24 hours.
> Affected households: ~340.
> Recommended: Dispatch maintenance crew immediately.

---

## 8. Status Update Flow

Complaint statuses can be updated from the **dashboard** (manually by officers) or by the **StatusTrackerAgent** (from email replies).

### Valid Statuses

| Status        | Color (Map)     | Description                    |
|---------------|-----------------|--------------------------------|
| `open`        | 🔴 Red (#ef4444)  | Newly reported                |
| `in_progress` | 🟡 Amber (#f59e0b)| Work assigned / underway       |
| `resolved`    | 🟢 Green (#22c55e)| Fix completed                  |
| `closed`      | ⚪ Slate (#94a3b8) | Verified & archived            |

### Manual Update Flow

```
Officer clicks status dropdown in dashboard
│
▼
PATCH /complaints/{id}/status
│  • Validates status ∈ {open, in_progress, resolved, closed}
│  • Updates SQLite record
│  • Logs change to Redis (log_status_change)
│  • Broadcasts SSE "status_update" event
│
▼
┌─────────────────┐    ┌─────────────────┐
│  Dashboard       │    │  Public Portal   │
│  • Map marker    │    │  • Feed card     │
│    color changes │    │    status badge   │
│  • Table row     │    │    updates       │
│    updates       │    │                  │
└─────────────────┘    └─────────────────┘
```

### Status History

Every status change is logged in Redis with a timestamp:

```json
[
  { "from": "open", "to": "in_progress", "changed_at": "2025-01-15T10:30:00", "changed_by": "admin" },
  { "from": "in_progress", "to": "resolved", "changed_at": "2025-01-15T14:45:00", "changed_by": "admin" }
]
```

Accessible via: `GET /complaints/{id}/history`

---

## 9. SSE Real-Time Events

The system uses **Server-Sent Events** (`GET /stream`) to push live updates to both frontends.

| Event Type       | Trigger                       | Payload                                      |
|------------------|-------------------------------|----------------------------------------------|
| `new_pin`        | New complaint saved (Step 7)  | `complaint_id, lat, lng, status, issue_type`  |
| `pin_update`     | StatusTracker processes reply  | `complaint_id, lat, lng, status, issue_type`  |
| `status_update`  | Manual status change (PATCH)  | `complaint_id, status, issue_type, lat, lng`  |

### Frontend Handling

- **Dashboard ClusterMap**: Adds new markers or updates existing marker colors based on status. Uses `String()` coercion for ID comparison (DB returns int-like IDs, SSE sends strings).
- **Public Portal FeedPage**: Updates complaint cards' status badges in real-time and respects active filter selection (e.g., "Closed" filter).
- **Polling fallback**: Dashboard polls `GET /complaints` every 8 seconds as a safety net.

---

## 10. API Endpoints

| Method  | Path                            | Purpose                          |
|---------|---------------------------------|----------------------------------|
| `POST`  | `/complaint`                    | Submit new complaint (multipart) |
| `POST`  | `/chat`                         | Officer chat (ADK orchestrator)  |
| `POST`  | `/inbox`                        | Gmail Pub/Sub webhook            |
| `PATCH` | `/complaints/{id}/status`       | Update complaint status          |
| `GET`   | `/complaints`                   | List complaints (filterable)     |
| `GET`   | `/complaints/{id}/history`      | Status change history            |
| `GET`   | `/stream`                       | SSE event stream                 |
| `GET`   | `/reverse-geocode`              | Reverse geocode lat/lng          |
| `GET`   | `/health`                       | Health check                     |

### POST /complaint (multipart/form-data)

| Field          | Type   | Required | Description                |
|----------------|--------|----------|----------------------------|
| `image`        | File   | Yes      | Complaint photo            |
| `location`     | String | Yes      | Address / area description |
| `citizen_email`| String | No       | For follow-up emails       |
| `lat`          | Float  | No       | GPS latitude               |
| `lng`          | Float  | No       | GPS longitude              |

---

## 11. Frontend Applications

### Public Portal (Port 3000)

The citizen-facing app for submitting and tracking complaints.

| Page       | Features                                                    |
|------------|-------------------------------------------------------------|
| **Feed**   | Live complaint feed, status filters (Open/In Progress/Resolved/Closed), SSE real-time updates, stats strip |
| **Report** | Photo upload, GPS capture button, address input, AI processing simulation (2.8s per step), step-by-step progress |

- Dark/Light mode toggle in navbar
- Mobile-responsive layout
- Twitter/Perplexity-style design

### Admin Dashboard (Port 3002)

The municipal operations command center (requires login: `admin` / `admin`).

| Component          | Features                                                       |
|--------------------|----------------------------------------------------------------|
| **LoginPage**      | SessionStorage auth, admin/admin credentials, Shield branding  |
| **Header**         | LIVE indicator, bell notifications, theme toggle, logout       |
| **Sidebar**        | Navigation: Overview, Complaints, Analytics                    |
| **StatsBar**       | Total/Open/In Progress/Resolved counts, live                   |
| **ClusterMap**     | Leaflet + OpenStreetMap, color-coded markers by status, click for details, status filter buttons |
| **ComplaintTable** | Status dropdown per row (PATCH API), sortable, priority badges |
| **ChatPanel**      | ADK-powered officer chat, natural language queries             |
| **AlertFeed**      | Live SSE event log                                             |
| **WorkOrderLog**   | Work order history                                             |
| **PredictionCard** | AI failure predictions from cluster analysis                   |

- 3-column responsive layout
- Dark/Light mode with comprehensive CSS overrides
- Leaflet map (no Google Maps dependency)

---

## 12. Data Models

### Complaint (SQLite)

| Field            | Type     | Notes                              |
|------------------|----------|------------------------------------|
| `id`             | String   | Format: `CIV-XXXXXXXX`            |
| `issue_type`     | String   | pothole, water_leak, etc.          |
| `description`    | String   | AI-generated or citizen-provided   |
| `location_text`  | String   | Formatted address                  |
| `lat` / `lng`    | Float    | GPS coordinates                    |
| `ward` / `zone`  | String   | Administrative divisions           |
| `severity`       | String   | low, moderate, high, critical      |
| `status`         | String   | open → in_progress → resolved → closed |
| `priority`       | String   | P1, P2, P3                         |
| `citizen_email`  | String   | Optional                           |
| `image_url`      | String   | `uploads/{filename}`               |
| `department`     | String   | Assigned department name           |
| `officer_name`   | String   | Assigned officer                   |
| `work_order_id`  | String   | Linked work order                  |
| `prediction`     | String   | AI prediction text (if any)        |
| `submitted_at`   | DateTime | Auto-generated                     |

### Cluster (SQLite)

| Field        | Type  | Notes                            |
|--------------|-------|----------------------------------|
| `id`         | String| Format: `CLU-XXXXXXXX`          |
| `center_lat` | Float | Cluster centroid                 |
| `center_lng` | Float | Cluster centroid                 |
| `radius_m`   | Float | Cluster radius in meters         |
| `count`      | Int   | Number of complaints in cluster  |
| `score`      | Float | Severity-weighted cluster score  |
| `issue_type` | String| Dominant issue type              |

### Work Order (SQLite)

| Field          | Type  | Notes                         |
|----------------|-------|-------------------------------|
| `id`           | String| Format: `WO-XXXXXXXX`        |
| `complaint_id` | String| Linked complaint              |
| `email_to`     | String| Officer email                 |
| `subject`      | String| Email subject                 |
| `status`       | String| sent, failed, pending         |

---

## 13. Municipality Directory

The system seeds **3 municipalities × 6 issue categories = 18 directory entries** in the in-memory Redis store.

### Seeded Municipalities

| Municipality                  | Center Coordinates         |
|-------------------------------|----------------------------|
| Greater Chennai Corporation   | 13.0827° N, 80.2707° E    |
| Tambaram Corporation          | 12.9249° N, 80.1000° E    |
| Avadi Corporation             | 13.1067° N, 80.1099° E    |

### Issue Categories

Each municipality has officers for:
- `pothole` / `road_damage` → Roads & Infrastructure
- `water_leak` / `waterlogging` → Water Supply
- `garbage_overflow` → Sanitation
- `streetlight_failure` / `power_outage` → Electrical
- `sewage_overflow` → Drainage
- `tree_fallen` → Parks & Environment

### Lookup Process

```
Input: municipality="chennai", issue_type="pothole"
│
▼
Redis key: "muni:chennai:pothole"
│
▼
Returns: {
  "officer_name": "Rajesh Kumar",
  "email": "roads@chennaicorp.gov.in",
  "department": "Roads & Infrastructure",
  "municipality": "Greater Chennai Corporation"
}
```

If no match is found, falls back to: `Duty Officer — complaints@chennaicorporation.gov.in`

---

## Running the System

### Backend
```bash
cd civiqai
.\.venv\Scripts\Activate.ps1
uvicorn api.main:app --host 0.0.0.0 --port 8080 --reload
```

### Public Portal
```bash
cd frontend/public-portal
npm start          # → http://localhost:3000
```

### Dashboard
```bash
cd frontend/dashboard
npm start          # → http://localhost:3002
```

### Environment Variables

| Variable          | Purpose                          |
|-------------------|----------------------------------|
| `GOOGLE_API_KEY`  | Gemini 2.5 Flash API key         |
| `GEMINI_API_KEY`  | Same as above (alias)            |
| `GMAIL_CREDS`     | Gmail OAuth client credentials   |
| `GMAIL_TOKEN`     | Gmail OAuth refresh token        |

---

*Generated for CiviqAI — Civic Intelligence Platform*
