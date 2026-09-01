# Banking Money Transfer System — Architecture & Build Specification

> **How to use this document:** Paste this entire file as context into your coding agent (Cursor, Claude Code, Copilot Workspace, Codex, etc.) and instruct it to implement Phases 0–7 in order, in the section **"16. Build Instructions for the Agent."** Each phase should be verified before moving to the next. All architectural decisions below are final defaults — the agent should not ask clarifying questions unless a genuine blocker arises; it should implement per this spec.

---

## 1. Project Overview

**Objective:** Build and deploy a production-quality web application that lets users create bank accounts, view balances and transaction history, and transfer money between accounts, with strict prevention of overdraft transfers.

**In Scope**
1. Create bank accounts with an opening balance
2. View account balance and full transaction history
3. Transfer money between two accounts
4. Reject any transfer that would exceed the sender's balance
5. Refresh and display the updated transaction list immediately after every transfer

**Out of Scope**
- Real payment gateway / bank integrations
- Multi-currency support
- Card issuing, KYC, or regulatory compliance features

**Deliverables**
- [ ] Live, publicly reachable application URL
- [ ] Public GitHub repository
- [ ] `README.md` with setup steps and a sample test flow
- [ ] Delivered within 24 hours
- [ ] Production-grade code quality (typed, validated, tested, documented)

