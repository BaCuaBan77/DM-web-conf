# **Device Manager Configuration Web Interface**  
**Version:** 1.2  
**Author:** Long Le 
**Date:** 2025-10-17  

---

## **1. Overview**
The goal of this project is to develop a web-based configuration interface for a **Device Manager system** running inside a Docker container on a **Debian PC**.  

The interface allows users to:
- Edit selected configuration properties in JSON and properties files used by the Device Manager.
- Change the Debian PC’s static IP address via `/etc/network/interfaces`.
- Save and validate inputs.
- Apply changes by triggering a system reboot through a host script.

The web interface will itself run in a **Docker container**, exposed on port **80**, and be accessible via the Debian PC’s IP address.

---

## **2. System Architecture**

### **2.1 Components**
| Component | Description |
|------------|--------------|
| **Device Manager Container (`dm`)** | Existing service reading configuration files from `/opt/dm/`. |
| **Configuration Website Container** | New service providing GUI for editing specific configuration properties. Mounted with access to `/opt/dm/` and `/opt/dm/scripts/reboot.sh`. |
| **Host System (Debian PC)** | Runs both containers. Holds configuration files and executes the reboot script when triggered. |

### **2.2 File Mounts**
| Host Path | Description | Used By |
|------------|--------------|----------|
| `/opt/dm/devices.json` | Global device manager configuration | Both |
| `/opt/dm/config.properties` | System-level configuration (MQTT server settings) | Both |
| `/opt/dm/devices.d/` | Directory containing per-device configuration files | Both |
| `/opt/dm/scripts/reboot.sh` | Host-level script to reboot the Debian PC | Website container |

---

## **3. Functional Requirements**

### **3.1 Web Interface Features**
1. **Dashboard Layout**
   - Single web application with **tabbed navigation**.
   - Each tab represents one configuration file:
     - Devices
     - Config Properties
     - IBAC
     - S900
     - oritestgtdb
     - WXT53X
     - Network Configuration (IP settings)

2. **Configuration Editing**
   - Each tab provides input fields only for specific editable properties (see section 3.2).
   - Non-editable properties are hidden from the user.
   - **In-memory updates**: when the page/tab is opened, the current configuration files are read into memory as JSON objects.
   - For text box fields, **real-time validation** occurs as the user types.
   - Drop-down fields are restricted by design and require no validation.
   - When “Save” is clicked:
     - Updated JSON objects overwrite the corresponding original files on disk.
     - The system then calls `/opt/dm/scripts/reboot.sh`.

3. **Reboot Handling**
   - Reboot is handled **via external script** `/opt/dm/scripts/reboot.sh`.
   - The website invokes this script using a REST API endpoint (e.g., `/api/reboot`).

4. **System IP Configuration**
   - The GUI provides a separate section/tab to edit the Debian PC’s **static IP address**.
   - Changes are applied by editing `/etc/network/interfaces`.
   - After saving, the system triggers reboot to apply the new IP.

5. **MQTT Server Configuration**
   - `config.properties` fields (`fi.observis.sas.karafrest`, `fi.observis.sas.mqtt.url`) are for MQTT server addresses.
   - These fields are editable in the web GUI and validated as IPv4 addresses.

6. **Data Persistence**
   - Configuration files are stored on the host and mounted in both containers.
   - Edits persist across reboots and container restarts.

7. **Future Authentication**
   - MVP: No authentication required.
   - Future: Support for user login, password management, and local user database (e.g., SQLite or JSON file).

---

### **3.2 Editable Properties and Validation Rules**

#### **devices.json**
| Property | Type | Validation | Description |
|-----------|------|-------------|-------------|
| `deviceManagerKey` | String | Max 20 chars, no `/`, `#`, or `+` | MQTT topic identifier |
| `deviceManagerName` | String | Max 50 chars, may include spaces | Friendly display name |

#### **config.properties**
| Property | Validation | Description |
|------------|-------------|-------------|
| `fi.observis.sas.karafrest` | Valid IPv4 format | MQTT server address |
| `fi.observis.sas.mqtt.url` | Valid IPv4 format | MQTT server URL |

