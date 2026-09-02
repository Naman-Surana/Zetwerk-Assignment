import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { adminGetUserAccount, adminGetUserTransactions } from '../api';
import { ArrowLeft, User, DollarSign, List} from 'lucide-react';
import { STRINGS } from '../constants/strings';
import TransactionList from '../components/TransactionList';

export default function AdminUserDetail() {
  const { id } = useParams<{ id: string }>();
  const [account, setAccount] = useState<any>(null);
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([
      adminGetUserAccount(id),
      adminGetUserTransactions(id, currentPage, 10)
    ]).then(([acc, txs]) => {
      setAccount(acc);
      setUser(acc.user);
      setTransactions(txs.transactions);
      setMetadata(txs.metadata);
      setLoading(false);
    }).catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id, currentPage]);

  if (loading) return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Link to="/admin" className="inline-flex items-center text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors mb-6">
        <ArrowLeft size={16} className="mr-1" /> {STRINGS.ADMIN_USER_DETAIL.BACK_TO_DASHBOARD}
      </Link>
      
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center shadow-sm">
          <User size={32} />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">{STRINGS.ADMIN_USER_DETAIL.CLIENT_DETAILS}</h1>
          {user && (
            <p className="text-slate-500 font-medium">{user.name} • {user.email}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-indigo-600 text-white rounded-3xl p-6 shadow-md">
            <h2 className="text-indigo-100 font-medium mb-4">{STRINGS.ADMIN_USER_DETAIL.USER_ACCOUNT}</h2>
            {!account ? (
              <p className="text-sm opacity-80">{STRINGS.ADMIN_USER_DETAIL.NO_ACCOUNT}</p>
            ) : (
              <div className="bg-indigo-500/50 p-4 rounded-2xl border border-indigo-400/30">
                <p className="text-xs text-indigo-200 font-mono mb-1">{account.accountNumber}</p>
                <p className="text-2xl font-bold">${parseFloat(account.balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
              </div>
            )}
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">{STRINGS.ADMIN_USER_DETAIL.ACCOUNT_ID}</p>
              <p className="text-2xl font-bold text-slate-800 font-mono">#{account?.accountNumber}</p>
            </div>
          </div>
          <div className="bg-indigo-600 p-6 rounded-3xl shadow-sm text-white flex items-center justify-between relative overflow-hidden">
            <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-1/4 translate-y-1/4">
              <DollarSign size={120} />
            </div>
            <div className="relative z-10">
              <p className="text-indigo-200 text-sm font-medium mb-1">{STRINGS.ADMIN_USER_DETAIL.BALANCE}</p>
              <p className="text-3xl font-bold">${parseFloat(account?.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center gap-2">
              <List size={20} className="text-indigo-500" />
              <h2 className="text-xl font-bold text-slate-800">{STRINGS.ADMIN_USER_DETAIL.ALL_TRANSACTIONS}</h2>
            </div>

            <div className="flex-1">
              <TransactionList 
                transactions={transactions}
                metadata={metadata}
                accountId={account?.id}
                currentPage={currentPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
