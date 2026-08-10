import multer from "multer";
import { AppError } from "../utils/appError";

const storage = multer.memoryStorage();

export const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isImage = file.mimetype.startsWith("image/");
    const isCsv = file.mimetype === "text/csv" || file.originalname.endsWith(".csv");

    if (isImage || isCsv) {
      cb(null, true);
    } else {
      cb(new AppError("Only image and .csv files are allowed!", 400));
    }
  },
});

export const uploadCsv = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const isCsv =
      file.mimetype === "text/csv" || file.originalname.endsWith(".csv");

    if (isCsv) {
      cb(null, true);
    } else {
      cb(new AppError("Only .csv files are allowed!", 400));
    }
  },
});
