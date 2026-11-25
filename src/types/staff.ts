export const STAFF_ROLES = ["super_admin", "admin", "editor", "staff"] as const;
export type StaffRole = (typeof STAFF_ROLES)[number];

export type StaffActor = {
  id: string;
  name: string;
  email: string;
  role: StaffRole;
  sessionId: string;
};

export type UserStatus = "active" | "suspended";

export type PublicUser = {
  id: string;
  email: string;
  name: string;
  phone: string;
  address: string;
  avatarUrl: string;
  role: StaffRole;
  status: UserStatus;
  createdAt: string;
  updatedAt: string;
};
