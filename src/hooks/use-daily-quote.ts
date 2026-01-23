import { useState, useEffect } from 'react';
import { TRADING_QUOTES } from '@/data/quotes';

export function useDailyQuote() {
  const [quote, setQuote] = useState<string>('');

  useEffect(() => {
    // Pick a random quote on every mount (refresh)
    const randomIndex = Math.floor(Math.random() * TRADING_QUOTES.length);
    setQuote(TRADING_QUOTES[randomIndex]);
  }, []);

  return quote;
}
