import { useState, useMemo } from "react";
import {
  Plus,
  Trash,
  Calendar,
  CurrencyBtc,
  DownloadSimple,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

const PayoutLog = ({ payouts, miners, onLogPayout, setPayouts, btcPrice }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [formData, setFormData] = useState({
    minerId: "",
    amount_btc: "",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const amountBtc = parseFloat(formData.amount_btc) || 0;
    const miner = miners.find((m) => m.id === formData.minerId);

    onLogPayout({
      minerId: formData.minerId,
      minerName: miner?.name || "Unknown",
      amount_btc: amountBtc,
      amount_usd: amountBtc * btcPrice,
      date: formData.date,
      notes: formData.notes,
    });

    setIsAddOpen(false);
    setFormData({
      minerId: "",
      amount_btc: "",
      date: new Date().toISOString().split("T")[0],
      notes: "",
    });
  };

  const deletePayout = (id) => {
    setPayouts((prev) => prev.filter((p) => p.id !== id));
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Calculate totals
  const totals = useMemo(() => {
    return payouts.reduce(
      (acc, p) => {
        acc.totalBtc += p.amount_btc || 0;
        acc.totalUsd += p.amount_usd || 0;
        return acc;
      },
      { totalBtc: 0, totalUsd: 0 }
    );
  }, [payouts]);

  // Export to CSV
  const exportCSV = () => {
    const headers = ["Date", "Miner", "BTC Amount", "USD Value", "Notes"];
    const rows = payouts.map((p) => [
      formatDate(p.date),
      p.minerName,
      p.amount_btc,
      p.amount_usd,
      p.notes || "",
    ]);

    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payout-log-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6" data-testid="payout-log">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase">
            Payout Log
          </h2>
          <p className="text-sm text-[#A3B1A3] mt-1">
            Track your daily mining payouts
          </p>
        </div>
        <div className="flex gap-3">
          {payouts.length > 0 && (
            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#1A241A] text-[#A3B1A3] hover:border-[#00FFFF] hover:text-[#00FFFF] transition-all text-xs tracking-[0.15em] uppercase"
              data-testid="export-csv-btn"
            >
              <DownloadSimple size={16} />
              Export CSV
            </button>
          )}
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <button
                className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-[#050705] transition-all text-xs tracking-[0.15em] uppercase font-bold btn-terminal"
                data-testid="log-payout-btn"
              >
                <Plus size={16} weight="bold" />
                Log Payout
              </button>
            </DialogTrigger>
            <DialogContent className="bg-[#0F140F] border border-[#1A241A] text-white rounded-none max-w-md">
              <DialogHeader>
                <DialogTitle className="text-lg font-bold tracking-tight uppercase">
                  Log Payout
                </DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                    Miner
                  </Label>
                  <Select
                    value={formData.minerId}
                    onValueChange={(value) =>
                      setFormData({ ...formData, minerId: value })
                    }
                  >
                    <SelectTrigger
                      className="bg-[#050705] border-[#1A241A] text-white rounded-none"
                      data-testid="payout-miner-select"
                    >
                      <SelectValue placeholder="Select miner" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#0F140F] border-[#1A241A] text-white rounded-none">
                      <SelectItem value="all" className="hover:bg-[#1A241A]">
                        All Miners
                      </SelectItem>
                      {miners.map((miner) => (
                        <SelectItem
                          key={miner.id}
                          value={miner.id}
                          className="hover:bg-[#1A241A]"
                        >
                          {miner.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                      BTC Amount
                    </Label>
                    <Input
                      data-testid="payout-amount-input"
                      type="number"
                      step="0.00000001"
                      value={formData.amount_btc}
                      onChange={(e) =>
                        setFormData({ ...formData, amount_btc: e.target.value })
                      }
                      placeholder="0.00000000"
                      className="bg-[#050705] border-[#1A241A] text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                      Date
                    </Label>
                    <Input
                      data-testid="payout-date-input"
                      type="date"
                      value={formData.date}
                      onChange={(e) =>
                        setFormData({ ...formData, date: e.target.value })
                      }
                      className="bg-[#050705] border-[#1A241A] text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50"
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                    Notes (Optional)
                  </Label>
                  <Input
                    data-testid="payout-notes-input"
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder="Any notes..."
                    className="bg-[#050705] border-[#1A241A] text-white rounded-none focus:border-[#00FF41] focus:ring-1 focus:ring-[#00FF41]/50"
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsAddOpen(false)}
                    className="flex-1 bg-transparent border-[#1A241A] text-[#A3B1A3] hover:border-[#00FFFF] hover:text-[#00FFFF] rounded-none"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    data-testid="save-payout-btn"
                    className="flex-1 bg-[#00FF41] text-[#050705] hover:bg-[#00FF41]/80 rounded-none font-bold"
                  >
                    Log Payout
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Totals Summary */}
      {payouts.length > 0 && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#0F140F] border border-[#1A241A] p-4">
            <div className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase mb-1">
              Total BTC Earned
            </div>
            <div
              className="text-2xl font-bold text-[#FFB000] flex items-center gap-2"
              data-testid="total-btc-earned"
            >
              <CurrencyBtc size={24} />
              {formatBtc(totals.totalBtc)}
            </div>
          </div>
          <div className="bg-[#0F140F] border border-[#1A241A] p-4">
            <div className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase mb-1">
              Total USD Value
            </div>
            <div
              className="text-2xl font-bold text-[#00FF41]"
              data-testid="total-usd-earned"
            >
              {formatUsd(totals.totalUsd)}
            </div>
          </div>
        </div>
      )}

      {/* Payout Table */}
      {payouts.length === 0 ? (
        <div className="bg-[#0F140F] border border-[#1A241A] p-12 text-center">
          <Calendar size={48} className="mx-auto mb-4 text-[#1A241A]" />
          <p className="text-[#A3B1A3] mb-4">No payouts logged yet</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-[#00FF41] hover:underline text-sm"
          >
            Log your first payout
          </button>
        </div>
      ) : (
        <div className="bg-[#0F140F] border border-[#1A241A] overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-[#1A241A] hover:bg-transparent">
                  <TableHead className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase font-medium">
                    Date
                  </TableHead>
                  <TableHead className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase font-medium">
                    Miner
                  </TableHead>
                  <TableHead className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase font-medium text-right">
                    BTC
                  </TableHead>
                  <TableHead className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase font-medium text-right">
                    USD
                  </TableHead>
                  <TableHead className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase font-medium">
                    Notes
                  </TableHead>
                  <TableHead className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase font-medium w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow
                    key={payout.id}
                    className="border-b border-[#1A241A] hover:bg-[#1A241A]/30"
                    data-testid={`payout-row-${payout.id}`}
                  >
                    <TableCell className="text-white">
                      {formatDate(payout.date)}
                    </TableCell>
                    <TableCell className="text-[#A3B1A3]">
                      {payout.minerName}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[#FFB000]">
                      {formatBtc(payout.amount_btc)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-[#00FF41]">
                      {formatUsd(payout.amount_usd)}
                    </TableCell>
                    <TableCell className="text-[#A3B1A3] max-w-[200px] truncate">
                      {payout.notes || "-"}
                    </TableCell>
                    <TableCell>
                      <button
                        onClick={() => deletePayout(payout.id)}
                        className="p-1 hover:text-[#FF3B30] transition-colors"
                        data-testid={`delete-payout-${payout.id}`}
                        title="Delete"
                      >
                        <Trash size={16} />
                      </button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PayoutLog;
