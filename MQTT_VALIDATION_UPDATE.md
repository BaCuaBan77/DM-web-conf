# MQTT Topic Validation Update

## Changes Made

Updated the `deviceManagerKey` validation regex from allowing only alphanumeric, underscores, and slashes to **rejecting forward slashes, hash, and plus characters**.

### Previous Validation
```regex
^[a-zA-Z0-9_/]+$
```
- ❌ Only allowed: letters, numbers, underscores, forward slashes
- ❌ Rejected: spaces, special characters, hash (#), plus (+)

### New Validation  
```regex
^[^\/#+]+$
```
- ✅ Allows: all characters **EXCEPT** `/`, `#`, and `+`
- ✅ Now allows: spaces, dashes, underscores, alphanumeric, and most special characters
- ❌ Rejects: forward slash (`/`), hash (`#`), plus (`+`)

## What Changed

### 1. Backend Validation (`ValidationService.java`)
```java
// Old
private static final Pattern MQTT_TOPIC_PATTERN = Pattern.compile("^[a-zA-Z0-9_/]+$");

// New
private static final Pattern MQTT_TOPIC_PATTERN = Pattern.compile("^[^\\/#+]+$");
```

### 2. Frontend Validation (`validation.ts`)
```typescript
// Old
const MQTT_TOPIC_REGEX = /^[a-zA-Z0-9_/]+$/;

// New  
const MQTT_TOPIC_REGEX = /^[^\/#+]+$/;
```

### 3. Frontend Error Messages (`DevicesTab.tsx`)
```typescript
// Old
if (deviceManagerKey.includes(' ')) {
  newErrors.deviceManagerKey = 'Spaces not allowed';
}

// New
if (deviceManagerKey.includes('/')) {
  newErrors.deviceManagerKey = 'Forward slashes (/) not allowed';
}
```

### 4. Test Cases Updated

**Backend Tests (`ValidationServiceTest.java`):**
- ✅ Updated to allow spaces
- ✅ Updated to reject forward slashes
- ✅ Updated test examples (no more `/` in valid keys)

**Frontend Tests (`validation.test.ts` & `DevicesTab.test.tsx`):**
- ✅ Updated to allow spaces  
- ✅ Updated to reject forward slashes
- ✅ Updated error message assertions

### 5. Documentation Updated
- ✅ `TDD_plan.md` - Updated validation rules table
- ✅ `Requirement Specs.md` - Updated validation description
- ✅ Test comments updated to reflect new rules

## Examples

### ✅ Now VALID (previously invalid):
- `"my device key"` - spaces allowed
- `"device-sensor"` - dashes allowed
- `"My Device 123"` - mixed case with spaces

### ✅ Still VALID:
- `"device_sensor"` - underscores
- `"DeviceKey123"` - alphanumeric
- `"my-device_key"` - dashes and underscores

### ❌ Now INVALID (previously valid):
- `"device/sensor"` - forward slash not allowed
- `"sensor/temp/1"` - hierarchy notation not allowed

### ❌ Still INVALID:
- `"key#hash"` - hash not allowed
- `"key+plus"` - plus not allowed
- `"a".repeat(21)` - > 20 characters

## Test Results

All validation tests passing:
```
[INFO] Tests run: 80, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

## Impact

### Positive Changes:
1. ✅ More flexible key naming (spaces, dashes allowed)
2. ✅ Better user experience (fewer cryptic validation errors)
3. ✅ Clearer intention (explicitly rejects problematic MQTT characters)

### Breaking Changes:
1. ⚠️ Existing keys with `/` will now be rejected
2. ⚠️ If you have keys like `"device/sensor"`, they need to be renamed to `"device-sensor"` or `"device_sensor"`

## Migration Guide

If you have existing `deviceManagerKey` values with forward slashes:

```json
// Before
{
  "deviceManagerKey": "device/sensor/temp"
}

// After (option 1: use dashes)
{
  "deviceManagerKey": "device-sensor-temp"
}

// After (option 2: use underscores)
{
  "deviceManagerKey": "device_sensor_temp"
}

// After (option 3: use spaces)
{
  "deviceManagerKey": "device sensor temp"
}
```

## Rationale

The new regex `^[^\/#+]+$` is more permissive while still protecting against MQTT-problematic characters:
- `/` - Topic hierarchy separator in MQTT (could cause confusion)
- `#` - Multi-level wildcard in MQTT subscriptions
- `+` - Single-level wildcard in MQTT subscriptions

By rejecting only these three characters, we allow more natural naming while preventing MQTT-specific issues.

## Files Modified

1. `backend/src/main/java/com/observis/dmconfig/validation/ValidationService.java`
2. `frontend/src/utils/validation.ts`
3. `frontend/src/components/DevicesTab.tsx`
4. `backend/src/test/java/com/observis/dmconfig/validation/ValidationServiceTest.java`
5. `frontend/src/utils/__tests__/validation.test.ts`
6. `frontend/src/components/__tests__/DevicesTab.test.tsx`
7. `TDD_plan.md`
8. `Requirement Specs.md`

## Verification

To verify the changes work:

1. **Start the backend:**
   ```bash
   cd backend
   mvn spring-boot:run -s settings.xml
   ```

2. **Test with curl:**
   ```bash
   # Valid key with spaces
   curl -X POST http://localhost:8080/api/save \
     -H "Content-Type: application/json" \
     -d '{"configType":"devices","data":{"deviceManagerKey":"my device key","deviceManagerName":"Test"}}'
   
   # Invalid key with slash (should fail)
   curl -X POST http://localhost:8080/api/save \
     -H "Content-Type: application/json" \
     -d '{"configType":"devices","data":{"deviceManagerKey":"my/device","deviceManagerName":"Test"}}'
   ```

3. **Run tests:**
   ```bash
   cd backend
   mvn test -s settings.xml
   ```

All validation tests should pass! ✅

