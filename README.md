<p align="center">
  <img src="https://img.shields.io/badge/CiviqAI-Civic_Intelligence_Platform-1e40af?style=for-the-badge&labelColor=111827" alt="CiviqAI" />
</p>

<h1 align="center">🏛️ CiviqAI</h1>

<p align="center">
  <strong>AI-Powered Civic Complaint Management System</strong><br/>
  <em>From photo to resolution — fully autonomous, multi-agent civic intelligence.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/python-3.12+-3776ab?style=flat-square&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/Google_ADK-Agent_Framework-4285F4?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-Vision_+_NLP-ea4335?style=flat-square&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-18-61dafb?style=flat-square&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06b6d4?style=flat-square&logo=tailwindcss&logoColor=white" />
</p>

---

## 🎯 What is CiviqAI?

**CiviqAI** is a full-stack, AI-powered civic complaint management platform that transforms a single citizen photo into an end-to-end automated resolution pipeline. Built on Google's Agent Development Kit (ADK) with **9 specialized AI agents** orchestrated by a master brain, it handles everything from image analysis to work order dispatch — **zero human intervention required**.

> **Citizen snaps a photo** → AI identifies the issue → GPS extracted from EXIF metadata → Location reverse-geocoded → Responsible department auto-discovered → Work order emailed with official corporation CC → Real-time dashboard updated → Predictive analytics triggered

### The Problem

Municipal complaint systems in India rely on manual form filling, phone calls, and bureaucratic routing. Citizens don't know which department handles their issue, complaints get lost in transit, and there's zero transparency.

### The Solution

CiviqAI eliminates every friction point:

| Traditional System | CiviqAI |
|---|---|
| Fill 10-field form | Just take a photo |
| Manually locate address | GPS auto-extracted from image EXIF |
| Guess the right department | AI routes to exact officer + department |
| Call/visit office | Work order emailed automatically |
| No tracking | Real-time SSE dashboard + status updates |
| Reactive | Predictive — detects failures before they happen |

----
## CiviqAI public complaint portal — citizen submission form
<img width="517" height="420" alt="ui-1" src="https://github.com/user-attachments/assets/2197b30e-28e8-4aaf-b2c8-becc70b536dc" />
<img width="556" height="417" alt="Screenshot 2026-02-23 151248" src="https://github.com/user-attachments/assets/b9c21f0e-bd84-4582-b563-1fa0010e80ee" />
<img width="572" height="419" alt="Screenshot 2026-02-23 151326" src="https://github.com/user-attachments/assets/ae00d10e-0f68-48de-a9dd-d8fd8ddeab63" />
<img width="574" height="422" alt="Screenshot 2026-02-23 151432" src="https://github.com/user-attachments/assets/6333f6a0-ab06-4b2d-b566-8272f4224653" />

---
---

## 🧠 Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        CITIZEN INTERFACE                            │
│   📱 Public Portal (React)  ←→  📷 Photo Upload + EXIF GPS         │
└────────────────────┬────────────────────────────────────────────────┘
                     │  POST /complaint
                     ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    FASTAPI BACKEND (Port 8080)                      │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │              7-STEP DETERMINISTIC PIPELINE                    │   │
