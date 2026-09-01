import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import CreateAccount from './pages/CreateAccount';
import AccountDetail from './pages/AccountDetail';
import Transfer from './pages/Transfer';
import { Landmark } from 'lucide-react';

function App() {
  return (
    <Router>
      <div className="min-h-screen flex flex-col">
        <header className="bg-surface border-b border-slate-200 sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-primary-dark hover:opacity-80 transition-opacity">
              <div className="p-2 bg-primary/10 rounded-xl">
                <Landmark size={24} className="text-primary" />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-800">Horizon<span className="text-primary">Bank</span></span>
            </Link>
            <nav className="flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Dashboard</Link>
              <Link to="/transfer" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Transfer</Link>
              <Link to="/create-account" className="text-sm font-medium bg-primary text-white px-5 py-2 rounded-full hover:bg-primary-dark transition-colors shadow-sm hover:shadow">
                Open Account
              </Link>
            </nav>
          </div>
        </header>

        <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/account/:id" element={<AccountDetail />} />
            <Route path="/transfer" element={<Transfer />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
