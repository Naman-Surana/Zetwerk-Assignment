import { useState, useEffect } from 'react';
import { getAccounts, transferMoney } from '../api';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Send, AlertCircle, ArrowRightLeft } from 'lucide-react';

export default function Transfer() {
  const [searchParams] = useSearchParams();
  const initialFromId = searchParams.get('from') || '';

  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    fromAccountId: initialFromId,
    toAccountId: '',
    amount: '',
    description: ''
  });

  const navigate = useNavigate();

  useEffect(() => {
    getAccounts().then(data => {
      setAccounts(data);
      if (!initialFromId && data.length > 0) {
        setFormData(prev => ({ ...prev, fromAccountId: data[0].id }));
      }
      setLoading(false);
    });
  }, [initialFromId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (formData.fromAccountId === formData.toAccountId) {
      setError("Cannot transfer to the same account.");
      return;
    }
    if (parseFloat(formData.amount) <= 0) {
      setError("Amount must be greater than zero.");
      return;
    }

    setSubmitting(true);
    try {
      await transferMoney({
        fromAccountId: formData.fromAccountId,
        toAccountId: formData.toAccountId,
        amount: parseFloat(formData.amount),
        description: formData.description
      });
      // Redirect back to sender account to see updated balance and history
      navigate(`/account/${formData.fromAccountId}`);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Transfer failed. Please check your balance and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <ArrowRightLeft size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Transfer Funds</h1>
        <p className="text-slate-500 mt-2">Move money securely between Horizon Bank accounts.</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100 flex items-start">
            <AlertCircle size={18} className="mr-2 shrink-0 mt-0.5" />
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 relative">
            
            {/* Sender */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">From Account</label>
              <select 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                value={formData.fromAccountId}
                onChange={e => setFormData({...formData, fromAccountId: e.target.value})}
              >
                <option value="" disabled>Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.holderName} (...{acc.accountNumber.slice(-4)}) - ${parseFloat(acc.balance).toFixed(2)}
                  </option>
                ))}
              </select>
            </div>

            {/* Visual Divider / Icon on desktop */}
            <div className="hidden md:flex absolute inset-0 items-center justify-center pointer-events-none mt-6">
              <div className="w-8 h-8 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-400 z-10">
                <ArrowRightLeft size={14} />
              </div>
            </div>

            {/* Receiver */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-slate-700">To Account</label>
              <select 
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all appearance-none"
                value={formData.toAccountId}
                onChange={e => setFormData({...formData, toAccountId: e.target.value})}
              >
                <option value="" disabled>Select Account</option>
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.holderName} (...{acc.accountNumber.slice(-4)})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Amount ($)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 font-medium">
                $
              </div>
              <input 
                type="number" 
                required
                min="0.01"
                step="0.01"
                className="w-full pl-8 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all text-lg font-medium"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Description (Optional)</label>
            <input 
              type="text" 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="What is this for?"
              maxLength={255}
            />
          </div>
          
          <button 
            type="submit" 
            disabled={submitting}
            className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-70 disabled:cursor-not-allowed mt-4 shadow-md hover:shadow-lg"
          >
            {submitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                <Send size={18} />
                <span>Execute Transfer</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
