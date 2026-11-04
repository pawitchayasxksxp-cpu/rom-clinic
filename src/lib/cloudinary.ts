import "server-only";

import { v2 as cloudinary, type UploadApiResponse } from "cloudinary";
import { getConnectionUrl } from "./env";

export function getCloudinary(): typeof cloudinary {
  const url = getConnectionUrl("CLOUDINARY_URL");
  cloudinary.config({
    cloud_name: url.hostname,
    api_key: decodeURIComponent(url.username),
    api_secret: decodeURIComponent(url.password),
    secure: true,
  });

  return cloudinary;
}

/** Call from authorized server code after validating the file's size and type. */
export async function uploadFile(buffer: Buffer): Promise<UploadApiResponse> {
  if (buffer.length === 0) {
    throw new Error("Cannot upload an empty file.");
  }

  const client = getCloudinary();
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      {
        folder: process.env.CLOUDINARY_FOLDER?.trim() || "rom-clinic",
        resource_type: "auto",
        type: "authenticated",
        overwrite: false,
        timeout: 30_000,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result)
          return reject(new Error("Cloudinary returned no upload result."));
        resolve(result);
      },
    );

    stream.on("error", reject);
    stream.end(buffer);
  });
}
