# Replit.md

## Overview

This is a React frontend application built with Vite as the build tool and bundler. The project uses JavaScript (with TypeScript support available) and Tailwind CSS v4 for styling. It's configured to run on Replit with hot module reloading for rapid development.

The application is currently a minimal starter template ready to be extended with additional features and functionality.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

- **Framework**: React 18 with JSX
- **Build Tool**: Vite 5 - chosen for fast HMR and optimized production builds
- **Styling**: Tailwind CSS v4 using the new Vite plugin integration (`@tailwindcss/vite`)
- **TypeScript**: Available but optional - files can be renamed from `.jsx` to `.tsx` to enable TypeScript

### Project Structure

```
├── src/           # Application source code
│   ├── App.css    # App-level styles with Tailwind import
│   └── index.css  # Global styles with Tailwind import
├── index.html     # Entry HTML file
├── vite.config.js # Vite configuration
└── package.json   # Dependencies and scripts
```

### Development Server

- Runs on port 5000
- Configured with `host: '0.0.0.0'` for Replit compatibility
- All hosts allowed for external access

### Build Commands

- `npm run dev` - Start development server with HMR
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally

## External Dependencies

### Core Dependencies

| Package | Purpose |
|---------|---------|
| react | UI component library |
| react-dom | React DOM rendering |
| vite | Build tool and dev server |
| @vitejs/plugin-react | React plugin for Vite |
| tailwindcss | Utility-first CSS framework |
| @tailwindcss/vite | Tailwind CSS Vite integration |

### Development Dependencies

| Package | Purpose |
|---------|---------|
| typescript | TypeScript compiler (optional use) |
| @types/react | React TypeScript definitions |
| @types/react-dom | React DOM TypeScript definitions |

### External Services

None currently configured. The application is a standalone frontend with no backend services, databases, or third-party API integrations.