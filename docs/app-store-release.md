# Path 1.0.0: TestFlight and App Store

Path is a standalone iPhone app built with Expo and React Native. TestFlight users do not need Expo Go or a development server.

## Identity and builds

- Display name: Path
- Bundle identifier: `com.terzima.path` (keep this for upgrades to existing installs)
- Marketing version: `1.0.0`
- Production profile: App Store distribution, with build numbers incremented remotely by EAS
- Encryption declaration: no non-exempt encryption. The app uses SQLite without SQLCipher and Expo Crypto only to generate random UUIDs.

Before building, run:

```sh
npm ci
npm run release:check
```

The first build needs an Expo login, an EAS project linked to this repository, and Apple Developer distribution credentials. Reuse the existing Path project and Apple team where available. Never commit passwords, signing certificates, provisioning profiles, or API keys.

```sh
npx eas-cli@latest login
npx eas-cli@latest init
npm run ios:testflight
```

`ios:testflight` creates a store build and uploads it to App Store Connect. It does not publish the app to customers. Alternatively use `npm run ios:build`, then `npm run ios:submit` and explicitly select the build just created.

App Store Connect app ID: `6820614249`. Apple team ID: `TYK9MH7YN5` (Terzima LLC). Both are configured in `eas.json` for the official app; contributors must use their own IDs for distributed forks. Apple sign-in is prompted by EAS and is not committed.

The initial App Store Connect record was created as `Path (d2f2e1)` because “Path” is already taken. Replace this temporary listing name with an available name before public release. The name below the iPhone icon remains Path.

## Distribute from Xcode Organizer

The local device archive is stored in Xcode's Archives folder as `Path-1.0.0-build-2.xcarchive`. Open Xcode > Window > Organizer, select Path 1.0.0 (2), then choose Distribute App > App Store Connect > Upload. Xcode manages the final distribution signing during upload. The previous automatic EAS submission for build 2 was canceled so distribution can be handled manually.

The generated `ios/` directory is ignored by Git. To recreate a local archive after changes, generate the project and install its pods, then archive the Release scheme for Any iOS Device using the Terzima LLC team. Use a new build number for each upload; EAS's remote build-number counter must also be kept ahead of any manually uploaded numbers.

Once Apple finishes processing the build, open Path > TestFlight in App Store Connect. Add the build to your internal testing group. External testers require Beta App Review and completed beta contact information.

## Public policy and support

The in-app policy is available from Overview > Privacy & About. The configured policy URL is `https://www.terzima.com/path/privacy`; the support URL for App Store Connect is `https://www.terzima.com/path/support`. Both pages are intentionally absent from the main website navigation and must remain accessible without sign-in. Confirm both are live before submission. `expo.extra` in `app.json` contains:

```json
"extra": {
  "privacyPolicyUrl": "https://www.terzima.com/path/privacy",
  "supportEmail": "slouis@terzima.com"
}
```

Supply the policy and support URLs in App Store Connect too. Public support and privacy URLs must work without sign-in.

For the current code, the App Privacy response is **Data Not Collected**: no developer backend, telemetry, advertising, or analytics is included. User-selected exports go to the destination the user chooses. Apple device backups and Apple-managed diagnostics are separate from Path's own data collection. Reassess this answer if a future version adds any collection SDK or backend.

## Listing draft

Confirm name availability, developer contact, copyright holder, pricing, territories, and age-rating responses in App Store Connect.

- Name: Path
- Subtitle: Plans into daily progress
- Primary category: Productivity
- Keywords: `tasks,planner,projects,checklist,schedule,focus,productivity,offline,csv`
- Promotional text: Turn project plans into dated work blocks. See today's priorities, track checklists, and adjust your schedule when plans change.

Description:

> Path helps you turn project plans into daily work.
>
> Organize tasks by project, schedule realistic work blocks, and see what needs attention today. Keep smaller steps in checklists and use recurring tasks for regular routines.
>
> Import plans from CSV, including ordered sequences and tasks that span several days. When your schedule changes, move one task or shift later tasks in the same sequence.
>
> Keep finished work in each project's archive, with options to restore or delete it.
>
> Your tasks stay on your device. Path works offline and has no account system, ads, or analytics.
>
> JSON export is available for folders, tasks, and recurring completion history. Checklist items are not included in that export, and backup restore is not yet supported.

