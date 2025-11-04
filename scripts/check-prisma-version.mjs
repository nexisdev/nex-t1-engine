import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

function requirePackageJson(name) {
  try {
    return require(`${name}/package.json`);
  } catch (error) {
    console.error(
      `[prisma-version-check] Failed to resolve ${name}. Ensure dependencies are installed before running this script.`,
    );
    throw error;
  }
}

const prismaPackage = requirePackageJson("prisma");
const prismaClientPackage = requirePackageJson("@prisma/client");

if (prismaPackage.version !== prismaClientPackage.version) {
  console.error(
    `[prisma-version-check] Version mismatch detected: prisma@${prismaPackage.version} != @prisma/client@${prismaClientPackage.version}.`,
  );
  console.error(
    "[prisma-version-check] Please align the versions in package.json and reinstall dependencies.",
  );
  process.exit(1);
}

console.log(
  `[prisma-version-check] prisma@${prismaPackage.version} and @prisma/client@${prismaClientPackage.version} are in sync.`,
);
