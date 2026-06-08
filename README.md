<div align="center">
  <div style="background: linear-gradient(135deg, #7877c6, #1e1e1e); padding: 20px; border-radius: 15px; display: inline-block;">
    <h1 align="center" style="color: white; margin: 0; font-size: 3rem; text-shadow: 0 0 15px rgba(120,119,198,0.8);">
      ✦ Crewspace ✦
    </h1>
  </div>
  <p align="center"><strong>A Next-Generation Work Management Platform with Role-Based Access Control</strong></p>
  <p align="center">
    <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react" alt="Frontend" />
    <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" alt="Backend" />
    <img src="https://img.shields.io/badge/Database-MySQL-4479A1?style=for-the-badge&logo=mysql" alt="Database" />
    <img src="https://img.shields.io/badge/Styling-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css" alt="Tailwind" />
  </p>
</div>

---

## 🌟 Overview

**Crewspace** is a full-stack, enterprise-grade workspace management platform featuring a stunning **Neon Glassmorphism** user interface. Built for performance and security, it seamlessly separates its robust API backend from its dynamic client frontend, connected by strict Role-Based Access Control (RBAC).

Whether you are an Admin orchestrating teams or a Member tracking kanban tasks, Crewspace provides an immersive, lightning-fast experience.

## 🏗️ Architecture: Separated Frontend & Backend

The project uses a monorepo structure leveraging `pnpm` workspaces. The frontend and backend are completely decoupled to allow independent scaling, development, and deployment without breaking the bundle.

- 🎨 **Frontend (Client)**: Located in `artifacts/workspace-app`
  - Built with React 19, Vite, and Tailwind CSS.
  - Implements a custom "Dark Glassmorphism" UI system with fluid animations (Framer Motion).
  - Uses TanStack React Query for efficient data fetching and caching.
- ⚙️ **Backend (Server)**: Located in `artifacts/fastapi-server`
  - Built with Python's FastAPI for extreme performance.
  - Uses SQLAlchemy (Async) with MySQL for relational data integrity.
  - Uses Redis for ultra-fast caching of workspace metadata.
  - Secures endpoints with JWT Authentication and strict RBAC decorators.

---

## ✨ Key Features

- 🔐 **Role-Based Access Control**: Strict division between `Admin` and `Member` privileges globally, and `Owner`/`Manager`/`Member`/`Viewer` roles inside individual workspaces.
- 📋 **Kanban Boards**: Drag-and-drop task management within workspaces.
- 📱 **Fully Responsive**: Flawless layout adaptation from large desktop monitors down to mobile screens.
- 📊 **Real-time Analytics**: Admin dashboards for tracking user engagement and workspace statistics.
- 📧 **Invitations**: Secure, token-based workspace invitations.
- 🛡️ **Production-Ready Security**: Hardened CORS policies, bcrypt password hashing, and zero vulnerable boilerplate (no Replit artifacts).

---

## 🚀 Getting Started Locally

### Prerequisites
- Node.js (v18+) and `pnpm`
- Python (3.10+)
- MySQL Server & Redis Server running locally

### 1. Start the Backend (FastAPI)
Open a terminal and navigate to the backend directory:
```bash
cd artifacts/fastapi-server
# Create a virtual environment
python -m venv venv
# Activate the virtual environment (Windows)
venv\Scripts\activate
# Install dependencies
pip install -r requirements.txt
# Start the server (runs on http://localhost:8000)
uvicorn app.main:app --reload
```
*(Note: Make sure to configure your `.env` file in the backend directory with your `DATABASE_URL`, `REDIS_URL`, and `JWT_SECRET`)*

### 2. Start the Frontend (React + Vite)
Open a new terminal and stay in the root repository directory:
```bash
# Install all workspace dependencies
pnpm install
# Navigate to the frontend directory
cd artifacts/workspace-app
# Start the Vite development server (runs on http://localhost:5173)
pnpm run dev
```

---

## 🔒 Security Posture
- **No Wildcard CORS**: API origin sharing is strictly locked to local development URLs.
- **Supply Chain Safety**: Clean `pnpm-workspace.yaml` with rigorous package filtering and minimum release-age checks.
- **Secrets Management**: All sensitive configurations are managed exclusively via un-tracked `.env` files. 

---

<div align="center">
  <i>Crafted with precision for secure team collaboration.</i><br/>
  <sub>Last updated: June 2026</sub>
</div>
