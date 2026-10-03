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
  Share2,
  Check,
  KeyRound,
  Eye,
  EyeOff,
  ExternalLink,
  Edit3,
} from 'lucide-react';
import { UserProfile } from '../services/authApi';
import { validatePasswordStrength, validateUsername } from '../utils/passwordSecurity';

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
  onUpdateUsername?: (newUsername: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onChangePassword?: (currentPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  onViewPublicProfile?: (username: string) => void;
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
  onUpdateUsername,
  onChangePassword,
  onViewPublicProfile,
}) => {
  const [activeSection, setActiveSection] = useState<'overview' | 'security' | 'share'>('overview');

  // Username change state
  const [isEditingUsername, setIsEditingUsername] = useState(false);
  const [newUsername, setNewUsername] = useState(user.username);
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [usernameSuccess, setUsernameSuccess] = useState<string | null>(null);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Share profile state
  const [copiedLink, setCopiedLink] = useState(false);

  // Delete account state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

  const passwordVal = validatePasswordStrength(newPassword);

  const getPasswordStrengthLabel = (score: number) => {
    if (!newPassword) return { label: 'Enter password', color: 'bg-stone-200 text-stone-600' };
    if (score <= 2) return { label: 'Weak', color: 'bg-rose-500 text-white' };
    if (score <= 3) return { label: 'Fair', color: 'bg-amber-500 text-white' };
    if (score === 4) return { label: 'Good', color: 'bg-emerald-500 text-white' };
    return { label: 'Strong & Secure', color: 'bg-emerald-600 text-white' };
  };

  const strengthInfo = getPasswordStrengthLabel(passwordVal.score);

  const handleSaveUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    setUsernameError(null);
    setUsernameSuccess(null);

    const val = validateUsername(newUsername);
    if (!val.isValid) {
      setUsernameError(val.error || 'Invalid username');
      return;
    }

    if (newUsername.trim().toLowerCase() === user.username.toLowerCase()) {
      setIsEditingUsername(false);
      return;
    }

    if (!onUpdateUsername) return;

    setIsUpdatingUsername(true);
    try {
      const res = await onUpdateUsername(newUsername.trim());
      if (res.success) {
        setUsernameSuccess(res.message || 'Username updated successfully!');
        setIsEditingUsername(false);
        setTimeout(() => setUsernameSuccess(null), 4000);
      } else {
        setUsernameError(res.error || 'Failed to update username');
      }
    } catch (err: any) {
      setUsernameError(err.message || 'Error updating username');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (!currentPassword) {
      setPasswordError('Please enter your current password.');
      return;
    }

    if (!passwordVal.isValid) {
      setPasswordError('Password does not meet the strong security criteria listed below.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    if (!onChangePassword) return;

    setIsChangingPassword(true);
    try {
      const res = await onChangePassword(currentPassword, newPassword);
      if (res.success) {
        setPasswordSuccess('Password changed successfully! Keep it secure.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => setPasswordSuccess(null), 5000);
      } else {
        setPasswordError(res.error || 'Failed to change password');
      }
    } catch (err: any) {
      setPasswordError(err.message || 'Error changing password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleCopyProfileUrl = () => {
    const profileUrl = `${window.location.origin}?profile=${encodeURIComponent(user.username)}`;
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(profileUrl).then(() => {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2500);
      });
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDeleteAccount();
      onClose();
    } finally {
      setIsDeleting(false);
    }
  };

  const profileUrl = typeof window !== 'undefined'
    ? `${window.location.origin}?profile=${encodeURIComponent(user.username)}`
    : `?profile=${encodeURIComponent(user.username)}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] dark:bg-[#1E1916] border border-[#E5DACD] dark:border-[#382B24] text-[#2C241E] dark:text-[#E8DDD0] w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DACD] dark:border-[#382B24] bg-[#F4EDE4] dark:bg-[#251F1B]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-[#3A291E] to-[#251A13] dark:from-[#C87D32] dark:to-[#8C4F1A] flex items-center justify-center text-white shadow-xs font-serif text-xl font-bold">
              {user.username.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                  {user.username}
                </h3>
                {user.role === 'admin' ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold bg-[#C87D32] text-white rounded-md flex items-center gap-1 uppercase tracking-wider">
                    <Shield className="w-3 h-3" />
                    Admin
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-[#EFE7DC] dark:bg-[#342A24] text-[#6B5A4E] dark:text-[#C5B7A8] rounded-md">
                    Member
                  </span>
                )}
              </div>
              <p className="text-[11px] text-[#7A6757] dark:text-[#A8988B] flex items-center gap-1 mt-0.5">
                <Calendar className="w-3 h-3 text-[#C87D32]" />
                Member since {new Date(user.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#7A6757] hover:text-[#2B1D14] dark:text-[#A8988B] dark:hover:text-white hover:bg-[#EAE0D3] dark:hover:bg-[#342A24] rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-[#E5DACD] dark:border-[#382B24] bg-[#F7F2EB] dark:bg-[#221B18] px-4 pt-2 gap-2 text-xs font-semibold overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveSection('overview')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'overview'
                ? 'border-[#C87D32] text-[#C87D32] dark:text-[#ECA357] font-bold'
                : 'border-transparent text-[#7A6757] dark:text-[#A8988B] hover:text-[#2B1D14] dark:hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile & Shelves</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('security')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'security'
                ? 'border-[#C87D32] text-[#C87D32] dark:text-[#ECA357] font-bold'
                : 'border-transparent text-[#7A6757] dark:text-[#A8988B] hover:text-[#2B1D14] dark:hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Security & Password</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('share')}
            className={`pb-2.5 px-3 border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 whitespace-nowrap ${
              activeSection === 'share'
                ? 'border-[#C87D32] text-[#C87D32] dark:text-[#ECA357] font-bold'
                : 'border-transparent text-[#7A6757] dark:text-[#A8988B] hover:text-[#2B1D14] dark:hover:text-white'
            }`}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share Profile URL</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* Section: Overview & Username */}
          {activeSection === 'overview' && (
            <div className="space-y-6">
              {/* Username Management */}
              <div className="p-4 bg-white dark:bg-[#181311] rounded-xl border border-[#E0D5C7] dark:border-[#382B24] space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-[#2B1D14] dark:text-[#F3ECE4] block">
                      Username / Barista Handle
                    </span>
                    <span className="text-[11px] text-[#7A6757] dark:text-[#A8988B]">
                      Used across ratings, public profile, and login
                    </span>
                  </div>
                  {!isEditingUsername && (
                    <button
                      type="button"
                      onClick={() => {
                        setNewUsername(user.username);
                        setIsEditingUsername(true);
                        setUsernameError(null);
                        setUsernameSuccess(null);
                      }}
                      className="px-3 py-1.5 bg-[#FAF7F2] dark:bg-[#251F1B] hover:bg-[#F3ECE2] dark:hover:bg-[#342A24] text-[#8C4F1A] dark:text-[#ECA357] border border-[#E0D5C7] dark:border-[#382B24] rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Change Username</span>
                    </button>
                  )}
                </div>

                {isEditingUsername ? (
                  <form onSubmit={handleSaveUsername} className="space-y-3 pt-2 border-t border-[#F0E6DA] dark:border-[#2A221E]">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#5B473A] dark:text-[#C5B7A8] mb-1">
                        New Username
                      </label>
                      <input
                        type="text"
                        value={newUsername}
                        onChange={(e) => setNewUsername(e.target.value)}
                        placeholder="e.g. espresso_artisan"
                        className="w-full px-3 py-2 bg-[#FAF7F2] dark:bg-[#201A17] border border-[#DACDC0] dark:border-[#44362E] rounded-lg text-xs font-semibold focus:ring-1 focus:ring-[#C87D32] focus:border-[#C87D32] outline-hidden text-[#2B1D14] dark:text-white"
                        autoFocus
                      />
                      <p className="text-[10px] text-[#8C7A6D] dark:text-[#9A8B7E] mt-1">
                        3–24 characters. Letters, numbers, underscores, and hyphens only.
                      </p>
                    </div>

                    {usernameError && (
                      <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-lg text-xs font-medium">
                        {usernameError}
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsEditingUsername(false);
                          setUsernameError(null);
                        }}
                        className="px-3 py-1.5 bg-[#F5ECE1] dark:bg-[#251F1B] text-[#55473E] dark:text-[#C5B7A8] rounded-lg text-xs font-semibold hover:bg-[#EAE0D3] dark:hover:bg-[#342A24] transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isUpdatingUsername}
                        className="px-3.5 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {isUpdatingUsername ? 'Saving...' : 'Save New Username'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between text-xs py-1 text-[#2B1D14] dark:text-[#E8DDD0]">
                    <span className="font-mono font-bold text-sm bg-[#F5ECE1] dark:bg-[#251F1B] px-3 py-1 rounded-lg border border-[#E0D5C7] dark:border-[#382B24]">
                      @{user.username}
                    </span>
                  </div>
                )}

                {usernameSuccess && (
                  <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/60 rounded-lg text-xs font-medium flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{usernameSuccess}</span>
                  </div>
                )}
              </div>

              {/* Server Sync Status */}
              <div className="p-4 bg-[#F5ECE1] dark:bg-[#181311] rounded-xl border border-[#E0D5C7] dark:border-[#382B24] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/80 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
                    <Cloud className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#2B1D14] dark:text-[#F3ECE4] flex items-center gap-1.5">
                      Saved on Server
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    </span>
                    <span className="text-[11px] text-[#7A6757] dark:text-[#A8988B] block">
                      {lastSyncedAt
                        ? `Last synced: ${new Date(lastSyncedAt).toLocaleTimeString()}`
                        : 'All edits auto-saved to your server account'}
                    </span>
                  </div>
                </div>
                <button
                  onClick={onManualSync}
                  disabled={isSyncing}
                  className="px-3 py-1.5 bg-[#FAF7F2] dark:bg-[#251F1B] hover:bg-white dark:hover:bg-[#342A24] text-[#2B1D14] dark:text-[#F3ECE4] border border-[#D5C7B8] dark:border-[#382B24] text-xs font-semibold rounded-lg shadow-2xs transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isSyncing ? 'Syncing...' : 'Sync Now'}
                </button>
              </div>

              {/* Stats Footprint */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A6D56] dark:text-[#ECA357] block mb-2">
                  Your Coffee Library on Server
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center">
                  <div className="p-2.5 bg-white dark:bg-[#181311] rounded-lg border border-[#E0D5C7] dark:border-[#382B24]">
                    <span className="text-xs text-[#8C7A6D] dark:text-[#A8988B] block">Coffees</span>
                    <span className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                      {stats.coffeesCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-[#181311] rounded-lg border border-[#E0D5C7] dark:border-[#382B24]">
                    <span className="text-xs text-[#8C7A6D] dark:text-[#A8988B] block">Gear</span>
                    <span className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                      {stats.equipmentCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-[#181311] rounded-lg border border-[#E0D5C7] dark:border-[#382B24]">
                    <span className="text-xs text-[#8C7A6D] dark:text-[#A8988B] block">Cafes</span>
                    <span className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                      {stats.cafesCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-[#181311] rounded-lg border border-[#E0D5C7] dark:border-[#382B24]">
                    <span className="text-xs text-[#8C7A6D] dark:text-[#A8988B] block">Notes</span>
                    <span className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                      {stats.notesCount}
                    </span>
                  </div>
                  <div className="p-2.5 bg-white dark:bg-[#181311] rounded-lg border border-[#E0D5C7] dark:border-[#382B24] col-span-2 sm:col-span-1">
                    <span className="text-xs text-[#8C7A6D] dark:text-[#A8988B] block">Shelves</span>
                    <span className="font-serif text-lg font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                      {stats.shelvesCount}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Section (if admin) */}
              {user.role === 'admin' && onOpenAdminPanel && (
                <div className="p-4 bg-[#FAF3EC] dark:bg-[#261E1A] border border-[#EDE2D4] dark:border-[#44362E] rounded-xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#C87D32] text-white flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-[#2B1D14] dark:text-[#F3ECE4] block">
                        Admin Console & Database
                      </span>
                      <span className="text-[11px] text-[#8C4F1A] dark:text-[#ECA357]">
                        Inspect live server database, users, and catalog
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
                    Open Console
                  </button>
                </div>
              )}

              {/* Data Portability: Export and Re-Import */}
              <div className="space-y-2.5">
                <span className="text-xs font-bold uppercase tracking-wider text-[#8A6D56] dark:text-[#ECA357] block">
                  Data Backup & Re-import
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={onExportData}
                    className="p-3 bg-white dark:bg-[#181311] hover:bg-[#FAF7F2] dark:hover:bg-[#201A17] border border-[#E0D5C7] dark:border-[#382B24] rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer shadow-2xs group"
                  >
                    <div className="w-8 h-8 rounded-lg bg-[#F5ECE1] dark:bg-[#2A221E] group-hover:bg-[#EFE7DC] flex items-center justify-center text-[#3A291E] dark:text-[#E8DDD0]">
                      <Download className="w-4 h-4 text-[#C87D32]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#2B1D14] dark:text-[#F3ECE4] block">
                        Export My Data
                      </span>
                      <span className="text-[10px] text-[#8C7A6D] dark:text-[#A8988B]">
                        Download clean JSON backup file
                      </span>
                    </div>
                  </button>

                  <label className="p-3 bg-white dark:bg-[#181311] hover:bg-[#FAF7F2] dark:hover:bg-[#201A17] border border-[#E0D5C7] dark:border-[#382B24] rounded-xl text-left transition-colors flex items-center gap-2.5 cursor-pointer shadow-2xs group">
                    <input
                      type="file"
                      accept=".json,application/json"
                      onChange={onImportBackupFile}
                      className="hidden"
                    />
                    <div className="w-8 h-8 rounded-lg bg-[#F5ECE1] dark:bg-[#2A221E] group-hover:bg-[#EFE7DC] flex items-center justify-center text-[#3A291E] dark:text-[#E8DDD0]">
                      <Upload className="w-4 h-4 text-[#C87D32]" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-[#2B1D14] dark:text-[#F3ECE4] block">
                        Import Backup File
                      </span>
                      <span className="text-[10px] text-[#8C7A6D] dark:text-[#A8988B]">
                        Restores & updates account on server
                      </span>
                    </div>
                  </label>
                </div>
              </div>
            </div>
          )}

          {/* Section: Security & Password */}
          {activeSection === 'security' && (
            <div className="space-y-5">
              <div className="p-4 bg-white dark:bg-[#181311] rounded-xl border border-[#E0D5C7] dark:border-[#382B24] space-y-4">
                <div>
                  <h4 className="font-serif text-base font-bold text-[#2B1D14] dark:text-[#F3ECE4] flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-[#C87D32]" />
                    <span>Change Account Password</span>
                  </h4>
                  <p className="text-xs text-[#7A6757] dark:text-[#A8988B] mt-0.5">
                    Protect your coffee journal with a strong, multi-factor compliant password.
                  </p>
                </div>

                <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5B473A] dark:text-[#C5B7A8] mb-1">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPass ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-3 py-2 pr-10 bg-[#FAF7F2] dark:bg-[#201A17] border border-[#DACDC0] dark:border-[#44362E] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#C87D32] focus:border-[#C87D32] outline-hidden text-[#2B1D14] dark:text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7A6D] dark:text-[#9A8B7E] hover:text-[#2B1D14] dark:hover:text-white p-1"
                      >
                        {showCurrentPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* New Password */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-semibold text-[#5B473A] dark:text-[#C5B7A8]">
                        New Password
                      </label>
                      {newPassword && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${strengthInfo.color}`}>
                          {strengthInfo.label}
                        </span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showNewPass ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create strong new password"
                        className="w-full px-3 py-2 pr-10 bg-[#FAF7F2] dark:bg-[#201A17] border border-[#DACDC0] dark:border-[#44362E] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#C87D32] focus:border-[#C87D32] outline-hidden text-[#2B1D14] dark:text-white"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPass(!showNewPass)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8C7A6D] dark:text-[#9A8B7E] hover:text-[#2B1D14] dark:hover:text-white p-1"
                      >
                        {showNewPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Strength Checklist */}
                    <div className="mt-2.5 p-3 bg-[#FAF7F2] dark:bg-[#221B18] rounded-xl border border-[#EAE0D3] dark:border-[#382B24] space-y-1.5 text-[11px]">
                      <span className="font-bold text-[#634937] dark:text-[#D5C2B2] block text-[10px] uppercase tracking-wider">
                        Security Requirements:
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[#55473E] dark:text-[#BDB0A4]">
                        <div className={`flex items-center gap-1.5 ${passwordVal.hasMinLength ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passwordVal.hasMinLength ? 'text-emerald-600' : 'text-stone-300'}`} />
                          <span>8+ characters</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordVal.hasUppercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passwordVal.hasUppercase ? 'text-emerald-600' : 'text-stone-300'}`} />
                          <span>1+ Uppercase (A-Z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordVal.hasLowercase ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passwordVal.hasLowercase ? 'text-emerald-600' : 'text-stone-300'}`} />
                          <span>1+ Lowercase (a-z)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 ${passwordVal.hasNumber ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passwordVal.hasNumber ? 'text-emerald-600' : 'text-stone-300'}`} />
                          <span>1+ Number (0-9)</span>
                        </div>
                        <div className={`flex items-center gap-1.5 col-span-1 sm:col-span-2 ${passwordVal.hasSpecialChar ? 'text-emerald-700 dark:text-emerald-400 font-semibold' : ''}`}>
                          <Check className={`w-3.5 h-3.5 ${passwordVal.hasSpecialChar ? 'text-emerald-600' : 'text-stone-300'}`} />
                          <span>1+ Special symbol (!@#$%^&*...)</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label className="block text-xs font-semibold text-[#5B473A] dark:text-[#C5B7A8] mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-type new password"
                      className="w-full px-3 py-2 bg-[#FAF7F2] dark:bg-[#201A17] border border-[#DACDC0] dark:border-[#44362E] rounded-lg text-xs font-medium focus:ring-1 focus:ring-[#C87D32] focus:border-[#C87D32] outline-hidden text-[#2B1D14] dark:text-white"
                      required
                    />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
                        Passwords do not match
                      </p>
                    )}
                  </div>

                  {passwordError && (
                    <div className="p-3 bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/60 rounded-xl text-xs font-medium flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
                      <span>{passwordError}</span>
                    </div>
                  )}

                  {passwordSuccess && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/60 rounded-xl text-xs font-medium flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{passwordSuccess}</span>
                    </div>
                  )}

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={isChangingPassword || !passwordVal.isValid || newPassword !== confirmPassword || !currentPassword}
                      className="px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
                    >
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>{isChangingPassword ? 'Updating Password...' : 'Change Password'}</span>
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Section: Share Public Profile URL */}
          {activeSection === 'share' && (
            <div className="space-y-5">
              <div className="p-5 bg-white dark:bg-[#181311] rounded-xl border border-[#E0D5C7] dark:border-[#382B24] space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FAF3EC] dark:bg-[#2A221E] text-[#C87D32] flex items-center justify-center">
                    <Share2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif text-base font-bold text-[#2B1D14] dark:text-[#F3ECE4]">
                      Shareable Barista Profile
                    </h4>
                    <p className="text-xs text-[#7A6757] dark:text-[#A8988B]">
                      Share your custom shelves, favorite roasts, brew equipment, and flavor notes with friends.
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF7F2] dark:bg-[#201A17] rounded-xl border border-[#E5DACD] dark:border-[#382B24] space-y-2">
                  <span className="text-[10px] uppercase font-bold text-[#8A6D56] dark:text-[#ECA357] block tracking-wider">
                    Your Public Profile URL
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      readOnly
                      value={profileUrl}
                      className="w-full px-3 py-2 bg-white dark:bg-[#14110F] border border-[#DACDC0] dark:border-[#44362E] rounded-lg text-xs font-mono text-[#3A291E] dark:text-[#E8DDD0] outline-hidden select-all"
                    />
                    <button
                      type="button"
                      onClick={handleCopyProfileUrl}
                      className={`px-3.5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer flex items-center gap-1.5 shrink-0 shadow-xs ${
                        copiedLink
                          ? 'bg-emerald-600 text-white'
                          : 'bg-[#C87D32] hover:bg-[#B06B26] text-white'
                      }`}
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-3.5 h-3.5" />
                          <span>Copy Link</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="text-[11px] text-[#7A6757] dark:text-[#A8988B] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#C87D32]" />
                    <span>Visitors can view your bean shelf, gear setup & sensory journey</span>
                  </div>

                  {onViewPublicProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onViewPublicProfile(user.username);
                      }}
                      className="px-3 py-1.5 bg-[#F5ECE1] dark:bg-[#251F1B] hover:bg-[#EAE0D3] dark:hover:bg-[#342A24] text-[#2B1D14] dark:text-white rounded-lg text-xs font-semibold border border-[#D5C7B8] dark:border-[#382B24] transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-[#C87D32]" />
                      <span>Preview Public Profile</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Account Actions & Danger Zone */}
          <div className="pt-4 border-t border-[#E5DACD] dark:border-[#382B24] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#2B1D14] dark:text-[#F3ECE4]">Active Session</span>
              <button
                type="button"
                onClick={onLogout}
                className="px-3.5 py-1.5 text-xs font-semibold text-[#6B5A4E] dark:text-[#C5B7A8] hover:text-[#2B1D14] dark:hover:text-white hover:bg-[#EFE8DD] dark:hover:bg-[#2F2621] rounded-lg transition-colors border border-[#E5DACD] dark:border-[#382B24] flex items-center gap-1.5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>

            {/* Delete Account */}
            {!showDeleteConfirm ? (
              <div className="p-3.5 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-rose-900 dark:text-rose-400 block">
                    Delete Account
                  </span>
                  <span className="text-[11px] text-rose-700 dark:text-rose-300">
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
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 rounded-xl space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5 text-rose-900 dark:text-rose-200">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-xs font-bold block">
                      Confirm Account Deletion
                    </span>
                    <p className="text-[11px] text-rose-700 dark:text-rose-300 mt-0.5">
                      Are you sure you want to permanently delete your account (<strong>{user.username}</strong>) and all saved beans, recipes, and notes from the server? This action cannot be undone.
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteConfirm(false)}
                    className="px-3 py-1.5 bg-white dark:bg-[#1E1916] text-[#2B1D14] dark:text-[#E8DDD0] border border-[#D5C7B8] dark:border-[#382B24] text-xs font-semibold rounded-lg hover:bg-[#FAF7F2] dark:hover:bg-[#251F1B] transition-colors cursor-pointer"
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
        <div className="px-6 py-3.5 border-t border-[#E5DACD] dark:border-[#382B24] bg-[#F4EDE4] dark:bg-[#251F1B] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#3A291E] hover:bg-[#251A13] dark:bg-[#C87D32] dark:hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
