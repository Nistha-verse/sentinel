import { NextRequest, NextResponse } from "next/server";
import { loadReport } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * GET /api/report/:contractId/raw
 * Returns the full SavedReport JSON as stored on disk.
 *
 * Add ?download=1 to trigger a browser file download instead of inline display.
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

    const report = await loadReport(contractId);

    if (!report) {
      return NextResponse.json(
        { error: `Report not found for contract ${contractId}` },
        { status: 404 }
      );
    }

    const json = JSON.stringify(report, null, 2);
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        ...(download
          ? { "Content-Disposition": `attachment; filename="${contractId}.json"` }
          : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
