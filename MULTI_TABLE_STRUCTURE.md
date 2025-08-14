# Multi-Table Structure for Food Chilling Log

This document explains the new multi-table architecture that separates different form types into their own tables within a single AppSync API.

## Overview

Instead of trying to create separate databases (which Amplify CLI doesn't support well), we've implemented a **multi-table structure** within a single AppSync API. Each form type now has its own dedicated table:

- **`CookingCoolingFormEntry`** - Cooking and Cooling forms (standard forms)
- **`PiroshkiFormEntry`** - Piroshki, Calzone, Empanada forms  
- **`BagelDogFormEntry`** - Bagel Dog Cooking & Cooling forms

## Benefits

1. **Data Isolation**: Each form type's data is completely separate
2. **Performance**: Smaller, focused tables for better query performance
3. **Scalability**: Can scale each table independently based on usage
4. **Maintenance**: Easier to maintain and update specific form types
5. **Single API**: All forms use the same GraphQL endpoint and authentication
6. **Cost Effective**: Single AppSync API instead of multiple APIs
7. **Clean Architecture**: Focused only on form data, no unnecessary User/Initial/LogEntry complexity

## Database Schema

### Single AppSync API: `foodchillinglog`

All tables are managed within the same AppSync API, which means:
- Single GraphQL endpoint
- Single API key
- Unified authentication
- Shared infrastructure

### Table Structure

#### CookingCoolingFormEntry Table
- Standard CCP stages (ccp1, ccp2, coolingTo80, coolingTo54, finalChill)
- Basic form fields (ingredients, lot numbers, admin comments)
- No form-specific fields

#### PiroshkiFormEntry Table
- All standard CCP stages
- **Plus** Piroshki-specific fields:
  - `heatTreating` stage
  - `ccp2_126`, `ccp2_80`, `ccp2_55` stages
  - `quantityAndFlavor` data
  - `preShipmentReview` data

#### BagelDogFormEntry Table
- All standard CCP stages
- **Plus** Bagel Dog-specific fields:
  - `frankFlavorSizeTable` data
  - `bagelDogPreShipmentReview` data

## Implementation Details

### Storage Manager
The `MultiTableStorageManager` automatically routes form operations to the appropriate table based on the form type:

```typescript
// Automatically routes to correct table
await storageManager.savePaperForm(cookingForm);        // → CookingCoolingFormEntry table
await storageManager.savePaperForm(piroshkiForm);       // → PiroshkiFormEntry table
await storageManager.savePaperForm(bagelDogForm);       // → BagelDogFormEntry table
```

### Form Type Detection
Each form includes a `formType` field that determines which table to use:

```typescript
export enum FormType {
  COOKING_AND_COOLING = 'COOKING_AND_COOLING',
  PIROSHKI_CALZONE_EMPANADA = 'PIROSHKI_CALZONE_EMPANADA',
  BAGEL_DOG_COOKING_COOLING = 'BAGEL_DOG_COOKING_COOLING'
}
```

### Data Mapping
Each table has its own GraphQL schema with form-specific fields, but they all share the same base structure for common fields.

## GraphQL Operations

### Queries
Each table has its own query operations:
- `listCookingCoolingFormEntries`
- `listPiroshkiFormEntries`
- `listBagelDogFormEntries`

### Mutations
Each table has its own mutation operations:
- `createCookingCoolingFormEntry` / `updateCookingCoolingFormEntry`
- `createPiroshkiFormEntry` / `updatePiroshkiFormEntry`
- `createBagelDogFormEntry` / `updateBagelDogFormEntry`

### Subscriptions
Real-time updates are available for each table:
- `onCookingCoolingFormEntryCreated`
- `onPiroshkiFormEntryCreated`
- `onBagelDogFormEntryCreated`

## Usage Examples

### Creating Forms
```typescript
import { createEmptyForm, FormType } from './paperFormTypes';

// Creates form in appropriate table
const cookingForm = createEmptyForm(FormType.COOKING_AND_COOLING, 'JD');
const piroshkiForm = createEmptyForm(FormType.PIROSHKI_CALZONE_EMPANADA, 'JD');
const bagelDogForm = createEmptyForm(FormType.BAGEL_DOG_COOKING_COOLING, 'JD');
```

### Saving Forms
```typescript
import { storageManager } from './storageManager';

// Automatically saves to correct table
await storageManager.savePaperForm(cookingForm);
await storageManager.savePaperForm(piroshkiForm);
await storageManager.savePaperForm(bagelDogForm);
```

### Retrieving Forms
```typescript
// Get all forms from all tables
const allForms = await storageManager.getPaperForms();

// Get specific form by ID and type
const form = await storageManager.getPaperForm(formId, FormType.PIROSHKI_CALZONE_EMPANADA);
```

## Configuration

### Amplify Backend
Single API configuration:
```
amplify/backend/api/foodchillinglog/
├── schema.graphql          # Contains all table definitions
├── backend-config.json     # Single API configuration
└── team-provider-info.json # Single API reference
```

### Environment Variables
Single set of environment variables:
- `REACT_APP_AWS_APPSYNC_GRAPHQLENDPOINT`
- `REACT_APP_AWS_APPSYNC_APIKEY`

## What Was Removed

To simplify the architecture and focus only on form data, the following models were removed:

- **User model** - Employee/supervisor/admin management
- **InitialEntry model** - Employee initials management  
- **LogEntry model** - Food chilling records
- **All related enums and input types** for the removed models

This creates a cleaner, more focused system that only handles the three form types you need.

## Monitoring and Maintenance

### Performance Monitoring
- Monitor query performance per table
- Track storage usage per form type
- Identify bottlenecks in specific tables

### Backup and Recovery
- Each table can be backed up independently
- Faster recovery for specific form types
- Reduced risk of data loss

### Scaling
- Scale tables based on individual usage patterns
- Add read replicas for high-traffic tables
- Optimize indexes per table schema

## Migration from Previous Structure

### What Changed
1. **Schema**: Updated to include all three table types, removed User/Initial/LogEntry
2. **Storage Manager**: Now routes to tables instead of databases
3. **Types**: Maintained the same interface for backward compatibility
4. **Cleanup**: Removed all unnecessary complexity

### What Stayed the Same
1. **API Endpoint**: Same GraphQL endpoint
2. **Authentication**: Same API key
3. **Form Interface**: Same form creation and manipulation methods

## Troubleshooting

### Common Issues

1. **Table Not Found**: Ensure the schema has been deployed with `amplify push`
2. **Form Type Mismatch**: Verify form has correct `formType` field
3. **GraphQL Errors**: Check that the correct mutation/query is being used for the form type

### Debug Mode
Enable debug logging to see which table is being used:

```typescript
// In MultiTableStorageManager
console.log(`Saving form to table: ${form.formType}`);
console.log(`Getting form from table: ${formType}`);
```

## Future Enhancements

1. **Table-Specific Optimizations**: Custom indexes and queries per table
2. **Advanced Routing**: Route based on additional criteria (date, user, etc.)
3. **Cross-Table Queries**: Aggregate data across multiple tables
4. **Table Sharding**: Further split tables by date ranges or other criteria

## Support

For issues or questions about the multi-table structure:

1. Check the console logs for table routing information
2. Verify form types are correctly set
3. Ensure the schema has been properly deployed
4. Check that the correct GraphQL operations are being generated

## Summary

The multi-table structure provides the data isolation and performance benefits you wanted while maintaining the simplicity of a single AppSync API. Each form type gets its own dedicated table with form-specific fields, and the storage manager automatically routes operations to the correct table based on the form type.

**Key Benefits:**
- ✅ **Clean Architecture**: Only form data, no unnecessary complexity
- ✅ **Data Isolation**: Each form type in its own table
- ✅ **Single API**: One endpoint, one API key
- ✅ **Automatic Routing**: Forms go to correct table automatically
- ✅ **Performance**: Focused tables for better query performance
- ✅ **Maintainability**: Easy to update specific form types
