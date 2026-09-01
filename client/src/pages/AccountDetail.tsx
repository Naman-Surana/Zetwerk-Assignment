import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getAccount, getTransactions } from '../api';
import { ArrowDownLeft, ArrowUpRight, Clock, Send, CreditCard, ChevronLeft } from 'lucide-react';
import clsx from 'clsx';

export default function AccountDetail() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!id) return;
    try {
      const acc = await getAccount(id);
      const txs = await getTransactions(id);
      setAccount(acc);
      setTransactions(txs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  if (!account) return <div className="text-center p-8 text-slate-500">Account not found</div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ChevronLeft size={16} className="mr-1" /> Back to Dashboard
      </Link>

      <div className="bg-primary text-white rounded-3xl p-8 relative overflow-hidden shadow-xl shadow-primary/20 mb-8">
        <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
          <CreditCard size={160} />
        </div>
        <div className="relative z-10">
          <div className="flex justify-between items-start mb-12">
            <div>
              <p className="text-primary-100 mb-1 font-medium">Available Balance</p>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
                ${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </h1>
            </div>
            <Link to={`/transfer?from=${account.id}`} className="bg-white/20 hover:bg-white/30 text-white backdrop-blur-md border border-white/20 px-5 py-2.5 rounded-full text-sm font-medium transition-colors flex items-center gap-2">
              <Send size={16} />
              <span className="hidden sm:inline">Transfer Money</span>
            </Link>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-primary-100 text-sm mb-1">Account Holder</p>
              <p className="font-semibold text-lg">{account.holderName}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-primary-100 text-sm mb-1">Account Number</p>
              <p className="font-mono text-lg">{account.accountNumber}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600">
            <Clock size={20} />
          </div>
          <h2 className="text-xl font-bold text-slate-800">Transaction History</h2>
        </div>
        
        {transactions.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No transactions found for this account.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-medium">Date</th>
                  <th className="p-4 font-medium">Description</th>
                  <th className="p-4 font-medium">Counterparty</th>
                  <th className="p-4 font-medium text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transactions.map(tx => {
                  const isDebit = tx.direction === 'DEBIT';
                  return (
                    <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 text-sm text-slate-500">
                        {new Date(tx.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={clsx("w-8 h-8 rounded-full flex items-center justify-center shrink-0", isDebit ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600")}>
                            {isDebit ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          </div>
                          <div>
                            <p className="font-medium text-slate-800">{tx.description || (isDebit ? 'Transfer Sent' : 'Transfer Received')}</p>
                            <p className="text-xs text-slate-400 font-mono mt-0.5">Ref: {tx.id.slice(0,8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 text-sm text-slate-600 font-mono">
                        {tx.counterpartyAccountNumber}
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
  );
}
