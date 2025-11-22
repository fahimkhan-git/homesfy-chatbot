# Dynamic Project ID Detection Guide

## Overview

The widget now automatically detects the project ID based on the website domain where it's embedded. This allows the same widget script to work across 500-1000 websites without manual configuration.

## How It Works

1. **Widget Initialization**: When the widget loads, it detects the current website domain (e.g., `lodha.com`)
2. **API Lookup**: Widget calls `/api/widget-config/domain/lodha.com` to get the project ID
3. **Project ID Assignment**: 
   - If mapping exists → Uses mapped project ID
   - If no mapping → Uses domain as project ID (auto-detection)
4. **Project-Specific Operations**: All operations use the detected project ID:
   - Property detection
   - AI conversations
   - Lead submissions
   - Event tracking

## Configuration Methods

### Method 1: Static Mapping (Quick Setup)

Edit `apps/api/src/routes/widgetConfig.js`:

```javascript
const DOMAIN_TO_PROJECT_MAP = {
  "lodha.com": "5796",
  "nivasa.com": "5797",
  "example-project.com": "5798",
  // Add more mappings as needed
};
```

### Method 2: Database Mapping (Recommended for Production)

Store domain mappings in the database using the WidgetConfig model:

```javascript
// Via API
POST /api/widget-config/:projectId
{
  "domains": ["lodha.com", "www.lodha.com", "lodha-properties.com"]
}
```

The `domains` array allows multiple domains to map to the same project.

### Method 3: Auto-Detection (Default)

If no mapping is found, the widget automatically uses the domain name as the project ID:
- `lodha.com` → project ID: `lodha.com`
- `nivasa.com` → project ID: `nivasa.com`

This ensures each website gets a unique project ID without any configuration.

## API Endpoints

### Get Project ID from Domain

```
GET /api/widget-config/domain/:domain
```

**Example:**
```bash
curl http://localhost:4000/api/widget-config/domain/lodha.com
```

**Response:**
```json
{
  "projectId": "5796",
  "domain": "lodha.com",
  "source": "static_map" // or "database" or "auto_detected"
}
```

## Widget Usage

### Basic Usage (Auto-Detection)

Simply paste the widget script on any website - no configuration needed:

```html
<script src="https://your-cdn.com/widget.js"></script>
```

The widget will automatically:
- Detect the domain
- Get/create project ID
- Load project-specific config
- Detect property information from the page

### Manual Project ID (Override)

If you need to override the auto-detection:

```html
<script 
  src="https://your-cdn.com/widget.js"
  data-project="5796"
></script>
```

## Benefits

✅ **No Manual Configuration**: Works out of the box on any website  
✅ **Data Isolation**: Each website's data is separate  
✅ **Project-Specific AI**: AI knows which project the user is asking about  
✅ **Correct Lead Routing**: Leads go to the correct project in CRM  
✅ **Scalable**: Works across 500-1000 websites with same script  

## Example Scenarios

### Scenario 1: Lodha Website
- Domain: `lodha.com`
- Widget detects domain → Gets project ID `5796`
- AI knows it's Lodha project
- Property detection extracts Lodha-specific info
- Leads submitted with project ID `5796`

### Scenario 2: Nivasa Website
- Domain: `nivasa.com`
- Widget detects domain → Gets project ID `5797`
- AI knows it's Nivasa project
- Property detection extracts Nivasa-specific info
- Leads submitted with project ID `5797`

### Scenario 3: New Website (No Mapping)
- Domain: `new-project.com`
- Widget detects domain → Auto-creates project ID `new-project.com`
- Property detection extracts info from page
- Leads submitted with project ID `new-project.com`
- No conflicts with other websites ✅

## Troubleshooting

### Check Project ID Detection

Open browser console and look for:
```
HomesfyChat: Auto-detecting project ID from domain: lodha.com
HomesfyChat: ✅ Project ID detected from domain: 5796
```

### Verify API Response

```bash
curl http://localhost:4000/api/widget-config/domain/your-domain.com
```

### Check Widget Config

```bash
curl http://localhost:4000/api/widget-config/5796
```

## Best Practices

1. **Use Database Mapping** for production (Method 2)
2. **Add Multiple Domains** if a project has multiple websites
3. **Use Static Mapping** for quick testing (Method 1)
4. **Let Auto-Detection Work** for new websites (Method 3)

## Migration from Manual Project IDs

If you're currently using manual project IDs:

1. **Keep Existing Scripts**: They'll continue to work
2. **Add Domain Mappings**: Map domains to existing project IDs
3. **Gradually Remove Manual IDs**: Let auto-detection take over

The widget prioritizes:
1. Manual `data-project` attribute
2. Domain mapping (static or database)
3. Auto-detection (domain as project ID)

