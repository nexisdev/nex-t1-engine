import { readFileSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

describe("prisma dependency versions", () => {
  it("aligns prisma and @prisma/client versions", () => {
    const packageJsonPath = join(process.cwd(), "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8"));

    const prismaVersion = packageJson.dependencies?.prisma;
    const prismaClientVersion = packageJson.dependencies?.["@prisma/client"];

    expect(prismaVersion).toBeDefined();
    expect(prismaClientVersion).toBeDefined();
    expect(prismaVersion).toBe(prismaClientVersion);
  });
});

