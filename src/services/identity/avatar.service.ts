import { NotFoundError, ValidationError } from "../../errors/AppError.js";
import { UserRepository } from "../../repositories/identity/index.js";
import {
  ALLOWED_IMAGE_TYPES,
  CloudinaryStorage,
  MAX_IMAGE_BYTES,
  type ImageStorage,
} from "../storage/image-storage.service.js";

export class AvatarService {
  constructor(
    private readonly users = new UserRepository(),
    private readonly storage: ImageStorage = new CloudinaryStorage(),
  ) {}

  async upload(userId: string, file: unknown) {
    if (!(file instanceof File)) {
      throw new ValidationError('Send the image in the multipart field "file".');
    }
    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      throw new ValidationError("Image must be JPEG, PNG or WebP.");
    }
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
      throw new ValidationError("Image must be between 1 byte and 5 MB.");
    }
    if (!(await this.users.findById(userId))) throw new NotFoundError("User");

    const url = await this.storage.upload(file, userId);
    const user = await this.users.updateAvatar(userId, url);
    return { ...user, createdAt: user.createdAt.toISOString() };
  }
}
