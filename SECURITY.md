# Reporting a security or privacy issue

Email slouis@terzima.com with the subject "Path security". Include the affected version, reproducible steps using fictional data, and the likely impact. Keep credentials, personal task data, and device identifiers out of the report unless we agree on a suitable way to share them.

Please avoid disclosing exploitable security or privacy details in a public issue before a fix or mitigation is available. There is no paid bug bounty or guaranteed response time.

Path is maintained on the main branch and has no separate long-term support branches. The app stores task data locally and has no account service or server sync. Device backups and exported files are handled by the operating system and the destination selected by the user.

The current Expo SDK 54 dependency tree has known npm audit findings. See docs/app-store-release.md for the current verification and limitations. This repository is not a claim that all dependencies are free of vulnerabilities.
