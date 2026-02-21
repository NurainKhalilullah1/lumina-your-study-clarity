

## Convert StudyFlow Web App to Native Android App with Capacitor

This plan sets up your StudyFlow web app as a native Android application using Capacitor, so you can build and run it in Android Studio.

### What Will Happen

1. **Install Capacitor** -- A bridge layer that wraps your web app into a native Android shell
2. **Configure the project** -- Set up the app ID, name, and live-reload connection to Lovable's preview server
3. **You build locally** -- After setup, you'll pull the code to your computer, open it in Android Studio, and run it on your phone or emulator

### Steps

#### Step 1: Install Capacitor Dependencies

The following packages will be added to the project:
- `@capacitor/core`
- `@capacitor/cli` (dev dependency)
- `@capacitor/android`

#### Step 2: Initialize Capacitor

A `capacitor.config.ts` file will be created in the project root with:
- **App ID**: `app.lovable.27168b78f9c4486c84cd8eab9a4eb6e7`
- **App Name**: `StudyFlow`
- **Web Dir**: `dist`
- **Live-reload server URL**: Points to your Lovable preview so you can see changes instantly on your device during development

#### Step 3: What You Do on Your Computer

Once the code changes are made in Lovable, you will need to:

1. **Export to GitHub** -- Click the GitHub button in Lovable settings to push the code to your own repository
2. **Clone and install** -- Pull the repo to your computer and run `npm install`
3. **Add Android platform** -- Run `npx cap add android`
4. **Update native dependencies** -- Run `npx cap update android`
5. **Build the web app** -- Run `npm run build`
6. **Sync to Android** -- Run `npx cap sync`
7. **Open in Android Studio** -- Run `npx cap open android`
8. **Run the app** -- Click the Run button in Android Studio to launch on your emulator or connected phone

After any future changes you pull from GitHub, just run `npx cap sync` again to update the Android project.

---

### Technical Details

**New file:**
- `capacitor.config.ts` -- Capacitor configuration

**Modified file:**
- `package.json` -- Add Capacitor dependencies

**No existing functionality is changed** -- this only adds the native wrapper layer on top of your existing web app.

For more details, refer to the Lovable blog post on building native apps with Capacitor.

