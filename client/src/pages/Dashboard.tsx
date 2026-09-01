import { useEffect, useState } from 'react';
import { getMyAccount, getMyTransactions } from '../api';
import { Link } from 'react-router-dom';
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, Copy, Check } from 'lucide-react';
import clsx from 'clsx';

export default function Dashboard() {
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(account?.accountNumber || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    Promise.all([
      getMyAccount(),
      getMyTransactions()
    ]).then(([accData, txData]) => {
      setAccount(accData);
      setTransactions(txData);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  if (!account) {
    return (
      <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
        <h2 className="text-xl font-semibold text-slate-700 mb-2">Account Not Found</h2>
        <p className="text-slate-500 mb-6">There was a problem loading your account.</p>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Dashboard</h1>
          <p className="text-slate-500 mt-1">Manage your finances and recent activity.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-primary text-white rounded-3xl p-8 shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Wallet size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-primary-100 mb-1">Available Balance</p>
              <h2 className="text-4xl font-bold mb-6">
                ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h2>
              
              <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex items-center justify-between">
                <div>
                  <p className="text-xs text-primary-100 uppercase tracking-wider mb-1">Account Number</p>
                  <p className="font-mono text-lg">{account.accountNumber}</p>
                </div>
                <button 
                  onClick={handleCopy}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors flex items-center justify-center text-white"
                  title="Copy Account Number"
                >
                  {copied ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
                </button>
              </div>

              <div className="mt-6 flex gap-3">
                <Link to="/transfer" className="flex-1 bg-white text-primary text-center py-3 rounded-xl font-medium hover:bg-slate-50 transition-colors shadow-sm">
                  Transfer Money
                </Link>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-primary" /> Recent Transactions
              </h3>
            </div>
            
            <div className="p-0">
              {transactions.length === 0 ? (
                <div className="p-12 text-center">
                  <p className="text-slate-500">No transactions found.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {transactions.map(tx => (
                    <div key={tx.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={clsx(
                          "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                          tx.direction === 'CREDIT' ? "bg-emerald-100 text-emerald-600" : "bg-red-100 text-red-600"
                        )}>
                          {tx.direction === 'CREDIT' ? <ArrowDownLeft size={24} /> : <ArrowUpRight size={24} />}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">
                            {tx.direction === 'CREDIT' ? 'From' : 'To'} {tx.counterpartyName}
                          </p>
                          <p className="text-sm text-slate-500 flex items-center gap-2">
                            <span className="font-mono text-xs bg-slate-100 px-2 py-0.5 rounded-md">{tx.counterpartyAccountNumber}</span>
                            <span>•</span>
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </p>
                          {tx.description && (
                            <p className="text-xs text-slate-400 mt-1 italic">"{tx.description}"</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={clsx(
                          "font-bold text-lg",
                          tx.direction === 'CREDIT' ? "text-emerald-600" : "text-slate-800"
                        )}>
                          {tx.direction === 'CREDIT' ? '+' : '-'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </p>
                        <span className="inline-block px-2 py-1 bg-slate-100 text-slate-500 text-xs rounded-md mt-1 font-medium">
                          {tx.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
