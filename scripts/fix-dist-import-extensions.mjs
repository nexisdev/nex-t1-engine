import { readdir, readFile, writeFile, stat } from "node:fs/promises";
import { existsSync, statSync } from "node:fs";
import { dirname, join, relative, resolve } from "node:path";

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

function resolveRelativeImport(filePath, specifier) {
  if (!shouldAppendJsExtension(specifier)) {
    return specifier;
  }

  if (!specifier.startsWith(".")) {
    return specifier;
  }

  const baseDir = dirname(filePath);
  const candidateWithJs = `${specifier}.js`;
  const candidateWithJsPath = resolve(baseDir, candidateWithJs);

  if (existsSync(candidateWithJsPath) && statSync(candidateWithJsPath).isFile()) {
    return candidateWithJs;
  }

  const candidateDirPath = resolve(baseDir, specifier);
  if (existsSync(candidateDirPath) && statSync(candidateDirPath).isDirectory()) {
    const indexJsPath = resolve(candidateDirPath, "index.js");
    if (existsSync(indexJsPath) && statSync(indexJsPath).isFile()) {
      return `${specifier}/index.js`;
    }
  }

  return candidateWithJs;
}

async function processFile(filePath) {
  const original = await readFile(filePath, "utf8");
  let transformed = original;

  for (const pattern of importPatterns) {
    transformed = transformed.replace(pattern, (_, prefix, specifier, suffix) => {
      return `${prefix}${resolveRelativeImport(filePath, specifier)}${suffix}`;
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

