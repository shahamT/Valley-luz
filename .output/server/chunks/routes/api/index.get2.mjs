import { c as defineEventHandler, u as useRuntimeConfig } from '../../_/nitro.mjs';
import { g as getMongoConnection } from '../../_/mongodb.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'mongodb';

function getDateInIsraelFromIso(isoString) {
  if (!isoString) return void 0;
  const d = new Date(isoString);
  if (Number.isNaN(d.getTime())) return void 0;
  const formatted = d.toLocaleDateString("en-CA", { timeZone: "Asia/Jerusalem", year: "numeric", month: "2-digit", day: "2-digit" });
  const parts = formatted.split("-");
  if (parts.length !== 3) return void 0;
  return `${parts[0]}-${parts[1]}-${parts[2]}`;
}
function transformEventForFrontend(doc) {
  var _a, _b, _c, _d, _e, _f, _g, _h;
  const backendEvent = doc.event;
  if (!backendEvent) {
    return null;
  }
  const eventId = ((_a = doc._id) == null ? void 0 : _a.toString()) || String(doc._id);
  const dateCreated = doc.createdAt instanceof Date ? doc.createdAt : new Date(doc.createdAt);
  const rawOccurrences = backendEvent.occurrence ? [backendEvent.occurrence] : backendEvent.occurrences && Array.isArray(backendEvent.occurrences) ? backendEvent.occurrences : [];
  const occurrences = rawOccurrences.map((occ) => {
    const date = (occ == null ? void 0 : occ.date) && /^\d{4}-\d{2}-\d{2}$/.test(String(occ.date).trim().slice(0, 10)) ? String(occ.date).trim().slice(0, 10) : getDateInIsraelFromIso(occ == null ? void 0 : occ.startTime);
    return { ...occ, ...date ? { date } : {} };
  });
  if (occurrences.length > 0 && !occurrences[0].startTime) {
    console.warn("[EventsAPI] Occurrence missing startTime:", occurrences[0]);
  }
  return {
    id: eventId,
    title: backendEvent.Title || "",
    shortDescription: backendEvent.shortDescription || "",
    fullDescription: backendEvent.fullDescription || "",
    categories: backendEvent.categories || [],
    mainCategory: backendEvent.mainCategory || "",
    price: (_b = backendEvent.price) != null ? _b : null,
    media: backendEvent.media || [],
    urls: backendEvent.urls || [],
    location: {
      city: ((_c = backendEvent.location) == null ? void 0 : _c.City) || "",
      addressLine1: ((_d = backendEvent.location) == null ? void 0 : _d.addressLine1) || void 0,
      addressLine2: ((_e = backendEvent.location) == null ? void 0 : _e.addressLine2) || void 0,
      locationDetails: ((_f = backendEvent.location) == null ? void 0 : _f.locationDetails) || void 0,
      wazeNavLink: ((_g = backendEvent.location) == null ? void 0 : _g.wazeNavLink) || void 0,
      gmapsNavLink: ((_h = backendEvent.location) == null ? void 0 : _h.gmapsNavLink) || void 0
    },
    occurrences,
    isActive: doc.isActive !== false,
    dateCreated,
    publisherPhone: backendEvent.publisherPhone || void 0
  };
}
const index_get = defineEventHandler(async (event) => {
  const config = useRuntimeConfig();
  const mongoUri = config.mongodbUri || process.env.MONGODB_URI;
  const mongoDbName = config.mongodbDbName || process.env.MONGODB_DB_NAME;
  const collectionName = config.mongodbCollectionEvents || process.env.MONGODB_COLLECTION_EVENTS || "events";
  if (!mongoUri || !mongoDbName) {
    console.error("[EventsAPI] MongoDB not configured");
    return [];
  }
  try {
    const { db } = await getMongoConnection();
    const collection = db.collection(collectionName);
    const now = /* @__PURE__ */ new Date();
    const firstDayOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const cutoff = new Date(firstDayOfCurrentMonth);
    cutoff.setDate(cutoff.getDate() - 5);
    const cutoffISO = cutoff.toISOString();
    const query = {
      isActive: true,
      event: { $ne: null },
      $or: [
        { "event.occurrence.startTime": { $gt: cutoff } },
        { "event.occurrence.startTime": { $gt: cutoffISO } },
        { "event.occurrences.startTime": { $gt: cutoff } },
        { "event.occurrences.startTime": { $gt: cutoffISO } }
      ]
    };
    const documents = await collection.find(query).toArray();
    const transformedEvents = documents.map((doc) => {
      try {
        return transformEventForFrontend(doc);
      } catch (error) {
        console.error("[EventsAPI] Error transforming document:", error instanceof Error ? error.message : String(error));
        return null;
      }
    }).filter((transformedEvent) => transformedEvent !== null);
    return transformedEvents;
  } catch (error) {
    console.error("[EventsAPI] Error fetching events:", error instanceof Error ? error.message : String(error));
    return [];
  }
});

export { index_get as default };
//# sourceMappingURL=index.get2.mjs.map
