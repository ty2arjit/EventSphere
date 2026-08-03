# Chapter 26 — Registration Aggregate

> *"Registration defines the rules of participation. Enrollment represents participation itself."*

---

# Aggregate Snapshot

| Property                   | Value                                                    |
| -------------------------- | -------------------------------------------------------- |
| **Aggregate Name**         | Registration                                             |
| **Domain**                 | Participation Management                                 |
| **Aggregate Type**         | Core Aggregate                                           |
| **Aggregate Root**         | Registration                                             |
| **Owned Entities**         | RegistrationForm, RegistrationQuestion, RegistrationRule |
| **Value Objects**          | RegistrationWindow, CapacityPolicy, ApprovalPolicy       |
| **Depends On**             | Event Aggregate                                          |
| **Referenced By**          | Enrollment Aggregate                                     |
| **Primary Responsibility** | Define how participants may enroll in an event           |

---

# Aggregate Contract

### Aggregate Root

**Registration**

---

### Consistency Boundary

The Registration Aggregate owns every policy governing participant enrollment.

It does **not** own participant applications or enrollment records.

---

### Publishes Domain Events

* RegistrationCreated
* RegistrationOpened
* RegistrationClosed
* RegistrationUpdated
* CapacityReached

---

### Consumes Domain Events

* EventPublished
* EventArchived
* EventCancelled

---

# Purpose

The Registration Aggregate defines the complete registration process for an event.

It specifies:

* when registration opens,
* when it closes,
* who is eligible,
* what information applicants must provide,
* how applications are evaluated,
* whether approvals are required,
* how participant capacity is managed.

The aggregate represents **the registration policy**, not the participants.

It answers the question:

> **"How can someone join this event?"**

---

# Business Problem

Many systems combine registration configuration and participant applications within the same model.

As participation grows, this leads to:

* duplicated configuration,
* inconsistent business rules,
* difficult approval workflows,
* unnecessary coupling.

EventSphere separates policy from participation.

One Registration Aggregate governs potentially thousands of independent Enrollment Aggregates.

This separation significantly improves scalability and maintainability.

---

# Design Philosophy

The Registration Aggregate follows six guiding principles.

### Policy Before Participation

Registration defines the process.

Enrollments follow the process.

---

### One Registration Per Event

Every event owns exactly one Registration Aggregate.

That aggregate governs every participant.

---

### Configurable Workflows

Different events require different registration experiences.

Some accept everyone.

Some require approvals.

Some operate on invitation only.

Configuration should replace hardcoded behaviour.

---

### Dynamic Forms

Registration forms should adapt to event requirements.

Questions belong to the Registration Aggregate rather than being embedded within enrollments.

---

### Capacity Is Policy

Capacity constraints describe admission rules.

Actual occupied seats are tracked through enrollments.

---

### Stable Configuration

Registration configuration changes infrequently.

Participant enrollments change continuously.

Separating these responsibilities keeps the aggregate cohesive.

---

# Core Concepts

The Registration Aggregate consists of four primary concepts.

---

## Registration

The aggregate root.

Represents the complete enrollment policy for one event.

---

## Registration Form

Defines the participant application form.

The form contains one or more registration questions.

---

## Registration Question

Represents one item within the registration form.

Examples include:

* Name
* Roll Number
* Resume Upload
* Department
* Team Preference
* Experience Level
* Motivation Statement

Questions remain reusable across all participant enrollments.

---

## Registration Rules

Defines business constraints.

Examples include:

* Eligibility
* Team size
* Capacity
* Registration window
* Approval strategy
* Waitlist support

---

# Aggregate Structure

```text id="regagg"
Registration
│
├── RegistrationForm
│
├── RegistrationQuestion
│
└── RegistrationRules
```

Enrollments intentionally remain outside the aggregate.

---

# Aggregate Invariants

The Registration Aggregate guarantees:

* Every Event has at most one Registration Aggregate.
* Registration belongs to exactly one Event.
* Registration questions belong to exactly one Registration Form.
* Registration windows never overlap within the same event.
* Registration cannot open before the Event is published.
* Capacity policies remain internally consistent.
* Archived registrations become immutable.

---

# Business Rules

### Registration Window

Applications are accepted only while registration remains open.

---

### Approval Strategy

Supported strategies include:

* Automatic approval
* Manual approval
* Invitation only

The Registration Aggregate defines the strategy.

Enrollment executes it.

---

### Capacity Management

Registration defines:

* maximum capacity,
* waitlist availability,
* overflow behaviour.

