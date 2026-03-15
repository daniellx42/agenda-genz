import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { homedir, platform } from "node:os";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";

const args = new Set(process.argv.slice(2));
const shouldWrite = args.has("--write");
const home = homedir();

const shellRcPath = join(home, ".zshrc");
const gradlePropertiesPath = join(home, ".gradle", "gradle.properties");
const androidSdkPath = join(home, "Library", "Android", "sdk");
const androidStudioPath = "/Applications/Android Studio.app";
const androidStudioJavaHome = "/Applications/Android Studio.app/Contents/jbr/Contents/Home";
const xcodePath = "/Applications/Xcode.app";

const shellStart = "# >>> agenda-genz mobile env >>>";
const shellEnd = "# <<< agenda-genz mobile env <<<";
const shellBlock = [
  shellStart,
  'export ANDROID_HOME="$HOME/Library/Android/sdk"',
  'export ANDROID_SDK_ROOT="$ANDROID_HOME"',
  'export PATH="$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/latest/bin:$PATH"',
  'if [ -d "/Applications/Android Studio.app/Contents/jbr/Contents/Home" ]; then',
  '  export JAVA_HOME="/Applications/Android Studio.app/Contents/jbr/Contents/Home"',
  '  export PATH="$JAVA_HOME/bin:$PATH"',
  "fi",
  shellEnd,
].join("\n");

const gradleStart = "# >>> agenda-genz mobile env >>>";
const gradleEnd = "# <<< agenda-genz mobile env <<<";
const gradleBlock = [
  gradleStart,
  `org.gradle.java.home=${androidStudioJavaHome}`,
  gradleEnd,
].join("\n");

function run(command, commandArgs) {
  return spawnSync(command, commandArgs, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

function upsertBlock(filePath, startMarker, endMarker, block) {
  const current = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  const pattern = new RegExp(`${escapeRegExp(startMarker)}[\\s\\S]*?${escapeRegExp(endMarker)}\\n?`, "g");
  const trimmed = current.replace(pattern, "").trimEnd();
  const next = trimmed ? `${trimmed}\n\n${block}\n` : `${block}\n`;

  mkdirSync(dirname(filePath), { recursive: true });
  writeFileSync(filePath, next);
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function status(label, ok, details) {
  const mark = ok ? "OK " : "WARN";
  console.log(`${mark} ${label}: ${details}`);
}

function commandExists(command, commandArgs = ["--version"]) {
  const result = run(command, commandArgs);
  return result.status === 0;
}

function checkJavaVersion() {
  const javaBin = existsSync(join(androidStudioJavaHome, "bin", "java"))
    ? join(androidStudioJavaHome, "bin", "java")
    : "java";
  const result = run(javaBin, ["-version"]);
  const output = `${result.stdout ?? ""}\n${result.stderr ?? ""}`;
  const match = output.match(/version "(?<major>\d+)(?:\.\d+)?/);
  return match?.groups?.major ?? "unknown";
}

if (platform() !== "darwin") {
  console.error("This setup script is intended for macOS only.");
  process.exit(1);
}

if (shouldWrite) {
  upsertBlock(shellRcPath, shellStart, shellEnd, shellBlock);
  upsertBlock(gradlePropertiesPath, gradleStart, gradleEnd, gradleBlock);
  console.log(`Updated ${shellRcPath}`);
  console.log(`Updated ${gradlePropertiesPath}`);
  console.log("Open a new terminal or run: source ~/.zshrc");
  console.log("");
}

console.log("Environment checks");
status("Xcode", existsSync(xcodePath), existsSync(xcodePath) ? xcodePath : "Install Xcode from the App Store");
status(
  "Xcode Command Line Tools",
  commandExists("xcode-select", ["-p"]),
  commandExists("xcode-select", ["-p"]) ? "Configured" : "Run: xcode-select --install"
);
status("CocoaPods", commandExists("pod", ["--version"]), commandExists("pod", ["--version"]) ? "Installed" : "Install with: gem install cocoapods");
status(
  "Android Studio",
  existsSync(androidStudioPath),
  existsSync(androidStudioPath) ? androidStudioPath : "Install Android Studio"
);
status(
  "Android SDK",
  existsSync(androidSdkPath),
  existsSync(androidSdkPath) ? androidSdkPath : "Open Android Studio and install Android SDK + platform tools"
);
status(
  "sdkmanager",
  existsSync(join(androidSdkPath, "cmdline-tools", "latest", "bin", "sdkmanager")),
  existsSync(join(androidSdkPath, "cmdline-tools", "latest", "bin", "sdkmanager"))
    ? "Installed"
    : "Install Android SDK Command-line Tools in Android Studio"
);
status(
  "adb",
  existsSync(join(androidSdkPath, "platform-tools", "adb")),
  existsSync(join(androidSdkPath, "platform-tools", "adb"))
    ? "Installed"
    : "Install Android SDK Platform-Tools in Android Studio"
);
status(
  "Java for Android",
  existsSync(androidStudioJavaHome),
  existsSync(androidStudioJavaHome)
    ? `Android Studio JBR detected (Java ${checkJavaVersion()})`
    : "Android Studio JBR not found"
);
status("Bun", commandExists("bun", ["--version"]), commandExists("bun", ["--version"]) ? "Installed" : "Install Bun");
status("Node.js", commandExists("node", ["--version"]), commandExists("node", ["--version"]) ? "Installed" : "Install Node.js");
status("Watchman", commandExists("watchman", ["--version"]), commandExists("watchman", ["--version"]) ? "Installed" : "Optional, but recommended for React Native");

console.log("");
console.log("Recommended next steps");
console.log("1. Install any missing tools listed above.");
console.log("2. Run `bun run setup:macos` if you want the script to update ~/.zshrc and ~/.gradle/gradle.properties.");
console.log("3. Restart the terminal or run `source ~/.zshrc`.");
console.log("4. Run `expo run:android` or `expo run:ios` inside apps/app.");
