import { createHash } from "node:crypto";
import { env } from "../../config/env.js";
import { AppError } from "../../errors/AppError.js";
import { ErrorCode } from "../../errors/errorCodes.js";

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ImageStorage {
  upload(file: File, publicId: string): Promise<string>;
}

/** Uploads to Cloudinary via its signed REST API; only the returned URL is persisted. */
export class CloudinaryStorage implements ImageStorage {
  async upload(file: File, publicId: string): Promise<string> {
    const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } =
      env;
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      throw new AppError("Image storage is not configured.", {
        code: ErrorCode.INTERNAL_ERROR,
      });
    }

    const timestamp = Math.floor(Date.now() / 1000).toString();
    const params = {
      folder: env.CLOUDINARY_FOLDER,
      overwrite: "true",
      public_id: publicId,
      timestamp,
    };
    const toSign = Object.entries(params)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    const signature = createHash("sha1")
      .update(toSign + CLOUDINARY_API_SECRET)
      .digest("hex");

    const form = new FormData();
    form.set("file", file);
    form.set("api_key", CLOUDINARY_API_KEY);
    form.set("signature", signature);
    for (const [k, v] of Object.entries(params)) form.set(k, v);

    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
      { method: "POST", body: form },
    );
    if (!response.ok) {
      throw new AppError("Image upload failed.", {
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: 502,
      });
    }
    const body = (await response.json()) as { secure_url?: string };
    if (!body.secure_url) {
      throw new AppError("Image upload failed.", {
        code: ErrorCode.INTERNAL_ERROR,
        statusCode: 502,
      });
    }
    return body.secure_url;
  }
}
