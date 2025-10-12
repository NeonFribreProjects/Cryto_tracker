import { useState } from 'react';
import { TrendingUp } from 'lucide-react';
import { AddPurchaseForm } from './components/AddPurchaseForm';
import { PortfolioList } from './components/PortfolioList';

function App() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handlePurchaseAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <header className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <TrendingUp className="w-10 h-10 text-blue-600" />
            <h1 className="text-4xl font-bold text-gray-900">Crypto Portfolio Tracker</h1>
          </div>
          <p className="text-gray-600">Track your cryptocurrency investments and monitor profit/loss in real-time</p>
        </header>

        <AddPurchaseForm onPurchaseAdded={handlePurchaseAdded} />
        <PortfolioList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
}

export default App;
