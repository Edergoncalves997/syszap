// Tipos de dados da API

export interface User {
  Id: string;
  Company_Id: string | null;
  Name: string;
  Email: string;
  Role: number; // 0=ADMIN, 1=MANAGER, 2=USER
  Is_Active: boolean;
  Created_At: string;
  Updated_At?: string;
}

export interface Company {
  Id: string;
  Name: string;
  CNPJ: string | null;
  Created_At: string;
  Updated_At: string;
  Deleted_At?: string | null;
}

export interface AuthResponse {
  token: string;
  user: {
    Id: string;
    Name: string;
    Email: string;
    Company_Id: string | null;
    Role: number;
  };
}

export interface LoginCredentials {
  Email: string;
  Password: string;
}

export interface RegisterData {
  Name: string;
  Email: string;
  Password: string;
  Role: number;
  Company_Id?: string | null;
}

export interface CreateUserData {
  Company_Id?: string | null;
  Name: string;
  Email: string;
  Password: string;
  Role: number;
}

export interface UpdateUserData {
  Company_Id?: string | null;
  Name?: string;
  Email?: string;
  Password?: string;
  Role?: number;
  Is_Active?: boolean;
}

export interface CreateCompanyData {
  Name: string;
  CNPJ?: string;
}

export interface UpdateCompanyData {
  Name?: string;
  CNPJ?: string | null;
}

export enum UserRole {
  ADMIN = 0,
  MANAGER = 1,
  USER = 2,
}

export const getRoleName = (role: number): string => {
  switch (role) {
    case UserRole.ADMIN:
      return 'Administrador';
    case UserRole.MANAGER:
      return 'Gerente';
    case UserRole.USER:
      return 'Usuário';
    default:
      return 'Desconhecido';
  }
};

// Client Types
export interface Client {
  Id: string;
  Company_Id: string;
  Name: string;
  WhatsApp_Number: string;
  WA_User_Id?: string | null;
  Chat_Id_Alias?: string | null;
  Profile_Pic_URL?: string | null;
  Is_Blocked: boolean;
  Last_Contact_At?: string | null;
  Language?: string | null;
  Created_At: string;
  Updated_At: string;
  Deleted_At?: string | null;
}

export interface CreateClientData {
  Company_Id: string;
  Name: string;
  WhatsApp_Number: string;
  WA_User_Id?: string;
  Chat_Id_Alias?: string;
  Profile_Pic_URL?: string;
  Language?: string;
}

export interface UpdateClientData {
  Name?: string;
  Profile_Pic_URL?: string | null;
  Is_Blocked?: boolean;
  Language?: string | null;
}

// WhatsApp Types
export interface Session {
  Id: string;
  Company_Id: string;
  Session_Name: string;
  Phone_Number: string;
  Status: number; // 0=DISCONNECTED, 1=CONNECTED, 2=QR_GENERATED, 3=CONNECTING
  Session_Token: string;
  Last_Heartbeat: string;
  Webhook_URL?: string | null;
  QR_SVG?: string | null;
  QR_Expires_At?: string | null;
  Reauth_Required: boolean;
  Created_At: string;
  Updated_At: string;
  Deleted_At?: string | null;
}

export interface WhatsAppMessage {
  Id: string;
  Chat_Id: string;
  Direction: number; // 0=IN, 1=OUT
  Type: number; // 0=TEXT, 1=IMAGE, etc
  Body?: string | null;
  Status: number; // ACK status
  WA_Timestamp?: string | null;
  Created_At: string;
}

export interface WhatsAppChat {
  Id: string;
  WA_Chat_Id: string;
  Client_Id?: string | null;
  Type: number; // 0=INDIVIDUAL, 1=GROUP
  Last_Message_At?: string | null;
  Unread_Count: number;
  Created_At: string;
}

export interface SendMessageData {
  sessionId: string;
  to: string;
  message: string;
}

export const getSessionStatusName = (status: number): string => {
  switch (status) {
    case 0: return 'Desconectado';
    case 1: return 'Conectado';
    case 2: return 'QR Code Gerado';
    case 3: return 'Conectando';
    default: return 'Desconhecido';
  }
};

export const getSessionStatusColor = (status: number): string => {
  switch (status) {
    case 0: return 'bg-red-100 text-red-700';
    case 1: return 'bg-green-100 text-green-700';
    case 2: return 'bg-yellow-100 text-yellow-700';
    case 3: return 'bg-blue-100 text-blue-700';
    default: return 'bg-gray-100 text-gray-700';
  }
};

