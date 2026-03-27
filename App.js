import { useState, useEffect, useCallback, useRef } from "react";
import "@/App.css";
import axios from "axios";
import { Toaster, toast } from "sonner";

// Components
import Header from "./components/Header";
import FleetOverview from "./components/FleetOverview";
import PayoutLog from "./components/PayoutLog";
import CustomTabs from "./components/CustomTabs";
import NetworkStats from "./components/NetworkStats";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

// LocalStorage keys
const STORAGE_KEYS = {
  MINERS: "gomining_miners",
  PAYOUTS: "gomining_payouts",
  CUSTOM_TABS: "gomining_custom_tabs",
  SETTINGS: "gomining_settings",
};

// BTC price options for calculation
const BTC_PRICE_OPTIONS = [
  { label: "Current", value: "current" },
  { label: "$70,000", value: 70000 },
  { label: "$80,000", value: 80000 },
  { label: "$90,000", value: 90000 },
  { label: "$100,000", value: 100000 },
  { label: "$110,000", value: 110000 },
  { label: "$120,000", value: 120000 },
  { label: "$130,000", value: 130000 },
  { label: "$140,000", value: 140000 },
  { label: "$150,000", value: 150000 },
];

function App() {
  // Track if component has mounted (for localStorage)
  const hasMounted = useRef(false);

  // Price state
  const [prices, setPrices] = useState({
    btc: { price_usd: 0, price_change_24h: 0, symbol: "BTC" },
    gmt: { price_usd: 0, price_change_24h: 0, symbol: "GOMINING" },
  });
  const [pricesLoading, setPricesLoading] = useState(true);

  // Network stats state
  const [networkStats, setNetworkStats] = useState(null);
  const [networkLoading, setNetworkLoading] = useState(true);

  // Miners state
  const [miners, setMiners] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.MINERS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Payouts state
  const [payouts, setPayouts] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PAYOUTS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Custom tabs state
  const [customTabs, setCustomTabs] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.CUSTOM_TABS);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Settings state (VIP discount, GOMINING toggle, BTC price selection)
  const [settings, setSettings] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : {
        vipDiscount: 0,
        useGominingToken: false,
        selectedBtcPrice: "current",
      };
    } catch {
      return {
        vipDiscount: 0,
        useGominingToken: false,
        selectedBtcPrice: "current",
      };
    }
  });

  // Active tab
  const [activeTab, setActiveTab] = useState("fleet");

  // Fetch prices
  const fetchPrices = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/prices`);
      if (response.data) {
        setPrices({
          btc: response.data.btc || { price_usd: 0, price_change_24h: 0, symbol: "BTC" },
          gmt: response.data.gmt || { price_usd: 0, price_change_24h: 0, symbol: "GOMINING" },
        });
      }
    } catch (error) {
      console.error("Failed to fetch prices:", error);
    } finally {
      setPricesLoading(false);
    }
  }, []);

  // Initial price fetch and interval
  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 30000); // Every 30 seconds
    return () => clearInterval(interval);
  }, [fetchPrices]);

  // Fetch network stats
  const fetchNetworkStats = useCallback(async () => {
    try {
      const response = await axios.get(`${API}/network-stats`);
      if (response.data) {
        setNetworkStats(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch network stats:", error);
    } finally {
      setNetworkLoading(false);
    }
  }, []);

  // Initial network stats fetch and interval
  useEffect(() => {
    fetchNetworkStats();
    const interval = setInterval(fetchNetworkStats, 60000); // Every 60 seconds
    return () => clearInterval(interval);
  }, [fetchNetworkStats]);

  // Mark as mounted after first render
  useEffect(() => {
    hasMounted.current = true;
  }, []);

  // Save miners to localStorage
  useEffect(() => {
    if (hasMounted.current) {
      localStorage.setItem(STORAGE_KEYS.MINERS, JSON.stringify(miners));
    }
  }, [miners]);

  // Save payouts to localStorage
  useEffect(() => {
    if (hasMounted.current) {
      localStorage.setItem(STORAGE_KEYS.PAYOUTS, JSON.stringify(payouts));
    }
  }, [payouts]);

  // Save custom tabs to localStorage
  useEffect(() => {
    if (hasMounted.current) {
      localStorage.setItem(STORAGE_KEYS.CUSTOM_TABS, JSON.stringify(customTabs));
    }
  }, [customTabs]);

  // Save settings to localStorage
  useEffect(() => {
    if (hasMounted.current) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    }
  }, [settings]);

  // Get effective BTC price for calculations
  const getEffectiveBtcPrice = useCallback((overrideSettings = null) => {
    const currentSettings = overrideSettings || settings;
    if (currentSettings.selectedBtcPrice === "current") {
      return prices.btc.price_usd;
    }
    return currentSettings.selectedBtcPrice;
  }, [settings, prices.btc.price_usd]);

  // Calculate payout for a miner
  const calculatePayout = useCallback(async (miner, overrideSettings = null) => {
    try {
      const currentSettings = overrideSettings || settings;
      const effectivePrice = getEffectiveBtcPrice(currentSettings);
      const response = await axios.post(`${API}/calculate-payout`, {
        hashrate_th: miner.hashrateTh,
        wattage_per_th: miner.wattagePerTh,
        btc_price: effectivePrice,
        vip_discount: currentSettings.vipDiscount || 0,
        gomining_discount: currentSettings.useGominingToken ? 20 : 0,
        service_button_discount: 3, // Assume daily service button pressed
      });
      return response.data;
    } catch (error) {
      console.error("Failed to calculate payout:", error);
      return null;
    }
  }, [settings, getEffectiveBtcPrice]);

  // Add miner
  const addMiner = async (minerData) => {
    const newMiner = {
      id: Date.now().toString(),
      ...minerData,
      createdAt: new Date().toISOString(),
    };

    const payout = await calculatePayout(newMiner);
    if (payout) {
      newMiner.lastPayout = payout;
    }

    setMiners((prev) => [...prev, newMiner]);
    toast.success("Miner added successfully");
    return newMiner;
  };

  // Recalculate all miners with specific settings
  const recalculateAllMiners = useCallback(async (newSettings) => {
    if (miners.length === 0) return;
    
    const updatedMiners = await Promise.all(
      miners.map(async (miner) => {
        const payout = await calculatePayout(miner, newSettings);
        return { ...miner, lastPayout: payout || miner.lastPayout };
      })
    );
    setMiners(updatedMiners);
    toast.success("Payouts recalculated");
  }, [miners, calculatePayout]);

  // Update settings and recalculate
  const updateSettings = useCallback(async (newSettings) => {
    setSettings(newSettings);
    // Recalculate with the new settings immediately
    await recalculateAllMiners(newSettings);
  }, [recalculateAllMiners]);

  // Update miner
  const updateMiner = async (id, minerData) => {
    const updatedMiner = { ...minerData };
    const payout = await calculatePayout(updatedMiner);
    if (payout) {
      updatedMiner.lastPayout = payout;
    }

    setMiners((prev) =>
      prev.map((m) => (m.id === id ? { ...m, ...updatedMiner } : m))
    );
    toast.success("Miner updated");
  };

  // Delete miner
  const deleteMiner = (id) => {
    setMiners((prev) => prev.filter((m) => m.id !== id));
    toast.success("Miner removed");
  };

  // Log payout
  const logPayout = (payout) => {
    const newPayout = {
      id: Date.now().toString(),
      ...payout,
      date: new Date().toISOString(),
    };
    setPayouts((prev) => [newPayout, ...prev]);
  };

  // Calculate total fleet stats
  const fleetStats = miners.reduce(
    (acc, miner) => {
      acc.totalHashrate += miner.hashrateTh * (miner.count || 1);
      acc.totalMiners += miner.count || 1;
      if (miner.lastPayout) {
        acc.dailyBtc += miner.lastPayout.daily_btc_net * (miner.count || 1);
        acc.dailyUsd += miner.lastPayout.daily_usd_net * (miner.count || 1);
      }
      return acc;
    },
    { totalHashrate: 0, totalMiners: 0, dailyBtc: 0, dailyUsd: 0 }
  );

  return (
    <div className="app-container min-h-screen" data-testid="app-container">
      <Toaster 
        position="top-right" 
        toastOptions={{
          style: {
            background: '#0F140F',
            border: '1px solid #1A241A',
            color: '#FFFFFF',
          },
        }}
      />
      
      {/* Header with price tickers */}
      <Header
        prices={prices}
        pricesLoading={pricesLoading}
        onRefresh={fetchPrices}
      />

      {/* Main content */}
      <main className="p-4 md:p-6 lg:p-8">
        {/* Navigation Tabs */}
        <nav className="flex border-b border-[#1A241A] mb-6 overflow-x-auto">
          <button
            data-testid="tab-fleet"
            onClick={() => setActiveTab("fleet")}
            className={`px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all ${
              activeTab === "fleet"
                ? "border-b-2 border-[#00FF41] text-[#00FF41]"
                : "text-[#A3B1A3] hover:text-white"
            }`}
          >
            Fleet Overview
          </button>
          <button
            data-testid="tab-payout"
            onClick={() => setActiveTab("payout")}
            className={`px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all ${
              activeTab === "payout"
                ? "border-b-2 border-[#00FF41] text-[#00FF41]"
                : "text-[#A3B1A3] hover:text-white"
            }`}
          >
            Payout Log
          </button>
          <button
            data-testid="tab-custom"
            onClick={() => setActiveTab("custom")}
            className={`px-6 py-3 text-xs tracking-[0.2em] uppercase transition-all ${
              activeTab === "custom"
                ? "border-b-2 border-[#00FF41] text-[#00FF41]"
                : "text-[#A3B1A3] hover:text-white"
            }`}
          >
            Custom Tabs
          </button>
        </nav>

        {/* Network Stats Banner */}
        <NetworkStats 
          networkStats={networkStats} 
          networkLoading={networkLoading}
          onRefresh={fetchNetworkStats}
        />

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "fleet" && (
            <FleetOverview
              miners={miners}
              onAddMiner={addMiner}
              onUpdateMiner={updateMiner}
              onDeleteMiner={deleteMiner}
              btcPrice={prices.btc.price_usd}
              fleetStats={fleetStats}
              settings={settings}
              updateSettings={updateSettings}
              btcPriceOptions={BTC_PRICE_OPTIONS}
              getEffectiveBtcPrice={getEffectiveBtcPrice}
              networkStats={networkStats}
            />
          )}

          {activeTab === "payout" && (
            <PayoutLog
              payouts={payouts}
              miners={miners}
              onLogPayout={logPayout}
              setPayouts={setPayouts}
              btcPrice={prices.btc.price_usd}
            />
          )}

          {activeTab === "custom" && (
            <CustomTabs
              customTabs={customTabs}
              setCustomTabs={setCustomTabs}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default App;
