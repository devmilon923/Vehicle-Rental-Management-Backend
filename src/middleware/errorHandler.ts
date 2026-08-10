import { ErrorRequestHandler } from "express";
import { ZodError } from "zod";
import ServerError from "../util/error";
import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from "@prisma/client/runtime/client";
import { PrismaClientRustPanicError } from "../generated/prisma/internal/prismaNamespace";

export interface IErrorSource {
  path: string | number;
  message: string;
}

const globalErrorHandler: ErrorRequestHandler = (error, req, res, next) => {
  console.log(error);

  let statusCode = 500;
  let errorType = "Internal Server Error";
  let message = "Something went wrong";
  let errorSources: IErrorSource[] = [
    {
      path: "",
      message: "Something went wrong",
    },
  ];

  if (error instanceof ServerError) {
    statusCode = error.statusCode;
    errorType = statusCode >= 500 ? "Server Error" : "Client Error";
    message = error.message;
    errorSources = [
      {
        path: "",
        message: error.message,
      },
    ];
  } else if (error instanceof ZodError) {
    statusCode = 400;
    errorType = "Validation error";
    errorSources = error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join(".") : "",
      message: issue.message,
    }));
    message = errorSources
      .map((source) =>
        source.path ? `${source.path}: ${source.message}` : source.message
      )
      .join("; ");
  } else if (error instanceof PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      statusCode = 409;
      errorType = "Duplicate Entry Error";
      message = "This record already exists";
      errorSources = [
        {
          path: "",
          message: "This record already exists",
        },
      ];
    } else if (error.code === "P2025") {
      statusCode = 404;
      errorType = "Not Found Error";
      message = "Record not found";
      errorSources = [
        {
          path: "",
          message: "Record not found",
        },
      ];
    } else if (error.code === "P2003") {
      statusCode = 400;
      errorType = "Foreign Key Error";
      message = "Invalid reference";
      errorSources = [
        {
          path: "",
          message: "Invalid reference",
        },
      ];
    } else {
      statusCode = 400;
      errorType = "Database Request Error";
      message = error.message;
      errorSources = [
        {
          path: "",
          message: error.message,
        },
      ];
    }
  } else if (error instanceof PrismaClientValidationError) {
    statusCode = 400;
    errorType = "Database Validation Error";
    message = "Invalid input data";
    errorSources = [
      {
        path: "",
        message: "Invalid input data",
      },
    ];
  } else if (error instanceof PrismaClientRustPanicError) {
    statusCode = 500;
    errorType = "Database Panic Error";
    message = "Database error occurred";
    errorSources = [
      {
        path: "",
        message: "Database error occurred",
      },
    ];
  } else if (error instanceof Error) {
    message = error.message;
    errorSources = [
      {
        path: "",
        message: error.message,
      },
    ];
  }

  return res.status(statusCode).json({
    success: false,
    statusCode,
    status: statusCode,
    errorType,
    message,
    errorSources,
    path: req.originalUrl,
  });
};

export default globalErrorHandler;
