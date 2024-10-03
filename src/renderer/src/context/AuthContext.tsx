import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import { set } from 'date-fns';

interface AuthContextType {
  isAuthenticated: boolean;
  id: number | null;
  username: string | null;
  isAdmin: boolean;
  ticketPermissions: boolean;
  login: (id: number, username: string, admin: boolean, ticketPermissions:boolean) => Promise<void>;
  logout: () => void;
}

interface CustomJwtPayload {
  id: number;
  username: string;
  admin: boolean;
  ticketPermissions: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

declare global {
  interface Window {
    api: {
      quitApp(): unknown;
      deleteFile(documentPath: string | undefined): unknown;
      openFile(documentPath: string): unknown;
      uploadFile: any;
      getFiles(folderPath: string): unknown;
      openFolderDialog(): unknown;
      offDatabaseUpdated(handleDatabaseUpdate: any): unknown;
      onDatabaseUpdated(handleDatabaseUpdate: () => void): unknown;
      openFileDialog(): unknown;
      savePdf(filePath: string, pdfBuffer: ArrayBuffer): unknown;
      getConfig(): unknown;
      setConfig(config: any): unknown;
      generateToken: (id: number, username: string, admin: boolean, ticketPermissions: boolean) => Promise<string>;
      sendEmail(mailOptions: any): unknown;
    };
  }
}

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [id, setId] = useState<number | null>(null);
  const [username, setUsername] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [ticketPermissions, setTicketPermission] = useState<boolean>(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode<CustomJwtPayload>(token);
        setId(decoded.id);
        setUsername(decoded.username);
        setIsAuthenticated(true);
        setIsAdmin(decoded.admin);
        setTicketPermission(decoded.ticketPermissions);
      } catch (error) {
        console.error('Failed to decode token', error);
        localStorage.removeItem('token');
      }
    }
  }, []);

  const login = async (userId: number, userUsername: string, admin: boolean, ticketPermissions: boolean): Promise<void> => {
    try {
      const token = await window.api.generateToken(userId, userUsername, admin, ticketPermissions);
      localStorage.setItem('token', token);
      setId(userId);
      setUsername(userUsername);
      setIsAuthenticated(true);
      setIsAdmin(admin);
      setTicketPermission(ticketPermissions);
    } catch (error) {
      console.error('Failed to generate token', error);
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    setId(null);
    setUsername(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, id, username, login, logout, isAdmin, ticketPermissions }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};