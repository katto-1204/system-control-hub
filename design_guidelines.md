# Facility & Event Management System - Design Guidelines

## Design Approach
**Utility-Focused Design System** - This is a functional, institutional management system prioritizing clarity, efficiency, and role-based workflows. Design follows established enterprise UI patterns with institutional branding.

## Branding & Color System

### Color Palette (Exact Implementation)
- **Primary (Institutional Red)**: `#C62828` - All primary buttons, headers, active states, important CTAs
- **Secondary (Deep Gray)**: `#424242` - Secondary text, icons, borders
- **Background**: `#FFFFFF` - Main background
- **Border/Dividers**: `#E0E0E0` - Light gray for separators, card borders
- **Success**: `#2E7D32` - Approved status, success messages
- **Warning**: `#F9A825` - Pending status indicators
- **Error**: `#C62828` - Rejected status, error states

### Status Color Coding
- **Available/Approved**: Green (#2E7D32)
- **Pending**: Yellow/Amber (#F9A825)
- **Booked/Rejected**: Red (#C62828)

## Typography System
- **Font Family**: Roboto (primary) or Open Sans (fallback)
- **Headings**: Font weight 600 (Semi-bold)
- **Body Text**: Font weight 400 (Regular)
- **Buttons**: Font weight 700 (Bold)
- **Hierarchy**: h1 (2xl-3xl), h2 (xl-2xl), h3 (lg-xl), body (base)

## Spacing & Layout
Use Tailwind spacing: **p-2, p-4, p-6, p-8** for consistent padding/margins throughout
- Card padding: `p-6`
- Section spacing: `py-8` to `py-12`
- Component gaps: `gap-4` or `gap-6`

## Core Components

### Navigation Bar
- White background with red accent for active items
- Logo on left, user profile/notifications on right
- Consistent across all screens: Dashboard, Requests, Profile, Logout links

### Cards
- White background, rounded corners (rounded-lg)
- Subtle shadow (shadow-sm)
- Border in light gray (#E0E0E0)
- 6-8 unit padding

### Buttons
- **Primary**: Red background (#C62828), white text, bold font, rounded
- **Secondary**: White background, red border and text
- **Success**: Green for approval actions
- Hover states: Slightly darker shade

### Forms
- Clean input fields with gray borders
- Labels above inputs (semi-bold, gray)
- Required field indicators (red asterisk)
- Error messages below fields in red
- Success states with green borders

### Tables/Lists
- Zebra striping for rows (subtle gray alternation)
- Status badges with appropriate colors
- Action buttons aligned right
- Sortable column headers

### Calendar View
- Grid layout with color-coded time blocks
- Legend showing Available (green), Booked (red), Pending (yellow)
- Time slots clickable for availability details
- Month/week/day view toggles

## Screen-Specific Guidelines

### 1. Login Screen
- Centered card layout (max-w-md)
- Logo at top center
- Two input fields (email, password) stacked
- Red login button (full width)
- "Forgot Password?" link below (gray, right-aligned)

### 2. User Dashboard
- Grid layout for facility cards (3-4 columns on desktop)
- Quick stats at top (cards showing: Available Facilities, My Requests, Upcoming Events)
- "Submit New Request" prominent red button
- Facility cards show: name, capacity, availability badge, thumbnail

### 3. Admin Dashboard
- Sidebar navigation (left) with sections: Pending Requests, All Bookings, Users, Facilities, Reports
- Main content area with tabs for filtering (Pending, Approved, Rejected)
- Table view of all requests with inline action buttons
- Summary cards at top showing metrics

### 4. Event Request Form
- Single column form layout
- Sections: Event Details, Facility Selection, Time Slot, Equipment Needed
- Calendar picker for date selection
- Time range selectors
- Multi-select for equipment
- Document upload area (optional)
- Submit button (red, bottom right)

### 5. Facility Availability Screen
- Calendar on left (60% width)
- Facility details panel on right (40%)
- Filter bar at top (date range, facility type)
- Color-coded time blocks
- Click to see booking details

### 6. Notification Center
- List view with unread notifications highlighted
- Timestamp and status indicator
- Mark as read functionality
- Group by date

### 7. Admin Approval Panel
- Request details in expandable rows
- Approve/Reject buttons inline
- Request more info option
- Event history timeline
- Filter by status, date, user

## Animations
Minimal animations only:
- Smooth page transitions (fade in)
- Button hover states (subtle color change)
- Dropdown menus (slide down)
- Success/error toast notifications (slide in from top)

## Accessibility
- Proper contrast ratios (WCAG AA compliant)
- Focus states for all interactive elements
- Screen reader labels for status indicators
- Keyboard navigation support
- Proper heading hierarchy

## Images
**No hero images** - This is a functional dashboard system. Use:
- Institution logo in header (SVG preferred)
- Generic facility thumbnails in cards (placeholder icons acceptable)
- User avatars in profile sections (initials fallback)