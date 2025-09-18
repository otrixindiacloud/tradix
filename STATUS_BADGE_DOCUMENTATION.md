# Status Badge Components

This document outlines the available status badge components in the GT-ERP system with their predefined color mappings and usage patterns.

## Components Overview

### 1. StatusBadge Component (`/components/ui/status-badge.tsx`)
A new, purpose-built component with precise color mapping for business status types.

### 2. StatusPill Component (`/components/status/status-pill.tsx`) - Enhanced
The existing component, now enhanced with new status mappings while maintaining backward compatibility.

## Status Types & Color Mapping

The following status types are supported with their exact Tailwind CSS color mappings:

| Status | Background Color | Text Color | CSS Classes |
|--------|------------------|------------|-------------|
| **Completed** | Green 600 | White | `bg-green-600 text-white` |
| **Approved** | Teal 600 | White | `bg-teal-600 text-white` |
| **In Progress** | Blue 600 | White | `bg-blue-600 text-white` |
| **Open** | Sky 400 | White | `bg-sky-400 text-white` |
| **Pending** | Orange 500 | White | `bg-orange-500 text-white` |
| **Cancelled** | Gray 500 | White | `bg-gray-500 text-white` |
| **Rejected** | Red 600 | White | `bg-red-600 text-white` |
| **On Hold** | Yellow 400 | Black | `bg-yellow-400 text-black` |
| **Overdue** | Red 800 | White | `bg-red-800 text-white` |

## Usage Examples

### StatusBadge Component

```tsx
import StatusBadge from '@/components/ui/status-badge';

// Basic usage
<StatusBadge status="Completed" />

// Without icon
<StatusBadge status="In Progress" showIcon={false} />

// Different sizes
<StatusBadge status="Pending" size="sm" />
<StatusBadge status="Approved" size="lg" />

// Minimal variant for tables (no background, just colored text)
<StatusBadge status="Completed" variant="minimal" />

// With custom styling
<StatusBadge status="Overdue" className="ml-2 shadow-lg" />
```

### StatusPill Component (Enhanced)

```tsx
import { StatusPill } from '@/components/status/status-pill';

// Exact status names
<StatusPill status="completed" />
<StatusPill status="in-progress" />

// Fuzzy matching (case insensitive)
<StatusPill status="Task Completed" />
<StatusPill status="In Progress" />
<StatusPill status="On Hold" />
```

## Helper Functions

The StatusBadge component exports helper functions for advanced usage:

```tsx
import { getStatusColorClass, getStatusIcon } from '@/components/ui/status-badge';

// Get color class for custom components
const colorClass = getStatusColorClass('Completed');
// Returns: "bg-green-600 text-white"

// Get status icon for custom layouts
const icon = getStatusIcon('In Progress');
// Returns: <Clock className="h-3 w-3" />
```

## Component Props

### StatusBadge Props

```typescript
interface StatusBadgeProps {
  status: StatusType | string;     // Status value
  showIcon?: boolean;              // Show/hide icon (default: true)
  size?: 'sm' | 'default' | 'lg';  // Size variant (default: 'default')
  variant?: 'default' | 'minimal'; // Style variant (default: 'default')
  className?: string;              // Additional CSS classes
}
```

### StatusPill Props

```typescript
interface StatusPillProps {
  status: StatusKind | string;  // Status value (with fuzzy matching)
  children?: React.ReactNode;   // Custom label override
  className?: string;           // Additional CSS classes
  title?: string;               // Tooltip text
}
```

## Integration Patterns

### In Data Tables

```tsx
// Use minimal variant for clean table appearance
<StatusBadge status={row.status} variant="minimal" />

// Or small badges if highlighting is desired
<StatusBadge status={row.status} size="sm" />
```

### In Card Headers

```tsx
<CardHeader className="flex flex-row items-center justify-between">
  <CardTitle>Project Name</CardTitle>
  <StatusBadge status="In Progress" size="sm" />
</CardHeader>
```

### In Lists

```tsx
<div className="flex items-center justify-between">
  <span>Task Name</span>
  <StatusBadge status="Completed" />
</div>
```

## Best Practices

1. **Consistency**: Use StatusBadge for new implementations to ensure consistent styling
2. **Size Selection**: Use `sm` size in tables and compact layouts, `default` for general use, `lg` for emphasis
3. **Icon Usage**: Keep icons enabled for better visual recognition, disable only when space is very limited
4. **Accessibility**: The components include proper ARIA attributes and color contrast ratios
5. **Performance**: Components are lightweight and optimized for frequent re-renders

## Migration Guide

### From Inline Badge Styling

**Before:**
```tsx
<Badge className="bg-green-600 text-white">Completed</Badge>
```

**After:**
```tsx
<StatusBadge status="Completed" />
```

### From Custom Status Components

**Before:**
```tsx
const getStatusColor = (status) => {
  switch (status) {
    case "Completed": return "bg-green-600 text-white";
    // ... other cases
  }
};

<Badge className={getStatusColor(status)}>{status}</Badge>
```

**After:**
```tsx
<StatusBadge status={status} />
```

## Browser Support

- All modern browsers (Chrome, Firefox, Safari, Edge)
- Responsive design with proper mobile rendering
- High contrast mode support
- Screen reader compatible

## Examples

See `/pages/status-badge-examples.tsx` for comprehensive usage examples and visual demonstrations of all available status types and component variations.