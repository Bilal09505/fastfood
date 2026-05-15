# FastFood Dashboard

> Angular + NestJS + PostgreSQL (Prisma ORM) — Role-Based Business Management System

---

## Quick Start

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
│   └── web/                    ← Angular frontend (next phase)
└── libs/
    └── shared-types/           ← Shared TS interfaces
```
