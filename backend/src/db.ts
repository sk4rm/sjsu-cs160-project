/**
 * MongoDB singleton. Every service that uses the database should use this.
 */

import { MongoClient, ServerApiVersion } from "mongodb";

const uri = Bun.env.URI_MONGO;
if (!uri) throw new Error("Please add your MongoDB connection string in your .env file.");

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

// connect once on startup
await client.connect();

export const database = client.db("eco-leveling");
