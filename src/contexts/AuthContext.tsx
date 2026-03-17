import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import type { User, AuthState } from '@/types';
import { authApi } from '@/services/api';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  useEffect(() => {
    // Check for stored token and validate
    const token = localStorage.getItem('token');
    if (token) {
      authApi.getCurrentUser()
        .then((user) => {
          setState({
            user,
            isAuthenticated: true,
            isLoading: false,
          });
        })
        .catch(() => {
          localStorage.removeItem('token');
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        });
    } else {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const response = await authApi.login(email, password);
    localStorage.setItem('token', response.access_token);
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const register = async (data: RegisterData) => {
    const response = await authApi.register(data);
    localStorage.setItem('token', response.access_token);
    setState({
      user: response.user,
      isAuthenticated: true,
      isLoading: false,
    });
  };

  const logout = () => {
    authApi.logout().catch(() => {});
    localStorage.removeItem('token');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const updateUser = (user: User) => {
    setState((prev) => ({ ...prev, user }));
  };

  return (
    <AuthContext.Provider
      value={{ ...state, login, register, logout, updateUser }}
    >
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
