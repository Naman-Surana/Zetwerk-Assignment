import { useState, useEffect } from 'react';
import { resetPassword } from '../api';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { STRINGS } from '../constants/strings';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  

  useEffect(() => {
    if (!token) {
      setError(STRINGS.RESET_PASSWORD.INVALID_TOKEN);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    if (password !== confirmPassword) {
      setError(STRINGS.RESET_PASSWORD.PASSWORDS_MISMATCH);
      return;
    }
    if (password.length < 6) {
      setError(STRINGS.RESET_PASSWORD.PASSWORD_TOO_SHORT);
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      await resetPassword({ token, newPassword: password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || STRINGS.RESET_PASSWORD.RESET_FAILED);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{STRINGS.RESET_PASSWORD.SUCCESS_TITLE}</h2>
            <p className="text-slate-500 mb-8">
              {STRINGS.RESET_PASSWORD.SUCCESS_DESC}
            </p>
            <Link to="/login" className="flex items-center justify-center gap-2 w-full bg-primary text-white py-3.5 rounded-xl font-medium hover:bg-primary-dark transition-all shadow-md">
              <span>{STRINGS.RESET_PASSWORD.BACK_TO_LOGIN}</span>
            </Link>
         </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">{STRINGS.RESET_PASSWORD.TITLE}</h1>
        <p className="text-slate-500 mt-2">{STRINGS.RESET_PASSWORD.SUBTITLE}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{STRINGS.RESET_PASSWORD.NEW_PASSWORD}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required
                disabled={!token}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">{STRINGS.RESET_PASSWORD.CONFIRM_PASSWORD}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <Lock size={18} />
              </div>
              <input 
                type="password" 
                required
                disabled={!token}
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all disabled:opacity-50"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
              />
            </div>
          </div>
          
          <button 
            type="submit" 
            disabled={loading || !token}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-70 shadow-md hover:shadow-lg mt-4"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
              <><span>{STRINGS.RESET_PASSWORD.RESET_BTN}</span><ArrowRight size={18} /></>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
