#!/usr/bin/env python3
"""
Endless Space 2 Localization Wiki - Content Editor & Development Server
Saves to local disk only. Provides optional Git commit and push endpoints from editor.
Required Password: 17ExTra
"""

import os
import sys
import json
import re
import urllib.parse
import subprocess
from datetime import datetime
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
import webbrowser

ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
JS_DIR = os.path.join(ROOT_DIR, "js")
PORT = 8000
PASSWORD = "17ExTra"

# --- Localization & Taxonomy Rules ---
FIELD_SUFFIXES = sorted([
    "ShortTitle", "SimTitle", "TooltipEffectBis", "TooltipEffect", "TooltipDescription",
    "TooltipOverride", "EffectOverride", "IntroTitle", "IntroDescription",
    "ObjectiveTooltip", "ObjectiveTitle", "ObjectiveDescription", "OutcomeFailed",
    "Title", "Description", "Tooltip", "Effect", "Override", "Format", "Name", "Label",
    "Dialogue", "Outcome", "Objective", "Reward", "Completed", "Failed", "Confirmation",
    "Text", "Suffix",
], key=len, reverse=True)
SUFFIX_RE = re.compile(r"^(?P<id>.+?)(?P<sep>[-_]?)(?P<field>" + "|".join(FIELD_SUFFIXES) + r")$")

FILE_TITLES = {
    "ES2_Localization_2023Patch_Locales.js": "2023 Patch wiki + feature map",
    "ES2_Localization_2025Patch_Locales.js": "2025 Patch wiki",
    "ES2_Localization_Assets_Locales.js": "Assets wiki",
    "ES2_Localization_Demo_Locales.js": "Demo wiki",
    "ES2_Localization_DLC2_Locales.js": "Supremacy (DLC 2) wiki",
    "ES2_Localization_DLC3_Locales.js": "Penumbra (DLC 3) wiki",
    "ES2_Localization_DLC4_Locales.js": "Awakening (DLC 4) wiki",
    "ES2_Localization_DLC5_Locales.js": "Dark Matter (DLC 5) wiki",
    "ES2_Localization_Locales.js": "Base Game wiki",
    "ES2_Localization_Quest_Locales.js": "Quests wiki",
    "ES2_Localization_Update11_Locales.js": "Stories (Update 11) wiki",
    "ES2_Localization_Update12_Locales.js": "Celestial Worlds (Update 12) wiki",
    "ES2_Localization_Update13_Locales.js": "Harmonic Memories (Update 13) wiki",
    "ES2_Localization_Update14_Locales.js": "Update 14 wiki",
    "ES2_Localization_Updates_Locales.js": "Community Updates wiki",
    "ES2_Localization_Vaulters_Locales.js": "Vaulters wiki",
}

def split_key(key):
    if "-" in key:
        ent, _, fld = key.rpartition("-")
        return ent, fld
    m = SUFFIX_RE.match(key)
    if m:
        return m.group("id"), m.group("field")
    return key, "Text"

def humanise(s):
    s = re.sub(r"[_\-]+", " ", s)
    return re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", s).strip()

def parse_js_file(filename):
    if not filename.endswith(".js"):
        filename = filename.replace(".html", "") + ".js"
    path = os.path.join(JS_DIR, filename)
    if not os.path.exists(path):
        raise FileNotFoundError(f"File not found: {filename}")

    with open(path, "r", encoding="utf-8") as f:
        content = f.read()

    m_d_arr = re.search(r"const\s+D\s*=\s*(\[[\s\S]*?\]);\s*\n", content)
    m_d_obj = re.search(r"const\s+D\s*=\s*(\{[\s\S]*?\})\s*,\s*P\s*=", content)

    if m_d_arr:
        d_raw = json.loads(m_d_arr.group(1))
        m_c = re.search(r"const\s+C\s*=\s*(\[[\s\S]*?\]);\s*\n", content)
        categories = json.loads(m_c.group(1)) if m_c else []
        strings = []
        for i, item in enumerate(d_raw):
            key = item[0]
            val = item[1]
            cat_idx = item[2] if len(item) > 2 else 0
            cat_name = categories[cat_idx][0] if cat_idx < len(categories) else "General"
            strings.append({
                "id": i,
                "key": key,
                "value": val,
                "category": cat_name,
                "catIndex": cat_idx
            })
        return {
            "filename": filename,
            "type": "array",
            "strings": strings,
            "categories": [{"name": c[0], "count": c[1], "index": i} for i, c in enumerate(categories)]
        }
    elif m_d_obj:
        d_raw = json.loads(m_d_obj.group(1))
        strings = []
        for i, (k, v) in enumerate(d_raw.items()):
            strings.append({
                "id": i,
                "key": k,
                "value": v,
                "category": "General",
                "catIndex": 0
            })
        return {
            "filename": filename,
            "type": "dict",
            "strings": strings,
            "categories": [{"name": "General", "count": len(strings), "index": 0}]
        }
    else:
        raise ValueError(f"Could not parse D in {filename}")

