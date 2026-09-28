# Echoes API Roadmap

The routes listed below are implemented. Their matching Bruno requests are in the Identity, Tracking, Learning, and Classification folders. Every route requires the access token, and resources linked to a decision are restricted to its owner.

## Current Bruno test flow

Register the test account once with `POST - Register User`. For later runs, start with `POST - Login`; the request saves `token` and `refreshToken`. Then create a decision, add an alternative, metric and expectation, and commit it. The create requests save `decisionId`, `alternativeId`, `metricId`, and `expectationId`. Create a checkpoint and measurement while the decision is active. Run the review request next; it saves `outcomeId` and `reflectionId` for Learning. Create a tag before attaching it to the decision; it saves `tagId`. Run destructive requests last. The sample account values are in the `Echoes` environment.

## Tracking

Models: `Checkpoint`, `Metric`, and `MetricMeasurement`.

```text
GET    /tracking/checkpoints?decisionId={decisionId}
POST   /tracking/checkpoints
GET    /tracking/checkpoints/{checkpointId}
PATCH  /tracking/checkpoints/{checkpointId}
DELETE /tracking/checkpoints/{checkpointId}

GET    /tracking/metrics?decisionId={decisionId}
GET    /tracking/metrics/{metricId}
POST   /tracking/metrics/{metricId}/measurements
GET    /tracking/metrics/{metricId}/measurements
```

Checkpoint creation accepts `decisionId`, `scheduledFor`, and optional `notes`. Update accepts `scheduledFor`, `completedAt`, `score`, and `notes`. Checkpoints can be changed while a decision is `DRAFT` or `ACTIVE`. Measurement creation requires `ACTIVE` and accepts `value`, optional `recordedAt`, and optional `notes`. Metric creation remains at `POST /decisions/{decisionId}/metrics`.

## Learning

Models: `Outcome`, `ExpectationAssessment`, and `Reflection`. Decision reviews already create these records atomically through `POST /decisions/{decisionId}/reviews`.

```text
GET  /learning/outcomes?decisionId={decisionId}
GET  /learning/outcomes/{outcomeId}
GET  /learning/outcomes/{outcomeId}/assessments
GET  /learning/reflections?decisionId={decisionId}
GET  /learning/reflections/{reflectionId}
```

Writes remain inside the review transaction at `POST /decisions/{decisionId}/reviews` to preserve completion rules.

## Classification

Models: `Tag` and `DecisionTag`; tags are private to their owner.

```text
GET    /classification/tags
POST   /classification/tags
PATCH  /classification/tags/{tagId}
DELETE /classification/tags/{tagId}
PUT    /decisions/{decisionId}/tags/{tagId}
DELETE /decisions/{decisionId}/tags/{tagId}
```

Tag body: `{ "name": "Carreira" }`. Both the decision and tag must belong to the authenticated user. `PUT` is idempotent.

## Identity

The implemented profile endpoint is `GET /identity/auth/me`. The `/identity/users` router is mounted but empty.

```text
PATCH /identity/users/me
```

The update accepts only `name`; the email remains unchanged.

## Contract conventions

- Use plural nouns for collections and stable UUIDs for resource identifiers.
- Keep state changes as explicit actions only when they represent a domain transition, as with `POST /decisions/{decisionId}/commit`.
- Use `PATCH` for partial resource updates and `DELETE` for soft-delete behavior where history must remain.
- Apply authentication and ownership checks consistently; never trust a `userId` supplied by the caller.
- Errors use the shared API error format. Invalid UUIDs and bodies return `422`; resources of another user return `404`.
