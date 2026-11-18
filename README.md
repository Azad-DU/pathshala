<div align="center">
  <img src="assets/images/brand/logo.jpg" width="96" height="96" alt="পাঠশালা (Pathshala) logo" style="border-radius: 22px;" />
  <h1>পাঠশালা — Pathshala</h1>
  <p><strong>Offline Bengali Classic Literary Library &amp; Reader built with Expo &amp; React Native</strong></p>

  <p>
    <a href="https://github.com/Azad-DU/pathshala/actions/workflows/build-apk.yml">
      <img src="https://github.com/Azad-DU/pathshala/actions/workflows/build-apk.yml/badge.svg" alt="Build Pathshala.apk" />
    </a>
    <a href="https://github.com/Azad-DU/pathshala/releases/latest">
      <img src="https://img.shields.io/github/v/release/Azad-DU/pathshala?label=Download%20APK&color=B94D25" alt="Latest Release" />
    </a>
    <img src="https://img.shields.io/badge/Expo-SDK%2058-161D18?logo=expo&logoColor=white" alt="Expo SDK 58" />
    <img src="https://img.shields.io/badge/React%20Native-0.88-3E5E49?logo=react&logoColor=white" alt="React Native 0.88" />
    <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS-445C46" alt="Platform Android and iOS" />
    <img src="https://img.shields.io/badge/License-MIT-blue" alt="MIT License" />
  </p>
</div>

---

**পাঠশালা (Pathshala)** is an offline-first Bengali literature reading app crafted for classical novels, short stories, poetry, songs, dramas, and essays. Every work is bundled locally inside the app for instant, distraction-free reading without an internet connection.

