## Unreleased

### Changed
- Align Prisma CLI and client to `5.22.0` to eliminate Railway deployment warnings about mismatched versions.
- Add `tsx` as a managed dev dependency and shift runtime scripts to use the compiled JS entrypoints with Node’s specifier resolution flag, avoiding `npx` downloads during cold starts.

### Fixed
- Check in the Prisma version parity script so Docker builds on Railway can execute the postinstall guard without failing.
- Post-process compiled ESM imports to include `.js` extensions, allowing us to drop Node's experimental specifier resolution flag and silence runtime warnings in Railway.
- Hide Prisma upgrade notices and AWS SDK v2 maintenance banners in production logs while updating Fastify header schemas to avoid v5 deprecation warnings.

