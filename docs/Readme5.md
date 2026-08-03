# Chapter 21 — Authorization Domain (RBAC & Contextual Permissions)

> *"Authentication proves identity. Authorization determines responsibility."*

---

# Domain Snapshot

| Property                   | Value                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------- |
| **Domain Name**            | Authorization Domain                                                                              |
| **Domain Type**            | Supporting Domain                                                                                 |
| **Primary Responsibility** | Determine whether an authenticated user is allowed to perform an action within a specific context |
| **Primary Aggregate**      | Permission Policy                                                                                 |
| **Depends On**             | User Domain, Community Domain, Event Domain                                                       |
| **Referenced By**          | Every operational domain                                                                          |
| **Business Goal**          | Provide consistent, secure, and context-aware authorization across the entire platform            |

---

# Purpose

The Authorization Domain determines what an authenticated user is allowed to do within EventSphere.

Unlike authentication, which establishes identity, authorization evaluates responsibilities.

A user may be permitted to create an event in one community while only viewing events in another.

They may organize one event while participating in another.

Permissions therefore cannot be attached directly to users.

They must be evaluated within the appropriate operational context.

The Authorization Domain exists to perform that evaluation consistently across the platform.

---

# Business Problem

Traditional role-based systems assign one global role to every user.

Examples include:

* Admin
* Moderator
* User
* Manager

This approach works for simple applications but fails to represent real organizations.

Communities have different leadership structures.

Events assign temporary responsibilities.

Users belong to multiple organizations simultaneously.

A single global role cannot accurately describe these relationships.

EventSphere therefore adopts **contextual authorization**.

Permissions depend on where the user is operating rather than who they are globally.

---

# Design Philosophy

The Authorization Domain is built upon six architectural principles.

### Identity Does Not Grant Permission

Being a User only proves identity.

It does not automatically grant operational capabilities.

---

### Context Determines Access

Every permission evaluation occurs within a context.

Examples include:

* Platform
* Community
* Event

The same user may receive different decisions depending on the active context.

---

### Responsibility Grants Permission

Permissions are derived from responsibilities.

A President receives community management permissions because of their position.

A Volunteer receives attendance permissions because of their event assignment.

Titles exist for people.

Permissions exist for work.

---

### Least Privilege

Users should receive only the permissions required to perform their responsibilities.

Reducing unnecessary access improves both usability and security.

---

### Configurable Organizational Structures

Communities define their own leadership positions.

Authorization evaluates permissions assigned to those positions rather than relying on fixed platform roles.

---

### One Authorization Engine

Permission evaluation should occur through one centralized domain.

Operational domains never implement authorization logic independently.

This guarantees consistency throughout the platform.

---

# Core Concepts

The Authorization Domain revolves around five concepts.

## Context

Every permission belongs to a context.

Examples include:

* Platform Context
* Community Context
* Event Context

Permissions are meaningless without context.

---

## Permission

A permission represents one specific capability.

Examples include:

* Create Event
* Edit Community
* Publish Announcement
* Manage Registrations
* Mark Attendance
* Assign Volunteers
* Issue Certificates

Permissions describe actions rather than positions.

---

## Role

A role is a collection of responsibilities within a specific context.

Examples include:

* Community President
* Community Treasurer
* Event Organizer
* Volunteer
* Participant

Roles simplify permission management by grouping related capabilities.

---

## Policy

A policy determines whether a requested action should be permitted.

Policies combine:

* User identity.
* Context.
* Assigned roles.
* Requested permission.
* Business constraints.

The result is always one of two outcomes:

* Allow
* Deny

---

## Authorization Decision

Every protected operation begins with one question:

> "May this user perform this action in this context?"

The Authorization Domain produces the definitive answer.

---

# Authorization Hierarchy

Authorization follows three levels.

```text
Platform
    │
    ▼
Community
    │
    ▼
Event
```

Each level introduces additional responsibilities without replacing those inherited from higher levels.

This hierarchy mirrors the organizational structure of EventSphere.

---

# Aggregate Invariants

The Authorization Domain guarantees:

* Every permission evaluation occurs within a defined context.
* Permissions are never assigned directly to Users.
* Every authorization decision is deterministic.
* Permission names remain globally unique.
* Operational domains never bypass authorization checks.
* Deny is the default outcome unless explicitly permitted.

These invariants preserve both security and architectural consistency.

---

# Permission Evaluation Flow

Every authorization request follows the same process.

```text
Authenticated User
        │
        ▼
Determine Context
        │
        ▼
Resolve Membership
        │
        ▼
Resolve Positions
        │
        ▼
Resolve Permissions
        │
        ▼
Evaluate Policies
        │
        ▼
Allow / Deny
```

