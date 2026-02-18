# LunchBox — API Reference

All endpoints are under `/api/`. All requests and responses use JSON.

**Auth**: Every endpoint except `POST /api/auth/login`, `POST /api/auth/register`, and `GET /api/shops` requires a valid session cookie. Returns `401` if unauthenticated.

**Multi-tenancy**: All data is scoped to the authenticated user's `shopId`. You cannot access another shop's data.

---

## Auth

### `POST /api/auth/login`
Sign in with a username and PIN.

**Body**
```json
{ "username": "supervisor", "pin": "1234" }
```
**Response `200`**
```json
{ "id": "...", "username": "supervisor", "shopId": "...", "departmentId": "..." }
```
**Errors**: `400` missing fields, `401` wrong credentials

---

### `POST /api/auth/register`
Create a new user. Optionally create a new shop and/or department inline.

**Body**
```json
{
  "username": "alice",
  "pin": "5678",
  "shopName": "New Store",
  "shopId": "existing-shop-id",
  "departmentName": "Produce",
  "departmentId": "existing-dept-id"
}
```
Provide either `shopName` (creates new) or `shopId` (joins existing). Same for department.

**Response `201`**: Same shape as login response.

**Errors**: `400` missing fields or shop not found, `409` username taken

---

### `POST /api/auth/logout`
Destroys the session cookie.

**Response `200`**: `{ "ok": true }`

---

### `GET /api/auth/me`
Returns the current session.

**Response `200`**
```json
{ "userId": "...", "shopId": "...", "departmentId": "...", "username": "supervisor" }
```
**Errors**: `401` not logged in

---

## Shifts

### `GET /api/shifts`
Get all shifts for the shop on a given date.

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | `YYYY-MM-DD` | today | Filter shifts to this date |

