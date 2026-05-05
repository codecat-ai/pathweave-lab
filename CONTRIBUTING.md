# Contributing

Thanks for considering a contribution to Pathweave Lab.

## Development workflow

1. Create a branch from `main`.
2. Add or update behavior tests before changing production behavior.
3. Keep code comments and commit messages in English.
4. Run the full verification suite:

```bash
npm ci
npm run lint
npm run format
npm test -- --run
npm run build
```

## Documentation

When README content changes, keep `README.md`, `README-zh.md`, and `README-jp.md` synchronized in meaning.

## Package publication

This project is not published to a package registry. Please do not add registry install instructions unless a release has been explicitly published and verified.
