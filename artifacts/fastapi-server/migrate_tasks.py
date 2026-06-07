import os

workspaces_path = r"e:\Access-Control-Hub\artifacts\fastapi-server\app\api\routes\workspaces_extra.py"
projects_path = r"e:\Access-Control-Hub\artifacts\fastapi-server\app\api\routes\projects.py"

with open(workspaces_path, "r") as f:
    ws_lines = f.readlines()

start_idx = -1
end_idx = -1
for i, line in enumerate(ws_lines):
    if '@router.get("/{workspace_id}/tasks", response_model=List[TaskResponseItem])' in line:
        start_idx = i
        break

if start_idx != -1:
    for i in range(start_idx, len(ws_lines)):
        if '@router.patch("/{workspace_id}/members/{user_id}"' in ws_lines[i]:
            end_idx = i
            break

if start_idx != -1 and end_idx != -1:
    tasks_block = ws_lines[start_idx:end_idx]
    ws_lines = ws_lines[:start_idx] + ws_lines[end_idx:]
    with open(workspaces_path, "w") as f:
        f.writelines(ws_lines)
    print("Removed tasks block from workspaces_extra.py")

    tasks_str = "".join(tasks_block)
    tasks_str = tasks_str.replace("{workspace_id}/tasks", "{project_id}/tasks")
    tasks_str = tasks_str.replace("workspace_id: int", "project_id: int")
    tasks_str = tasks_str.replace("workspace_id=workspace_id", "project_id=project_id")
    tasks_str = tasks_str.replace("Task.workspace_id", "Task.project_id")
    tasks_str = tasks_str.replace("task.workspace_id", "task.project_id")
    tasks_str = tasks_str.replace("this workspace", "this project")
    # Clean up dependencies
    tasks_str = tasks_str.replace("_: WorkspaceMember = AnyMember", "current_user: User = Depends(get_current_user)")
    tasks_str = tasks_str.replace("_: WorkspaceMember = ManagerOrOwner", "current_user: User = Depends(get_current_user)")
    tasks_str = tasks_str.replace("_: WorkspaceMember = OwnerOnly", "current_user: User = Depends(get_current_user)")
    
    # We replace member with current_user inside update_task
    tasks_str = tasks_str.replace("member: WorkspaceMember = AnyMember", "current_user: User = Depends(get_current_user)")
    tasks_str = tasks_str.replace("member.role.value in [\"owner\", \"manager\"]", "current_user.role == UserRole.super_admin")
    tasks_str = tasks_str.replace("member.user_id", "current_user.id")
    
    with open(projects_path, "a") as f:
        f.write("\nfrom sqlalchemy.orm import selectinload\n")
        f.write(tasks_str)
    print("Added tasks block to projects.py")

with open(projects_path, "r") as f:
    content = f.read()

content = content.replace(
    "from app.models import User, Project, ProjectMember, ProjectMemberRole, UserRole, ProjectInvitation, Notification, NotificationType",
    "from app.models import User, Project, ProjectMember, ProjectMemberRole, UserRole, ProjectInvitation, Notification, NotificationType, Task, TaskStatus, TaskPriority, ActivityLog"
)
content = content.replace(
    "    MessageResponse\n)",
    "    MessageResponse,\n    TaskResponseItem, CreateTaskBody, UpdateTaskBody\n)"
)

with open(projects_path, "w") as f:
    f.write(content)
print("Updated imports in projects.py")
