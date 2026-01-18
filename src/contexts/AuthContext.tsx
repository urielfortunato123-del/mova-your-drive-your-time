import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DriverProfile } from '@/types/ride';

interface AuthContextType {
  isAuthenticated: boolean;
  driver: DriverProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const mockDriver: DriverProfile = {
  id: '1',
  name: 'Carlos Silva',
  email: 'carlos@email.com',
  phone: '(11) 99999-9999',
  photo: undefined,
  vehicle: 'Toyota Corolla 2022',
  plate: 'ABC-1234',
  city: 'São Paulo',
  isActive: true,
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [driver, setDriver] = useState<DriverProfile | null>(null);

  const login = async (email: string, password: string): Promise<boolean> => {
    // Mock login - would connect to backend
    if (email && password) {
      setIsAuthenticated(true);
      setDriver(mockDriver);
      return true;
    }
    return false;
  };

  const logout = () => {
    setIsAuthenticated(false);
    setDriver(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, driver, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
