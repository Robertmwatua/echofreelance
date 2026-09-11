Mobile app (Flutter)

This folder will contain the Flutter mobile application. For now it is a placeholder describing the intended structure:

- `lib/` - Dart source
- `android/`, `ios/`, `web/` - platform folders
- `pubspec.yaml` - dependencies and assets

Planned approach: keep mobile as a separate app in the monorepo, share types via `packages/types` when required.
