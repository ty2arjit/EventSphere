# EventSphere — High-Level System Design & Technology Stack

**Status:** Authoritative for implementation. Sits below the Canonical Architecture Specification and the AI Engineering Constitution in the document hierarchy — this document decides *how* the confirmed architecture is built, not *what* the architecture is.

**Document Hierarchy** (unchanged):
1. Canonical Architecture Specification — Primary Technical Reference
2. AI Engineering Constitution — Engineering Rules & Cognitive Protocol
3. System Design Bible (Readme1–10) — Business Vision & Architectural Rationale

This System Design document, and the Implementation Roadmap, both operate underneath all three.

---

## Architectural Principles

- Domain-Driven Design (DDD)
- Clean Architecture
- CQRS (Read/Write Separation)
- Event-Driven Communication
- Modular Monolith (initial architecture, microservice-ready by design)
- Domain Events
- Repository Pattern
- Aggregate Root Pattern
- Rich Domain Model
- API-First Design

The architecture is intentionally designed so the modular monolith can later evolve into microservices without requiring changes to the business model.

## Overall Architecture

```text
                    React + Next.js
                           │
                           ▼
                 Presentation Layer
                           │
                           ▼
                Application Layer (Use Cases)
                           │
                           ▼
                    Domain Layer (DDD)
                           │
                           ▼
              Infrastructure Layer
         (Database, Storage, External APIs)
```

Business rules always flow inward. Infrastructure never owns business logic.

---

## Frontend

| Concern | Choice |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| State Management | TanStack Query; React Context (lightweight global UI state only) |
| Forms | React Hook Form + Zod |
| Tables | TanStack Table |
| Charts | Recharts |
| Icons | Lucide React |
| Authentication Client | JWT via HTTP-only cookies |

### Frontend Structure

Governed by **Canonical Architecture Specification §7.5**. Summary:

```text
apps/web/
├── app/         # routing + composition only
├── features/    # one module per bounded context, canonical names, public index.ts
├── lib/         # context-agnostic infrastructure (transport, utils)
└── components/  # truly shared UI (shadcn primitives, layout, common)
```

Four binding rules (full detail in §7.5):
1. `features/*` names match canonical bounded-context names **exactly** — no aliases, abbreviations, or plurals. Route segments may differ; feature names may not.
2. `lib/` is strictly infrastructure. If a file cannot be described without naming a bounded context, it belongs in that context's feature module. `lib/auth/` is prohibited — it would compete with `features/authentication/`.
3. Composite Product Experiences (§4) are assembled in `app/` from feature public interfaces; they own no business logic and create no new ownership boundary.
4. `lib/api/types.ts` holds transport primitives only; endpoint models live in `features/<context>/types/`.

Each feature's `index.ts` is its published interface — the frontend equivalent of bounded-context isolation (Constitution Article 12). Importing from a feature's internals is a violation.

## Backend

| Concern | Choice |
|---|---|
| Runtime | Node.js |
| Framework | Express.js |
| Language | TypeScript |
| Architecture | Modular Monolith — every bounded context becomes an independent module |

### Per-Module Structure

```text
module/
    controller/
    application/
    domain/
    repository/
    infrastructure/
    dto/
    mapper/
    routes/
    validators/
```

This is a compatible refinement of Section 7 (Canonical Folder Structure) in the Canonical Architecture Specification — Section 7's `api/` folder is broken down here into `controller/`, `routes/`, `dto/`, `mapper/`, and `validators/` for implementation-level granularity. Treated as an implementation detail layered on top of the frozen Specification, not a formal amendment to it.

### Domain Layer Rules

Every bounded context owns its Aggregates, Entities, Value Objects, Domain Services, Repository Interfaces, and Domain Events.

No framework code exists here: no Prisma, no Express, no HTTP, no React. Pure business logic only. (Constitution Article 11.)

---

## Database

| Concern | Choice |
|---|---|
| Primary Database | PostgreSQL |
| ORM | Prisma ORM |

**Rules:** Prisma is accessed only through repositories. Repositories are the only persistence boundary. Controllers never access Prisma. Application Services never access Prisma directly. (Constitution Articles 16, 21, 22.)