Every protected operation throughout EventSphere follows this identical evaluation model.

---

# Examples

## Example 1

User:

Arjit

Context:

APS Community

Position:

President

Requested Action:

Create Event

Decision:

✅ Allowed

---

## Example 2

User:

Arjit

Context:

IEEE Community

Position:

General Member

Requested Action:

Delete Community

Decision:

❌ Denied

---

## Example 3

User:

Arjit

Context:

Hackathon Event

Role:

Volunteer

Requested Action:

Mark Attendance

Decision:

✅ Allowed

---

## Example 4

User:

Arjit

Context:

Hackathon Event

Role:

Participant

Requested Action:

Edit Event Schedule

Decision:

❌ Denied

These examples demonstrate that permissions emerge from context rather than identity.

---

# Responsibilities

The Authorization Domain owns:

* Permission definitions.
* Policy evaluation.
* Context resolution.
* Permission inheritance.
* Authorization decisions.
* Audit of authorization failures.

It explicitly does **not** own:

* Authentication.
* User identity.
* Community membership.
* Position assignment.
* Event management.

Those belong to their respective domains.

---

# Relationships with Other Domains

The Authorization Domain collaborates with:

**User Domain**

Provides authenticated identity.

---

**Community Domain**

Provides memberships and positions.

---

**Event Domain**

Provides event-specific responsibilities.

---

**Every Operational Domain**

Consumes authorization decisions before executing business logic.

No operational domain should independently determine whether a user has access.

---

# AI Opportunities

Artificial Intelligence may assist administrators by:

* Identifying excessive permission assignments.
* Detecting unused roles.
* Suggesting permission simplification.
* Recommending organizational structures.
* Highlighting potential security risks.

AI may recommend.

Only administrators authorize.

---

# Future Scope

Future enhancements include:

* Attribute-Based Access Control (ABAC).
* Temporary permissions.
* Delegated administration.
* Approval-based workflows.
* Enterprise policy management.
* Time-bound permissions.
* Cross-community collaboration policies.

The current architecture supports these extensions without redesign.

---

# Design Decisions

Key architectural decisions include:

* Authorization is a supporting domain.
* Context is mandatory for every permission evaluation.
* Permissions belong to responsibilities rather than identities.
* Deny is the default outcome.
* Communities define organizational roles.
* Event responsibilities remain independent from community positions.
* Operational domains delegate authorization rather than implementing it themselves.

These decisions ensure scalability, consistency, and long-term maintainability.

---

# Summary

The Authorization Domain provides the security layer that enables EventSphere's flexible organizational model.

By evaluating permissions through context rather than global roles, the platform accurately reflects how real communities operate.

Users remain free to participate in multiple organizations, hold different responsibilities, and contribute to different events without creating architectural complexity.

Every future domain relies on this authorization model, making it one of the foundational pillars of the EventSphere architecture.

# Chapter 22 — Event Aggregate

> *"An event is not a registration page. It is the operational identity around which every activity is organized."*

---

# Aggregate Snapshot

| Property                   | Value                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------- |
| **Aggregate Name**         | Event                                                                                 |
| **Domain**                 | Event Management                                                                      |
| **Aggregate Type**         | Core Aggregate                                                                        |
| **Aggregate Root**         | Event                                                                                 |
| **Owned Entities**         | EventSettings, EventTimeline                                                          |
| **Value Objects**          | Location, Capacity, EventDuration                                                     |
| **Depends On**             | Community Aggregate                                                                   |
| **Referenced By**          | Session, Registration, Enrollment, Attendance, Sponsors, Announcements, Analytics, AI |
| **Primary Responsibility** | Represent the identity, configuration, and lifecycle of an event                      |

---

# Aggregate Contract

### Aggregate Root

**Event**

---

### Consistency Boundary

Everything that defines **what an event is** belongs inside this aggregate.

Everything that represents **what happens because of an event** belongs outside it.

---

### Publishes Domain Events

* EventCreated
* EventPublished
* RegistrationOpened
* RegistrationClosed
* EventCancelled
* EventCompleted
* EventArchived

---

### Consumes Domain Events

* CommunityArchived
* CommunityOwnershipTransferred (where applicable)

---

# Purpose

The Event Aggregate represents the canonical identity of an event within EventSphere.

It defines the event itself rather than the operational activities that occur around it.

The aggregate answers questions such as:

* What is this event?
* Who owns it?
* When does it occur?
* Where does it take place?
* What category does it belong to?
* Is it visible?
* What is its current lifecycle state?

