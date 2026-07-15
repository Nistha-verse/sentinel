import { NextRequest, NextResponse } from "next/server";
import { readJob } from "@/lib/server/jobStore";

export const runtime = "nodejs";

/**
 * GET /api/scan/:id
 * Returns the current state of a scan job.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!id) {
    return NextResponse.json({ error: "id is required" }, { status: 400 });
  }

  const job = readJob(id);

  if (!job) {
    return NextResponse.json({ error: "Scan job not found" }, { status: 404 });
  }

  return NextResponse.json({
    scanId:      job.id,
    contractId:  job.contractId,
    network:     job.network,
    status:      job.status,
    progress:    job.progress,
    startedAt:   job.startedAt,
    completedAt: job.completedAt,
    error:       job.error,
    result:      job.result,
  });
}
