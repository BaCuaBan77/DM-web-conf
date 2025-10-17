# Device Manager Web Config – TDD Plan

**Version:** 1.2
**Date:** 2025-10-17
**Author:** Long Le

---

## 1. Backend (Spring Boot API)

### 1.1 Objectives

* Correctly read and write configuration files (JSON and properties).
* Validate all editable properties before saving.
* Execute reboot script safely.
* Expose REST API endpoints for frontend.
* Handle error scenarios gracefully.

### 1.2 Test Cases

| Feature                                                                            | Test Case                                                        | Expected Outcome                                                         | Priority |
| ---------------------------------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------ | -------- |
| Read `devices.json`                                                                | Read `deviceManagerKey` and `deviceManagerName`                  | JSON object returned with correct keys                                   | High     |
| Validate `deviceManagerKey`                                                        | Input contains spaces, invalid MQTT characters, or >20 chars     | Validation fails; API returns error                                      | High     |
| Validate `deviceManagerName`                                                       | Input >50 chars                                                  | Validation fails                                                         | Medium   |
| Read `config.properties`                                                           | Parse `fi.observis.sas.karafrest` and `fi.observis.sas.mqtt.url` | Properties object returned with correct keys and values                  | High     |
| Validate MQTT IP fields                                                            | Invalid IP formats                                               | Validation fails                                                         | High     |
| Read per-device JSON (`IBAC.json`, `S900.json`, `oritestgtdb.json`, `wxt53x.json`) | Return only editable properties                                  | Correct values returned                                                  | High     |
| Validate per-device fields                                                         | Text and dropdown inputs                                         | Text fields validated; dropdown restricted                               | High     |
| Write `config.properties`                                                          | Save API called with valid IP                                    | Original file overwritten with updated key-value pairs; success returned | High     |
| Write configuration JSON files                                                     | Save API called with valid JSON                                  | Original files overwritten; returns success                              | High     |
| Reboot script execution                                                            | Save triggers reboot                                             | `/opt/dm/scripts/reboot.sh` executed                                     | High     |
| Error handling                                                                     | Read/write failure                                               | API returns error without crashing                                       | High     |
| REST API endpoints                                                                 | `/api/devices`, `/api/save`, `/api/reboot`                       | Respond with correct status codes                                        | High     |

---

## 2. Frontend (React + TypeScript + Vite)

### 2.1 Objectives

* Display editable properties in GUI tabs.
* Provide real-time validation for text boxes.
* Restrict dropdowns to allowed values.
* Trigger save API calls and show status.
* Separate tabs for each configuration file.

### 2.2 Test Cases

| Feature                     | Test Case                     | Expected Outcome                                          | Priority |
| --------------------------- | ----------------------------- | --------------------------------------------------------- | -------- |
| Load properties on tab open | Tab loads with API data       | Input fields pre-populated correctly                      | High     |
| Text field validation       | Invalid key/IP/name entered   | Validation message shown; save button disabled if invalid | High     |
| Dropdown fields             | Select valid options          | Only allowed values selectable                            | High     |
| Save button                 | Click save with valid inputs  | Sends API call; success message shown                     | High     |
| Save button disabled        | Click save with invalid input | API call blocked; error message shown                     | High     |
| Tab switching               | Navigate between tabs         | Data correctly displayed for each file                    | Medium   |
| UI responsiveness           | Resize window                 | Layout remains usable on desktop/tablet                   | Medium   |

---

## 3. Integration Tests

| Feature                  | Test Case                             | Expected Outcome                                       | Priority |
| ------------------------ | ------------------------------------- | ------------------------------------------------------ | -------- |
| Full save workflow       | User edits properties → Save → Reboot | Files updated; reboot script executed                  | High     |
| API error handling       | API returns error during save         | Frontend shows error; files unchanged                  | High     |
| File update verification | After save, check `/opt/dm/*`         | Files match updated values                             | High     |
| Reboot simulation        | Trigger reboot in test                | Script call simulated; system does not actually reboot | High     |

---

## 4. Validation Rules for Configurable Files

| File                  | Editable Fields                                         | Validation Rules                                                                                                      |
| --------------------- | ------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| **devices.json**      | `deviceManagerKey`                                      | max 20 chars, valid MQTT topic characters only (letters, numbers, underscores `_`, slashes `/`); no spaces or `#`/`+` |
|                       | `deviceManagerName`                                     | max 50 chars, spaces allowed                                                                                          |
| **config.properties** | `fi.observis.sas.karafrest`, `fi.observis.sas.mqtt.url` | valid IPv4 addresses; parse as properties key-value pairs                                                             |
| **IBAC.json**         | `address`                                               | dropdown: `ttyS0`,`ttyS1`                                                                                             |
|                       | `speed`                                                 | dropdown: `9600`,`19200`,`38400`,`57600`,`115200`                                                                     |
|                       | `bits`, `stopBits`, `parity`                            | dropdown options                                                                                                      |
|                       | `serialPortType`                                        | RS232/RS485                                                                                                           |
|                       | `name`                                                  | max 50 chars                                                                                                          |
| **S900.json**         | `address`                                               | valid IPv4                                                                                                            |
|                       | `portNumber`                                            | 1–65535                                                                                                               |
|                       | `name`                                                  | max 50 chars                                                                                                          |
| **oritestgtdb.json**  | `address`                                               | valid IPv4                                                                                                            |
|                       | `name`                                                  | max 50 chars                                                                                                          |
| **wxt53x.json**       | same as IBAC.json                                       | same rules                                                                                                            |

* **Frontend**: real-time validation for text boxes, including MQTT topic validation.
* **Backend**: final validation before saving; `config.properties` handled as key-value properties.

---

## 5. TDD Development Order

1. **Backend core**: file read/write and validation (JSON + properties, including MQTT topic validation).
2. **Backend API endpoints**: REST controllers.
3. **Frontend tabs and input forms**: load data correctly.
4. **Frontend validation**: text boxes + dropdowns + MQTT topic rules.
5. **Save workflow**: frontend → backend → file overwrite.
6. **Reboot workflow**: backend triggers reboot script.
7. **Integration tests**: end-to-end workflow.
8. **Error handling**: API failures, file permission issues.
9. **Optional future tests**: authentication, audit logging.
