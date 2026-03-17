# Agricultural Nursery Management System

## Overview

Full-stack Agricultural Nursery Management System built as a pnpm monorepo. Features bilingual (Arabic/English) support, dark/light mode, responsive design, JWT authentication, plant catalog, ordering system, and admin dashboard.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/nursery)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: JWT (jsonwebtoken + bcryptjs)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **State management**: Zustand
- **Forms**: React Hook Form + Zod
- **Charts**: Recharts
- **UI**: Tailwind CSS + Shadcn/ui
- **Icons**: Lucide React

## Default Credentials

- **Admin**: admin@nursery.com / admin123
- **Customer**: ahmed@example.com / customer123

## Structure

```text
artifacts-monorepo/
├── artifacts/
│   ├── nursery/            # React + Vite frontend
│   └── api-server/         # Express API server
├── lib/
│   ├── api-spec/           # OpenAPI spec + Orval codegen config
│   ├── api-client-react/   # Generated React Query hooks
│   ├── api-zod/            # Generated Zod schemas from OpenAPI
│   └── db/                 # Drizzle ORM schema + DB connection
```

## Features

### Customer Features
- Browse plants catalog with search and filters
- Filter by: category, price range, height, availability
- View plant details and image gallery
- Place purchase orders (name, phone, address)
- View own order history

### Admin Features
- Admin dashboard with revenue/order statistics
- Plant management (CRUD + image upload)
- Inventory management (stock quantity updates)
- Order management (view all, update status)
- Sales reports with charts (daily sales, top plants)
- Category management

### General Features
- Arabic / English language switcher (RTL support)
- Dark / Light mode toggle
- Responsive mobile + desktop design
- JWT authentication with role-based access

## Database Schema

- `users` - User accounts (admin/customer roles)
- `categories` - Plant categories (nameAr, nameEn)
- `plants` - Plant inventory (nameAr, nameEn, price, stock, images)
- `orders` - Customer orders with status tracking
- `order_items` - Order line items

## API Routes

- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login
- `GET /api/auth/me` - Current user (auth required)
- `GET /api/categories` - List categories
- `GET /api/plants` - List plants (with filters)
- `GET /api/plants/:id` - Plant detail
- `POST/PUT/DELETE /api/plants` - Plant CRUD (admin)
- `PATCH /api/plants/:id/stock` - Update stock (admin)
- `GET/POST /api/orders` - Orders
- `PATCH /api/orders/:id` - Update order status (admin)
- `GET /api/reports/summary` - Dashboard stats (admin)
- `GET /api/reports/daily` - Daily sales (admin)
- `GET /api/reports/top-plants` - Top plants (admin)
- `GET /api/users` - User list (admin)
