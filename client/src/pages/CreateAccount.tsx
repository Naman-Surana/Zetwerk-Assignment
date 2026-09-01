import { useState } from 'react';
import { createAccount } from '../api';
import { useNavigate } from 'react-router-dom';
import { UserPlus, ArrowRight, DollarSign, Mail, User } from 'lucide-react';

export default function CreateAccount() {
  const [formData, setFormData] = useState({ holderName: '', email: '', initialBalance: 1000 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await createAccount(formData);
      navigate(`/account/${res.id}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to create account');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <UserPlus size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Open New Account</h1>
        <p className="text-slate-500 mt-2">Join Horizon Bank today and manage your finances with ease.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100 flex items-start">
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <User size={18} />
              </div>
              <input 
                type="text" 
                required
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.holderName}
                onChange={e => setFormData({...formData, holderName: e.target.value})}
                placeholder="John Doe"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email Address</label>
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
                placeholder="john@example.com"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Initial Deposit ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <DollarSign size={18} />
              </div>
              <input 
                type="number" 
                required
                min="0"
                step="0.01"
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                value={formData.initialBalance}
                onChange={e => setFormData({...formData, initialBalance: parseFloat(e.target.value)})}
              />
            </div>
            <p className="text-xs text-slate-500 mt-2">Minimum opening deposit is $0.00.</p>
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-md hover:shadow-lg"
          >
            {loading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <span>Create Account</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
