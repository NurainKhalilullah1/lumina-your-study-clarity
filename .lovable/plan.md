

## Fix npm Install and Build Issues

### Problems Found

1. **Conflicting lock files** -- The project has both `bun.lockb`/`bun.lock` (from Bun) and `package-lock.json` (from npm). This causes npm to fail during install, which means dev tools like Vite never get set up.

2. **"vite is not recognized"** -- This error happens because `npm install` failed before it could install `vite` (which lives in devDependencies). Once the lock file conflict is resolved and install succeeds, Vite will work.

3. **`@capacitor/cli` in wrong section** -- It's a build tool and should be in devDependencies, not dependencies.

### What Will Be Done

1. **Delete `bun.lockb` and `bun.lock`** -- Remove the Bun lock files that conflict with npm
2. **Delete `package-lock.json`** -- Remove the stale lock file so a fresh one is generated
3. **Fix `package.json`** -- Move `@capacitor/cli` from `dependencies` to `devDependencies`

### After Pulling the Updated Code

Run these commands on your computer:

```
rm -rf node_modules
npm install
npx cap add android
npm run build
npx cap sync
npx cap open android
```

If `npm install` still gives issues, try:
```
npm install --legacy-peer-deps
```

### Technical Details

**Files to delete:**
- `bun.lockb`
- `bun.lock`
- `package-lock.json` (regenerated automatically by `npm install`)

**File to modify:**
- `package.json` -- Move `@capacitor/cli` from `dependencies` to `devDependencies`