Actual seat allocation belongs to the Enrollment Aggregate.

---

### Dynamic Questions

Questions may be:

* required,
* optional,
* multiple choice,
* file upload,
* text,
* numeric,
* date,
* custom validation.

---

### Eligibility Rules

Registration may restrict participation based on configurable criteria such as:

* institution,
* academic year,
* department,
* team composition,
* invitation status.

---

# Responsibilities

The Registration Aggregate owns:

* Registration configuration.
* Registration form.
* Questions.
* Eligibility rules.
* Registration window.
* Capacity policy.
* Approval strategy.

It explicitly does **not** own:

* Participant applications.
* Approval decisions.
* Waitlist entries.
* Attendance.
* Certificates.

Those responsibilities belong elsewhere.

---

# Relationships with Other Aggregates

The Registration Aggregate references:

* Event Aggregate.

It is referenced by:

* Enrollment Aggregate.
* Notification Domain.
* Analytics Domain.
* AI Assistant Domain.

This creates a clear separation between policy and execution.

---

# AI Opportunities

Artificial Intelligence may assist organizers by:

* recommending registration deadlines,
* suggesting better form design,
* identifying unnecessary questions,
* estimating capacity,
* predicting registration demand,
* optimizing approval workflows.

AI improves configuration quality rather than participant evaluation.

---

# Future Scope

Future enhancements include:

* conditional questions,
* multilingual forms,
* reusable registration templates,
* adaptive forms,
* AI-generated registration forms,
* organization-wide templates.

The aggregate is intentionally designed to support these capabilities.

---

# Why This Is an Aggregate

The Registration Aggregate protects one consistency boundary:

**Everything required to define how participation works for an event.**

Participant applications evolve independently and may number in the thousands.

Including them inside the Registration Aggregate would unnecessarily increase transactional complexity and violate aggregate design principles.

By separating configuration from participation, EventSphere achieves a cleaner, more scalable architecture.

---

# Design Decisions

Key architectural decisions include:

* Registration is configuration.
* Enrollment is participation.
* Dynamic forms belong to Registration.
* Capacity is defined here but enforced elsewhere.
* Approval strategy belongs here.
* Registration owns policy—not applicants.

These decisions create a clear distinction between business configuration and operational execution.

---

# Summary

The Registration Aggregate defines the complete policy governing participant admission into an event.

Rather than storing participant applications directly, it establishes the rules, forms, timelines, and constraints that every Enrollment Aggregate must follow.

This separation allows EventSphere to support complex registration workflows while preserving clear aggregate boundaries and long-term maintainability.

# Chapter 27 — Enrollment Aggregate

> *"Registration defines how people may participate. Enrollment records that a specific person has chosen to participate."*

---

# Aggregate Snapshot

| Property                   | Value                                                   |
| -------------------------- | ------------------------------------------------------- |
| **Aggregate Name**         | Enrollment                                              |
| **Domain**                 | Participation Management                                |
| **Aggregate Type**         | Core Aggregate                                          |
| **Aggregate Root**         | Enrollment                                              |
| **Owned Entities**         | EnrollmentResponse, EnrollmentApproval                  |
| **Value Objects**          | EnrollmentStatus, TeamReference                         |
| **Depends On**             | Registration Aggregate, User Aggregate, Event Aggregate |
| **Referenced By**          | Attendance, Certificate, Feedback, Analytics, AI        |
| **Primary Responsibility** | Represent one participant's relationship with an event  |

---

# Aggregate Contract

### Aggregate Root

**Enrollment**

---

### Consistency Boundary

The Enrollment Aggregate owns everything related to one participant's admission into one event.

It does **not** own registration policies, attendance records, certificates, or feedback.

---

### Publishes Domain Events

* EnrollmentStarted
* EnrollmentSubmitted
* EnrollmentApproved
* EnrollmentRejected
* EnrollmentCancelled
* EnrollmentConfirmed
* WaitlistPromoted

---

### Consumes Domain Events

* RegistrationOpened
* RegistrationClosed
* EventCancelled

---

# Purpose

The Enrollment Aggregate represents the relationship between one User and one Event under a specific Registration policy.

It records the participant's application, responses, approval status, confirmation, and eventual participation journey.

Every participant has an independent Enrollment Aggregate.

This allows thousands of participants to progress through different admission states without affecting the Registration Aggregate.

The Enrollment Aggregate answers one question:

> **"What is this participant's current relationship with this event?"**

---

# Business Problem

Many event systems combine registration configuration and participant records into one model.

