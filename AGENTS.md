# Agent Guidelines for Retro Paint

## Commands
- **Build**: `npm run build`
- **Lint**: `npm run lint`
- **Test**: `npm test` (watch mode), `npm run test:run` (single run)
- **Single test**: `vitest run path/to/test.test.tsx`
- **Dev server**: `npm run dev`

## Code Style
- **Language**: TypeScript with strict types
- **Framework**: React with Vite, Tailwind CSS
- **Imports**: Use relative imports for local files, absolute for packages
- **Types**: Define interfaces in `src/types/`, use strict typing with proper generics
- **Components**: Functional components with TypeScript interfaces for props
- **Naming**: camelCase for variables/functions, PascalCase for components/types
- **Exports**: Named exports preferred, default exports for components
- **Error handling**: Use proper TypeScript error types, avoid `any`
- **Testing**: Vitest with React Testing Library, setup in `src/test/setup.ts`

## Project Structure
- Components in `src/components/`
- Types in `src/types/`
- Hooks in `src/hooks/`
- Utils in `src/utils/`
- Tests co-located with source files or in `src/test/`