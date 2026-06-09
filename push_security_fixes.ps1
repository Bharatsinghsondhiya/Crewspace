Set-Location "e:\Access-Control-Hub"
git add -A
git status
git commit -m "security: fix critical vulnerabilities and backend hardening

- Remove hardcoded SECRET_KEY fallback; enforce strong key via validator
- Remove hardcoded DB credentials from config defaults
- Hash password reset tokens before DB storage (SHA-256)
- Add password strength validation (uppercase + digit/special) to reset and signup
- Fix CORS: restrict allow_methods and allow_headers from wildcard
- Fix NotificationTypeEnum missing project_invite causing runtime 500 errors
- Remove token field from WorkspaceInvitationResponse (sensitive data leakage)
- Add max_length constraints to SignupBody to prevent resource exhaustion
- Fix remove_project_member to protect creator, not just any admin role
- Frontend Signup: enforce password strength rules via Zod schema"
git push
