# ShadowSight Intelligence — Frontend

> The investigator-facing web application for the ShadowSight Intelligence platform. Built with Next.js 16, TypeScript, and Tailwind CSS.

This is the frontend for [ShadowSight](https://github.com/butlerboy94/shadowsight-backend) — a professional investigation management platform for security firms, law enforcement, and intelligence analysts. It connects to the Django REST Framework backend via JWT-authenticated API calls.

---

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| Components | shadcn/ui |
| Data Fetching | TanStack Query v5 |
| HTTP Client | Axios |
| Icons | Lucide React |
| Notifications | Sonner |

---

## Features

### Dashboard Pages

| Page | Route | Description |
|------|-------|-------------|
| Overview | `/dashboard` | Summary stats across cases, evidence, and activity |
| Cases | `/dashboard/cases` | Create, view, and manage investigation cases |
| People | `/dashboard/people` | Person profiles — subjects, suspects, witnesses, victims |
| OSINT | `/dashboard/osint` | Run and review OSINT queries (email, username, domain, phone) |
| Evidence | `/dashboard/evidence` | Upload and manage digital evidence with chain-of-custody |
| Reports | `/dashboard/reports` | Generate and download branded PDF case reports |
| Watchlist | `/dashboard/watchlist` | Monitor persons or entities across cases |
| Team | `/dashboard/team` | Manage organization members and roles |
| Billing | `/dashboard/billing` | Subscription and plan management via Stripe |
| Settings | `/dashboard/settings` | User profile and account settings |

### Aura AI Assistant
- Slide-over panel accessible from the sidebar
- Multi-turn conversation with context preserved across messages
- Task-aware modes:
  - **Case Summary** — full situational briefing for a case
  - **Subject Profile** — intelligence profile for a person of interest
  - **OSINT Interpretation** — analysis of collected OSINT results
  - **Threat Assessment** — risk assessment for a watchlist target
  - **Ask a Question** — freeform Q&A about any case
- Copy-to-clipboard on any response
- Powered by the ShadowSight backend's Anthropic Claude integration

### Auth
- JWT login with automatic token refresh
- Protected routes — unauthenticated users are redirected to `/login`

### UI
- Dark theme throughout (gray-900 base, gold `#C4922A` accent)
- Responsive layout — collapsible sidebar on mobile
- Toast notifications via Sonner

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts, providers, theme
│   ├── page.tsx                # Redirects to /dashboard or /login
│   ├── globals.css
│   ├── login/                  # Login page
│   └── dashboard/
│       ├── layout.tsx          # Dashboard shell — Sidebar + TopBar
│       ├── page.tsx            # Overview / summary
│       ├── cases/
│       ├── people/
│       ├── osint/
│       ├── evidence/
│       ├── reports/
│       ├── watchlist/
│       ├── team/
│       ├── billing/
│       └── settings/
├── components/
│   ├── Sidebar.tsx             # Navigation sidebar with Aura shortcut
│   ├── TopBar.tsx              # Top bar with mobile menu toggle
│   ├── AuraPanel.tsx           # Aura AI slide-over panel
│   └── ui/                     # shadcn/ui primitives
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       ├── table.tsx
│       ├── badge.tsx
│       └── ...
├── context/
│   └── AuraContext.tsx         # Global Aura panel state
└── lib/
    ├── api.ts                  # Axios API client + all endpoint functions
    ├── auth.ts                 # JWT token storage and helpers
    └── utils.ts                # cn() and other utilities
```

---

## Getting Started

### Prerequisites
- Node.js 20+
- The [ShadowSight backend](https://github.com/butlerboy94/shadowsight-backend) running on `http://localhost:8000`

### Install and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Other commands

```bash
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint
```

---

## Environment

The API base URL is configured in `src/lib/api.ts`. By default it points to `http://localhost:8000`. To change it for a deployed backend, update that value or extract it to a `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Backend

This frontend requires the ShadowSight backend to be running. See the [backend repository](https://github.com/butlerboy94/shadowsight-backend) for setup instructions.

---

## License

MIT License — see [LICENSE](LICENSE) for details.
