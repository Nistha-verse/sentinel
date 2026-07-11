import pc from "picocolors";

export async function runHelp(): Promise<void> {
  console.log(`
${pc.bold(pc.cyan("SENTINEL"))} ${pc.dim("— Soroban Smart Contract Security Scanner")}

${pc.bold("USAGE")}
  ${pc.cyan("sentinel")} ${pc.green("<command>")} ${pc.dim("[options]")}

${pc.bold("COMMANDS")}
  ${pc.green("scan")} ${pc.dim("<contract-id>")}          Scan a deployed Soroban contract by ID
  ${pc.green("scan-local")} ${pc.dim("<path>")}            Scan a local project directory
  ${pc.green("report")} ${pc.dim("<contract-id>")}         Display a saved scan report
  ${pc.green("history")}                        List all saved scan reports
  ${pc.green("version")}                        Show Sentinel version information
  ${pc.green("help")}                           Show this help message

${pc.bold("SCAN OPTIONS")}
  ${pc.dim("--network")} ${pc.yellow("testnet|mainnet")}     Target network ${pc.dim("(default: testnet)")}
  ${pc.dim("--html")}                         Also generate an HTML report
  ${pc.dim("--rpc-url")} ${pc.yellow("<url>")}              Custom Stellar RPC endpoint

${pc.bold("REPORT OPTIONS")}
  ${pc.dim("--html")}                         Export report as HTML file

${pc.bold("EXAMPLES")}
  ${pc.dim("$")} sentinel scan ${pc.yellow("CBOT2ZNHCXFZRS5LBUUBQ7V3RH63WSNPF3GQ2HVDYDLR6GVJXRWG24X")}
  ${pc.dim("$")} sentinel scan ${pc.yellow("CBOT2Z...")} ${pc.dim("--network mainnet --html")}
  ${pc.dim("$")} sentinel report ${pc.yellow("CBOT2Z...")} ${pc.dim("--html")}
  ${pc.dim("$")} sentinel history
  ${pc.dim("$")} sentinel scan-local ${pc.yellow("./my-contract")}

${pc.bold("EXIT CODES")}
  ${pc.green("0")}  No findings or info-only findings
  ${pc.yellow("1")}  High severity findings detected
  ${pc.red("2")}  Critical severity findings detected
  ${pc.red("3")}  Scan error

${pc.bold("ENVIRONMENT")}
  ${pc.dim("STELLAR_RPC_URL")}   Override the default RPC endpoint
  ${pc.dim("SENTINEL_DEBUG=1")}  Enable verbose detector output
`);
}
