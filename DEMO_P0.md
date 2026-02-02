# CRM P0 Demo Script (5–7 minutes)

**Goal:** demonstrate the core loop for a boutique RIA: *Email → Convert to work → Money movement initiated → Audit/Compliance can retrieve everything.*

> Assumes local stack running via `docker compose up -d`.

## 0) Login
- Open: http://localhost:3000
- Login using default creds from README.

Success criteria:
- You land in the app and can navigate without errors.

---

## 1) Create a Household + Primary Person
- Create Household “Smith Family”.
- Add primary person John Smith (email + phone).

Success criteria:
- Household appears in list.
- Household detail loads.

---

## 2) Create a Money Movement Request (System of Record)
- Navigate to **Money Movements**.
- Create request:
  - Type: Wire (or ACH)
  - Amount + date needed
  - Link to Household + (optional) Account
  - Notes + required checklist items

Success criteria:
- Request shows in list.
- Status = Requested.
- Audit event created.

---

## 3) Approve + Initiate (Generate package + pre-fill)
- Open the request detail.
- Click **Approve**.
- Click **Initiate**.

Success criteria:
- Status transitions: Requested → Approved → Initiated/Submitted (depending on design).
- “Submission Package” section shows generated artifacts.
- Audit includes approval and initiation.

---

## 4) Close-loop
- Mark as Confirmed / Closed.

Success criteria:
- Lifecycle is fully tracked.

---

## 5) Compliance / Exam Mode
- Navigate to Audit / Compliance.
- Filter to Household “Smith Family” and export events.

Success criteria:
- Compliance can retrieve the record: who did what, when.
- Export action itself is audited.

---

## Definition of Done (P0)
- Fast capture + conversion to work.
- Money movements: clear lifecycle + package generation.
- Everything is linked to household/person and auditable.
