---
description: Repository Information Overview
alwaysApply: true
---

# Shadow CDN Information

## Summary
Shadow CDN is a React-based web application built with Vite. It appears to be a comprehensive management system for explosive materials with features for barcode generation, inventory management, dispatch tracking, and reporting. The application includes modules for user management, master data management, operations, and administrative functions.

## Structure
- **src/**: Main source code directory
  - **components/**: Reusable UI components
  - **Pages/**: Application pages organized by functionality
  - **layouts/**: Layout components (MainLayout, AuthLayout)
  - **hooks/**: Custom React hooks
  - **lib/**: Utility functions and API services
  - **routes/**: Routing configuration
  - **assets/**: Static assets like images
- **public/**: Static files served directly
- **dist/**: Build output directory

## Language & Runtime
**Language**: JavaScript/TypeScript (JSX/TSX)
**Version**: ECMAScript modules (type: "module")
**Build System**: Vite 6.2.0
**Package Manager**: npm

## Dependencies
**Main Dependencies**:
- React 19.0.0 with React Router 7.5.0
- TailwindCSS 4.1.8 for styling
- Radix UI components for UI elements
- @tanstack/react-query 5.74.7 for data fetching
- @tanstack/react-table 8.21.2 for data tables
- axios 1.9.0 for HTTP requests
- WebSocket for real-time communication
- jspdf 3.0.1 and xlsx 0.18.5 for document generation
- zod 3.24.2 and yup 1.6.1 for validation
- zustand 5.0.3 for state management

**Development Dependencies**:
- ESLint 9.21.0 for code linting
- @vitejs/plugin-react 4.3.4 for React support in Vite

## Build & Installation
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Environment Configuration
**Development**:
- API Base URL: https://localhost:7098/api
- WebSocket URL: wss://localhost:7098/ws

**Production**:
- API Base URL: http://192.168.10.12:4201/api
- WebSocket URL: ws://192.168.10.12:4201/ws

## Main Entry Points
- **main.jsx**: Application initialization with providers
- **App.jsx**: Root component with BrowserRouter
- **RoutesComponent.jsx**: Route definitions and lazy-loaded components

## Features
- **Authentication**: Login system with role-based access
- **Dashboard**: Overview of system metrics
- **Master Data Management**: Various master data entities (Country, Plant, Product, etc.)
- **Operations**: Barcode generation, magazine transfers
- **Dispatch**: RE12 file generation, loading sheets
- **Reports**: Production, storage, dispatch reports
- **Admin**: User management, shift management
- **Search**: Barcode tracing functionality