# NAF PFT System - Nigerian Air Force Physical Fitness Test Management System

A comprehensive web application for managing Physical Fitness Test (PFT) records for the Nigerian Air Force. The system supports three user roles: Evaluators, Admins, and Super Admins, with features for test computation, certificate generation, analytics, and personnel management.

## 🚀 Features

### Core Functionality
- **PFT Computation**: Automated calculation of fitness scores based on NAF standards
- **Multi-Role Access**: Evaluators, Admins, and Super Admins with distinct permissions
- **Certificate Generation**: Official NAF PFT certificates with unique numbering (NAF/786/HQxxxxxx)
- **Analytics Dashboard**: Visual charts and statistics for performance tracking
- **Email Integration**: Automated PDF report delivery via Brevo API
- **Responsive Design**: Mobile-friendly interface

### Role-Based Features

| Feature | Evaluator | Admin | Super Admin |
|---------|-----------|-------|-------------|
| Submit PFT Results | ✅ | ✅ | ✅ |
| View Own Results | ✅ | ❌ | ✅ |
| Manage All Records | ❌ | ✅ | ✅ |
| Issue Certificates | ❌ | ✅ | ✅ |
| Create/Manage Evaluators | ❌ | ❌ | ✅ |
| Create/Manage Admins | ❌ | ❌ | ✅ |
| System Analytics | ❌ | ✅ | ✅ |
| Delete Records | ❌ | ✅ | ✅ |

## 🛠️ Tech Stack

### Backend
- **Framework**: FastAPI (Python)
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with HTTP-only cookies
- **Email Service**: Brevo (Sendinblue) API
- **PDF Generation**: ReportLab (backend) / jsPDF + html2canvas (frontend)
- **Deployment**: Render (https://naf-pft-sys-1.onrender.com)

### Frontend
- **Framework**: React 18 with Vite
- **Routing**: React Router v6
- **Styling**: CSS3 with responsive design
- **Charts**: Recharts
- **HTTP Client**: Fetch API with credentials

## 📁 Project Structure
naf-pft-system/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── fitness.py       # PFT computation & results
│   │   │   ├── certificates.py  # Certificate management
│   │   │   └── superadmin.py    # Super admin operations
│   │   ├── services/
│   │   │   ├── models.py        # Database models
│   │   │   ├── auth.py          # Auth utilities
│   │   │   ├── core_cal.py      # PFT calculation logic
│   │   │   ├── scoring_tables.py # NAF scoring standards
│   │   │   └── email_service.py # Email functionality
│   │   ├── schemas.py           # Pydantic models
│   │   └── main.py              # Application entry point
│   ├── requirements.txt
│   └── run.py
│
└── frontend/
├── src/
│   ├── components/          # Shared components
│   │   ├── PhysicalFitness.jsx
│   │   ├── Results.jsx
│   │   ├── Certificate.jsx
│   │   └── AnalyticsCharts.jsx
│   ├── admin/               # Admin module
│   │   ├── pages/
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── PersonnelList.jsx
│   │   │   ├── PersonnelDetails.jsx
│   │   │   └── Analytics.jsx
│   │   └── components/
│   ├── superadmin/          # Super Admin module
│   │   ├── pages/
│   │   │   ├── SuperAdminDashboard.jsx
│   │   │   ├── EvaluatorsList.jsx
│   │   │   ├── AdminsList.jsx
│   │   │   └── PFTResultsList.jsx
│   │   └── components/
│   ├── services/            # API clients
│   ├── styles/              # CSS files
│   ├── App.jsx
│   └── AuthContext.jsx      # Authentication context
└── index.html




## ⚙️ Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL database

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend

**Create virtual environment:**
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

**Install dependencies:**
pip install -r requirements.txt

**Set environment variables:**
export DATABASE_URL="postgresql://user:password@localhost/naf_pft"
export SECRET_KEY="your-secret-key-here"
export BREVO_API_KEY="your-brevo-api-key"
export ALLOWED_ORIGINS="http://localhost:5173,https://your-frontend-url.vercel.app"

**Run the application:**
python run.py

# OR

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


**Frontend Setup**
Navigate to frontend directory:
cd frontend

**Install dependencies:**
npm install

**Configure API base URL (in src/services/api.js):**
JavaScript
const API_BASE = "https://naf-pft-sys-1.onrender.com"; // Production

// OR

const API_BASE = "http://localhost:8000"; // Development

**Start development server:**
npm run dev

**Build for production:**
npm run build

**🔐 Authentication**
The system uses JWT tokens stored in HTTP-only cookies for secure authentication.
Default Super Admin Credentials
Service Number: ********
Password: **************

**User Registration Flow**
Evaluators: Created exclusively by Super Admin via dashboard
Admins: Created exclusively by Super Admin via dashboard
Super Admin: Static credentials (auto-created on first login)

