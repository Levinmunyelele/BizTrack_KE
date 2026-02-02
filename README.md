# 📊 BizTrack KE

Multi-Tenant Sales, Customers & Analytics Platform for Small Businesses

BizTrack KE is a full-stack SaaS web application designed to help small and medium businesses track sales, manage customers and staff, and view real-time analytics — all scoped securely per business.

This project demonstrates production-ready backend architecture, multi-tenant database design, secure authentication, and a clean analytics-driven frontend.

## 🧠 What the Application Does

BizTrack KE allows a business owner to:

Register their business and owner account in one step

Log in securely and manage their business

Record sales with different payment methods

Manage customers

Add staff users

View real-time sales analytics

Keep all data isolated per business

Each business operates independently, even though all businesses share the same database.

## 🏗 Application Architecture
High-Level Architecture
React Frontend
   ↓ (Axios / JWT)
FastAPI Backend
   ↓ (SQLAlchemy ORM)
PostgreSQL Database


Frontend handles UI, routing, and user interactions

Backend enforces business rules, authentication, and analytics

Database stores all data with strict business-level isolation

## 🗄 Database Design (Multi-Tenant)

All core tables include a business_id column to enforce data isolation.

### Entity Relationship Overview
Business
 ├── Users (Owner, Staff)
 ├── Customers
 └── Sales

## Tables Breakdown
### 🏢 Business
Field	Type	Description
id	integer	Primary key
name	string	Business name
created_at	timestamp	Created time

### 👤 User
Field	Type	Description
id	integer	Primary key
name	string	User name
email	string	Unique login email
password_hash	string	Hashed password
role	string	owner or staff
business_id	integer	FK → Business
created_at	timestamp	Created time

### 👥 Customer
Field	Type	Description
id	integer	Primary key
name	string	Customer name
phone	string	Optional phone
business_id	integer	FK → Business
created_at	timestamp	Created time

### 💰 Sale
Field	Type	Description
id	integer	Primary key
amount	decimal	Sale amount
payment_method	string	mpesa / cash / card
customer_id	integer	FK → Customer (optional)
business_id	integer	FK → Business
created_by	integer	FK → User
created_at	timestamp	Sale time

### 🔐 Authentication & Security

JWT-based authentication

Passwords stored using secure hashing

Protected routes using dependency injection

Business-level access enforced on every query

Users cannot access data outside their business

### 🏢 Owner Registration (SaaS Onboarding)

BizTrack KE supports self-service onboarding:

Owner registers via /register

Backend creates:

A new Business

An Owner user linked to that business

Owner can immediately log in and use the app

This design allows the app to scale naturally as a SaaS platform.

### 📈 Analytics Engine

Analytics are computed directly from transactional sales data, not stored summaries.

### Dashboard Metrics

Today’s total sales

Last 7 days total

Current month total

Payment method breakdown

Top customers by revenue

Best sales day

All analytics are scoped to the logged-in user’s business.

## 🖥 Frontend Design
### Pages

Login

Register (Owner signup)

Dashboard (Analytics)

Sales Management

Customer Management

Staff Management

### UI Principles

Clean, minimal dashboard

Read-only analytics

Explicit navigation for actions

Loading skeletons for better UX

Mobile-responsive layout

## 🛠 Tech Stack
### Backend

FastAPI

SQLAlchemy ORM

PostgreSQL

Alembic (migrations)

JWT Authentication

### Frontend

React

Tailwind CSS

Axios

React Router

Deployment

Backend: Render

Database: Render PostgreSQL

## Environment-based configuration

### ⚙️ Environment Variables
```` DATABASE_URL=postgresql://...
SECRET_KEY=your_secret_key
RUN_SEED=0 ```

### Safe Database Seeding ```
``` RUN_SEED=1 python seed.py


Seeding is disabled by default to protect production data.

## ▶️ Running Locally
### Backend
```cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload ```

## Frontend
``` cd frontend ```
``` npm install ```
``` npm run dev ```

## 🧩 Design Decisions & Rationale

Multi-tenant schema instead of separate databases

Owner-first onboarding to support SaaS growth

Analytics computed live to avoid stale data

Seed scripts guarded by env flags

Strict business scoping on all queries

## 🚀 Future Enhancements

CSV export for sales

Interactive charts (daily trends, payment splits)

Inventory management

Expense tracking

Subscription billing

Mobile app support

👨‍💻 Author

Levin Munyelele
Software Engineer — Backend & Full Stack
BizTrack KE

## ✅ Project Summary (For Reviewers)

BizTrack KE demonstrates:

SaaS-ready architecture

Multi-tenant data modeling

Secure authentication

Analytics-driven design

Production-safe deployment practices



Demo script

Say the word — you’ve built something solid 💪
