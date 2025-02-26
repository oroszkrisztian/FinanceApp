export interface User {
    id: number;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    createdAt: Date;
  }
  
  export interface LoginCredentials {
    username: string;
    password: string;
  }
  
 
  
  export interface RegisterData {
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    password: string;
    
  }
  
  export interface AuthResponse {
    user: Omit<User, "password">;
    token: string;
  }
  
  export interface RegisterResponse extends AuthResponse {
    message: string;
  }