import * as crypto from "node:crypto";

process.env.PRISMA_HIDE_UPDATE_MESSAGE ??= "true";
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE ??= "1";

if (typeof globalThis.crypto === "undefined") {
  // @ts-expect-error
  globalThis.crypto = crypto;
}
