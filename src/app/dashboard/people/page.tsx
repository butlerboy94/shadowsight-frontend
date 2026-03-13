"use client";

import { useEffect, useState } from "react";
import { getPeople, getCases, createPerson, updatePerson, deletePerson } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Users, Trash2, Pencil, Check } from "lucide-react";
import { toast } from "sonner";

interface Person {
  id: number;
  first_name: string;
  last_name: string;
  email: string | null;
  phone: string;
  notes: string;
  cases: number[];
}
interface Case { id: number; title: string; reference_id: string; }

const ROLES = ["subject", "witness", "suspect", "victim", "associate"];

export default function PeoplePage() {
  const [people, setPeople] = useState<Person[]>([]);
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ first_name: "", last_name: "", email: "", phone: "", role: "subject", case: "" });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Edit state
  const [editId, setEditId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({ first_name: "", last_name: "", email: "", phone: "", notes: "" });
  const [editSaving, setEditSaving] = useState(false);

  function fetchPeople() {
    getPeople()
      .then((res) => setPeople(res.data.results ?? res.data))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    fetchPeople();
    getCases().then((res) => setCases(res.data.results ?? res.data));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await createPerson({ ...form, case: form.case ? Number(form.case) : undefined });
      setForm({ first_name: "", last_name: "", email: "", phone: "", role: "subject", case: "" });
      setShowForm(false);
      fetchPeople();
      toast.success("Person added successfully");
    } catch {
      toast.error("Failed to add person");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this person? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await deletePerson(id);
      setPeople((prev) => prev.filter((p) => p.id !== id));
      toast.success("Person deleted");
    } catch {
      toast.error("Failed to delete person");
    } finally {
      setDeleting(null);
    }
  }

  function startEdit(p: Person) {
    setEditId(p.id);
    setEditForm({
      first_name: p.first_name,
      last_name: p.last_name,
      email: p.email ?? "",
      phone: p.phone ?? "",
      notes: p.notes ?? "",
    });
  }

  async function handleEditSave(id: number) {
    setEditSaving(true);
    try {
      await updatePerson(id, editForm);
      setPeople((prev) => prev.map((p) => p.id === id ? { ...p, ...editForm } : p));
      setEditId(null);
      toast.success("Person updated");
    } catch {
      toast.error("Failed to update person");
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-white">People</h1>
          <p className="text-gray-400 text-sm mt-1">Subjects and persons of interest</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-[#C4922A] hover:bg-[#A67822] text-white">
          <Plus size={16} className="mr-2" /> Add Person
        </Button>
      </div>

      {showForm && (
        <Card className="bg-gray-900 border-gray-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-white text-base">Add Person</CardTitle>
            <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white"><X size={16} /></button>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="grid grid-cols-2 gap-4">
              {(["first_name", "last_name", "email", "phone"] as const).map((field) => (
                <div key={field} className="space-y-1">
                  <Label className="text-gray-300 capitalize">{field.replace("_", " ")}</Label>
                  <Input
                    value={form[field]}
                    onChange={(e) => setForm({ ...form, [field]: e.target.value })}
                    className="bg-gray-800 border-gray-700 text-white placeholder:text-gray-500"
                  />
                </div>
              ))}
              <div className="space-y-1">
                <Label className="text-gray-300">Role</Label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm">
                  {ROLES.map((r) => (
                    <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label className="text-gray-300">Link to Case</Label>
                <select value={form.case} onChange={(e) => setForm({ ...form, case: e.target.value })}
                  className="w-full rounded-md bg-gray-800 border border-gray-700 text-white px-3 py-2 text-sm">
                  <option value="">— None —</option>
                  {cases.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <div className="flex gap-2">
                  <Button type="submit" className="bg-[#C4922A] hover:bg-[#A67822] text-white" disabled={saving}>
                    {saving ? "Saving..." : "Add Person"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}
                    className="border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gray-900 border-gray-800">
        <CardContent className="pt-4">
          {loading ? (
            <div className="space-y-3">{[...Array(4)].map((_, i) => <div key={i} className="h-12 rounded bg-gray-800 animate-pulse" />)}</div>
          ) : people.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-14 h-14 rounded-full bg-gray-800 flex items-center justify-center mx-auto mb-4">
                <Users size={24} className="text-gray-600" />
              </div>
              <p className="text-white font-medium">No subjects yet</p>
              <p className="text-gray-500 text-sm mt-1">Add people to link them to your cases</p>
              <button type="button" onClick={() => setShowForm(true)} className="mt-4 text-[#C4922A] text-sm hover:underline">
                + Add first person
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-800">
              {people.map((p) => (
                <div key={p.id}>
                  {editId === p.id ? (
                    <div className="py-4 space-y-3">
                      <div className="grid grid-cols-2 gap-3">
                        {(["first_name", "last_name", "email", "phone"] as const).map((field) => (
                          <div key={field} className="space-y-1">
                            <Label className="text-gray-400 text-xs capitalize">{field.replace("_", " ")}</Label>
                            <Input
                              value={editForm[field]}
                              onChange={(e) => setEditForm({ ...editForm, [field]: e.target.value })}
                              className="bg-gray-800 border-gray-700 text-white text-sm h-8 placeholder:text-gray-600"
                            />
                          </div>
                        ))}
                      </div>
                      <div className="space-y-1">
                        <Label className="text-gray-400 text-xs">Notes</Label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                          rows={2}
                          className="w-full rounded-md bg-gray-800 border border-gray-700 text-white text-sm px-3 py-2 placeholder:text-gray-600 resize-none"
                          placeholder="Additional notes..."
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button type="button" onClick={() => handleEditSave(p.id)}
                          disabled={editSaving}
                          className="h-7 px-3 text-xs bg-[#C4922A] hover:bg-[#A67822] text-white">
                          <Check size={12} className="mr-1" />{editSaving ? "Saving..." : "Save"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setEditId(null)}
                          className="h-7 px-3 text-xs border-gray-700 text-gray-300 hover:bg-gray-800">Cancel</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium">{p.first_name} {p.last_name}</p>
                        <p className="text-gray-400 text-xs mt-0.5">
                          {p.email}{p.phone ? ` · ${p.phone}` : ""}
                        </p>
                        {p.notes && <p className="text-gray-500 text-xs mt-0.5 truncate">{p.notes}</p>}
                      </div>
                      <div className="flex items-center gap-2 ml-4 shrink-0">
                        <Badge className="text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30">
                          {p.cases?.length ?? 0} case{p.cases?.length !== 1 ? "s" : ""}
                        </Badge>
                        <button
                          type="button"
                          onClick={() => startEdit(p)}
                          title="Edit person"
                          className="p-1 rounded text-gray-600 hover:text-[#C4922A] hover:bg-[#C4922A]/10 transition-colors"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id)}
                          disabled={deleting === p.id}
                          title="Delete person"
                          className="p-1 rounded text-gray-600 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
