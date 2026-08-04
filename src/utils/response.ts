import { Response } from "express";

export const sendResponse = (
  res: Response,
  statusCode: number,
  data: any,
  message?: string,
) => {
  return res.status(statusCode).json({
    status: "success",
    ...(message && { message }),
    data,
  });
};