**Key Design Assumptions (stated explicitly since the original brief doesn't specify)**
- No login/authentication in the MVP — accounts are selected directly (e.g., via a dropdown/switcher) since the brief only asks for account creation, balances, and transfers, not user identity/security. Authentication is listed as a stretch goal in Section 17 if time remains.
- Currency is a single implicit unit (e.g., USD-like), no multi-currency conversion.
- One account = one "user" record for simplicity; no account can hold multiple owners.

---

## 2. Recommended Tech Stack

| Layer | Technology | Why |
|---|---|---|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS | Fast scaffold, type safety, minimal build config, quick to style |
| Backend | Node.js + Express + TypeScript | Simple, well-understood REST API, fast to stand up in hours |
| ORM | Prisma | Type-safe queries, built-in migrations, transaction API |
| Database | PostgreSQL (Neon or Supabase free tier) | Real relational DB with `NUMERIC` type for money, transactional guarantees, free hosted tier |
| Validation | Zod | Schema validation shared between request DTOs |
| Testing | Jest + Supertest (backend) | Fast unit/integration tests for the money-transfer logic |
| Frontend hosting | Vercel | Zero-config static/SPA deploy, free tier, instant URL |
| Backend hosting | Render (or Railway) | Free/cheap Node hosting with env var support |
| Version control | Git + GitHub | Required deliverable |

If the agent strongly prefers a different but equivalent stack (e.g., Next.js full-stack instead of separate client/server), it may substitute — but must preserve every architectural guarantee in Sections 4–8 (atomic transfers, decimal-safe money, validation, transaction history).

---

## 3. High-Level Architecture

```mermaid
flowchart LR
    subgraph Client["Frontend — React + Vite"]
        UI[Accounts Dashboard / Transfer Form / Transaction History]
    end
    subgraph Server["Backend API — Node.js + Express"]
        API[REST Endpoints]
        VAL[Validation Layer - Zod]
        SVC[Account & Transfer Services - Business Logic]
    end
    subgraph DB["PostgreSQL - Neon/Supabase"]
        T1[(accounts)]
        T2[(transactions)]
    end

    UI -- HTTPS / JSON --> API
    API --> VAL --> SVC
    SVC -- Prisma ORM, DB transactions --> DB
```

**Components**
- **Client:** Single-page React app. Talks only to the backend REST API. Never touches the database directly.
- **API layer:** Stateless Express server exposing REST endpoints (Section 6). Validates every request before it reaches business logic.
- **Service layer:** Contains the transfer/account business rules, isolated from HTTP concerns so it's independently testable.
- **Database:** PostgreSQL is the single source of truth. All balance mutations happen inside DB transactions — never computed and written from application memory alone.

---

## 4. Data Model

```mermaid
erDiagram
    ACCOUNT ||--o{ TRANSACTION : "is sender (from)"
    ACCOUNT ||--o{ TRANSACTION : "is receiver (to)"
    ACCOUNT {
        uuid id PK
        string account_number UK
        string holder_name
        string email UK
        decimal balance
        timestamp created_at
        timestamp updated_at
    }
    TRANSACTION {
        uuid id PK
        string reference_id UK
        uuid from_account_id FK
        uuid to_account_id FK
        decimal amount
        string status
        string description
        timestamp created_at
    }
```

**`accounts` table**
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | `gen_random_uuid()` |
| account_number | VARCHAR(20), UNIQUE | Human-readable, auto-generated (e.g. `AC` + 8 digits) |
| holder_name | VARCHAR(120) | Required |
| email | VARCHAR(160), UNIQUE | Required, used only as an identifier, not for login |
| balance | NUMERIC(19,4) | **Never** use `FLOAT`/`DOUBLE` for money |
| created_at / updated_at | TIMESTAMP | Default now() |

**`transactions` table**
| Column | Type | Notes |
|---|---|---|
| id | UUID, PK | |
| reference_id | VARCHAR(64), UNIQUE | Idempotency key — see Section 5 |
| from_account_id | UUID, FK → accounts.id | |
| to_account_id | UUID, FK → accounts.id | |
| amount | NUMERIC(19,4) | Always positive |
| status | VARCHAR(20) | `SUCCESS` \| `FAILED` |
| description | VARCHAR(255) | Optional note |
| created_at | TIMESTAMP | Default now() |

**Money-handling rule:** Store and transmit money as `NUMERIC`/`DECIMAL` (Postgres) and as strings or a decimal library (e.g. `decimal.js`) in application code. Never perform balance arithmetic using native JS floating-point numbers.

---

## 5. Core Business Logic — Transfer Flow

This is the most important part of the system. It must be **atomic** and **race-condition-safe**: two simultaneous transfers from the same account must never both succeed if only one can be covered by the balance.

**Recommended pattern:** a single conditional UPDATE inside a DB transaction, so the database itself enforces "don't go negative" without needing manual row locks.

```ts
async function transferMoney(fromId: string, toId: string, amount: Decimal, description: string, idempotencyKey: string) {
  if (fromId === toId) throw new BadRequestError("Cannot transfer to the same account");
  if (amount.lte(0)) throw new BadRequestError("Amount must be greater than zero");

  return prisma.$transaction(async (tx) => {
    // Idempotency: replay-safe if the client retries a request
    const existing = await tx.transaction.findUnique({ where: { referenceId: idempotencyKey } });
    if (existing) return existing;

    const [fromAccount, toAccount] = await Promise.all([
      tx.account.findUnique({ where: { id: fromId } }),
      tx.account.findUnique({ where: { id: toId } }),
    ]);
    if (!fromAccount || !toAccount) throw new NotFoundError("Account not found");

    // Atomic conditional debit — DB guarantees no overdraft even under concurrency
    const debit = await tx.account.updateMany({
      where: { id: fromId, balance: { gte: amount } },
      data: { balance: { decrement: amount } },
    });
    if (debit.count === 0) throw new InsufficientFundsError("Insufficient balance");

    await tx.account.update({
      where: { id: toId },
      data: { balance: { increment: amount } },
    });

    return tx.transaction.create({
      data: {
        referenceId: idempotencyKey,
        fromAccountId: fromId,
        toAccountId: toId,
        amount,
        status: "SUCCESS",
        description,
      },
    });
  }, { isolationLevel: "Serializable" });
}
```

**Edge cases the implementation must handle**

| Case | Expected behavior |
|---|---|
| `amount <= 0` | 400 Bad Request |
| `fromAccountId === toAccountId` | 400 Bad Request |
| Either account doesn't exist | 404 Not Found |
| `amount > balance` | 400 Bad Request, code `INSUFFICIENT_FUNDS`, **no partial mutation** |
| Two concurrent transfers drain the same account | Only the transfers the balance can cover succeed; the rest fail cleanly with `INSUFFICIENT_FUNDS` |
| Same request submitted twice (double-click / network retry) | Second call returns the original transaction, no double-debit (idempotency key) |

---

## 6. API Specification

Base URL: `/api`

| Method | Path | Purpose |
|---|---|---|
| POST | `/accounts` | Create a new account |
| GET | `/accounts` | List all accounts |
| GET | `/accounts/:id` | Get one account's details/balance |
| GET | `/accounts/:id/transactions` | Get transaction history for an account |
| POST | `/transfers` | Execute a transfer between two accounts |

**POST /accounts**
```json
// Request
{ "holderName": "Alice Doe", "email": "alice@example.com", "initialBalance": 1000.00 }

// 201 Response
{
  "id": "b3f1...", "accountNumber": "AC10293847",
  "holderName": "Alice Doe", "email": "alice@example.com",
  "balance": 1000.00, "createdAt": "2026-09-01T10:00:00Z"
}
```

**GET /accounts** → `200`: array of `{ id, accountNumber, holderName, balance }`

**GET /accounts/:id** → `200`: full account object, or `404` if not found

**GET /accounts/:id/transactions**
```json
// 200 Response
[
  {
    "id": "tx_1", "direction": "DEBIT", "counterpartyAccountNumber": "AC55443322",
    "amount": 200.00, "description": "Rent", "status": "SUCCESS",
    "createdAt": "2026-09-01T10:05:00Z"
  }
]
```

**POST /transfers**
```json
// Request
{
  "fromAccountId": "b3f1...", "toAccountId": "c9a2...",
  "amount": 200.00, "description": "Rent payment",
  "idempotencyKey": "client-generated-uuid"   // optional but recommended
}

// 201 Response
{
  "transactionId": "tx_1", "status": "SUCCESS", "amount": 200.00,
  "fromAccount": { "id": "b3f1...", "balance": 800.00 },
  "toAccount": { "id": "c9a2...", "balance": 700.00 },
  "createdAt": "2026-09-01T10:05:00Z"
}

// 400 Error example
{ "error": { "code": "INSUFFICIENT_FUNDS", "message": "Account balance is insufficient for this transfer." } }
```

**Standard error envelope** (all non-2xx responses):
```json
{ "error": { "code": "STRING_CODE", "message": "Human readable message" } }
```
Error codes to implement: `VALIDATION_ERROR`, `ACCOUNT_NOT_FOUND`, `INSUFFICIENT_FUNDS`, `SAME_ACCOUNT_TRANSFER`, `INTERNAL_ERROR`.

---

## 7. Frontend Specification

| Screen | Purpose |
|---|---|
| **Accounts Dashboard** | List all accounts with balances; entry point to create a new account or select one |
| **Create Account** | Form: holder name, email, opening balance → calls `POST /accounts` |
| **Account Detail** | Shows balance + full transaction history table (`GET /accounts/:id`, `GET /accounts/:id/transactions`) |
| **Transfer Money** | Form: from-account (pre-filled if navigated from detail), to-account (dropdown of other accounts), amount, description → calls `POST /transfers` |

**UX requirements**
- After a successful transfer, re-fetch and re-render the transaction list and both balances without a full page reload.
- Show inline, human-readable errors (e.g., "Insufficient balance — available: $800.00") rather than raw error codes.
- Disable the submit button while a transfer request is in flight to prevent duplicate submits (pair with the idempotency key).
- Format all money with 2 decimal places and a currency symbol.

---

## 8. Non-Functional Requirements

- **Atomicity:** every balance change happens inside a single DB transaction (Section 5) — never two separate un-transacted writes.
- **Precision:** money is `NUMERIC`/`DECIMAL` end-to-end; never native floats.
- **Validation:** every request body validated with Zod on the server, in addition to client-side form checks.
- **Idempotency:** transfer requests accept a client-supplied `idempotencyKey` to survive retries safely.
- **Error handling:** centralized Express error-handling middleware; no unhandled promise rejections; no stack traces leaked to the client.
- **Config:** all secrets/connection strings via environment variables, never hard-coded; `.env.example` committed, `.env` gitignored.
- **CORS:** backend restricts allowed origins to the deployed frontend URL (plus `localhost` for dev).
- **Logging:** request logging (e.g., `morgan`) and structured error logs on the server.
- **Code quality:** TypeScript strict mode, ESLint + Prettier configured, no `any` in business logic, meaningful commit history.
- **Tests:** automated tests covering the transfer edge cases in Section 5's table, at minimum.

---

## 9. Repository Structure

```
banking-app/
├── client/
│   ├── src/
│   │   ├── api/            # fetch/axios wrappers per endpoint
│   │   ├── components/     # AccountCard, TransferForm, TransactionTable, etc.
│   │   ├── pages/          # Dashboard, AccountDetail, CreateAccount, Transfer
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── .env.example        # VITE_API_URL=
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/          # accounts.routes.ts, transfers.routes.ts
│   │   ├── controllers/
│   │   ├── services/        # account.service.ts, transfer.service.ts (Section 5 logic)
│   │   ├── validation/       # zod schemas
│   │   ├── middleware/       # errorHandler.ts, cors config
│   │   ├── prisma/schema.prisma
│   │   └── app.ts
│   ├── tests/                 # transfer.service.test.ts, accounts.routes.test.ts
│   ├── .env.example           # DATABASE_URL=, PORT=, CORS_ORIGIN=
│   └── package.json
├── README.md
└── .gitignore
```

---

## 10. Environment Variables

| Variable | Where | Example |
|---|---|---|
| `DATABASE_URL` | server | `postgresql://user:pass@host/db?sslmode=require` |
| `PORT` | server | `4000` |
| `CORS_ORIGIN` | server | `https://your-frontend.vercel.app` |
| `VITE_API_URL` | client | `https://your-backend.onrender.com/api` |

---

## 11. Deployment Plan

1. **Database:** create a free Postgres instance on Neon or Supabase; copy the connection string into `DATABASE_URL`.
2. **Backend:** push `server/` to Render (or Railway) as a Node web service; set `DATABASE_URL`, `PORT`, `CORS_ORIGIN`; run `prisma migrate deploy` as the build/release step.
3. **Frontend:** deploy `client/` to Vercel; set `VITE_API_URL` to the deployed backend's URL; confirm the build command (`vite build`) and output dir (`dist`).
4. **Verify end-to-end:** open the live frontend URL and run the full test flow in Section 12 against the deployed backend.

---

## 12. Sample Test Flow (also goes in the README)

```bash
# 1. Create Account A
curl -X POST https://<backend-url>/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"holderName":"Alice","email":"alice@example.com","initialBalance":1000}'

# 2. Create Account B
curl -X POST https://<backend-url>/api/accounts \
  -H "Content-Type: application/json" \
  -d '{"holderName":"Bob","email":"bob@example.com","initialBalance":500}'

# 3. Transfer $200 from Alice to Bob (use the ids returned above)
curl -X POST https://<backend-url>/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":"<alice-id>","toAccountId":"<bob-id>","amount":200,"description":"Rent"}'
# Expect: Alice balance 800, Bob balance 700

# 4. Attempt an over-limit transfer (should fail)
curl -X POST https://<backend-url>/api/transfers \
  -H "Content-Type: application/json" \
  -d '{"fromAccountId":"<alice-id>","toAccountId":"<bob-id>","amount":100000,"description":"Should fail"}'
# Expect: 400, error.code = "INSUFFICIENT_FUNDS", balances unchanged

# 5. View Alice's transaction history
curl https://<backend-url>/api/accounts/<alice-id>/transactions
```

---

## 13. README.md Requirements

The final `README.md` must include:
1. One-paragraph project overview
2. Tech stack list
3. Local setup steps (clone → install → set env vars → run migrations → start dev servers)
4. API reference (can link to Section 6 of this doc or restate it briefly)
5. The sample test flow from Section 12, with real deployed URLs filled in
6. Live application URL and GitHub repo link
7. Known limitations (e.g., no authentication in MVP)

---

## 14. Definition of Done

- [ ] Create account with opening balance works end-to-end
- [ ] Account balance + full transaction history is viewable
- [ ] Transfer between two accounts succeeds and both balances update correctly
- [ ] Transfer exceeding balance is rejected with a clear error and no balance change
- [ ] Transaction list visibly refreshes immediately after a successful transfer
- [ ] Automated tests cover: successful transfer, insufficient funds, same-account transfer, nonexistent account, concurrent-transfer safety
- [ ] App is deployed and reachable at a public URL
- [ ] GitHub repo is public and pushed
- [ ] README complete per Section 13

---

## 15. Build Instructions for the Agent

Work through these phases in order; do not skip ahead.

1. **Phase 0 — Scaffold:** init git repo; scaffold `client/` (Vite + React + TS + Tailwind) and `server/` (Express + TS); set up ESLint/Prettier; add `.env.example` in both.
2. **Phase 1 — Database:** write `prisma/schema.prisma` per Section 4; provision the Postgres instance; run the first migration.
3. **Phase 2 — Backend core:** implement account service, transfer service (Section 5 exactly, including the conditional-update pattern), Zod validation, Express routes (Section 6), centralized error handler.
4. **Phase 3 — Backend tests:** Jest + Supertest covering the edge-case table in Section 5.
5. **Phase 4 — Frontend:** build the four screens in Section 7; wire to the API; ensure the post-transfer refresh behavior works.
6. **Phase 5 — Polish:** responsive styling, client-side validation, disabled-while-submitting buttons, friendly error messages.
7. **Phase 6 — Deploy:** follow Section 11; confirm the live URL works against the real deployed DB.
8. **Phase 7 — Document:** write `README.md` per Section 13, filling in real URLs.

---

## 16. Stretch Goals (only if time remains after Section 15 is fully done)

- Email/password authentication (JWT) so each user only sees/controls their own account
- Pagination on transaction history
- Rate limiting on `/transfers`
- Docker Compose for one-command local setup
- CI (GitHub Actions) running the test suite on push
