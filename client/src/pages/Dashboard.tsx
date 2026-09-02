import { useEffect, useState } from 'react';
import { getMyAccount, getMyTransactions } from '../api';
import { Clock } from 'lucide-react';
import AccountCard from '../components/AccountCard';
import TransactionList from '../components/TransactionList';
import MfaSettings from '../components/MfaSettings';
import { STRINGS } from '../constants/strings';

export default function Dashboard() {
  const [account, setAccount] = useState<any>(null);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [metadata, setMetadata] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    let pollTimer: ReturnType<typeof setTimeout>;

    const fetchData = async (showLoader = false) => {
      if (showLoader) setLoading(true);
      try {
        const [accData, txData] = await Promise.all([
          getMyAccount(),
          getMyTransactions(undefined, currentPage, 10)
        ]);
        
        if (!isMounted) return;
        
        setAccount(accData);
        setTransactions(txData.transactions);
        setMetadata(txData.metadata);
        
        if (showLoader) setLoading(false);

        // If any transaction is still pending, poll again in 3 seconds
        const hasPending = txData.transactions.some((tx: any) => tx.status === 'PENDING');
        if (hasPending) {
          pollTimer = setTimeout(() => fetchData(false), 3000);
        }
      } catch (err) {
        console.error(err);
        if (isMounted && showLoader) setLoading(false);
      }
    };

    fetchData(true);

    return () => {
      isMounted = false;
      if (pollTimer) clearTimeout(pollTimer);
    };
  }, [currentPage]);

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
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-full overflow-x-hidden">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">{STRINGS.DASHBOARD.TITLE}</h1>
          <p className="text-slate-500 mt-1">{STRINGS.DASHBOARD.SUBTITLE}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
          <AccountCard 
            balance={account.balance} 
            accountNumber={account.accountNumber} 
          />
          <MfaSettings />
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[800px]">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={18} className="text-primary" /> {STRINGS.DASHBOARD.RECENT_TRANSACTIONS}
              </h3>
            </div>
            
            <div className="p-0 flex-1 overflow-y-auto">
              <TransactionList 
                transactions={transactions}
                metadata={metadata}
                accountId={account.id}
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
