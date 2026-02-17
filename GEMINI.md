# Project: Lunchbox

## Project Overview

This is a Next.js web application built with the App Router. It leverages Prisma as an ORM for database interactions, specifically with PostgreSQL. User authentication is managed using `iron-session` for session management and `bcryptjs` for password hashing.

The application appears to be a management system, likely for a workforce or team, given the presence of API routes and components related to:

*   Associates
*   Shifts
*   Tasks
*   Departments
*   Roles
*   Reminders

## Getting Started

### Prerequisites

Ensure you have Node.js and npm (or yarn/pnpm/bun) installed. A PostgreSQL database is also required for data persistence.

### Installation

1.  **Clone the repository:**
    ```bash
    git clone [repository-url]
    cd lunchbox
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or yarn install
    # or pnpm install
    # or bun install
    ```
3.  **Set up environment variables:**
    Copy `.env.example` to `.env` and fill in the necessary environment variables, especially for your database connection.
    ```bash
    cp .env.example .env
    ```
4.  **Database Setup:**
    Ensure your PostgreSQL database is running and accessible. Then, apply Prisma migrations and seed the database:
    ```bash
    npx prisma migrate dev --name init # Or the appropriate migration command
    npm run db:seed
    ```

## Building and Running

### Development Server

To run the application in development mode:

```bash
npm run dev
# or yarn dev
# or pnpm dev
# or bun dev
```
This will start the development server, typically accessible at `http://localhost:3000`. The application will hot-reload as you make changes.

### Production Build

To build the application for production:

```bash
npm run build
# or yarn build
# or pnpm build
# or bun build
```
This command compiles the application for optimal performance.

### Starting in Production Mode

After building, you can start the application in production mode:

```bash
npm run start
# or yarn start
# or pnpm start
# or bun start
```

### Database Seeding

To seed the database with initial data (as defined in `prisma/seed.js`):

```bash
npm run db:seed
```

## Project Structure

*   `app/`: Contains Next.js App Router pages and API routes.
    *   `(auth)/`: Authentication-related pages (login, register).
    *   `(dashboard)/`: Main application pages (shifts, tasks, dashboard).
    *   `api/`: Backend API routes (associates, auth, departments, etc.).
*   `components/`: Reusable React components.
    *   `auth/`: Authentication forms.
    *   `shifts/`: Components related to shift management.
    *   `tasks/`: Components related to task management.
    *   `ui/`: Generic UI components (Button, Modal).
*   `lib/`: Utility functions and business logic.
    *   `auth/`: Authentication utilities.
    *   `business/`: Core business logic (reminder-service, rest-scheduler, etc.).
    *   `db/`: Database related utilities (Prisma client).
*   `prisma/`: Prisma schema and migration files.

## Development Conventions

*   **Framework:** Next.js with App Router.
*   **Database ORM:** Prisma.
*   **Styling:** Tailwind CSS.
*   **Authentication:** `iron-session` and `bcryptjs`.
*   **Language:** JavaScript/JSX (Next.js pages, components) and TypeScript (Prisma config).
