import { describe, expect, it, vi } from "vitest";
import { AvatarService } from "../../../src/services/identity/avatar.service.js";

const user = { id: "u1", name: "A", email: "a@b.com", avatarUrl: null, createdAt: new Date() };

describe("AvatarService", () => {
  it("uploads to storage and saves only the returned URL", async () => {
    const upload = vi.fn().mockResolvedValue("https://res.cloudinary.com/x/u1.png");
    const users = {
      findById: vi.fn().mockResolvedValue(user),
      updateAvatar: vi.fn().mockImplementation(async (_id, url) => ({ ...user, avatarUrl: url })),
    };
    const service = new AvatarService(users as never, { upload });
    const result = await service.upload("u1", new File(["img"], "a.png", { type: "image/png" }));
    expect(upload).toHaveBeenCalledOnce();
    expect(users.updateAvatar).toHaveBeenCalledWith("u1", "https://res.cloudinary.com/x/u1.png");
    expect(result.avatarUrl).toBe("https://res.cloudinary.com/x/u1.png");
  });

  it("rejects files over 5 MB without calling storage", async () => {
    const upload = vi.fn();
    const service = new AvatarService({ findById: vi.fn() } as never, { upload });
    const big = new File([new Uint8Array(5 * 1024 * 1024 + 1)], "a.png", { type: "image/png" });
    await expect(service.upload("u1", big)).rejects.toThrow();
    expect(upload).not.toHaveBeenCalled();
  });
});
