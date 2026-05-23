import sys
sys.path.append("e:/Access-Control-Hub/artifacts/fastapi-server")

try:
    from app.main import app
    print("SUCCESS")
except Exception as e:
    import traceback
    traceback.print_exc()
