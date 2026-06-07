import json
import sys
import os

# Add the fastapi-server directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "artifacts", "fastapi-server")))

from app.main import app
from fastapi.openapi.utils import get_openapi

def export_openapi():
    openapi_schema = get_openapi(
        title=app.title,
        version=app.version,
        openapi_version=app.openapi_version,
        description=app.description,
        routes=app.routes,
    )
    
    output_path = os.path.join(os.path.dirname(__file__), "lib", "api-spec", "openapi.json")
    
    with open(output_path, "w") as f:
        json.dump(openapi_schema, f, indent=2)
        
    print(f"Successfully generated OpenAPI spec at {output_path}")

if __name__ == "__main__":
    export_openapi()
