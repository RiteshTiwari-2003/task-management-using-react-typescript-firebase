# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },####
})
```

# The Alter Office Task Management System

A modern, responsive task management system built with React, TypeScript, and Firebase.

## Live Demo
Visit the application at: https://task-management-app-9162b.web.app

## Features

### Core Features
- 📱 Responsive design that works on desktop and mobile
- 🔐 User authentication with email and password
- ✅ Create, read, update, and delete tasks
- 🏷️ Categorize tasks (Todo, In-Progress, Completed)
- 📋 Multiple task selection for bulk operations
- 🎨 Different background colors for different task sections
- 🔄 Real-time updates using Firebase

### User Interface
- Clean and intuitive design
- Task filtering and search functionality
- Drag and drop interface for task management
- Expandable/collapsible task sections
- Bulk delete functionality

## Setup Instructions

### Prerequisites
- Node.js (v14 or higher)
- npm (v6 or higher)
- Git

### Local Development Setup
1. Clone the repository
```bash
git clone https://github.com/RiteshTiwari-2003/task-management-using-react-typescript-firebase.git
cd taskbuddy
