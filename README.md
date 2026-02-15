# EtherBlinks

**Programmable Micropayments for the AI Economy**

EtherBlinks is a full-stack payments infrastructure built on [Etherlink](https://etherlink.com) that lets merchants accept one-time payments, recurring subscriptions, and machine-to-machine micropayments — all settled in USDC on-chain.

---

## Why EtherBlinks?

- **Instant shareable payment links** — Generate a URL, share it anywhere, get paid in USDC. No checkout pages, no middleware.
- **On-chain subscriptions** — Recurring charges managed by a smart contract with spending caps, auto-retry, and one-click revocation. Users stay in control.
- **x402 agentic payments** — Paywall any API endpoint behind HTTP 402. AI agents and scripts can pay-per-call with zero human interaction.
- **Merchant SDK** — A single `npm install @etherblinks/sdk` gives you checkout URLs, webhook verification, and USDC amount helpers.
- **Relayer service** — A self-hosted daemon that indexes on-chain subscription policies, executes charges on schedule, and fires webhooks to your backend.

---

## Architecture

```
┌────────────┐      ┌─────────────┐      ┌──────────────────┐
│  Client     │◄────►│  Relayer     │◄────►│  Etherlink       │
│  (Next.js)  │      │  (Node/Bun)  │      │  Smart Contracts │
└──────┬──────┘      └──────┬──────┘      └──────────────────┘
       │                    │
       │   Supabase (DB)    │
       └────────────────────┘
```

| Component | What it does |
|-----------|-------------|
| **client/** | Next.js 16 dashboard — create links, manage subscriptions, x402 endpoints, merchant analytics |
| **contracts/** | Solidity — `SubscriptionManager` (recurring charges, spending caps, protocol fee) + `MockUSDC` (test token) |
| **relayer/** | Off-chain service — indexes `PolicyCreated` events, executes scheduled charges, delivers webhooks |
| **sdk/** | `@etherblinks/sdk` — TypeScript helpers for checkout URLs, webhook signature verification, USDC formatting |

---

## Key Features

### Payment Links

Turn any blockchain action into a short URL:

```
https://etherblinks.vercel.app/a/tip-jdahagecew
```

Share on social media, embed in websites, or print as QR codes. Recipients connect a wallet, confirm the transaction, done.

### Recurring Subscriptions

Powered by the `SubscriptionManager` smart contract:

- Merchants set amount + interval (weekly, monthly, custom)
- Subscribers approve once with a spending cap
- The relayer auto-charges on schedule — no user action needed
- Subscribers can revoke anytime; the contract enforces caps
- 2.5% protocol fee, transparent on-chain

### x402 Agentic Payments

Implement the [x402 protocol](https://www.x402.org/) to paywall any HTTP endpoint:

1. Client requests a resource → server returns **HTTP 402** with price & wallet
2. Client sends USDC on-chain → retries with the tx hash in an `X-PAYMENT` header
3. Server verifies the transfer on-chain → returns the resource

This lets AI agents, bots, and scripts autonomously pay for API calls without API keys or billing accounts.

### Merchant SDK

```bash
npm install @etherblinks/sdk
```

```typescript
import { createCheckoutUrl, verifyWebhook, formatUSDC } from "@etherblinks/sdk";

const url = createCheckoutUrl({
  merchant: "0x...",
  amount: "5.00",
  interval: "monthly",
});
```

---

## Getting Started

### Prerequisites

- Node.js 18+ / Bun
- A WalletConnect project ID
- Supabase project (or self-hosted Postgres)

### Quick Start

```bash
git clone https://github.com/devesh1011/EtherBlinks
cd EtherBlinks

# Frontend
cd client && cp .env.example .env.local   # fill in keys
bun install && bun run dev

# Relayer (optional — needed for subscriptions)
cd ../relayer && cp .env.example .env
bun install && bun run dev

# Contracts (optional — already deployed on Etherlink Shadownet)
cd ../contracts
npx hardhat compile
```

### Environment Variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | client | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client | Supabase public key |
| `SUPABASE_SERVICE_ROLE_KEY` | client | Supabase admin key (server-side) |
| `NEXT_PUBLIC_WALLET_CONNECT_PROJECT_ID` | client | WalletConnect integration |
| `DATABASE_URL` | relayer | Postgres connection string |
| `RELAYER_PRIVATE_KEY` | relayer | Wallet key for executing charges |

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 16, React 19, Tailwind CSS, RainbowKit, wagmi, viem |
| Smart Contracts | Solidity 0.8, Hardhat, OpenZeppelin |
| Relayer | Bun/Node, viem, pino, better-sqlite3 |
| Database | Supabase (Postgres) |
| Blockchain | Etherlink Shadownet (EVM, Chain ID 127823) |

---

## License

Apache-2.0

**Built for the Etherlink ecosystem.**
