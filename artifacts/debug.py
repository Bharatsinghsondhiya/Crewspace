import urllib.request
import urllib.error
import json

def fetch_url(url, method="GET", data=None):
    req = urllib.request.Request(url, method=method)
    if data:
        req.add_header('Content-Type', 'application/json')
        req.data = json.dumps(data).encode('utf-8')
    try:
        with urllib.request.urlopen(req) as response:
            print(f"--- {method} {url} ---")
            print("Status:", response.status)
            print("Response:", response.read().decode('utf-8'))
    except urllib.error.HTTPError as e:
        print(f"--- {method} {url} ---")
        print("Status:", e.code)
        print("Error:", e.read().decode('utf-8'))
    except Exception as e:
        print(f"--- {method} {url} ---")
        print("Exception:", str(e))

fetch_url("http://localhost:8000/api/workspaces/1/members")
fetch_url("http://localhost:8000/api/workspaces/1/tasks/1")
fetch_url("http://localhost:8000/api/workspaces/1/tasks/1", method="PATCH", data={"title": "new title test"})
