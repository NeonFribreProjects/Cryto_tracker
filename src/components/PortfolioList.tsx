import { useEffect, useState } from 'react';
import { TrendingUp, TrendingDown, Trash2, Loader2 } from 'lucide-react';
import { supabase, CryptoPurchase } from '../lib/supabase';
import { getCurrentPrice } from '../lib/cryptoApi';

interface PortfolioListProps {
  refreshTrigger: number;
}

interface PurchaseWithPrice extends CryptoPurchase {
  currentPrice?: number;
  profitLoss?: number;
  profitLossPercent?: number;
}

export function PortfolioList({ refreshTrigger }: PortfolioListProps) {
  const [purchases, setPurchases] = useState<PurchaseWithPrice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pricesLoading, setPricesLoading] = useState(false);

  useEffect(() => {
    fetchPurchases();
  }, [refreshTrigger]);

  useEffect(() => {
    if (purchases.length === 0) return;

    const interval = setInterval(() => {
      fetchCurrentPrices(purchases);
    }, 30000);

    return () => clearInterval(interval);
  }, [purchases.length]);

  const fetchPurchases = async () => {
    try {
      setLoading(true);
      const { data, error: fetchError } = await supabase
        .from('crypto_purchases')
        .select('*')
        .order('purchase_date', { ascending: false });

      if (fetchError) throw fetchError;

      const purchasesData = data || [];
      setPurchases(purchasesData);

      if (purchasesData.length > 0) {
        fetchCurrentPrices(purchasesData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load purchases');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPrices = async (purchasesData: CryptoPurchase[]) => {
    setPricesLoading(true);

    const uniqueSymbols = [...new Set(purchasesData.map(p => p.symbol))];
    const pricePromises = uniqueSymbols.map(async (symbol) => {
      try {
        const price = await getCurrentPrice(symbol);
        return { symbol, price };
      } catch (error) {
        console.error(`Failed to fetch price for ${symbol}:`, error);
        return { symbol, price: null };
      }
    });

    const prices = await Promise.all(pricePromises);
    const priceMap = new Map(prices.map(p => [p.symbol, p.price]));

    const updatedPurchases = purchasesData.map(purchase => {
      const currentPrice = priceMap.get(purchase.symbol);
      if (currentPrice && purchase.purchase_price_usd) {
        const profitLoss = (currentPrice - purchase.purchase_price_usd) * purchase.amount;
        const profitLossPercent = ((currentPrice - purchase.purchase_price_usd) / purchase.purchase_price_usd) * 100;

        return {
          ...purchase,
          currentPrice,
          profitLoss,
          profitLossPercent,
        };
      }
      return purchase;
    });

    setPurchases(updatedPurchases);
    setPricesLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this purchase?')) return;

    try {
      const { error: deleteError } = await supabase
        .from('crypto_purchases')
        .delete()
        .eq('id', id);

      if (deleteError) throw deleteError;

      setPurchases(purchases.filter(p => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete purchase');
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        {error}
      </div>
    );
  }

  if (purchases.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <p className="text-gray-500">No purchases yet. Add your first cryptocurrency purchase above!</p>
      </div>
    );
  }

  const totalValue = purchases.reduce((sum, p) => {
    if (p.currentPrice) {
      return sum + (p.currentPrice * p.amount);
    }
    return sum;
  }, 0);

  const totalCost = purchases.reduce((sum, p) => {
    if (p.purchase_price_usd) {
      return sum + (p.purchase_price_usd * p.amount);
    }
    return sum;
  }, 0);

  const totalProfitLoss = totalValue - totalCost;
  const totalProfitLossPercent = totalCost > 0 ? (totalProfitLoss / totalCost) * 100 : 0;

  return (
    <div>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Portfolio Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Value</p>
            <p className="text-2xl font-bold text-gray-900">
              {pricesLoading ? '...' : formatCurrency(totalValue)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Cost</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalCost)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600 mb-1">Total Profit/Loss</p>
            <p className={`text-2xl font-bold ${totalProfitLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {pricesLoading ? '...' : (
                <>
                  {formatCurrency(totalProfitLoss)}
                  <span className="text-lg ml-2">
                    ({totalProfitLossPercent > 0 ? '+' : ''}{totalProfitLossPercent.toFixed(2)}%)
                  </span>
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Symbol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Purchase Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Profit/Loss
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="font-semibold text-gray-900">{purchase.symbol}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {purchase.amount}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700 text-sm">
                    {formatDate(purchase.purchase_date)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {purchase.purchase_price_usd ? formatCurrency(purchase.purchase_price_usd) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-700">
                    {pricesLoading ? '...' : purchase.currentPrice ? formatCurrency(purchase.currentPrice) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {pricesLoading ? (
                      <span className="text-gray-500">...</span>
                    ) : purchase.profitLoss !== undefined ? (
                      <div className="flex items-center gap-1">
                        {purchase.profitLoss >= 0 ? (
                          <TrendingUp className="w-4 h-4 text-green-600" />
                        ) : (
                          <TrendingDown className="w-4 h-4 text-red-600" />
                        )}
                        <span className={purchase.profitLoss >= 0 ? 'text-green-600' : 'text-red-600'}>
                          {formatCurrency(Math.abs(purchase.profitLoss))}
                          <span className="text-sm ml-1">
                            ({purchase.profitLossPercent! > 0 ? '+' : ''}{purchase.profitLossPercent!.toFixed(2)}%)
                          </span>
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500">N/A</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleDelete(purchase.id)}
                      className="text-red-600 hover:text-red-800 transition-colors"
                      title="Delete purchase"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
