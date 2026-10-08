# Path

[Website](https://www.terzima.com/path) · [Support](https://www.terzima.com/path/support) · [Privacy](https://www.terzima.com/path/privacy) · [Contributing](CONTRIBUTING.md)

Path is a lightweight personal execution app for turning plans into dated work blocks. It is built for a solo builder managing multiple complex projects, not for teams, collaboration, or productivity-app sprawl.

The core idea is simple:

- Organize work by folder/project.
- Import structured plans from CSV.
- Convert ordered plan rows into real calendar dates.
- Execute from a tight Today/Overdue/Tomorrow view.
- Recover quickly when plans slip by moving tasks, with optional cascade shifting inside a sequence group.

Path is currently an Expo React Native app aimed at iPhone first.

## Status

Path is a free, open-source personal planner. Version 1.0.0 is being prepared for the App Store; it is not publicly available there yet. Terzima maintains the official iPhone app. You can also run the source locally or build a fork with your own developer accounts.

The code is MIT licensed. Path branding is reserved; see [BRANDING.md](BRANDING.md). The `private: true` setting in package.json prevents accidental npm publishing and does not control GitHub visibility.

## Privacy

Path stores app data locally with SQLite through `expo-sqlite`.

There are no accounts, no collaboration features, and no server-side sync in the current app. Your data lives on the device unless you export/share it yourself.

The app includes a JSON backup export. At the moment, backup is export-only; there is not yet a restore/import-from-backup flow.

## Core Concepts

### Folders

Folders are project containers, such as:

- `Product Launch`
- `Learning`
- `Personal`
- `General`

`General` is seeded as the default folder and cannot be deleted.

### Tasks

Tasks are work blocks, not microtasks. A task has:

- title
- description
- checklist items
- scheduled date
- duration
- energy type
- folder
- optional sequence group
- optional recurrence

Durations are entered as hours and minutes in the UI, but stored internally as decimal hours.

Examples:

- `20m`
- `1h`
- `1h 30m`
- `2h 15m`

### Checklists

Checklist items live inside a task. They can be checked off one at a time without completing the whole task.

### Sequence Groups

Sequence groups preserve ordered plans inside a folder.

Every folder has a default sequence group shown as `Main`. Internally, `Main` is stored using the folder ID, but the UI should show `Main`, not the raw ID.

Custom sequence groups can be used for separate ordered tracks inside the same folder:

- `backend`
- `frontend`
- `launch`
- `qa`

Inside a folder, sequence group buttons filter the task list. `All` shows everything. `Main` shows default-group tasks. Custom groups show only their own tasks.

### Cascade Moving

When moving tasks, cascade is optional.

- Cascade off: move only the selected task or tasks.
- Cascade on: move selected tasks and later tasks in the same sequence group.

This preserves realistic plan order when a sequence slips.

## Views

### Overview

The Overview screen intentionally stays focused:

- Today
- Overdue
- Tomorrow

Future tasks beyond tomorrow live in Upcoming.

### Folders

Folder screens show active tasks sorted by date. Finished tasks move into Archive.

### Archive

Archive is inside each folder. It groups finished tasks by month and supports:

- restore to active
- delete one task
- bulk delete selected tasks
- delete an entire month

## CSV Import

CSV is the primary reliable import path. PDF parsing is not the priority for this app; if a plan is complex, convert it to the CSV template first.

Template files:

- `docs/csv-template.csv`
- `docs/csv-seeded-template.csv`

Recommended header:

```csv
externalId,order,title,description,checklist,duration,energy,sequenceGroupId,date,spanDays,action
```

The parser reads by header name, but this order is recommended because it matches how tasks are usually written.

### Column Reference

`externalId`

A stable ID for reimport/update.

- Blank: always create a new task.
- Existing ID: update the matching task.
- New ID: create a new task.

Do not reuse an `externalId` for a different task later.

Good examples:

```text
rolo-auth-001
rolo-auth-002
rolo-update-001
robotics-calibration-001
```

`order`

Sheet order. This is not the final sequence index.

The importer sorts by `order`, expands multi-day rows, then assigns clean final sequence indexes per sequence group.

Decimal values are allowed for inserting tasks later:

```csv
order,title
1,Task A
2,Task B
2.5,Inserted task
3,Task C
```

Legacy `sequence` is still accepted as a fallback if `order` is missing.

`title`

Task title. Required for normal create/update rows.

`description`

Optional task notes.

`checklist`

Optional checklist items separated by semicolons:

```csv
Open project; Review plan; Start implementation
```

`duration`

Flexible duration input.

Supported examples:

```text
2
2h
1.5h
90m
1h 30m
20m
```

Blank or invalid durations default to `2h`.

`energy`

Supported values:

```text
deep
light
admin
```

Unknown values default to `deep`.

`sequenceGroupId`

Optional sequence group name.

- Blank: imports into the folder default group, shown as `Main`.
- Custom text: creates/uses that custom sequence group.

Examples:

```text
backend
frontend
launch
```

`date`

Optional explicit scheduled date in `YYYY-MM-DD` format.

If present, it anchors that row. Later blank-date rows in the same sequence group continue after it.

Example:

```csv
order,title,date,sequenceGroupId
1,Launch prep,2026-05-10,launch
2,Post-launch cleanup,,launch
```

This resolves to:

- `Launch prep` on `2026-05-10`
- `Post-launch cleanup` on `2026-05-11`

`spanDays`

Optional number of consecutive days for one row.

Example:

```csv
order,title,spanDays,sequenceGroupId
1,Build auth flow,4,backend
2,Review auth flow,,backend
```

This expands to:

```text
backend sequence 1: Build auth flow
backend sequence 2: Build auth flow
backend sequence 3: Build auth flow
backend sequence 4: Build auth flow
backend sequence 5: Review auth flow
```

The user does not need to calculate the next sequence number. `spanDays` consumes sequence slots automatically.

When a row with `externalId` is expanded across multiple days, the app creates day-specific IDs such as:

```text
rolo-backend-001-day-1
rolo-backend-001-day-2
rolo-backend-001-day-3
```

`action`

Optional import action.

Allowed values:

```text
blank
delete
archive
```

Rules:

- Blank: create or update normally.
- `delete`: delete the matching task by `externalId`.
- `archive`: mark the matching task done by `externalId`.

Delete/archive rows require `externalId`. If no matching task exists, the row is skipped and the import review reports that it could not find a match.

Missing CSV rows are not deleted automatically. Deletion must be explicit with `action=delete`.

### Sequence Resolution Rules

Sequence indexes are resolved per sequence group.

Example:

```csv
order,title,sequenceGroupId
1,Main task A,
2,Main task B,
8,Backend task A,backend
9,Backend task B,backend
```

The importer resolves:

```text
Main:
1 Main task A
2 Main task B

backend:
1 Backend task A
2 Backend task B
```

This means you can keep tasks in sheet order and let the app resolve clean sequence numbers inside each group.

### Reimport / Update Workflow

Fresh import:

```csv
externalId,order,title
rolo-auth-001,1,Build login screen
rolo-auth-002,2,Connect auth API
```

The app creates both tasks and stores their external IDs.

Later update:

```csv
externalId,order,title
rolo-auth-001,1,Build login screen
rolo-update-001,1.5,Add password reset
rolo-auth-002,2,Connect auth API
```

On reimport:

- `rolo-auth-001` updates existing task.
- `rolo-update-001` creates a new task.
- `rolo-auth-002` updates existing task.
- Final sequence indexes are recalculated from `order`.

### Chatbot Prompt For Creating A CSV

Use this prompt with a general chatbot when you have a roadmap, PDF text, rough outline, or messy task list and want help turning it into a Path-ready CSV.

```text
You are helping me create a CSV import file for Path, a personal task execution app.

Your job is to turn my project plan into work-block tasks, not tiny microtasks. Each task should usually be 1-4 hours, with checklist items inside the task when smaller steps are needed.

Before writing the final CSV, ask me follow-up questions until you have the exact task details needed. Ask about missing dates, project/folder, sequence groups, duration, unclear task titles, recurring behavior, and whether any tasks should span multiple days. If something is still unknown after asking, make a conservative assumption and clearly list it before the CSV.

Use this exact CSV header:

externalId,order,title,description,checklist,duration,energy,sequenceGroupId,date,spanDays,action

Rules to follow:

- externalId should be stable and human-readable, like rolo-auth-001 or robotics-calibration-001.
- For a fresh import, every real task should get an externalId.
- For a later update, keep the same externalId for existing tasks and create new externalIds only for new tasks.
- order controls sheet order. Use 1, 2, 3, etc. Use decimals like 2.5 only when inserting a task between existing rows.
- title is required.
- description is optional but should include useful context.
- checklist should use semicolons between items, like "Open repo; Review API; Implement screen".
- duration can be written as 2h, 90m, 1h 30m, 20m, or blank if unknown.
- energy should be deep, light, or admin.
- sequenceGroupId can be blank for Main, or a simple name like backend, frontend, launch, research, or testing.
- date should be YYYY-MM-DD only when I want to anchor a task to a specific calendar date.
- If date is blank, Path will schedule tasks by order from the chosen import start date or from the prior anchored date in that sequence group.
- spanDays should be blank for normal tasks. Use a number like 2, 3, or 4 when one task should appear across consecutive days.
- action should be blank for normal create/update rows. Use delete only when I explicitly want to delete an existing externalId. Use archive only when I explicitly want to mark an existing externalId complete.
- Do not use action=delete unless I directly ask for deletion.
- Missing rows should not be treated as deletion.
- Keep sequenceGroupId names simple and reusable.
- Output only valid CSV in the final answer, inside one code block, after your assumptions.

Here is my rough plan:

[PASTE MY TASKS, ROADMAP, PDF TEXT, OR OUTLINE HERE]
```

The most important instruction is that the chatbot should ask questions first. A good CSV import depends less on perfect formatting and more on knowing what the person's tasks actually are.

## Backup

The Backup button exports a JSON snapshot with:

- folders
- tasks
- recurring completions

Current limitation: there is not yet a Restore Backup action. Checklist items are not included in the current backup export. Treat backup JSON as a safety export for now, not a complete in-app restore flow.

## Development

Use Node.js 20.19.4 or newer (Node.js 22 LTS recommended). Clone and install the locked dependencies:

```bash
git clone https://github.com/terzima/path.git
cd path
npm ci
```

Run Expo locally:

```bash
npm start
```

Typecheck:

```bash
npm run typecheck
```

Run tests:

```bash
npm test -- --runInBand
```

Export iOS bundle for verification:

```bash
npx expo export --platform ios
```

### Run on an iOS simulator

On macOS, install Xcode and an iOS simulator runtime, then run:

```bash
npm run ios
```

This generates the ignored `ios/` directory, installs native dependencies, and starts a development build. Simulator development does not require App Store signing credentials. `npm start` starts Metro; press `i` to open a previously installed simulator build. The official store build is standalone and works without Expo Go or Metro.

### Build a fork with your own accounts

The checked-in configuration identifies the official Path app. Before creating cloud builds or distributing a fork:

1. Change `expo.name`, `expo.slug`, `expo.scheme`, and `expo.ios.bundleIdentifier` in app.json. Use your own name and unique bundle ID; add your own Android package if you intend to ship Android.
2. Replace the branded assets with your own and follow [BRANDING.md](BRANDING.md).
3. Remove `expo.owner` and `expo.extra.eas.projectId`, then run `npx eas-cli@latest login` and `npx eas-cli@latest init` to link your own Expo project.
4. Replace the privacy URL and support email with accurate details for your fork.
5. Remove or replace `submit.production.ios.ascAppId` and `appleTeamId` in eas.json with your own App Store Connect record and Apple team. Configure signing credentials through EAS or Xcode using your own Apple account.

The IDs in the official configuration are identifiers, not passwords or signing keys. They do not grant access to Terzima's accounts. Do not use the official publishing scripts until your fork has its own configuration. Keep credentials outside Git; never commit credentials.json, .env files, private keys, provisioning profiles, archives, or real task exports.

## Direct Install To iPhone Without TestFlight

This project uses Expo and EAS Build. If you are building from a PC and want to install directly to your own iPhone without TestFlight, use an EAS internal distribution build.

Requirements:

- Apple Developer Program membership
- Expo account
- EAS CLI
- Your iPhone registered for ad hoc/internal distribution

Install or run EAS CLI:

```bash
npm install -g eas-cli
```

Log in:

```bash
eas login
```

Register your iPhone with EAS:

```bash
eas device:create
```

Follow the prompts on your iPhone. This registers the device so Apple will allow an ad hoc/internal build to install on it.

Build the iOS app for direct install:

```bash
eas build --profile preview --platform ios
```

When the build finishes, open the install link from the EAS dashboard on your iPhone and install it directly.

Use `preview` for normal direct install. The existing `development` profile is a development-client style build and is mainly useful when you need dev-server behavior.

Important notes:

- This is not App Store distribution.
- This is not TestFlight.
- The iPhone must be registered before the build is signed for that device.
- If you add another iPhone later, you may need to create a new build or resign the existing build for the new device.

## Official TestFlight and App Store releases

For TestFlight and App Store release, use the `production` EAS profile. Run `npm run release:check`, then `npm run ios:testflight` to build and upload. This creates a standalone app; users do not need Expo Go. Uploading to TestFlight does not publish the app publicly.

See [the release guide](docs/app-store-release.md) for account setup, testing, listing copy, privacy requirements, and App Store submission. The [privacy policy](docs/privacy-policy.md) describes local storage, optional sharing, and support contact.

## Project Structure

```text
app/                         Expo Router routes
assets/                      App icons and images
docs/                        CSV templates and project docs
src/components/              Shared UI components
src/features/folders/        Folder, archive, and sequence group screens
src/features/import/         CSV parsing and import review
src/features/overview/       Today/Overdue/Tomorrow overview
src/features/recurrence/     Recurring task logic
src/features/scheduling/     Scheduling and cascade shift logic
src/features/tasks/          Add/edit task form
src/lib/                     Shared utilities and SQLite access
__tests__/                   Jest tests
```

## License

Source code and original documentation are licensed under the [MIT license](LICENSE), copyright © 2026 Terzima LLC. Commercial and noncommercial code reuse are permitted subject to the license notice requirements.

Path and Terzima branding, icons, and branded screenshots are excluded from that grant. See [BRANDING.md](BRANDING.md). Third-party components retain their original licenses; see [JavaScript dependency notices](THIRD_PARTY_NOTICES.txt) and [iOS dependency notices](docs/third-party-ios-notices.md).

Please read [CONTRIBUTING.md](CONTRIBUTING.md) before contributing and [SECURITY.md](SECURITY.md) for private security reports.
