import { Request, Response } from "express";

const notFoundHandler = (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    statusCode: 404,
    status: 404,
    errorType: "Not Found",
    message: "API Route Not Found",
    path: req.originalUrl,
  });
};

export default notFoundHandler;
