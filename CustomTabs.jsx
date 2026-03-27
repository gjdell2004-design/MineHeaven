import { useState } from "react";
import {
  Plus,
  Trash,
  PencilSimple,
  Table as TableIcon,
  Note,
  Wallet,
  CurrencyCircleDollar,
  X,
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

const TAB_TYPES = {
  expenses: {
    icon: CurrencyCircleDollar,
    label: "Expenses & Costs",
    description: "Track electricity, fees, and other expenses",
  },
  holdings: {
    icon: Wallet,
    label: "Other Crypto Holdings",
    description: "Track other crypto assets",
  },
  spreadsheet: {
    icon: TableIcon,
    label: "Custom Spreadsheet",
    description: "Create a custom data table",
  },
  notes: {
    icon: Note,
    label: "Notes & Milestones",
    description: "Keep notes and track milestones",
  },
};

const CustomTabs = ({ customTabs, setCustomTabs }) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [activeSubTab, setActiveSubTab] = useState(customTabs[0]?.id || null);
  const [formData, setFormData] = useState({
    name: "",
    type: "notes",
  });

  const addTab = (e) => {
    e.preventDefault();
    const newTab = {
      id: Date.now().toString(),
      name: formData.name || TAB_TYPES[formData.type].label,
      type: formData.type,
      data:
        formData.type === "spreadsheet"
          ? { columns: ["Column 1", "Column 2", "Column 3"], rows: [[]] }
          : formData.type === "expenses"
          ? []
          : formData.type === "holdings"
          ? []
          : "",
      createdAt: new Date().toISOString(),
    };
    setCustomTabs((prev) => [...prev, newTab]);
    setActiveSubTab(newTab.id);
    setIsAddOpen(false);
    setFormData({ name: "", type: "notes" });
  };

  const deleteTab = (id) => {
    setCustomTabs((prev) => prev.filter((t) => t.id !== id));
    if (activeSubTab === id) {
      setActiveSubTab(customTabs.find((t) => t.id !== id)?.id || null);
    }
  };

  const updateTabData = (id, data) => {
    setCustomTabs((prev) =>
      prev.map((t) => (t.id === id ? { ...t, data } : t))
    );
  };

  const activeTabData = customTabs.find((t) => t.id === activeSubTab);

  return (
    <div className="space-y-6" data-testid="custom-tabs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight uppercase">
            Custom Tabs
          </h2>
          <p className="text-sm text-[#A3B1A3] mt-1">
            Create custom tracking tabs for your needs
          </p>
        </div>
        <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
          <DialogTrigger asChild>
            <button
              className="flex items-center gap-2 px-4 py-2 bg-transparent border border-[#00FF41] text-[#00FF41] hover:bg-[#00FF41] hover:text-[#050705] transition-all text-xs tracking-[0.15em] uppercase font-bold btn-terminal"
              data-testid="add-custom-tab-btn"
            >
              <Plus size={16} weight="bold" />
              New Tab
            </button>
          </DialogTrigger>
          <DialogContent className="bg-[#0F140F] border border-[#1A241A] text-white rounded-none max-w-md">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold tracking-tight uppercase">
                Create Custom Tab
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={addTab} className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                  Tab Type
                </Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({ ...formData, type: value })
                  }
                >
                  <SelectTrigger
                    className="bg-[#050705] border-[#1A241A] text-white rounded-none"
                    data-testid="tab-type-select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0F140F] border-[#1A241A] text-white rounded-none">
                    {Object.entries(TAB_TYPES).map(([key, value]) => (
                      <SelectItem
                        key={key}
                        value={key}
                        className="hover:bg-[#1A241A]"
                      >
                        <div className="flex items-center gap-2">
                          <value.icon size={16} />
                          {value.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-[#A3B1A3]">
                  {TAB_TYPES[formData.type].description}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] tracking-[0.15em] text-[#A3B1A3] uppercase">
                  Tab Name (Optional)
                </Label>
                <Input
                  data-testid="tab-name-input"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder={TAB_TYPES[formData.type].label}
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
                  data-testid="create-tab-btn"
                  className="flex-1 bg-[#00FF41] text-[#050705] hover:bg-[#00FF41]/80 rounded-none font-bold"
                >
                  Create Tab
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Sub-tabs Navigation */}
      {customTabs.length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-[#1A241A] pb-4">
          {customTabs.map((tab) => {
            const TabIcon = TAB_TYPES[tab.type]?.icon || Note;
            return (
              <div
                key={tab.id}
                className={`flex items-center gap-2 px-3 py-2 border transition-all cursor-pointer ${
                  activeSubTab === tab.id
                    ? "border-[#00FF41] text-[#00FF41] bg-[#00FF41]/10"
                    : "border-[#1A241A] text-[#A3B1A3] hover:border-[#00FF41]/40"
                }`}
                onClick={() => setActiveSubTab(tab.id)}
                data-testid={`custom-tab-${tab.id}`}
              >
                <TabIcon size={16} />
                <span className="text-xs tracking-[0.1em] uppercase">
                  {tab.name}
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteTab(tab.id);
                  }}
                  className="ml-2 hover:text-[#FF3B30] transition-colors"
                  data-testid={`delete-tab-${tab.id}`}
                >
                  <X size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab Content */}
      {customTabs.length === 0 ? (
        <div className="bg-[#0F140F] border border-[#1A241A] p-12 text-center">
          <Note size={48} className="mx-auto mb-4 text-[#1A241A]" />
          <p className="text-[#A3B1A3] mb-4">No custom tabs created yet</p>
          <button
            onClick={() => setIsAddOpen(true)}
            className="text-[#00FF41] hover:underline text-sm"
          >
            Create your first tab
          </button>
        </div>
      ) : activeTabData ? (
        <TabContent
          tab={activeTabData}
          onUpdate={(data) => updateTabData(activeTabData.id, data)}
        />
      ) : (
        <div className="bg-[#0F140F] border border-[#1A241A] p-12 text-center">
          <p className="text-[#A3B1A3]">Select a tab to view content</p>
        </div>
      )}
    </div>
  );
};

// Tab Content Component
const TabContent = ({ tab, onUpdate }) => {
  switch (tab.type) {
    case "notes":
      return <NotesTab tab={tab} onUpdate={onUpdate} />;
    case "expenses":
      return <ExpensesTab tab={tab} onUpdate={onUpdate} />;
    case "holdings":
      return <HoldingsTab tab={tab} onUpdate={onUpdate} />;
    case "spreadsheet":
      return <SpreadsheetTab tab={tab} onUpdate={onUpdate} />;
    default:
      return <NotesTab tab={tab} onUpdate={onUpdate} />;
  }
};

// Notes Tab
const NotesTab = ({ tab, onUpdate }) => {
  return (
    <div className="bg-[#0F140F] border border-[#1A241A] p-4">
      <textarea
        value={tab.data || ""}
        onChange={(e) => onUpdate(e.target.value)}
        placeholder="Write your notes here..."
        className="w-full min-h-[300px] bg-[#050705] border border-[#1A241A] text-white p-4 font-mono text-sm focus:border-[#00FF41] focus:outline-none resize-y"
        data-testid="notes-textarea"
      />
    </div>
  );
};

// Expenses Tab
const ExpensesTab = ({ tab, onUpdate }) => {
  const [newExpense, setNewExpense] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
  });

  const expenses = tab.data || [];

  const addExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    onUpdate([
      ...expenses,
      {
        id: Date.now().toString(),
        ...newExpense,
        amount: parseFloat(newExpense.amount),
      },
    ]);
    setNewExpense({
      description: "",
      amount: "",
      date: new Date().toISOString().split("T")[0],
    });
  };

  const deleteExpense = (id) => {
    onUpdate(expenses.filter((e) => e.id !== id));
  };

  const total = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <div className="bg-[#0F140F] border border-[#1A241A] p-4 space-y-4">
      {/* Add expense form */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Description"
          value={newExpense.description}
          onChange={(e) =>
            setNewExpense({ ...newExpense, description: e.target.value })
          }
          className="bg-[#050705] border-[#1A241A] text-white rounded-none flex-1"
          data-testid="expense-description-input"
        />
        <Input
          type="number"
          placeholder="Amount ($)"
          value={newExpense.amount}
          onChange={(e) =>
            setNewExpense({ ...newExpense, amount: e.target.value })
          }
          className="bg-[#050705] border-[#1A241A] text-white rounded-none w-32"
          data-testid="expense-amount-input"
        />
        <Input
          type="date"
          value={newExpense.date}
          onChange={(e) =>
            setNewExpense({ ...newExpense, date: e.target.value })
          }
          className="bg-[#050705] border-[#1A241A] text-white rounded-none w-40"
          data-testid="expense-date-input"
        />
        <Button
          onClick={addExpense}
          className="bg-[#00FF41] text-[#050705] hover:bg-[#00FF41]/80 rounded-none font-bold"
          data-testid="add-expense-btn"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Expenses list */}
      <div className="space-y-2">
        {expenses.map((expense) => (
          <div
            key={expense.id}
            className="flex items-center justify-between p-3 bg-[#050705] border border-[#1A241A]"
            data-testid={`expense-${expense.id}`}
          >
            <div className="flex-1">
              <span className="text-white">{expense.description}</span>
              <span className="text-[#A3B1A3] text-sm ml-4">
                {new Date(expense.date).toLocaleDateString()}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#FF3B30] font-mono">
                -${expense.amount.toFixed(2)}
              </span>
              <button
                onClick={() => deleteExpense(expense.id)}
                className="text-[#A3B1A3] hover:text-[#FF3B30]"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      {expenses.length > 0 && (
        <div className="flex justify-between items-center p-3 border-t border-[#1A241A] mt-4">
          <span className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase">
            Total Expenses
          </span>
          <span
            className="text-xl font-bold text-[#FF3B30]"
            data-testid="total-expenses"
          >
            -${total.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

// Holdings Tab
const HoldingsTab = ({ tab, onUpdate }) => {
  const [newHolding, setNewHolding] = useState({
    symbol: "",
    amount: "",
    value: "",
  });

  const holdings = tab.data || [];

  const addHolding = () => {
    if (!newHolding.symbol || !newHolding.amount) return;
    onUpdate([
      ...holdings,
      {
        id: Date.now().toString(),
        ...newHolding,
        amount: parseFloat(newHolding.amount),
        value: parseFloat(newHolding.value) || 0,
      },
    ]);
    setNewHolding({ symbol: "", amount: "", value: "" });
  };

  const deleteHolding = (id) => {
    onUpdate(holdings.filter((h) => h.id !== id));
  };

  const totalValue = holdings.reduce(
    (sum, h) => sum + (h.amount * h.value || 0),
    0
  );

  return (
    <div className="bg-[#0F140F] border border-[#1A241A] p-4 space-y-4">
      {/* Add holding form */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Symbol (e.g. ETH)"
          value={newHolding.symbol}
          onChange={(e) =>
            setNewHolding({
              ...newHolding,
              symbol: e.target.value.toUpperCase(),
            })
          }
          className="bg-[#050705] border-[#1A241A] text-white rounded-none w-32"
          data-testid="holding-symbol-input"
        />
        <Input
          type="number"
          placeholder="Amount"
          value={newHolding.amount}
          onChange={(e) =>
            setNewHolding({ ...newHolding, amount: e.target.value })
          }
          className="bg-[#050705] border-[#1A241A] text-white rounded-none flex-1"
          data-testid="holding-amount-input"
        />
        <Input
          type="number"
          placeholder="Price per unit ($)"
          value={newHolding.value}
          onChange={(e) =>
            setNewHolding({ ...newHolding, value: e.target.value })
          }
          className="bg-[#050705] border-[#1A241A] text-white rounded-none w-40"
          data-testid="holding-value-input"
        />
        <Button
          onClick={addHolding}
          className="bg-[#00FF41] text-[#050705] hover:bg-[#00FF41]/80 rounded-none font-bold"
          data-testid="add-holding-btn"
        >
          <Plus size={16} />
        </Button>
      </div>

      {/* Holdings list */}
      <div className="space-y-2">
        {holdings.map((holding) => (
          <div
            key={holding.id}
            className="flex items-center justify-between p-3 bg-[#050705] border border-[#1A241A]"
            data-testid={`holding-${holding.id}`}
          >
            <div className="flex items-center gap-4">
              <span className="text-[#00FFFF] font-bold">{holding.symbol}</span>
              <span className="text-white font-mono">{holding.amount}</span>
              <span className="text-[#A3B1A3] text-sm">
                @ ${holding.value.toFixed(2)}
              </span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-[#00FF41] font-mono">
                ${(holding.amount * holding.value).toFixed(2)}
              </span>
              <button
                onClick={() => deleteHolding(holding.id)}
                className="text-[#A3B1A3] hover:text-[#FF3B30]"
              >
                <Trash size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Total */}
      {holdings.length > 0 && (
        <div className="flex justify-between items-center p-3 border-t border-[#1A241A] mt-4">
          <span className="text-[10px] tracking-[0.2em] text-[#A3B1A3] uppercase">
            Total Value
          </span>
          <span
            className="text-xl font-bold text-[#00FF41]"
            data-testid="total-holdings"
          >
            ${totalValue.toFixed(2)}
          </span>
        </div>
      )}
    </div>
  );
};

// Spreadsheet Tab
const SpreadsheetTab = ({ tab, onUpdate }) => {
  const data = tab.data || { columns: ["Column 1", "Column 2"], rows: [[]] };

  const updateCell = (rowIndex, colIndex, value) => {
    const newRows = [...data.rows];
    if (!newRows[rowIndex]) newRows[rowIndex] = [];
    newRows[rowIndex][colIndex] = value;
    onUpdate({ ...data, rows: newRows });
  };

  const addRow = () => {
    onUpdate({ ...data, rows: [...data.rows, []] });
  };

  const addColumn = () => {
    onUpdate({
      ...data,
      columns: [...data.columns, `Column ${data.columns.length + 1}`],
    });
  };

  const updateColumnName = (index, name) => {
    const newColumns = [...data.columns];
    newColumns[index] = name;
    onUpdate({ ...data, columns: newColumns });
  };

  const deleteRow = (rowIndex) => {
    const newRows = data.rows.filter((_, i) => i !== rowIndex);
    onUpdate({ ...data, rows: newRows });
  };

  return (
    <div className="bg-[#0F140F] border border-[#1A241A] p-4 space-y-4">
      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={addColumn}
          variant="outline"
          className="bg-transparent border-[#1A241A] text-[#A3B1A3] hover:border-[#00FFFF] hover:text-[#00FFFF] rounded-none text-xs"
          data-testid="add-column-btn"
        >
          <Plus size={14} className="mr-1" /> Column
        </Button>
        <Button
          onClick={addRow}
          variant="outline"
          className="bg-transparent border-[#1A241A] text-[#A3B1A3] hover:border-[#00FFFF] hover:text-[#00FFFF] rounded-none text-xs"
          data-testid="add-row-btn"
        >
          <Plus size={14} className="mr-1" /> Row
        </Button>
      </div>

      {/* Spreadsheet */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {data.columns.map((col, i) => (
                <th key={i} className="p-0">
                  <input
                    value={col}
                    onChange={(e) => updateColumnName(i, e.target.value)}
                    className="w-full min-w-[120px] p-2 bg-[#1A241A] border border-[#1A241A] text-[#A3B1A3] text-xs tracking-[0.1em] uppercase font-medium focus:border-[#00FF41] focus:outline-none"
                    data-testid={`column-header-${i}`}
                  />
                </th>
              ))}
              <th className="w-10"></th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {data.columns.map((_, colIndex) => (
                  <td key={colIndex} className="p-0">
                    <input
                      value={row[colIndex] || ""}
                      onChange={(e) =>
                        updateCell(rowIndex, colIndex, e.target.value)
                      }
                      className="w-full min-w-[120px] p-2 bg-[#050705] border border-[#1A241A] text-white font-mono text-sm focus:border-[#00FF41] focus:outline-none"
                      data-testid={`cell-${rowIndex}-${colIndex}`}
                    />
                  </td>
                ))}
                <td className="p-1">
                  <button
                    onClick={() => deleteRow(rowIndex)}
                    className="p-1 text-[#A3B1A3] hover:text-[#FF3B30]"
                  >
                    <Trash size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CustomTabs;
