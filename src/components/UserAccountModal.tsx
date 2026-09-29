import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  Cloud,
  CheckCircle,
  Download,
  Upload,
  LogOut,
  Trash2,
  AlertTriangle,
  Users,
  Calendar,
  Layers,
  Sparkles,
} from 'lucide-react';
import { UserProfile } from '../services/authApi';

interface UserAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  stats: {
    coffeesCount: number;
    equipmentCount: number;
    cafesCount: number;
    notesCount: number;
    shelvesCount: number;
  };
  isSyncing: boolean;
  lastSyncedAt: string | null;
  onManualSync: () => void;
  onExportData: () => void;
  onImportBackupFile: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onOpenAdminPanel?: () => void;
}

export const UserAccountModal: React.FC<UserAccountModalProps> = ({
  isOpen,
  onClose,
  user,
  stats,
  isSyncing,
  lastSyncedAt,
  onManualSync,
  onExportData,
  onImportBackupFile,
  onLogout,
  onDeleteAccount,
  onOpenAdminPanel,
}) => {
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAccount();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] text-[#2C241E] w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DACD] bg-[#F4EDE4]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#3A291E] flex items-center justify-center text-white shadow-xs font-serif text-lg font-bold">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#2B1D14]">
                  {user.username}
                </h3>
                {user.role === 'admin' ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C87D32] text-white rounded-md flex items-center gap-1 uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EFE7DC] text-[#6B5A4E] rounded-md">
                    Member
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7A6757] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3" />
                Joined {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6757] hover:text-[#2B1D14] hover:bg-[#EAE0D3] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Server Sync Status */}
          <div className="p-4 bg-[#F5ECE1] rounded-xl border border-[#E0D5C7] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Cloud className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-[#2B1D14] flex items-center gap-1.5">
                  Saved on Server
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                </span>
                <span className="text-[11px] text-[#7A6757] block">
                  {lastSyncedAt
                    ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}`
                    : 'All edits auto-saved to your server account'}
                </span>
              </div>
            </div>
            <button
              onClick={onManualSync}
              disabled={isSyncing}
              className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-white text-[#2B1D14] border border-[#D5C7B8] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSyncing ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>

          {/* Stats Footprint */}
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A6D56] block mb-2">
              Your Coffee Library on Server
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
              <div className="p-2.5 bg-white rounded-lg border border-[#E0D5C7]">
                <span className="text-xs text-[#8C7A6D] block">Coffees</span>
                <span className="font-serif text-lg font-bold text-[#2B1D14]">
                  {stats.coffeesCount}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E0D5C7]">
                <span className="text-xs text-[#8C7A6D] block">Gear</span>
                <span className="font-serif text-lg font-bold text-[#2B1D14]">
                  {stats.equipmentCount}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E0D5C7]">
                <span className="text-xs text-[#8C7A6D] block">Cafes</span>
                <span className="font-serif text-lg font-bold text-[#2B1D14]">
                  {stats.cafesCount}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E0D5C7]">
                <span className="text-xs text-[#8C7A6D] block">Notes</span>
                <span className="font-serif text-lg font-bold text-[#2B1D14]">
                  {stats.notesCount}
                </span>
              </div>
              <div className="p-2.5 bg-white rounded-lg border border-[#E0D5C7] col-span-2 sm:col-span-1">
                <span className="text-xs text-[#8C7A6D] block">Shelves</span>
                <span className="font-serif text-lg font-bold text-[#2B1D14]">
                  {stats.shelvesCount}
                </span>
              </div>
            </div>
          </div>

          {/* Admin Section (if admin) */}
          {user.role === 'admin' && onOpenAdminPanel && (
            <div className="p-4 bg-[#FAF3EC] border border-[#EDE2D4] rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#C87D32] text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#2B1D14] block">
                    Admin Tools
                  </span>
                  <span className="text-[11px] text-[#8C4F1A]">
                    View all registered users and their library data
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminPanel();
                }}
                className="px-3.5 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                View Users
              </button>
            </div>
          )}

          {/* Data Portability: Export and Re-Import */}
          <div className="space-y-2.5">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8A6D56] block">
              Data Backup & Re-import
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={onExportData}
                className="p-3 bg-white hover:bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer shadow-2xs group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#F5ECE1] group-hover:bg-[#EFE7DC] flex items-center justify-center text-[#3A291E]">
                  <Download className="w-4 h-4 text-[#C87D32]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#2B1D14] block">
                    Export My Data
                  </span>
                  <span className="text-[10px] text-[#8C7A6D]">
                    Download clean JSON backup file
                  </span>
                </div>
              </button>

              <label className="p-3 bg-white hover:bg-[#FAF7F2] border border-[#E0D5C7] rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer shadow-2xs group">
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={onImportBackupFile}
                  className="hidden"
                />
                <div className="w-8 h-8 rounded-lg bg-[#F5ECE1] group-hover:bg-[#EFE7DC] flex items-center justify-center text-[#3A291E]">
                  <Upload className="w-4 h-4 text-[#C87D32]" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-[#2B1D14] block">
                    Import Backup File
                  </span>
                  <span className="text-[10px] text-[#8C7A6D]">
                    Restores & updates account on server
                  </span>
                </div>
              </label>
            </div>
            <p className="text-[11px] text-[#7A6757] italic">
              * Importing a backup while logged in will immediately update and sync your account information on the server.
            </p>
          </div>

          {/* Account Actions & Danger Zone */}
          <div className="pt-2 border-t border-[#E5DACD] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2B1D14]">Session</span>
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B5A4E] hover:text-[#2B1D14] hover:bg-[#EFE8DD] rounded-lg transition-colors border border-[#E5DACD] flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Delete Account */}
            {!showDeleteConfirm ? (
              <div className="p-3.5 bg-rose-50/70 border border-rose-200/80 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 block">
                    Delete Account
                  </span>
                  <span className="text-[11px] text-rose-700">
                    Permanently delete your account and all data on the server
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-2xs whitespace-nowrap"
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5 text-rose-900">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold block">
                      Confirm Account Deletion
                    </span>
                    <p className="text-[11px] text-rose-700 mt-0.5">
                      Are you sure you want to permanently delete your account (<strong>{user.username}</strong>) and all saved beans, recipes, and notes from the server? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-white text-[#2B1D14] border border-[#D5C7B8] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={handleDelete}
                    className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>{isDeleting ? 'Deleting...' : 'Yes, Permanently Delete'}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-[#E5DACD] bg-[#F4EDE4] flex justify-end">
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
