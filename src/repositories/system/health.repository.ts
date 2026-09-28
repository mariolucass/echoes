import prisma from "../../database/prisma.js";

export class HealthRepository {
  checkDatabase() {
    return prisma.$queryRaw`SELECT 1`;
  }
}
