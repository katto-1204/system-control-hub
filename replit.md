# Facility & Event Management System

## Overview

This is a full-stack facility and event management system designed for institutional use (universities, campuses). The application allows students and faculty to browse facilities, request event bookings, and track their reservations. Administrators can manage facilities, approve/reject booking requests, manage users, and view analytics reports.

The system follows a role-based access control model with three user types: students, faculty, and administrators. Each role has different permissions and sees different interfaces.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state, React Context for auth state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens following institutional branding (primary red #C62828)
- **Form Handling**: React Hook Form with Zod validation
- **Charts**: Recharts for admin analytics dashboards

### Backend Architecture
- **Runtime**: Node.js with Express
- **Language**: TypeScript (ESM modules)
- **API Design**: RESTful JSON APIs under `/api` prefix
- **Authentication**: JWT-based token authentication stored in localStorage
- **Password Security**: bcrypt for password hashing

### Data Storage
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM with drizzle-kit for migrations
- **Schema Location**: `shared/schema.ts` contains all table definitions and Zod validation schemas
- **Connection**: pg Pool via DATABASE_URL environment variable

### Key Data Models
- **Users**: id, email, password, firstName, lastName, studentId, role (student/faculty/admin)
- **Facilities**: id, name, description, capacity, location, status (available/maintenance/closed), amenities
- **Bookings**: id, userId, facilityId, eventName, eventDescription, purpose, eventDate, startTime, endTime, status (pending/approved/rejected)
- **Notifications**: id, userId, type, title, message, status (unread/read)

### Project Structure
```
├── client/src/          # React frontend
│   ├── components/      # Reusable UI components
│   ├── pages/           # Route page components
│   ├── lib/             # Utilities (auth, queryClient)
│   └── hooks/           # Custom React hooks
├── server/              # Express backend
│   ├── routes.ts        # API route handlers
│   ├── storage.ts       # Database access layer
│   └── db.ts            # Database connection
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle schema + Zod validation
└── migrations/          # Database migrations
```

### Authentication Flow
1. User registers/logs in via `/api/auth/register` or `/api/auth/login`
2. Server returns JWT token and user object
3. Client stores both in localStorage
4. Subsequent requests include `Authorization: Bearer <token>` header
5. Server middleware validates token and attaches user to request

### Role-Based Access
- **Students/Faculty**: Can browse facilities, submit booking requests, view their bookings, manage notifications
- **Admins**: Full access including user management, facility CRUD, booking approval/rejection, analytics reports

## External Dependencies

### Database
- **PostgreSQL**: Primary database, connection via `DATABASE_URL` environment variable
- **connect-pg-simple**: Session store (available but JWT is primary auth)

### Authentication & Security
- **bcrypt**: Password hashing
- **jsonwebtoken**: JWT token generation and verification
- **SESSION_SECRET**: Environment variable for JWT signing key

### Build & Development
- **Vite**: Frontend bundler with React plugin
- **esbuild**: Server bundling for production
- **tsx**: TypeScript execution for development
- **drizzle-kit**: Database schema push and migration tooling

### UI Libraries
- **Radix UI**: Accessible component primitives (dialog, dropdown, tabs, etc.)
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Icon library
- **date-fns**: Date formatting and manipulation
- **Recharts**: Chart library for admin reports

### Form & Validation
- **React Hook Form**: Form state management
- **Zod**: Schema validation (shared between client and server)
- **@hookform/resolvers**: Zod resolver for React Hook Form