│  │                                                               │   │
│  │  Step 1  🖼️  Gemini Vision  →  Issue type + severity          │   │
│  │  Step 2  📍  EXIF GPS / Nominatim  →  Geocode                │   │
│  │  Step 3  🗺️  Reverse Geocode  →  Ward / Zone / Municipality   │   │
│  │  Step 4  📂  Redis Directory  →  Officer + Department         │   │
│  │  Step 5  💾  SQLite  →  Save complaint record                 │   │
│  │  Step 6  📧  Gmail API  →  Work order + Official Corp CC     │   │
│  │  Step 7  📡  SSE Push  →  Real-time dashboard update          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────┐       │
│  │           GOOGLE ADK ORCHESTRATOR                        │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │       │
│  │  │ ImageAnalysis │  │  Location    │  │  Directory   │  │       │
│  │  │    Agent      │  │    Agent     │  │    Agent     │  │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │       │
│  │  │ EmailDispatch│  │   Portal     │  │  Status      │  │       │
│  │  │    Agent     │  │  Publisher   │  │  Tracker     │  │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │       │
│  │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │       │
│  │  │    Geo       │  │  Prediction  │  │  Analytics   │  │       │
│  │  │  Clustering  │  │    Agent     │  │    Agent     │  │       │
│  │  └──────────────┘  └──────────────┘  └──────────────┘  │       │
│  └─────────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        ▼            ▼            ▼
   ┌─────────┐ ┌─────────┐ ┌──────────┐
   │  SQLite │ │  Redis  │ │  Gmail   │
   │   DB    │ │  Cache  │ │   API    │
   └─────────┘ └─────────┘ └──────────┘
