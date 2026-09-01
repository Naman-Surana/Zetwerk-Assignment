# Horizon Bank - Money Transfer System

Horizon Bank is a production-quality web application that lets users create bank accounts, view balances and transaction history, and transfer money between accounts with strict prevention of overdraft transfers.

## Tech Stack
* **Frontend:** React 18, TypeScript, Vite, Tailwind CSS v4, Lucide React
* **Backend:** Node.js, Express, TypeScript, Prisma ORM, Zod Validation
* **Database:** PostgreSQL (Tested locally with Prisma Postgres provider)

## Setup & Local Development

### 1. Database Setup
You will need a PostgreSQL database (e.g., Neon or Supabase free tier). 
Obtain the connection string (e.g., `postgresql://user:password@host/db?sslmode=require`).

### 2. Backend Setup
```bash
cd server
npm install
```
Rename `server/.env.example` to `server/.env` and update the `DATABASE_URL` with your Postgres connection string.
Run database migrations (or push the schema):
```bash
npx prisma db push
# or npx prisma migrate dev
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
Rename `client/.env.example` to `client/.env`. The default `VITE_API_URL` points to `http://localhost:4000/api`.
Start the frontend development server:
```bash
npm run dev
```
The app will open at `http://localhost:5173`.

## Sample Test Flow

Once both servers are running, you can test the API using curl (or just use the beautiful UI!):

```bash
# 1. Create Account A
curl -X POST http://localhost:4000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"holderName":"Alice","email":"alice@example.com","initialBalance":1000}'

# 2. Create Account B
curl -X POST http://localhost:4000/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"holderName":"Bob","email":"bob@example.com","initialBalance":500}'

# 3. Transfer $200 from Alice to Bob (Replace IDs with the ones returned above)
curl -X POST http://localhost:4000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":"<alice-id>","toAccountId":"<bob-id>","amount":200,"description":"Rent"}'

# 4. Attempt an over-limit transfer (should fail)
curl -X POST http://localhost:4000/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":"<alice-id>","toAccountId":"<bob-id>","amount":100000,"description":"Should fail"}'

# 5. View Alice's transaction history
curl http://localhost:4000/api/accounts/<alice-id>/transactions
```

## Known Limitations
* Authentication is not implemented (per the MVP requirements).
* Assumes a single currency system.
