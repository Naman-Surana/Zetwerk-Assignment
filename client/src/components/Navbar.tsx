import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Shield, Menu, X, Landmark } from 'lucide-react';
import { STRINGS } from '../constants/strings';
import { useAuth } from '../context/AuthContext';
import clsx from 'clsx';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    if (window.confirm(STRINGS.COMMON.LOGOUT_CONFIRM)) {
      logout();
      navigate('/login');
    }
  };

  const navLinks = (
    <>
      {user ? (
        user.role === 'ADMIN' ? (
          <Link to="/admin" onClick={() => setMobileMenuOpen(false)} className={clsx("text-sm font-medium transition-colors flex items-center gap-2 py-2 md:py-0", location.pathname === '/admin' ? 'text-primary' : 'text-slate-600 hover:text-primary')}>
            <Shield size={16} /> {STRINGS.COMMON.ADMIN_PANEL}
          </Link>
        ) : (
          <>
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className={clsx("text-sm font-medium transition-colors py-2 md:py-0", location.pathname === '/' ? 'text-primary' : 'text-slate-600 hover:text-primary')}>{STRINGS.COMMON.DASHBOARD}</Link>
            <Link to="/transfer" onClick={() => setMobileMenuOpen(false)} className={clsx("text-sm font-medium transition-colors py-2 md:py-0", location.pathname === '/transfer' ? 'text-primary' : 'text-slate-600 hover:text-primary')}>{STRINGS.COMMON.TRANSFER}</Link>
          </>
        )
      ) : (
        <>
          <Link to="/login" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium text-slate-600 hover:text-primary transition-colors py-2 md:py-0">{STRINGS.COMMON.SIGN_IN}</Link>
          <Link to="/register" onClick={() => setMobileMenuOpen(false)} className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-dark transition-colors shadow-sm hover:shadow text-center md:text-left mt-2 md:mt-0">
            {STRINGS.COMMON.REGISTER}
          </Link>
        </>
      )}
    </>
  );

  return (
    <header className="bg-surface border-b border-slate-200 sticky top-0 z-50 bg-white shadow-sm">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-primary text-white rounded-xl flex items-center justify-center shadow-md">
            <Landmark size={20} className="md:w-6 md:h-6" />
          </div>
          <span className="text-xl md:text-2xl font-bold text-slate-800 tracking-tight">{STRINGS.COMMON.APP_NAME}</span>
        </div>
        
        <nav className="hidden md:flex items-center gap-6">
          {navLinks}
          {user && (
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm">
                {STRINGS.COMMON.LOGGED_IN_AS.replace('{name}', user.name)}
              </span>
              <button 
                onClick={handleLogout}
                className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-red-600 bg-white hover:bg-red-50 border border-slate-200 hover:border-red-100 px-4 py-2 rounded-xl transition-all shadow-sm"
              >
                <LogOut size={16} /> {STRINGS.COMMON.LOGOUT}
              </button>
            </div>
          )}
        </nav>

        <button 
          className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors z-50"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <div className={clsx(
        "fixed inset-0 bg-white z-40 transition-transform duration-300 ease-in-out md:hidden pt-20 px-6 pb-6 overflow-y-auto",
        mobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="flex flex-col gap-4">
          {navLinks}
          {user && (
            <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-4">
              <div className="text-slate-600 font-medium text-sm text-center">
                {STRINGS.COMMON.LOGGED_IN_AS.replace('{name}', user.name)}
              </div>
              <button 
                onClick={handleLogout} 
                className="flex items-center gap-2 text-red-600 font-medium p-3 bg-red-50 rounded-xl justify-center"
              >
                <LogOut size={18} /> {STRINGS.COMMON.LOGOUT}
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