Review notes:

> No login or special hardware is required. The app works offline. On Overview, tap Add Task to create a task; Folders creates project containers; Import CSV opens the iOS file picker. CSV templates are provided in the repository documentation. Tasks can contain checklists, recurring schedules, and sequence groups. Move opens scheduling controls; cascade shifting is optional. Completed tasks appear in the folder's Archive. Overview > Privacy & About explains local storage and export limitations.

TestFlight “What to Test”:

> Please test creating and editing tasks and folders, completing checklist items, recurring tasks, CSV import and reimport, rescheduling with and without cascade, archive restore/delete, and JSON export. Check that data survives closing and reopening the app. Verify the new icon, launch screen, and Privacy & About page. JSON export does not include checklist items, and restore from JSON is not supported in this version.

## Before App Store review

- Test a clean install and an upgrade from your previous build on a real iPhone. Confirm local data survives the upgrade.
- Exercise the flows in the TestFlight notes, including importing `docs/csv-template.csv`, cancellation, invalid files, and the system share sheet.
- App Store screenshot sets are ready in `marketing/app-store/iphone-medium` (1206 × 2622) and `marketing/app-store/iphone-large` (1320 × 2868). Each set has six opaque JPEGs captured from the release app with fictional sample tasks. Upload each size in its matching App Store Connect screenshot slot, in filename order. The upload guide is `marketing/app-store/README.md`; a ZIP is also saved in Downloads as `Path-App-Store-Screenshots.zip`.
- Complete the listing, support URL, privacy-policy URL, App Privacy responses, age rating, review contact, pricing, and availability. No review login is needed.
- Select the processed build for version 1.0.0, submit for App Review, and choose manual release if you want to control the launch after approval.

## Verification on October 8, 2026

- TypeScript check passed; 36 tests passed across 12 suites.
- Expo Doctor passed all 18 checks; the production iOS JavaScript bundle exported successfully.
- Xcode 27 built the standalone Release simulator app, which opened Overview on a fresh simulator without Expo Go or Metro.
- Xcode created the signed arm64 iOS archive for Path 1.0.0 (2), Terzima LLC, and its code signature verified successfully. It is selected in Organizer with Distribute App available. The final App Store distribution signature is applied during Organizer's upload flow.
- Public privacy and support URLs returned HTTP 200; both are unlisted in site navigation and have `noindex, nofollow` metadata.
- Compatible dependency updates removed the critical npm audit findings. The audit still reports 47 high and 17 moderate findings in SDK 54 and its dependency tree, including build/test tooling and URL parsing dependencies. These require triage or a tested SDK upgrade before public release; this is not a clean security audit. Forced audit fixes propose incompatible Expo/Jest versions and were not applied.

On-device upgrade testing, the full feature smoke test, listing metadata, and App Review remain to be completed before public release. Screenshot assets have been prepared; they still need to be uploaded in App Store Connect.

## References

- [Expo: TestFlight distribution](https://docs.expo.dev/submit/testflight/)
- [Expo: iOS submission](https://docs.expo.dev/submit/ios/)
- [Expo: remote build-number management](https://docs.expo.dev/build-reference/app-versions/)
- [Apple: App Review Guidelines](https://developer.apple.com/app-store/review/guidelines/)
- [Apple: App Privacy](https://developer.apple.com/help/app-store-connect/manage-app-information/manage-app-privacy)
- [Apple: current submission requirements](https://developer.apple.com/news/upcoming-requirements/)

## Marketing page

- Marketing URL: https://www.terzima.com/path
- Support URL: https://www.terzima.com/path/support
- Privacy URL: https://www.terzima.com/path/privacy
- The marketing page is linked from Terzima’s Apps page and uses actual app screens. It says Coming soon until public release. Replace that status with the live App Store link for app ID `6820614249` after release.

## Open-source distribution

The code and original documentation are MIT licensed. The official app remains free on the App Store; open sourcing does not publish it or transfer signing access. Path branding is reserved under BRANDING.md. Preserve LICENSE and third-party notices when distributing the source or binaries. Rebuild the JavaScript notices with `npm run notices:generate` after dependency changes; regenerate the CocoaPods acknowledgement snapshot after native dependency changes.
