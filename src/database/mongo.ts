import { MongoClient, type Collection, type Db } from "mongodb";
import { env } from "../config/env.js";

export type UserDocument = {
  _id: string;
  name: string;
  email: string;
  passwordHash: string;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
};

let client: MongoClient | undefined;
let dbReady: Promise<Db> | undefined;
let usersReady: Promise<Collection<UserDocument>> | undefined;

/** Lazy, shared connection to MongoDB Atlas (one client per process). */
export function getMongoDb(): Promise<Db> {
  dbReady ??= (async () => {
    client = new MongoClient(env.MONGODB_URI!, { serverSelectionTimeoutMS: 5_000 });
    await client.connect();
    return client.db(env.MONGODB_DB);
  })().catch((error) => {
    dbReady = undefined;
    throw error;
  });
  return dbReady;
}

/** Users collection; creates the unique e-mail index once. */
export function getUsersCollection(): Promise<Collection<UserDocument>> {
  usersReady ??= (async () => {
    const users = (await getMongoDb()).collection<UserDocument>("users");
    await users.createIndex({ email: 1 }, { unique: true });
    return users;
  })().catch((error) => {
    usersReady = undefined;
    throw error;
  });
  return usersReady;
}

export async function closeMongo() {
  await client?.close();
  client = undefined;
  dbReady = undefined;
  usersReady = undefined;
}
