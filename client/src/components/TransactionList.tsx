import clsx from 'clsx';
import { ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { STRINGS } from '../constants/strings';

interface TransactionListProps {
  transactions: any[];
  metadata: any;
  accountId: string;
  currentPage: number;
  setCurrentPage: (page: number | ((prev: number) => number)) => void;
}

export default function TransactionList({ transactions, metadata, setCurrentPage }: TransactionListProps) {
  if (transactions.length === 0) {
    return (
      <div className="p-8 md:p-12 text-center">
        <p className="text-slate-500">{STRINGS.TRANSACTION_LIST.NO_TRANSACTIONS}</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="divide-y divide-slate-100 flex-1">
        {transactions.map(tx => {
          const isDebit = tx.direction === 'DEBIT';
          
          return (
            <div key={tx.id} className="p-4 md:p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-3 md:gap-4 overflow-hidden">
                <div className={clsx(
                  "w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl flex items-center justify-center shadow-sm shrink-0",
                  isDebit ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-600"
                )}>
                  {isDebit ? <ArrowUpRight size={20} className="md:w-6 md:h-6" /> : <ArrowDownLeft size={20} className="md:w-6 md:h-6" />}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-slate-800 truncate text-sm md:text-base">
                    {isDebit ? STRINGS.TRANSACTION_LIST.TO : STRINGS.TRANSACTION_LIST.FROM} {tx.counterpartyName || STRINGS.TRANSACTION_LIST.UNKNOWN}
                  </p>
                  <p className="text-xs md:text-sm text-slate-500 flex items-center gap-1 md:gap-2 truncate">
                    <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded-md hidden sm:inline-block">
                      {tx.counterpartyAccountNumber}
                    </span>
                    <span className="hidden sm:inline">•</span>
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </p>
                  {tx.description && (
                    <p className="text-xs text-slate-400 mt-0.5 italic truncate">"{tx.description}"</p>
                  )}
                </div>
              </div>
              <div className="text-right shrink-0 ml-2">
                <p className={clsx(
                  "font-bold text-base md:text-lg",
                  isDebit ? "text-slate-800" : "text-emerald-600"
                )}>
                  {isDebit ? '-' : '+'}${parseFloat(tx.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </p>
                <span className="inline-block px-2 py-0.5 md:py-1 bg-slate-100 text-slate-500 text-[10px] md:text-xs rounded-md mt-1 font-medium">
                  {tx.status}
                </span>
              </div>
            </div>
          );
        })}
      </div>
      
      {metadata && metadata.totalPages > 1 && (
        <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 mt-auto">
          <button 
            disabled={metadata.page <= 1}
            onClick={() => setCurrentPage((p: number) => Math.max(1, p - 1))}
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {STRINGS.COMMON.PREVIOUS}
          </button>
          <span className="text-xs md:text-sm text-slate-600">
            {STRINGS.COMMON.PAGE_OF.replace('{page}', metadata.page).replace('{totalPages}', metadata.totalPages)}
          </span>
          <button 
            disabled={metadata.page >= metadata.totalPages}
            onClick={() => setCurrentPage((p: number) => Math.min(metadata.totalPages, p + 1))}
            className="px-3 md:px-4 py-2 text-xs md:text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {STRINGS.COMMON.NEXT}
          </button>
        </div>
      )}
    </div>
  );
}
