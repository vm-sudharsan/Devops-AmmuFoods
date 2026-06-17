const express = require("express");
const morgan = require("morgan");
const helmet = require("helmet");
const cors = require("cors");

const productRoutes = require("./routes/product.routes");
const eventRoutes = require("./routes/event.routes");

const errorHandler = require("./middlewares/error.middleware");
const apiLimiter = require("./middlewares/rateLimit.middleware");

const app = express();

// ── Security & CORS ──
app.use(helmet());

const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "https://ammufoods.netlify.app",
  process.env.FRONTEND_URL,
  process.env.FRONTEND_DEV_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (Postman, mobile, server-to-server)
      if (!origin) return callback(null, true);
      // Allow any netlify.app subdomain (preview deploys)
      if (origin.endsWith(".netlify.app")) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);

// ── Rate limiting ──
app.use(apiLimiter);

// ── Body parsing ──
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ── Logging ──
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

// ── Health check ──
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "AmmuFoods Backend is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development",
  });
});

// ── Routes ──
app.use("/products", productRoutes);
app.use("/events", eventRoutes);

// ── 404 ──
app.use((req, res) => {
  res.status(404).json({ success: false, message: "Route not found" });
});

// ── Error handler ──
app.use(errorHandler);

module.exports = app;
