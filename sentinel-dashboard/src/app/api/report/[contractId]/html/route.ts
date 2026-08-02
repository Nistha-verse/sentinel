import { NextRequest, NextResponse } from "next/server";
import { loadReport, generateHtmlReport } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * GET /api/report/:contractId/html
 * Returns the full self-contained HTML security report.
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
      return new NextResponse(
        `Report not found for contract ${contractId}`,
        { status: 404 }
      );
    }

    const html = await generateHtmlReport(report);
    const download = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Content-Type-Options": "nosniff",
        ...(download
          ? { "Content-Disposition": `attachment; filename="${contractId}.html"` }
          : {}),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Internal server error";
    return new NextResponse(`Error generating report: ${message}`, { status: 500 });
  }
}
