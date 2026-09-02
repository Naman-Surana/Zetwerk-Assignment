import { useState, useEffect } from 'react';
import { WifiOff, X } from 'lucide-react';

export default function NetworkStatus() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [apiFailed, setApiFailed] = useState(false);
  const [errorType, setErrorType] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const handleOffline = () => {
      setIsOffline(true);
      setDismissed(false);
    };
    const handleOnline = () => {
      setIsOffline(false);
      setApiFailed(false);
      setDismissed(false);
    };
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent;
      setErrorType(customEvent.detail?.type || 'network_error');
      setApiFailed(true);
      setDismissed(false);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    window.addEventListener('api-network-error', handleApiError);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('api-network-error', handleApiError);
    };
  }, []);

  if ((!isOffline && !apiFailed) || dismissed) return null;

  return (
    <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50 animate-in slide-in-from-bottom-5 duration-300 w-[90%] max-w-md">
      <div className="bg-red-600 text-white px-4 py-3 rounded-xl shadow-lg flex items-center gap-3">
        <WifiOff size={20} className="shrink-0" />
        <p className="text-sm font-medium flex-1">
          {isOffline 
            ? 'You are currently offline. Please check your internet connection.' 
            : errorType === 'timeout'
              ? 'Request timed out (5s). The server took too long to respond.'
              : 'Unable to connect to the server. Please check your connection.'}
        </p>
        <button 
          onClick={() => setDismissed(true)}
          className="p-1.5 hover:bg-white/20 rounded-lg transition-colors shrink-0"
        >
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
