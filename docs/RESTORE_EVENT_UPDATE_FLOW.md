# Restore event-update flow (wa-listener)

This document describes how to bring back the "update an existing event" behavior when the AI comparison returns `updated_event`. Currently, both `existing_event` and `updated_event` are treated as duplicates (cleanup + ALREADY_EXISTING); no DB update is performed.

## What was removed

- **Pipeline**: When `comparison.status === 'updated_event'`, the code no longer calls `handleUpdatedEvent`. Instead it does the same as `existing_event`: `cleanupAndDeleteEvent(..., CONFIRMATION_REASONS.ALREADY_EXISTING)`.
- **Function**: The `handleUpdatedEvent` function was removed from `apps/wa-listener/src/services/event.service.js`.
- **Imports**: Removed from `event.service.js`: `updateEventWithNewData`, `appendToPreviousVersions`, `getEventDocument` (from `./mongo.service.js`) and `ObjectId` (from `mongodb`).

The following are **unchanged** and still available for restore:

- **apps/wa-listener/src/services/mongo.service.js**: `getEventDocument(eventId)`, `appendToPreviousVersions(eventId, oldVersion)`, `updateEventWithNewData(eventId, newEvent, newRawMessage, newCloudinaryUrl, newCloudinaryData)`.
- **apps/wa-listener/src/utils/messageSender.js**: `CONFIRMATION_REASONS.UPDATED_EVENT` and the corresponding message.
- **Comparison**: The AI comparison in `event.service.js` still returns `existing_event`, `updated_event`, or `new_event` with optional `matchedCandidateId`; the schema and prompt were not changed.

## How to restore the update flow

1. **Imports in event.service.js**
   - Add back to the mongo.service import: `updateEventWithNewData`, `appendToPreviousVersions`, `getEventDocument`.
   - Add back: `import { ObjectId } from 'mongodb'`.

2. **Re-add the `handleUpdatedEvent` function** in `event.service.js` (e.g. after `handleNewEvent`, before the "Main Pipeline" section). Logic:
   - Resolve `matchedCandidateId` to an ObjectId (if string); on failure, call `cleanupAndDeleteEvent(..., VALIDATION_FAILED)` and return.
   - Load the matched document with `getEventDocument(matchedId)`. If null, optionally treat as new with `handleNewEvent(...)` and return, or cleanup and return.
   - Call `appendToPreviousVersions(matchedId, { event, rawMessage, cloudinaryUrl, cloudinaryData, timestamp })` with the **current** matched document state (so the previous version is stored).
   - Enrich the new event with `enrichEvent(event, authorId, cloudinaryUrl, originalMessage, client)`.
   - Call `updateEventWithNewData(matchedId, enrichedEvent, rawMessage, cloudinaryUrl, cloudinaryData)`.
   - If success: `deleteEventDocument(eventId)`, then `sendEventConfirmation(messagePreview, CONFIRMATION_REASONS.UPDATED_EVENT)`.
   - On update failure or enrich error: call `cleanupAndDeleteEvent(...)` with an appropriate reason (e.g. DATABASE_ERROR, ENRICHMENT_ERROR).

3. **Pipeline branch**
   - Change the comparison handling so that `existing_event` and `updated_event` are handled separately again:
     - For `existing_event`: keep `cleanupAndDeleteEvent(..., ALREADY_EXISTING)` and return.
     - For `updated_event`: if `comparison.matchedCandidateId` is present, call `handleUpdatedEvent(eventId, rawMessage, cloudinaryUrl, cloudinaryData, comparison.matchedCandidateId, validatedEvent, originalMessage, client, messagePreview)` and return; otherwise treat as duplicate (cleanup + ALREADY_EXISTING) or as new, depending on desired fallback.

After restore, when the AI returns `updated_event` with a valid `matchedCandidateId`, the matched event document will be updated with the new data and the newly created event document (from the incoming message) will be deleted; the user will receive the UPDATED_EVENT confirmation message.