As events become more sophisticated—with approvals, waitlists, teams, and confirmations—this creates unnecessary complexity.

EventSphere separates these concerns.

The Registration Aggregate defines **the rules**.

The Enrollment Aggregate records **the individual's journey through those rules**.

This separation enables flexible admission workflows while preserving clean aggregate boundaries.

---

# Design Philosophy

The Enrollment Aggregate follows six guiding principles.

### One Enrollment, One Participant

Each Enrollment represents exactly one User participating in exactly one Event.

---

### Policy Drives Enrollment

The Enrollment Aggregate follows the rules defined by the Registration Aggregate.

It never defines those rules itself.

---

### Independent Lifecycle

Every participant progresses independently.

Approving one enrollment has no effect on another.

---

### Participant-Centric

The aggregate models the participant's journey rather than the organizer's configuration.

---

### Immutable History

State transitions are recorded rather than overwritten where appropriate.

Operational history should remain auditable.

---

### Foundation for Participation

Attendance, certificates, feedback, and analytics all build upon the Enrollment Aggregate.

---

# Core Concepts

The Enrollment Aggregate consists of four primary concepts.

---

## Enrollment

The aggregate root.

Represents one participant's relationship with one event.

---

## Enrollment Response

Stores answers submitted through the Registration Form.

Responses reference Registration Questions rather than duplicating them.

---

## Enrollment Approval

Represents organizer decisions.

Examples include:

* Approved
* Rejected
* Waitlisted

Approval metadata includes reviewer, timestamp, and optional remarks.

---

## Team Reference

Where applicable, an Enrollment may reference a Team entity rather than storing team information directly.

This keeps the aggregate focused while supporting team-based events.

---

# Aggregate Structure

```text
Enrollment
│
├── EnrollmentResponse
│
├── EnrollmentApproval
│
└── TeamReference
```

Attendance, Certificates, and Feedback intentionally remain outside this aggregate.

---

# Enrollment Lifecycle

Each Enrollment progresses through its own lifecycle.

```text
Started
    │
    ▼
Submitted
    │
    ▼
Under Review
    │
 ┌──┴────────────┐
 ▼               ▼
Approved     Rejected
    │
    ▼
Confirmed
    │
    ▼
Checked In
    │
    ▼
Completed
```

Alternative paths include:

* Withdrawn
* Waitlisted
* Promoted from Waitlist

The lifecycle reflects the participant's journey rather than the Event lifecycle.

---

# Aggregate Invariants

The Enrollment Aggregate guarantees:

* Every Enrollment belongs to exactly one User.
* Every Enrollment belongs to exactly one Event.
* Every Enrollment references one Registration policy.
* A User may have at most one active Enrollment for a given Event.
* Enrollment responses always correspond to valid Registration Questions.
* Enrollment history is preserved.
* Enrollment identity is immutable.

---

# Business Rules

### Registration Window

Enrollments may only be submitted while Registration is open unless explicitly overridden by administrators.

---

### Approval

Approval decisions follow the strategy defined by the Registration Aggregate.

Examples:

* Automatic.
* Manual.
* Invitation only.

---

### Waitlist

If capacity has been reached and waitlists are enabled, new enrollments enter the Waitlisted state.

Promotion from the waitlist follows organizer actions or future automated policies.

---

### Withdrawal

Participants may withdraw before configurable deadlines.

Withdrawal preserves historical records while releasing capacity where appropriate.

---

### Confirmation

Certain events may require participants to confirm attendance after approval.

Confirmation is independent of approval.

---

# Responsibilities

The Enrollment Aggregate owns:

* Participant relationship.
* Application responses.
* Approval state.
* Confirmation.
* Waitlist status.
* Enrollment history.

It explicitly does **not** own:

* Registration configuration.
* Attendance.
* Certificates.
* Feedback.
* Analytics.

Those domains reference the Enrollment Aggregate.

---

# Relationships with Other Aggregates

The Enrollment Aggregate references:

* User Aggregate.
* Event Aggregate.
* Registration Aggregate.

It is referenced by:

* Attendance Aggregate.
* Certificate Aggregate.
* Feedback Domain.
* Analytics Domain.
* AI Assistant Domain.

This makes Enrollment the central participation aggregate.

---

# AI Opportunities

Artificial Intelligence may assist organizers by:

* identifying incomplete applications,
* prioritizing manual reviews,
* detecting duplicate enrollments,
* estimating confirmation rates,
* predicting no-shows,
* recommending waitlist promotions.

AI supports decision-making while preserving organizer control.

---

# Future Scope

