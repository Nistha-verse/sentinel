import { NextRequest, NextResponse } from "next/server";
import { loadReport } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * GET /api/report/:contractId/raw
 * Returns the full SavedReport JSON as stored on disk.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  const { contractId } = await params;

  if (!contractId) {
    return NextResponse.json({ error: "contractId is required" }, { status: 400 });
  }

  const report = loadReport(contractId);

  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  return NextResponse.json(report);
}
