# AGENTS.md - AI-Fitness Expo Project

## Project Overview
- **Framework**: Expo SDK 54 with React Native 0.81.5
- **Routing**: expo-router (file-based routing in `app/` directory)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **App Scheme**: `aifitness`

## Required Commands

```bash
# Development
npx expo start              # Start Metro dev server
npx expo start --android    # Run on Android emulator
npx expo start --ios        # Run on iOS simulator
npx expo start --web        # Run web build

# Linting & Type Checking
npm run lint                # Run ESLint
npx expo lint               # Same as above (expo lint)
```

## Architecture

| Directory | Purpose |
|-----------|---------|
| `app/` | File-based routes (index.tsx = `/`, login.tsx = `/login`, etc.) |
| `components/` | Reusable UI components (AppScreen, AppButton) |
| `constants/` | Theme values (colors.ts) |
| `assets/` | Fonts, images, icons |

### Key Files
- `app/_layout.tsx` - Root layout with font loading and navigation stack
- `app/index.tsx` - Initial splash (auto-redirects to /splash-two after 2s)
- `constants/colors.ts` - Centralized color theme (purple/white fitness aesthetic)
- `components/AppButton.tsx` - Custom button with login/register variants
- `components/AppScreen.tsx` - Base screen wrapper

### Navigation
- Uses `expo-router` Stack navigation
- Routes are defined by file names in `app/` directory
- Path alias: `@/*` maps to project root

## Expo-Specific Notes

- **Expo v54 has changed**: Read https://docs.expo.dev/versions/v54.0.0/ for current APIs
- **Typed Routes**: Enabled via `experiments.typedRoutes` in app.json
- **React Compiler**: Enabled via `experiments.reactCompiler` in app.json
- **New Architecture**: Enabled (`newArchEnabled: true`)
- **Fonts**: Poppins variants loaded via `expo-font` (Bold, Medium, Regular, SemiBold)
- **Tailwind v4**: Uses `@tailwindcss/postcss` and `tailwindcss` v4 with nativewind

## Code Conventions

1. Use `className` for NativeWind styling (not `style` prop for layout)
2. Use `expo-router` router for navigation: `router.push('/path')`, `router.replace('/path')`
3. Colors defined in `constants/colors.ts` - never hardcode hex values
4. All components export named functions (not default)
5. TypeScript strict mode enabled

## Common Gotchas

- NativeWind requires `nativewind-env.d.ts` for type declarations (present)
- PostCSS config (`postcss.config.mjs`) required for Tailwind processing
- Fonts must be loaded before rendering text components (handled in _layout.tsx)
- Reanimated animations require `react-native-worklets` dependency

## Project Workflow

- **Codex**: Handles app logic, functionality, routing, auth, validation, APIs, and security
- **Gemini**: Handles UI/design implementation and Figma matching
- **Security Priority**: Security is the first priority
- **Route Protection**: All private routes must be protected
- **Data Isolation**: No signed-out user can access another user's data or any private app subsystem
- **Authentication**: Clerk is the authentication provider

## Project Working Rules

Every AI assistant working on this project must read this file first and follow it strictly before making any changes.

## Core Workflow

- Codex handles logic, functionality, routing, validation, state, APIs, auth, and security.
- Gemini handles UI/design only when explicitly asked.
- Do not mix responsibilities unless the user clearly asks.

## Critical Auth Rule

Clerk authentication is working and must not be touched unless the user explicitly asks for auth changes.

Do not edit these files unless the task is specifically about auth/routing:

- `app/_layout.tsx`
- `app/(auth)/_layout.tsx`
- `app/(protected)/_layout.tsx`
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `lib/clerk.ts`
- `lib/session-activation.ts`
- `lib/auth.ts`

Do not change:

- `ClerkProvider`
- `setActive` logic
- protected route guards
- auth redirects
- login/register auth handlers

## Onboarding UI Rule

When working on Account Information / Onboarding UI, only edit:

- `app/(protected)/onboarding/index.tsx`
- `app/(protected)/onboarding/weight.tsx`
- `app/(protected)/onboarding/height.tsx`
- `app/(protected)/onboarding/goal.tsx`
- `components/onboarding/*` if needed

Do not touch auth files or route guards while styling onboarding.

## Route Rule

Use visible Expo Router paths only:

- `/onboarding`
- `/onboarding/weight`
- `/onboarding/height`
- `/onboarding/goal`
- `/login`
- `/register`

Do not use route group paths in navigation:

- `/(protected)/onboarding`
- `/(auth)/login`

## Safety Rule

Before changing anything:

1. Read `AGENTS.md`.
2. Check the current task scope.
3. Do not edit frozen files unless the task explicitly requires it.
4. Keep changes small.
5. Run `npm run lint`.
6. Do not break working auth.

## Prompt Rule

Every prompt for Codex or Gemini should start with:

"Read AGENTS.md first and follow it strictly."
