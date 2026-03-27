import { Pulse, Lightning, Cube, ArrowsClockwise, TrendUp, TrendDown } from "@phosphor-icons/react";

const NetworkStats = ({ networkStats, networkLoading, onRefresh }) => {
  const formatDifficulty = (diff) => {
    if (!diff) return "—";
    if (diff >= 1e12) {
      return `${(diff / 1e12).toFixed(2)}T`;
    }
    return diff.toLocaleString();
  };

  const formatHashrate = (hashrate) => {
    if (!hashrate) return "—";
    return `${hashrate.toFixed(2)} EH/s`;
  };

  const formatNumber = (num) => {
    if (!num) return "—";
    return num.toLocaleString();
  };

  return (
    <div className="mb-6 bg-[#0A0E0A] border border-[#1A241A] p-4" data-testid="network-stats-banner">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Title and Refresh */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-[#00FFFF]/10 border border-[#00FFFF]/30 flex items-center justify-center">
            <Pulse size={18} className="text-[#00FFFF]" />
          </div>
          <div>
            <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-white">
              Network Stats
            </h3>
            <p className="text-[10px] text-[#A3B1A3]">
              Live Bitcoin network data • Auto-updates every 5 min
            </p>
          </div>
          <button
            onClick={onRefresh}
            className="ml-2 p-1.5 border border-[#1A241A] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all"
            data-testid="refresh-network-btn"
            title="Refresh network stats"
          >
            <ArrowsClockwise
              size={14}
              weight="bold"
              className={networkLoading ? "animate-spin" : ""}
            />
          </button>
        </div>

        {/* Stats Grid */}
        <div className="flex flex-wrap items-center gap-6">
          {/* Difficulty */}
          <div className="flex items-center gap-2">
            <Lightning size={16} className="text-[#FFB000]" />
            <div>
              <div className="text-[9px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                Difficulty
              </div>
              <div className="text-sm font-bold text-[#FFB000]" data-testid="network-difficulty">
                {networkLoading ? "..." : formatDifficulty(networkStats?.difficulty)}
              </div>
            </div>
          </div>

          {/* Hashrate */}
          <div className="flex items-center gap-2">
            <Pulse size={16} className="text-[#00FFFF]" />
            <div>
              <div className="text-[9px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                Network Hashrate
              </div>
              <div className="text-sm font-bold text-[#00FFFF]" data-testid="network-hashrate">
                {networkLoading ? "..." : formatHashrate(networkStats?.hashrate_eh)}
              </div>
            </div>
          </div>

          {/* Block Height */}
          <div className="flex items-center gap-2">
            <Cube size={16} className="text-[#00FF41]" />
            <div>
              <div className="text-[9px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                Block Height
              </div>
              <div className="text-sm font-bold text-[#00FF41]" data-testid="block-height">
                {networkLoading ? "..." : formatNumber(networkStats?.block_height)}
              </div>
            </div>
          </div>

          {/* Next Adjustment */}
          {networkStats?.estimated_adjustment_percent !== null && networkStats?.estimated_adjustment_percent !== undefined && (
            <div className="flex items-center gap-2">
              {networkStats.estimated_adjustment_percent >= 0 ? (
                <TrendUp size={16} className="text-[#00FF41]" />
              ) : (
                <TrendDown size={16} className="text-[#FF3B30]" />
              )}
              <div>
                <div className="text-[9px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                  Next Adjustment
                </div>
                <div
                  className={`text-sm font-bold ${
                    networkStats.estimated_adjustment_percent >= 0
                      ? "text-[#00FF41]"
                      : "text-[#FF3B30]"
                  }`}
                  data-testid="next-adjustment"
                >
                  {networkStats.estimated_adjustment_percent >= 0 ? "+" : ""}
                  {networkStats.estimated_adjustment_percent.toFixed(2)}%
                </div>
              </div>
            </div>
          )}

          {/* Block Reward */}
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-[#FFB000] rounded-full flex items-center justify-center text-[8px] font-bold text-black">
              ₿
            </div>
            <div>
              <div className="text-[9px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                Block Reward
              </div>
              <div className="text-sm font-bold text-white" data-testid="block-reward">
                {networkStats?.block_reward || 3.125} BTC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Last Updated */}
      {networkStats?.last_updated && (
        <div className="mt-2 text-[10px] text-[#A3B1A3] text-right">
          Last updated: {new Date(networkStats.last_updated).toLocaleString()}
        </div>
      )}
    </div>
  );
};

export default NetworkStats;
