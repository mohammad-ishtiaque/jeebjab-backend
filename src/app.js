import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import path from "path";
import { fileURLToPath } from "url";

import globalErrorHandler from "./app/middleware/globalErrorHandler.js";
import routes from "./app/routes/index.js"; 
import notFoundHandler from "./error/NotFoundHandler.js";
import corsOptions from "./util/corsOptions.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use("/uploads", express.static("uploads"));

app.use("/", routes);

app.get("/", async (req, res) => {
  res.json(`Welcome to ${process.env.SERVICE_NAME}`);
});

app.use(notFoundHandler);
app.use(globalErrorHandler);


export default app;