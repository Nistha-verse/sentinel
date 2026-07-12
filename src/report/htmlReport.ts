import * as fs from "fs";
import * as path from "path";
import type { SavedReport } from "../storage/reportStore";
import type { Finding, Severity } from "../utils/types";

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function severityColor(severity: Severity): string {
  switch (severity) {
    case "critical": return "#ef4444";
    case "high":     return "#f97316";
    case "medium":   return "#eab308";
    case "low":      return "#3b82f6";
    case "info":     return "#6b7280";
  }
}

function severityBg(severity: Severity): string {
  switch (severity) {
    case "critical": return "#fef2f2";
    case "high":     return "#fff7ed";
    case "medium":   return "#fefce8";
    case "low":      return "#eff6ff";
    case "info":     return "#f9fafb";
  }
}

function riskGaugeColor(score: number): string {
  if (score >= 80) return "#ef4444";
  if (score >= 60) return "#f97316";
  if (score >= 40) return "#eab308";
  if (score >= 20) return "#3b82f6";
  return "#22c55e";
}

function confidenceColor(confidence: string): string {
  switch (confidence) {
    case "high":   return "#166534";
    case "medium": return "#92400e";
    case "low":    return "#1e40af";
    default:       return "#374151";
  }
}

function renderFinding(finding: Finding, index: number): string {
  const color = severityColor(finding.severity);
  const bg = severityBg(finding.severity);
  const conf = finding.confidence ?? "medium";
  return `
    <div class="finding" style="border-left: 4px solid ${color}; background: ${bg}; margin-bottom: 16px; padding: 16px; border-radius: 6px;">
      <div style="display:flex; align-items:center; gap:12px; margin-bottom:8px; flex-wrap:wrap;">
        <span style="background:${color}; color:#fff; padding:2px 10px; border-radius:12px; font-size:12px; font-weight:600; text-transform:uppercase;">
          ${escapeHtml(finding.severity)}
        </span>
        <span style="border:1px solid ${confidenceColor(conf)}; color:${confidenceColor(conf)}; padding:2px 8px; border-radius:12px; font-size:11px; font-weight:500; text-transform:uppercase;">
          ${escapeHtml(conf)} confidence
        </span>
        <span style="font-weight:600; font-size:15px; color:#111827;">${escapeHtml(finding.title)}</span>
        ${finding.affectedFunction ? `<span style="font-family:monospace; font-size:12px; color:#6b7280; margin-left:auto;">${escapeHtml(finding.affectedFunction)}</span>` : ""}
      </div>
      <div style="font-size:11px; color:#6b7280; margin-bottom:8px;">Detector: <code>${escapeHtml(finding.detector)}</code></div>
      <p style="color:#374151; margin:0 0 8px 0; font-size:14px;">${escapeHtml(finding.description)}</p>
      <div style="background:#fff; border:1px solid #e5e7eb; border-radius:4px; padding:10px; margin-bottom:8px;">
        <span style="font-size:12px; font-weight:600; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em;">Recommendation</span>
        <p style="color:#374151; margin:4px 0 0 0; font-size:13px;">${escapeHtml(finding.recommendation)}</p>
      </div>
      ${finding.evidence ? `<div style="font-family:monospace; font-size:12px; color:#6b7280; background:#f3f4f6; padding:6px 10px; border-radius:4px;">Evidence: ${escapeHtml(finding.evidence)}</div>` : ""}
    </div>`;
}