The Event Aggregate intentionally avoids managing registrations, attendance, volunteers, certificates, or analytics.

Those capabilities belong to independent aggregates that reference the Event.

This separation ensures that the Event Aggregate remains cohesive, stable, and easy to evolve.

---

# Business Problem

Traditional event platforms often model every operational concern inside a single "Event" object.

As new requirements emerge, the event gradually becomes responsible for:

* Registrations.
* Payments.
* Speakers.
* Attendance.
* Certificates.
* Volunteers.
* Sponsors.
* Communication.
* Analytics.

This creates a large, tightly coupled object that is difficult to understand and expensive to modify.

EventSphere avoids this by treating the Event Aggregate as the **identity and configuration boundary** of an event.

Operational workflows build upon the Event rather than becoming part of it.

---

# Design Philosophy

The Event Aggregate follows six architectural principles.

### Identity Before Activity

The aggregate exists to define the event.

Operational activities belong to surrounding aggregates.

---

### One Community Owns Every Event

Every event belongs to exactly one community.

Ownership defines governance, permissions, branding, and long-term history.

---

### Stable Core

The aggregate changes relatively infrequently.

Registrations may change every second.

Attendance may change every minute.

The Event itself changes only when organizers intentionally modify its definition.

---

### Explicit Lifecycle

Every event progresses through a clearly defined lifecycle.

State transitions are intentional and validated.

---

### Operational Independence

Other aggregates may reference an event but never redefine it.

The Event Aggregate remains the single source of truth for event identity.

---

### Configuration Over Hardcoding

Behavior should be controlled through settings and policies rather than application logic wherever appropriate.

---

# Core Concepts

The Event Aggregate consists of four primary concepts.

## Event

The aggregate root representing a single event.

It owns the event's identity, metadata, and lifecycle.

---

## Event Settings

Defines configurable operational behaviour.

Examples include:

* Visibility
* Registration policy
* Capacity enforcement
* Waitlist support
* Certificate availability
* Feedback collection

Settings describe how the event behaves—not who participates.

---

## Event Timeline

Represents significant milestones throughout the event lifecycle.

Examples include:

* Registration opens.
* Registration closes.
* Event begins.
* Event ends.
* Certificate release.
* Feedback deadline.

The timeline provides a structured schedule for operational milestones.

---

## Event Classification

Events may be categorized using:

* Category
* Tags
* Mode (Online, Offline, Hybrid)
* Visibility (Public, Private, Invite Only)

Classification improves discovery without affecting business logic.

---

# Aggregate Structure

```text id="evtagg1"
Event
│
├── EventSettings
│
├── EventTimeline
│
├── Category (Reference)
│
└── Tags
```

Notice that participants, volunteers, sessions, and attendance are intentionally absent.

They belong to their own aggregates.

---

# Aggregate Invariants

The Event Aggregate guarantees:

* Every Event belongs to exactly one Community.
* Every Event has exactly one lifecycle state.
* An Event always has an owner Community.
* Event identity remains immutable after creation.
* Registration cannot open before the event is published.
* Archived events become read-only.
* Event settings are always internally consistent.

These invariants define the architectural guarantees of the aggregate.

---

# Business Rules

### Community Ownership

Events cannot exist independently.

Creation always occurs within a community.

---

### Immutable Identity

Core identifiers such as Event ID and owning Community cannot be modified after creation.

---

### Lifecycle Validation

Lifecycle transitions must follow approved paths.

For example:

Draft → Published → Registration Open → Registration Closed → Live → Completed → Archived

Invalid transitions are rejected.

---

### Visibility

Only published events may become publicly discoverable.

Draft events remain visible only to authorized organizers.

---

### Capacity Configuration

Capacity settings define enrollment constraints but do not manage enrollments themselves.

Enforcement occurs within the Enrollment Aggregate.

---

# Responsibilities

The Event Aggregate owns:

* Event identity.
* Metadata.
* Lifecycle.
* Configuration.
* Classification.
* Visibility.
* Timeline.
* Ownership.

It explicitly does **not** own:

* Sessions.
* Registrations.
* Enrollments.
* Attendance.
* Volunteers.
* Sponsors.
* Announcements.
* Certificates.
* Analytics.

Those domains reference the Event Aggregate instead.

---

# Relationships with Other Aggregates

The Event Aggregate serves as the operational center of the Event Management Subsystem.

It is referenced by:

