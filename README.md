# ListMaster

A task management app with two roles:

- **Master** — creates a team, assigns tasks to everyone or specific clients,
  and watches progress: what each client still has open, and how long
  completed tasks actually took.
- **Client** — joins a team with an invite code and works through their task
  list. Finished tasks grey out and sink to the bottom of the list.

One React Native (Expo) codebase targets iOS, Android, and web. Firebase
(Authentication + Firestore) is the backend, so there's no server to run or
maintain.

## How it works

- Sign up, then choose **master** (create a team, get a 6-character invite
  code) or **client** (join a team with that code). This choice is permanent
  for that account.
- A master creates tasks and assigns them to everyone on the team or to
  specific clients. Each assignee gets their own independent copy to track.
- A client taps a task to mark it done. It immediately greys out and moves to
  a "Completed" section at the bottom of their list.
- The master's dashboard shows, per client: how many tasks are open, how many
  are done, and — for each completed task — how long it took from assignment
  to completion.

## Security & fair play

Firestore security rules (`firestore.rules`) are the enforcement layer, not
just the app's UI:

- **Role is permanent.** Master/client and team membership are set once at
  signup and can never be changed afterwards — no self-promotion, no
  switching teams.
- **Only the master can create or assign tasks**, and only to actual members
  of their own team.
- **Completion is one-way and server-timestamped.** A client can only flip
  their *own* assignment from incomplete to complete; `completedAt` is always
  the server's clock (`request.time`), never a value the client sends. A
  client can't backdate how long a task took, can't un-complete a task to
  hide the real time, and can't edit the task's title/description while
  "completing" it.
- **Reads are scoped.** A client only ever sees their own assignments, not
  teammates'. A master sees everything for their own team, nothing from other
  teams.
- **Invite codes aren't enumerable.** The join code is the team's document
  ID, so looking up a team by code is a single, narrowly-scoped read — not an
  open query that could let someone list every team's code.

See the comments at the top of `firestore.rules` for the full data model and
rationale. `scripts/test-firestore-rules.cjs` is a scripted check (19 cases)
that exercises every rule above — both the allowed paths and every
cheat/attack attempt — against a local Firestore emulator. Run it with:

```bash
npm run test:rules
```

## Project structure

```
App.tsx                      # Providers + root navigator
src/
  theme/                      # Colors, type scale, spacing, shadows
  components/                 # Shared UI building blocks
  types/                      # Shared TypeScript types
  firebase/                   # Firebase config, auth helpers, Firestore data layer
  context/AuthContext.tsx     # Live auth user + profile + team state
  navigation/                 # Auth / onboarding / client / master navigators
  screens/
    auth/                      # Welcome, login, sign up, role select, create/join team
    client/                    # Task list
    master/                    # Dashboard, create task, client detail
firestore.rules               # Security rules (the anti-cheat enforcement)
firestore.indexes.json
firebase.json
scripts/test-firestore-rules.cjs
```

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

In the [Firebase console](https://console.firebase.google.com/):

1. Create a project.
2. **Build → Authentication → Sign-in method** → enable **Email/Password**.
3. **Build → Firestore Database** → create a database (production mode is
   fine; the rules in this repo lock it down).
4. **Project settings → General → Your apps** → add a **Web app** and copy
   its config values.

### 3. Configure environment variables

```bash
cp .env.example .env
```

Fill in the Firebase config values from step 2. Expo inlines any
`EXPO_PUBLIC_*` variable into the app at build time.

### 4. Deploy the security rules

```bash
npx firebase-tools login
npx firebase-tools use --add        # pick the project you just created
npx firebase-tools deploy --only firestore:rules
```

### 5. Run the app

```bash
npm start
```

Then press `i` (iOS simulator), `a` (Android emulator), `w` (web), or scan
the QR code with the Expo Go app on a physical device.

## Notes

- There's intentionally no "reopen task" feature for masters — completion is
  one-way by design, so a completion time can't be disputed or faked after
  the fact. If a client makes a genuine mistake, the master creates a fresh
  task.
- Task descriptions are optional; titles are required.
