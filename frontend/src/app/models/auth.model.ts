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
  applications: any[];
}

