"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getProfile, updateProfile, changePassword } from "@/lib/api";
import { Save, Lock } from "lucide-react";

interface Profile {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  profile: {
    organization: string;
    role: string;
    phone: string;
    bio: string;
    avatar: string | null;
    updated_at: string;
  };
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    profile: { organization: "", phone: "", bio: "" },
  });
  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);

  useEffect(() => {
    getProfile().then((res) => {
      const p: Profile = res.data;
      setProfile(p);
      setForm({
        first_name: p.first_name || "",
        last_name: p.last_name || "",
        email: p.email || "",
        profile: {
          organization: p.profile?.organization || "",
          phone: p.profile?.phone || "",
          bio: p.profile?.bio || "",
        },
      });
    });
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await updateProfile(form);
      setProfile(res.data);
      toast.success("Profile saved.");
    } catch {
      toast.error("Failed to save profile.");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwForm.new_password !== pwForm.confirm_password) {
      toast.error("New passwords do not match.");
      return;
    }
    setSavingPw(true);
    try {
      await changePassword({
        current_password: pwForm.current_password,
        new_password: pwForm.new_password,
      });
      toast.success("Password changed successfully.");
      setPwForm({ current_password: "", new_password: "", confirm_password: "" });
    } catch (err: unknown) {
      const e = err as { response?: { data?: { detail?: string } } };
      toast.error(e.response?.data?.detail || "Failed to change password.");
    } finally {
      setSavingPw(false);
    }
  };

  if (!profile) {
    return <p className="text-gray-400 text-sm p-4">Loading...</p>;
  }

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Account Settings</h1>
        <p className="text-gray-400 text-sm mt-1">Manage your profile and security</p>
      </div>

      {/* Profile Info */}
      <form onSubmit={handleSave} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-white font-semibold">Profile</h2>
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded capitalize">
            {profile.profile?.role || "investigator"}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">First Name</label>
            <input
              value={form.first_name}
              onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Last Name</label>
            <input
              value={form.last_name}
              onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-gray-400 text-xs mb-1 block">Email</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Organization</label>
            <input
              value={form.profile.organization}
              onChange={(e) => setForm({ ...form, profile: { ...form.profile, organization: e.target.value } })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Phone</label>
            <input
              value={form.profile.phone}
              onChange={(e) => setForm({ ...form, profile: { ...form.profile, phone: e.target.value } })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
          <div className="md:col-span-2">
            <label className="text-gray-400 text-xs mb-1 block">Bio</label>
            <textarea
              rows={3}
              value={form.profile.bio}
              onChange={(e) => setForm({ ...form, profile: { ...form.profile, bio: e.target.value } })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A] resize-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>Username: <strong className="text-gray-300">@{profile.username}</strong></span>
          {profile.is_superuser && <span className="bg-[#C4922A]/20 text-[#C4922A] px-2 py-0.5 rounded">Superuser</span>}
        </div>

        <button
          type="submit"
          disabled={saving}
          className="flex items-center gap-2 bg-[#C4922A] hover:bg-[#a87820] disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? "Saving..." : "Save Profile"}
        </button>
      </form>

      {/* Change Password */}
      <form onSubmit={handlePasswordChange} className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Lock className="w-4 h-4 text-[#C4922A]" />
          <h2 className="text-white font-semibold">Change Password</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Current Password</label>
            <input
              type="password"
              required
              value={pwForm.current_password}
              onChange={(e) => setPwForm({ ...pwForm, current_password: e.target.value })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={pwForm.new_password}
              onChange={(e) => setPwForm({ ...pwForm, new_password: e.target.value })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
          <div>
            <label className="text-gray-400 text-xs mb-1 block">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={pwForm.confirm_password}
              onChange={(e) => setPwForm({ ...pwForm, confirm_password: e.target.value })}
              className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={savingPw}
          className="flex items-center gap-2 bg-[#C4922A] hover:bg-[#a87820] disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
        >
          <Lock className="w-4 h-4" />
          {savingPw ? "Updating..." : "Update Password"}
        </button>
      </form>
    </div>
  );
}
