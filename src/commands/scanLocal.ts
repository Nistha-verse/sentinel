import pc from "picocolors";
import { runLocalValidationPipeline } from "../validators/pipeline";

export async function runScanLocal(targetPath: string): Promise<void> {
  try {
    console.log(pc.dim(`\n  Scanning local project: ${targetPath}\n`));
    const result = runLocalValidationPipeline(targetPath);

    // Print sections using simple colored output
    for (const section of [
      result.projectSection,
      result.environmentSection,
      result.usageSection,
    ]) {
      console.log(pc.bold(`\n  ${section.name}`));
      console.log("  " + "─".repeat(40));
      for (const item of section.items) {
        const icon =
          item.status === "success"
            ? pc.green("✔")
            : item.status === "error"
            ? pc.red("✖")
            : item.status === "warning"
            ? pc.yellow("⚠")
            : pc.dim("ℹ");
        console.log(`  ${icon} ${pc.bold(item.title)}: ${pc.dim(item.message)}`);
      }
    }
    console.log();
  } catch (error) {
    console.error(
      pc.red("\n  ✖ Local scan failed:"),
      error instanceof Error ? error.message : error
    );
    process.exitCode = 3;
  }
}
