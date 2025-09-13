# UUID Developer Guidelines

## Overview

This document provides standardized guidelines for UUID usage across the ERP system to ensure consistency, reliability, and maintainability.

## Core Principles

1. **Centralized UUID Management**: All UUID-related functionality is centralized in `shared/utils/uuid.ts`
2. **Consistent ID Generation**: Use standardized functions for ID generation based on use case
3. **Validation Before Usage**: Always validate UUIDs before database operations
4. **System User Constant**: Use `SYSTEM_USER_ID` for system-generated operations

## UUID Utilities Reference

### Import Statement
```typescript
import { 
  generateUUID, 
  generateNanoId, 
  validateUUID, 
  validateUserIdOrDefault, 
  SYSTEM_USER_ID,
  NULL_UUID 
} from "@shared/utils/uuid";
```

### Functions and Constants

#### `generateUUID(): string`
- **Use for**: Primary business entities (customers, orders, quotations)
- **Returns**: RFC 4122 v4 UUID (e.g., `550e8400-e29b-41d4-a716-446655440000`)
- **Example**: 
```typescript
const customerId = generateUUID();
```

#### `generateNanoId(): string` 
- **Use for**: Operational entities that require shorter IDs (items, line entries)
- **Returns**: URL-safe string ID (e.g., `V1StGXR8_Z5jdHi6B-myT`)
- **Example**:
```typescript
const itemId = generateNanoId();
```

#### `validateUUID(id: string): boolean`
- **Use for**: Validating UUID format before database operations
- **Returns**: `true` if valid UUID, `false` otherwise
- **Example**:
```typescript
if (!validateUUID(customerId)) {
  throw new Error("Invalid customer ID format");
}
```

#### `validateUserIdOrDefault(userId?: string): string`
- **Use for**: User ID validation with system fallback
- **Returns**: Valid UUID or `SYSTEM_USER_ID` if invalid/undefined
- **Example**:
```typescript
const validUserId = validateUserIdOrDefault(req.user?.id);
```

#### Constants
- **`SYSTEM_USER_ID`**: Use for system-generated operations
- **`NULL_UUID`**: Use as placeholder for null/undefined UUID references

## Usage Patterns by Layer

### Database Schema (shared/schema.ts)
```typescript
// Core business entities - use UUID
export const customers = pgTable("customers", {
  id: uuid("id").primaryKey().defaultRandom(),
  // ...
});

// Operational/tracking entities - use nanoid for shorter IDs
export const auditLogs = pgTable("audit_logs", {
  id: text("id").primaryKey().$defaultFn(() => nanoid()),
  // ...
});
```

### Storage Layer (server/storage/*.ts)
```typescript
import { generateUUID, generateNanoId, validateUserIdOrDefault, SYSTEM_USER_ID } from "@shared/utils/uuid";

export class CustomerStorage extends BaseStorage {
  async createCustomer(customerData: any, userId?: string) {
    const customerId = generateUUID();
    const validUserId = validateUserIdOrDefault(userId);
    
    const newCustomer = {
      id: customerId,
      ...customerData,
      createdBy: validUserId,
      createdAt: new Date(),
    };
    
    return await db.insert(customers).values(newCustomer).returning();
  }
}
```

### API Routes (server/routes/*.ts)
```typescript
import { validateUUID, validateUserIdOrDefault } from "@shared/utils/uuid";

app.post("/api/customers/:id", async (req, res) => {
  const { id } = req.params;
  
  if (!validateUUID(id)) {
    return res.status(400).json({ error: "Invalid customer ID format" });
  }
  
  const userId = validateUserIdOrDefault(req.user?.id);
  // ... rest of route logic
});
```

### Frontend Components (client/src/*)
```typescript
import { SYSTEM_USER_ID } from "@shared/utils/uuid";

// Use constant instead of hardcoded values
const formData = {
  ...data,
  createdBy: SYSTEM_USER_ID,
};
```

## Best Practices

### DO ✅
- Import utilities from `@shared/utils/uuid`
- Use `validateUserIdOrDefault()` for user ID parameters
- Use `generateUUID()` for core business entities
- Use `generateNanoId()` for operational/tracking records
- Validate UUIDs before database operations
- Use `SYSTEM_USER_ID` constant for system operations

### DON'T ❌
- Import `nanoid` or `uuid` directly except in schema files
- Use hardcoded UUIDs like `"default-user-id"` or `"system-user-id"`
- Skip UUID validation in API routes
- Mix UUID and nanoid for the same entity type
- Use empty strings or null for required UUID fields

## Migration Strategy

When updating existing code:

1. **Add Import**: Import utilities from `@shared/utils/uuid`
2. **Replace Generation**: Replace direct `nanoid()` or `uuid()` calls
3. **Add Validation**: Add UUID validation in routes
4. **Replace Constants**: Replace hardcoded values with constants
5. **Test**: Verify all CRUD operations work correctly

## Error Handling

### Invalid UUID Format
```typescript
if (!validateUUID(id)) {
  return res.status(400).json({ 
    error: "Invalid ID format",
    code: "INVALID_UUID",
    field: "id"
  });
}
```

### Missing User ID
```typescript
// Automatic fallback to system user
const userId = validateUserIdOrDefault(req.user?.id);
// No need for explicit error handling
```

## Testing Considerations

- Test with both valid and invalid UUID formats
- Verify system user fallback behavior
- Test cross-entity UUID references
- Validate database constraint enforcement

## Schema Migration Notes

When changing ID types:
1. Create migration script for data conversion
2. Update foreign key references
3. Test data integrity after migration
4. Update related indexes if needed

## Performance Considerations

- UUIDs are 36 characters vs nanoid's ~21 characters
- Use nanoid for high-volume operational data
- Use UUID for business entities that need global uniqueness
- Consider indexing strategy for UUID vs text fields

---

**Last Updated**: January 2025  
**Applies to**: All ERP system components  
**Review Schedule**: Quarterly or when adding new entity types