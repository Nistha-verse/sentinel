import { ValidationSection } from "../utils/types";

export function printReport(sections: ValidationSection[]): void {
  console.log("\n Sentinel v1.0.0");
  console.log("=====================================\n");

  let totalErrors = 0;
  let totalWarnings = 0;

  for (const section of sections) {
    console.log(`${section.name}`);
    console.log("-------------------------------------");

    for (const item of section.items) {
      let icon = "";

      switch (item.status) {
        case "success":
          icon = "✔";
          break;

        case "warning":
          icon = "⚠";
          totalWarnings++;
          break;

        case "error":
          icon = "✖";
          totalErrors++;
          break;

        case "info":
          icon = "ℹ";
          break;

        case "pending":
          icon = "";
          break;
      }

      console.log(`${icon} ${item.title}`);
      console.log(`   ${item.message}`);
    }

    console.log();
  }

  console.log("=====================================");
  console.log(`Errors   : ${totalErrors}`);
  console.log(`Warnings : ${totalWarnings}`);

  if (totalErrors > 0) {
    console.log("\nStatus: ❌ Validation Failed");
  } else if (totalWarnings > 0) {
    console.log("\nStatus: ⚠ Review Recommended");
  } else {
    console.log("\nStatus: ✅ Everything Looks Good");
  }

  console.log("=====================================\n");
}