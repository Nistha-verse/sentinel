import { Router, type Request, type Response } from "express";
import {
  createScanJob,
  getScanJob,
  startScanJob,
} from "../scanManager";
import type { StellarNetwork } from "../../rpc/stellar";

const router = Router();

// POST /api/scan — start an async scan
router.post("/", (req: Request, res: Response): void => {
  const { contractId, network } = req.body as {
    contractId?: string;
    network?: string;
  };

  if (!contractId || typeof contractId !== "string") {
    res.status(400).json({ error: "contractId is required" });
    return;
  }

  const net: StellarNetwork =
    network === "mainnet" ? "mainnet" : "testnet";

  const job = createScanJob(contractId, net);

  // Fire-and-forget — scan runs in background
  void startScanJob(job);

  res.status(202).json({
    scanId: job.id,
    status: job.status,
    message: "Scan started. Poll GET /api/scan/:id for status.",
  });
});

// GET /api/scan/:id — poll scan status
router.get("/:id", (req: Request, res: Response): void => {
  const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const job = getScanJob(id ?? "");

  if (!job) {
    res.status(404).json({ error: "Scan job not found" });
    return;
  }

  res.json({
    scanId: job.id,
    contractId: job.contractId,
    network: job.network,
    status: job.status,
    progress: job.progress,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    error: job.error,
    result: job.result
      ? {
          riskScore: job.result.report.riskScore,
          critical: job.result.report.critical,
          high: job.result.report.high,
          medium: job.result.report.medium,
          low: job.result.report.low,
          findingsCount: job.result.report.findings.length,
          reportPath: job.result.reportPath,
          htmlPath: job.result.htmlPath,
        }
      : undefined,
  });
});

export default router;