```

---

## ✨ Key Features

### 🤖 Multi-Agent AI Pipeline (9 Agents)

| Agent | Purpose | Powered By |
|-------|---------|------------|
| **ImageAnalysisAgent** | Classifies civic issue from photo (pothole, water leak, garbage, etc.) | Gemini 2.5 Flash Vision |
| **LocationAgent** | Geocodes address, extracts GPS from image EXIF metadata | Nominatim + Pillow |
| **DirectoryAgent** | Finds responsible officer & department from municipal directory | Redis lookup |
| **EmailDispatchAgent** | Sends professional HTML work order with inline photo | Gmail API + OAuth 2.0 |
| **PortalPublisherAgent** | Saves to SQLite DB, pushes SSE update to dashboard | SQLAlchemy + SSE |
| **StatusTrackerAgent** | Monitors department email replies for status changes | Gmail + Gemini NLP |
| **GeoClusteringAgent** | Detects spatial complaint clusters via DBSCAN | scikit-learn |
| **PredictionAgent** | Predicts infrastructure failures from cluster patterns | Gemini 2.5 Flash |
| **AnalyticsAgent** | Natural language Q&A over complaint data for officers | Gemini 2.5 Flash |

### 📷 Zero-Friction Complaint Submission
- **Just take a photo** — no forms, no location fields
- GPS coordinates **auto-extracted from image EXIF metadata** using Pillow
- Fallback chain: EXIF → reverse geocode → manual entry
- AI generates description, classifies issue type, and assesses severity automatically

### 📧 Smart Email Dispatch with Official Corporation Lookup
- Professional HTML work order with **inline complaint photo** embedded via `cid:`
- **Official corporation email auto-discovered** via Gemini + Google Search grounding
- Officer email as `To:`, official corporation email as `CC:`
- Results cached in Redis for subsequent complaints to the same municipality
- Citizen receives acknowledgement email with complaint tracking ID

### 🗺️ Interactive Officer Dashboard
- **Leaflet + OpenStreetMap** map with color-coded markers by status (no Google Maps billing)
- Real-time complaint feed via **Server-Sent Events (SSE)**
- Status lifecycle management: `Open → Acknowledged → In Progress → Resolved`
- Cluster visualization with AI prediction cards
- Dark/Light mode toggle
- Admin authentication (AuthContext + LoginPage)
- Fully responsive — mobile, tablet, desktop

### 📱 Public Citizen Portal
- Twitter/Perplexity-style feed interface
- Photo upload with drag-and-drop
- Real-time complaint tracking via SSE
- Animated thinking steps showing the AI pipeline in action
- Dark/Light mode support
- Mobile-first responsive design

### 🔮 Predictive Intelligence
- DBSCAN spatial clustering detects complaint hotspots automatically
- Historical pattern matching predicts infrastructure failures
- Pre-failure alerts: pipe bursts, road collapses, power grid failures
- Confidence scoring with estimated time windows
- P1 escalation emails for high-confidence predictions

---
---
## CiviqAI admin dashboard showing complaint tracking
  
<img width="1899" height="759" alt="Screenshot 2026-02-23 151557" src="https://github.com/user-attachments/assets/d5f964c5-8dce-4a1e-85b3-136a57772bb3" />
<img width="1919" height="838" alt="Screenshot 2026-02-23 151711" src="https://github.com/user-attachments/assets/595b16d8-42e7-477e-bf03-c35b104fafea" />
<img width="954" height="454" alt="Screenshot 2026-02-23 151627" src="https://github.com/user-attachments/assets/2d07cb90-2c50-40b2-bbbf-c74d0987b7d7" />
<img width="1918" height="825" alt="Screenshot 2026-02-23 151749" src="https://github.com/user-attachments/assets/e3eaf80b-323b-40ae-aacb-5550a1942909" />

---

## 🛠️ Tech Stack

<table>
<tr>
<td>

**Backend**
- Python 3.12+
- FastAPI + Uvicorn
- Google ADK (Agent Development Kit)
- Gemini 2.5 Flash (Vision + NLP)
- SQLAlchemy + SQLite
- Redis (with in-memory fallback)
- Gmail API (OAuth 2.0)
- Pillow (EXIF GPS extraction)

</td>
<td>

**Frontend**
- React 18
- Tailwind CSS
- Leaflet + OpenStreetMap
- Lucide React icons
- Server-Sent Events (SSE)
- React Context (Auth + Theme)

</td>
<td>

**Infrastructure**
- Docker + Docker Compose
- Nominatim (free geocoding)
- Google Search grounding
- ngrok (demo tunneling)

</td>
</tr>
</table>

---

## 📁 Project Structure

```
civiqai/
├── 📂 agents/                    # Google ADK agent definitions
│   ├── orchestrator.py           #   Master orchestrator (routes to sub-agents)
│   ├── image_analysis_agent.py   #   Gemini Vision — issue classification
│   ├── location_agent.py         #   Geocoding + EXIF GPS extraction
│   ├── directory_agent.py        #   Municipality directory lookup
│   ├── email_dispatch_agent.py   #   Gmail work order sender
│   ├── portal_publisher_agent.py #   DB save + SSE push
│   ├── status_tracker_agent.py   #   Department reply monitor
│   ├── geo_clustering_agent.py   #   DBSCAN spatial clustering
│   ├── prediction_agent.py       #   Infrastructure failure predictor
│   └── analytics_agent.py        #   Natural language analytics chatbot
│
├── 📂 api/                       # FastAPI application
│   ├── main.py                   #   App entry + 7-step pipeline
│   ├── dependencies.py           #   Dependency injection
│   └── routes/                   #   Modular route handlers
│       ├── chat.py               #     Officer chat endpoint
│       ├── complaint.py          #     Complaint CRUD
│       ├── inbox.py              #     Gmail Pub/Sub webhook
│       └── stream.py             #     SSE event stream
│
├── 📂 core/                      # Core infrastructure
│   ├── config.py                 #   Pydantic Settings (.env loader)
│   ├── database.py               #   SQLAlchemy models + engine
│   ├── gmail_client.py           #   Gmail OAuth + MIME builder (inline images)
│   ├── redis_client.py           #   Redis + in-memory fallback + municipality seeds
│   ├── session.py                #   ADK session management
│   ├── sse_queue.py              #   SSE broadcast queue
│   └── storage.py                #   File upload storage
│
├── 📂 tools/                     # Agent tool functions
│   ├── gemini_tools.py           #   Image analysis, NLP, predictions, corp email search
│   ├── gmail_tools.py            #   Send work orders + acknowledgements
│   ├── maps_tools.py             #   Nominatim geocode/reverse + ward matching
│   ├── directory_tools.py        #   Redis municipal directory search
│   ├── db_tools.py               #   SQLite complaint CRUD operations
│   ├── sse_tools.py              #   SSE event push
│   └── exif_tools.py             #   EXIF GPS metadata extraction (Pillow)
│
├── 📂 frontend/
│   ├── 📂 public-portal/         # Citizen-facing React app (port 3000)
│   │   └── src/
│   │       ├── App.jsx           #   Routes: FeedPage + ReportPage
│   │       └── components/       #   InputBar, ThinkingSteps, ComplaintCard...
│   ├── 📂 dashboard/             # Officer dashboard React app (port 3002)
│   │   └── src/
│   │       ├── App.jsx           #   3-column layout + sidebar
│   │       └── components/       #   ClusterMap, AlertFeed, StatsBar, ChatPanel
│   └── 📂 public/                # Legacy citizen portal (Vite, port 5173)
│
├── 📂 seed/                      # Data seeding scripts
│   ├── generate_complaints.py    #   Generate sample complaint data
│   ├── seed_municipalities.py    #   Populate municipality directory
│   ├── seed_redis.py             #   Seed Redis entries
│   ├── seed_to_gmail.py          #   Seed test emails to Gmail inbox
│   └── get_refresh_token.py      #   Gmail OAuth refresh token helper
│
├── 📂 tests/                     # Test suite
│   ├── smoke_test.py             #   Quick health check
│   ├── test_clustering.py        #   DBSCAN clustering tests
│   ├── test_full_pipeline.py     #   End-to-end pipeline test
│   ├── test_image_analysis.py    #   Gemini Vision tests
│   ├── test_location_agent.py    #   Geocoding tests
│   ├── test_directory_agent.py   #   Directory lookup tests
│   └── test_prediction.py        #   Prediction agent tests
│
├── 📂 data/                      # Seed data files
│   ├── complaints_seed.json      #   Sample complaint JSON
│   └── historical_clusters.json  #   Historical cluster patterns
│
├── 📂 uploads/                   # Uploaded complaint images
├── Dockerfile                    # Backend + Redis container
├── docker-compose.yml            # Full-stack orchestration (4 services)
├── requirements.txt              # Python dependencies
├── pyproject.toml                # Project metadata
├── WORKFLOW.md                   # Detailed system documentation
└── README.md                     # ← You are here
```

---

## 🚀 Getting Started

### Prerequisites

| Requirement | Version | Notes |
|---|---|---|
| Python | 3.12+ | Backend runtime |
| Node.js | 18+ | Frontend build |
| Gemini API Key | — | [Get one here](https://aistudio.google.com/apikey) |
| Gmail OAuth | — | For email dispatch (see setup below) |
| Redis | 7+ | Optional — auto-falls back to in-memory |

### 1. Clone & Configure

```bash
git clone https://github.com/your-org/civiqai.git
cd civiqai
cp .env.example .env
```

Edit `.env` with your credentials:

```env
# ─── Google Gemini ───
GEMINI_API_KEY=your_gemini_api_key

