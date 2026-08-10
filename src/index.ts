import dotenv from "dotenv";
dotenv.config();
import express, { Application } from "express";
import globalErrorHandler from "./middleware/errorHandler";
import notFoundHandler from "./middleware/notFoundHandler";
import router from "./routes/routes";
import renderDocsHandler from "./util/renderDocs";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/public", express.static("public"));

app.get("/", renderDocsHandler);

app.use(router);
app.use(notFoundHandler);
app.use(globalErrorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
