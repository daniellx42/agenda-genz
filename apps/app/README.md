## Mobile setup (macOS)

Use the standard Expo commands:

```bash
expo run:android
expo run:ios
```

Before that, prepare the machine:

```bash
bun run setup:macos
```

This setup script:

- updates `~/.zshrc` with `ANDROID_HOME`, `ANDROID_SDK_ROOT`, Android SDK paths, and the Android Studio JBR `JAVA_HOME`
- updates `~/.gradle/gradle.properties` with `org.gradle.java.home`
- checks the tools required for iOS and Android development

If you only want to validate the machine without writing anything:

```bash
bun run setup:macos:check
```

Required tools on macOS:

- Xcode
- Xcode Command Line Tools
- CocoaPods
- Android Studio
- Android SDK Platform-Tools
- Android SDK Command-line Tools
- Bun
- Node.js

Notes:

- iOS is configured through Expo config to build React Native from source during prebuild sync, so that setting survives regeneration of `ios/`.
- Android should use the JDK bundled with Android Studio. Using newer global Java versions such as Java 25 can break native builds.
