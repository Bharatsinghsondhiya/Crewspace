import os
import re

APP_DIR = r"e:\Access-Control-Hub\artifacts\workspace-app\src"

def fix_app_tsx():
    filepath = os.path.join(APP_DIR, "App.tsx")
    with open(filepath, "r") as f:
        content = f.read()

    # Change /workspaces/:id/tasks to point to a new WorkspaceProjects (or we reuse WorkspaceTasks and rename inside)
    content = content.replace(
        '<Route path="/workspaces/:id/tasks">\n        <ProtectedRoute><AppLayout><WorkspaceTasks /></AppLayout></ProtectedRoute>\n      </Route>',
        '<Route path="/workspaces/:id/projects">\n        <ProtectedRoute><AppLayout><WorkspaceTasks /></AppLayout></ProtectedRoute>\n      </Route>'
    )
    # Update ProjectDetail route from admin
    content = content.replace(
        '<Route path="/admin/projects/:id">',
        '<Route path="/projects/:id">'
    )

    with open(filepath, "w") as f:
        f.write(content)
    print("Fixed App.tsx")

def fix_project_detail():
    filepath = os.path.join(APP_DIR, "pages", "ProjectDetail.tsx")
    with open(filepath, "r") as f:
        content = f.read()

    # We need to change the Workspace fetching to Task fetching
    content = content.replace('useListWorkspaces, useCreateWorkspace', 'useListWorkspaceTasks as useListProjectTasks, useCreateTask')
    content = content.replace('getListWorkspacesQueryKey', 'getListWorkspaceTasksQueryKey as getListProjectTasksQueryKey')
    
    # Change route to match new App.tsx
    content = content.replace('useRoute("/admin/projects/:id")', 'useRoute("/projects/:id")')

    content = content.replace('useListWorkspaces({})', 'useListProjectTasks(projectId, {})')
    content = content.replace('const projectWorkspaces = allWorkspaces?.filter((w: any) => w.projectId === projectId) || [];', 'const projectTasks = allWorkspaces || [];')
    content = content.replace('useCreateWorkspace()', 'useCreateTask()')
    
    # Replace Workshops with Tasks in UI strings
    content = content.replace('Workshops', 'Tasks')
    content = content.replace('Workshop', 'Task')
    content = content.replace('projectWorkspaces', 'projectTasks')
    content = content.replace('createWsMutation', 'createTaskMutation')
    content = content.replace('wsForm', 'taskForm')
    
    # Schema replacements for Task
    content = content.replace('name: z.string().min(1, "Task name is required"),', 'title: z.string().min(1, "Task title is required"),')
    
    with open(filepath, "w") as f:
        f.write(content)
    print("Fixed ProjectDetail.tsx")

def fix_workspace_tasks():
    # This file was showing tasks for a workspace, we change it to show projects for a workspace
    filepath = os.path.join(APP_DIR, "pages", "WorkspaceTasks.tsx")
    with open(filepath, "r") as f:
        content = f.read()

    # We will rename the UI strings from Task to Project
    content = content.replace('useListWorkspaceTasks', 'useGetWorkspaceProjects')
    content = content.replace('useCreateTask', 'useCreateProject')
    content = content.replace('useUpdateTask', 'useUpdateProject')
    content = content.replace('getListWorkspaceTasksQueryKey', 'getGetWorkspaceProjectsQueryKey')

    content = content.replace('WorkspaceTasks', 'WorkspaceProjects')
    content = content.replace('tasks', 'projects')
    content = content.replace('task', 'project')
    content = content.replace('Tasks', 'Projects')
    content = content.replace('Task', 'Project')
    
    with open(filepath, "w") as f:
        f.write(content)
    print("Fixed WorkspaceTasks.tsx (Now showing projects)")

if __name__ == "__main__":
    fix_app_tsx()
    fix_project_detail()
    fix_workspace_tasks()
    print("Frontend hierarchy refactor script generated successfully!")
