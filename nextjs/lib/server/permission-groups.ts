export const PERMISSION_GROUPS = {
  read_only: ["bundle:read", "analytics:read"],
  build_trigger_only: ["bundle:read", "analytics:read", "build:trigger"],
  release_manager: ["bundle:read", "analytics:read", "build:trigger", "listing:edit"],
  admin: [
    "bundle:read",
    "analytics:read",
    "build:trigger",
    "listing:edit",
    "collaborators:manage",
    "billing:manage",
  ],
};
