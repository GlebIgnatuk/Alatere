# alatere

Alatere is a versatile platform designed to streamline server and client operations. This repository contains the source code for both backend and frontend components, along with deployment configurations.

## Features

- **Server Operations**: Scripts for user management, database partitioning, and more.
- **Postman Integration**: Predefined Postman collections for API testing.
- **Environment Configuration**: Flexible `.env` files for different environments.

## Prerequisites

- pnpm
- Node.js v22

## Project Structure

- **apps/server/**: Backend server code and scripts.
- **apps/client/**: Frontend code (TODO).

## Getting Started

### Run Server

1. Create `apps/server/.env.local` using `apps/server/.env.example` as a reference.
2. Install dependencies and start the development server:
   ```bash
   cd apps/server
   pnpm install
   pnpm run dev
   ```

### Useful Scripts

1. Create `apps/server/.env.script` with the necessary environment variables (e.g., database connection URL).

- **Create user activation code**:
  ```bash
  pnpm run exec:script ./dist/src/scripts/user/create-activation-code.js
  ```
- **Create users**:
  ```bash
  pnpm run exec:script ./dist/src/scripts/user/create-user.js
  ```
- **Create partitions**:
  ```bash
  pnpm run exec:script ./dist/src/scripts/db/create-chat-message-partitions.js
  ```

### Postman Collection

Import `apps/server/postman_collection.json` into Postman for API testing.

## Run Client

(TODO: Add instructions for running the client.)

## Deploy

(TODO: Add deployment instructions.)
