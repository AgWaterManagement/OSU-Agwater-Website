# AG Water Plan Editor

A comprehensive admin interface for managing agricultural water quality practices, concern questions, categories, and commodities via the backend API routes defined in `ag_wqplan.py`.

## Overview

The AG Water Plan Editor provides a tabbed interface for CRUD operations on the four main data entities used by the Water Quality Practices Planner:

1. **Practices** - Agricultural water quality practices with detailed information
2. **Concern Questions** - Water quality concern questions linked to categories
3. **Categories** - Classification categories for concern questions
4. **Commodities** - Agricultural commodity types

## Features

### Practices Tab
- View all practices in a searchable, paginated table
- Add new practices with full details (title, category, ecosystem benefits, costs, etc.)
- Edit existing practices
- Delete practices with confirmation
- Tag practices with concern categories to link to questions
- Assign TMDLs (Total Maximum Daily Loads) to practices
- Add reference links with labels and URLs

### Concern Questions Tab
- Manage water quality concern questions
- Link questions to concern categories
- Add, edit, and delete questions
- Each question directly impacts practice filtering in the planner

### Categories Tab
- Simple category/classification management
- Used by both concern questions and practices
- Add, edit, and delete custom categories

### Commodities Tab
- Manage agricultural commodity types
- Simple name-based entries
- Used for filtering practices by operation type

## Component Structure

```
src/pages/ag_wq_plan_editor/
├── agWaterPlanEditor.jsx          # Main editor component (tabs container)
├── PracticesEditor.jsx             # Practices CRUD interface
├── ConcernQuestionsEditor.jsx      # Concern questions CRUD interface
├── CategoriesEditor.jsx            # Categories CRUD interface  
├── CommoditiesEditor.jsx           # Commodities CRUD interface
└── README.md                        # This file
```

## API Integration

All components communicate with the Flask backend routes defined in `d:/Websites/AgWaterAPI/routes/ag_wqplan.py`:

- **GET** `/agwqplan/practices` - Fetch all practices
- **PUT** `/agwqplan/practices` - Upsert practices
- **DELETE** `/agwqplan/practices` - Delete practices

- **GET** `/agwqplan/concernQuestions` - Fetch all concern questions
- **PUT** `/agwqplan/concernQuestions` - Upsert concern questions
- **DELETE** `/agwqplan/concernQuestions` - Delete concern questions

- **GET** `/agwqplan/categories` - Fetch all categories
- **PUT** `/agwqplan/categories` - Upsert categories
- **DELETE** `/agwqplan/categories` - Delete categories

- **GET** `/agwqplan/commodities` - Fetch all commodities
- **PUT** `/agwqplan/commodities` - Upsert commodities
- **DELETE** `/agwqplan/commodities` - Delete commodities

The base API URL is `https://agwater.org:5556`.

## Usage

### Routing Integration

To integrate this editor into your application, add a route in your router configuration:

```jsx
import AgWaterPlanEditor from './pages/ag_wq_plan_editor/agWaterPlanEditor';

// In your route configuration:
{
  path: '/ag-water-plan-editor',
  element: <AgWaterPlanEditor />
}
```

### Adding/Editing Data

1. Click the **Add [Entity]** button to create a new entry
2. Fill in the form fields with required information
3. Click **Save** to persist to the backend
4. The table automatically refreshes to show the new/updated entry

### Deleting Data

1. Click the **Delete** button (trash icon) in the Actions column
2. Confirm the deletion in the modal dialog
3. The entry is removed from the backend and table

### Refreshing Data

- Click the **Refresh** button to reload data from the backend
- This is useful if another admin has made changes

## Data Validation

### Practices

- **ID** - Unique identifier (required, auto-generated if not provided)
- **Title** - Full practice title (required)
- **Category** - Practice category from predefined list (required)
- **Ecosystem Benefits** - Impact description (required)
- **Costs** - Cost information (required)
- **Benefits** - Benefit information (required)
- **Tags** - Link to concern question categories (multi-select)
- **TMDLs** - Relevant water quality impairment areas
- **References** - Documentation links in JSON format

### Concern Questions

- **ID** - Unique identifier (required, auto-generated if not provided)
- **Category** - Concern category from predefined list (required)
- **Question Text** - The actual question text (required)

### Categories

- **Name** - Category name (required)

### Commodities

- **Name** - Commodity name (required)

## Data Model

### Practice Object
```javascript
{
  id: string,
  title: string,
  category: string,
  helps: string[],
  ecosystemBenefits: string,
  costs: string,
  benefits: string,
  links: { label: string, url: string }[],
  tags: string[],           // Concern categories
  tmdls: string[],
  complianceNotes: string
}
```

### ConcernQuestion Object
```javascript
{
  id: string,
  category: string,
  text: string
}
```

### Category Object
```javascript
{
  id: string,
  name: string
}
```

### Commodity Object
```javascript
{
  id: string,
  name: string
}
```

## Error Handling

- All API failures display user-friendly error messages via Ant Design message notifications
- Network errors, validation errors, and server errors are caught and reported
- Failed operations do not update the local state or table

## Performance Notes

- The editor fetches data on component mount
- Large datasets (100+ practices) will still load efficiently due to table pagination
- All CRUD operations are async and show loading states to prevent UI freezing
- useCallback and proper dependency arrays prevent unnecessary re-renders

## Future Enhancements

- Bulk import/export functionality
- Search and filter on table columns
- Sortable columns
- Advanced form validation with field-level error messages
- Undo/redo functionality
- Audit logging of all changes
- Role-based access control
