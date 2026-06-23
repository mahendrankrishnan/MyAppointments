export interface LoginRequest {
  email: string;
  phone: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  token: string;
  user: {
    id: number;
    username: string;
    email: string;
    phone: string;
  };
  applications: ApplicationRole[];
}

export interface Role {
  id: number;
  roleName: string;
  createdAt: string;
  updatedAt: string;
}

export interface ApplicationRole {
  id: number;
  appName: string;
  createdAt: string;
  updatedAt: string;
  roles: Role[];
}

export interface UserApplicationsRolesResponse {
  userId: number;
  applications: ApplicationRole[];
}

export const REQUIRED_APP_NAME = 'MyAppt';

