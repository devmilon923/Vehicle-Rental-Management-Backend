import { Response } from "express";

export interface IApiResponse<T> {
  statusCode: number;
  success: boolean;
  message?: string;
  meta?: {
    totalPage?: number;
    currentPage?: number;
    prevPage?: number;
    nextPage?: number;
    totalData?: number;
    [key: string]: unknown;
  };
  data?: T;
}

const sendResponse = <T>(res: Response, data: IApiResponse<T>): void => {
  const responseData: Record<string, unknown> = {
    success: data.success,
    statusCode: data.statusCode,
    message: data.message,
  };

  if (data.meta !== undefined) {
    responseData.meta = data.meta;
  }

  if (data.data !== undefined) {
    responseData.data = data.data;
  }

  res.status(data.statusCode).json(responseData);
};

export const responseHandler = sendResponse;
export default sendResponse;
