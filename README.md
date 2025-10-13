# CSE-115A-Smart-schedule-assistant-Banana-Time-

# 📅 UCSC Schedule Assistant App

A **React Native mobile app** designed for UCSC students to manage their daily schedules and reminders — all running locally without the need for an internet connection.

---

## 🌟 Overview

The **UCSC Schedule Assistant App** helps students:
- Add, edit, and delete personal events  
- View today’s tasks at a glance  
- Browse all events by date using a calendar view  
- Track weekly analytics (e.g., number of events created and completed)  

All data is stored locally on your device using AsyncStorage.

---

## 🧰 Tech Stack
- **Framework:** React Native (Expo)
- **Language:** JavaScript
- **Local Storage:** AsyncStorage
- **Platform:** Android & iOS

---

## 🚀 Getting Started

### 1️⃣ Clone the repository
```bash
git clone https://github.com/<your-username>/<repo-name>.git
cd <repo-name>
```
### 2️⃣ Install dependencies

Make sure you have Node.js and Expo CLI installed.
```
npm install -g expo-cli
npm install
```
or (if you use Yarn)
```yarn install```

### 3️⃣ Run the app
```
npx expo start
```
Then choose one of the following options:

(I perfer use physical device,because I never use emulator but I write down right know)

📱 Run on a physical device:

  Install the Expo Go app from the App Store (iOS) or Google Play (Android).

  Scan the QR code displayed in your terminal or browser.

🖥️ Run on an emulator:

  Press a for Android Emulator

  Press i for iOS Simulator (Mac only)

---

## 📁 Project Structure
```
CSE-115A-Smart-schedule-assistant-Banana-Time-/
┣ 📂 .expo/ # Expo environment and build cache
┣ 📂 .vscode/ # VSCode workspace settings
┣ 📂 app/ # Main application source code (screens, navigation, logic)
┣ 📂 assets/ # Images, icons, fonts, etc.
┣ 📂 components/ # Reusable UI components
┣ 📂 constants/ # Constant values (e.g., colors, styles, strings)
┣ 📂 hooks/ # Custom React hooks
┣ 📂 Temp/ # Temporary or debug-related files
┣ 📂 node_modules/ # Project dependencies (auto-generated)
┣ 📜 app.json # Expo configuration file
┣ 📜 expo-env.d.ts # Expo TypeScript environment declaration
┣ 📜 package.json # Project metadata and dependencies
┣ 📜 package-lock.json # Lock file for npm dependencies
┣ 📜 tsconfig.json # TypeScript configuration
┣ 📜 .gitignore # Files and folders ignored by Git
┣ 📜 README.md # Project documentation (you’re reading it!)
```
