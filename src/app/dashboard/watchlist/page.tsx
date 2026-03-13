"use client";

import { useEffect, useState } from "react";
import { getWatchlist, createWatchlistItem, deleteWatchlistItem, updateWatchlistItem, getCases } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, Plus, X, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";

interface WatchlistItem {
  id: number;
  label: string;
  target_type: string;
  target_value: string;
  priority: string;
  notes: string;
  is_active: boolean;
  case: number | null;
  case_reference: string | null;
  created_at: string;
}
interface Case { id: number; title: string; reference_id: string; }

const priorityColor: Record<string, string> = {
  low: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  medium: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  high: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  critical: "bg-red-500/20 text-red-400 border-red-500/30",
};

const TARGET_TYPES = ["person", "domain", "username", "email", "phone", "company"];
const PRIORITIES = ["low", "medium", "high", "critical"];

export default function WatchlistPage() {
  const [items, setItems] = useState<WatchlistItem[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [toggling, setToggling] = useState<number | null>(null);
  const [form, setForm] = useState({
    label: "", target_type: "person", target_value: "", priority: "medium", notes: "", case: "",
  });
  const [saving, setSaving] = useState(false);

  function fetchItems() {
    getWatchlist()
      .then((res) => setItems(res.data.results ?? res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchItems();
    getCases().then((res) => setCases(res.data.results ?? res.data));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createWatchlistItem({
        ...form,
        case: form.case ? Number(form.case) : null,
      });
      setForm({ label: "", target_type: "person", target_value: "", priority: "medium", notes: "", case: "" });
      setShowForm(false);
      fetchItems();
      toast.success("Watchlist item added");
    } catch {
      toast.error("Failed to add watchlist item");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Remove this item from the watchlist?")) return;
    setDeleting(id);
    try {
      await deleteWatchlistItem(id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      toast.success("Item removed");
    } catch {
      toast.error("Failed to remove item");
    } finally {
      setDeleting(null);
    }
  }

  async function handleToggle(item: WatchlistItem) {
    setToggling(item.id);
    try {
      await updateWatchlistItem(item.id, { is_active: !item.is_active });
      setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, is_active: !i.is_active } : i));
    } catch {
      toast.error("Failed to update item");
    } finally {
      setToggling(null);
    }
  }

  const active = items.filter((i) => i.is_active);
  const inactive = items.filter((i) => !i.is_active);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">Watchlist</h1>
          <p className="text-gray-400 text-sm mt-1">Monitor targets across your investigations</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#C4922A] hover:bg-[#A67822] text-white">
          <Plus size={16} className="mr-2" /> Add Target
        </Button>
      </div>

      {showForm && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base">Add Watch Target</CardTitle>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white" title="Close">
              <X size={16} />
            </button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-300">Label</Label>
                  <Input
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="e.g. John Doe / acme.com"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300">Target Value</Label>
                  <Input
                    value={form.target_value}
                    onChange={(e) => setForm({ ...form, target_value: e.target.value })}
                    placeholder="email, domain, username…"
                    required
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-1">
                  <Label className="text-gray-300">Type</Label>
                  <select
                    value={form.target_type}
                    onChange={(e) => setForm({ ...form, target_type: e.target.value })}
                    title="Target type"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                  >
                    {TARGET_TYPES.map((t) => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300">Priority</Label>
                  <select
                    value={form.priority}
                    onChange={(e) => setForm({ ...form, priority: e.target.value })}
                    title="Priority"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p.charAt(0).toUpperCase() + p.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-gray-300">Case <span className="text-gray-500">(optional)</span></Label>
                  <select
                    value={form.case}
                    onChange={(e) => setForm({ ...form, case: e.target.value })}
                    title="Linked case"
                    className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm"
                  >
                    <option value="">— None —</option>
                    {cases.map((c) => (
                      <option key={c.id} value={c.id}>{c.reference_id}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">Notes <span className="text-gray-500">(optional)</span></Label>
                <Input
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Additional context"
                  className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                />
              </div>
              <div className="flex gap-2">
                <Button type="submit" className="bg-[#C4922A] hover:bg-[#A67822] text-white" disabled={saving}>
                  {saving ? "Adding..." : "Add to Watchlist"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                  className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardHeader>
          <CardTitle className="text-white text-base flex items-center gap-2">
            <Eye size={16} /> Active Targets
            {active.length > 0 && (
              <span className="ml-1 text-xs bg-red-500/20 text-red-400 border border-red-500/30 rounded-full px-2 py-0.5">
                {active.length}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-14 rounded bg-gray-800 animate-pulse" />)}</div>
          ) : active.length === 0 ? (
            <div className="text-center py-12">
              <Eye size={32} className="mx-auto text-gray-700 mb-3" />
              <p className="text-gray-500">No active watch targets.</p>
              <button type="button" onClick={() => setShowForm(true)} className="mt-3 text-[#C4922A] text-sm hover:underline">
                + Add first target
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {active.map((item) => (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  deleting={deleting === item.id}
                  toggling={toggling === item.id}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {inactive.length > 0 && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2 opacity-60">
              <Eye size={16} /> Inactive Targets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-gray-800">
              {inactive.map((item) => (
                <WatchlistRow
                  key={item.id}
                  item={item}
                  onDelete={handleDelete}
                  onToggle={handleToggle}
                  deleting={deleting === item.id}
                  toggling={toggling === item.id}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function WatchlistRow({
  item, onDelete, onToggle, deleting, toggling,
}: {
  item: WatchlistItem;
  onDelete: (id: number) => void;
  onToggle: (item: WatchlistItem) => void;
  deleting: boolean;
  toggling: boolean;
}) {
  return (
    <div className={`py-4 flex items-start justify-between gap-4 ${!item.is_active ? "opacity-50" : ""}`}>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-white font-medium">{item.label}</p>
          <Badge className={`text-xs border ${priorityColor[item.priority] ?? priorityColor.medium}`}>
            {item.priority}
          </Badge>
          <Badge className="text-xs bg-gray-700/50 text-gray-400 border border-gray-600">
            {item.target_type}
          </Badge>
          {item.case_reference && (
            <Badge className="text-xs bg-[#C4922A]/10 text-[#C4922A] border border-[#C4922A]/20">
              {item.case_reference}
            </Badge>
          )}
        </div>
        <p className="text-gray-400 text-sm mt-0.5 font-mono">{item.target_value}</p>
        {item.notes && <p className="text-gray-500 text-xs mt-0.5">{item.notes}</p>}
        <p className="text-gray-600 text-xs mt-1">{new Date(item.created_at).toLocaleDateString()}</p>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <button
          type="button"
          onClick={() => onToggle(item)}
          disabled={toggling}
          title={item.is_active ? "Deactivate" : "Activate"}
          className="p-1.5 rounded text-gray-500 hover:text-[#C4922A] hover:bg-[#C4922A]/10 transition-colors"
        >
          {item.is_active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
        </button>
        <button
          type="button"
          onClick={() => onDelete(item.id)}
          disabled={deleting}
          title="Remove from watchlist"
          className="p-1.5 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
}
