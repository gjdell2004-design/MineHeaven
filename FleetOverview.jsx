import { useState } from "react";
import {
  Cube,
  Plus,
  Trash,
  PencilSimple,
  Lightning,
  CurrencyBtc,
  Coin,
  Crown,
  CaretDown,
} from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

const VIP_LEVELS = [
  { label: "No VIP", value: 0 },
  { label: "VIP 1 (0.6%)", value: 0.6 },
  { label: "VIP 2 (1.2%)", value: 1.2 },
  { label: "VIP 3 (1.8%)", value: 1.8 },
  { label: "VIP 4 (2.4%)", value: 2.4 },
  { label: "VIP 5 (3.0%)", value: 3.0 },
  { label: "VIP 6 (3.6%)", value: 3.6 },
  { label: "VIP 7 (4.2%)", value: 4.2 },
  { label: "VIP 8 (4.8%)", value: 4.8 },
  { label: "VIP 9 (5.4%)", value: 5.4 },
  { label: "VIP 10 (6.0%)", value: 6.0 },
];

const FleetOverview = ({
  miners,
  onAddMiner,
  onUpdateMiner,
  onDeleteMiner,
  btcPrice,
  fleetStats,
  settings,
  updateSettings,
  btcPriceOptions,
  getEffectiveBtcPrice,
  networkStats,
}) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingMiner, setEditingMiner] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    hashrateTh: "",
    wattagePerTh: "",
    count: "1",
  });

  const resetForm = () => {
    setFormData({
      name: "",
      hashrateTh: "",
      wattagePerTh: "",
      count: "1",
    });
    setEditingMiner(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const minerData = {
      name: formData.name || `Miner ${miners.length + 1}`,
      hashrateTh: parseFloat(formData.hashrateTh) || 0,
      wattagePerTh: parseFloat(formData.wattagePerTh) || 0,
      count: parseInt(formData.count) || 1,
    };

    if (editingMiner) {
      await onUpdateMiner(editingMiner.id, minerData);
    } else {
      await onAddMiner(minerData);
    }

    setIsAddOpen(false);
    resetForm();
  };

  const handleEdit = (miner) => {
    setFormData({
      name: miner.name,
      hashrateTh: miner.hashrateTh.toString(),
      wattagePerTh: miner.wattagePerTh.toString(),
      count: miner.count?.toString() || "1",
    });
    setEditingMiner(miner);
    setIsAddOpen(true);
  };

  const formatBtc = (value) => {
    if (!value || value === 0) return "0.00000000";
    return value.toFixed(8);
  };

  const formatUsd = (value) => {
    if (!value || value === 0) return "$0.00";
    return `$${value.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const effectivePrice = getEffectiveBtcPrice();
  const totalDiscount = (settings.vipDiscount || 0) + (settings.useGominingToken ? 20 : 0) + 3; // +3 for service button

  return (
    <div className="space-y-6" data-testid="fleet-overview">
      {/* Settings Panel */}
      <div className="bg-[#0F140F] border border-[#1A241A] p-4">
        <h3 className="text-sm font-bold tracking-[0.15em] uppercase text-[#A3B1A3] mb-4">
          Calculation Settings
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* BTC Price Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase flex items-center gap-2">
              <CurrencyBtc size={14} className="text-[#FFB000]" />
              BTC Price for Calc
            </Label>
            <Select
              value={settings.selectedBtcPrice?.toString() || "current"}
              onValueChange={(value) => {
                updateSettings({
                  ...settings,
                  selectedBtcPrice: value === "current" ? "current" : parseInt(value),
                });
              }}
            >
              <SelectTrigger
                className="bg-[#050705] border-[#1A241A] text-white rounded-none h-10"
                data-testid="btc-price-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F140F] border-[#1A241A] text-white rounded-none">
                {btcPriceOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value.toString()}
                    className="hover:bg-[#1A241A] focus:bg-[#1A241A]"
                  >
                    {option.label}
                    {option.value === "current" && btcPrice > 0 && (
                      <span className="text-[#00FF41] ml-2">
                        ({formatUsd(btcPrice)})
                      </span>
                    )}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[10px] text-[#A3B1A3]">
              Using: <span className="text-[#FFB000]">{formatUsd(effectivePrice)}</span>
            </p>
          </div>

          {/* VIP Discount Selector */}
          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase flex items-center gap-2">
              <Crown size={14} className="text-[#FFB000]" />
              VIP Discount
            </Label>
            <Select
              value={settings.vipDiscount?.toString() || "0"}
              onValueChange={(value) => {
                updateSettings({
                  ...settings,
                  vipDiscount: parseFloat(value),
                });
              }}
            >
              <SelectTrigger
                className="bg-[#050705] border-[#1A241A] text-white rounded-none h-10"
                data-testid="vip-discount-select"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#0F140F] border-[#1A241A] text-white rounded-none">
                {VIP_LEVELS.map((level) => (
                  <SelectItem
                    key={level.value}
                    value={level.value.toString()}
                    className="hover:bg-[#1A241A] focus:bg-[#1A241A]"
                  >
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* GOMINING Token Toggle */}
          <div className="space-y-2">
            <Label className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase flex items-center gap-2">
              <Coin size={14} className="text-[#00FFFF]" />
              GOMINING Token Payment
            </Label>
            <div className="flex items-center justify-between bg-[#050705] border border-[#1A241A] p-3 h-10">
              <span className="text-sm text-white">
                {settings.useGominingToken ? "20% Discount Active" : "Disabled"}
              </span>
              <Switch
                checked={settings.useGominingToken || false}
                onCheckedChange={(checked) => {
                  updateSettings({
                    ...settings,
                    useGominingToken: checked,
                  });
                }}
                data-testid="gomining-token-toggle"
                className="data-[state=checked]:bg-[#00FF41]"
              />
            </div>
          </div>
        </div>

        {/* Total Discount Display */}
        <div className="mt-4 pt-4 border-t border-[#1A241A] flex items-center justify-between">
          <span className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase">
            Total Maintenance Discount
          </span>
          <span className="text-lg font-bold text-[#00FF41]" data-testid="total-discount">
            -{totalDiscount.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Fleet Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#0F140F] border border-[#1A241A] p-4 card-terminal">
          <div className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase mb-1">
            Total Miners
          </div>
          <div
            className="text-2xl font-bold text-[#00FF41]"
            data-testid="total-miners"
          >
            {fleetStats.totalMiners}
          </div>
        </div>
        <div className="bg-[#0F140F] border border-[#1A241A] p-4 card-terminal">
          <div className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase mb-1">
            Total Hashrate
          </div>
          <div
            className="text-2xl font-bold text-[#00FFFF]"
            data-testid="total-hashrate"
          >
            {fleetStats.totalHashrate.toFixed(2)} TH
          </div>
        </div>
        <div className="bg-[#0F140F] border border-[#1A241A] p-4 card-terminal">
          <div className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase mb-1">
            Daily BTC (Est.)
          </div>
          <div
            className="text-2xl font-bold text-[#FFB000]"
            data-testid="daily-btc"
          >
            {formatBtc(fleetStats.dailyBtc)}
          </div>
        </div>
        <div className="bg-[#0F140F] border border-[#1A241A] p-4 card-terminal">
          <div className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase mb-1">
            Daily USD (Est.)
          </div>
          <div
            className="text-2xl font-bold text-[#00FF41]"
            data-testid="daily-usd"
          >
            {formatUsd(fleetStats.dailyUsd)}
          </div>
        </div>
      </div>

      {/* Add Miner Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold tracking-tight uppercase">
          Your Fleet
        </h2>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-[#050705] transition-all text-xs tracking-[0.15em] uppercase font-bold btn-terminal"
              data-testid="add-miner-btn"
              onClick={() => {
                resetForm();
                setIsAddOpen(true);
              }}
            >
              <Plus size={16} weight="bold" />
              Add Miner
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#0F140F] border border-[#1A241A] text-white rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight uppercase">
                {editingMiner ? "Edit Miner" : "Add New Miner"}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                  Miner Name
                </Label>
                <Input
                  data-testid="miner-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g. NFT Miner #1"
                  className="bg-[#050705] border-[#1A241A] text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                    Hashrate (TH)
                  </Label>
                  <Input
                    data-testid="miner-th-input"
                    type="number"
                    step="0.01"
                    value={formData.hashrateTh}
                    onChange={(e) =>
                      setFormData({ ...formData, hashrateTh: e.target.value })
                    }
                    placeholder="e.g. 10.5"
                    className="bg-[#050705] border-[#1A241A] text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                    Wattage (W/TH)
                  </Label>
                  <Input
                    data-testid="miner-wattage-input"
                    type="number"
                    step="0.1"
                    value={formData.wattagePerTh}
                    onChange={(e) =>
                      setFormData({ ...formData, wattagePerTh: e.target.value })
                    }
                    placeholder="e.g. 25"
                    className="bg-[#050705] border-[#1A241A] text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                  Count
                </Label>
                <Input
                  data-testid="miner-count-input"
                  type="number"
                  min="1"
                  value={formData.count}
                  onChange={(e) =>
                    setFormData({ ...formData, count: e.target.value })
                  }
                  placeholder="1"
                  className="bg-[#050705] border-[#1A241A] text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsAddOpen(false);
                    resetForm();
                  }}
                  className="flex-1 bg-transparent border-[#1A241A] text-[#A3B1A3] hover:border-[#00FFFF] hover:text-[#00FFFF] rounded-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  data-testid="save-miner-btn"
                  className="flex-1 bg-[#00FF41] text-[#050705] hover:bg-[#00FF41]/80 rounded-none font-bold"
                >
                  {editingMiner ? "Update" : "Add Miner"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Miners List */}
      {miners.length === 0 ? (
        <div className="bg-[#0F140F] border border-[#1A241A] p-12 text-center">
          <Cube size={48} className="mx-auto mb-4 text-[#1A241A]" />
          <p className="text-[#A3B1A3] mb-4">No miners added yet</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-[#00FF41] hover:underline text-sm"
          >
            Add your first miner
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          {miners.map((miner) => (
            <div
              key={miner.id}
              className="bg-[#0F140F] border border-[#1A241A] p-4 hover:border-[#00FF41]/40 transition-all card-terminal"
              data-testid={`miner-card-${miner.id}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Miner Info */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-[#00FF41]/10 border border-[#00FF41]/30 flex items-center justify-center">
                    <Cube size={24} className="text-[#00FF41]" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{miner.name}</h3>
                    <div className="flex items-center gap-4 text-sm text-[#A3B1A3] mt-1">
                      <span className="flex items-center gap-1">
                        <Lightning size={14} className="text-[#FFB000]" />
                        {miner.hashrateTh} TH
                      </span>
                      <span>{miner.wattagePerTh} W/TH</span>
                      <span>x{miner.count || 1}</span>
                    </div>
                  </div>
                </div>

                {/* Payout Info */}
                <div className="flex items-center gap-6">
                  {miner.lastPayout && (
                    <div className="text-right">
                      <div className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase">
                        Daily Est.
                      </div>
                      <div className="flex items-center gap-2">
                        <CurrencyBtc size={16} className="text-[#FFB000]" />
                        <span className="font-bold text-[#00FF41]">
                          {formatBtc(
                            miner.lastPayout.daily_btc_net * (miner.count || 1)
                          )}
                        </span>
                        <span className="text-[#A3B1A3] text-sm">
                          (
                          {formatUsd(
                            miner.lastPayout.daily_usd_net * (miner.count || 1)
                          )}
                          )
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleEdit(miner)}
                      className="p-2 border border-[#1A241A] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all"
                      data-testid={`edit-miner-${miner.id}`}
                      title="Edit"
                    >
                      <PencilSimple size={16} />
                    </button>
                    <button
                      onClick={() => onDeleteMiner(miner.id)}
                      className="p-2 border border-[#1A241A] hover:border-[#FF3B30] hover:text-[#FF3B30] transition-all"
                      data-testid={`delete-miner-${miner.id}`}
                      title="Delete"
                    >
                      <Trash size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FleetOverview;
