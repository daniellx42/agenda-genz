## Hard Rules

- NEVER use `db push` — always `bun run db:migrate --name <name>`
- NEVER edit `packages/db/prisma/schema/schema.prisma` directly — schema is split by domain, edit the correct `<domain>.prisma` file
- NEVER use npm or yarn — bun only
- ALWAYS add an Excel export button on every report/list page
- ALWAYS read existing files in the affected area before writing code — match the existing pattern exactly

## Stack

- **TypeScript** - For type safety and improved developer experience
- **Next.js** - Full-stack React framework
- **React Native** - Build mobile apps using React
- **Expo** - Tools for React Native development
- **TailwindCSS** - Utility-first CSS for rapid UI development
- **shadcn/ui** - Reusable UI components
- **Elysia** - Type-safe, high-performance framework
- **Bun** - Runtime environment
- **Prisma** - TypeScript-first ORM
- **PostgreSQL** - Database engine
- **Authentication** - Better-Auth
- **Turborepo** - Optimized monorepo build system

## Monorepo Structure

- **/apps/web** - Next.js frontend
- **/apps/server** - Elysia backend
- **/apps/native** - React Native (Expo)
- **/packages/auth** - Better Auth config
- **/packages/config** - Config Project
- **/packages/db** - Prisma schema + client
- **/packages/env** - ENV Typed

## Tests

- **Backend** - bun:test