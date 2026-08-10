import { parse } from "csv-parse";
import { Readable } from "node:stream";
import { finished } from "node:stream/promises";
import { AppError } from "./appError";

export const parseCsvBuffer = async <T = any>(
  fileBuffer: Buffer,
): Promise<T[]> => {
  const results: T[] = [];

  const parser = Readable.from([fileBuffer]).pipe(
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
  );

  parser.on("data", (row: T) => {
    results.push(row);
  });

  try {
    await finished(parser);
    return results;
  } catch (error) {
    throw new AppError("Error occurred while reading the CSV file", 400);
  }
};
