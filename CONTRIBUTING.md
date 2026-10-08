# Contributing to Path

Path is a small, offline iPhone planner. Contributions that improve reliability, accessibility, local data handling, and clear workflows are welcome. An issue or pull request does not guarantee a particular response time or release date.

## Getting started

Use Node.js 20.19.4 or newer (Node.js 22 LTS recommended), then:

```sh
git clone https://github.com/terzima/path.git
cd path
npm ci
npm run typecheck
npm test -- --runInBand
```

See README.md for simulator setup and building your own fork. Apple and Expo signing credentials are not needed to run the TypeScript check or unit tests.

## Changes

- Open an issue before a large change so we can discuss scope. Small fixes can go straight to a pull request.
- Keep changes focused and explain the problem, resulting behavior, and how you verified it.
- Follow the existing TypeScript and React Native style. Add meaningful tests for scheduling, CSV import, recurrence, and data changes.
- Preserve existing user data. SQLite migrations must work for both new installs and upgrades.
- Avoid analytics, tracking, accounts, and external services unless their privacy implications have been discussed explicitly.
- Use fictional examples and screenshots. Do not include personal task data.
- Be respectful and constructive in issues and reviews.

Before submitting, run:

```sh
npm run typecheck
npm test -- --runInBand
```

For changes to app configuration or native dependencies, also run `npx expo-doctor` and `npx expo export --platform ios`. Test visual changes in the app. Describe any checks you could not run.

By submitting a contribution, you agree that your original contribution is licensed under the project's MIT license and that you have the right to contribute it. Third-party material must retain its required licenses and notices. No contributor license agreement is required.

## Security and privacy issues

Follow SECURITY.md rather than posting sensitive details in a public issue. Never commit tokens, passwords, signing keys, provisioning profiles, local databases, or exported user backups.

## Official releases

Terzima maintains the official App Store app. Contributors and forks use their own identities and signing credentials. See BRANDING.md for names and logos.