* Session Aggregate.
* Registration Aggregate.
* Enrollment Aggregate.
* Attendance Aggregate.
* Volunteer Domain.
* Sponsor Domain.
* Announcement Domain.
* Analytics Domain.
* AI Assistant Domain.

None of these aggregates may alter the Event's identity.

---

# AI Opportunities

Artificial Intelligence may assist organizers by:

* Recommending event categories.
* Suggesting realistic timelines.
* Detecting scheduling conflicts.
* Proposing capacity estimates.
* Drafting event descriptions.
* Identifying missing configuration.

AI provides recommendations before the event becomes operational.

---

# Future Scope

Future enhancements may include:

* Event templates.
* Recurring events.
* Multi-day event series.
* Parent-child event hierarchies.
* Internationalization.
* Multi-venue support.
* Dynamic scheduling.

The aggregate structure intentionally allows these capabilities to be introduced without redesign.

---

# Design Decisions

The Event Aggregate reflects several key architectural decisions:

* Event is the aggregate root.
* Community owns the Event.
* Sessions are separate aggregates.
* Participation is modeled independently.
* Lifecycle is explicit.
* Identity is immutable.
* Operational behaviour is driven through configuration.

These decisions keep the aggregate cohesive and aligned with Domain-Driven Design principles.

---

# Summary

The Event Aggregate represents the permanent operational identity of every event within EventSphere.

It defines what an event **is**, not everything that happens around it.

By limiting its responsibility to identity, ownership, lifecycle, and configuration, the aggregate remains stable while allowing specialized aggregates to evolve independently.

Every registration, attendance record, announcement, volunteer assignment, and analytical insight begins by referencing the Event Aggregate.

For this reason, the Event Aggregate serves as the architectural center of the Event Management Subsystem and one of the most important consistency boundaries within the entire platform.

# Chapter 23 — Event Lifecycle

> *"Every event is a journey. The lifecycle ensures that journey is predictable, consistent, and governed by explicit business rules."*

---

# Lifecycle Snapshot

| Property                   | Value                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| **Name**                   | Event Lifecycle                                                    |
| **Owned By**               | Event Aggregate                                                    |
| **Purpose**                | Govern valid state transitions throughout the lifetime of an event |
| **Pattern**                | Finite State Machine (FSM)                                         |
| **Primary Responsibility** | Ensure operational consistency across all event phases             |

---

# Purpose

An event does not remain static throughout its existence.

It progresses through a sequence of operational stages, each representing a different phase of planning, execution, and completion.

The Event Lifecycle defines these stages and governs how an event may transition between them.

Rather than allowing arbitrary status changes, the lifecycle enforces explicit rules that ensure every event evolves in a predictable and consistent manner.

This protects the integrity of downstream domains such as Registration, Attendance, Certificates, Notifications, Analytics, and AI.

---

# Why a Lifecycle Exists

Without a formal lifecycle:

* registrations might open before an event is published,
* attendance could begin before the event starts,
* certificates might be generated before completion,
* archived events could accidentally be modified.

These situations create inconsistent operational behaviour.

The lifecycle prevents them by defining a single authoritative progression for every event.

---

# Design Philosophy

The Event Lifecycle follows five guiding principles.

### Explicit State

Every event exists in exactly one lifecycle state at any given time.

---

### Controlled Transitions

State changes are intentional and validated.

Invalid transitions are rejected.

---

### Event-Driven Behaviour

Every valid transition publishes domain events that other domains consume.

---

### Business Before Technology

States represent meaningful business phases rather than technical implementation details.

---

### Predictable Operations

Every stakeholder should understand what actions are possible based on the current lifecycle state.

---

# Lifecycle States

Every event progresses through the following primary states.

```text id="eventfsm1"
Draft
   │
   ▼
Published
   │
   ▼
Registration Open
   │
   ▼
Registration Closed
   │
   ▼
Live
   │
   ▼
Completed
   │
   ▼
Archived
```

Additional terminal state:

```text id="eventfsm2"
Cancelled
```

A cancelled event exits the normal operational flow.

---

# State Descriptions

## Draft

The event is being planned.

Visible only to authorized organizers.

Typical activities:

* Define event details.
* Configure settings.
* Build timeline.
* Invite organizers.

Registrations are not permitted.

---

## Published

The event definition is finalized and discoverable.

Participants may view the event.

Registration remains closed unless explicitly opened.

---

## Registration Open

Participants may enroll.

Operational focus shifts toward:

* participant acquisition,
* approvals,
* waitlists,
* communication.

---

## Registration Closed

No new enrollments are accepted.

The platform prepares for event execution.

Examples:

* freeze participant lists,
* finalize logistics,
* prepare attendance.

