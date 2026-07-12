# TransitOps - Smart Transport Operations Platform

TransitOps is a production-grade, data-dense web application built using the MERN stack (MongoDB, Express, React, Node.js). Designed for transport operations desks, it provides fleet management, real-time telemetry simulation, driver gamification, and automated expense anomaly detection using a consistent and professional orange-themed interface.

---

## 🚀 Key Features

* **Operations Dashboard**: Real-time metrics overview including active vehicles, online drivers, dispatched trips, and active maintenance logs. Displays an interactive live telemetry feed simulating vehicle routes.
* **Vehicles Registry**: Full registry of active, in-shop, and retired vehicles. Features a **Predictive Maintenance Risk Index** that calculates risk based on odometer readings since the last service.
* **Driver Desk & Leaderboard**: Safety score gamification tracking driver metrics, completed trips, license categories (e.g., Trans-HMV), CDL expiry dates, and real-time incentive payouts.
* **Financial & Fuel Desk**: Log fuel fillings and fleet expenses. Includes an **automated anomaly detection engine** that flags unusual logs (e.g., severe drops in fuel economy or unusually high toll fees).
* **Reports Hub**: Generate custom fleet ledger reports filterable by date, exportable to **CSV** and download-ready **PDF Ledger Sheets**.
* **Global Light/Dark Theme & Light Auth**: Dynamic light/dark mode transitions across the entire app with a permanently enforced light-mode sign-in page for optimal branding and accessibility.

---

## 🛠️ Tech Stack

* **Frontend**: React (Vite), Tailwind CSS (Vanilla responsive utility styles), Recharts (Analytics and charts), Lucide React (Icons), React Router DOM (Navigation).
* **Backend**: Node.js, Express.js (REST API, JWT auth, route middleware protection).
* **Database**: MongoDB (Mongoose schemas, automated index tracking, model triggers).

---

## 📂 Project Structure

```text
├── client/                 # Frontend React (Vite) Application
│   ├── src/
│   │   ├── components/     # Reusable layout components (Header, Sidebar, ProtectedRoute)
│   │   ├── context/        # Auth and global state contexts
│   │   ├── pages/          # Page components (Dashboard, Drivers, Vehicles, Reports, etc.)
│   │   └── utils/          # API helper configurations
│   ├── tailwind.config.js  # Styling guidelines
│   └── vite.config.js      # Build & proxy definitions
│
├── server/                 # Backend Node/Express API
│   ├── config/             # DB connection configuration
│   ├── middleware/         # Auth verification guards
│   ├── models/             # Mongoose schemas (User, Vehicle, Driver, Trip, Expense, etc.)
│   ├── routes/             # Express route handlers
│   ├── scripts/            # Database seeding scripts (India North-West mock dataset)
│   └── index.js            # Server entrypoint
```

---

## 🏁 Getting Started

### Prerequisites
* **Node.js** (v18 or higher recommended)
* **MongoDB** (Local instance running at `mongodb://127.0.0.1:27017/transit_db` or a remote MongoDB Atlas URI)

### 1. Setup Backend Server
1. Navigate to the `server` directory:
   ```bash
   cd server
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Configure your environment variables. Create a `.env` file inside `/server` (see `server/.env.example` for reference):
   ```env
   PORT=5000
   MONGODB_URI=mongodb://127.0.0.1:27017/transit_db
   JWT_SECRET=your_jwt_secret_key
   NODE_ENV=development
   ```
4. **Seed the database** with the North-West India mock dataset (Jaipur, New Delhi, Gurugram, Ahmedabad, Chandigarh, Amritsar routes):
   ```bash
   node scripts/seed.js
   ```
5. Start the backend:
   ```bash
   node index.js
   ```

### 2. Setup Frontend Client
1. Navigate to the `client` directory:
   ```bash
   cd ../client
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Access the web app in your browser at the local address printed (typically `http://localhost:3000` or `http://localhost:3001`).

---

## 🔑 Demo Login Credentials
Use these pre-seeded roles to log in and inspect the platform's features:

| Role | Email | Password | Allowed Access |
|---|---|---|---|
| **Fleet Manager** | `manager@transitops.com` | `password123` | All dashboards, full access |
| **Driver** | `driver@transitops.com` | `password123` | Driver metrics dashboard only |
| **Safety Officer** | `safety@transitops.com` | `password123` | Vehicles registry & safety logs |
| **Financial Analyst** | `finance@transitops.com` | `password123` | Fuel anomaly reports & ledgers |

---

## 📝 Design & Theme System
* **Primary Color**: Accented exclusively with `orange-600` (e.g. active states, brand headers, buttons, positive telemetry lines).
* **Alert Statuses**:
  * **Success/Available**: Green (`emerald-600`)
  * **Pending/In Shop**: Yellow (`amber-500`)
  * **Suspended/Cancelled**: Red (`rose-600`)
