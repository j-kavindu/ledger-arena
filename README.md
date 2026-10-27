# Ledger Arena

Accounting practice with 10,210 cases, Google sign-in, cross-device progress sync and installable offline gameplay.

## Play

Open the GitHub Pages site. Sign in with the same Google account on each device to sync submitted answers, question history, notes and completed focus sessions. Guest progress remains local; export and restore a backup after signing in to merge it into your account.

## Install

Use the Install app button. On iPhone or iPad use Safari → Share → Add to Home Screen. Visit online once before offline practice. Sync resumes while online or on the next signed-in visit.

## Hosting

This is a buildless static website. GitHub Pages serves the main branch root. All asset paths support repository subfolders.

Firebase project: accounting-simulation. The public web configuration is in auth.js. No administrator credentials are included. Firestore rules restrict progress to the signed-in user’s own UID. A deployment hostname must be in Firebase Authentication’s authorized domains.

## Validation

Game regressions, two-client synchronization simulations, account isolation and offline-cache tests passed before publication. Firebase’s Rules Playground verified anonymous and cross-account reads are denied and own-account reads are allowed. Physical-device installation and a real two-device account test still need verification.
