import prisma from "../../database/prisma.js";

export interface RequestLog {
  timestamp: string;
  method: string;
  route: string;
  requestId?: string;
}

export class RequestLogRepository {
  async create(log: RequestLog): Promise<void> {
    await prisma.requestLog.create({
      data: { ...log, timestamp: new Date(log.timestamp) },
    });
  }

  async findByDate(date: string): Promise<RequestLog[]> {
    const start = new Date(`${date}T00:00:00.000Z`);
    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 1);
    const logs = await prisma.requestLog.findMany({
      where: { timestamp: { gte: start, lt: end } },
      orderBy: [{ timestamp: "asc" }, { id: "asc" }],
      select: { timestamp: true, method: true, route: true, requestId: true },
    });
    return logs.map((log) => ({
      ...log,
      timestamp: log.timestamp.toISOString(),
      requestId: log.requestId ?? undefined,
    }));
  }
}
