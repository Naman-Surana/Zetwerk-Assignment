import { useState, useEffect } from 'react';
import { setupMfa, verifyMfaSetup } from '../api';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, ShieldAlert, Key, QrCode } from 'lucide-react';

export default function MfaSettings() {
  const { user, login, token } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120);

  useEffect(() => {
    if (qrCode && !success && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && qrCode && !success) {
      setQrCode('');
      setSecret('');
      setError('Setup timed out. Please click Enable 2FA to try again.');
    }
  }, [qrCode, success, timeLeft]);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    setTimeLeft(120);
    try {
      const res = await setupMfa();
      setQrCode(res.qrCodeUrl);
      setSecret(res.secret);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to setup MFA');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await verifyMfaSetup({ code });
      setSuccess(true);
      setQrCode('');
      setSecret('');
      
      if (user && token) {
        login(token, { ...user, mfaEnabled: true });
      }
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Invalid code');
    } finally {
      setLoading(false);
    }
  };

  if (user?.mfaEnabled) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden relative group">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-2">
          <ShieldCheck size={20} className="text-emerald-500" />
          Two-Factor Authentication
        </h3>
        <p className="text-slate-500 text-sm mb-4">
          Your account is currently protected with Two-Factor Authentication (TOTP).
        </p>
        <div>
          <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full border border-emerald-200">
            Enabled
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 overflow-hidden">
      <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4">
        <ShieldAlert size={20} className="text-amber-500" />
        Two-Factor Authentication
      </h3>
      
      {!qrCode && !success && (
        <div>
          <p className="text-slate-500 text-sm mb-6">
            Add an extra layer of security to your account by enabling Two-Factor Authentication.
          </p>
          <button 
            onClick={handleSetup}
            disabled={loading}
            className="w-full py-3 bg-slate-900 text-white rounded-xl font-medium hover:bg-slate-800 transition-colors disabled:opacity-70 flex justify-center items-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <><QrCode size={18} /> Enable 2FA</>}
          </button>
        </div>
      )}

      {qrCode && !success && (
        <div className="space-y-4 animate-in fade-in duration-300">
          <p className="text-sm text-slate-600">1. Scan this QR code with your authenticator app (e.g., Google Authenticator, Authy).</p>
          <div className="flex justify-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <img src={qrCode} alt="MFA QR Code" className="w-32 h-32 md:w-48 md:h-48 rounded-xl shadow-sm bg-white" />
          </div>
          <p className="text-xs text-center text-slate-400 break-all bg-slate-50 p-2 rounded-lg font-mono">Secret: {secret}</p>
          
          <form onSubmit={handleVerify} className="pt-2 border-t border-slate-100 mt-4">
            <label className="block text-sm font-medium text-slate-700 mb-2 flex justify-between">
              <span>2. Enter the 6-digit code</span>
              <span className="text-amber-600 font-mono text-xs bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')} remaining
              </span>
            </label>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Key size={16} />
                </div>
                <input 
                  type="text" 
                  required
                  maxLength={6}
                  placeholder="000000"
                  className="w-full pl-10 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-mono tracking-widest text-center"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                />
              </div>
              <button 
                type="submit"
                disabled={loading || code.length !== 6}
                className="px-6 bg-primary text-white rounded-xl font-medium hover:bg-primary-dark transition-colors disabled:opacity-50"
              >
                {loading ? '...' : 'Verify'}
              </button>
            </div>
            {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
          </form>
        </div>
      )}

      {success && (
        <div className="text-center py-4 animate-in zoom-in duration-300">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck size={24} />
          </div>
          <p className="text-emerald-700 font-medium">MFA Successfully Enabled!</p>
        </div>
      )}
    </div>
  );
}
