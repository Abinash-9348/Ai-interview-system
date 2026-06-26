import cloudinary from "../config/cloudnary.config.ts";
import { UploadApiResponse } from "cloudinary";

export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = "jd-pdfs"
): Promise<UploadApiResponse> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: "raw", // Use raw for PDFs to preserve original file if needed
        format: "pdf",
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload result is undefined"));
        resolve(result);
      }
    );

    uploadStream.end(fileBuffer);
  });
};