def rebuild_js_content(original_content, updated_strings):
    m_d_arr = re.search(r"const\s+D\s*=\s*(\[[\s\S]*?\]);\s*\n", original_content)
    m_d_obj = re.search(r"const\s+D\s*=\s*(\{[\s\S]*?\})\s*,\s*P\s*=", original_content)

    if m_d_arr:
        m_c = re.search(r"const\s+C\s*=\s*(\[[\s\S]*?\]);\s*\n", original_content)
        orig_c = json.loads(m_c.group(1)) if m_c else []
        cat_names = [c[0] for c in orig_c]

        for s in updated_strings:
            cname = s.get("category", "General")
            if cname not in cat_names:
                cat_names.append(cname)

        cat_map = {name: i for i, name in enumerate(cat_names)}
        cat_counts = [0] * len(cat_names)

        new_d = []
        for i, s in enumerate(updated_strings):
            cname = s.get("category", "General")
            cidx = cat_map[cname]
            cat_counts[cidx] += 1
            new_d.append([s["key"], s["value"], cidx])

        new_c = [[name, cat_counts[i]] for i, name in enumerate(cat_names)]

        groups = {}
        for d_idx, item in enumerate(new_d):
            key = item[0]
            cidx = item[2]
            base, field = split_key(key)
            if base not in groups:
                groups[base] = {
                    "cidx": cidx,
                    "group_name": humanise(base[:15]),
                    "base_key": base,
                    "fields": []
                }
            groups[base]["fields"].append([field, d_idx])

        new_e = []
        for base, g in groups.items():
            new_e.append([g["cidx"], g["group_name"], g["base_key"], g["fields"]])

        m_b = re.search(r"const\s+B\s*=\s*(\[[\s\S]*?\]);\s*\n", original_content)
        b_str = m_b.group(0) if m_b else "const B=[];\n"

        rest_idx = original_content.find("const $=")
        if rest_idx == -1:
            rest_idx = original_content.find("const W=")
        if rest_idx == -1:
            if m_b:
                rest_idx = m_b.end()
            elif m_c:
                rest_idx = m_c.end()

        rest_code = original_content[rest_idx:]

        d_json = json.dumps(new_d, ensure_ascii=False)
        e_json = json.dumps(new_e, ensure_ascii=False)
        c_json = json.dumps(new_c, ensure_ascii=False)

        new_content = f"const D={d_json};\nconst E={e_json};\nconst C={c_json};\n{b_str}\n{rest_code}"
        return new_content

    elif m_d_obj:
        new_dict = {s["key"]: s["value"] for s in updated_strings}
        new_dict_json = json.dumps(new_dict, ensure_ascii=False)
        rep = f"const D={new_dict_json},P="
        new_content = re.sub(
            r"const\s+D\s*=\s*\{[\s\S]*?\}\s*,\s*P\s*=",
            lambda _: rep,
            original_content,
            count=1
        )
        return new_content
    else:
        raise ValueError("Unknown JS format")

