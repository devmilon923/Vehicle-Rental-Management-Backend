import { ErrorRequestHandler } from "express";
import ServerError from "../util/error";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";
import { PrismaClientRustPanicError } from "../generated/prisma/internal/prismaNamespace";

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(error);
  let errorInfo = {
    success: false,
    statusCode: 500,
    errorType: "Invalid request",
    errorMessage: "",
  };
  if (error instanceof ServerError) {
    errorInfo.statusCode = error.statusCode;
    errorInfo.errorMessage = error.message;
  }
  if (error instanceof PrismaClientKnownRequestError) {
    // Known Prisma errors
    if (error.code === "P2002") {
      // Unique constraint violation
      errorInfo.statusCode = 409;
      errorInfo.errorMessage = "This record already exists";
    } else if (error.code === "P2025") {
      errorInfo.statusCode = 404;
      errorInfo.errorMessage = "Record not found";
    } else if (error.code === "P2003") {
      // Foreign key constraint failed
      errorInfo.statusCode = 400;
      errorInfo.errorMessage = "Invalid reference";
    } else {
      errorInfo.statusCode = 400;
      errorInfo.errorMessage = error.message;
    }
  } else if (error instanceof PrismaClientValidationError) {
    // Validation errors
    errorInfo.statusCode = 400;
    errorInfo.errorMessage = "Invalid input data";
  } else if (error instanceof PrismaClientRustPanicError) {
    // Runtime errors
    errorInfo.statusCode = 500;
    errorInfo.errorMessage = "Database error occurred";
  }
  return res.status(errorInfo.statusCode).json({
    success: errorInfo.success,
    path: req.originalUrl,
    status: errorInfo.statusCode,
    errorType: errorInfo.errorType,
    message: errorInfo.errorMessage,
  });
};

export default globalErrorHandler;