export function generateHtmlReport(report: SavedReport): string {
  const critical = report.findings.filter((f) => f.severity === "critical");
  const high = report.findings.filter((f) => f.severity === "high");
  const medium = report.findings.filter((f) => f.severity === "medium");
  const low = report.findings.filter((f) => f.severity === "low");
  const info = report.findings.filter((f) => f.severity === "info");

  const gaugeColor = riskGaugeColor(report.riskScore);
  const timestamp = new Date(report.timestamp).toLocaleString();

  // Group findings by severity for display
  const severityGroups: Array<{ label: string; severity: Severity; items: Finding[] }> = [
    { label: "Critical", severity: "critical", items: critical },
    { label: "High", severity: "high", items: high },
    { label: "Medium", severity: "medium", items: medium },
    { label: "Low", severity: "low", items: low },
    { label: "Info", severity: "info", items: info },
  ];

  const findingsHtml = severityGroups
    .filter((g) => g.items.length > 0)
    .map(
      (g) => `
      <div class="section">
        <h2 style="color:${severityColor(g.severity)}; border-bottom:2px solid ${severityColor(g.severity)}; padding-bottom:8px; margin-bottom:16px;">
          ${g.label} Findings (${g.items.length})
        </h2>
        ${g.items.map((f, i) => renderFinding(f, i)).join("")}
      </div>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Sentinel Security Report — ${escapeHtml(report.contractName)}</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background:#f9fafb; color:#111827; margin:0; padding:0; }
    .container { max-width:960px; margin:0 auto; padding:32px 24px; }
    .header { background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%); color:#fff; padding:32px; border-radius:12px; margin-bottom:32px; }
    .header h1 { margin:0 0 4px 0; font-size:28px; font-weight:700; }
    .header .subtitle { color:#94a3b8; font-size:14px; margin:0; }
    .meta-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(200px,1fr)); gap:16px; margin-bottom:32px; }
    .meta-card { background:#fff; border:1px solid #e5e7eb; border-radius:8px; padding:16px; }
    .meta-card .label { font-size:12px; color:#6b7280; text-transform:uppercase; letter-spacing:0.05em; margin-bottom:4px; }
    .meta-card .value { font-size:16px; font-weight:600; color:#111827; font-family:monospace; word-break:break-all; }
    .risk-card { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:24px; margin-bottom:32px; display:flex; align-items:center; gap:32px; }
    .risk-score { font-size:64px; font-weight:800; color:${gaugeColor}; line-height:1; }
    .risk-label { font-size:14px; color:#6b7280; margin-top:4px; }
    .risk-breakdown { display:flex; gap:24px; flex-wrap:wrap; }
    .risk-item { text-align:center; }
    .risk-item .count { font-size:28px; font-weight:700; }
    .risk-item .name { font-size:12px; color:#6b7280; text-transform:uppercase; }
    .section { background:#fff; border:1px solid #e5e7eb; border-radius:12px; padding:24px; margin-bottom:24px; }
    .footer { text-align:center; color:#9ca3af; font-size:13px; margin-top:32px; padding-top:24px; border-top:1px solid #e5e7eb; }
    @media (max-width:600px) { .risk-card { flex-direction:column; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🛡 Sentinel Security Report</h1>
      <p class="subtitle">Soroban Smart Contract Security Analysis</p>
    </div>

    <div class="meta-grid">
      <div class="meta-card">
        <div class="label">Contract ID</div>
        <div class="value" style="font-size:12px;">${escapeHtml(report.contractId)}</div>
      </div>
      <div class="meta-card">
        <div class="label">Contract Name</div>
        <div class="value">${escapeHtml(report.contractName)}</div>
      </div>
      <div class="meta-card">
        <div class="label">Network</div>
        <div class="value">${escapeHtml(report.network ?? "testnet")}</div>
      </div>
      <div class="meta-card">
        <div class="label">Scan Time</div>
        <div class="value" style="font-size:13px;">${escapeHtml(timestamp)}</div>
      </div>
      ${report.wasmHash ? `<div class="meta-card"><div class="label">WASM Hash</div><div class="value" style="font-size:11px;">${escapeHtml(report.wasmHash)}</div></div>` : ""}
    </div>

    <div class="risk-card">
      <div>
        <div class="risk-score">${report.riskScore}</div>
        <div class="risk-label">Risk Score / 100</div>
      </div>
      <div class="risk-breakdown">
        <div class="risk-item">
          <div class="count" style="color:#ef4444;">${critical.length}</div>
          <div class="name">Critical</div>
        </div>
        <div class="risk-item">
          <div class="count" style="color:#f97316;">${high.length}</div>
          <div class="name">High</div>
        </div>
        <div class="risk-item">
          <div class="count" style="color:#eab308;">${medium.length}</div>
          <div class="name">Medium</div>
        </div>
        <div class="risk-item">
          <div class="count" style="color:#3b82f6;">${low.length}</div>
          <div class="name">Low</div>
        </div>
        <div class="risk-item">
          <div class="count" style="color:#6b7280;">${info.length}</div>
          <div class="name">Info</div>
        </div>
      </div>
    </div>

    ${findingsHtml || '<div class="section"><p style="color:#6b7280; text-align:center;">No security findings detected.</p></div>'}

    <div class="footer">
      Generated by <strong>Sentinel</strong> v${escapeHtml(report.scannedBy)} &bull; ${escapeHtml(timestamp)}
    </div>
  </div>
</body>
</html>`;
}

export function writeHtmlReport(report: SavedReport, outputDir: string): string {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  const outPath = path.join(outputDir, `${report.contractId}.html`);
  fs.writeFileSync(outPath, generateHtmlReport(report), "utf8");
  return outPath;
}
