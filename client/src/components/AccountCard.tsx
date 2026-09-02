import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Wallet, Copy, Check, ArrowRight } from 'lucide-react';
import { STRINGS } from '../constants/strings';

interface AccountCardProps {
  balance: string;
  accountNumber: string;
}

export default function AccountCard({ balance, accountNumber }: AccountCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(accountNumber || '');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-primary text-white rounded-3xl p-6 md:p-8 shadow-lg relative overflow-hidden">
      <div className="absolute top-0 right-0 p-6 opacity-10">
        <Wallet size={120} />
      </div>
      <div className="relative z-10">
        <div className="text-white/80 text-xs md:text-sm font-medium mb-1 drop-shadow-sm">{STRINGS.ACCOUNT_CARD.AVAILABLE_BALANCE}</div>
        <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold tracking-tight text-white drop-shadow-md mb-6">
          ${parseFloat(balance).toLocaleString('en-US', { minimumFractionDigits: 2 })}
        </h2>
        
        <div className="bg-white/10 rounded-2xl p-4 border border-white/20 flex items-center justify-between">
          <div>
            <div className="text-white/60 text-[10px] md:text-xs font-medium uppercase tracking-wider mb-1">{STRINGS.ACCOUNT_CARD.ACCOUNT_NUMBER}</div>
            <div className="text-base md:text-lg font-mono text-white/90 bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-xl inline-block border border-white/20 shadow-inner backdrop-blur-md">
              {accountNumber}
            </div>
          </div>
          <button 
            onClick={handleCopy}
            className="w-10 h-10 md:w-12 md:h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 shadow-sm border border-white/10 backdrop-blur-md"
            title={STRINGS.ACCOUNT_CARD.COPY_TITLE}
          >
            {copied ? <Check size={18} className="text-emerald-300" /> : <Copy size={18} />}
          </button>
        </div>

        <div className="mt-6 flex gap-3">
          <Link 
            to="/transfer" 
            className="w-full flex items-center justify-center gap-2 bg-slate-900/40 hover:bg-slate-900/60 text-white p-3 md:p-4 transition-colors font-medium text-sm md:text-base backdrop-blur-sm border-t border-white/10 rounded-xl"
          >
            <span>{STRINGS.ACCOUNT_CARD.TRANSFER_MONEY}</span> <ArrowRight size={18} />
          </Link>
        </div>
      </div>
    </div>
  );
}
