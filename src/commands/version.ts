import * as fs from "fs";
import * as path from "path";
import pc from "picocolors";

export async function runVersion(): Promise<void> {
  const pkgPath = path.resolve(__dirname, "../../package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8")) as {
    version?: string;
    name?: string;
  };

  console.log(
    `\n  ${pc.bold(pc.cyan("Sentinel"))} ${pc.bold(`v${pkg.version ?? "1.0.0"}`)}`
  );
  console.log(`  ${pc.dim("Node.js")}  ${process.version}`);
  console.log(`  ${pc.dim("Platform")} ${process.platform}/${process.arch}`);
  console.log();
}
