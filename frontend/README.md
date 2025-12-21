# Warm AI Frontend

**Warm AI** - Network with AI. Find people and companies on LinkedIn using natural language.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS with shadcn/ui components
- **State Management**: TanStack Query

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev
```

The app will be available at `http://localhost:8080`

### Build for Production

```bash
pnpm build
pnpm preview
```

## Project Structure

```
src/
├── components/     # UI components
│   ├── ui/         # shadcn/ui base components
│   ├── ChatMessage.tsx
│   ├── OmniInput.tsx
│   ├── PersonCard.tsx
│   ├── CompanyCard.tsx
│   └── ...
├── lib/            # Utilities and API
│   ├── api.ts      # Backend API integration
│   └── utils.ts    # Helper functions
├── pages/          # Page components
│   └── Index.tsx   # Main application page
└── main.tsx        # Entry point
```

## Features

- **AI Chat**: Conversational interface with streaming responses
- **Web Search Mode**: Grounded responses using Google Search
- **People Search**: Find professionals on LinkedIn
- **Company Search**: Discover companies and organizations

## Backend Integration

The frontend connects to the Warm AI backend at `http://localhost:8000`. Make sure the backend is running before using the app.
