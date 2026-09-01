import { useState, useRef, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Transfer from './pages/Transfer';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminUserDetail from './pages/AdminUserDetail';
import { Landmark, LogOut, Shield } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ProtectedRoute, AdminRoute } from './components/AuthGuard';

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setShowLogoutConfirm(false);
      }
    };
    if (showLogoutConfirm) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showLogoutConfirm]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
    navigate('/login');
  };

  const cancelLogout = () => {
    setShowLogoutConfirm(false);
  };

  return (
    <header className="bg-surface border-b border-slate-200 sticky top-0 z-10 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-primary-dark hover:opacity-80 transition-opacity">
          <div className="p-2 bg-primary/10 rounded-xl">
            <Landmark size={24} className="text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight text-slate-800">Horizon<span className="text-primary">Bank</span></span>
        </Link>
        <nav className="flex items-center gap-6">
          {user ? (
            <>
              {user.role === 'ADMIN' ? (
                <Link to="/admin" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors flex items-center gap-1">
                  <Shield size={16} /> Admin Panel
                </Link>
              ) : (
                <>
                  <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Dashboard</Link>
                  <Link to="/transfer" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Transfer</Link>
                </>
              )}
              <div className="w-px h-6 bg-slate-200 mx-2"></div>
              <div className="text-sm text-slate-600 flex items-center gap-3 relative" ref={popoverRef}>
                <span className="font-medium">{user.name}</span>
                <button onClick={handleLogoutClick} className="text-slate-400 hover:text-red-500 transition-colors" title="Logout">
                  <LogOut size={18} />
                </button>
                
                {showLogoutConfirm && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-white rounded-2xl p-4 shadow-xl border border-slate-100 animate-in zoom-in-95 duration-200">
                    <p className="text-slate-800 font-medium mb-3">Log out of your account?</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={cancelLogout}
                        className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
                      >
                        Cancel
                      </button>
                      <button 
                        onClick={confirmLogout}
                        className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white text-sm font-medium rounded-xl transition-colors shadow-sm"
                      >
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link to="/login" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Sign In</Link>
              <Link to="/register" className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-dark transition-colors shadow-sm hover:shadow">
                Register
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col bg-slate-50/50">
          <Navbar />
          <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
            <Routes>
              {/* Public */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Client Protected */}
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/transfer" element={<Transfer />} />
              </Route>

              {/* Admin Protected */}
              <Route element={<AdminRoute />}>
                <Route path="/admin" element={<AdminDashboard />} />
                <Route path="/admin/user/:id" element={<AdminUserDetail />} />
              </Route>
            </Routes>
          </main>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
