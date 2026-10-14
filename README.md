# DSM Clinic — Patient App

Native patient app for the DSM Clinic platform. Built with Expo SDK 57, React Native 0.86, TypeScript (strict), Expo Router, Redux Toolkit and RTK Query, React Hook Form and Zod, SecureStore and Lucide icons. It talks to the existing backend (`../backend`) only; there is no mock data.

## What patients can do

| Area | What the app does |
| --- | --- |
| Account | Log in with the phone number and a 6-digit code from the clinic. No sign-up and no password. The patient stays logged in while the app is used; after logging out, a new code is needed. |
| Home | Greeting, next appointment, quick access, latest prescription, recent visits, open requests, contact shortcut, welcome state for new patients. |
| Medical History | Timeline of past visits in every branch with their prescriptions and document counts. |
| Appointments | Upcoming and past lists, details with doctor, branch address and phone, linked prescription and documents. |
| Prescriptions | List and detail with medicines grouped by category, dose, instructions, follow-up date and the plan. |
| Documents | Records from the clinic and the patient's own uploads (PDF, JPG, PNG, WebP up to 10 MB) with progress, cancel and retry. Files open through a 2-minute signed link in the in-app browser; nothing is saved on the phone. |
| Contact | Middle tab. Category, subject and message, an emergency notice, the request number from the backend on success, request history, status timeline and the clinic's reply. |
| Profile | Name, phone, age, date of birth, city, clinic contact, "ask to correct my details". |

## Folder structure

```text
mobile-app/
  app.json                 Expo config (name, scheme, plugins, permission texts)
  eas.json                 EAS build profiles: development, preview, production
  .env.example             EXPO_PUBLIC_API_URL
  src/
    app/                   Expo Router screens (every file is a route)
      _layout.tsx          Redux + safe area providers, protected route groups
      index.tsx            Start screen: restores the session or shows "can't reach the clinic"
      (auth)/              login (phone + clinic code)
      (patient)/
        (tabs)/            home, history, contact, prescriptions, profile
        appointments/      index, [id]
        prescriptions/[id] prescription detail
        requests/          index, [id]
        documents.tsx      list + upload
    components/
      ui/                  AppText, Screen, ListScreen, Button, TextField, FormField, Card, StatusBadge,
                           InfoRow, SectionHeader, Avatar, Notice, ChoiceChips, confirm()
      feedback/            EmptyState, ErrorState, SkeletonBlock, CardSkeleton
      medical/             AppointmentCard, PrescriptionCard, HistoryItem, DocumentCard, FileButton, RequestCard
    features/
      auth/                slice, session restore / sign-in / sign-out, SecureStore, form schemas
      documents/           file rules, upload task with progress, upload panel
    services/api/          RTK Query base (token refresh) and patient endpoints
    store/                 Redux store and typed hooks
    hooks/                 useOpenDocument, useRefresh
    lib/                   config, formatting, labels, errors, phone check (+ unit tests)
    theme/tokens.ts        colors, spacing, radii, type scale, touch sizes
    types/api.ts           backend response types
```

## Install and run

Requirements: Node 20+, and for devices either Android Studio / Xcode or an EAS account.

```sh
cd mobile-app
npm install
cp .env.example .env          # set EXPO_PUBLIC_API_URL
npx expo start                # then press a (Android) or i (iOS)
```

The app uses native modules that Expo Go may not include in the same version, so use a development build:

```sh
npx expo run:android          # local Android build (Android Studio + emulator or USB device)
npx expo run:ios              # local iOS build (macOS + Xcode)
```

Checks:

```sh
npm run typecheck
npm run lint
npm test
npx expo-doctor
```

## Environment

| Variable | Example | Notes |
| --- | --- | --- |
| `EXPO_PUBLIC_API_URL` | `https://dr-shawana-shared-backend.vercel.app/api/v1` | Required. Must be `https://` in release builds; the app stops at start-up otherwise. For a local backend on an Android emulator use `http://10.0.2.2:4000/api/v1`. |

It is the only setting. No secret belongs in the app: anything in `EXPO_PUBLIC_*` is readable inside the build.

## Builds (EAS)

```sh
npm install -g eas-cli        # or npx eas-cli@latest <command>
eas login
eas init                      # links the project, adds the projectId to app.json
eas build --profile development --platform android   # dev client APK for testers
eas build --profile preview --platform android       # installable APK
eas build --profile production --platform all        # store builds (AAB / IPA)
eas submit --platform android                        # or ios
```

