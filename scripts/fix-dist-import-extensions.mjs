import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { join, relative } from "node:path";

const DIST_DIR = join(process.cwd(), "dist");

const ALLOWED_EXTENSIONS = new Set([".js", ".mjs", ".cjs", ".json", ".node", ".wasm"]);

const importPatterns = [
  /(import\s+[^"'()]*?from\s+["'])(\.\.?(?:\/[\w.-]+)*)(["'];)/g, // import ... from "./foo"
  /(export\s+\*\s+from\s+["'])(\.\.?(?:\/[\w.-]+)*)(["'];)/g, // export * from "./foo"
  /(import\s*["'])(\.\.?(?:\/[\w.-]+)*)(["'];)/g, // side-effect imports
  /(import\s*\(\s*["'])(\.\.?(?:\/[\w.-]+)*)(["']\s*\))/g, // dynamic import("./foo")
];

function shouldAppendJsExtension(specifier) {
  if (specifier.includes("?")) return false;
  if (specifier.includes("#")) return false;
  const lastSegment = specifier.slice(specifier.lastIndexOf("/") + 1);
  if (lastSegment === "") return false;
  return !ALLOWED_EXTENSIONS.has(`.${lastSegment.split(".").pop() ?? ""}`);
}

function appendJsExtension(specifier) {
  if (!shouldAppendJsExtension(specifier)) {
    return specifier;
  }
  return `${specifier}.js`;
}

async function processFile(filePath) {
  const original = await readFile(filePath, "utf8");
  let transformed = original;

  for (const pattern of importPatterns) {
    transformed = transformed.replace(pattern, (_, prefix, specifier, suffix) => {
      return `${prefix}${appendJsExtension(specifier)}${suffix}`;
    });
  }

  if (transformed !== original) {
    await writeFile(filePath, transformed, "utf8");
  }
}

async function walk(directory) {
  const entries = await readdir(directory);
  for (const entry of entries) {
    const entryPath = join(directory, entry);
    const entryStat = await stat(entryPath);
    if (entryStat.isDirectory()) {
      await walk(entryPath);
      continue;
    }
    if (!entry.endsWith(".js")) {
      continue;
    }
    await processFile(entryPath);
  }
}

async function main() {
  await walk(DIST_DIR);
}

await main().catch((error) => {
  const scriptPath = relative(process.cwd(), import.meta.url.replace("file://", ""));
  console.error(`[fix-dist-import-extensions] Failed while processing ${scriptPath}`);
  console.error(error);
  process.exitCode = 1;
});

