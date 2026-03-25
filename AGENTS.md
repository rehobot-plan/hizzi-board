---
name: Hizzi Board Next.js Agent
type: agent
description: AI assistant for Hizzi Board Next.js project development
---

# Hizzi Board - Next.js Development Guide

## Project Overview
Hizzi Board is a task management platform built with **Next.js 14**, **TypeScript**, **Tailwind CSS**, and **App Router**. The project uses **Zustand** for state management and **Firebase** for backend services.

## Tech Stack
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Backend**: Firebase
- **Linting**: ESLint

## Project Structure
```
hizzi-Board/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout with metadata
│   │   ├── page.tsx            # Home page
│   │   ├── globals.css         # Global styles with Tailwind
│   │   └── [other routes]
│   ├── components/             # Reusable UI components
│   ├── hooks/                  # Custom React hooks
│   ├── store/                  # Zustand stores for state management
│   ├── lib/                    # Utility functions and helpers
│   └── types/                  # TypeScript type definitions
├── public/                     # Static assets
├── tailwind.config.ts          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── next.config.ts              # Next.js configuration
├── postcss.config.mjs          # PostCSS configuration
├── .eslintrc.json              # ESLint configuration
├── package.json                # Project dependencies
└── .env.local                  # Environment variables
```

## Key Directories to Understand

### `/src/app`
- **location.tsx**: Root layout component that wraps all pages
- **page.tsx**: Home page component
- **globals.css**: Global CSS with Tailwind directives
- Route files follow Next.js App Router conventions

### `/src/components`
- Reusable React components for UI
- Should follow component naming conventions (PascalCase)
- Keep components focused and single-responsibility

### `/src/store`
- Zustand store files for global state management
- Each store should handle a specific domain (e.g., userStore, taskStore)

### `/src/lib`
- Utility functions and Firebase initialization
- API call helpers and data formatting functions

## Development Commands

```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting errors
npm run lint -- --fix
```

## Firebase Integration

### Setup
1. Create a Firebase project at https://firebase.google.com
2. Add configuration to `.env.local`:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

### File: `src/lib/firebase.ts`
```typescript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

## State Management with Zustand

### Example Store: `src/store/taskStore.ts`
```typescript
import { create } from 'zustand';

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface TaskStore {
  tasks: Task[];
  addTask: (task: Task) => void;
  removeTask: (id: string) => void;
  toggleTask: (id: string) => void;
}

export const useTaskStore = create<TaskStore>((set) => ({
  tasks: [],
  addTask: (task) =>
    set((state) => ({
      tasks: [...state.tasks, task],
    })),
  removeTask: (id) =>
    set((state) => ({
      tasks: state.tasks.filter((task) => task.id !== id),
    })),
  toggleTask: (id) =>
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      ),
    })),
}));
```

## Styling with Tailwind CSS

- All global styles are in `src/app/globals.css`
- Use Tailwind utility classes for component styling
- Available custom breakpoints and colors in `tailwind.config.ts`

## TypeScript Best Practices

1. **Type Definitions**: Keep types in `src/types/`
2. **Component Props**: Always type component props:
   ```typescript
   interface ButtonProps {
     label: string;
     onClick: () => void;
     variant?: 'primary' | 'secondary';
   }
   ```
3. **API Responses**: Type all API responses and Firebase queries

## Code Generation Commands

When building new features, AI agents should:
1. Follow the project structure
2. Use TypeScript for all files
3. Add type definitions for new data structures
4. Use Zustand for global state
5. Use Tailwind CSS for styling

## Environment Setup

### Required Node Version
- Node.js 18.17 or later

### IDE Configuration
- VS Code is recommended
- Install ESLint and Prettier extensions

## Important Notes for AI Agents

- Always maintain TypeScript strict mode
- Follow existing code patterns and conventions
- Use `src/` directory structure consistently
- Keep components functional and use hooks
- Prefer composition over inheritance
- Mirror existing file organization when adding new features
- Test locally with `npm run dev` before committing

## Common Tasks

### Adding a New Page
1. Create directory in `src/app/[page-name]`
2. Add `page.tsx` file
3. Export default React component

### Adding a New Component
1. Create file in `src/components/[ComponentName].tsx`
2. Use TypeScript with proper prop typing
3. Import and use in pages or other components

### Adding State to Store
1. Edit or create store file in `src/store/`
2. Define interfaces for state
3. Create store with Zustand's `create()` function
4. Import and use with `useStore()` hook in components

## Deployment

- Deploy to Vercel for optimal Next.js performance
- Environment variables must be set in deployment platform
- Build locally with `npm run build` to verify before pushing
