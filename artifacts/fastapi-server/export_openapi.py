import sys
import os
import json

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.main import app

openapi_schema = app.openapi()

with open(r"e:\Access-Control-Hub\lib\api-spec\openapi.json", "w") as f:
    json.dump(openapi_schema, f, indent=2)
    
print("Successfully exported OpenAPI schema to lib/api-spec/openapi.json")