Potential enhancements include:

* Team enrollments.
* Invitation codes.
* Multi-stage admission workflows.
* Rolling admissions.
* Payment integration.
* Digital consent forms.
* Parent/guardian approvals for specific events.

The aggregate is intentionally designed to support these capabilities.

---

# Why This Is an Aggregate

The Enrollment Aggregate protects one consistency boundary:

**Everything required to manage one participant's admission into one event.**

Participant-specific state changes frequently and independently.

Keeping enrollments outside the Registration Aggregate prevents large transactions, improves scalability, and accurately models real-world participation.

This aggregate forms the operational bridge between event configuration and actual event participation.

---

# Design Decisions

Key architectural decisions include:

* Registration defines policy.
* Enrollment records participation.
* Every participant owns an independent Enrollment Aggregate.
* Attendance builds upon Enrollment rather than User directly.
* Team support references external aggregates.
* Approval and confirmation are separate concepts.

These decisions create a scalable, participant-centric architecture that supports simple workshops and complex conferences alike.

---

# Summary

The Enrollment Aggregate represents the beginning of a participant's operational journey within EventSphere.

It transforms registration rules into individual participation records while preserving independence between participants.

By modeling enrollment as its own aggregate with a dedicated lifecycle, EventSphere supports approvals, waitlists, confirmations, and future participation workflows without increasing the complexity of the Registration Aggregate.

Every subsequent participation capability—attendance, certificates, feedback, analytics, and AI insights—builds upon this foundation.

# Chapter 28 — Attendance Aggregate

> *"Enrollment represents the intention to participate. Attendance records actual participation."*

---

# Aggregate Snapshot

| Property                   | Value                                                         |
| -------------------------- | ------------------------------------------------------------- |
| **Aggregate Name**         | Attendance                                                    |
| **Domain**                 | Participation Management                                      |
| **Aggregate Type**         | Core Aggregate                                                |
| **Aggregate Root**         | Attendance                                                    |
| **Owned Entities**         | AttendanceRecord, AttendanceVerification                      |
| **Value Objects**          | AttendanceStatus, CheckInTime, CheckOutTime                   |
| **Depends On**             | Enrollment Aggregate, Session Aggregate                       |
| **Referenced By**          | Certificate, Analytics, AI                                    |
| **Primary Responsibility** | Record and verify actual participation in an event or session |

---

# Aggregate Contract

### Aggregate Root

**Attendance**

---

### Consistency Boundary

The Attendance Aggregate owns the verified record of participation for one Enrollment.

It does **not** own QR codes, scanners, biometric devices, or other capture technologies.

---

### Publishes Domain Events

* AttendanceRecorded
* AttendanceUpdated
* AttendanceVerified
* AttendanceCompleted

---

### Consumes Domain Events

* EnrollmentConfirmed
* SessionStarted
* SessionCompleted
* EventCompleted

---

# Purpose

The Attendance Aggregate represents the verified participation of an enrolled participant.

Unlike Enrollment, which records the participant's admission into an event, Attendance records whether the participant actually engaged with the event or its sessions.

Attendance therefore becomes the authoritative source for operational participation.

Every Attendance Aggregate belongs to exactly one Enrollment.

This relationship preserves the complete participation journey:

Registration → Enrollment → Attendance → Certificate.

---

# Business Problem

Many systems model attendance as a simple boolean field attached to a participant.

This approach cannot accurately represent real-world scenarios such as:

* Multiple check-ins.
* Session-specific attendance.
* Partial participation.
* Manual verification.
* Hybrid events.
* Different attendance capture methods.

The Attendance Aggregate isolates participation tracking into its own consistency boundary, allowing attendance workflows to evolve independently from enrollment and event configuration.

---

# Design Philosophy

The Attendance Aggregate follows six guiding principles.

### Participation Over Presence

Attendance measures meaningful participation rather than merely physical presence.

---

### Enrollment First

Attendance always belongs to an Enrollment—not directly to a User.

Participation cannot exist without an accepted enrollment.

---

### Capture Method Independence

Attendance is independent of how participation is recorded.

QR codes, NFC, manual entry, biometrics, and future technologies are all infrastructure concerns.

The Attendance Aggregate records the outcome, not the mechanism.

---

### Session Awareness

Attendance may be recorded for:

* Entire events.
* Individual sessions.
* Specific operational activities.

This flexibility supports workshops, conferences, festivals, and multi-track events.

---

### Verification Matters

Attendance records should be verifiable and auditable.

Verification improves trust for certificates and analytics.

