// backend/server.js
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");
require("dotenv").config();

const adminRoutes = require("./routes/admin");
const submissionRoutes = require("./routes/submissions");
const { initDatabase } = require("./config/database");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const HOST = "0.0.0.0";

app.set("trust proxy", true);

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

/*
 * These parsers do not consume multipart/form-data, so Multer remains
 * responsible for the submission upload route.
 */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

const ROOT_DIR = path.join(__dirname, "..");
const ADMIN_DIR = path.join(__dirname, "public", "admin");

app.use(express.static(ROOT_DIR));
app.use("/admin", express.static(ADMIN_DIR));

app.get("/api/health", async (req, res) => {
  res.json({
    success: true,
    status: "ok",
    service: "assignment-help",
    time: new Date().toISOString()
  });
});

app.use("/api/admin", adminRoutes);
app.use("/api/submissions", submissionRoutes);

/*
 * If the client disconnects while a multipart upload is in progress,
 * record it clearly. This is different from a database failure.
 */
app.use((req, res, next) => {
  req.on("aborted", () => {
    console.warn("[HTTP REQUEST ABORTED]", req.method, req.originalUrl);
  });
  next();
});

/*
 * API 404s should return JSON instead of an HTML page.
 */
app.use("/api", (req, res) => {
  res.status(404).json({
    success: false,
    message: "API endpoint not found."
  });
});

/*
 * Frontend fallback.
 */
app.get("/{*splat}", (req, res) => {
  res.sendFile(path.join(ROOT_DIR, "index.html"));
});

/*
 * Final error handler.
 */
app.use((err, req, res, next) => {
  console.error("🔴 Server Error:", err);

  if (res.headersSent) {
    return next(err);
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error"
  });
});

async function start() {
  try {
    await initDatabase();
    console.log("✅ Database initialized");
  } catch (error) {
    console.error("❌ Database initialization failed:", error);
    process.exit(1);
  }

  app.listen(PORT, HOST, () => {
    const host = process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : `http://localhost:${PORT}`;

    console.log(`Running on: ${host}`);
    console.log(`Admin: ${host}/admin/`);
    console.log(`Health: ${host}/api/health`);
  });
}

start();