---

## Live

The event is currently taking place.

Primary activities include:

* attendance,
* volunteer coordination,
* announcements,
* operational monitoring.

---

## Completed

The event has concluded.

Operational focus shifts toward:

* certificates,
* feedback,
* reports,
* analytics,
* lessons learned.

---

## Archived

The event becomes historical.

Operational data remains accessible.

Modifications are heavily restricted.

The event now contributes primarily to organizational memory.

---

## Cancelled

Represents abnormal termination.

The platform preserves history while preventing further operational activities.

---

# Allowed State Transitions

The lifecycle permits only approved transitions.

```text id="eventfsm3"
Draft
   │
   ├────────────► Cancelled
   │
   ▼
Published
   │
   ├────────────► Cancelled
   │
   ▼
Registration Open
   │
   ▼
Registration Closed
   │
   ▼
Live
   │
   ▼
Completed
   │
   ▼
Archived
```

Backward transitions are intentionally restricted.

---

# Transition Preconditions

Every transition requires validation.

Examples include:

### Draft → Published

Requirements:

* Required metadata completed.
* Owning community exists.
* Event owner assigned.

---

### Published → Registration Open

Requirements:

* Registration settings configured.
* Timeline defined.
* Capacity established.

---

### Registration Closed → Live

Requirements:

* Event start time reached (or manual override).
* Operational readiness confirmed.

---

### Live → Completed

Requirements:

* Event officially concluded.

---

### Completed → Archived

Requirements:

* Post-event workflows finalized.

---

# Domain Events

Every transition publishes one or more domain events.

| Transition                              | Domain Event       |
| --------------------------------------- | ------------------ |
| Draft → Published                       | EventPublished     |
| Published → Registration Open           | RegistrationOpened |
| Registration Open → Registration Closed | RegistrationClosed |
| Registration Closed → Live              | EventStarted       |
| Live → Completed                        | EventCompleted     |
| Completed → Archived                    | EventArchived      |
| Any → Cancelled                         | EventCancelled     |

Other domains subscribe to these events rather than polling the Event Aggregate.

---

# Downstream Effects

Lifecycle transitions trigger behaviour throughout the platform.

Examples include:

Registration Open:

* Enrollment Aggregate begins accepting enrollments.
* Notifications announce registration.
* Analytics start tracking conversions.

Registration Closed:

* Waitlists freeze.
* Participant counts finalize.
* AI predicts attendance.

Live:

* Attendance Aggregate activates.
* Volunteer dashboards switch to execution mode.
* Operational Health begins real-time monitoring.

Completed:

* Certificates become eligible.
* Feedback opens.
* Analytics generate reports.
* AI creates event summaries.

---

# Aggregate Invariants

The Event Lifecycle guarantees:

* Every event has exactly one lifecycle state.
* Only valid transitions are permitted.
* Every transition publishes the appropriate domain events.
* Cancelled events cannot become Live.
* Archived events are immutable except for administrative corrections.

---

# AI Opportunities

Artificial Intelligence can:

* predict schedule risks,
* recommend when to open registrations,
* detect lifecycle bottlenecks,
* estimate operational readiness,
* identify missing prerequisites before transitions.

AI recommends.

Organizers approve transitions.

---

# Future Scope

Potential enhancements include:

* recurring event lifecycles,
* multi-stage conferences,
* approval workflows,
* automated transitions,
* custom lifecycle templates.

---

# Summary

The Event Lifecycle provides the operational backbone of every event within EventSphere.

By modelling event progression as a finite state machine, the platform guarantees consistent behaviour, predictable workflows, and clean integration between independent domains.

Rather than storing a simple status field, EventSphere treats lifecycle management as a first-class business capability.

Every operational workflow—from registrations to certificates—ultimately depends on this lifecycle.

# Chapter 24 — Event Workspace

> *"An event is not a page. It is a living operational workspace where people, information, decisions, and activities converge."*

---

# Workspace Snapshot

| Property                   | Value                                                        |
| -------------------------- | ------------------------------------------------------------ |
| **Concept Name**           | Event Workspace                                              |
| **Concept Type**           | Core Business Concept                                        |
| **Owned By**               | Event Management Subsystem                                   |
| **Primary Responsibility** | Provide a unified operational environment for every event    |
| **Consumers**              | Organizers, Volunteers, Participants, Sponsors, AI Assistant |
| **Nature**                 | Business Concept, not a User Interface                       |

---

# Purpose

The Event Workspace is the central operational environment for every event within EventSphere.

It brings together information from multiple domains into a single coherent experience without taking ownership of that information.

