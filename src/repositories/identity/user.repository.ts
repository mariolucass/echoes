import { env } from "../../config/env.js";
import prisma from "../../database/prisma.js";
import { MongoUserRepository } from "./user.mongo.repository.js";
import {
  loginUserProjection,
  publicUserProjection,
} from "../../projections/identity/index.js";

class PrismaUserRepository {
  findExistingEmail(email: string) {
    return prisma.user.findUnique({ where: { email }, select: { id: true } });
  }

  create(data: { name: string; email: string; passwordHash: string }) {
    return prisma.user.create({ data, select: publicUserProjection });
  }

  findByEmail(email: string) {
    return prisma.user.findUnique({
      where: { email },
      select: loginUserProjection,
    });
  }

  findById(id: string) {
    return prisma.user.findUnique({
      where: { id },
      select: publicUserProjection,
    });
  }

  updateName(id: string, name: string) {
    return prisma.user.update({
      where: { id },
      data: { name },
      select: publicUserProjection,
    });
  }

  updateAvatar(id: string, avatarUrl: string) {
    return prisma.user.update({
      where: { id },
      data: { avatarUrl },
      select: publicUserProjection,
    });
  }

  /** PostgreSQL is the source of truth here: there is no mirror to repair. */
  async ensureMirror(_id: string) {}
}

/** MongoDB Atlas when MONGODB_URI is set; PostgreSQL (Prisma) otherwise. */
export class UserRepository {
  private readonly impl: PrismaUserRepository | MongoUserRepository = env.MONGODB_URI
    ? new MongoUserRepository()
    : new PrismaUserRepository();

  findExistingEmail(email: string) {
    return this.impl.findExistingEmail(email);
  }
  create(data: { name: string; email: string; passwordHash: string }) {
    return this.impl.create(data);
  }
  findByEmail(email: string) {
    return this.impl.findByEmail(email);
  }
  findById(id: string) {
    return this.impl.findById(id);
  }
  updateName(id: string, name: string) {
    return this.impl.updateName(id, name);
  }
  updateAvatar(id: string, avatarUrl: string) {
    return this.impl.updateAvatar(id, avatarUrl);
  }
  ensureMirror(id: string) {
    return this.impl.ensureMirror(id);
  }
}
