import { useState, useEffect } from 'react';
import { login as apiLogin, loginWithMfa } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowRight, Key } from 'lucide-react';
import { STRINGS } from '../constants/strings';

export default function Login() {
  const [formData, setFormData] = useState({ identifier: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mfaRequired, setMfaRequired] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [mfaCode, setMfaCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(0);
  const { user, login } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      if (user.role === 'ADMIN') {
        navigate('/admin', { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [user, navigate]);

  useEffect(() => {
    if (mfaRequired && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && mfaRequired) {
      setMfaRequired(false);
      setTempToken('');
      setMfaCode('');
      setError('2FA session expired. Please log in again.');
    }
  }, [mfaRequired, timeLeft]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      if (mfaRequired) {
        const res = await loginWithMfa({ tempToken, code: mfaCode });
        login(res.token, res.user);
        if (res.user.role === 'ADMIN') {
          navigate('/admin');
        } else {
          navigate('/');
        }
      } else {
        const res = await apiLogin(formData);
        if (res.mfaRequired) {
          setMfaRequired(true);
          setTempToken(res.tempToken);
          setTimeLeft(120);
        } else {
          login(res.token, res.user);
          if (res.user.role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">{STRINGS.LOGIN.TITLE}</h1>
        <p className="text-slate-500 mt-2">{STRINGS.LOGIN.SUBTITLE}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {mfaRequired ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <label className="block text-sm font-medium text-slate-700 mb-1.5 flex justify-between">
                <span>Authenticator Code</span>
                <span className="text-amber-600 font-mono text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                  {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
                </span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                  <Key size={18} />
                </div>
                <input 
                  type="text" 
                  required
                  placeholder="6-digit code"
                  maxLength={6}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono tracking-widest text-lg"
                  value={mfaCode}
                  onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <p className="text-xs text-slate-500 mt-2">Open your authenticator app to get the code.</p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email or Account Number</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.identifier}
                    onChange={e => setFormData({...formData, identifier: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{STRINGS.COMMON.PASSWORD}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Lock size={18} />
                  </div>
                  <input 
                    type="password" 
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <div className="flex justify-end mt-1.5">
                  <Link to="/forgot-password" className="text-sm text-primary hover:underline font-medium">{STRINGS.LOGIN.FORGOT_PASSWORD}</Link>
                </div>
              </div>
            </>
          )}
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-70 shadow-md hover:shadow-lg mt-4"
          >
            {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
              <><span>{mfaRequired ? "Verify Code" : STRINGS.COMMON.SIGN_IN}</span><ArrowRight size={18} /></>
            )}
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-6">
          {STRINGS.LOGIN.NO_ACCOUNT} <Link to="/register" className="text-primary font-medium hover:underline">{STRINGS.LOGIN.REGISTER_HERE}</Link>
        </p>
      </div>
    </div>
  );
}
