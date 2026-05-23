# FastFood Dashboard

> Angular + NestJS + PostgreSQL (Prisma ORM) — Role-Based Business Management System

---

## 🌐 Live Demo

| Layer | Platform | URL |
|---|---|---|
| **Frontend** | Vercel | [fastfood-qivlbj7hx-bilals-projects-89c900e7.vercel.app](https://fastfood-qivlbj7hx-bilals-projects-89c900e7.vercel.app) |
| **Backend API** | Railway | *(add your Railway URL here)* |
| **Database** | Supabase | *(managed — no public URL)* |

> ⚠️ This is a **testing deployment**. Data may be reset at any time.

---

## Quick Start (Local)

### 1. Prerequisites
- Node.js 18+
- Docker + Docker Compose
- npm

### 2. Clone & Install

```bash
# Install backend dependencies
cd apps/api
npm install
```

### 3. Start the Database

```bash
# From project root
docker-compose up -d

# PostgreSQL → localhost:5432
# pgAdmin UI → http://localhost:5050  (admin@admin.com / admin)
```

### 4. Configure Environment

```bash
cd apps/api
cp ../../.env.example .env
# Edit .env — set JWT secrets (everything else works as-is for Docker)
```

### 5. Run Migrations & Seed

```bash
cd apps/api

# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate dev --name init

# Seed: creates admin user + sample data
npx ts-node prisma/seed.ts
```

### 6. Start the API

```bash
cd apps/api
npm run start:dev
# API running at http://localhost:3000/api
```

---

## ☁️ Deployment Guide

### Frontend → Vercel

1. Push your Angular project to GitHub
2. Import repo in [vercel.com](https://vercel.com)
3. Set build settings:
   - **Framework:** Angular
   - **Build command:** `ng build --configuration production`
   - **Output directory:** `dist/web/browser`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway API URL
5. Deploy

### Backend (NestJS) → Railway

1. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
2. Select your repo, set root directory to `apps/api`
3. Add environment variables:
   ```
   DATABASE_URL=<your Supabase connection string>
   JWT_SECRET=<your secret>
   JWT_REFRESH_SECRET=<your refresh secret>
   NODE_ENV=production
   ```
4. Railway auto-detects Node.js and runs `npm run start:prod`
5. Copy the generated Railway URL → paste into your Vercel `API_URL` env var

### Database → Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to **Settings → Database → Connection string (URI)**
3. Copy the connection string and set it as `DATABASE_URL` in Railway
4. Run migrations against Supabase:
   ```bash
   DATABASE_URL=<supabase_url> npx prisma migrate deploy
   DATABASE_URL=<supabase_url> npx ts-node prisma/seed.ts
   ```

---

## Default Login

| Email | Password | Role |
|---|---|---|
| admin@fastfood.com | admin123 | ADMIN |

---

## API Endpoints Summary

| Module | Base Path | Auth Required |
|---|---|---|
| Auth | `/api/auth` | Public (login), JWT (me/refresh/logout) |
| Users | `/api/users` | ADMIN only |
| Clients | `/api/clients` | ADMIN, SALESMAN |
| Categories | `/api/categories` | All authenticated |
| Menu Items | `/api/menu-items` | All authenticated |
| Materials | `/api/materials` | ADMIN, SUPPLIER |
| Orders | `/api/orders` | ADMIN, SALESMAN, MAKER |
| Purchases | `/api/purchases` | ADMIN, SUPPLIER |
| Expenses | `/api/expenses` | ADMIN only |
| Dashboard | `/api/dashboard/*` | Role-specific |

---

## Roles

| Role | What they can do |
|---|---|
| **ADMIN** | Everything. Full access. |
| **SALESMAN** | Create orders, manage own clients |
| **MAKER** | See & update status of assigned orders |
| **SUPPLIER** | View stock levels, record purchases |

---

## Order Status Flow

```
PENDING → ASSIGNED → IN_PROGRESS → READY → COMPLETED
   ↓           ↓                                  ↓
CANCELLED   CANCELLED                     (stock deducted)
```

---

## Project Structure

```
fastfood-dashboard/
├── apps/
│   ├── api/                    ← NestJS backend (complete)
│   │   ├── src/
│   │   │   ├── auth/           ← JWT login, refresh, guards
│   │   │   ├── users/          ← Worker management (admin)
│   │   │   ├── clients/        ← Customer management (salesman)
│   │   │   ├── menu/           ← Categories + items + recipes
│   │   │   ├── materials/      ← Inventory/stock tracking
│   │   │   ├── orders/         ← Full order lifecycle + stock deduction
│   │   │   ├── purchases/      ← Supplier purchases + stock update
│   │   │   ├── expenses/       ← Shop expense tracking (admin)
│   │   │   ├── dashboard/      ← Analytics queries (per role)
│   │   │   └── common/         ← Guards, decorators, filters
│   │   └── prisma/
│   │       ├── schema.prisma   ← Full database schema
│   │       └── seed.ts         ← Admin user + sample data
│   └── web/                    ← Angular frontend
└── libs/
    └── shared-types/           ← Shared TS interfaces
```