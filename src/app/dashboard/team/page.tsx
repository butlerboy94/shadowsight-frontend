"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { getTeamMembers, inviteTeamMember, updateTeamMemberRole, removeTeamMember } from "@/lib/api";
import { UserPlus, Trash2, Shield } from "lucide-react";

interface TeamMember {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  organization: string;
}

const ROLES = [
  { value: "investigator", label: "Investigator" },
  { value: "analyst", label: "Analyst" },
  { value: "supervisor", label: "Supervisor" },
  { value: "admin", label: "Admin" },
];

const ROLE_COLORS: Record<string, string> = {
  admin: "text-[#C4922A] bg-[#C4922A]/10",
  supervisor: "text-blue-400 bg-blue-400/10",
  analyst: "text-purple-400 bg-purple-400/10",
  investigator: "text-gray-300 bg-gray-700",
};

export default function TeamPage() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);
  const [inviteData, setInviteData] = useState({
    username: "",
    email: "",
    password: "",
    first_name: "",
    last_name: "",
    role: "investigator",
  });
  const [submitting, setSubmitting] = useState(false);

  const load = async () => {
    try {
      const res = await getTeamMembers();
      setMembers(res.data);
    } catch {
      toast.error("Failed to load team members.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await inviteTeamMember(inviteData);
      toast.success(`${inviteData.username} added to the team.`);
      setShowInvite(false);
      setInviteData({ username: "", email: "", password: "", first_name: "", last_name: "", role: "investigator" });
      load();
    } catch (err: unknown) {
      const e = err as { response?: { data?: Record<string, string[]> } };
      const msg = e.response?.data
        ? Object.values(e.response.data).flat().join(" ")
        : "Failed to invite member.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRoleChange = async (member: TeamMember, newRole: string) => {
    try {
      await updateTeamMemberRole(member.id, newRole);
      setMembers((prev) => prev.map((m) => m.id === member.id ? { ...m, role: newRole } : m));
      toast.success(`${member.username}'s role updated to ${newRole}.`);
    } catch {
      toast.error("Failed to update role.");
    }
  };

  const handleRemove = async (member: TeamMember) => {
    if (!confirm(`Remove ${member.username} from the team?`)) return;
    try {
      await removeTeamMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
      toast.success(`${member.username} removed.`);
    } catch {
      toast.error("Failed to remove member.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Team</h1>
          <p className="text-gray-400 text-sm mt-1">Manage team members and roles</p>
        </div>
        <button
          onClick={() => setShowInvite((v) => !v)}
          className="flex items-center gap-2 bg-[#C4922A] hover:bg-[#a87820] text-black font-semibold px-4 py-2 rounded-lg text-sm transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Invite Member
        </button>
      </div>

      {/* Invite Form */}
      {showInvite && (
        <form
          onSubmit={handleInvite}
          className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl p-5 space-y-4"
        >
          <h2 className="text-white font-semibold">New Team Member</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Username *</label>
              <input
                required
                value={inviteData.username}
                onChange={(e) => setInviteData({ ...inviteData, username: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Email *</label>
              <input
                required
                type="email"
                value={inviteData.email}
                onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">First Name</label>
              <input
                value={inviteData.first_name}
                onChange={(e) => setInviteData({ ...inviteData, first_name: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Last Name</label>
              <input
                value={inviteData.last_name}
                onChange={(e) => setInviteData({ ...inviteData, last_name: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Password *</label>
              <input
                required
                type="password"
                minLength={8}
                value={inviteData.password}
                onChange={(e) => setInviteData({ ...inviteData, password: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
              />
            </div>
            <div>
              <label className="text-gray-400 text-xs mb-1 block">Role *</label>
              <select
                value={inviteData.role}
                onChange={(e) => setInviteData({ ...inviteData, role: e.target.value })}
                className="w-full bg-[#111] border border-[#333] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-[#C4922A]"
              >
                {ROLES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={submitting}
              className="bg-[#C4922A] hover:bg-[#a87820] disabled:opacity-50 text-black font-semibold px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {submitting ? "Adding..." : "Add Member"}
            </button>
            <button
              type="button"
              onClick={() => setShowInvite(false)}
              className="text-gray-400 hover:text-white px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {/* Members Table */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl overflow-hidden">
        {loading ? (
          <p className="text-gray-400 p-6 text-sm">Loading...</p>
        ) : members.length === 0 ? (
          <p className="text-gray-400 p-6 text-sm">No team members found.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2a2a2a] text-gray-400 text-xs uppercase">
                <th className="px-5 py-3 text-left font-medium">Member</th>
                <th className="px-5 py-3 text-left font-medium">Email</th>
                <th className="px-5 py-3 text-left font-medium">Role</th>
                <th className="px-5 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m.id} className="border-b border-[#1f1f1f] hover:bg-[#1f1f1f] transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#C4922A]/20 flex items-center justify-center text-[#C4922A] font-bold text-xs">
                        {(m.first_name || m.username)[0].toUpperCase()}
                      </div>
                      <div>
                        <div className="text-white font-medium">
                          {m.first_name || m.last_name ? `${m.first_name} ${m.last_name}`.trim() : m.username}
                        </div>
                        <div className="text-gray-500 text-xs">@{m.username}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-gray-300">{m.email}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-3 h-3 text-gray-500" />
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m, e.target.value)}
                        className={`text-xs font-medium px-2 py-1 rounded border-0 focus:outline-none cursor-pointer ${ROLE_COLORS[m.role] || "text-gray-300 bg-gray-700"}`}
                      >
                        {ROLES.map((r) => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <button
                      onClick={() => handleRemove(m)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="Remove member"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
