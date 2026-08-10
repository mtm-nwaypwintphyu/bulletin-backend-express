import { parse } from "csv-parse";
import streamifier from "streamifier";
import { AppError } from "./appError";

export const parseCsvBuffer = async <T = any>(
  fileBuffer: Buffer,
): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const results: T[] = [];

    streamifier
      .createReadStream(fileBuffer)
      .pipe(
        parse({
          columns: true,
          bom: true,
          skip_empty_lines: true,
          trim: true,
          onRecord: (row: any) => {
            const cleaned: Record<string, any> = {};
            for (const [k, v] of Object.entries(row)) {
              cleaned[k.trim()] = typeof v === "string" ? v.trim() : v;
            }
            return cleaned;
          },
        }),
      )
      .on("data", (row: T) => {
        results.push(row);
      })
      .on("end", () => {
        resolve(results);
      })
      .on("error", (error) => {
        reject(new AppError("Error occurred while reading the CSV file", 400));
      });
  });
};