# ─── Google Maps (optional — free Nominatim used by default) ───
GOOGLE_MAPS_API_KEY=your_maps_key

# ─── Gmail OAuth 2.0 ───
GMAIL_CLIENT_ID=your_client_id
GMAIL_CLIENT_SECRET=your_client_secret
GMAIL_REFRESH_TOKEN=your_refresh_token
GMAIL_USER_EMAIL=your-email@gmail.com

# ─── Redis (optional — in-memory fallback if unavailable) ───
REDIS_HOST=localhost
REDIS_PORT=6379

# ─── Database ───
DATABASE_URL=sqlite:///./civiqai.db
```

### 2. Backend Setup

```bash
# Create and activate virtual environment
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the server (auto-reload for development)
uvicorn api.main:app --reload --port 8080
```

### 3. Frontend Setup

Open **two separate terminals**:

```bash
# Terminal 1 — Public Portal (Citizen)
cd frontend/public-portal
npm install
npm start
# → http://localhost:3000
```

```bash
# Terminal 2 — Officer Dashboard
cd frontend/dashboard
npm install
npm start
# → http://localhost:3002
```

### 4. Seed Demo Data (Optional)

```bash
python seed/generate_complaints.py
python seed/seed_redis.py
```

---

## 🐳 Docker Deployment

### Full Stack (One Command)

```bash
docker-compose up --build
```

| Service | Port | Description |
|---------|------|-------------|
| `api` | 8080 | FastAPI backend + 7-step pipeline |
| `redis` | 6379 | Municipal directory + email cache |
| `public` | 3000 | Citizen portal (React) |
| `dashboard` | 3001 | Officer dashboard (React) |

### Standalone Backend

```bash
docker build -t civiqai .
docker run -p 8080:8080 --env-file .env civiqai
```

> The Dockerfile bundles Redis inside the container with an auto-starting script — no external Redis needed.

---

## 📡 API Reference

### Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/complaint` | Submit complaint (multipart: image + optional description + email) |
| `GET` | `/complaints` | List all complaints (filterable) |
| `GET` | `/complaints/{id}` | Get single complaint |
| `PATCH` | `/complaints/{id}/status` | Update status (open/acknowledged/in_progress/resolved) |
| `GET` | `/complaints/{id}/status-history` | Full status change audit trail |
| `POST` | `/chat` | Officer AI chat — natural language analytics |
| `GET` | `/stream` | SSE event stream for real-time UI updates |
| `POST` | `/inbox` | Gmail Pub/Sub push webhook |

