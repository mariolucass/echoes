import { NotFoundError } from "../../errors/AppError.js";
import { TagRepository } from "../../repositories/classification/index.js";
import { requireOwnedDecision } from "../shared/owned-decision.js";

const repository = new TagRepository();

const view = (item: {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}) => ({
  id: item.id,
  name: item.name,
  createdAt: item.createdAt.toISOString(),
  updatedAt: item.updatedAt.toISOString(),
});

async function ownedTag(userId: string, id: string) {
  const tag = await repository.findOwned(userId, id);
  if (!tag) throw new NotFoundError("Tag");
  return tag;
}

export const TagService = {
  async list(userId: string) {
    const data = await repository.findManyOwned(userId);

    return data.map(view);
  },

  async create(userId: string, name: string) {
    const data = await repository.create(userId, name);

    return view(data);
  },

  async update(userId: string, id: string, name: string) {
    await ownedTag(userId, id);
    const data = await repository.update(userId, id, name);

    return view(data);
  },

  async remove(userId: string, id: string) {
    await ownedTag(userId, id);
    await repository.delete(userId, id);
  },

  async listForDecision(userId: string, decisionId: string) {
    await requireOwnedDecision(userId, decisionId);
    const data = await repository.findForDecision(userId, decisionId);

    return data.map((link) => view(link.tag));
  },

  async attach(userId: string, decisionId: string, tagId: string) {
    await requireOwnedDecision(userId, decisionId);
    const tag = await ownedTag(userId, tagId);
    await repository.attach(userId, decisionId, tagId);
    return view(tag);
  },

  async detach(userId: string, decisionId: string, tagId: string) {
    await requireOwnedDecision(userId, decisionId);
    await ownedTag(userId, tagId);
    const result = await repository.detach(userId, decisionId, tagId);
    if (!result.count) {
      throw new NotFoundError("Decision tag");
    }
  },
};