---

### Foundation for Recognition

Certificates, engagement metrics, and participation history all depend upon verified attendance.

---

# Core Concepts

The Attendance Aggregate consists of three primary concepts.

---

## Attendance

The aggregate root.

Represents one enrollment's participation record.

---

## Attendance Record

Captures operational participation.

Examples include:

* Check-in.
* Check-out.
* Session attendance.
* Manual adjustments.

---

## Attendance Verification

Represents confidence that participation has been validated.

Examples include:

* Automatically verified.
* Organizer verified.
* Pending verification.

---

# Aggregate Structure

```text id="attendanceagg"
Attendance
│
├── AttendanceRecord
│
└── AttendanceVerification
```

Capture technologies remain outside the aggregate.

---

# Aggregate Invariants

The Attendance Aggregate guarantees:

* Every Attendance belongs to exactly one Enrollment.
* Attendance cannot exist without Enrollment.
* Attendance status always reflects verified participation.
* Check-out cannot occur before check-in.
* Archived attendance records remain immutable.
* Attendance history is preserved.

---

# Attendance Lifecycle

```text id="attendancefsm"
Not Recorded
      │
      ▼
Checked In
      │
      ▼
In Progress
      │
      ▼
Completed
```

Alternative paths include:

* Absent
* Cancelled
* Invalidated

The lifecycle reflects operational participation rather than enrollment status.

---

# Business Rules

### Enrollment Requirement

Only confirmed enrollments may create attendance records.

---

### Multiple Attendance Events

An attendance record may contain multiple operational timestamps where appropriate.

Examples:

* Check-in.
* Break.
* Re-entry.
* Final check-out.

---

### Session Attendance

Sessions may maintain independent attendance while contributing to overall event participation.

---

### Manual Verification

Authorized organizers may correct attendance records while preserving an audit history.

---

### Attendance Completion

Attendance becomes complete only after all required participation criteria have been satisfied.

This determination forms the basis for certificate eligibility.

---

# Responsibilities

The Attendance Aggregate owns:

* Participation records.
* Attendance status.
* Verification.
* Operational timestamps.
* Participation completion.

It explicitly does **not** own:

* Enrollment.
* QR code generation.
* Scanner devices.
* Certificates.
* Analytics.

Those domains consume attendance information.

---

# Relationships with Other Aggregates

The Attendance Aggregate references:

* Enrollment Aggregate.
* Session Aggregate.

It is referenced by:

* Certificate Aggregate.
* Analytics Domain.
* AI Assistant Domain.

Attendance acts as the operational bridge between participation and recognition.

---

# AI Opportunities

Artificial Intelligence may assist by:

* detecting attendance anomalies,
* identifying no-show patterns,
* predicting attendance completion,
* estimating session occupancy,
* highlighting unusual participation trends.

AI analyzes participation while preserving organizer authority.

---

# Future Scope

Potential enhancements include:

* Passive attendance detection.
* Indoor positioning.
* Wearable integration.
* Offline synchronization.
* Attendance fraud detection.
* Cross-event participation analytics.

Because capture technologies remain outside the aggregate, these enhancements require minimal architectural change.

---

# Why This Is an Aggregate

The Attendance Aggregate protects one consistency boundary:

**Everything required to determine and verify actual participation.**

Enrollment records intent.

Attendance records fulfillment.

Separating these concepts enables richer participation tracking while preserving clean aggregate boundaries.

Attendance becomes the trusted operational source for certificates, analytics, and long-term participation history.

---

# Design Decisions

Key architectural decisions include:

* Attendance references Enrollment rather than User.
* Capture mechanisms remain external.
* Verification is first-class.
* Participation is richer than presence.
* Attendance determines participation completion.
* Certificates depend upon Attendance rather than Enrollment.

These decisions create a future-proof participation model capable of supporting diverse event formats and attendance technologies.

---

# Summary

The Attendance Aggregate represents the verified operational participation of an enrolled individual.

By separating attendance from enrollment and isolating capture technologies, EventSphere creates a flexible, auditable, and extensible participation model.

Attendance is the point at which intention becomes reality.

For this reason, it serves as the authoritative foundation for recognition, analytics, and operational intelligence throughout the platform.

# Chapter 29 — Certificate Aggregate

> *"A certificate is not a document. It is the formal recognition that a participant has satisfied the requirements defined by an event."*

---

# Aggregate Snapshot

