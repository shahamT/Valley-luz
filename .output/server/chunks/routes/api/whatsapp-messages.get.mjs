import { c as defineEventHandler, h as getQuery, u as useRuntimeConfig, e as createError } from '../../_/nitro.mjs';
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

const MESSAGES_DEFAULT = 200;
const MESSAGES_MAX = 500;

const whatsappMessages_get = defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = Math.min(parseInt(query.limit) || MESSAGES_DEFAULT, MESSAGES_MAX);
  try {
    const config = useRuntimeConfig();
    const { db } = await getMongoConnection();
    const collection = db.collection(config.mongodbCollectionRawMessages || process.env.MONGODB_COLLECTION_RAW_MESSAGES || "raw_messages");
    const cursor = collection.find({}).sort({ createdAt: -1 }).limit(limit);
    const documents = await cursor.toArray();
    const messages = documents.map((doc) => doc.raw);
    const total = await collection.countDocuments({});
    return {
      messages,
      total
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to read messages: ${errorMessage}`
    });
  }
});

export { whatsappMessages_get as default };
//# sourceMappingURL=whatsapp-messages.get.mjs.map
