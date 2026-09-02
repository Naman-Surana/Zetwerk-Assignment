import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { jwtDecode } from 'jwt-decode';

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'ADMIN';
  mfaEnabled?: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const checkToken = () => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      try {
        const decoded = jwtDecode(storedToken);
        if (decoded.exp && decoded.exp * 1000 < Date.now()) {
          logout();
        } else {
          setToken(storedToken);
          // Only update user if stringified version is different to avoid infinite loops
          setUser((prev) => {
             if (prev && JSON.stringify(prev) === storedUser) return prev;
             return JSON.parse(storedUser);
          });
        }
      } catch (err) {
        logout();
      }
    } else {
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    checkToken();
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token' || e.key === 'user') {
        const storedUser = localStorage.getItem('user');
        
        if (storedUser && user) {
          try {
            const newUser = JSON.parse(storedUser);
            if (newUser.id !== user.id) {
              window.location.reload();
              return;
            }
          } catch (err) {
            // ignore
          }
        }
        
        checkToken();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [user]);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};
