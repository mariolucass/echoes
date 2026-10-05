import { PrismaPg } from "@prisma/adapter-pg";
import { env } from "../config/env.js";
import { PrismaClient, type Prisma } from "../generated/prisma/client.js";

const adapter = new PrismaPg({ connectionString: env.DATABASE_URL });
const prisma = new PrismaClient<Prisma.PrismaClientOptionsWithAdapter>({
  adapter,
});

export default prisma;
