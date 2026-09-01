import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetUserAccount, adminGetUserTransactions } from '../api';
import { ChevronLeft, Clock, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import clsx from 'clsx';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      adminGetUserAccount(id),
      adminGetUserTransactions(id)
    ]).then(([acc, txs]) => {
      setAccount(acc);
      setTransactions(txs);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link to="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft size={16} className="mr-1" /> Back to Admin Console
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-md">
            <h2 className="text-indigo-100 font-medium mb-4">User Account</h2>
            {!account ? (
              <p className="text-sm opacity-80">No account found for this user.</p>
            ) : (
              <div className="bg-indigo-500/50 p-4 rounded-2xl border border-indigo-400/30">
                <p className="text-xs text-indigo-200 font-mono mb-1">{account.accountNumber}</p>
                <p className="text-2xl font-bold">${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-full">
            <div className="p-6 border-b border-slate-100 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
                <Clock size={20} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">All Transactions</h2>
            </div>
            
            {transactions.length === 0 ? (
              <div className="p-12 text-center text-slate-500">
                No transaction history.
              </div>
            ) : (
              <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider sticky top-0 z-10">
                      <th className="p-4 font-medium">Date</th>
                      <th className="p-4 font-medium">Type</th>
                      <th className="p-4 font-medium">From / To</th>
                      <th className="p-4 font-medium text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions.map(tx => {
                      const isDebit = account?.id === tx.fromAccountId;
                      
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="p-4 text-sm text-slate-500">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className={clsx("w-6 h-6 rounded-full flex items-center justify-center shrink-0", isDebit ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                                {isDebit ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                              </div>
                              <span className="text-sm font-medium text-slate-700">{isDebit ? 'Sent' : 'Received'}</span>
                            </div>
                          </td>
                          <td className="p-4 text-sm text-slate-600 font-mono">
                            {isDebit ? tx.toAccountId.slice(0,8) + '...' : tx.fromAccountId.slice(0,8) + '...'}
                          </td>
                          <td className="p-4 text-right font-medium">
                            <span className={isDebit ? 'text-slate-800' : 'text-emerald-600'}>
                              {isDebit ? '-' : '+'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
