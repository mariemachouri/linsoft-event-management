import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react';
import type { AuthState, LoginRequest, RegisterRequest, UserProfile } from '../types';
import { authService } from '../services/auth.service';

// ─── State & Actions ────────────────────────────────────────────────────────

type AuthAction =
  | { type: 'LOGIN_SUCCESS'; payload: { token: string; refreshToken: string; user: UserProfile } }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'UPDATE_USER'; payload: UserProfile };

const initialState: AuthState = {
  user: null,
  token: localStorage.getItem('access_token'),
  isAuthenticated: !!localStorage.getItem('access_token'),
  isLoading: true,
};

function authReducer(state: AuthState, action: AuthAction): AuthState {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
      };
    case 'LOGOUT':
      return { ...initialState, token: null, isAuthenticated: false, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'UPDATE_USER':
      return { ...state, user: action.payload };
    default:
      return state;
  }
}

// ─── Context ────────────────────────────────────────────────────────────────

interface AuthContextValue extends AuthState {
  login: (credentials: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  updateUser: (user: UserProfile) => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

// ─── Provider ───────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Restore session from localStorage on mount
  useEffect(() => {
    const restore = async () => {
      const token = localStorage.getItem('access_token');
      if (!token) {
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }
      try {
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user: UserProfile = JSON.parse(storedUser);
          dispatch({ type: 'LOGIN_SUCCESS', payload: { token, refreshToken: '', user } });
        } else {
          const user = await authService.getCurrentUser();
          if (user) {
            localStorage.setItem('user', JSON.stringify(user));
            dispatch({ type: 'LOGIN_SUCCESS', payload: { token, refreshToken: '', user } });
          } else {
            dispatch({ type: 'LOGOUT' });
          }
        }
      } catch {
        dispatch({ type: 'LOGOUT' });
      }
    };
    restore();
  }, []);

  // Listen for forced logout from API interceptor
  useEffect(() => {
    const handleLogout = () => dispatch({ type: 'LOGOUT' });
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = useCallback(async (credentials: LoginRequest) => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const response = await authService.login(credentials);
    localStorage.setItem('access_token', response.access_token);
    localStorage.setItem('refresh_token', response.refresh_token);
    // getCurrentUser now reads JWT claims as fallback — always returns a profile
    const user = await authService.getCurrentUser();
    const profile: UserProfile = user ?? {
      id: '',
      username: credentials.username,
      email: '',
      firstName: '',
      lastName: '',
    };
    localStorage.setItem('user', JSON.stringify(profile));
    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { token: response.access_token, refreshToken: response.refresh_token, user: profile },
    });
  }, []);

  const register = useCallback(async (data: RegisterRequest) => {
    await authService.register(data);
    // Auto-login after register
    await login({ username: data.username, password: data.password });
  }, [login]);

  const logout = useCallback(() => {
    authService.logout();
    dispatch({ type: 'LOGOUT' });
  }, []);

  const updateUser = useCallback((user: UserProfile) => {
    localStorage.setItem('user', JSON.stringify(user));
    dispatch({ type: 'UPDATE_USER', payload: user });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