### Example: Submit a Complaint

```bash
curl -X POST http://localhost:8080/complaint \
  -F "image=@pothole.jpg" \
  -F "description=Large pothole near bus stop" \
  -F "citizen_email=citizen@example.com"
```

**Response:**
```json
{
  "status": "processing",
  "message": "✅ Complaint #CMP-2026-0042 registered!\n\n📍 Location: Avadi Main Road, Chennai 600062\n🔍 Issue: pothole (high severity)\n📝 Deep pothole approximately 2 feet wide on main carriageway\n🏛️ Municipality: Avadi City Municipal Corporation\n👤 Assigned to: Municipal Officer (Avadi) (Roads & Public Works — Avadi City Municipal Corporation)\n📧 Work order emailed to: officer@avadi.gov.in\n🏢 Org Mail: commr.avadi@tn.gov.in\n\nTrack your complaint at the portal feed."
}
```

### Example: Officer Chat

```bash
curl -X POST http://localhost:8080/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "How many open pothole complaints in Avadi?"}'
```

---

## 🔄 The 7-Step Pipeline

Here's exactly what happens when a citizen submits a photo:

```
📷 Step 1 — IMAGE ANALYSIS
   │  Gemini 2.5 Flash Vision analyzes the photo
   │  → issue_type: "pothole"
   │  → severity: "high"
   │  → description: "Deep pothole ~2ft wide on asphalt road"
   │  → confidence: 92%
   ▼
📍 Step 2 — GPS EXTRACTION + GEOCODE
   │  EXIF metadata scanned for GPS coordinates (Pillow)
   │  Fallback: Nominatim forward geocode from description
   │  → lat: 13.1145, lng: 80.1027
   ▼
🗺️ Step 3 — REVERSE GEOCODE + WARD MATCHING
   │  Nominatim reverse geocode → full formatted address
   │  Haversine distance to nearest seeded municipality
   │  → "Avadi Main Road, Avadi, Chennai 600062"
   │  → ward: avadi, zone: Avadi Zone
   ▼
📂 Step 4 — DIRECTORY LOOKUP
   │  Redis: municipality:avadi:roads
   │  → officer: "Municipal Officer (Avadi)"
   │  → email: officer@municipality.gov.in
   │  → department: "Roads & Public Works — Avadi City Municipal Corporation"
   ▼
💾 Step 5 — DATABASE SAVE
   │  SQLite: complaints table
   │  → complaint_id: CMP-2026-0042
   │  → All fields persisted
   ▼
📧 Step 6 — EMAIL DISPATCH + CORP LOOKUP
   │  Gemini + Google Search → official corporation email
   │  HTML work order built with inline photo (CID embed)
   │  Photo also attached as downloadable file
   │  → To: officer@municipality.gov.in
   │  → CC: commr.avadi@tn.gov.in (auto-discovered)
   │  → Org Mail displayed in email body
   ▼
📡 Step 7 — SSE PUSH
   └  Real-time event pushed to all connected dashboards
      New pin appears on map with status color coding
```

