import type { UserRepository } from "../repositories/identity/index.js";

export type AppEnv = {
  Variables: {
    user: { id: string };
    authUser: NonNullable<Awaited<ReturnType<UserRepository["findById"]>>>;
    pagination: { page: number; limit: number; offset: number };
  };
};
