"""
One-time migration script to fix the database schema to match the new models.
Run this ONCE from the fastapi-server directory:
    python fix_db_schema.py
"""
import asyncio
import sqlalchemy as sa
from app.db.database import engine


async def fix_schema():
    async with engine.begin() as conn:
        
        # 1. Drop the legacy `role` ENUM column from `users` table
        # This column was replaced by `is_super_admin` (Boolean)
        print("Checking users table for legacy 'role' column...")
        try:
            await conn.execute(sa.text("ALTER TABLE users DROP COLUMN role;"))
            print("  ✓ Dropped legacy 'role' column from users")
        except Exception as e:
            if "Can't DROP" in str(e) or "check that column/key exists" in str(e).lower() or "1091" in str(e):
                print("  ✓ 'role' column already removed (skipped)")
            else:
                print(f"  ⚠ Error dropping role column: {e}")

        # 2. Ensure `is_super_admin` column exists on users
        print("Ensuring 'is_super_admin' column exists on users...")
        try:
            await conn.execute(sa.text(
                "ALTER TABLE users ADD COLUMN is_super_admin BOOLEAN NOT NULL DEFAULT FALSE;"
            ))
            print("  ✓ Added 'is_super_admin' column to users")
        except Exception as e:
            if "Duplicate column" in str(e) or "1060" in str(e):
                print("  ✓ 'is_super_admin' already exists (skipped)")
            else:
                print(f"  ⚠ Error adding is_super_admin: {e}")

        # 3. Ensure `workspace_id` column exists on projects table
        print("Ensuring 'workspace_id' column exists on projects...")
        try:
            await conn.execute(sa.text(
                "ALTER TABLE projects ADD COLUMN workspace_id INT NOT NULL DEFAULT 1;"
            ))
            print("  ✓ Added 'workspace_id' to projects")
        except Exception as e:
            if "Duplicate column" in str(e) or "1060" in str(e):
                print("  ✓ 'workspace_id' already exists on projects (skipped)")
            else:
                print(f"  ⚠ Error: {e}")

        # 4. Ensure `created_by_id` exists on projects
        print("Ensuring 'created_by_id' column exists on projects...")
        try:
            await conn.execute(sa.text(
                "ALTER TABLE projects ADD COLUMN created_by_id INT NOT NULL DEFAULT 1;"
            ))
            print("  ✓ Added 'created_by_id' to projects")
        except Exception as e:
            if "Duplicate column" in str(e) or "1060" in str(e):
                print("  ✓ 'created_by_id' already exists on projects (skipped)")
            else:
                print(f"  ⚠ Error: {e}")

        # 5. Ensure `project_id` exists on tasks (not workspace_id)
        print("Checking tasks table for 'project_id'...")
        try:
            await conn.execute(sa.text(
                "ALTER TABLE tasks ADD COLUMN project_id INT NOT NULL DEFAULT 1;"
            ))
            print("  ✓ Added 'project_id' to tasks")
        except Exception as e:
            if "Duplicate column" in str(e) or "1060" in str(e):
                print("  ✓ 'project_id' already exists on tasks (skipped)")
            else:
                print(f"  ⚠ Error: {e}")

        # 6. Rename WorkspaceMember role 'manager' -> 'admin' if needed
        print("Fixing workspace_members role enum if needed...")
        try:
            await conn.execute(sa.text(
                "UPDATE workspace_members SET role = 'admin' WHERE role = 'manager';"
            ))
            print("  ✓ Updated 'manager' roles to 'admin' in workspace_members")
        except Exception as e:
            print(f"  ⚠ Could not update workspace_members roles: {e}")

        print("\n✅ Schema fix complete! Restart your uvicorn server now.")


if __name__ == "__main__":
    asyncio.run(fix_schema())
