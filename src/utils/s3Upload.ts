import { PutObjectCommand } from "@aws-sdk/client-s3";
import { s3Client, BUCKET_NAME } from "../config/s3";
import { v4 as uuidv4 } from "uuid";
import fs from "fs/promises";
import path from "path";

export const uploadToS3 = async (
  file: Express.Multer.File,
): Promise<string> => {
  try {
    if (!process.env.AWS_S3_BUCKET_NAME) {
      throw new Error("S3 not configured");
    }

    const fileExtension = file.originalname.split(".").pop();
    const fileName = `profiles/${uuidv4()}.${fileExtension}`;

    await s3Client.send(
      new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: fileName,
        Body: file.buffer,
        ContentType: file.mimetype,
      }),
    );

    return `https://${BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${fileName}`;
  } catch (error) {
    console.warn("S3 upload failed, falling back to local storage:", error);

    const uploadDir = path.resolve(
      process.cwd(),
      process.env.UPLOAD_DIR || "uploads/profiles",
    );

    await fs.mkdir(uploadDir, { recursive: true });

    const fileExtension = file.originalname.split(".").pop();
    const fileName = `${uuidv4()}.${fileExtension}`;
    const filePath = path.join(uploadDir, fileName);

    await fs.writeFile(filePath, file.buffer);

    return `/uploads/profiles/${fileName}`;
  }
};
