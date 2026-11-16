import prisma from "../../database/prisma.js";

export class ExportRepository {
  findUserDecisions(userId: string) {
    return prisma.decision.findMany({
      where: { userId, deletedAt: null },
      orderBy: [{ createdAt: "desc" }, { id: "asc" }],
      select: {
        id: true,
        title: true,
        description: true,
        context: true,
        status: true,
        decidedAt: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
