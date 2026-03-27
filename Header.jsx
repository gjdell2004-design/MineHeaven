import { Lightning, ArrowUp, ArrowDown, ArrowsClockwise } from "@phosphor-icons/react";

const Header = ({ prices, pricesLoading, onRefresh }) => {
  const formatPrice = (price) => {
    if (!price || price === 0) return "$0.00";
    if (price >= 1000) {
      return `$${price.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
    return `$${price.toFixed(4)}`;
  };

  const formatChange = (change) => {
    if (!change) return "0.00%";
    return `${change >= 0 ? "+" : ""}${change.toFixed(2)}%`;
  };

  return (
    <header className="bg-[#0A0E0A] border-b border-[#1A241A] px-4 md:px-6 lg:px-8 py-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#00FF41] flex items-center justify-center">
            <Lightning size={24} weight="fill" className="text-[#050705]" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight uppercase" data-testid="app-title">
              GoMining Tracker
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase">
              Portfolio Monitor
            </p>
          </div>
        </div>

        {/* Price Tickers */}
        <div className="flex items-center gap-4">
          {/* BTC Ticker */}
          <div
            className="flex items-center gap-3 px-4 py-2 bg-[#050705] border border-[#1A241A] hover:border-[#00FF41]/40 transition-all"
            data-testid="btc-ticker"
          >
            <div className="flex flex-col">
              <span className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                BTC/USD
              </span>
              {pricesLoading ? (
                <span className="text-lg font-bold text-[#A3B1A3]">...</span>
              ) : (
                <span
                  className="text-lg font-bold text-white"
                  data-testid="btc-ticker-price"
                >
                  {formatPrice(prices.btc?.price_usd)}
                </span>
              )}
            </div>
            {!pricesLoading && prices.btc?.price_change_24h !== undefined && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  prices.btc.price_change_24h >= 0
                    ? "text-[#00FF41]"
                    : "text-[#FF3B30]"
                }`}
                data-testid="btc-ticker-change"
              >
                {prices.btc.price_change_24h >= 0 ? (
                  <ArrowUp size={14} weight="bold" />
                ) : (
                  <ArrowDown size={14} weight="bold" />
                )}
                {formatChange(prices.btc.price_change_24h)}
              </div>
            )}
          </div>

          {/* GMT Ticker */}
          <div
            className="flex items-center gap-3 px-4 py-2 bg-[#050705] border border-[#1A241A] hover:border-[#00FF41]/40 transition-all"
            data-testid="gmt-ticker"
          >
            <div className="flex flex-col">
              <span className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                GOMINING
              </span>
              {pricesLoading ? (
                <span className="text-lg font-bold text-[#A3B1A3]">...</span>
              ) : (
                <span
                  className="text-lg font-bold text-white"
                  data-testid="gmt-ticker-price"
                >
                  {formatPrice(prices.gmt?.price_usd)}
                </span>
              )}
            </div>
            {!pricesLoading && prices.gmt?.price_change_24h !== undefined && (
              <div
                className={`flex items-center gap-1 text-sm ${
                  prices.gmt.price_change_24h >= 0
                    ? "text-[#00FF41]"
                    : "text-[#FF3B30]"
                }`}
                data-testid="gmt-ticker-change"
              >
                {prices.gmt.price_change_24h >= 0 ? (
                  <ArrowUp size={14} weight="bold" />
                ) : (
                  <ArrowDown size={14} weight="bold" />
                )}
                {formatChange(prices.gmt.price_change_24h)}
              </div>
            )}
          </div>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2 border border-[#1A241A] hover:border-[#00FF41] hover:text-[#00FF41] transition-all"
            data-testid="refresh-prices-btn"
            title="Refresh prices"
          >
            <ArrowsClockwise
              size={18}
              weight="bold"
              className={pricesLoading ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
