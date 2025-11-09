import { input, confirm } from "@inquirer/prompts";
import { copyFile, appendFile, rename } from "node:fs/promises";
import { WriteStream } from "fs";
import { createWriteStream } from "node:fs";

const originalFile = Bun.file("LootBoxes-original.csv");

if (!originalFile.exists()) {
  const isModified = await confirm({
    message: "No backup file found. Have you modified LootBoxes.csv before?",
    default: true,
  });
  if (isModified) {
    console.log(
      "Please restore LootBoxes.csv from your backup before running this script."
    );
    process.exit(1);
  }

  console.log("Creating backup of LootBoxes.csv as LootBoxes-original.csv");

  if(!(await Bun.file("LootBoxes.csv").exists())) {
    console.log("LootBoxes.csv not found. Please copy it to the same directory as this script.");
    process.exit(1);
  }
  
  await copyFile("LootBoxes.csv", "LootBoxes-original.csv");
} else {
  console.log(
    "Backup file LootBoxes-original.csv already exists. Continuing..."
  );
}

const multiplierInput = Number(
  await input({
    message: "Enter the multiplier for loot:",
    default: "1",
    pattern: /^\d+?$/,
    prefill: "editable",
    required: true,
    patternError: "Please enter a positive natural number.",
    validate(value) {
      const num = Number(value);
      if (
        isNaN(num) ||
        num <= 0 ||
        !Number.isSafeInteger(num) ||
        num !== Math.floor(num)
      ) {
        return "Multiplier must be a positive natural number.";
      }
      return true;
    },
  })
);

console.log(`Applying multiplier of ${multiplierInput} to loot...`);

const dirtyFile = Bun.file("LootBoxes-dirty.csv");
if (await dirtyFile.exists()) {
  console.log("Removing existing dirty file LootBoxes-dirty.csv");
  await dirtyFile.unlink();
}
const orginalContent = (await originalFile.text()).split("\n");
const dirtyContent = orginalContent.map((line) => {
  if (line === "") {
    return line;
  }
  const [LootBox, Location, Item0, Count0, Item1, Count1, Item2, Count2, Item3, Count3, Item4, Count4, Item5, Count5, Item6, Count6, Item7, Count7, Item8, Count8, Item9, Count9, MutableLootData, bChanged] = line.split(",");
  if (LootBox === "LootBox" || Item0 === "#REF!" || LootBox === "") {
    return line;
  }
  const newCouts = [Count0, Count1, Count2, Count3, Count4, Count5, Count6, Count7, Count8, Count9].map((count) => {
    if (count === "" || isNaN(Number(count))) {
      return count;
    }
    return String(Math.floor(Number(count) * multiplierInput));
  });

  return [LootBox, Location, Item0, newCouts[0], Item1, newCouts[1], Item2, newCouts[2], Item3, newCouts[3], Item4, newCouts[4], Item5, newCouts[5], Item6, newCouts[6], Item7, newCouts[7], Item8, newCouts[8], Item9, newCouts[9], MutableLootData, bChanged].join(",");
});

await dirtyFile.write(dirtyContent.join("\n"));
await rename("LootBoxes.csv", `LootBoxes-backup-${Date.now()}.csv`);
await rename("LootBoxes-dirty.csv", "LootBoxes.csv");
console.log("Done!");