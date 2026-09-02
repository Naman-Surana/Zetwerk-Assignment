import { useState, useEffect } from 'react';
import { register as apiRegister } from '../api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { User, Lock, Mail, ArrowRight, ShieldCheck, CreditCard } from 'lucide-react';
import { STRINGS } from '../constants/strings';

export default function Register() {
  const [formData, setFormData] = useState({ name: '', email: '', password: '', accountNumber: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { user } = useAuth();
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    if (!/^\d{8,17}$/.test(formData.accountNumber)) {
      setError('Account number must be exactly 8 to 17 digits');
      setLoading(false);
      return;
    }
    
    try {
      await apiRegister(formData);
      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 mb-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800">{STRINGS.REGISTER.TITLE}</h1>
        <p className="text-slate-500 mt-2">{STRINGS.REGISTER.SUBTITLE}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">{STRINGS.REGISTER.SUCCESS_TITLE}</h2>
            <p className="text-slate-500 mb-6">{STRINGS.REGISTER.SUCCESS_DESC}</p>
            <Link to="/login" className="inline-flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-medium hover:bg-primary-dark transition-colors shadow-sm w-full">
              {STRINGS.REGISTER.GO_TO_LOGIN} <ArrowRight size={18} />
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{STRINGS.REGISTER.NAME}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <User size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{STRINGS.COMMON.EMAIL}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <Mail size={18} />
                  </div>
                  <input 
                    type="email" 
                    required
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.email}
                    onChange={e => setFormData({...formData, email: e.target.value})}
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
                    minLength={6}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">{STRINGS.REGISTER.ACCOUNT_NUMBER}</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                    <CreditCard size={18} />
                  </div>
                  <input 
                    type="text" 
                    required
                    placeholder={STRINGS.REGISTER.ACCOUNT_NUMBER_PLACEHOLDER}
                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                    value={formData.accountNumber}
                    onChange={e => setFormData({...formData, accountNumber: e.target.value})}
                  />
                </div>
              </div>
              
              <button 
                type="submit" 
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-70 shadow-md hover:shadow-lg mt-4"
              >
                {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                  <><span>{STRINGS.REGISTER.CREATE_ACCOUNT_BTN}</span><ArrowRight size={18} /></>
                )}
              </button>
            </form>

            <p className="text-center text-sm text-slate-500 mt-6">
              {STRINGS.REGISTER.ALREADY_HAVE_ACCOUNT} <Link to="/login" className="text-primary font-medium hover:underline">{STRINGS.REGISTER.LOGIN_HERE}</Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
