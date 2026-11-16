import { describe, expect, it, vi } from "vitest";
import { ConflictError } from "../../../src/errors/AppError.js";
import { MongoUserRepository } from "../../../src/repositories/identity/user.mongo.repository.js";

function setup(insertError?: unknown) {
  const docs = new Map<string, any>();
  const collection = {
    insertOne: vi.fn(async (d: any) => {
      if (insertError) throw insertError;
      docs.set(d._id, d);
    }),
    deleteOne: vi.fn(async ({ _id }: any) => void docs.delete(_id)),
    findOne: vi.fn(async (q: any) =>
      [...docs.values()].find((d) => (q._id ? d._id === q._id : d.email === q.email)) ?? null,
    ),
    findOneAndUpdate: vi.fn(async ({ _id }: any, { $set }: any) => {
      const d = docs.get(_id);
      if (!d) return null;
      Object.assign(d, $set);
      return d;
    }),
  };
  const mirror = { create: vi.fn().mockResolvedValue({}), update: vi.fn().mockResolvedValue({}) };
  const repo = new MongoUserRepository(async () => collection as never, mirror as never);
  return { repo, collection, mirror, docs };
}

const input = { name: "Ada", email: "ada@x.com", passwordHash: "scrypt:h" };

describe("MongoUserRepository", () => {
  it("stores the user in MongoDB and mirrors the same id in PostgreSQL", async () => {
    const { repo, mirror, docs } = setup();
    const user = await repo.create(input);
    expect(docs.get(user.id).passwordHash).toBe("scrypt:h");
    expect(mirror.create).toHaveBeenCalledWith(expect.objectContaining({ data: expect.objectContaining({ id: user.id }) }));
    expect(user).not.toHaveProperty("passwordHash");
  });

  it("maps a duplicate-key error to 409", async () => {
    const { repo } = setup({ code: 11000 });
    await expect(repo.create(input)).rejects.toThrow(ConflictError);
  });

  it("rolls back the Mongo insert if the mirror fails", async () => {
    const { repo, mirror, docs } = setup();
    mirror.create.mockRejectedValue(new Error("pg down"));
    await expect(repo.create(input)).rejects.toThrow("pg down");
    expect(docs.size).toBe(0);
  });

  it("finds by email (with hash), by id (without) and updates fields", async () => {
    const { repo, mirror } = setup();
    const { id } = await repo.create(input);
    expect((await repo.findByEmail(input.email))?.passwordHash).toBe("scrypt:h");
    expect(await repo.findById(id)).not.toHaveProperty("passwordHash");
    expect(await repo.findExistingEmail(input.email)).toEqual({ id });
    expect((await repo.updateName(id, "Grace")).name).toBe("Grace");
    expect((await repo.updateAvatar(id, "https://x/y.png")).avatarUrl).toBe("https://x/y.png");
    expect(mirror.update).toHaveBeenCalledTimes(2);
    expect(await repo.findByEmail("nope@x.com")).toBeNull();
  });
});
