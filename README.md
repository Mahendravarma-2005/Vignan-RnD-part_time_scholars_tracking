# VFSTR Ph.D Part-Time Research Scholar Tracking Portal

A standalone, modern web application designed for Part-Time Research Scholars of **Vignan's Foundation for Science, Technology & Research (VFSTR)** to submit their monthly progress reports from anywhere in the world, without requiring access to the internal campus Wi-Fi network.

Built for **Vercel** serverless hosting and powered by **Supabase PostgreSQL**.

---

## 🚀 Key Features

1. **Accessible Globally**: Deployed to Vercel CDN; part-time scholars working in industry or external academia can submit reports from any device.
2. **Simplified Scholar Permanent Profile (7 Columns)**:
   - Scholar Name
   - Guide Name
   - Department
   - **Employement** (Dropdown: `Industry`, `Academic`)
   - Date of Joining
   - Contact No of Scholar
   - Contact No of Supervisor
3. **Streamlined Monthly Progress**:
   - **Current Month**: Auto-generated from the system calendar (locked).
   - **Courses Completed**: Dynamic course cards supporting both **Internal** and **NPTEL** coursework with Formative & Summative marks evaluation.
   - **Journal Papers Progress**: Communicated, Accepted, Published tracking.
   - **Conference Papers Progress**: National & International conference presentations.
   - **Conferences / Workshops / FDPs**: Event attendance logging.
   - **Doctoral Committee (DC) Meetings**: Includes recommendations (`Synopsis`, `In Progress`, `Thesis Submission`).
4. **Mobile OTP Verification Gateway**: Secure 6-digit passcode authentication to prevent unauthorized submissions.
5. **Dean R&D Administration Console**: Complete overview of submissions, defaulter tracking, printable monthly appraisal reports, and CSV/Excel export.

---

## 📋 3-Minute Deployment Guide

### Step 1: Set Up Supabase Database (1 minute)

1. Sign up or log in at **[https://supabase.com](https://supabase.com)** (Free Tier).
2. Click **New Project**, name it `vignan-phd-part-time`, choose a secure database password, and select your preferred region (e.g., `South Asia (Mumbai)`).
3. Once the database is provisioned:
   - Click on the **SQL Editor** tab in the left sidebar (icon with `>_`).
   - Click **New Query**.
   - Open [`supabase_schema.sql`](./supabase_schema.sql) from this project, copy its entire contents, paste it into the SQL editor, and click **Run** (`Ctrl + Enter`).
   - *Result*: All 8 database tables, indexes, row-level security (RLS) policies, and verified scholar master profiles are created instantly!
4. Retrieve your API Keys:
   - Go to **Project Settings** (gear icon) -> **API**.
   - Copy:
     - **Project URL** (`https://xyzcompany.supabase.co`)
     - **Project API Keys -> `anon` public key**
     - **Project API Keys -> `service_role` secret key**

---

### Step 2: Deploy to Vercel (2 minutes)

#### Option A: Deploy via GitHub (Recommended)
1. Push this `phd-part-time-portal` folder to a new repository on your GitHub account:
   ```bash
   git init
   git add .
   git commit -m "Initial commit for VFSTR Part-Time Scholar Tracking Portal"
   git remote add origin https://github.com/your-username/vfstr-part-time-tracking.git
   git push -u origin main
   ```
2. Go to **[https://vercel.com](https://vercel.com)** and click **Add New...** -> **Project**.
3. Import your GitHub repository.
4. In the **Environment Variables** section, add the following 4 keys:
   - `SUPABASE_URL` = `https://your-project-id.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-supabase-anon-key`
   - `SUPABASE_SERVICE_ROLE_KEY` = `your-supabase-service-role-key`
   - `ADMIN_PASSWORD` = `passowrd123` *(or your custom Dean R&D password)*
5. Click **Deploy**. In under 60 seconds, your site is live with a free SSL certificate (e.g. `https://vfstr-part-time.vercel.app`)!

#### Option B: Deploy via Vercel CLI (Instant from Terminal)
If you have Vercel CLI installed:
```bash
npx vercel
```
Follow the interactive prompts, then add the environment variables in your Vercel project dashboard.

---

## 💻 Running Locally

You can run this project locally with Node.js in one simple command:

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional / Pre-configured)
Copy `.env.example` to `.env` (already created locally):
```bash
cp .env.example .env
```

### 3. Start the Local Server
Run any of the following commands:
```bash
node server.js
```
or
```bash
npm start
```
or
```bash
npm run dev
```

Open your browser and navigate to:
👉 **[http://localhost:3000](http://localhost:3000)**

- **Scholar Portal**: `http://localhost:3000/`
- **Dean R&D Admin Portal**: Click "Dean R&D Login" or navigate to the admin section.
  - Email: `dean_rd@vignan.ac.in`
  - Password: `passowrd123`

---

## 🛠️ Project Structure

```
phd-part-time-portal/
├── public/
│   ├── index.html                   # Scholar form & Dean R&D dashboard SPA
│   ├── styles.css                   # Responsive UI & print stylesheets
│   ├── vignan-logo.png              # Official VFSTR emblem
│   ├── app.js                       # Application entry point
│   └── js/
│       ├── config.js                # Shared configuration & DOM cache
│       ├── supabaseClient.js        # Supabase client initializer
│       ├── api.js                   # Unified data access client
│       ├── portal.js                # Scholar form interaction & OTP flow
│       ├── dynamicCards.js          # Dynamic card builders (Courses, Journals, etc.)
│       ├── report.js                # Printable appraisal report & modal
│       ├── admin.js                 # Admin metrics, defaulters & data table
│       └── utils.js                 # Toast notifications & calculation helpers
├── api/                             # Vercel Serverless Functions
│   ├── _supabase.js                 # Server-side Supabase client
│   ├── auth/
│   │   └── otp/
│   │       ├── send.js              # POST /api/auth/otp/send
│   │       └── verify.js            # POST /api/auth/otp/verify
│   ├── part-time-profile/
│   │   └── [regNo].js               # GET /api/part-time-profile/:regNo
│   ├── part-time-profiles.js        # GET /api/part-time-profiles
│   ├── part-time-scholars.js        # GET & POST /api/part-time-scholars
│   ├── part-time-scholar-submissions/
│   │   └── [regNo].js               # GET /api/part-time-scholar-submissions/:regNo
│   └── part-time-admin/
│       └── login.js                 # POST /api/part-time-admin/login
├── supabase_schema.sql              # 1-Click PostgreSQL database schema & seed
├── vercel.json                      # Vercel routing & CORS configuration
├── package.json                     # Serverless dependencies (@supabase/supabase-js)
├── .env.example                     # Environment variables template
└── README.md                        # Documentation
```

---

## 🔐 Administrative Credentials

- **Portal URL**: `/` (Click "Dean R&D Login" in the top navigation or press `Ctrl + Shift + A`)
- **Default Email**: `dean_rd@vignan.ac.in`
- **Default Password**: `passowrd123`
