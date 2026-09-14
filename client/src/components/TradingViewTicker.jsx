import { useEffect, useRef } from 'react';

/**
 * Embeds TradingView's free Ticker Tape widget — real, live prices for
 * the instruments your traders actually watch (Gold, majors, indices).
 * Same "no backend, no cost" approach as the calendar widget.
 */
export default function TradingViewTicker() {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-ticker-tape.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      symbols: [
        { proName: 'OANDA:XAUUSD', title: 'Gold' },
        { proName: 'FX:EURUSD', title: 'EUR/USD' },
        { proName: 'FX:GBPUSD', title: 'GBP/USD' },
        { proName: 'FX:USDJPY', title: 'USD/JPY' },
        { proName: 'BINANCE:BTCUSDT', title: 'BTC/USD' },
      ],
      colorTheme: 'dark',
      isTransparent: true,
      displayMode: 'adaptive',
      locale: 'en',
    });
    containerRef.current?.appendChild(script);

    return () => {
      if (containerRef.current) containerRef.current.innerHTML = '';
    };
  }, []);

  return (
    <div className="tradingview-widget-container" ref={containerRef}>
      <div className="tradingview-widget-container__widget" />
    </div>
  );
}