#### **IBAC.json**
| Property | Input Type | Validation | Options |
|-----------|-------------|-------------|----------|
| `address` | Dropdown | No validation | `ttyS0`, `ttyS1` |
| `speed` | Dropdown | No validation | `9600`, `19200`, `38400`, `57600`, `115200` |
| `bits` | Dropdown | No validation | `7`, `8` |
| `stopBits` | Dropdown | No validation | `1`, `2` |
| `parity` | Dropdown | No validation | `None`, `Even`, `Odd` |
| `serialPortType` | Dropdown | No validation | `RS232`, `RS485` |
| `name` | String | Max 50 chars, may include spaces | Device name |

#### **S900.json**
| Property | Input Type | Validation |
|-----------|-------------|-------------|
| `address` | Text | Valid IPv4 format |
| `portNumber` | Number | 1–65535 |
| `name` | String | Max 50 chars, may include spaces |

#### **oritestgtdb.json**
| Property | Input Type | Validation |
|-----------|-------------|-------------|
| `address` | Text | Valid IPv4 format |
| `name` | String | Max 50 chars, may include spaces |

#### **wxt53x.json**
| Property | Input Type | Validation | Options |
|-----------|-------------|-------------|----------|
| `address` | Dropdown | No validation | `ttyS0`, `ttyS1` |
| `speed` | Dropdown | No validation | Same as IBAC |
| `bits` | Dropdown | No validation | `7`, `8` |
| `stopBits` | Dropdown | No validation | `1`, `2` |
| `parity` | Dropdown | No validation | `None`, `Even`, `Odd` |
| `serialPortType` | Dropdown | No validation | `RS232`, `RS485` |
| `name` | String | Max 50 chars, may include spaces |

---

## **4. Non-Functional Requirements**
| Category | Requirement |
|-----------|--------------|
| **Performance** | File read/write should complete in <1s for all configuration files. |
| **Security** | No authentication in MVP; sensitive actions (like reboot) restricted via local network access only. |
| **Scalability** | Must support adding new device configuration JSON files with minimal code changes. |
| **Portability** | Entire system runs via Docker; independent of Debian version. |
| **Reliability** | If validation fails, no files are overwritten. |
| **Maintainability** | Code should separate backend (API + file logic) and frontend (GUI). |
| **UI/UX** | Responsive, simple tab-based design suitable for desktop and tablet. |

---

## **5. System Operations**

### **5.1 Startup**
- When the system boots, both Docker containers start via `docker-compose`
- Website container exposed on port `80`.

### **5.2 Saving Changes**
1. User edits properties in GUI.  
2. Real-time validation occurs for text fields.  
3. User presses **Save**.  
4. Backend updates in-memory JSON objects and overwrites original files on disk.  
5. `/opt/dm/scripts/reboot.sh` is executed.  

### **5.3 Reboot Script**
- Host script: `/opt/dm/scripts/reboot.sh`  
- Executed by website container using a REST API call or subprocess.  
- Script handles:
  - Backup of configuration files (optional)
  - System reboot (`sudo reboot`)

---

## **6. Security and Future Enhancements**
| Feature | Description |
|----------|--------------|
| **Authentication** | Add login with username/password stored in local database (SQLite or JSON). |
| **Role Management** | Future: admin/user roles with different edit permissions. |
| **HTTPS Support** | Future: add SSL/TLS for secure access. |
| **Audit Logging** | Record all configuration changes with timestamp and username. |

---

## **7. Acceptance Criteria**
- ✅ User can access the web GUI at `http://<debian-ip>/`
- ✅ User can view and modify editable properties only.
- ✅ Real-time validation for text boxes is enforced.
- ✅ Drop-down fields limited to valid options.
- ✅ “Save” overwrites files correctly and triggers reboot.
- ✅ System restarts with updated configuration and IP.
- ✅ (Future) Authentication layer integrated without breaking existing functionality.

