import { NextRequest, NextResponse } from "next/server";
import { loadReport, generateDashboardReport } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * GET /api/report/:contractId/json
 * Returns the dashboard-compatible SentinelReport format (project.summary.healthScore, etc.)
 * consumed by the legacy parse-report.ts importer in the Reports page.
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

  return NextResponse.json(generateDashboardReport(report));
}