| Property                   | Value                                                                   |
| -------------------------- | ----------------------------------------------------------------------- |
| **Aggregate Name**         | Certificate                                                             |
| **Domain**                 | Participation Management                                                |
| **Aggregate Type**         | Core Aggregate                                                          |
| **Aggregate Root**         | Certificate                                                             |
| **Owned Entities**         | CertificateTemplate, CertificateIssue, RecognitionPolicy                |
| **Value Objects**          | CertificateStatus, VerificationCode, IssueDate                          |
| **Depends On**             | Attendance Aggregate, Event Aggregate, Enrollment Aggregate             |
| **Referenced By**          | User Profile, Analytics, AI                                             |
| **Primary Responsibility** | Represent and manage the official recognition awarded for participation |

---

# Aggregate Contract

### Aggregate Root

**Certificate**

---

### Consistency Boundary

The Certificate Aggregate owns the recognition awarded to one Enrollment.

It does **not** own PDF generation, email delivery, badge rendering, or storage mechanisms.

---

### Publishes Domain Events

* CertificateEligible
* CertificateIssued
* CertificateRevoked
* CertificateRegenerated
* CertificateVerified

---

### Consumes Domain Events

* AttendanceCompleted
* EventCompleted
* RecognitionApproved

---

# Purpose

The Certificate Aggregate represents the official recognition awarded to a participant after successfully fulfilling an event's participation requirements.

Unlike a PDF document, which is only one representation of a certificate, the aggregate models the recognition itself.

It records why the certificate was earned, when it was issued, under which policy it was granted, and whether it remains valid.

The Certificate Aggregate answers one fundamental question:

> **"Has this participant officially earned recognition from this event?"**

---

# Business Problem

Many event platforms generate certificates as static documents immediately after an event.

This creates several problems:

* certificates may be issued to ineligible participants,
* there is no authoritative record of issuance,
* verification is difficult,
* corrections require manual intervention,
* future formats require redesign.

EventSphere separates **recognition** from **representation**.

Recognition belongs to the Certificate Aggregate.

Documents, badges, and exports are simply different ways of presenting that recognition.

---

# Design Philosophy

The Certificate Aggregate follows six guiding principles.

### Recognition Before Representation

Recognition is the business concept.

PDFs, badges, and digital credentials are representations.

---

### Attendance Determines Eligibility

Certificates are awarded based on verified participation rather than registration alone.

Attendance provides the trusted operational evidence.

---

### Policy-Driven Issuance

Eligibility is determined through configurable Recognition Policies rather than hardcoded rules.

---

### Verifiable Credentials

Every certificate should be independently verifiable.

Verification strengthens trust for participants, organizers, and external institutions.

---

### Immutable Recognition

Once issued, certificate history should be preserved.

Corrections occur through versioning or revocation rather than deletion.

---

### Future-Proof Design

The aggregate should support multiple credential formats without changing its business model.

---

# Core Concepts

The Certificate Aggregate consists of four primary concepts.

---

## Certificate

The aggregate root.

Represents one official recognition awarded for one Enrollment.

---

## Recognition Policy

Defines the criteria required before a certificate becomes eligible.

Examples include:

* Minimum attendance percentage.
* Mandatory sessions completed.
* Submission accepted.
* Volunteer shift completed.
* Organizer approval.

Recognition policies are configurable and event-specific.

---

## Certificate Issue

Represents the issuance event.

Includes:

* Issue date.
* Issued by.
* Version.
* Status.

---

## Certificate Template

Defines branding and presentation metadata.

Templates describe how recognition is presented but do not determine eligibility.

---

# Aggregate Structure

```text id="certificateagg"
Certificate
│
├── RecognitionPolicy
│
├── CertificateIssue
│
└── CertificateTemplate
```

Document generation remains outside the aggregate.

---

# Aggregate Invariants

The Certificate Aggregate guarantees:

* Every Certificate belongs to exactly one Enrollment.
* Certificates are issued only after eligibility is satisfied.
* Every Certificate has exactly one Recognition Policy.
* Every issued certificate is verifiable.
* Certificate history is preserved.
* Revoked certificates remain historically accessible.
* Recognition identity is immutable.

---

# Certificate Lifecycle

```text id="certificatefsm"
Not Eligible
      │
      ▼
Eligible
      │
      ▼
Issued
      │
      ▼
Verified
```

Alternative path:

```text id="certificatefsm2"
Issued
   │
   ▼
Revoked
```

The lifecycle reflects institutional recognition rather than document generation.

---

# Business Rules

### Eligibility

Eligibility is evaluated using the Recognition Policy.

Attendance alone does not guarantee issuance unless the policy requires only attendance.

