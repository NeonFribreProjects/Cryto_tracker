import { useState, useRef, useEffect } from 'react';
import { PlusCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { getHistoricalPrice, searchCryptos, validateSymbol } from '../lib/cryptoApi';

interface AddPurchaseFormProps {
  onPurchaseAdded: () => void;
}

export function AddPurchaseForm({ onPurchaseAdded }: AddPurchaseFormProps) {
  const [symbol, setSymbol] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchaseTime, setPurchaseTime] = useState('12:00');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [suggestions, setSuggestions] = useState<ReturnType<typeof searchCryptos>>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSymbolChange = (value: string) => {
    setSymbol(value);
    if (value.length > 0) {
      const results = searchCryptos(value);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const selectSuggestion = (selectedSymbol: string) => {
    setSymbol(selectedSymbol);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateSymbol(symbol)) {
      setError(`"${symbol}" is not a supported cryptocurrency. Please select from the suggestions.`);
      return;
    }

    setLoading(true);

    try {
      const purchaseDateTime = new Date(`${purchaseDate}T${purchaseTime}`);

      const historicalPrice = await getHistoricalPrice(symbol, purchaseDateTime);

      const { error: dbError } = await supabase
        .from('crypto_purchases')
        .insert({
          symbol: symbol.toUpperCase(),
          purchase_date: purchaseDateTime.toISOString(),
          amount: parseFloat(amount),
          purchase_price_usd: historicalPrice,
        });

      if (dbError) throw dbError;

      setSymbol('');
      setPurchaseDate('');
      setPurchaseTime('12:00');
      setAmount('');
      onPurchaseAdded();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add purchase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Add New Purchase</h2>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="relative">
          <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-1">
            Cryptocurrency Symbol
          </label>
          <input
            ref={inputRef}
            id="symbol"
            type="text"
            value={symbol}
            onChange={(e) => handleSymbolChange(e.target.value)}
            onFocus={() => symbol && suggestions.length > 0 && setShowSuggestions(true)}
            placeholder="BTC, ETH, SOL..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
            autoComplete="off"
          />
          {showSuggestions && suggestions.length > 0 && (
            <div
              ref={suggestionsRef}
              className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
            >
              {suggestions.map((crypto) => (
                <button
                  key={crypto.symbol}
                  type="button"
                  onClick={() => selectSuggestion(crypto.symbol)}
                  className="w-full px-3 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none flex items-center justify-between"
                >
                  <span className="font-semibold text-gray-900">{crypto.symbol}</span>
                  <span className="text-sm text-gray-600">{crypto.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">
            Amount Purchased
          </label>
          <input
            id="amount"
            type="number"
            step="any"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Date
          </label>
          <input
            id="date"
            type="date"
            value={purchaseDate}
            onChange={(e) => setPurchaseDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
            Purchase Time
          </label>
          <input
            id="time"
            type="time"
            value={purchaseTime}
            onChange={(e) => setPurchaseTime(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            disabled={loading}
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Adding Purchase...
          </>
        ) : (
          <>
            <PlusCircle className="w-5 h-5" />
            Add Purchase
          </>
        )}
      </button>
    </form>
  );
}
