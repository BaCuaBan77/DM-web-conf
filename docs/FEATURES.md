# Features

## User Interface

### Design System

**Material UI Components:**
- Professional, modern interface with consistent styling
- Responsive design for desktop and tablet
- Green Observis theme (#10b981) for branding
- Clean white backgrounds with subtle borders
- Accessible color contrasts and typography

**Navigation:**
- Sidebar navigation with grouped sections
- Active page highlighting in green
- Smooth transitions between pages
- Persistent state across navigation

### Sidebar Navigation

**Main Section:**
- **DM Details** - Device Manager configuration
- **Network Config** - Static IP/DHCP network settings
- **Server Connection** - MQTT broker configuration

**Device Settings Section:**
- **IBAC2** - Biological detection device (custom SVG icon)
- **S900** - Radiation detection device (custom SVG icon)
- **GTD Module-B** - Chemical detection device (custom SVG icon)
- **WXT53X** - Weather station (cloud icon)

### Change Tracking

**Visual Indicators:**
- 🟠 Orange dots appear on sidebar items with unsaved changes
- Dots persist across tab navigation
- Multiple tabs can have changes simultaneously
- All indicators clear after successful save

**Save All Changes:**
- Single "Save Changes" button in header
- Enabled when ANY tab has unsaved changes
- Saves all modified configurations in one operation
- One system reboot after all changes saved

### Form Validation

**Real-Time Validation:**
- Instant feedback as you type
- Red error messages below invalid fields
- Fields highlight in red when invalid
- Submit blocked until all fields valid

**Validation Across Tabs:**
- All modified tabs validated before save
- Error message shows which tabs have errors
- Must fix all errors before saving

### Configuration Pages

#### DM Details
- Device Manager Key (MQTT topic validation)
- Device Manager Name (50 char limit)
- Green header with configuration tips
- Blue info box with best practices

#### Network Configuration
- Interface name selection
- DHCP vs Static IP toggle
- IP address, netmask, gateway fields
- Warning about system reboot
- Only appears when method is "static"

#### Server Connection
- MQTT Broker IP address
- MQTT Port number (default 1883)
- IPv4 and port validation
- Configuration tips for connectivity

#### Device-Specific Pages

**Serial Devices (IBAC2, WXT53X):**
- Serial port dropdown (ttyS0, ttyS1 or /dev/ttyS0, /dev/ttyS1)
- Baud rate selection (9600-115200)
- Data bits (7, 8)
- Stop bits (1, 2)
- Parity (UI: None/Even/Odd, Storage: N/E/O)
- Serial port type (RS232, RS485)
- Device name field

**Network Devices (S900):**
- IP address field
- Port number field (default: 21012)
- Device name field
- Network connection tips

**Network Devices (GTD Module-B):**
- Network IP address
- Port number field (default: 80)
- Device name field
- Connection tips

### Save & Reboot Workflow

**Save Process:**
1. User makes changes in multiple tabs
2. Orange dots indicate modified tabs
3. Click "Save Changes" button
4. Validation runs on all modified tabs
5. Confirmation dialog shows:
   - List of tabs to be saved
   - Warning about system reboot
   - "Continue" / "Cancel" buttons

**Save Execution:**
1. Saves all modified configurations sequentially
2. Shows success/failure per tab
3. Triggers system reboot (once for all changes)
4. Displays "System is rebooting..." message
5. Clears all change indicators

### User Feedback

**Toast Notifications:**
- ✅ Success: Green notification (top-right)
- ⚠️ Warning: Orange notification
- ❌ Error: Red notification with details
- Auto-dismiss after 6 seconds
- Manual dismiss option

**Confirmation Dialogs:**
- Save & Reboot confirmation
- Lists all tabs being saved
- Clear warning about downtime
- Prevents accidental reboots

**Loading States:**
- Circular progress indicators
- "Loading..." text
- "Saving..." button state
- Disabled buttons during operations

### Accessibility

**Keyboard Navigation:**
- Tab through all form fields
- Enter to submit forms
- Escape to close dialogs
- Arrow keys for dropdowns

**Screen Readers:**
- Proper ARIA labels
- Form field descriptions
- Error announcements
- Button state changes

**Visual Feedback:**
- Clear focus indicators
- Error message associations
- Required field indicators
- Disabled state visibility

## Technical Features

### Frontend

**Technology Stack:**
- React 18.3.1
- TypeScript 5.5.3
- Material UI 7.3.4
- Vite 5.3.3 (build tool)
- Axios 1.7.2 (HTTP client)

**State Management:**
- React hooks (useState, useEffect, useRef)
- Change tracking state per tab
- Validation state per tab
- Centralized in App.tsx

**Component Architecture:**
- Functional components with TypeScript
- forwardRef for child-to-parent communication
- Props for data/validation callbacks
- Reusable form patterns

**Custom Icons:**
- SVG icons for device types
- Biological (ms-bio.svg)
- Radiation (ms-rad.svg)
- Chemical (ms-chem.svg)
- 24x24px sizing

### Backend

**Technology Stack:**
- Spring Boot 3.2.0
- Java 17
- Jackson (JSON processing)
- Maven 3.9+

**Architecture:**
- RESTful API design
- Service layer pattern
- Validation layer
- File I/O abstraction
- Error handling middleware

**Configuration Profiles:**
- **Development**: Uses `src/main/resources/dev-data/`
- **Production**: Uses `/opt/dm/` files
- Profile-specific properties
- Easy local development

**Validation:**
- Input validation on all endpoints
- MQTT topic format validation
- IPv4 address validation
- Port number range validation
- Device-specific rules
- Detailed error messages

### Deployment

**Docker Containers:**
- Backend: Java 17 with Spring Boot
- Frontend: Nginx serving static files
- Multi-stage builds for optimization
- Health check endpoints

**File Mounts:**
```
/opt/dm/devices.json
/opt/dm/config.properties
/opt/dm/devices.d/IBAC.json
/opt/dm/devices.d/S900.json
/opt/dm/devices.d/oritestgtdb.json
/opt/dm/devices.d/wxt53x.json
/opt/dm/scripts/reboot.sh
/etc/network/interfaces
```

**Network:**
- Internal Docker network
- Frontend port 80 (production)
- Backend port 8080
- API proxy configuration

### Testing

**Frontend Tests:**
- Unit tests (Vitest + React Testing Library)
- E2E tests (Playwright)
- Component testing
- Integration testing
- Visual regression testing

**Backend Tests:**
- Unit tests (JUnit 5)
- Integration tests
- E2E API tests
- Validation tests
- File I/O tests

**Test Coverage:**
- Backend: Service, Controller, Validation layers
- Frontend: Components, Utils, Integration
- E2E: Complete user workflows
- Target: >80% coverage

## Validation Features

### Real-Time Validation

**As-You-Type:**
- MQTT topic validation
- IPv4 address format
- Port number ranges
- Character limits
- Required fields

**Visual Feedback:**
- Red border on invalid fields
- Error text below field
- Helper text when valid
- Icon indicators

**Cross-Field Validation:**
- Static IP requires address, netmask
- DHCP disables IP fields
- Device-specific rules

### Batch Validation

**Multi-Tab Validation:**
- Validates all modified tabs before save
- Shows list of tabs with errors
- Prevents partial saves
- Clear error messages

### Server-Side Validation

**Double Validation:**
- Frontend validates UX
- Backend validates security
- Prevents invalid data persistence
- Detailed error responses

## Security Features

**Input Sanitization:**
- XSS prevention
- SQL injection protection (N/A - file-based)
- Path traversal prevention
- MQTT topic validation

**CORS Configuration:**
- Configurable origins
- Development: Allow all
- Production: Specific hosts

**File Access:**
- Restricted to configuration directories
- No arbitrary file access
- Validated file paths
- Read/Write permissions enforced

## Performance Features

**Frontend:**
- Code splitting by route
- Lazy loading components
- Optimized bundle size
- Fast page transitions

**Backend:**
- Efficient file I/O
- Minimal memory footprint
- Quick validation
- Fast response times

**Caching:**
- No aggressive caching (config changes)
- Fresh data on every load
- Validation cached during session

## Future Enhancements

**Planned Features:**
- Authentication & authorization
- Audit logging
- Configuration backup/restore
- Bulk device configuration
- Configuration templates
- Multi-language support
- Dark mode toggle
- Export/Import configurations
- Configuration history
- Rollback functionality

