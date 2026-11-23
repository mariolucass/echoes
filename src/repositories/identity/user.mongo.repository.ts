import { randomUUID } from "node:crypto";
import type { Collection } from "mongodb";
import prisma from "../../database/prisma.js";
import { getUsersCollection, type UserDocument } from "../../database/mongo.js";
import { ConflictError } from "../../errors/AppError.js";

const toPublic = ({ _id, name, email, avatarUrl, createdAt }: UserDocument) => ({
  id: _id,
  name,
  email,
  avatarUrl,
  createdAt,
});

const isDuplicateKey = (error: unknown) =>
  typeof error === "object" && error !== null && (error as { code?: number }).code === 11000;

type Mirror = Pick<typeof prisma.user, "create" | "update" | "upsert">;

/**
 * Users live in MongoDB (source of truth). A mirror row with the same id is kept
 * in PostgreSQL only so existing foreign keys (decisions, tags, refresh tokens) keep working.
 */
export class MongoUserRepository {
  constructor(
    private readonly collection: () => Promise<Collection<UserDocument>> = getUsersCollection,
    private readonly mirror: Mirror = prisma.user,
  ) {}

  async findExistingEmail(email: string) {
    const doc = await (await this.collection()).findOne({ email }, { projection: { _id: 1 } });
    return doc ? { id: doc._id } : null;
  }

  async create(data: { name: string; email: string; passwordHash: string }) {
    const users = await this.collection();
    const now = new Date();
    const doc: UserDocument = {
      _id: randomUUID(),
      ...data,
      avatarUrl: null,
      createdAt: now,
      updatedAt: now,
    };
    try {
      await users.insertOne(doc);
    } catch (error) {
      if (isDuplicateKey(error)) throw new ConflictError("Email already registered.");
      throw error;
    }
    try {
      await this.mirror.create({
        data: { id: doc._id, ...data, createdAt: now },
        select: { id: true },
      });
    } catch (error) {
      await users.deleteOne({ _id: doc._id });
      throw error;
    }
    return toPublic(doc);
  }

  async findByEmail(email: string) {
    const doc = await (await this.collection()).findOne({ email });
    return doc ? { ...toPublic(doc), passwordHash: doc.passwordHash } : null;
  }

  async findById(id: string) {
    const doc = await (await this.collection()).findOne({ _id: id });
    return doc ? toPublic(doc) : null;
  }

  /**
   * Recreates the PostgreSQL mirror if it is missing (e.g. after switching databases),
   * so writes with a foreign key to User (refresh tokens, decisions) don't fail with P2003.
   */
  async ensureMirror(id: string) {
    const doc = await (await this.collection()).findOne({ _id: id });
    if (!doc) return;
    const { name, email, passwordHash, avatarUrl, createdAt } = doc;
    await this.mirror.upsert({
      where: { id },
      create: { id, name, email, passwordHash, avatarUrl, createdAt },
      update: {},
      select: { id: true },
    });
  }

  async updateName(id: string, name: string) {
    return this.update(id, { name });
  }

  async updateAvatar(id: string, avatarUrl: string) {
    return this.update(id, { avatarUrl });
  }

  private async update(id: string, fields: { name?: string; avatarUrl?: string }) {
    const doc = await (await this.collection()).findOneAndUpdate(
      { _id: id },
      { $set: { ...fields, updatedAt: new Date() } },
      { returnDocument: "after" },
    );
    if (!doc) throw new Error("User not found");
    await this.mirror.update({ where: { id }, data: fields, select: { id: true } });
    return toPublic(doc);
  }
}