def get_git_info():
    try:
        branch = subprocess.check_output(
            ["git", "rev-parse", "--abbrev-ref", "HEAD"], cwd=ROOT_DIR, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
    except Exception:
        branch = "unknown"

    uncommitted = []
    try:
        status_out = subprocess.check_output(
            ["git", "status", "--porcelain"], cwd=ROOT_DIR, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        if status_out:
            for line in status_out.split("\n"):
                if line.strip():
                    uncommitted.append(line.strip())
        is_clean = len(uncommitted) == 0
    except Exception:
        is_clean = False

    ahead = 0
    behind = 0
    try:
        sb = subprocess.check_output(
            ["git", "status", "-sb"], cwd=ROOT_DIR, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        m_ahead = re.search(r"\[ahead\s+(\d+)\]", sb)
        if m_ahead:
            ahead = int(m_ahead.group(1))
        m_behind = re.search(r"behind\s+(\d+)", sb)
        if m_behind:
            behind = int(m_behind.group(1))
    except Exception:
        pass

    recent = []
    try:
        log_out = subprocess.check_output(
            ["git", "log", "-n", "8", "--pretty=format:%h|%s|%cr|%an"], cwd=ROOT_DIR, stderr=subprocess.DEVNULL
        ).decode("utf-8").strip()
        for line in log_out.split("\n"):
            if line:
                parts = line.split("|")
                if len(parts) >= 4:
                    recent.append({
                        "hash": parts[0],
                        "message": parts[1],
                        "relativeTime": parts[2],
                        "author": parts[3]
                    })
    except Exception:
        pass

    latest = recent[0] if recent else None
    return {
        "branch": branch,
        "clean": is_clean,
        "uncommitted": uncommitted,
        "uncommittedCount": len(uncommitted),
        "ahead": ahead,
        "behind": behind,
        "latest": latest,
        "recent": recent
    }

class WikiEditorHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT_DIR, **kwargs)

    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, X-Editor-Password")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        query = urllib.parse.parse_qs(parsed.query)

        if path == "/api/files":
            files_list = []
            js_files = sorted([f for f in os.listdir(JS_DIR) if f.startswith("ES2_Localization_") and f.endswith(".js")])
            for jf in js_files:
                html_name = jf.replace(".js", ".html")
                title = FILE_TITLES.get(jf, jf.replace("ES2_Localization_", "").replace("_Locales.js", ""))
                try:
                    data = parse_js_file(jf)
                    string_count = len(data["strings"])
                    topic_count = len(data["categories"])
                except Exception:
                    string_count = 0
                    topic_count = 0
                files_list.append({
                    "id": jf.replace("ES2_Localization_", "").replace("_Locales.js", ""),
                    "filename": jf,
                    "html": html_name,
                    "title": title,
                    "stringCount": string_count,
                    "topicCount": topic_count,
                    "sizeKB": round(os.path.getsize(os.path.join(JS_DIR, jf)) / 1024)
                })
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(files_list, ensure_ascii=False).encode("utf-8"))
            return

        elif path == "/api/file":
            filename = query.get("name", [""])[0]
            if not filename:
                self.send_error(400, "Missing 'name' parameter")
                return
            try:
                data = parse_js_file(filename)
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
            except Exception as e:
                self.send_response(404)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/git-status":
            info = get_git_info()
            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.end_headers()
            self.wfile.write(json.dumps(info).encode("utf-8"))
            return

        # Default static file handler
        return super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length > 0 else "{}"
        try:
            payload = json.loads(body)
        except Exception as e:
            self.send_response(400)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"error": f"Invalid JSON: {str(e)}"}).encode("utf-8"))
            return

        if path == "/api/auth":
            password = payload.get("password", "") or self.headers.get("X-Editor-Password", "")
            if password == PASSWORD:
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": True, "message": "Authentication successful"}).encode("utf-8"))
            else:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": "Incorrect password. Key in 17ExTra to edit."}).encode("utf-8"))
            return

        elif path == "/api/save":
            # Security verification
            password = payload.get("password", "") or self.headers.get("X-Editor-Password", "")
            if password != PASSWORD:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "Unauthorized: Invalid password. To edit and save changes, you must key in 17ExTra."
                }).encode("utf-8"))
                return

            filename = payload.get("filename", "")
            if not filename:
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "Missing filename"}).encode("utf-8"))
                return

            if not filename.endswith(".js"):
                filename = filename.replace(".html", "") + ".js"

            filepath = os.path.join(JS_DIR, filename)
            if not os.path.exists(filepath):
                self.send_response(404)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": f"File {filename} not found"}).encode("utf-8"))
                return

            updated_strings = payload.get("strings", [])
            if not isinstance(updated_strings, list):
                self.send_response(400)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": "strings must be a list"}).encode("utf-8"))
                return

            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    orig_content = f.read()

                new_js = rebuild_js_content(orig_content, updated_strings)
                with open(filepath, "w", encoding="utf-8") as f:
                    f.write(new_js)

                # Local Save Only: writes to local disk! Does not commit or push.
                git_info = get_git_info()

                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "filename": filename,
                    "message": f"Successfully saved {filename} to local disk.",
                    "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    "git": git_info
                }, ensure_ascii=False).encode("utf-8"))

            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/git/commit":
            # Explicit Git Commit from editor
            password = payload.get("password", "") or self.headers.get("X-Editor-Password", "")
            if password != PASSWORD:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "Unauthorized: Invalid password. Key in 17ExTra to commit."
                }).encode("utf-8"))
                return

            commit_msg = payload.get("message", "").strip() or "Update wiki localization content"
            files_to_add = payload.get("files", [])

            try:
                if files_to_add and isinstance(files_to_add, list):
                    for f in files_to_add:
                        subprocess.run(["git", "add", f], cwd=ROOT_DIR, check=True)
                else:
                    subprocess.run(["git", "add", "."], cwd=ROOT_DIR, check=True)

                staged = subprocess.check_output(
                    ["git", "diff", "--name-only", "--cached"], cwd=ROOT_DIR
                ).decode("utf-8").strip()

                if not staged:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": False,
                        "error": "No staged changes to commit.",
                        "git": get_git_info()
                    }).encode("utf-8"))
                    return

                subprocess.run(["git", "commit", "-m", commit_msg], cwd=ROOT_DIR, check=True)
                commit_hash = subprocess.check_output(
                    ["git", "rev-parse", "--short", "HEAD"], cwd=ROOT_DIR
                ).decode("utf-8").strip()

                git_info = get_git_info()
                self.send_response(200)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": True,
                    "commit": commit_hash,
                    "message": f"Committed to Git ({commit_hash})",
                    "git": git_info
                }).encode("utf-8"))

            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
            return

        elif path == "/api/git/push":
            # Explicit Git Push from editor
            password = payload.get("password", "") or self.headers.get("X-Editor-Password", "")
            if password != PASSWORD:
                self.send_response(401)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "Unauthorized: Invalid password. Key in 17ExTra to push."
                }).encode("utf-8"))
                return

            try:
                res = subprocess.run(
                    ["git", "push"],
                    cwd=ROOT_DIR,
                    timeout=20,
                    capture_output=True,
                    text=True
                )
                git_info = get_git_info()

                if res.returncode == 0:
                    self.send_response(200)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        "success": True,
                        "message": "Pushed to remote repository successfully!",
                        "output": res.stdout,
                        "git": git_info
                    }).encode("utf-8"))
                else:
                    self.send_response(400)
                    self.send_header("Content-Type", "application/json; charset=utf-8")
                    self.end_headers()
                    err_msg = res.stderr or res.stdout or "Push failed"
                    self.wfile.write(json.dumps({
                        "success": False,
                        "error": err_msg.strip(),
                        "git": git_info
                    }).encode("utf-8"))

            except subprocess.TimeoutExpired:
                self.send_response(408)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({
                    "success": False,
                    "error": "Git push timed out (remote server took too long or requires interactive credentials).",
                    "git": get_git_info()
                }).encode("utf-8"))
            except Exception as e:
                self.send_response(500)
                self.send_header("Content-Type", "application/json; charset=utf-8")
                self.end_headers()
                self.wfile.write(json.dumps({"success": False, "error": str(e)}).encode("utf-8"))
            return

        self.send_error(404, "Endpoint not found")

def run(port=PORT, open_browser=True):
    server_address = ("127.0.0.1", port)
    httpd = ThreadingHTTPServer(server_address, WikiEditorHandler)
    url = f"http://localhost:{port}/editor.html"
    print("=" * 60)
    print("  Endless Space 2 Localization Wiki - Editor Server")
    print(f"  Running at: http://localhost:{port}")
    print(f"  Editor URL: {url}")
    print(f"  Required Password: {PASSWORD}")
    print("=" * 60)
    if open_browser:
        print("Opening browser...")
        try:
            webbrowser.open(url)
        except Exception:
            pass
    print("Server ready. Press Ctrl+C to stop.")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping server.")
        httpd.server_close()

if __name__ == "__main__":
    p = PORT
    open_b = True
    for arg in sys.argv[1:]:
        if arg.isdigit():
            p = int(arg)
        elif arg == "--no-browser":
            open_b = False
    run(p, open_browser=open_b)
