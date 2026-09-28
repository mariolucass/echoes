import { NotFoundError } from "../../errors/AppError.js";
import { UserRepository } from "../../repositories/identity/index.js";

const repository = new UserRepository();

export const ProfileService = {
  async updateName(userId: string, name: string) {
    const user = await repository.findById(userId);

    if (!user) {
      throw new NotFoundError("User");
    }

    const result = await repository.updateName(user.id, name);

    return { ...result, createdAt: result.createdAt.toISOString() };
  },
};
