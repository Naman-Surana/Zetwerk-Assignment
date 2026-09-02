import { useState } from 'react';
import { transferMoney } from '../api';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowRight, DollarSign, CreditCard } from 'lucide-react';
import { STRINGS } from '../constants/strings';

export default function Transfer() {
  const [formData, setFormData] = useState({
    toAccountNumber: '',
    amount: '',
    description: ''
  });
  
  const [fieldErrors, setFieldErrors] = useState({
    toAccountNumber: '',
    amount: ''
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    let hasError = false;
    const newFieldErrors = { toAccountNumber: '', amount: '' };
    
    if (!formData.toAccountNumber.trim()) {
      newFieldErrors.toAccountNumber = 'Recipient account number is required';
      hasError = true;
    } else if (!/^\d{8,17}$/.test(formData.toAccountNumber)) {
      newFieldErrors.toAccountNumber = 'Account number must be 8 to 17 digits';
      hasError = true;
    }
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newFieldErrors.amount = 'Amount must be greater than 0';
      hasError = true;
    }

    setFieldErrors(newFieldErrors);

    if (hasError) {
      setLoading(false);
      return;
    }
    
    try {
      await transferMoney({
        toAccountNumber: formData.toAccountNumber,
        amount: parseFloat(formData.amount),
        description: formData.description
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Transfer failed. Please check the account details and balance.');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
          <Send size={32} />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">{STRINGS.TRANSFER.TITLE}</h1>
        <p className="text-slate-500 mt-2">{STRINGS.TRANSFER.SUBTITLE}</p>
      </div>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative overflow-hidden">
        {success && (
          <div className="absolute inset-0 bg-emerald-500 z-10 flex flex-col items-center justify-center text-white animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mb-4">
              <Send size={40} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2">{STRINGS.TRANSFER.SUCCESS_TITLE}</h2>
            <p className="text-emerald-50">{STRINGS.TRANSFER.SUCCESS_DESC}</p>
          </div>
        )}

        {error && (
          <div className="mb-6 p-4 bg-red-50 text-red-700 rounded-2xl text-sm border border-red-100 flex items-start gap-3">
            <div className="mt-0.5"><div className="w-2 h-2 rounded-full bg-red-500 mt-1.5"></div></div>
            <p>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{STRINGS.TRANSFER.RECIPIENT_ACCOUNT}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <CreditCard size={18} />
              </div>
              <input 
                type="text" 
                placeholder="e.g. AC12345678"
                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all font-mono ${
                  fieldErrors.toAccountNumber 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                    : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
                }`}
                value={formData.toAccountNumber}
                onChange={e => {
                  setFormData({...formData, toAccountNumber: e.target.value.toUpperCase()});
                  if (fieldErrors.toAccountNumber) setFieldErrors({...fieldErrors, toAccountNumber: ''});
                }}
              />
            </div>
            {fieldErrors.toAccountNumber && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
                {fieldErrors.toAccountNumber}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{STRINGS.TRANSFER.AMOUNT}</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400">
                <DollarSign size={18} />
              </div>
              <input 
                type="number" 
                min="0.01"
                step="0.01"
                placeholder="0.00"
                className={`w-full pl-11 pr-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-2 focus:outline-none transition-all font-medium text-lg [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                  fieldErrors.amount 
                    ? 'border-red-300 focus:ring-red-500/20 focus:border-red-500' 
                    : 'border-slate-200 focus:ring-primary/20 focus:border-primary'
                }`}
                value={formData.amount}
                onChange={e => {
                  setFormData({...formData, amount: e.target.value});
                  if (fieldErrors.amount) setFieldErrors({...fieldErrors, amount: ''});
                }}
              />
            </div>
            {fieldErrors.amount && (
              <p className="mt-1.5 text-sm text-red-500 flex items-center gap-1.5">
                <span className="w-1 h-1 rounded-full bg-red-500 inline-block"></span>
                {fieldErrors.amount}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">{STRINGS.TRANSFER.DESCRIPTION}</label>
            <textarea 
              rows={2}
              placeholder={STRINGS.TRANSFER.DESCRIPTION_PLACEHOLDER}
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>
          
          <div className="pt-2">
            <button 
              type="submit" 
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-xl font-medium hover:bg-primary-dark transition-all disabled:opacity-70 shadow-md hover:shadow-lg"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <><span>{STRINGS.TRANSFER.SEND_MONEY}</span><ArrowRight size={18} /></>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