Rather than forcing organizers to switch between independent tools for registrations, volunteers, announcements, sponsors, attendance, certificates, analytics, and planning, the workspace presents a unified operational view of the event.

It serves as the **operational home** for everyone involved in the event.

---

# Business Problem

Modern event management often requires organizers to work across numerous disconnected applications.

Planning may occur in spreadsheets.

Communication happens in messaging platforms.

Registrations are managed through forms.

Attendance uses separate applications.

Certificates are generated elsewhere.

Reports are assembled manually.

Although these tools solve individual problems, they fail to create one shared operational understanding.

The Event Workspace solves this fragmentation by providing one consistent environment where every stakeholder interacts with the same event.

---

# Design Philosophy

The Event Workspace follows six guiding principles.

### One Event, One Workspace

Every event has exactly one operational workspace.

There is never ambiguity about where operational information belongs.

---

### Information Is Referenced, Not Duplicated

The workspace does not own registrations, attendance records, or announcements.

Instead, it references the authoritative information owned by other domains.

This preserves the principle of a single source of truth.

---

### Context Before Navigation

Users should think:

*"I'm working on TechFest 2027."*

Not:

*"I'm inside the Registration module."*

The workspace organizes information around the event rather than around software modules.

---

### Role-Aware Experience

Every stakeholder enters the same workspace.

However, each experiences it differently.

The organizer sees operational readiness.

The volunteer sees assigned tasks.

The participant sees schedules.

The sponsor sees partnership activities.

One workspace.

Multiple perspectives.

---

### Operational Awareness

The workspace continuously answers:

* What is happening?
* What changed?
* What requires attention?
* What happens next?

Users should rarely search for operational information.

The workspace should surface it naturally.

---

### Continuous Evolution

The workspace changes as the event progresses.

Planning.

Registration.

Execution.

Completion.

Archival.

Each phase emphasizes different operational information while preserving a consistent experience.

---

# Workspace Composition

The Event Workspace is composed of information provided by multiple domains.

```text id="workspace-map"
                 Event Workspace
                        │
 ┌──────────┬───────────┼────────────┬────────────┐
 │          │           │            │            │
 ▼          ▼           ▼            ▼            ▼
Event   Sessions   Registration  Communication  Sponsors
 │          │           │            │            │
 ▼          ▼           ▼            ▼            ▼
Attendance Certificates Analytics AI Assistant Media
```

The workspace coordinates these domains.

It does not replace them.

---

# Core Operational Areas

Every Event Workspace presents information through several operational areas.

## Overview

Provides a high-level understanding of the event.

Examples:

* Countdown
* Current lifecycle state
* Operational health
* Upcoming milestones
* Recent activity

---

## Planning

Supports preparation activities.

Examples:

* Timeline
* Tasks
* Configuration
* Scheduling
* Readiness

---

## People

Provides visibility into everyone involved.

Examples:

* Organizers
* Volunteers
* Participants
* Speakers
* Sponsors

---

## Operations

Focuses on real-time execution.

Examples:

* Attendance
* Live announcements
* Session monitoring
* Incident reporting
* Volunteer coordination

---

## Insights

Supports learning and improvement.

Examples:

* Analytics
* Feedback
* AI summaries
* Operational reports
* Lessons learned

---

# Role Perspectives

Although every user enters the same workspace, the information presented differs according to responsibility.

### Organizer Perspective

Priorities include:

* Operational readiness
* Pending approvals
* Registration progress
* Volunteer coordination
* Risks
* AI recommendations

---

### Volunteer Perspective

Focuses on:

* Assigned responsibilities
* Shift timings
* Reporting locations
* Announcements
* Checklists

---

### Participant Perspective

Provides:

* Event information
* Schedule
* Venue
* QR check-in
* Certificates
* Resources

---

### Sponsor Perspective

Highlights:

* Sponsorship deliverables
* Communication history
* Event milestones
* Visibility reports

---

# Operational Health

One defining capability of the Event Workspace is the Operational Health Panel.

Rather than requiring organizers to inspect dozens of screens, the workspace summarizes readiness using indicators such as:

* Registration Health
* Volunteer Readiness
* Communication Status
* Attendance Preparedness
* Sponsor Progress
* Session Readiness
* Documentation Completeness

This panel acts as the heartbeat of the event.

---

# AI as a Workspace Companion

Artificial Intelligence exists inside the workspace—not beside it.

Examples include:

* "Registration growth has slowed by 18% this week."
* "Volunteer assignments overlap during Session 3."
* "Certificates can now be released."
* "Sponsor follow-up is overdue."
* "Feedback suggests improving check-in efficiency."

