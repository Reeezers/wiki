# Endless Space 2 Localization Wiki & Content Editor

An interactive wiki and editing suite for the Endless Space 2 localization files (16 files, 25,950 strings).

---

## 🔒 Security & Password Protection

To ensure security, editing the wiki content, saving to local disk, and committing/pushing from the interface requires password verification.

- **Password**: **`17ExTra`**
- Anyone can read, browse, and search the wiki without a password.
- **To edit, save locally, or trigger Git commit/push from the editor, you must key in the password `17ExTra`.**
- Unauthorized API requests without `17ExTra` are rejected with `HTTP 401 Unauthorized`.

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
- When the editor opens, enter the password when prompted:
  ```
  17ExTra
  ```
- Click **🔓 Unlock Editor**. The status changes to **🔓 Editor Authenticated (17ExTra)**, unlocking all editing tools.

### 3. Edit Strings & Save to Local
- **Select any of the 16 files**: Choose from 2025 Patch, Base Game, Assets, Quests, DLCs, Updates, etc.
- **Visual Editing**:
  - Click on any string to inspect and edit its key, category, or localization text.
  - **Live ES2 Game Preview**: Renders tokens (`$Amount01Name`, `$Timer`), game keywords (`[dust]`, `[science]`, `[industry]`, `[food]`, `[manpower]`, `[turn]`), and color codes (`#color#...#REVERT#`) in real time.
  - **Token Toolbar**: Click token buttons to insert common Endless Space 2 variables and icons directly at the cursor.
- **Save to Local**:
  - Click **💾 Save to Local** on an individual string or **💾 Save (Local)** in the toolbar.
  - Changes are saved **directly to the local JavaScript files (`js/*.js`) on disk**.

---

## 📦 Committing & Pushing

Committing and pushing can be done in either of two ways:

### Option A: From the Editor Itself
- **📦 Git Commit Button**:
  - Click **📦 Git Commit** in the top bar.
  - Inspect the list of modified files, enter your commit message (or use the suggested default), and click **Commit to Git**.
- **🚀 Git Push Button**:
  - Click **🚀 Git Push** to push your commits directly to the remote repository (`origin/main`).

### Option B: Like Usual via Git CLI / Terminal
Because edits are saved directly to the local files, you can manage Git as usual using standard commands or your favorite Git GUI / VS Code:
```bash
git status
git add .
git commit -m "Update localization strings"
git push
```

---

## 🔒 Developer-Only Editor Isolation

- **Disconnected from Public Wiki**: The public-facing wiki (`index.html` and the 16 `ES2_Localization_*_Locales.html` pages) contains **no links, buttons, or navigation to `editor.html`**. Public visitors can only browse and search the wiki.
- **Local Developer Access Only**: Only the developer who has the repository installed locally can open the editor by running `run_editor.bat` (or starting `server.py` / `server.js`) and navigating to `http://localhost:8000/editor.html`.
- **Password Required**: Even when accessing the editor interface locally, authentication with password **`17ExTra`** is required before any editing, local saving, committing, or pushing can occur.

---

## 📁 Repository Structure

```
├── editor.html                               # Visual Content Editor web interface
├── server.py                                 # Python server (Local save + Git commit/push API)
├── server.js                                 # Node.js server (Local save + Git commit/push API)
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
