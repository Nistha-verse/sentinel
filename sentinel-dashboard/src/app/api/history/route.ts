import { NextResponse } from "next/server";
import { listReports } from "@/lib/server/cli";

export const runtime = "nodejs";

/**
 * GET /api/history
 * Returns all saved reports sorted newest-first — unified view of CLI + dashboard scans.
 */
export async function GET() {
  const reports = await listReports();

  return NextResponse.json(
    reports.map((r) => ({
      contractId:   r.contractId,
      contractName: r.contractName,
      network:      r.network,
      riskScore:    r.riskScore,
      critical:     r.critical,
      high:         r.high,
      medium:       r.medium,
      low:          r.low,
      timestamp:    r.timestamp,
      findingsCount: r.findings.length,
    }))
  );
}
