import { Router, type Request, type Response } from "express";
import { loadReport } from "../../storage/reportStore";
import { generateHtmlReport } from "../../report/htmlReport";
import { generateDashboardReport } from "../../report/jsonReport";

const router = Router();

// GET /api/report/:id/json — dashboard-compatible JSON report
router.get("/:id/json", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const report = loadReport(id ?? "");
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(generateDashboardReport(report));
});

// GET /api/report/:id/raw — raw SavedReport JSON
router.get("/:id/raw", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const report = loadReport(id ?? "");
  if (!report) {
    res.status(404).json({ error: "Report not found" });
    return;
  }
  res.json(report);
});

// GET /api/report/:id/html — HTML report
router.get("/:id/html", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const report = loadReport(id ?? "");
  if (!report) {
    res.status(404).send("Report not found");
    return;
  }
  res.setHeader("Content-Type", "text/html");
  res.send(generateHtmlReport(report));
});

export default router;
