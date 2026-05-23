import asyncio
import sys
import os
import httpx

async def test_update():
    async with httpx.AsyncClient() as client:
        # Get tasks first to find a valid one
        resp = await client.get("http://localhost:8000/api/workspaces/1/tasks")
        if resp.status_code != 200:
            print(f"Failed to get tasks: {resp.status_code} {resp.text}")
            return
            
        tasks = resp.json()
        if not tasks:
            print("No tasks found in workspace 1 to test.")
            return
            
        task = tasks[0]
        task_id = task["id"]
        
        # Try to patch title and description
        print(f"Patching task {task_id}...")
        patch_resp = await client.patch(
            f"http://localhost:8000/api/workspaces/1/tasks/{task_id}",
            json={"title": "Updated Title via Test", "description": "Updated description"}
        )
        print(f"PATCH title status: {patch_resp.status_code}")
        print(f"PATCH title body: {patch_resp.text}")

        # Try to patch status
        patch_resp2 = await client.patch(
            f"http://localhost:8000/api/workspaces/1/tasks/{task_id}",
            json={"status": "completed"}
        )
        print(f"PATCH status status: {patch_resp2.status_code}")
        print(f"PATCH status body: {patch_resp2.text}")

if __name__ == "__main__":
    asyncio.run(test_update())
