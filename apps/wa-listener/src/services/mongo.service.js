/**
 * MongoDB service barrel: re-exports connection, message repository, and event repository
 * so existing imports from './mongo.service.js' continue to work.
 */

export { connect, close, ensureTextIndex, getDb } from './mongoConnection.js'
export { insertMessage } from './messageRepository.js'
export {
  findEventBySignature,
  insertEventDocument,
  deleteEventDocument,
  findCandidateEvents,
  updateEventDocument,
  updateEventWithNewData,
  appendToPreviousVersions,
  getEventDocument,
} from './eventRepository.js'
