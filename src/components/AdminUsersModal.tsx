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
  Database,
  FileCode,
  Copy,
  Terminal,
  Server,
  Star,
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
  const [activeTab, setActiveTab] = useState<'users' | 'raw-data'>('users');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Raw Database state
  const [rawDbData, setRawDbData] = useState<any | null>(null);
  const [rawTableTab, setRawTableTab] = useState<'community' | 'users' | 'sessions' | 'guests'>('community');
  const [copiedRaw, setCopiedRaw] = useState(false);

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

  const fetchRawDatabase = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.getRawDatabase(token);
      if (res.success) {
        setRawDbData(res);
      } else {
        setError(res.error || 'Failed to load raw database.');
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
      if (activeTab === 'raw-data') {
        fetchRawDatabase();
      }
    }
  }, [isOpen, activeTab]);

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

  const handleDownloadFullDump = () => {
    if (!rawDbData) return;
    const blob = new Blob([JSON.stringify(rawDbData, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `goodbeans-server-raw-dump-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setActionSuccess('Downloaded complete server database dump');
    setTimeout(() => setActionSuccess(null), 3000);
  };

  const handleCopyRaw = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
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
      <div className="bg-[#FAF7F2] border border-[#E5DACD] text-[#2C241E] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DACD] bg-[#F4EDE4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C87D32] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#2B1D14]">
                  Administrator Console
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#3A291E] text-white rounded-md uppercase tracking-wider flex items-center gap-1">
                  Server Admin
                </span>
              </div>
              <p className="text-[11px] text-[#7A6757]">
                User management, raw server database inspection, and community rating aggregates
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (activeTab === 'users') fetchUsers();
                else fetchRawDatabase();
              }}
              disabled={isLoading}
              title="Refresh"
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

        {/* Tab switch */}
        <div className="flex border-b border-[#E5DACD] bg-[#EDE4D8]/60 p-1 px-6 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-4 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-[#2B1D14] shadow-xs'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Users Directory ({users.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('raw-data');
              if (!rawDbData) fetchRawDatabase();
            }}
            className={`py-2 px-4 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'raw-data'
                ? 'bg-white text-[#2B1D14] shadow-xs'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Server Raw Data Inspector</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
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

          {activeTab === 'users' ? (
            <>
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
                              <td className="py-3 px-4">
                                <div className="font-semibold text-[#2B1D14] flex items-center gap-1.5">
                                  <span>{u.username}</span>
                                  {isSelf && (
                                    <span className="text-[10px] font-normal text-[#C87D32] bg-[#FAF1E4] px-1.5 py-0.5 rounded border border-[#EDE2D4]">
                                      You
                                    </span>
                                  )}
                                </div>
                                <span className="font-mono text-[10px] text-[#A8988A] block">
                                  ID: {u.id}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${
                                    u.role === 'admin'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : 'bg-stone-100 text-stone-700'
                                  }`}
                                >
                                  {u.role === 'admin' && <Shield className="w-2.5 h-2.5" />}
                                  {u.role}
                                </span>
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-[#6D5A4E]">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-[#6D5A4E]">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2 text-[11px] text-[#554032]">
                                  <span className="inline-flex items-center gap-0.5">
                                    <Coffee className="w-3 h-3 text-[#C87D32]" />
                                    {u.coffeesCount || 0} beans
                                  </span>
                                  <span className="text-[#DACDC0]">·</span>
                                  <span className="inline-flex items-center gap-0.5">
                                    <Layers className="w-3 h-3 text-[#7A6757]" />
                                    {u.equipmentCount || 0} gear
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
            </>
          ) : (
            /* SERVER RAW DATA INSPECTOR VIEW */
            <div className="space-y-4">
              {/* Server Access Guide Box */}
              <div className="p-4 bg-[#FAF3EC] border border-[#E5DACD] rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#C87D32]" />
                    <span className="font-serif font-bold text-sm text-[#2B1D14]">
                      How Administrators Access Server Raw Data
                    </span>
                  </div>
                  <button
                    onClick={handleDownloadFullDump}
                    disabled={!rawDbData}
                    className="px-3 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Full DB Dump (.json)</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-2.5 bg-white rounded-lg border border-[#EDE2D4]">
                    <div className="font-semibold text-[#8C4F1A] flex items-center gap-1 mb-1">
                      <Database className="w-3.5 h-3.5" />
                      <span>1. In-App Admin Console</span>
                    </div>
                    <p className="text-[#6D5A4E] text-[11px] leading-relaxed">
                      View live records, user accounts, and aggregated community ratings directly in this inspector.
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#EDE2D4]">
                    <div className="font-semibold text-[#8C4F1A] flex items-center gap-1 mb-1">
                      <Terminal className="w-3.5 h-3.5" />
                      <span>2. Cloud Run CLI / Exec</span>
                    </div>
                    <p className="text-[#6D5A4E] text-[11px] leading-relaxed font-mono text-[10px]">
                      cat /data/users.json<br />
                      cat /data/community_items.json
                    </p>
                  </div>
                  <div className="p-2.5 bg-white rounded-lg border border-[#EDE2D4]">
                    <div className="font-semibold text-[#8C4F1A] flex items-center gap-1 mb-1">
                      <FileCode className="w-3.5 h-3.5" />
                      <span>3. Admin REST API</span>
                    </div>
                    <p className="text-[#6D5A4E] text-[11px] leading-relaxed font-mono text-[10px]">
                      GET /api/admin/raw-data<br />
                      Header: Bearer &lt;admin_token&gt;
                    </p>
                  </div>
                </div>
              </div>

              {/* Raw Table Selector */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DACD] pb-2">
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setRawTableTab('community')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      rawTableTab === 'community'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Community Ratings & Catalog (community_items.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('users')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      rawTableTab === 'users'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Users & Libraries (users.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('sessions')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      rawTableTab === 'sessions'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Sessions (sessions.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('guests')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      rawTableTab === 'guests'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Guest Libraries (guests.json)
                  </button>
                </div>

                {rawDbData && (
                  <button
                    onClick={() => {
                      const content = JSON.stringify(
                        rawTableTab === 'community'
                          ? rawDbData.tables?.communityItems?.records
                          : rawTableTab === 'users'
                          ? rawDbData.tables?.users?.records
                          : rawTableTab === 'sessions'
                          ? rawDbData.tables?.sessions?.records
                          : rawDbData.tables?.guests?.records,
                        null,
                        2
                      );
                      handleCopyRaw(content);
                    }}
                    className="px-2.5 py-1 text-xs text-[#7A6757] hover:text-[#2B1D14] bg-white border border-[#DACDC0] rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedRaw ? 'Copied JSON!' : 'Copy Table JSON'}</span>
                  </button>
                )}
              </div>

              {/* JSON Raw Code Display */}
              <div className="bg-[#1E1916] rounded-xl border border-[#3E322A] p-4 text-[#EDE4DC] overflow-hidden shadow-inner">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#3E322A] text-xs font-mono text-[#A8988A]">
                  <span className="flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-[#ECA357]" />
                    <span>
                      /data/
                      {rawTableTab === 'community'
                        ? 'community_items.json'
                        : rawTableTab === 'users'
                        ? 'users.json'
                        : rawTableTab === 'sessions'
                        ? 'sessions.json'
                        : 'guests.json'}
                    </span>
                  </span>
                  <span>
                    Server Timestamp: {rawDbData?.serverTime ? new Date(rawDbData.serverTime).toLocaleTimeString() : 'Live'}
                  </span>
                </div>

                <pre className="font-mono text-xs overflow-x-auto max-h-[380px] p-2 leading-relaxed text-[#F3EBE1]">
                  {isLoading && !rawDbData
                    ? '// Loading raw database from server...'
                    : JSON.stringify(
                        rawTableTab === 'community'
                          ? rawDbData?.tables?.communityItems?.records || {}
                          : rawTableTab === 'users'
                          ? rawDbData?.tables?.users?.records || []
                          : rawTableTab === 'sessions'
                          ? rawDbData?.tables?.sessions?.records || []
                          : rawDbData?.tables?.guests?.records || {},
                        null,
                        2
                      )}
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5DACD] bg-[#F4EDE4] flex items-center justify-between">
          <span className="text-xs text-[#7A6757]">
            {activeTab === 'users'
              ? `Showing ${filteredUsers.length} of ${users.length} registered accounts`
              : `Storage Path: /data on server (Persistent)`}
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
