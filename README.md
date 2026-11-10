# Endless Space 2 Localization Wiki & Content Editor

An interactive wiki and editing suite for the Endless Space 2 localization files (16 files, 25,950 strings).

---

## 🔒 Security & Password Protection

To ensure security, editing the wiki content and committing changes to the repository is password-protected.

- **Password**: **`17ExTra`**
- Anyone can read, browse, and search the wiki without a password.
- **To edit, modify, add, delete, or save changes to the repository, you must key in the password `17ExTra`.**
- Unauthorized save or commit attempts are rejected by the server with `HTTP 401 Unauthorized`.

---

## 🚀 How to Edit Wiki Content

### 1. Launch the Editor Server
- **Windows**: Double-click **`run_editor.bat`**
- **Terminal (Python)**:
  ```bash
  python server.py
  ```
- **Terminal (Node.js)**:
  ```bash
  node server.js
  ```
- Your browser will open **`http://localhost:8000/editor.html`** (or you can open it manually).

### 2. Enter the Password
- When the editor opens, click **🔒 Locked (Key in Password to Edit)** or enter the password when prompted:
  ```
  17ExTra
  ```
- Click **🔓 Unlock Editor**. The status changes to **🔓 Editor Authenticated (17ExTra)**, unlocking all editing tools.

### 3. Edit Strings with Live Preview
- **Select any of the 16 files**: Choose from 2025 Patch, Base Game, Assets, Quests, DLCs, Updates, etc.
- **Search & Filter**: Filter by Topic / Category or search for specific keys and text.
- **Visual Editing**:
  - Click on any string to inspect and edit its key, category, or English text.
  - **Live ES2 Game Preview**: Renders tokens (`$Amount01Name`, `$Timer`), game keywords (`[dust]`, `[science]`, `[industry]`, `[food]`, `[manpower]`, `[turn]`), and color codes (`#color#...#REVERT#`) in real time.
  - **Token Toolbar**: Click token buttons to insert common Endless Space 2 variables and icons directly at cursor.

### 4. Immediate Save to the Repository
- Click **💾 Save & Commit to Repository** on any individual string or **💾 Save to Repository** in the top bar.
- Changes are **immediately saved to the JavaScript localization file (`js/*.js`)** on disk and a **Git commit is immediately created in the repository** with a descriptive commit message and timestamp.
- The commit hash and confirmation toast appear instantly in the editor.

### 5. Add, Delete & Batch Replace
- **➕ Add String**: Create a new localization string and commit it to the repository.
- **🗑️ Delete String**: Remove unused strings with confirmation and commit to the repository.
- **🔍 Find & Replace**: Perform batch replacements across the whole file or filtered topic.

---

## ✏️ Quick "Edit Wiki" Links from Wiki Pages

- Every wiki page (`ES2_Localization_*_Locales.html`) includes an **`✏️ Edit Wiki`** button in the top navigation tab bar.
- Clicking **`✏️ Edit Wiki`** opens `editor.html` directly with that file loaded.
- The portal home page (`index.html`) includes a direct link to the **`✏️ Content Editor (Password Protected)`**.

---

## 📁 Repository Structure

```
├── editor.html                               # Visual Content Editor web interface
├── server.py                                 # Python server with Git auto-commit engine
├── server.js                                 # Node.js server with Git auto-commit engine
├── run_editor.bat                            # Windows 1-click launcher
│
├── js/                                       # JavaScript localization files (wiki content)
│   ├── ES2_Localization_2023Patch_Locales.js
│   ├── ES2_Localization_2025Patch_Locales.js
│   ├── ES2_Localization_Assets_Locales.js
│   ├── ES2_Localization_DLC2_Locales.js
│   ├── ... (all 16 files)
│   └── index.js                              # Portal search script
│
├── style.css                                 # Retro Endless Space 2 styling
├── index.html                                # Wiki portal with stats & topic chips
└── ES2_Localization_*_Locales.html           # 16 wiki pages
```
