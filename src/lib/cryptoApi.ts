export interface CryptoPrice {
  price: number;
  timestamp: number;
}

export async function getCurrentPrice(symbol: string): Promise<number> {
  try {
    const coinId = getCoinId(symbol);
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd`,
      {
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data[coinId] || !data[coinId].usd) {
      throw new Error(`Price not found for ${symbol} (${coinId})`);
    }

    return data[coinId].usd;
  } catch (error) {
    console.error(`Error fetching current price for ${symbol}:`, error);
    throw error;
  }
}

export async function getHistoricalPrice(symbol: string, date: Date): Promise<number> {
  try {
    const coinId = getCoinId(symbol);
    const formattedDate = formatDateForApi(date);

    const response = await fetch(
      `https://api.coingecko.com/api/v3/coins/${coinId}/history?date=${formattedDate}`,
      {
        signal: AbortSignal.timeout(10000)
      }
    );

    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }

    const data = await response.json();

    if (!data.market_data?.current_price?.usd) {
      throw new Error(`Historical price not found for ${symbol} (${coinId}) on ${formattedDate}`);
    }

    return data.market_data.current_price.usd;
  } catch (error) {
    console.error(`Error fetching historical price for ${symbol}:`, error);
    throw error;
  }
}

export const SUPPORTED_CRYPTOS = [
  { symbol: 'BTC', id: 'bitcoin', name: 'Bitcoin' },
  { symbol: 'ETH', id: 'ethereum', name: 'Ethereum' },
  { symbol: 'USDT', id: 'tether', name: 'Tether' },
  { symbol: 'BNB', id: 'binancecoin', name: 'BNB' },
  { symbol: 'SOL', id: 'solana', name: 'Solana' },
  { symbol: 'XRP', id: 'ripple', name: 'XRP' },
  { symbol: 'USDC', id: 'usd-coin', name: 'USD Coin' },
  { symbol: 'ADA', id: 'cardano', name: 'Cardano' },
  { symbol: 'DOGE', id: 'dogecoin', name: 'Dogecoin' },
  { symbol: 'TRX', id: 'tron', name: 'TRON' },
  { symbol: 'AVAX', id: 'avalanche-2', name: 'Avalanche' },
  { symbol: 'DOT', id: 'polkadot', name: 'Polkadot' },
  { symbol: 'MATIC', id: 'matic-network', name: 'Polygon' },
  { symbol: 'LTC', id: 'litecoin', name: 'Litecoin' },
  { symbol: 'LINK', id: 'chainlink', name: 'Chainlink' },
  { symbol: 'ATOM', id: 'cosmos', name: 'Cosmos' },
  { symbol: 'UNI', id: 'uniswap', name: 'Uniswap' },
  { symbol: 'XLM', id: 'stellar', name: 'Stellar' },
  { symbol: 'ALGO', id: 'algorand', name: 'Algorand' },
  { symbol: 'FIL', id: 'filecoin', name: 'Filecoin' },
  { symbol: 'SUI', id: 'sui', name: 'Sui' },
  { symbol: 'APT', id: 'aptos', name: 'Aptos' },
  { symbol: 'ARB', id: 'arbitrum', name: 'Arbitrum' },
  { symbol: 'OP', id: 'optimism', name: 'Optimism' },
  { symbol: 'INJ', id: 'injective-protocol', name: 'Injective' },
  { symbol: 'TIA', id: 'celestia', name: 'Celestia' },
  { symbol: 'SEI', id: 'sei-network', name: 'Sei' },
  { symbol: 'STX', id: 'blockstack', name: 'Stacks' },
  { symbol: 'NEAR', id: 'near', name: 'NEAR Protocol' },
  { symbol: 'ICP', id: 'internet-computer', name: 'Internet Computer' },
  { symbol: 'IOTEX', id: 'iotex', name: 'IoTeX' },
  { symbol: 'HBAR', id: 'hedera-hashgraph', name: 'Hedera' },
  { symbol: 'VET', id: 'vechain', name: 'VeChain' },
  { symbol: 'FTM', id: 'fantom', name: 'Fantom' },
  { symbol: 'SAND', id: 'the-sandbox', name: 'The Sandbox' },
  { symbol: 'MANA', id: 'decentraland', name: 'Decentraland' },
  { symbol: 'AXS', id: 'axie-infinity', name: 'Axie Infinity' },
  { symbol: 'GALA', id: 'gala', name: 'Gala' },
  { symbol: 'THETA', id: 'theta-token', name: 'Theta Network' },
  { symbol: 'XTZ', id: 'tezos', name: 'Tezos' },
];

function getCoinId(symbol: string): string {
  const crypto = SUPPORTED_CRYPTOS.find(c => c.symbol.toUpperCase() === symbol.toUpperCase());
  return crypto?.id || symbol.toLowerCase();
}

export function validateSymbol(symbol: string): boolean {
  return SUPPORTED_CRYPTOS.some(c => c.symbol.toUpperCase() === symbol.toUpperCase());
}

export function searchCryptos(query: string): typeof SUPPORTED_CRYPTOS {
  if (!query) return [];

  const upperQuery = query.toUpperCase();
  return SUPPORTED_CRYPTOS.filter(crypto =>
    crypto.symbol.toUpperCase().includes(upperQuery) ||
    crypto.name.toUpperCase().includes(upperQuery)
  ).slice(0, 5);
}

function formatDateForApi(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}
