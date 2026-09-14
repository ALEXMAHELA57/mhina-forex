import { useEffect, useRef } from 'react';

/**
 * Embeds TradingView's free Economic Calendar widget — real, live-updating
 * economic events (NFP, CPI, interest rate decisions, etc.), fetched and
 * maintained by TradingView. No API key, no backend, no cost. Visible to
 * any visitor, logged in or not.
 */
export default function TradingViewCalendar() {
  const containerRef = useRef(null);

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-events.js';
    script.type = 'text/javascript';
    script.async = true;
    script.innerHTML = JSON.stringify({
      colorTheme: 'dark',
      isTransparent: true,
      width: '100%',
      height: '500',
      locale: 'en',
      importanceFilter: '-1,0,1',
      countryFilter: 'us,eu,gb,jp,au,ca,nz,ch,cn',
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
