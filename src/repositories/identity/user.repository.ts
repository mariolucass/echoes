import prisma from "../../database/prisma.js";
import {
  loginUserProjection,
  publicUserProjection,
} from "../../projections/identity/index.js";

export class UserRepository {
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
}