AI contributes awareness without interrupting workflows.

It operates as an operational advisor rather than a chatbot.

---

# Workspace Timeline

The workspace naturally changes emphasis throughout the event lifecycle.

```text id="workspace-lifecycle"
Planning
    │
    ▼
Registration
    │
    ▼
Preparation
    │
    ▼
Live Operations
    │
    ▼
Post-Event Review
    │
    ▼
Historical Archive
```

The workspace evolves while maintaining a consistent mental model for users.

---

# Aggregate Invariants

The Event Workspace guarantees:

* Every event has exactly one workspace.
* Every workspace references one Event Aggregate.
* Operational information is never duplicated.
* Every domain remains the owner of its own data.
* Every user views the workspace through role-specific permissions.
* The workspace always reflects the current lifecycle state of the event.

---

# Future Scope

Future enhancements may include:

* Real-time collaborative planning.
* Integrated chat.
* Interactive operational maps.
* AI-generated operational playbooks.
* Predictive readiness scoring.
* Cross-event dashboards.
* Mobile-first operational mode.

---

# Design Decisions

The Event Workspace reflects several intentional architectural decisions.

* It is a business concept, not a UI.
* It references domains rather than owning them.
* It adapts to lifecycle changes.
* It provides role-aware perspectives.
* It centralizes operational awareness.
* It becomes the digital twin of the physical event.

These decisions preserve modularity while delivering a unified user experience.

---

# Summary

The Event Workspace is the operational heart of EventSphere.

It unifies planning, communication, execution, analytics, and Artificial Intelligence into one coherent environment while preserving clear ownership boundaries between domains.

Every stakeholder interacts with the same event through a perspective appropriate to their responsibilities.

The result is not merely an event dashboard.

It is a living operational workspace that evolves alongside the event itself.

Every future screen, mobile experience, API, and AI interaction should be understood as one interface into this shared workspace.

# Chapter 25 — Session Aggregate

> *"Events define the experience. Sessions deliver the experience."*

---

# Aggregate Snapshot

| Property                   | Value                                                  |
| -------------------------- | ------------------------------------------------------ |
| **Aggregate Name**         | Session                                                |
| **Domain**                 | Event Management                                       |
| **Aggregate Type**         | Supporting Aggregate                                   |
| **Aggregate Root**         | Session                                                |
| **Owned Entities**         | SessionSchedule, SessionResources                      |
| **Value Objects**          | TimeSlot, RoomAssignment                               |
| **Depends On**             | Event Aggregate                                        |
| **Referenced By**          | Attendance, Volunteers, Feedback, Analytics, AI        |
| **Primary Responsibility** | Represent a scheduled operational unit within an event |

---

# Aggregate Contract

### Aggregate Root

**Session**

---

### Consistency Boundary

The Session Aggregate owns everything required to define and operate a single session.

It does **not** own event identity, participant enrollments, attendance records, or certificates.

---

### Publishes Domain Events

* SessionCreated
* SessionUpdated
* SessionStarted
* SessionCompleted
* SessionCancelled
* SpeakerAssigned
* RoomChanged

---

### Consumes Domain Events

* EventPublished
* EventCompleted
* EventArchived

---

# Purpose

A Session represents a single scheduled activity that occurs within an event.

Examples include:

* Keynote
* Workshop
* Coding Contest
* Technical Talk
* Panel Discussion
* Networking Session
* Cultural Performance
* Closing Ceremony

Although every session belongs to an event, each session has its own schedule, operational requirements, resources, and lifecycle.

The Session Aggregate models these concerns independently while maintaining a clear relationship with the parent Event.

---

# Business Problem

Large events consist of many independent activities.

Treating all of them as properties of the Event Aggregate creates excessive complexity.

Different sessions may:

* occur simultaneously,
* use different rooms,
* have different capacities,
* require different volunteers,
* host different speakers,
* maintain separate attendance.

The Session Aggregate isolates these operational concerns while allowing the Event Aggregate to remain focused on event identity and governance.

---

# Design Philosophy

The Session Aggregate follows six architectural principles.

### Sessions Are Independent Operational Units

Each session is planned, executed, and evaluated independently.

---

### Every Session Belongs to One Event

Sessions cannot exist without an Event.

However, they remain separate aggregates with independent consistency boundaries.

---

### Time Is a First-Class Concept

Scheduling is central to the Session Aggregate.

Every session has a clearly defined time window.

---

### Operational Readiness Matters

A session is more than a schedule.

