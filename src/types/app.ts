export type Role = "admin" | "team";

export type AuthenticatedUser = {
  email: string;
  name: string;
  picture?: string;
  hd: string;
  role: Role;
};

export type SessionState = {
  token: string;
  user: AuthenticatedUser;
};

export type ProbeState = {
  status: "idle" | "running" | "success" | "error";
  output?: string;
};

export type ProbeDefinition = {
  id: string;
  title: string;
  endpoint: string;
  description: string;
};
