import { c as defineEventHandler, g as getRouterParam, e as createError, u as useRuntimeConfig, f as sendRedirect } from '../../../_/nitro.mjs';
import { g as getMongoConnection } from '../../../_/mongodb.mjs';
import 'node:http';
import 'node:https';
import 'node:events';
import 'node:buffer';
import 'node:fs';
import 'node:path';
import 'node:crypto';
import 'node:url';
import 'mongodb';

const _filename__get = defineEventHandler(async (event) => {
  const filename = getRouterParam(event, "filename");
  if (!filename) {
    throw createError({
      statusCode: 400,
      statusMessage: "Filename is required"
    });
  }
  if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
    throw createError({
      statusCode: 400,
      statusMessage: "Invalid filename"
    });
  }
  try {
    const config = useRuntimeConfig();
    const { db } = await getMongoConnection();
    const collection = db.collection(config.mongodbCollectionRawMessages || process.env.MONGODB_COLLECTION_RAW_MESSAGES || "raw_messages");
    const document = await collection.findOne({
      cloudinaryUrl: { $regex: filename }
    });
    if (!document || !document.cloudinaryUrl) {
      throw createError({
        statusCode: 404,
        statusMessage: "Media file not found"
      });
    }
    return sendRedirect(event, document.cloudinaryUrl, 302);
  } catch (error) {
    if (error && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to retrieve media"
    });
  }
});

export { _filename__get as default };
//# sourceMappingURL=_filename_.get.mjs.map
