import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface DriverProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  photo?: string;
  vehicle?: string;
  plate?: string;
  city?: string;
  isActive: boolean;
  operadora?: string;
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  session: Session | null;
  driver: DriverProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  refreshDriver: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEV_LOGIN_ENABLED = import.meta.env.VITE_MOVA_DEV_LOGIN === 'true';
const DEV_LOGIN_EMAIL = 'dev@mova.app';
const DEV_LOGIN_PASSWORD_SHA256 = '94aacffe72d20f8db263792fb92df389972e24377452beafed55c79489a3263f';
const DEV_AUTH_STORAGE_KEY = 'mova-dev-auth';

const DEV_USER = {
  id: '00000000-0000-4000-8000-000000000001',
  aud: 'authenticated',
  role: 'authenticated',
  email: DEV_LOGIN_EMAIL,
  app_metadata: { provider: 'dev', providers: ['dev'], mova_dev: true },
  user_metadata: { name: 'MOVA DEV' },
  created_at: '2026-09-30T00:00:00.000Z',
} as User;

const DEV_DRIVER: DriverProfile = {
  id: '00000000-0000-4000-8000-000000000002',
  name: 'MOVA DEV',
  email: DEV_LOGIN_EMAIL,
  vehicle: 'Veículo DEV',
  plate: 'DEV-0001',
  city: 'Bauru - SP',
  isActive: true,
};

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(hash))
    .map(byte => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [driver, setDriver] = useState<DriverProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [devAuthenticated, setDevAuthenticated] = useState(false);

  useEffect(() => {
    const restoreDevSession =
      DEV_LOGIN_ENABLED && localStorage.getItem(DEV_AUTH_STORAGE_KEY) === '1';

    if (restoreDevSession) {
      setDevAuthenticated(true);
      setUser(DEV_USER);
      setSession(null);
      setDriver(DEV_DRIVER);
      setIsLoading(false);
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, nextSession) => {
        setSession(nextSession);
        setUser(nextSession?.user ?? null);

        if (nextSession?.user) {
          setTimeout(() => {
            fetchDriverProfile(nextSession.user.id);
          }, 0);
        } else {
          setDriver(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session: existingSession } }) => {
      setSession(existingSession);
      setUser(existingSession?.user ?? null);

      if (existingSession?.user) {
        fetchDriverProfile(existingSession.user.id);
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchDriverProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('driver_profiles')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (data && !error) {
      setDriver({
        id: data.id,
        name: data.name,
        email: data.email,
        phone: data.phone || undefined,
        photo: data.photo || undefined,
        vehicle: data.vehicle || undefined,
        plate: data.plate || undefined,
        city: data.city || undefined,
        isActive: data.is_active,
        operadora: data.operadora || undefined,
      });
    }
  };

  const login = async (email: string, password: string): Promise<{ error: string | null }> => {
    const normalizedEmail = email.trim().toLowerCase();

    if (DEV_LOGIN_ENABLED && normalizedEmail === DEV_LOGIN_EMAIL) {
      const passwordHash = await sha256(password);

      if (passwordHash !== DEV_LOGIN_PASSWORD_SHA256) {
        return { error: 'E-mail ou senha incorretos' };
      }

      localStorage.setItem(DEV_AUTH_STORAGE_KEY, '1');
      setDevAuthenticated(true);
      setSession(null);
      setUser(DEV_USER);
      setDriver(DEV_DRIVER);
      return { error: null };
    }

    const { error } = await supabase.auth.signInWithPassword({
      email: normalizedEmail,
      password,
    });

    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        return { error: 'E-mail ou senha incorretos' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const signUp = async (email: string, password: string, name?: string): Promise<{ error: string | null }> => {
    const redirectUrl = `${window.location.origin}/`;

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name: name || 'Motorista',
        },
      },
    });

    if (error) {
      if (error.message.includes('User already registered')) {
        return { error: 'Este e-mail já está cadastrado' };
      }
      return { error: error.message };
    }

    return { error: null };
  };

  const logout = async () => {
    if (devAuthenticated) {
      localStorage.removeItem(DEV_AUTH_STORAGE_KEY);
      setDevAuthenticated(false);
      setUser(null);
      setSession(null);
      setDriver(null);
      return;
    }

    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setDriver(null);
  };

  const refreshDriver = async () => {
    if (devAuthenticated) {
      setDriver(DEV_DRIVER);
      return;
    }

    if (user) {
      await fetchDriverProfile(user.id);
    }
  };

  const isAuthenticated = devAuthenticated || !!session;

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      session,
      driver,
      isLoading,
      login,
      signUp,
      logout,
      refreshDriver
    }}>
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