**Response `200`**: Array of shift objects (see [Shift Object](#shift-object)).

---

### `POST /api/shifts`
Create a new shift. Rest periods are automatically generated based on shift duration.

**Body**
```json
{
  "associateId": "...",
  "startTime": "2026-02-18T09:00:00.000Z",
  "endTime": "2026-02-18T17:00:00.000Z",
  "role": "Cashier",
  "departmentId": "..."
}
```
`associateId`, `startTime`, and `endTime` are required. Times must be ISO strings.

**Response `201`**: The created shift object with `restPeriods` populated.

**Errors**: `400` missing fields, `404` associate not found

---

### `PATCH /api/shifts/:id`
Update a shift. If `startTime` or `endTime` changes, rest periods are deleted and regenerated in a transaction.

**Body** *(all fields optional)*
```json
{
  "associateId": "...",
  "startTime": "2026-02-18T10:00:00.000Z",
  "endTime": "2026-02-18T18:00:00.000Z",
  "currentRole": "Lead",
  "originalRole": "Lead",
  "status": "ACTIVE"
}
```

**Response `200`**: Updated shift object.

**Errors**: `404` shift not found

---

### `DELETE /api/shifts/:id`
Delete a shift and all its rest periods.

**Response `200`**: The deleted shift object.

**Errors**: `404` shift not found

---

### `PATCH /api/shifts/:id/rest-periods/:restId`
Trigger a rest period state transition. Uses a state machine — do not try to set status directly.

**Body**
```json
{
  "action": "SEND",
  "reliefAssociateId": "...",
  "noRelief": false
}
```

| Action | Description | Extra fields |
|--------|-------------|--------------|
| `SEND` | Send associate on break | `reliefAssociateId` (optional) or `noRelief: true` |
| `RETURN` | Return associate from break | none |
| `RESET` | Reset a completed rest period back to scheduled | none |

**Response `200`**: Updated data (shape varies by action).

**Errors**: `400` invalid action or business rule violation (e.g. relief associate is already covering someone)

---

## Tasks

### `GET /api/tasks`
Get all tasks for the shop on a given date.

**Query params**
| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `date` | `YYYY-MM-DD` | none | Filter tasks by scheduled date |

**Response `200`**: Array of task instance objects (see [Task Object](#task-object)).

---

### `POST /api/tasks`
Create a new task. Optionally save it as a reusable template.

**Body**
```json
{
  "name": "Restock shelves",
  "scheduledTime": "2026-02-18T09:00:00.000Z",
  "assignedAssociateId": "...",
  "recurrenceRule": "FREQ=DAILY",
  "saveAsTemplate": false
}
```
Only `name` is required.

**Response `201`**: The created task instance object.

---

### `PATCH /api/tasks/:id`
Update a task's status or assignment.

**Body** *(all fields optional)*
```json
{
  "status": "COMPLETED",
  "assignedAssociateId": "..."
}
```

**Response `200`**: Updated task instance object.

**Errors**: `404` task not found

---

## Associates

### `GET /api/associates`
Get all associates in the shop, ordered by name.

**Response `200`**
```json
[{ "id": "...", "name": "Alice", "shopId": "...", "departmentId": "...", "department": { ... } }]
```

---

### `POST /api/associates`
Create a new associate.

**Body**
```json
{ "name": "Bob", "departmentId": "..." }
```
Only `name` is required.

**Response `201`**: The created associate object.

---

## Departments

### `GET /api/departments`
Get all departments in the shop, ordered by name.

**Response `200`**
```json
[{ "id": "...", "name": "Produce", "shopId": "..." }]
```

---

### `POST /api/departments`
Create a new department.

**Body**: `{ "name": "Bakery" }`

**Response `201`**: The created department object.

---

## Roles

### `GET /api/roles`
Get all roles in the shop, ordered by name.

**Response `200`**
```json
[{ "id": "...", "name": "Cashier", "shopId": "..." }]
```

---

### `POST /api/roles`
Create a new role.

**Body**: `{ "name": "Lead" }`

**Response `201`**: The created role object.

---

### `DELETE /api/roles/:id`
Delete a role.

**Response `200`**: `{ "success": true }`

**Errors**: `404` role not found

---

## Shops

### `GET /api/shops`
Public — no auth required. Returns all shops (used to populate the registration form).

**Response `200`**
```json
[{ "id": "...", "name": "Main Street Market" }]
```

---

## Reminders

### `GET /api/reminders`
Polls for upcoming rest periods. Used internally by `useReminderService` — not intended for direct use.

**Response `200`**
```json
{ "dueNow": 1, "dueSoon": 2 }
```
- `dueNow`: rest periods that are past their scheduled time and still `SCHEDULED`
- `dueSoon`: rest periods due within the next 30 minutes

---

## Reference

### Shift Object
```json
{
  "id": "...",
  "shopId": "...",
  "associateId": "...",
  "departmentId": "...",
  "startTime": "2026-02-18T09:00:00.000Z",
  "endTime": "2026-02-18T17:00:00.000Z",
  "status": "ACTIVE",
  "originalRole": "Cashier",
  "currentRole": "Cashier",
  "associate": { "id": "...", "name": "Alice" },
  "department": { "id": "...", "name": "Front End" },
  "restPeriods": [ ...RestPeriod objects ],
  "coveredByShift": null,
  "temporarilyCoveringShiftId": null
}
```

### RestPeriod Object
```json
{
  "id": "...",
  "shiftId": "...",
  "type": "BREAK",
  "scheduledTime": "2026-02-18T11:00:00.000Z",
  "status": "SCHEDULED",
  "relievedByAssociateId": null
}
```

**`type`**: `BREAK` | `LUNCH`

**`status`**: `SCHEDULED` → `OUT` → `COMPLETED` (use the `PATCH` action endpoint to transition; `RESET` goes back to `SCHEDULED`)

### Task Object
```json
{
  "id": "...",
  "name": "Restock shelves",
  "shopId": "...",
  "templateId": null,
  "scheduledTime": "2026-02-18T09:00:00.000Z",
  "assignedAssociateId": "...",
  "status": "PENDING",
  "createdAt": "2026-02-18T00:00:00.000Z",
  "assignedAssociate": { "id": "...", "name": "Bob" },
  "template": null
}
```

**`status`**: `PENDING` | `IN_PROGRESS` | `COMPLETED`
