import { NextRequest, NextResponse } from "next/server";
import { loadReport, generateDashboardReport } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * GET /api/report/:contractId/json
 * Returns the dashboard-compatible SentinelReport format.
 *
 * Add ?download=1 to trigger a browser file download instead of inline JSON.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ contractId: string }> }
) {
  try {
    const { contractId } = await params;

    if (!contractId) {
      return NextResponse.json({ error: "contractId is required" }, { status: 400 });
    }

    const report = loadReport(contractId);

    if (!report) {
      return NextResponse.json(
        { error: `Report not found for contract ${contractId}` },
        { status: 404 }
      );
    }

    const dashboardReport = generateDashboardReport(report);
    const json = JSON.stringify(dashboardReport, null, 2);

    const download = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(download
          ? { "Content-Disposition": `attachment; filename="${contractId}.report.json"` }
          : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
