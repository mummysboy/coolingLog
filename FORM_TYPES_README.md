# Adding New Form Types

This document explains how to add new form types to the Food Chilling Log application.

## Overview

The application now supports multiple form types through a flexible system that includes:
- Form type enumeration
- Helper functions for display names, descriptions, icons, and colors
- Dropdown menu for selecting form types
- **Multiple forms displayed on the page simultaneously**
- Extensible form creation system

## Current Form Types

- **FOOD_CHILLING_LOG**: Temperature monitoring for food safety (currently implemented)

## How Forms Work

When you select a form type from the dropdown:
1. A new form is created and added to the page
2. The form appears as a collapsible card below existing forms
3. Each form can be expanded/collapsed independently
4. Forms are automatically saved and persist between sessions
5. Multiple forms of the same or different types can coexist on the page

## How to Add a New Form Type

### 1. Update the FormType Enum

In `src/lib/paperFormTypes.ts`, add your new form type:

```typescript
export enum FormType {
  FOOD_CHILLING_LOG = 'FOOD_CHILLING_LOG',
  TEMPERATURE_LOG = 'TEMPERATURE_LOG', // Add your new type here
  // ... other types
}
```

### 2. Update Helper Functions

Add your new form type to all the helper functions in the same file:

```typescript
export const getFormTypeDisplayName = (formType: FormType): string => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return 'Food Chilling Log';
    case FormType.TEMPERATURE_LOG:
      return 'Temperature Log'; // Add your display name
    default:
      return 'Unknown Form Type';
  }
};

export const getFormTypeDescription = (formType: FormType): string => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return 'Temperature monitoring for food safety';
    case FormType.TEMPERATURE_LOG:
      return 'General temperature monitoring log'; // Add your description
    default:
      return 'No description available';
  }
};

export const getFormTypeIcon = (formType: FormType): string => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z';
    case FormType.TEMPERATURE_LOG:
      return 'M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z'; // Add your icon path
    default:
      return 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z';
  }
};

export const getFormTypeColors = (formType: FormType): { bg: string; text: string; hover: string } => {
  switch (formType) {
    case FormType.FOOD_CHILLING_LOG:
      return {
        bg: 'bg-blue-100',
        text: 'text-blue-600',
        hover: 'hover:bg-blue-200'
      };
    case FormType.TEMPERATURE_LOG:
      return {
        bg: 'bg-green-100',
        text: 'text-green-600',
        hover: 'hover:bg-green-200'
      }; // Add your color scheme
    default:
      return {
        bg: 'bg-gray-100',
        text: 'text-gray-600',
        hover: 'hover:bg-gray-200'
      };
  }
};
```

### 3. Add to the Dropdown Menu

In `src/app/form/page.tsx`, add a new button to the dropdown menu. You can uncomment and modify the example code that's already there:

```typescript
<button
  onClick={() => {
    createNewForm(FormType.TEMPERATURE_LOG);
    setIsAddFormDropdownOpen(false);
  }}
  className={`block w-full text-left px-4 py-2 text-sm text-gray-700 ${getFormTypeColors(FormType.TEMPERATURE_LOG).hover} hover:text-gray-900`}
  role="menuitem"
>
  <div className="flex items-center">
    <div className={`w-8 h-8 ${getFormTypeColors(FormType.TEMPERATURE_LOG).bg} rounded-lg flex items-center justify-center mr-3`}>
      <svg className={`w-4 h-4 ${getFormTypeColors(FormType.TEMPERATURE_LOG).text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={getFormTypeIcon(FormType.TEMPERATURE_LOG)} />
      </svg>
    </div>
    <div>
      <div className="font-medium">{getFormTypeDisplayName(FormType.TEMPERATURE_LOG)}</div>
      <div className="text-xs text-gray-500">{getFormTypeDescription(FormType.TEMPERATURE_LOG)}</div>
    </div>
  </div>
</button>
```

### 4. Create Form Component and Logic

You'll need to:
- Create a new form component for your form type
- Update the form store to handle the new form type
- Add any necessary validation logic
- Update the form display logic to show the appropriate component

### 5. Update Form Creation

Make sure your new form type is handled in the `createEmptyForm` function and any other form creation logic.

## Icon Resources

For SVG icons, you can use:
- [Heroicons](https://heroicons.com/) - Free SVG icons
- [Feather Icons](https://feathericons.com/) - Simple, clean icons
- [Lucide Icons](https://lucide.dev/) - Beautiful & consistent icons

## Color Schemes

Use Tailwind CSS color classes for consistency:
- `bg-{color}-100` for light backgrounds
- `text-{color}-600` for text
- `hover:bg-{color}-200` for hover effects

Common color options: `blue`, `green`, `purple`, `orange`, `red`, `indigo`, `pink`, `yellow`

## Testing

After adding a new form type:
1. Run `npx tsc --noEmit` to check for TypeScript errors
2. Test the dropdown menu to ensure the new type appears
3. Test form creation to ensure the new type works correctly
4. Verify that all helper functions return the expected values
5. **Test that new forms appear on the page and can be expanded/collapsed**

## Example Implementation

See the commented example code in `src/app/form/page.tsx` for a complete example of how to add a new form type to the dropdown.

## User Experience

- **Multiple Forms**: Users can now have multiple forms open simultaneously
- **Independent Expansion**: Each form can be expanded/collapsed independently
- **Visual Organization**: Forms are displayed as cards with clear status indicators
- **Easy Navigation**: Forms are clearly labeled with type and date information
- **Responsive Design**: Works on all screen sizes with proper spacing
