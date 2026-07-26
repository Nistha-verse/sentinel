import { NextRequest, NextResponse } from "next/server";
import { createJob, writeJob, type ScanJob } from "@/lib/server/jobStore";
import { scanContract } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * POST /api/scan
 * Body: { contractId: string, network: "testnet" | "mainnet" }
 *
 * Immediately returns a scanId.  The scan pipeline runs asynchronously in the
 * background, writing progress updates to tmp/<scanId>.job.json so the poll
 * endpoint can read them without shared memory.
 */
export async function POST(req: NextRequest) {
  let body: { contractId?: string; network?: string };
  try {
    body = (await req.json()) as { contractId?: string; network?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { contractId, network } = body;

  if (!contractId || typeof contractId !== "string" || contractId.trim() === "") {
    return NextResponse.json({ error: "contractId is required" }, { status: 400 });
  }

  try {
    const net = network === "mainnet" ? "mainnet" : "testnet";
    const job = createJob(contractId.trim(), net);

    // Fire-and-forget: run the actual scan pipeline in the background.
    // The job file is updated at each stage so polling can track progress.
    void runScanBackground(job);

    return NextResponse.json(
      {
        scanId: job.id,
        status: job.status,
        message: "Scan started. Poll GET /api/scan/" + job.id + " for status.",
      },
      { status: 202 }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to start scan";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function runScanBackground(job: ScanJob): Promise<void> {
  try {
    // Mark running + 10%
    job.status = "running";
    job.progress = 10;
    writeJob(job);

    // 30% — about to hit the network
    job.progress = 30;
    writeJob(job);

    const result = await scanContract(job.contractId, {
      network: job.network as "testnet" | "mainnet",
      html: true,
    });

    job.status = "complete";
    job.progress = 100;
    job.completedAt = new Date().toISOString();
    job.result = {
      riskScore:    result.report.riskScore,
      critical:     result.report.critical,
      high:         result.report.high,
      medium:       result.report.medium,
      low:          result.report.low,
      findingsCount: result.report.findings.length,
      reportPath:   result.reportPath,
      htmlPath:     result.htmlPath,
    };
    writeJob(job);
  } catch (err) {
    job.status = "error";
    job.error = err instanceof Error ? err.message : String(err);
    job.completedAt = new Date().toISOString();
    writeJob(job);
  }
}
