import express from "express";
import cors from "cors";
import pc from "picocolors";

import scanRoutes from "./routes/scan";
import reportRoutes from "./routes/report";

const app = express();
const PORT = parseInt(process.env.SENTINEL_PORT ?? "3001", 10);

// CORS — allow Next.js dashboard on port 3000
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      process.env.DASHBOARD_ORIGIN ?? "",
    ].filter(Boolean),
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", version: process.env.npm_package_version ?? "1.0.0" });
});

// Routes
app.use("/api/scan", scanRoutes);
app.use("/api/report", reportRoutes);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.listen(PORT, () => {
  console.log(
    `\n  ${pc.bold(pc.cyan("Sentinel API Server"))} running on ${pc.bold(`http://localhost:${PORT}`)}`
  );
  console.log(`  ${pc.dim("POST")}  /api/scan`);
  console.log(`  ${pc.dim("GET")}   /api/scan/:id`);
  console.log(`  ${pc.dim("GET")}   /api/report/:id/json`);
  console.log(`  ${pc.dim("GET")}   /api/report/:id/html`);
  console.log(`  ${pc.dim("GET")}   /api/report/:id/raw`);
  console.log(`  ${pc.dim("GET")}   /api/history`);
  console.log(`  ${pc.dim("GET")}   /api/health\n`);
});

export default app;
