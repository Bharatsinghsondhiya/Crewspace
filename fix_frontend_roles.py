import os
import glob

APP_DIR = r"e:\Access-Control-Hub\artifacts\workspace-app\src"

def fix_user_role():
    files = glob.glob(os.path.join(APP_DIR, "**", "*.tsx"), recursive=True)
    for filepath in files:
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()

        new_content = content.replace('user?.role === "admin"', 'user?.isSuperAdmin')
        new_content = new_content.replace('user?.role === "super_admin"', 'user?.isSuperAdmin')
        new_content = new_content.replace('user?.role !== "super_admin"', '!user?.isSuperAdmin')
        
        if new_content != content:
            with open(filepath, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Fixed user.role in {filepath}")

if __name__ == "__main__":
    fix_user_role()
