require("dotenv").config();

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

const nearbyRoutes = require("./routes/nearby.routes");
const errorMiddleware = require("./middlewares/error.middleware");

const app = express();
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
const allowedOrigins = [
  frontendUrl,
  "http://localhost:3000",
  "http://localhost:5173",
];

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(helmet());
app.use(morgan("dev"));
app.use(express.json());
app.get("/", (req, res) => {
  res.send("API is running");
});
app.use("/api/nearby", nearbyRoutes);

app.use(errorMiddleware);

module.exports = app;
