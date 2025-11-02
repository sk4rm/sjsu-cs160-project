/**
 * MongoDB singleton. Every service that uses the database should use this.
 */

import { MongoClient, ServerApiVersion } from "mongodb";

if (!Bun.env.URI_MONGO) {
    throw new Error("Please add your MongoDB connection string in your .env file.");
}

const uri = Bun.env.URI_MONGO;
const options = {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true
    }
};

const client = new MongoClient(uri, options);

export const database = client.db("eco-leveling");