import { MongoClient, type Collection } from "mongodb";
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
let usersReady: Promise<Collection<UserDocument>> | undefined;

/** Lazy connection to MongoDB Atlas; creates the unique e-mail index once. */
export function getUsersCollection(): Promise<Collection<UserDocument>> {
  usersReady ??= (async () => {
    client = new MongoClient(env.MONGODB_URI!);
    await client.connect();
    const users = client
      .db(env.MONGODB_DB)
      .collection<UserDocument>("users");
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
  usersReady = undefined;
}
