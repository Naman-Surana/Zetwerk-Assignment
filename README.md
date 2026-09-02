# Horizon Bank - Modern Banking Platform

Horizon Bank is a production-quality, full-stack web application that allows users to create secure bank accounts, view real-time balances, analyze transaction history, and instantly transfer money between accounts with strict overdraft prevention and robust background processing.

## Tech Stack
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React, React Router
* **Backend:** Node.js, Express, TypeScript, Prisma ORM, Zod Validation, JWT Authentication
* **Database:** PostgreSQL (Neon / Supabase)
* **Background Queues:** BullMQ + Redis (Upstash) for async transfers and email notifications

---

## 🚀 Setup & Local Development

### 1. Database & Redis Setup
1. Create a PostgreSQL database (e.g., Neon or Supabase free tier).
2. Create a Redis database (e.g., Upstash free tier).
3. Obtain your connection strings for both.

### 2. Backend Setup
```bash
cd server
npm install
```
Rename `server/.env.example` to `server/.env` and configure the following environment variables:
```env
PORT=4000
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
JWT_SECRET="your_super_secret_key"
CORS_ORIGIN="http://localhost:5173"
REDIS_URL="rediss://default:password@host:port"
```
Run database migrations:
```bash
npx prisma db push
```
Start the backend development server:
```bash
npm run dev
```
The server will run on `http://localhost:4000`.

### 3. Frontend Setup
```bash
cd client
npm install
```
Rename `client/.env.example` to `client/.env`. Make sure it contains:
```env
VITE_API_URL="http://localhost:4000/api"
```
Start the frontend development server:
```bash
npm run dev
```
The app will open at `http://localhost:5173`.

---

## 📖 Sample Usage Flow

### 1. Register a Client Account
1. Open `http://localhost:5173/register`.
2. Create an account with your Name, Email, and Password. You will automatically be assigned an account number and a starting balance of `$10,000`.
3. You will be redirected to your **Client Dashboard**, where you can see your balance, account number, and transaction history.

### 2. Transfer Money
1. On your dashboard, click **"Transfer Money"**.
2. Enter a recipient's account number, the amount you wish to transfer, and an optional description.
3. Submit the transfer. 
   > **Note:** The transfer is placed in a background Redis queue and processed asynchronously to ensure high reliability. It will initially show as `PENDING` and switch to `SUCCESS` almost instantly.

### 3. Overdraft Protection
1. Attempt to transfer an amount greater than your current balance.
2. The UI will catch the error, and the backend will fail safely, preventing your balance from dropping below $0.

---

## 🛡️ Admin Dashboard & Access

The application features a secure, role-based Admin Dashboard that allows bank administrators to view all users, inspect balances, and monitor transaction histories globally.

### How to Access the Admin Dashboard:
By default, all new users are registered with the `CLIENT` role. To test the Admin features, you must manually elevate a user's role in the database.

1. Create a normal user account via the UI (`/register`).
2. Open your database GUI (e.g., Prisma Studio, Supabase Dashboard, or psql).
3. Locate the `User` table.
4. Find your user row and change the `role` column from `CLIENT` to `ADMIN`.
5. Log out of the frontend and log back in.
6. You will automatically be routed to the **Admin Dashboard** (`/admin`), where you can:
   - View a paginated list of all registered clients.
   - Click on any client to view their detailed profile, account number, balance, and complete transaction history.
