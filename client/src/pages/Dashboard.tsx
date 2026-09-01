import { useEffect, useState } from 'react';
import { getAccounts } from '../api';
import { Link } from 'react-router-dom';
import { Wallet, ArrowRight, User, Plus } from 'lucide-react';

export default function Dashboard() {
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAccounts().then(data => {
      setAccounts(data);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Your Accounts</h1>
          <p className="text-slate-500 mt-1">Manage your finances and recent activity.</p>
        </div>
        <Link to="/create-account" className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-full hover:bg-slate-50 transition-colors shadow-sm">
          <Plus size={18} />
          <span>New Account</span>
        </Link>
      </div>

      {accounts.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-3xl p-12 text-center shadow-sm">
          <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
            <Wallet size={32} className="text-slate-400" />
          </div>
          <h2 className="text-xl font-semibold text-slate-700 mb-2">No accounts found</h2>
          <p className="text-slate-500 mb-6 max-w-sm mx-auto">Get started by opening your first checking or savings account with Horizon Bank.</p>
          <Link to="/create-account" className="inline-flex items-center gap-2 bg-primary text-white px-6 py-3 rounded-full font-medium hover:bg-primary-dark transition-colors shadow-md hover:shadow-lg">
            Open an Account
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map(account => (
            <Link key={account.id} to={`/account/${account.id}`} className="group block bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-xl hover:border-primary/20 transition-all duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity transform group-hover:scale-110 duration-500">
                <Wallet size={120} className="text-primary" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                    <User size={20} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{account.holderName}</h3>
                    <p className="text-xs text-slate-500 font-mono">{account.accountNumber}</p>
                  </div>
                </div>
                <div className="mt-6 mb-4">
                  <p className="text-sm text-slate-500 mb-1">Available Balance</p>
                  <p className="text-3xl font-bold text-slate-800">
                    ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div className="flex items-center text-primary text-sm font-medium pt-4 border-t border-slate-100">
                  <span>View Details</span>
                  <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
