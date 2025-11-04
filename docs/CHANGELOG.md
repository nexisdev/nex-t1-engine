## Unreleased

### Changed
- Align Prisma CLI and client to `5.22.0` to eliminate Railway deployment warnings about mismatched versions.
- Add `tsx` as a managed dev dependency and shift runtime scripts to use the compiled JS entrypoints with Node’s specifier resolution flag, avoiding `npx` downloads during cold starts.