It requires speakers, rooms, resources, volunteers, and preparation.

---

### Independent Lifecycle

Sessions progress through their own lifecycle without changing the Event lifecycle.

A delayed session does not redefine the Event Aggregate.

---

### Minimize Aggregate Size

The Session Aggregate owns only the information necessary for a single scheduled activity.

Operational data such as attendance and feedback remain external.

---

# Core Concepts

The Session Aggregate consists of four primary concepts.

## Session

The aggregate root representing one scheduled activity.

---

## Session Schedule

Defines:

* Start time
* End time
* Duration
* Time zone

---

## Room Assignment

Represents where the session occurs.

Examples:

* Auditorium A
* Seminar Hall 2
* Online Meeting Link
* Hybrid Venue

---

## Resources

Supporting materials required for the session.

Examples:

* Presentation slides
* Workshop documents
* Software requirements
* External links

---

# Aggregate Structure

```text id="sessionagg1"
Session
│
├── SessionSchedule
│
├── RoomAssignment
│
└── SessionResources
```

Speakers, attendance, volunteers, and feedback reference the Session Aggregate rather than being owned by it.

---

# Aggregate Invariants

The Session Aggregate guarantees:

* Every Session belongs to exactly one Event.
* Every Session has one schedule.
* A Session cannot exist without an Event.
* Session identity is immutable.
* Start time always precedes end time.
* Archived sessions become read-only.

---

# Session Lifecycle

Each Session follows its own operational lifecycle.

```text id="sessionfsm"
Draft
   │
   ▼
Scheduled
   │
   ▼
Ready
   │
   ▼
Live
   │
   ▼
Completed
```

Exceptional terminal state:

```text
Cancelled
```

This lifecycle is independent of the Event lifecycle while remaining constrained by it.

---

# Business Rules

### Event Dependency

Sessions may only be created for existing events.

---

### Schedule Validation

The platform validates:

* valid duration,
* chronological order,
* optional room conflicts.

---

### Immutable Identity

Session ID and parent Event ID cannot be modified after creation.

---

### Resource Consistency

Resources belong exclusively to one Session.

---

### Lifecycle Dependency

A Session cannot enter the **Live** state unless its parent Event is also **Live**.

---

# Responsibilities

The Session Aggregate owns:

* Session identity.
* Schedule.
* Duration.
* Room assignment.
* Resources.
* Session metadata.
* Session lifecycle.

It explicitly does **not** own:

* Event definition.
* Registrations.
* Attendance.
* Certificates.
* Volunteer assignments.
* Feedback records.
* Analytics.

Those domains reference the Session Aggregate.

---

# Relationships with Other Aggregates

The Session Aggregate is referenced by:

* Attendance Aggregate.
* Volunteer Domain.
* Feedback Domain.
* Analytics Domain.
* AI Assistant Domain.
* Notification Domain.

It references:

* Event Aggregate.

This creates a clean one-way dependency.

---

# AI Opportunities

Artificial Intelligence may assist by:

* detecting schedule conflicts,
* recommending optimal session durations,
* predicting attendance,
* suggesting room allocations,
* optimizing timetable layouts,
* identifying overloaded speakers.

AI supports scheduling decisions without replacing organizers.

---

# Future Scope

Potential enhancements include:

* Parallel session tracks.
* Session series.
* Breakout rooms.
* Live streaming integration.
* Dynamic room reassignment.
* Interactive agendas.
* Multi-language sessions.

The aggregate is intentionally designed to support these capabilities.

---

# Why This Is an Aggregate

The Session Aggregate protects one consistency boundary:

**Everything required to define and operate a single scheduled activity.**

It intentionally excludes attendance, volunteers, and feedback because those concepts evolve independently and would unnecessarily increase transactional complexity.

Separating the Session Aggregate from the Event Aggregate keeps both aggregates cohesive, scalable, and aligned with Domain-Driven Design principles.

---

# Design Decisions

Key architectural decisions include:

* Session is a separate aggregate.
* Event references Sessions logically rather than owning them transactionally.
* Scheduling is a first-class responsibility.
* Operational execution occurs around Sessions.
* Attendance and Feedback remain external.
* AI consumes Session context without modifying Session identity.

---

# Summary

The Session Aggregate represents the fundamental unit of execution within EventSphere.

While the Event Aggregate defines the identity and governance of an event, the Session Aggregate defines the individual experiences that participants attend.

This separation keeps aggregate boundaries small, enables independent evolution, and provides the architectural foundation for attendance, volunteer coordination, scheduling, analytics, and AI-powered operational intelligence.