---

## 🏗️ Municipality Directory

Pre-seeded with **3 Tamil Nadu municipalities** × **6 departments** = **18 directory entries**:

| Municipality | Area | Coordinates |
|---|---|---|
| **Avadi City Municipal Corporation** | Avadi, Chennai | 13.1145°N, 80.1027°E |
| **Tambaram Corporation** | Tambaram, Chennai | 12.9249°N, 80.1000°E |
| **Kancheepuram Municipality** | Kancheepuram | 12.8342°N, 79.7036°E |

**Issue Type → Department Routing:**

| Complaint Type | Routed To |
|---|---|
| Pothole / Road Damage | Roads & Public Works |
| Water Leak / Waterlogging | Water Supply & Drainage |
| Garbage Overflow | Solid Waste Management |
| Streetlight / Power Outage | Street Lighting & Power |
| Sewage Overflow | Sewage & Sanitation |
| Tree Fallen | Parks & Environment |

> Easily extensible — add municipalities to `_MUNICIPALITIES` in `core/redis_client.py`.

---

## 🌙 Dark / Light Mode

Both apps support theme switching via Tailwind CSS `darkMode: 'class'` + React Context:

- Toggle button in header (sun/moon icon)
- Persisted to `localStorage`
- Respects system `prefers-color-scheme` on first visit
- Smooth CSS transitions

---

## 🔐 Dashboard Authentication

The Officer Dashboard requires admin login:

| Field | Default |
|---|---|
| Username | `admin` |
| Password | `admin123` |

Session persisted via `AuthContext` + `localStorage`.

---

## 📧 Gmail OAuth Setup

<details>
<summary><strong>Click to expand step-by-step guide</strong></summary>

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a project (or select existing)
3. Navigate to **APIs & Services → Library**
4. Enable **Gmail API**
5. Go to **APIs & Services → Credentials**
6. Create **OAuth 2.0 Client ID** (Desktop application type)
7. Download the credentials JSON
8. Run the token helper:

```bash
python seed/get_refresh_token.py
```

9. Follow the browser OAuth flow
10. Copy the printed refresh token to `.env`:

```env
GMAIL_CLIENT_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=GOCSPX-xxxxxxx
GMAIL_REFRESH_TOKEN=1//0eXXXXXXXXXXXX
GMAIL_USER_EMAIL=your-sending-email@gmail.com
```

</details>

---

## 🧪 Testing

```bash
# Run full test suite
python -m pytest tests/ -v

# Individual modules
python -m pytest tests/smoke_test.py -v          # Health check
python -m pytest tests/test_image_analysis.py -v  # Gemini Vision
python -m pytest tests/test_clustering.py -v      # DBSCAN clustering
python -m pytest tests/test_full_pipeline.py -v   # End-to-end pipeline
python -m pytest tests/test_location_agent.py -v  # Geocoding
python -m pytest tests/test_prediction.py -v      # Failure prediction
```

---

## 🌐 Public Demo via ngrok

```bash
# Expose backend
ngrok http 8080

# Use the HTTPS URL for webhook configuration
# Update Gmail Pub/Sub with the ngrok URL
```

---

## 🤝 How CiviqAI Compares