---

### Issuance

Certificates may be:

* automatically issued,
* organizer approved,
* administrator approved.

The strategy is configurable.

---

### Revocation

Certificates may be revoked for exceptional circumstances while preserving historical records.

---

### Verification

Every certificate receives a unique verification identifier.

External parties may verify authenticity without requiring platform access.

---

### Versioning

Corrections create new certificate versions rather than overwriting historical records.

---

# Responsibilities

The Certificate Aggregate owns:

* Recognition.
* Eligibility.
* Issuance.
* Verification.
* Revocation.
* Version history.

It explicitly does **not** own:

* Attendance.
* PDF rendering.
* Email delivery.
* Cloud storage.
* Badge visualization.

Those capabilities belong to supporting services.

---

# Relationships with Other Aggregates

The Certificate Aggregate references:

* Enrollment Aggregate.
* Attendance Aggregate.
* Event Aggregate.

It is referenced by:

* User Profile.
* Analytics Domain.
* AI Assistant Domain.

Recognition becomes part of the participant's long-term professional history.

---

# AI Opportunities

Artificial Intelligence may assist by:

* identifying participants nearing eligibility,
* detecting unusual issuance patterns,
* recommending recognition criteria,
* identifying template inconsistencies,
* summarizing participant achievements.

AI supports recognition while preserving organizer authority.

---

# Future Scope

Potential enhancements include:

* W3C Verifiable Credentials.
* Open Badges.
* LinkedIn sharing.
* Digital wallets.
* Blockchain-backed verification.
* Cross-event achievement portfolios.
* Stackable micro-credentials.

Because representation is separated from recognition, these capabilities can be introduced without redesigning the aggregate.

---

# Why This Is an Aggregate

The Certificate Aggregate protects one consistency boundary:

**Everything required to determine, issue, verify, and preserve official recognition for one participant.**

Recognition evolves independently from attendance, document rendering, and analytics.

By separating institutional recognition from presentation technologies, EventSphere creates a durable and extensible credentialing system.

---

# Design Decisions

Key architectural decisions include:

* Certificates reference Enrollment through verified Attendance.
* Recognition is distinct from document generation.
* Eligibility is policy-driven.
* Verification is first-class.
* Revocation preserves history.
* Multiple output formats are infrastructure concerns.

These decisions ensure that EventSphere's credentialing model remains trustworthy, scalable, and adaptable to future standards.

---

# Summary

The Certificate Aggregate represents the formal recognition awarded to participants who successfully satisfy an event's participation requirements.

Rather than treating certificates as static files, EventSphere models them as verifiable institutional credentials with configurable eligibility, immutable history, and flexible representations.

This approach transforms certificates from downloadable documents into enduring records of achievement that integrate naturally with participant profiles, analytics, and future digital credential ecosystems.

# Chapter 30 — Announcement Aggregate

> *"Announcements define what an organization wants to communicate. Delivery mechanisms determine how that communication reaches people."*

---

# Aggregate Snapshot

| Property                   | Value                                                              |
| -------------------------- | ------------------------------------------------------------------ |
| **Aggregate Name**         | Announcement                                                       |
| **Domain**                 | Operational Communication                                          |
| **Aggregate Type**         | Core Aggregate                                                     |
| **Aggregate Root**         | Announcement                                                       |
| **Owned Entities**         | AnnouncementAudience, AnnouncementSchedule, AnnouncementAttachment |
| **Value Objects**          | AnnouncementStatus, Priority, PublishWindow                        |
| **Depends On**             | Community Aggregate, Event Aggregate                               |
| **Referenced By**          | Notification Domain, Analytics, AI                                 |
| **Primary Responsibility** | Represent an official communication issued by a community or event |

---

# Aggregate Contract

### Aggregate Root

**Announcement**

---

### Consistency Boundary

The Announcement Aggregate owns the content, audience, scheduling, and publication state of an announcement.

It does **not** own delivery channels such as email, push notifications, SMS, or in-app messaging.

---

### Publishes Domain Events

* AnnouncementCreated
* AnnouncementScheduled
* AnnouncementPublished
* AnnouncementUpdated
* AnnouncementArchived

---

### Consumes Domain Events

* RegistrationOpened
* RegistrationClosed
* EventStarted
* EventCompleted

---

# Purpose

The Announcement Aggregate represents an official communication issued on behalf of a Community or an Event.

It captures **what** is being communicated, **who** should receive it, and **when** it should become visible.

Announcements are persistent operational records that contribute to organizational history.

