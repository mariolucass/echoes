import prisma from "../../database/prisma.js";

export class TagRepository {
  findManyOwned(userId: string) {
    return prisma.tag.findMany({
      where: { userId },
      orderBy: [{ name: "asc" }, { id: "asc" }],
    });
  }

  findOwned(userId: string, id: string) {
    return prisma.tag.findFirst({ where: { id, userId } });
  }

  create(userId: string, name: string) {
    return prisma.tag.create({ data: { userId, name } });
  }

  update(userId: string, id: string, name: string) {
    return prisma.tag.update({ where: { id, userId }, data: { name } });
  }

  delete(userId: string, id: string) {
    return prisma.tag.delete({ where: { id, userId } });
  }

  findForDecision(userId: string, decisionId: string) {
    return prisma.decisionTag.findMany({
      where: { decisionId, userId },
      include: { tag: true },
      orderBy: { tag: { name: "asc" } },
    });
  }

  attach(userId: string, decisionId: string, tagId: string) {
    return prisma.decisionTag.upsert({
      where: { decisionId_tagId: { decisionId, tagId } },
      create: { decisionId, tagId, userId },
      update: {},
    });
  }

  detach(userId: string, decisionId: string, tagId: string) {
    return prisma.decisionTag.deleteMany({
      where: { decisionId, tagId, userId },
    });
  }
}
