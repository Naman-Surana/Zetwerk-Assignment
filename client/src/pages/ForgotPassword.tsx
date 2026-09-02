import { useState } from 'react';
import { forgotPassword } from '../api';
import { Link } from 'react-router-dom';
import { Mail, ArrowRight, KeyRound, CheckCircle, ArrowLeft } from 'lucide-react';
import { STRINGS } from '../constants/strings';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [devToken, setDevToken] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const res = await forgotPassword({ email });
      setSuccess(true);
      // We log the token for developer testing since we don't have real email configured
      if (res._dev_token) {
        setDevToken(res._dev_token);
        console.log("DEV ONLY: Reset Token:", res._dev_token);
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-16 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <KeyRound size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">{STRINGS.FORGOT_PASSWORD.TITLE}</h1>
        <p className="text-slate-500 mt-2">{STRINGS.FORGOT_PASSWORD.SUBTITLE}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100">
            {error}
          </div>
        )}

        {success ? (
          <div className="text-center py-6">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle size={32} />
            </div>
            <p className="text-slate-600 mb-6">{STRINGS.FORGOT_PASSWORD.SUCCESS}</p>
            
            {devToken && (
              <div className="p-4 bg-slate-50 rounded-xl text-left border border-slate-200 mb-6">
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider font-semibold">Developer Mode</p>
                <p className="text-sm text-slate-700 mb-3">Since we don't have a real email provider hooked up, use this button to proceed:</p>
                <Link to={`/reset-password?token=${devToken}`} className="block text-center w-full bg-slate-800 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
                  Go to Reset Password
                </Link>
              </div>
            )}
            
            <Link to="/login" className="inline-flex items-center gap-2 text-primary font-medium hover:underline">
              <ArrowLeft size={16} /> {STRINGS.FORGOT_PASSWORD.BACK_TO_LOGIN}
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
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
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-70 shadow-md hover:shadow-lg mt-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (
                <><span>{STRINGS.FORGOT_PASSWORD.SEND_LINK}</span><ArrowRight size={18} /></>
              )}
            </button>
            
            <div className="mt-6 text-center">
              <Link to="/login" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors">
                <ArrowLeft size={16} /> {STRINGS.FORGOT_PASSWORD.BACK_TO_LOGIN}
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