| Feature | CiviqAI | Traditional Portals | Other AI Solutions |
|---|:---:|:---:|:---:|
| Photo-only submission | ✅ | ❌ (10-field forms) | ⚠️ (partial) |
| EXIF GPS auto-extraction | ✅ | ❌ | ❌ |
| AI issue classification | ✅ | ❌ | ✅ |
| Auto department routing | ✅ | ❌ (manual) | ⚠️ |
| Official corp email lookup | ✅ (Google Search) | ❌ | ❌ |
| Multi-agent orchestration | ✅ (9 agents) | ❌ | ⚠️ (1-2) |
| Predictive failure detection | ✅ (DBSCAN + Gemini) | ❌ | ❌ |
| Real-time SSE dashboard | ✅ | ❌ | ⚠️ |
| Inline photo in email | ✅ | ❌ | ❌ |
| Work order with photo | ✅ | ❌ | ❌ |
| Dark/Light mode | ✅ | ⚠️ | ⚠️ |
| Mobile responsive | ✅ | ⚠️ | ⚠️ |
| Zero cost mapping | ✅ (OpenStreetMap) | ❌ (paid APIs) | ❌ |
| In-memory Redis fallback | ✅ | ❌ | ❌ |

---

## 📋 Environment Variables

| Variable | Required | Default | Description |
|---|:---:|---|---|
| `GEMINI_API_KEY` | ✅ | — | Google Gemini API key |
| `GOOGLE_MAPS_API_KEY` | ❌ | `""` | Google Maps key (system uses free Nominatim) |
| `GMAIL_CLIENT_ID` | ✅ | — | Gmail OAuth client ID |
| `GMAIL_CLIENT_SECRET` | ✅ | — | Gmail OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | ✅ | — | Gmail OAuth refresh token |
| `GMAIL_USER_EMAIL` | ✅ | — | Sender email address |
| `REDIS_HOST` | ❌ | `localhost` | Redis host |
| `REDIS_PORT` | ❌ | `6379` | Redis port |
| `DATABASE_URL` | ❌ | `sqlite:///./civiqai.db` | SQLAlchemy database URL |
| `CLUSTER_RADIUS_M` | ❌ | `500` | DBSCAN cluster radius (meters) |
| `CLUSTER_THRESHOLD` | ❌ | `3` | Minimum complaints per cluster |
| `PREDICTION_THRESHOLD` | ❌ | `60` | Prediction confidence threshold |
| `P1_THRESHOLD` | ❌ | `80` | P1 priority escalation threshold |

---

## 🗺️ Roadmap

- [ ] Push notifications (Firebase Cloud Messaging)
- [ ] Multi-language support (Tamil, Hindi, English)
- [ ] Photo timeline — before/after resolution images
- [ ] WhatsApp bot integration (Twilio)
- [ ] Citizen satisfaction rating system
- [ ] Officer performance analytics dashboard
- [ ] Bulk complaint import (CSV/Excel)
- [ ] PostgreSQL production database
- [ ] Kubernetes deployment manifests
- [ ] CI/CD with GitHub Actions
- [ ] Prometheus + Grafana monitoring
- [ ] Rate limiting + API key authentication

---

## 🏗️ Built With 

<p>
  <img src="https://img.shields.io/badge/Google_ADK-4285F4?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/Gemini_2.5_Flash-ea4335?style=for-the-badge&logo=google&logoColor=white" />
  <img src="https://img.shields.io/badge/FastAPI-009688?style=for-the-badge&logo=fastapi&logoColor=white" />
  <img src="https://img.shields.io/badge/React-61dafb?style=for-the-badge&logo=react&logoColor=black" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-06b6d4?style=for-the-badge&logo=tailwindcss&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenStreetMap-7EBC6F?style=for-the-badge&logo=openstreetmap&logoColor=white" />
  <img src="https://img.shields.io/badge/Redis-DC382D?style=for-the-badge&logo=redis&logoColor=white" />
  <img src="https://img.shields.io/badge/SQLite-003B57?style=for-the-badge&logo=sqlite&logoColor=white" />
  <img src="https://img.shields.io/badge/Gmail_API-EA4335?style=for-the-badge&logo=gmail&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
</p>

---

## 👥 Authors

Built by Balaji G with Kavin Sager and Raghuvaran D .

---


---

<p align="center">
  <em>CiviqAI — Because every pothole deserves an AI.</em> 🕳️🤖
</p>
