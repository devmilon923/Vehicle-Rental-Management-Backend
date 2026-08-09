import dotenv from "dotenv";
dotenv.config();
import express, { Application, Request, Response } from "express";
import globalErrorHandler from "./middleware/errorHandler";
import router from "./routes/routes";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));


app.get("/", (req: Request, res: Response) => {
  res.send("Hello World!");
});
app.use(router);
app.use(globalErrorHandler);
app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
