import { NextRequest, NextResponse } from "next/server";
import { loadReport, generateHtmlReport } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * GET /api/report/:contractId/html
 * Returns the full self-contained HTML security report.
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
    return new NextResponse("Report not found", { status: 404 });
  }

  const html = generateHtmlReport(report);

  return new NextResponse(html, {
    status: 200,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      // Prevent the browser from treating the report HTML as an XSS vector
      "X-Content-Type-Options": "nosniff",
    },
  });
}