They remain independent of the technologies used to distribute them.

---

# Business Problem

Many systems treat announcements as simple text messages tied directly to notification services.

This tightly couples business communication with delivery infrastructure, making future enhancements difficult.

EventSphere separates these concerns.

Announcements represent communication intent.

Notification services handle delivery.

This separation enables the same announcement to be distributed through multiple channels without altering its business identity.

---

# Design Philosophy

The Announcement Aggregate follows six guiding principles.

### Communication Is a Business Asset

Announcements become part of the event and community history.

They are not disposable notifications.

---

### Intent Before Delivery

The aggregate defines the message.

Delivery is delegated to the Notification Domain.

---

### Audience-Aware

Announcements are targeted.

Examples include:

* All participants
* Approved enrollments
* Volunteers
* Organizers
* Sponsors
* Speakers
* Committee members

The audience is part of the aggregate.

---

### Scheduled Communication

Announcements may be published immediately or at a future time.

Scheduling belongs to the aggregate because it affects business intent.

---

### Immutable History

Published announcements remain part of the operational record.

Edits create revisions where appropriate.

---

### Multi-Channel Ready

One announcement may be delivered through many communication channels without duplication.

---

# Core Concepts

## Announcement

The aggregate root representing one official communication.

---

## Announcement Audience

Defines the intended recipients.

Examples include:

* Community Members
* Event Participants
* Volunteers
* Sponsors
* Speakers
* Custom Segments

---

## Announcement Schedule

Defines:

* Publish time
* Expiration time
* Draft state
* Scheduled publication

---

## Announcement Attachment

Optional supporting resources.

Examples:

* Images
* PDFs
* External links
* Documents

Attachments support communication but do not define it.

---

# Aggregate Structure

```text
Announcement
│
├── AnnouncementAudience
│
├── AnnouncementSchedule
│
└── AnnouncementAttachment
```

Delivery mechanisms intentionally remain outside the aggregate.

---

# Aggregate Invariants

The Announcement Aggregate guarantees:

* Every Announcement belongs to either a Community or an Event.
* Published announcements remain historically traceable.
* Every announcement has one publication state.
* Scheduled publication occurs only once.
* Delivery channels never modify announcement content.

---

# Business Rules

### Drafts

Announcements may remain in Draft until approved or scheduled.

---

### Publication

Only authorized users may publish announcements.

Authorization is evaluated by the Authorization Domain.

---

### Audience Resolution

Audience membership is resolved dynamically at delivery time.

This ensures that recipient lists remain current.

---

### Expiration

Announcements may expire from active views while remaining historically accessible.

---

### Revision History

Material changes after publication create a revision record.

This preserves organizational transparency.

---

# Responsibilities

The Announcement Aggregate owns:

* Message content.
* Audience definition.
* Scheduling.
* Publication state.
* Attachments.
* Revision history.

It explicitly does **not** own:

* Email delivery.
* Push notifications.
* SMS.
* WhatsApp.
* Discord integration.
* Slack integration.

Those belong to the Notification Domain.

---

# Relationships with Other Domains

The Announcement Aggregate references:

* Community Aggregate.
* Event Aggregate.

It is referenced by:

* Notification Domain.
* Analytics Domain.
* AI Assistant Domain.

Announcements become a permanent part of operational history.

---

# AI Opportunities

Artificial Intelligence may assist by:

* improving announcement clarity,
* suggesting publication timing,
* summarizing lengthy messages,
* identifying the appropriate audience,
* detecting duplicate communications,
* recommending follow-up announcements.

AI assists communication while preserving organizer ownership.

---

# Future Scope

Potential enhancements include:

* multilingual announcements,
* audience segmentation,
* threaded updates,
* announcement templates,
* emergency broadcasts,
* AI-generated announcements,
* cross-community communication.

---

# Why This Is an Aggregate

The Announcement Aggregate protects one consistency boundary:

**Everything required to define an official organizational communication.**

It intentionally excludes delivery technologies, allowing communication intent to remain stable while delivery mechanisms evolve independently.

---

# Design Decisions

Key architectural decisions include:

* Announcement is a business aggregate.
* Delivery belongs to the Notification Domain.
* Audience is part of the aggregate.
* Scheduling is a business concern.
* Delivery channels remain infrastructure.
* Communication history is preserved.

---

# Summary

The Announcement Aggregate represents the official voice of a Community or Event within EventSphere.

By separating communication intent from delivery infrastructure, the platform creates a durable, auditable, and extensible communication model capable of supporting future delivery technologies without compromising business architecture.