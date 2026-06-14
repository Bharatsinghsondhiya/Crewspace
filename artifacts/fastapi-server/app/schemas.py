from pydantic import BaseModel, ConfigDict, Field, EmailStr, field_validator
from pydantic.alias_generators import to_camel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class BaseSchema(BaseModel):
    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True,
        from_attributes=True,
        use_enum_values=True
    )

# Common Enums


class WorkspaceRoleEnum(str, Enum):
    owner = 'owner'
    admin = 'admin'
    member = 'member'
    viewer = 'viewer'

class ProjectRoleEnum(str, Enum):
    admin = 'admin'
    member = 'member'

class TaskStatusEnum(str, Enum):
    pending = 'pending'
    in_progress = 'in_progress'
    completed = 'completed'

class TaskPriorityEnum(str, Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'

class NotificationTypeEnum(str, Enum):
    task_assigned = 'task_assigned'
    due_date_reminder = 'due_date_reminder'
    task_completed = 'task_completed'
    workspace_invite = 'workspace_invite'
    project_invite = 'project_invite'
    member_joined = 'member_joined'

# Users & Auth
class UserResponse(BaseSchema):
    id: int
    name: str
    email: EmailStr
    is_super_admin: bool
    avatar_url: Optional[str] = None
    created_at: datetime

class LoginBody(BaseSchema):
    email: EmailStr
    password: str

class LoginResponse(BaseSchema):
    user: UserResponse
    access_token: str
    refresh_token: str

class SignupBody(BaseSchema):
    name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, v):
        import re
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9!@#$%^&*()_+\-=\[\]{};':,./<>?]", v):
            raise ValueError("Password must contain at least one digit or special character")
        return v

class ChangePasswordBody(BaseSchema):
    current_password: str
    new_password: str = Field(min_length=8, max_length=128)

    @field_validator("new_password")
    @classmethod
    def validate_password_strength(cls, v):
        import re
        if not re.search(r"[A-Z]", v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not re.search(r"[0-9!@#$%^&*()_+\-=\[\]{};':,./<>?]", v):
            raise ValueError("Password must contain at least one digit or special character")
        return v

class MessageResponse(BaseSchema):
    message: str

class UpdateProfileBody(BaseSchema):
    name: Optional[str] = Field(None, min_length=2)
    avatar_url: Optional[str] = None

# Workspaces
class WorkspaceResponseItem(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    owner_id: int
    member_count: Optional[int] = None
    task_count: Optional[int] = None
    created_at: datetime

class CreateWorkspaceBody(BaseSchema):
    name: str = Field(min_length=1)
    description: Optional[str] = None

class UpdateWorkspaceBody(BaseSchema):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None

class InviteMemberBody(BaseSchema):
    email: EmailStr
    role: WorkspaceRoleEnum = WorkspaceRoleEnum.member

class AcceptInviteBody(BaseSchema):
    token: str

class WorkspaceInvitationResponse(BaseSchema):
    id: int
    workspace_id: int
    email: str
    role: WorkspaceRoleEnum
    # token intentionally excluded from response to prevent sensitive data leakage
    expires_at: datetime
    accepted: bool
    created_at: datetime

class WorkspaceMemberResponse(BaseSchema):
    user_id: int
    workspace_id: int
    role: WorkspaceRoleEnum
    joined_at: datetime
    user: UserResponse

# Projects
class ProjectResponseItem(BaseSchema):
    id: int
    name: str
    description: Optional[str] = None
    workspace_id: int
    created_by_id: int
    created_at: datetime
    updated_at: Optional[datetime] = None
    workspace_count: Optional[int] = None
    member_count: Optional[int] = None
    my_role: Optional[ProjectRoleEnum] = None

class CreateProjectBody(BaseSchema):
    name: str = Field(min_length=1)
    description: Optional[str] = None
    workspace_id: int

class UpdateProjectBody(BaseSchema):
    name: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None

class ProjectMemberResponse(BaseSchema):
    user_id: int
    project_id: int
    role: ProjectRoleEnum
    joined_at: datetime
    user: UserResponse

class InviteProjectMemberBody(BaseSchema):
    email: EmailStr
    role: ProjectRoleEnum = ProjectRoleEnum.member

class UpdateProjectMemberRoleBody(BaseSchema):
    role: ProjectRoleEnum

# Tasks
class UserCompact(BaseSchema):
    id: int
    name: str
    avatar_url: Optional[str] = None

class TaskResponseItem(BaseSchema):
    id: int
    title: str
    description: Optional[str] = None
    status: TaskStatusEnum
    priority: TaskPriorityEnum
    due_date: Optional[datetime] = None
    project_id: int
    assignee_id: Optional[int] = None
    created_by_id: int
    labels: Optional[List[str]] = None

    @field_validator("labels", mode="before")
    @classmethod
    def parse_labels(cls, v):
        if isinstance(v, str):
            import json
            try:
                return json.loads(v)
            except:
                return []
        return v
    assignee: Optional[UserCompact] = None
    created_by: Optional[UserCompact] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

class CreateTaskBody(BaseSchema):
    title: str = Field(min_length=1)
    description: Optional[str] = None
    status: TaskStatusEnum = TaskStatusEnum.pending
    priority: TaskPriorityEnum = TaskPriorityEnum.medium
    due_date: Optional[datetime] = None
    project_id: int
    assignee_id: Optional[int] = None
    labels: Optional[List[str]] = None

class UpdateTaskBody(BaseSchema):
    title: Optional[str] = Field(None, min_length=1)
    description: Optional[str] = None
    status: Optional[TaskStatusEnum] = None
    priority: Optional[TaskPriorityEnum] = None
    due_date: Optional[datetime] = None
    assignee_id: Optional[int] = None
    labels: Optional[List[str]] = None

# Analytics & Dashboard
class TaskCountByLabel(BaseSchema):
    label: str
    count: int

class TaskCountByUser(BaseSchema):
    user_id: int
    name: str
    avatar_url: Optional[str] = None
    total_tasks: int
    completed_tasks: int

class WorkspaceAnalyticsResponse(BaseSchema):
    total_tasks: int
    completed_tasks: int
    pending_tasks: int
    in_progress_tasks: int
    member_count: int
    completion_rate: float
    tasks_by_priority: List[TaskCountByLabel]
    tasks_by_member: List[TaskCountByUser]

class ActivityLogResponseItem(BaseSchema):
    id: int
    action: str
    entity_type: str
    entity_id: int
    user_id: int
    workspace_id: Optional[int] = None
    description: Optional[str] = None
    user: Optional[UserCompact] = None
    created_at: datetime

class DashboardSummaryResponse(BaseSchema):
    total_workspaces: int
    total_tasks: int
    my_tasks: int
    my_pending_tasks: int
    my_completed_tasks: int
    tasks_by_priority: Optional[dict] = None
    recent_activity: List[ActivityLogResponseItem]

# Notifications
class NotificationResponseItem(BaseSchema):
    id: int
    type: NotificationTypeEnum
    title: str
    message: str
    is_read: bool
    user_id: int
    task_id: Optional[int] = None
    workspace_id: Optional[int] = None
    created_at: datetime

# Admin
class AdminStatsResponse(BaseSchema):
    total_users: int
    total_workspaces: int
    total_tasks: int
    completed_tasks: int
    active_users: int
    users_by_role: Optional[List[TaskCountByLabel]] = None
    tasks_by_status: Optional[List[TaskCountByLabel]] = None