> [!TIP]
> **Want to install the Android app right away?** Download **`Pathshala.apk`** directly from the [Latest GitHub Release](https://github.com/Azad-DU/pathshala/releases/latest).

---

## Literary Collection

**297 books** and **9,278 chapters, poems, songs, stories, and essays** bundled completely offline:

| Writer | Works | Chapters / Pieces | Literary Genres |
| :--- | :---: | :---: | :--- |
| **বিভূতিভূষণ বন্দ্যোপাধ্যায়** *(১৮৯৪ — ১৯৫০)* | 38 | 324 | উপন্যাস (14), গল্পগ্রন্থ (19), কিশোর পাঠ্য (5) |
| **রবীন্দ্রনাথ ঠাকুর** *(১৮৬১ — ১৯৪১)* | 259 | 8,954 | কবিতা (73), নাটক (67), প্রবন্ধ (64), গান ও গীতবিতান (22), অন্যান্য রচনা (14), উপন্যাস (13), গল্পগ্রন্থ (6) |
| **Total** | **297** | **9,278** | **7+ Genres** |

---

## Key Features

### Home Library (`পাঠাগার`)
- **Writer Switcher**: Instantly browse collections by writer (`বিভূতিভূষণ বন্দ্যোপাধ্যায়` & `রবীন্দ্রনাথ ঠাকুর`) with non-blocking transitions.
- **Quote of the Day (`আজকের উদ্ধৃতি`)**: Daily rotating classic Bengali quote that opens the source book directly.
- **Continue Reading**: Resumes directly to your last-read chapter and scroll paragraph with remaining reading time estimation.
- **Clothbound Artwork Shelves**: Horizontal genre shelves featuring bespoke painterly cover illustrations (12 rural Bengal scenes for Bibhutibhushan and 9 dedicated Tagore-themed artworks with zero adjacent shelf duplicates).
- **App Appearance Mode**: Toggle between `System`, `Light`, and `Dark` modes across app navigation and cards.

### Smart Search & Browse (`খুঁজুন`)
- **Two-Tier Bengali Normalization** (`utils/banglaSearch.ts`): Handles NFC Unicode variants, *nukta* decompositions, and look-alike/phonetically-confusable Bengali letters (`normalizeBangla` & `looseBangla`).
- **Dual Search**: Search simultaneously across book titles and individual chapter/poem/song titles, with multi-writer and genre filter chips.

### Distraction-Free Reader (`app/reader/[id].tsx`)
- **Liquid Glass Controls**: Auto-hiding floating top & bottom glass controls with native Android SDK 31+ hardware blur (`expo-blur` `BlurTargetView` + `dimezisBlurViewSdk31Plus`) and iOS vibrancy.
- **4 Eye-Comfort Themes + Auto**:
  - **কাগজী বেইজ** *(Paper Beige, with subtle paper grain texture)*
  - **প্রাচীন গ্রন্থ** *(Antique Book)*
  - **টেরাকোটা** *(Terracotta)*
  - **ডিপ ফরেস্ট** *(Deep Forest Night Mode)*
- **Deep Typography Customization**:
  - Switch between **Noto Serif Bengali** (`নোটো সেরিফ`) and **Hind Siliguri** (`হিন্দ শিলিগুড়ি`), with automatic Noto Serif fallback for all numeric characters (`components/ui/NotoNumbers.tsx`) so Bengali numerals never clip on Android.
  - Adjustable font size (`১৫–৩০`), line height (`১.৬x–২.৫x`), paragraph spacing, horizontal margins, alignment (`left` / `justify`), and first-line indentation.
- **Paragraph Bookmarks & Sharing**: Long-press any paragraph to bookmark it locally or share an attributed quote via the native share sheet.
- **On-Demand Book Loading**: Large catalogs lazy-load chapter text files bundled as Metro assets via `expo-asset` and `expo-file-system` so startup remains fast.

### Personal Shelf (`আমার বই`)
- View ongoing reading progress across all started books with chapter progress bars and relative timestamps.
- Manage saved quote bookmarks with one-tap jump back to the exact paragraph and undo support on removal.

---

## Download & Install (Android)

1. Go to [**Releases**](https://github.com/Azad-DU/pathshala/releases/latest) and download **`Pathshala.apk`**.
2. Open the downloaded file on your Android phone (allow *Install unknown apps* if prompted).
3. Automated builds are produced on GitHub Actions via [`.github/workflows/build-apk.yml`](.github/workflows/build-apk.yml) cleanly named **`Pathshala.apk`**.

---

## Tech Stack

- **Framework**: [Expo SDK 58](https://docs.expo.dev/) (`expo ~58.0.25`) + [Expo Router](https://docs.expo.dev/router/introduction/)
- **Runtime**: React `19.3.0`, React Native `0.88.1`, TypeScript `~6.0`
- **UI & Motion**: `react-native-reanimated`, `expo-blur`, `react-native-safe-area-context`, `@expo/vector-icons`, `@react-native-community/slider`
- **Typography**: `@expo-google-fonts/noto-serif-bengali`, `@expo-google-fonts/hind-siliguri`
- **Offline Storage & Assets**: `@react-native-async-storage/async-storage`, `expo-asset`, `expo-file-system`, `expo-keep-awake`

---

## Project Structure

```text
pathshala/
├── .github/workflows/
│   └── build-apk.yml          # Automated Android APK build & GitHub Release workflow
├── app/                       # Expo Router screens & layouts
│   ├── (tabs)/
│   │   ├── _layout.tsx        # Floating Liquid Glass tab dock & TabBlurProvider
│   │   ├── index.tsx          # Home Library (পাঠাগার)
│   │   ├── browse.tsx         # Search & Genre Browse (খুঁজুন)
│   │   └── library.tsx        # Reading History & Bookmarks (আমার বই)
│   ├── author/[id].tsx        # Author profile & grouped bibliography
│   ├── book/[id].tsx          # Book details & searchable Table of Contents
│   ├── reader/[id].tsx        # Virtualized Reader + Typography customization
│   ├── _layout.tsx            # Root Stack & font loading
│   └── modal.tsx              # App guide & tips modal
├── assets/images/             # App icon, logo, paper texture, writer portraits & 21 book covers
├── components/
│   ├── ui/                    # GlassSurface, GlassHeader, NotoNumbers
│   ├── ClothboundBookCard.tsx # Tactile book card component
│   └── FloatingTabBar.tsx     # Animated Liquid Glass bottom navigation pill
├── constants/                 # Themes, Typography, covers, design tokens
├── context/                   # ThemeContext & TabBlurContext
├── data/writers/              # Modular writer catalogs, loaders & offline book texts
├── services/                  # AsyncStorage persistence & in-memory cache
├── types/                     # Shared TypeScript domain interfaces
├── utils/                     # Bengali search normalization & haptics
├── app.json                   # Expo CNG configuration
├── eas.json                   # EAS Build profiles
└── metro.config.js            # Bundled `.txt` literary asset extension config
```

---

## Local Development

### Prerequisites
- **Node.js** `22+`
- **JDK 17** & **Android SDK** *(only required when compiling native Android builds locally; not needed for Expo Go / Metro development)*

### Setup & Verification

```bash
# 1. Install dependencies
npm install

# 2. Start Metro dev server
npx expo start

# 3. Typecheck and lint
npx tsc --noEmit
npx expo lint
```

### Building Android Release APK Locally

```bash
# Generate native Android project (Continuous Native Generation)
npx expo prebuild --platform android --no-install

# Compile release APK (arm64-v8a + armeabi-v7a)
cd android
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a,arm64-v8a
```

The generated APK is written to `android/app/build/outputs/apk/release/app-release.apk`.

---

## Adding Another Writer

Writer collections follow a modular plugin structure under `data/writers/`:
1. Create `data/writers/<writer-slug>/catalog.ts` (`WriterProfile`, `BookMeta[]`, `ClassicQuote[]`), `loader.ts`, and `books/`.
2. Register the module inside `WRITER_MODULES` in [data/writers/index.ts](data/writers/index.ts).
3. Optionally add a writer portrait and cover mappings in [constants/covers.ts](constants/covers.ts).

---

## License & Literary Notice

- **Application Source Code**: Licensed under the [MIT License](LICENSE).
- **Literary Texts**: The classic Bengali works by Rabindranath Tagore (1861–1941) and Bibhutibhushan Bandyopadhyay (1894–1950) included in this repository are in the public domain.