Before the first store build, confirm `ios.bundleIdentifier` and `android.package` (`com.dsmclinic.patient`), the app name, icon and splash in `app.json`.

## Security and privacy

- Patients sign in with their own account in the backend, separate from staff logins. A patient token is refused by every staff route and a staff token by every patient route.
- Every patient route reads the patient from the token; no request accepts a patient id. Records, prescriptions, files and requests of other patients return 404.
- Login needs a single-use 6-digit code from the clinic (24 hours, 5 wrong tries), so knowing someone's phone number is not enough. There are no passwords to leak or reset.
- Login and refresh are rate limited. Logging out ends the session; logging in again needs a new code.
- Access tokens live 15 minutes and only in memory. The refresh token (60 days, replaced on every use) is kept in SecureStore with `WHEN_UNLOCKED_THIS_DEVICE_ONLY` and excluded from Android backup.
- Log out revokes the session on the server, clears SecureStore and the whole RTK Query cache. Signing in clears the cache too, so another account's data never shows.
- Files stay in the private storage bucket and open through a 2-minute signed link. Nothing medical is written to the phone.
- The app logs nothing.

## API endpoints per screen

| Screen | Endpoint(s) |
| --- | --- |
| Login | `POST /patient/auth/login` (phone + code) |
| Session restore, token renewal | `POST /patient/auth/refresh` |
| Log out | `POST /patient/auth/logout` |
| Home | `GET /patient/overview` |
| Profile | `GET /patient/me` |
| Medical History | `GET /patient/history` |
| Appointments | `GET /patient/appointments`, `GET /patient/appointments/:id` |
| Prescriptions | `GET /patient/prescriptions`, `GET /patient/prescriptions/:id` |
| Documents | `GET /patient/documents`, `POST /patient/documents` (multipart `files` + `title`), `GET /patient/documents/files/:fileId/url` |
| Contact / requests | `POST /patient/requests`, `GET /patient/requests`, `GET /patient/requests/:id` |

Staff side (dashboard): `GET /branch/patients/:id/app-access`, `POST /branch/patients/:id/app-access/code`, `POST /branch/patients/:id/app-access/disable`, `GET /branch/patient-requests`, `GET|PATCH /branch/patient-requests/:id`, and `patientRequests` in `GET /branch/badges`. Full schemas are in the backend OpenAPI docs (`/api/docs`, tags "Patient app" and "Patient requests").

## Backend changes made for this app

- Migration `1792700000000-PatientApp`: `patient_accounts`, `patient_activation_codes`, `patient_sessions`, `patient_requests`, `patient_request_events` (all with RLS on), the enums `patient_request_category` and `patient_request_status`, and `medical_records.uploaded_by_patient`.
- Module `backend/src/modules/patient-app` (auth, patient routes, requests for patients and staff) with tests.
- Dashboard: "Mobile app" panel on the patient profile (create code, turn off), "Patient Requests" page with status and reply, sidebar badge, "From patient app" badge on uploaded records.

## Not available yet (needs backend work)

- Booking, rescheduling or cancelling appointments from the app. Patients send an "Appointment" request instead.
- Push notifications: the backend has no device-token or notification service.
- A downloadable prescription PDF: the app shows the prescription natively.
- Chat-style conversation: one reply per request from the clinic; there is no message thread.
- Attachments on requests.
- Editing profile fields from the app: patients send a "Correct my details" request.
- Lab values (blood work) and BHRT history are not exposed to the patient app.
- Patient self-registration without the clinic: by design, an account needs a clinic code.

## Testing status

- Backend: 7 integration tests for the patient app (code login, wrong, reused and other-phone codes, five-try limit, token separation, other patients' data, uploads, requests and replies, refresh rotation, logout, disabled access) inside the full suite.
- App: strict typecheck, Expo lint, 10 unit tests (formatting, plan text, phone check, upload rules, error messages), `expo-doctor` 21/21, and an `expo export` bundle for Android and iOS.
- Not yet done: running on physical devices or emulators, and checking every screen at 320, 360, 390 and 430 pt widths and with large system font sizes. Layouts use flexible widths, wrapping text, 44–48 pt touch targets and a font scale cap of 1.6, but they still need a manual pass on real screens.
