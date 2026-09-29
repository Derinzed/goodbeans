import React, { useState, useEffect } from 'react';
import {
  X,
  Users,
  Search,
  RefreshCw,
  Shield,
  Download,
  Trash2,
  Coffee,
  Calendar,
  Layers,
  Clock,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { authApi, AdminUserSummary } from '../services/authApi';

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  currentUserId: string;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  token,
  currentUserId,
}) => {
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.getAdminUsers(token);
      if (res.success && res.users) {
        setUsers(res.users);
      } else {
        setError(res.error || 'Failed to load registered users.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const totalCoffeesAllUsers = users.reduce((acc, u) => acc + (u.coffeesCount || 0), 0);
  const totalNotesAllUsers = users.reduce((acc, u) => acc + (u.notesCount || 0), 0);

  const handleExportUser = async (userId: string, username: string) => {
    if (!token) return;
    try {
      const res = await authApi.exportAdminUser(token, userId);
      if (res.success && res.data) {
        const blob = new Blob([JSON.stringify(res.data, null, 2)], {
          type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `goodbeans-user-${username}-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
        setActionSuccess(`Exported backup for ${username}`);
        setTimeout(() => setActionSuccess(null), 3000);
      }
    } catch {
      setError(`Failed to export data for ${username}`);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!token) return;
    if (userId === currentUserId) {
      alert('You cannot delete your own active admin account here.');
      return;
    }

    const confirmDelete = window.confirm(
      `Are you sure you want to permanently delete user "${username}" and all their server data?`
    );
    if (!confirmDelete) return;

    setDeletingId(userId);
    try {
      const res = await authApi.deleteAdminUser(token, userId);
      if (res.success) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setActionSuccess(`User "${username}" was removed.`);
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to delete user.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error deleting user.');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] text-[#2C241E] w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DACD] bg-[#F4EDE4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C87D32] flex items-center justify-center text-white shadow-xs">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#2B1D14]">
                  Registered Users Directory
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#3A291E] text-white rounded-md uppercase tracking-wider flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-[#ECA357]" />
                  Admin
                </span>
              </div>
              <p className="text-[11px] text-[#7A6757]">
                Live server view of all accounts, library sizes, and user backups
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchUsers}
              disabled={isLoading}
              title="Refresh users list"
              className="p-1.5 text-[#7A6757] hover:text-[#2B1D14] hover:bg-[#EAE0D3] rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-[#7A6757] hover:text-[#2B1D14] hover:bg-[#EAE0D3] rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Metric Overview Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-white rounded-xl border border-[#E0D5C7]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6D56] block">
                Total Users
              </span>
              <span className="font-serif text-2xl font-bold text-[#2B1D14] font-mono mt-0.5 block">
                {users.length}
              </span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-[#E0D5C7]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6D56] block">
                Total Beans Tracked
              </span>
              <span className="font-serif text-2xl font-bold text-[#C87D32] font-mono mt-0.5 block">
                {totalCoffeesAllUsers}
              </span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-[#E0D5C7]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6D56] block">
                Total Custom Notes
              </span>
              <span className="font-serif text-2xl font-bold text-[#2B1D14] font-mono mt-0.5 block">
                {totalNotesAllUsers}
              </span>
            </div>
            <div className="p-3.5 bg-white rounded-xl border border-[#E0D5C7]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A6D56] block">
                Admin Accounts
              </span>
              <span className="font-serif text-2xl font-bold text-[#2B1D14] font-mono mt-0.5 block">
                {users.filter((u) => u.role === 'admin').length}
              </span>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C7A6D]">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search registered users by username..."
              className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#D5C7B8] text-xs text-[#2C2017] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
            />
          </div>

          {/* Users List Table */}
          <div className="bg-white rounded-xl border border-[#E0D5C7] overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#F6EFE6] border-b border-[#E8DDD0] text-[#7A6757] font-semibold">
                    <th className="py-2.5 px-4">User</th>
                    <th className="py-2.5 px-3">Role</th>
                    <th className="py-2.5 px-3">Registered</th>
                    <th className="py-2.5 px-3">Last Active</th>
                    <th className="py-2.5 px-3">Saved Library</th>
                    <th className="py-2.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E6DB]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-[#8C7A6D]">
                        {searchQuery ? 'No users matching your search.' : 'No registered users found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isSelf = u.id === currentUserId;
                      return (
                        <tr key={u.id} className="hover:bg-[#FAF7F2] transition-colors">
                          <td className="py-3 px-4 font-semibold text-[#2B1D14]">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-lg bg-[#3A291E] text-white flex items-center justify-center font-bold text-xs">
                                {u.username.slice(0, 1).toUpperCase()}
                              </div>
                              <div>
                                <span>{u.username}</span>
                                {isSelf && (
                                  <span className="ml-1.5 text-[10px] text-[#C87D32] font-normal">
                                    (You)
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3">
                            {u.role === 'admin' ? (
                              <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C87D32] text-white rounded-md inline-flex items-center gap-1">
                                <Shield className="w-2.5 h-2.5" />
                                Admin
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EFE7DC] text-[#6B5A4E] rounded-md">
                                User
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-[#7A6757] whitespace-nowrap">
                            {new Date(u.createdAt).toLocaleDateString()}
                          </td>
                          <td className="py-3 px-3 text-[#7A6757] whitespace-nowrap">
                            {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-1.5 text-[11px] text-[#554032]">
                              <span className="px-1.5 py-0.5 bg-[#F5ECE1] rounded border border-[#E0D5C7]" title="Coffees">
                                ☕ {u.coffeesCount}
                              </span>
                              <span className="px-1.5 py-0.5 bg-[#F5ECE1] rounded border border-[#E0D5C7]" title="Equipment">
                                ⚙️ {u.equipmentCount}
                              </span>
                              <span className="px-1.5 py-0.5 bg-[#F5ECE1] rounded border border-[#E0D5C7]" title="Notes">
                                📝 {u.notesCount}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleExportUser(u.id, u.username)}
                                title="Download User's JSON Backup"
                                className="p-1.5 text-[#6D5A4E] hover:text-[#2B1D14] hover:bg-[#F2E8DC] rounded-md transition-colors cursor-pointer"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              {!isSelf && (
                                <button
                                  type="button"
                                  disabled={deletingId === u.id}
                                  onClick={() => handleDeleteUser(u.id, u.username)}
                                  title="Delete User"
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5DACD] bg-[#F4EDE4] flex items-center justify-between">
          <span className="text-xs text-[#7A6757]">
            Showing {filteredUsers.length} of {users.length} registered accounts
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3A291E] hover:bg-[#251A13] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
