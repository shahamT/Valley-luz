import { u as useRuntimeConfig } from './nitro.mjs';
import { MongoClient } from 'mongodb';

let client = null;
let db = null;
async function getMongoConnection() {
  if (client && db) {
    return { client, db };
  }
  const config = useRuntimeConfig();
  const uri = config.mongodbUri || process.env.MONGODB_URI;
  const dbName = config.mongodbDbName || process.env.MONGODB_DB_NAME;
  if (!uri || !dbName) {
    throw new Error("MongoDB configuration missing: MONGODB_URI and MONGODB_DB_NAME are required");
  }
  client = new MongoClient(uri);
  await client.connect();
  db = client.db(dbName);
  return { client, db };
}

export { getMongoConnection as g };
//# sourceMappingURL=mongodb.mjs.map