## Authentication & Authorization

- **Authentication:** JWT access tokens, refresh tokens, HTTP-only cookies.
- **Authorization:** `PermissionPolicy` aggregate (Canonical Architecture Specification, Section 2.1.1). RBAC implemented through the Authorization Domain.
- Authentication, Authorization, and Profile remain three separate bounded contexts (Specification, Section 1.1).

## Storage

| Concern | Choice |
|---|---|
| Media | Cloudinary (or equivalent object storage) |
| Documents | Cloudinary / S3-compatible storage |

The database stores metadata only — binary files never live inside PostgreSQL.

**Scope note:** This infrastructure is needed in MVP for `AnnouncementAttachment` (Announcement Domain, in scope per Roadmap Section 0.1) — images, PDFs, and documents attached to announcements. It is not, by itself, a signal that Content Domain (deferred per Roadmap Section 0.3) is back in scope. The Canonical Architecture Specification (Section 4.9) already flags a future overlap between `AnnouncementAttachment` and Content Domain to be reconciled once Content Domain is fully modeled — this remains an open item for that future work, not something resolved here.

## AI Layer

| Concern | Choice |
|---|---|
| LLM | Gemini API |

**Purpose (matches AI Assistant v0.1 scope, Roadmap Section 0.2):** event summaries, registration insights, attendance insights, analytics explanations, recommendation generation.

The AI never owns business rules. It only consumes domain data and generates recommendations. All business decisions remain inside the Domain Layer.

## Analytics

Event-driven. Business domains publish Domain Events; Analytics consumes them. Analytics never writes into business aggregates and remains strictly read-only.

## Communication

- **Announcement Domain** owns: announcement lifecycle, scheduling, audience selection.
- **Notification Domain** owns: email, push notifications, in-app notifications, delivery tracking.

Announcement decides *what*. Notification decides *how*.

## CQRS

- **Write Side:** Aggregates, Repositories, Application Services.
- **Read Side:** Read Models, Dashboard Projections, Analytics Views, Composite Product Experiences.

Read Models may combine multiple bounded contexts. Write Models never cross aggregate boundaries.

## Event Bus

Business domains communicate through Domain Events. Events represent facts, never commands.

Examples (from the Canonical Architecture Specification's Domain Event Catalog, Section 6.1): `EventPublished`, `RegistrationOpened`, `EnrollmentConfirmed`, `AttendanceRecorded`, `CertificateIssued`.

Every event has exactly one publisher. Events are immutable.

## Caching

Redis, used for: session caching, frequently accessed read models, rate limiting, temporary verification data.

Redis is not the source of truth. PostgreSQL remains authoritative.

## Search

Search will become its own bounded context in a future iteration (Canonical Architecture Specification, Section 1.2 — Future Candidate). Initial MVP uses PostgreSQL full-text search rather than inventing the Search Domain prematurely. Dedicated search infrastructure can be introduced later if necessary.

## Deployment

| Concern | Choice |
|---|---|
| Frontend | Vercel |
| Backend | Railway / Render / Docker |
| Database | Neon PostgreSQL |
| Storage | Cloudinary |
| Monitoring | OpenTelemetry, Grafana, Prometheus |
| Logging | Winston / Pino |

## API Design

REST APIs, JSON, versioned endpoints: `/api/v1/`.

DTOs are mandatory. Database models are never exposed directly. (Constitution Articles 21, 22.)

---

## Development Rules

Follow the document hierarchy in priority order:
1. Canonical Architecture Specification
2. AI Engineering Constitution
3. System Design Bible

If any implementation conflicts with these documents: **stop, raise the issue.** Do not invent architecture. Do not simplify bounded contexts. Do not merge aggregates. Do not introduce new architectural concepts without explicit approval.

## Implementation Philosophy

Per bounded context / aggregate, implementation proceeds layer by layer:

1. Domain
2. Repository
3. Application Service
4. Controller
5. API
6. Frontend
7. Testing

Never begin from the frontend. Always model the business first.

The architecture is considered stable. The objective is implementation — not architectural redesign.
