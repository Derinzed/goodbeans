import React, { useState, useEffect, useMemo } from 'react';
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
  Plus,
  KeyRound,
  UserCheck,
  UserX,
  Edit,
  RotateCcw,
  Sparkles,
  MapPin,
  Wrench,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  ArrowUpDown,
  Eraser,
  Sliders,
  AlertTriangle,
  ExternalLink,
  ShieldAlert,
  Ban,
  Check,
} from 'lucide-react';
import { authApi, AdminUserSummary } from '../services/authApi';

interface ConfirmDialogState {
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  isDestructive?: boolean;
  onConfirm: () => Promise<void> | void;
}

interface AdminUsersModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  currentUserId: string;
  onRefreshCatalog?: () => void;
  onViewPublicProfile?: (username: string) => void;
}

export const AdminUsersModal: React.FC<AdminUsersModalProps> = ({
  isOpen,
  onClose,
  token,
  currentUserId,
  onRefreshCatalog,
  onViewPublicProfile,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'community' | 'blacklist' | 'ratings' | 'raw-data'>('users');
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // In-app Confirmation Dialog (replaces window.confirm)
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  // Emergency System Purge state
  const [isResetSystemOpen, setIsResetSystemOpen] = useState(false);
  const [resetSystemConfirmText, setResetSystemConfirmText] = useState('');
  const [isResettingSystem, setIsResettingSystem] = useState(false);

  // Ratings & Community state
  const [ratingsBreakdown, setRatingsBreakdown] = useState<{
    coffees: any[];
    equipment: any[];
    cafes: any[];
  }>({ coffees: [], equipment: [], cafes: [] });
  const [catalogTypeFilter, setCatalogTypeFilter] = useState<'coffees' | 'equipment' | 'cafes'>('coffees');
  const [catalogSearch, setCatalogSearch] = useState('');
  const [catalogSort, setCatalogSort] = useState<'rating-desc' | 'rating-asc' | 'reviews-desc' | 'name-asc'>('rating-desc');
  const [expandedRatingItemId, setExpandedRatingItemId] = useState<string | null>(null);

  // Dedicated Blacklist & Moderation State
  const [blacklist, setBlacklist] = useState<any[]>([]);
  const [blacklistSearch, setBlacklistSearch] = useState('');
  const [isAddBlacklistOpen, setIsAddBlacklistOpen] = useState(false);
  const [newBlacklistType, setNewBlacklistType] = useState<'coffee' | 'equipment' | 'cafe' | 'all'>('coffee');
  const [newBlacklistName, setNewBlacklistName] = useState('');
  const [newBlacklistSecondary, setNewBlacklistSecondary] = useState('');
  const [newBlacklistReason, setNewBlacklistReason] = useState('');
  const [isBlacklisting, setIsBlacklisting] = useState(false);

  // Raw Database state
  const [rawDbData, setRawDbData] = useState<any | null>(null);
  const [rawTableTab, setRawTableTab] = useState<'community' | 'blacklist' | 'deleted_seeds' | 'users' | 'sessions' | 'guests'>('community');
  const [rawSearchQuery, setRawSearchQuery] = useState('');
  const [copiedRaw, setCopiedRaw] = useState(false);

  // Dialog states for Manual Entry & Actions
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState<'user' | 'admin'>('user');
  const [includeSampleData, setIncludeSampleData] = useState(true);

  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [resetTargetUser, setResetTargetUser] = useState<AdminUserSummary | null>(null);
  const [resetNewPassword, setResetNewPassword] = useState('');

  // User Library Inspector Modal
  const [inspectUser, setInspectUser] = useState<AdminUserSummary | null>(null);
  const [inspectUserData, setInspectUserData] = useState<any | null>(null);
  const [inspectTab, setInspectTab] = useState<'coffees' | 'equipment' | 'cafes' | 'customNotes'>('coffees');
  const [isInspectingLoading, setIsInspectingLoading] = useState(false);

  // Inject Item Dialog
  const [isInjectItemOpen, setIsInjectItemOpen] = useState(false);
  const [injectCategory, setInjectCategory] = useState<'coffees' | 'equipment' | 'cafes'>('coffees');
  const [injectName, setInjectName] = useState('');
  const [injectSecondary, setInjectSecondary] = useState('');
  const [injectNotes, setInjectNotes] = useState('');
  const [injectRating, setInjectRating] = useState('5.0');

  // Manual Community Catalog Entry
  const [isAddCommunityItemOpen, setIsAddCommunityItemOpen] = useState(false);
  const [newEntryType, setNewEntryType] = useState<'coffee' | 'equipment' | 'cafe'>('coffee');
  const [newEntryName, setNewEntryName] = useState('');
  const [newEntrySecondary, setNewEntrySecondary] = useState('');
  const [newEntryOriginOrCat, setNewEntryOriginOrCat] = useState('');
  const [newEntryRating, setNewEntryRating] = useState('4.8');
  const [newEntryDescription, setNewEntryDescription] = useState('');

  // Edit Community Catalog Entry
  const [isEditCommunityItemOpen, setIsEditCommunityItemOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [editName, setEditName] = useState('');
  const [editSecondary, setEditSecondary] = useState('');
  const [editDesc, setEditDesc] = useState('');

  const fetchUsers = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.getAdminUsers(token);
      if (res.success && res.users) {
        setUsers(res.users);
        res.users.forEach((u: any) => {
          if (u.vault) {
            authApi.saveVaultToRegistry(u.vault);
          }
        });
      } else {
        setError(res.error || 'Failed to load registered users.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRatingsBreakdown = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.getAdminRatings(token);
      if (res.success) {
        setRatingsBreakdown({
          coffees: Array.isArray(res.coffees) ? res.coffees : [],
          equipment: Array.isArray(res.equipment) ? res.equipment : [],
          cafes: Array.isArray(res.cafes) ? res.cafes : [],
        });
      } else {
        setError(res.error || 'Failed to load ratings.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBlacklist = async () => {
    if (!token) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authApi.getAdminBlacklist(token);
      if (res.success && Array.isArray(res.blacklist)) {
        setBlacklist(res.blacklist);
      } else {
        setError(res.error || 'Failed to load blacklist.');
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
      if (activeTab === 'users') fetchUsers();
      else if (activeTab === 'community' || activeTab === 'ratings') fetchRatingsBreakdown();
      else if (activeTab === 'blacklist') fetchBlacklist();
      else if (activeTab === 'raw-data') fetchRawDatabase();
    }
  }, [isOpen, activeTab]);

  if (!isOpen) return null;

  // Filtered users
  const filteredUsers = users.filter((u) =>
    u.username.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase().trim())
  );

  const totalCoffeesAllUsers = users.reduce((acc, u) => acc + (u.coffeesCount || 0), 0);
  const totalGearAllUsers = users.reduce((acc, u) => acc + (u.equipmentCount || 0), 0);
  const totalNotesAllUsers = users.reduce((acc, u) => acc + (u.notesCount || 0), 0);

  // Filtered & sorted catalog / ratings items
  const currentCatalogList = ratingsBreakdown[catalogTypeFilter] || [];
  const filteredCatalogItems = currentCatalogList
    .filter((item: any) => {
      if (!catalogSearch.trim()) return true;
      const q = catalogSearch.toLowerCase().trim();
      return (
        (item.name && item.name.toLowerCase().includes(q)) ||
        (item.secondary && item.secondary.toLowerCase().includes(q)) ||
        (item.id && item.id.toLowerCase().includes(q))
      );
    })
    .sort((a: any, b: any) => {
      if (catalogSort === 'rating-desc') return (b.generalRating || 0) - (a.generalRating || 0);
      if (catalogSort === 'rating-asc') return (a.generalRating || 0) - (b.generalRating || 0);
      if (catalogSort === 'reviews-desc') return (b.ratingsCount || 0) - (a.ratingsCount || 0);
      if (catalogSort === 'name-asc') return (a.name || '').localeCompare(b.name || '');
      return 0;
    });

  // --- User Management Handlers ---
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newUsername.trim() || !newPassword) {
      setError('Username and password are required.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.createAdminUser(token, {
        username: newUsername.trim(),
        password: newPassword,
        role: newRole,
        initialData: includeSampleData ? undefined : {},
      });
      if (res.success) {
        if ((res as any).vault) {
          authApi.saveVaultToRegistry((res as any).vault);
        }
        setActionSuccess(`User "${newUsername.trim()}" created successfully as ${newRole}.`);
        setIsAddUserOpen(false);
        setNewUsername('');
        setNewPassword('');
        fetchUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to create user.');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating user.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleRole = async (user: AdminUserSummary) => {
    if (!token) return;
    if (user.id === currentUserId && user.role === 'admin') {
      setError('You cannot change your own admin account role.');
      return;
    }
    const targetRole = user.role === 'admin' ? 'user' : 'admin';
    setConfirmDialog({
      title: 'Change User Role',
      message: `Change @${user.username}'s role to "${targetRole}"?`,
      confirmLabel: `Change to ${targetRole}`,
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await authApi.updateAdminUserRole(token, user.id, targetRole);
          if (res.success) {
            setUsers((prev) =>
              prev.map((u) => (u.id === user.id ? { ...u, role: targetRole } : u))
            );
            setActionSuccess(`Updated @${user.username} role to ${targetRole}.`);
            setTimeout(() => setActionSuccess(null), 3000);
          } else {
            setError(res.error || 'Failed to update role.');
          }
        } catch {
          setError('Network error updating role.');
        }
      },
    });
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !resetTargetUser) return;
    if (!resetNewPassword || resetNewPassword.length < 3) {
      setError('Password must be at least 3 characters.');
      return;
    }
    setIsLoading(true);
    try {
      const res = await authApi.resetAdminUserPassword(token, resetTargetUser.id, resetNewPassword);
      if (res.success) {
        setActionSuccess(`Password for ${resetTargetUser.username} has been reset.`);
        setIsResetPasswordOpen(false);
        setResetTargetUser(null);
        setResetNewPassword('');
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to reset password.');
      }
    } catch {
      setError('Error resetting password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!token) return;
    if (userId === currentUserId) {
      setError('You cannot delete your own active admin account.');
      return;
    }

    setConfirmDialog({
      title: 'Delete User Account',
      message: `Are you sure you want to permanently delete user "@${username}" and all their coffees, equipment, cafes, notes, and shelves? This action cannot be undone.`,
      confirmLabel: 'Delete Account',
      isDestructive: true,
      onConfirm: async () => {
        setDeletingId(userId);
        try {
          const res = await authApi.deleteAdminUser(token, userId);
          if (res.success) {
            setUsers((prev) => prev.filter((u) => u.id !== userId));
            if (inspectUser?.id === userId) {
              setInspectUser(null);
              setInspectUserData(null);
            }
            setActionSuccess(`User "@${username}" and all associated data have been permanently purged.`);
            setTimeout(() => setActionSuccess(null), 3000);
          } else {
            setError(res.error || 'Failed to delete user.');
          }
        } catch (err: any) {
          setError(err?.message || 'Error deleting user.');
        } finally {
          setDeletingId(null);
        }
      },
    });
  };

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

  // --- Inspect Specific User's Library ---
  const handleOpenUserInspector = async (user: AdminUserSummary) => {
    if (!token) return;
    setInspectUser(user);
    setIsInspectingLoading(true);
    try {
      const res = await authApi.getUserDataAdmin(token, user.id);
      if (res.success) {
        setInspectUserData(res.data || {});
      } else {
        setError(res.error || 'Failed to fetch user library.');
      }
    } catch {
      setError('Error communicating with server.');
    } finally {
      setIsInspectingLoading(false);
    }
  };

  const handleDeleteUserItem = async (
    userId: string,
    category: 'coffees' | 'equipment' | 'cafes' | 'customNotes',
    itemId: string,
    itemName: string
  ) => {
    if (!token) return;
    setConfirmDialog({
      title: 'Remove User Item',
      message: `Remove "${itemName}" from this user's ${category}?`,
      confirmLabel: 'Remove Item',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await authApi.deleteUserItemAdmin(token, userId, category, itemId);
          if (res.success) {
            setActionSuccess(`Deleted "${itemName}" from user's ${category}.`);
            // Refresh local inspect data
            setInspectUserData((prev: any) => {
              if (!prev) return prev;
              return {
                ...prev,
                [category]: (prev[category] || []).filter((i: any) => i.id !== itemId),
              };
            });
            fetchUsers();
            setTimeout(() => setActionSuccess(null), 3000);
          } else {
            setError(res.error || 'Failed to delete item.');
          }
        } catch {
          setError('Error deleting item from user library.');
        }
      },
    });
  };

  const handleWipeUserLibrary = async (userId: string, username: string) => {
    if (!token) return;
    setConfirmDialog({
      title: 'Wipe User Library',
      message: `Clear all saved beans, gear, cafes, and custom notes for user "@${username}"? Their login account will remain active, but all saved data will be wiped.`,
      confirmLabel: 'Wipe All Data',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await authApi.clearUserDataAdmin(token, userId);
          if (res.success) {
            setActionSuccess(`Cleared library for @${username}.`);
            setInspectUserData({
              coffees: [],
              equipment: [],
              cafes: [],
              customNotes: [],
              customShelves: [],
            });
            fetchUsers();
            setTimeout(() => setActionSuccess(null), 3000);
          } else {
            setError(res.error || 'Failed to clear user library.');
          }
        } catch {
          setError('Error clearing user library.');
        }
      },
    });
  };

  const handleInjectItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !inspectUser) return;
    if (!injectName.trim()) {
      setError('Item name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const ratingNum = parseFloat(injectRating) || 5;
      const payload: any = {
        name: injectName.trim(),
        userRating: ratingNum,
      };

      if (injectCategory === 'coffees') {
        payload.roaster = injectSecondary.trim() || 'Specialty Roasters';
        payload.notes = injectNotes.trim() ? injectNotes.split(',').map((s) => s.trim()) : ['Artisan'];
        payload.origin = { country: 'Single Origin' };
        payload.process = 'Washed';
        payload.shelves = ['favorites'];
      } else if (injectCategory === 'equipment') {
        payload.brand = injectSecondary.trim() || 'Specialty Gear';
        payload.category = 'Accessory';
        payload.shelves = ['favorites'];
      } else {
        payload.city = injectSecondary.trim() || 'Coffee Capital';
        payload.shelves = ['favorites'];
      }

      const res = await authApi.addItemToUserAdmin(token, inspectUser.id, injectCategory, payload);
      if (res.success) {
        setActionSuccess(`Injected "${injectName.trim()}" into ${inspectUser.username}'s library.`);
        setIsInjectItemOpen(false);
        setInjectName('');
        setInjectSecondary('');
        setInjectNotes('');
        // Refresh local data
        setInspectUserData((prev: any) => ({
          ...prev,
          [injectCategory]: [res.item, ...(prev?.[injectCategory] || [])],
        }));
        fetchUsers();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to inject item.');
      }
    } catch {
      setError('Error injecting item into user library.');
    } finally {
      setIsLoading(false);
    }
  };

  // --- Community Catalog Handlers ---
  const handleCreateCommunityItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!newEntryName.trim()) {
      setError('Item name is required.');
      return;
    }

    setIsLoading(true);
    try {
      const ratingNum = parseFloat(newEntryRating) || 4.8;
      const itemPayload = {
        name: newEntryName.trim(),
        roaster: newEntryType === 'coffee' ? newEntrySecondary.trim() : undefined,
        brand: newEntryType === 'equipment' ? newEntrySecondary.trim() : undefined,
        city: newEntryType === 'cafe' ? newEntrySecondary.trim() : undefined,
        origin: newEntryType === 'coffee' ? { country: newEntryOriginOrCat.trim() || 'Single Origin' } : undefined,
        category: newEntryType === 'equipment' ? newEntryOriginOrCat.trim() || 'Accessory' : undefined,
        country: newEntryType === 'cafe' ? newEntryOriginOrCat.trim() || '' : undefined,
        description: newEntryDescription.trim(),
        userRating: ratingNum,
      };

      const res = await authApi.createAdminCommunityItem(token, newEntryType, itemPayload, ratingNum);
      if (res.success) {
        setActionSuccess(`Added "${newEntryName.trim()}" to the community ${newEntryType} catalog.`);
        setIsAddCommunityItemOpen(false);
        setNewEntryName('');
        setNewEntrySecondary('');
        setNewEntryOriginOrCat('');
        setNewEntryDescription('');
        fetchRatingsBreakdown();
        if (onRefreshCatalog) onRefreshCatalog();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to create community item.');
      }
    } catch {
      setError('Network error creating community item.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenEditItem = (item: any) => {
    setEditingItem(item);
    setEditName(item.name || '');
    setEditSecondary(item.secondary || '');
    setEditDesc(item.itemData?.description || item.itemData?.notes || '');
    setIsEditCommunityItemOpen(true);
  };

  const handleUpdateCommunityItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !editingItem) return;
    setIsLoading(true);
    try {
      const res = await authApi.updateAdminCommunityItem(token, editingItem.id, {
        name: editName.trim(),
        secondary: editSecondary.trim(),
        itemData: {
          ...editingItem.itemData,
          description: editDesc.trim(),
        },
      });
      if (res.success) {
        setActionSuccess(`Updated ${editName.trim()} in community catalog.`);
        setIsEditCommunityItemOpen(false);
        setEditingItem(null);
        fetchRatingsBreakdown();
        if (onRefreshCatalog) onRefreshCatalog();
        setTimeout(() => setActionSuccess(null), 3000);
      } else {
        setError(res.error || 'Failed to update item.');
      }
    } catch {
      setError('Error updating community item.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCommunityItem = async (itemId: string, name: string) => {
    if (!token) return;
    setConfirmDialog({
      title: 'Delete from Community Catalog',
      message: `Delete "${name}" from the community catalogue? It will be removed from community rankings and default seeds, but can be re-added in the future. To permanently prohibit this item from being added, use Blacklist instead.`,
      confirmLabel: 'Delete Entry',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await authApi.deleteAdminCommunityItem(token, itemId);
          if (res.success) {
            setActionSuccess(`"${name}" deleted from community catalogue.`);
            fetchRatingsBreakdown();
            if (onRefreshCatalog) onRefreshCatalog();
            setTimeout(() => setActionSuccess(null), 3000);
          } else {
            setError(res.error || 'Failed to delete item.');
          }
        } catch {
          setError('Error deleting community item.');
        }
      },
    });
  };

  const handleAddBlacklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !newBlacklistName.trim()) return;
    setIsBlacklisting(true);
    setError(null);
    try {
      const res = await authApi.addAdminBlacklist(token, {
        type: newBlacklistType,
        name: newBlacklistName.trim(),
        secondary: newBlacklistSecondary.trim() || undefined,
        reason: newBlacklistReason.trim() || undefined,
      });
      if (res.success) {
        setActionSuccess(`"${newBlacklistName.trim()}" added to community blacklist.`);
        setIsAddBlacklistOpen(false);
        setNewBlacklistName('');
        setNewBlacklistSecondary('');
        setNewBlacklistReason('');
        fetchBlacklist();
        fetchRatingsBreakdown();
        if (onRefreshCatalog) onRefreshCatalog();
        setTimeout(() => setActionSuccess(null), 3500);
      } else {
        setError(res.error || 'Failed to add item to blacklist.');
      }
    } catch {
      setError('Error adding item to blacklist.');
    } finally {
      setIsBlacklisting(false);
    }
  };

  const handleRemoveBlacklist = async (id: string, name: string) => {
    if (!token) return;
    setConfirmDialog({
      title: 'Remove from Blacklist',
      message: `Remove "${name}" from the blacklist? Users and administrators will once again be able to register and add this item to the community catalogue.`,
      confirmLabel: 'Unblock Item',
      isDestructive: false,
      onConfirm: async () => {
        try {
          const res = await authApi.removeAdminBlacklist(token, id);
          if (res.success) {
            setActionSuccess(`"${name}" unblocked and removed from blacklist.`);
            fetchBlacklist();
            if (onRefreshCatalog) onRefreshCatalog();
            setTimeout(() => setActionSuccess(null), 3500);
          } else {
            setError(res.error || 'Failed to remove item from blacklist.');
          }
        } catch {
          setError('Error removing item from blacklist.');
        }
      },
    });
  };

  const handleBlacklistFromCatalog = (item: any) => {
    setNewBlacklistType(item.type || 'coffee');
    setNewBlacklistName(item.name || '');
    setNewBlacklistSecondary(item.secondary || '');
    setNewBlacklistReason('Prohibited by Administrator');
    setIsAddBlacklistOpen(true);
    setActiveTab('blacklist');
  };

  const handleDeleteRating = async (itemId: string, raterKey: string, raterLabel: string) => {
    if (!token) return;
    setConfirmDialog({
      title: 'Remove User Rating',
      message: `Remove rating from ${raterLabel}? General rating will be immediately recalculated.`,
      confirmLabel: 'Remove Rating',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await authApi.deleteAdminItemRating(token, itemId, raterKey);
          if (res.success) {
            setActionSuccess(`Removed rating from ${raterLabel}. General rating recalculated.`);
            fetchRatingsBreakdown();
            if (onRefreshCatalog) onRefreshCatalog();
            setTimeout(() => setActionSuccess(null), 3000);
          } else {
            setError(res.error || 'Failed to delete rating.');
          }
        } catch {
          setError('Error deleting rating.');
        }
      },
    });
  };

  const handleResetAllRatings = async (itemId: string, name: string) => {
    if (!token) return;
    setConfirmDialog({
      title: 'Reset Ratings to Baseline',
      message: `Reset all user ratings for "${name}" back to 0? The item will revert to its baseline rating.`,
      confirmLabel: 'Reset Ratings',
      isDestructive: true,
      onConfirm: async () => {
        try {
          const res = await authApi.resetAdminItemRatings(token, itemId);
          if (res.success) {
            setActionSuccess(`Reset all ratings for "${name}".`);
            fetchRatingsBreakdown();
            if (onRefreshCatalog) onRefreshCatalog();
            setTimeout(() => setActionSuccess(null), 3000);
          } else {
            setError(res.error || 'Failed to reset ratings.');
          }
        } catch {
          setError('Error resetting ratings.');
        }
      },
    });
  };

  const handleRecalculateAllRatings = async () => {
    if (!token) return;
    setConfirmDialog({
      title: 'Recalculate All Ratings',
      message: 'Re-aggregate and recalculate General Ratings across all coffees, equipment, and cafes on the server?',
      confirmLabel: 'Recalculate',
      isDestructive: false,
      onConfirm: async () => {
        setIsLoading(true);
        try {
          const res = await authApi.recalculateAllRatings(token);
          if (res.success) {
            setActionSuccess(res.message || 'Recalculated all ratings successfully.');
            fetchRatingsBreakdown();
            if (onRefreshCatalog) onRefreshCatalog();
            setTimeout(() => setActionSuccess(null), 4000);
          } else {
            setError(res.error || 'Failed to recalculate ratings.');
          }
        } catch {
          setError('Network error recalculating ratings.');
        } finally {
          setIsLoading(false);
        }
      },
    });
  };

  // --- Raw Data Handlers ---
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

  const handleCleanSessions = async () => {
    if (!token) return;
    try {
      const res = await authApi.cleanAdminSessions(token);
      if (res.success) {
        setActionSuccess(res.message || 'Cleaned expired sessions.');
        fetchRawDatabase();
        setTimeout(() => setActionSuccess(null), 3500);
      }
    } catch {
      setError('Failed to clean sessions.');
    }
  };

  const handleCopyRaw = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedRaw(true);
    setTimeout(() => setCopiedRaw(false), 2000);
  };

  const handleEmergencySystemReset = async () => {
    if (!token) return;
    if (resetSystemConfirmText.trim().toUpperCase() !== 'RESET') {
      setError('Please type "RESET" in all capital letters to confirm this irreversible emergency purge.');
      return;
    }
    setIsResettingSystem(true);
    setError(null);
    try {
      const res = await authApi.emergencySystemReset(token);
      if (res.success) {
        setActionSuccess(
          res.message ||
            'Emergency system reset completed. All coffees, equipment, cafes, and non-admin users reverted to 0.'
        );
        setIsResetSystemOpen(false);
        setResetSystemConfirmText('');
        await fetchUsers();
        await fetchRatingsBreakdown();
        if (activeTab === 'raw-data') {
          await fetchRawDatabase();
        }
        if (onRefreshCatalog) {
          onRefreshCatalog();
        }
        setTimeout(() => setActionSuccess(null), 5000);
      } else {
        setError(res.error || 'Failed to execute emergency system reset.');
      }
    } catch {
      setError('Network error executing system reset.');
    } finally {
      setIsResettingSystem(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] text-[#2C241E] w-full max-w-5xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DACD] bg-[#F4EDE4]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#C87D32] flex items-center justify-center text-white shadow-xs">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-serif text-lg font-bold text-[#2B1D14]">
                  Administrator Console Suite
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-[#3A291E] text-white rounded-md uppercase tracking-wider flex items-center gap-1">
                  Full Authority
                </span>
              </div>
              <p className="text-[11px] text-[#7A6757]">
                User management, manual catalog entry, rating moderation, user library inspector & server raw data viewer
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setResetSystemConfirmText('');
                setError(null);
                setIsResetSystemOpen(true);
              }}
              className="px-2.5 py-1 bg-rose-100 hover:bg-rose-200 border border-rose-300 text-rose-800 text-[11px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
              title="Emergency: Reset server registry to 0 (coffees, equipment, cafes, non-admin users)"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
              <span className="hidden sm:inline">Reset Server (0)</span>
              <span className="sm:hidden">Reset</span>
            </button>
            <button
              onClick={() => {
                if (activeTab === 'users') fetchUsers();
                else if (activeTab === 'community' || activeTab === 'ratings') fetchRatingsBreakdown();
                else fetchRawDatabase();
              }}
              disabled={isLoading}
              title="Refresh Current View"
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

        {/* Global Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 px-6 py-2.5 bg-[#EDE4D8]/80 border-b border-[#E5DACD] text-[11px]">
          <div className="flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#C87D32]" />
            <span className="text-[#6D5A4E]">Users:</span>
            <strong className="text-[#2B1D14] font-mono">{users.length}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Coffee className="w-3.5 h-3.5 text-[#C87D32]" />
            <span className="text-[#6D5A4E]">User Beans:</span>
            <strong className="text-[#2B1D14] font-mono">{totalCoffeesAllUsers}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-[#C87D32]" />
            <span className="text-[#6D5A4E]">User Gear:</span>
            <strong className="text-[#2B1D14] font-mono">{totalGearAllUsers}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Star className="w-3.5 h-3.5 text-[#C87D32]" />
            <span className="text-[#6D5A4E]">Catalog Items:</span>
            <strong className="text-[#2B1D14] font-mono">
              {(ratingsBreakdown.coffees?.length || 0) + (ratingsBreakdown.equipment?.length || 0) + (ratingsBreakdown.cafes?.length || 0)}
            </strong>
          </div>
          <div className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-[#6D5A4E]">Storage:</span>
            <span className="font-mono text-[10px] text-emerald-800 font-semibold">/data (Persistent)</span>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-[#E5DACD] bg-[#FAF7F2] p-1.5 px-6 gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'users'
                ? 'bg-white text-[#2B1D14] shadow-xs border border-[#E5DACD]'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Users & Libraries ({users.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('community');
              fetchRatingsBreakdown();
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'community'
                ? 'bg-white text-[#2B1D14] shadow-xs border border-[#E5DACD]'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <Coffee className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Community Catalog & Manual Entry</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('blacklist');
              fetchBlacklist();
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'blacklist'
                ? 'bg-white text-[#2B1D14] shadow-xs border border-[#E5DACD]'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            <span>Blacklist & Blocked Registry ({blacklist.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('ratings');
              fetchRatingsBreakdown();
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'ratings'
                ? 'bg-white text-[#2B1D14] shadow-xs border border-[#E5DACD]'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <Star className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Ratings Preview & Moderation</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('raw-data');
              if (!rawDbData) fetchRawDatabase();
            }}
            className={`py-2 px-3 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer whitespace-nowrap ${
              activeTab === 'raw-data'
                ? 'bg-white text-[#2B1D14] shadow-xs border border-[#E5DACD]'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <Database className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Server Raw Data Inspector</span>
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {actionSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2 animate-fade-in shadow-2xs">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{error}</span>
              </div>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* TAB 1: USERS & LIBRARIES */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Header Action Bar */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C7A6D]">
                    <Search className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by username or ID..."
                    className="w-full pl-9 pr-4 py-2 bg-white rounded-xl border border-[#D5C7B8] text-xs text-[#2C2017] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
                  />
                </div>
                <button
                  onClick={() => setIsAddUserOpen(true)}
                  className="px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create User Account</span>
                </button>
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
                                <button
                                  onClick={() => handleToggleRole(u)}
                                  disabled={isSelf}
                                  title="Click to toggle user/admin role"
                                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer transition-opacity ${
                                    u.role === 'admin'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200'
                                      : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                                  } ${isSelf ? 'opacity-70 cursor-not-allowed' : ''}`}
                                >
                                  {u.role === 'admin' ? <Shield className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
                                  {u.role}
                                </button>
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-[#6D5A4E]">
                                {new Date(u.createdAt).toLocaleDateString()}
                              </td>
                              <td className="py-3 px-3 font-mono text-[11px] text-[#6D5A4E]">
                                {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                              </td>
                              <td className="py-3 px-3">
                                <div className="flex items-center gap-2 text-[11px] text-[#554032]">
                                  <span className="inline-flex items-center gap-0.5 font-medium">
                                    <Coffee className="w-3 h-3 text-[#C87D32]" />
                                    {u.coffeesCount || 0} beans
                                  </span>
                                  <span className="text-[#DACDC0]">·</span>
                                  <span className="inline-flex items-center gap-0.5 font-medium">
                                    <Layers className="w-3 h-3 text-[#7A6757]" />
                                    {u.equipmentCount || 0} gear
                                  </span>
                                </div>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {onViewPublicProfile && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        onClose();
                                        onViewPublicProfile(u.username);
                                      }}
                                      title="View Public Profile"
                                      className="p-1.5 text-[#3A291E] hover:text-[#C87D32] hover:bg-[#F2E8DC] rounded-md transition-colors cursor-pointer"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => handleOpenUserInspector(u)}
                                    title="Inspect & Edit User's Saved Library"
                                    className="p-1.5 text-[#C87D32] hover:text-[#9A5B1E] hover:bg-[#FAF1E4] rounded-md transition-colors cursor-pointer flex items-center gap-1 font-semibold text-[11px]"
                                  >
                                    <Eye className="w-3.5 h-3.5" />
                                    <span className="hidden md:inline">Inspect Library</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setResetTargetUser(u);
                                      setResetNewPassword('');
                                      setIsResetPasswordOpen(true);
                                    }}
                                    title="Reset User Password"
                                    className="p-1.5 text-[#6D5A4E] hover:text-[#2B1D14] hover:bg-[#F2E8DC] rounded-md transition-colors cursor-pointer"
                                  >
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
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
                                      title="Permanently Delete User and All Data"
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
          )}

          {/* TAB 2: COMMUNITY CATALOG (MANUAL ENTRY & DELETION) */}
          {activeTab === 'community' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#2B1D14]">
                    Community Catalog Directory
                  </h4>
                  <p className="text-xs text-[#7A6757]">
                    Manage official community entries, add new coffees/gear/cafes, edit details, or remove entries
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecalculateAllRatings}
                    className="px-3 py-2 bg-white hover:bg-[#F2E8DC] text-[#6D5A4E] border border-[#D5C7B8] text-xs font-semibold rounded-xl shadow-2xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                    title="Force recalculation of all ratings"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#C87D32]" />
                    <span>Recalculate All Ratings</span>
                  </button>
                  <button
                    onClick={() => setIsAddCommunityItemOpen(true)}
                    className="px-4 py-2 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>+ New Catalog Entry</span>
                  </button>
                </div>
              </div>

              {/* Controls bar: Category filter, search, sort */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-2 border-b border-[#E5DACD]">
                <div className="flex gap-2">
                  {(['coffees', 'equipment', 'cafes'] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setCatalogTypeFilter(t)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                        catalogTypeFilter === t
                          ? 'bg-[#3A291E] text-white shadow-2xs'
                          : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                      }`}
                    >
                      {t} ({ratingsBreakdown[t]?.length || 0})
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2 flex-1 sm:max-w-md">
                  <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#8C7A6D]">
                      <Search className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={catalogSearch}
                      onChange={(e) => setCatalogSearch(e.target.value)}
                      placeholder={`Search ${catalogTypeFilter}...`}
                      className="w-full pl-8 pr-3 py-1.5 bg-white rounded-lg border border-[#D5C7B8] text-xs text-[#2C2017] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                    />
                  </div>
                  <select
                    value={catalogSort}
                    onChange={(e: any) => setCatalogSort(e.target.value)}
                    className="bg-white border border-[#D5C7B8] rounded-lg px-2.5 py-1.5 text-xs text-[#2C2017] focus:outline-none"
                  >
                    <option value="rating-desc">Rating: High to Low</option>
                    <option value="rating-asc">Rating: Low to High</option>
                    <option value="reviews-desc">Most Reviews</option>
                    <option value="name-asc">Name: A to Z</option>
                  </select>
                </div>
              </div>

              {/* Items Grid / Table */}
              <div className="bg-white rounded-xl border border-[#E0D5C7] overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-[#F6EFE6] border-b border-[#E8DDD0] text-[#7A6757] font-semibold">
                        <th className="py-2.5 px-4">Item Name</th>
                        <th className="py-2.5 px-3">Roaster / Brand / City</th>
                        <th className="py-2.5 px-3">General Rating</th>
                        <th className="py-2.5 px-3">Total Reviews</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E6DB]">
                      {filteredCatalogItems.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="text-center py-8 text-[#8C7A6D]">
                            {catalogSearch ? 'No entries match your search.' : 'No entries found in this category.'}
                          </td>
                        </tr>
                      ) : (
                        filteredCatalogItems.map((item: any) => (
                          <tr key={item.id} className="hover:bg-[#FAF7F2] transition-colors">
                            <td className="py-3 px-4 font-semibold text-[#2B1D14]">
                              <div>{item.name}</div>
                              <span className="font-mono text-[10px] text-[#A8988A] block">
                                ID: {item.id}
                              </span>
                              {item.generalTastingNotes && item.generalTastingNotes.length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {item.generalTastingNotes.slice(0, 3).map((n: string) => (
                                    <span
                                      key={n}
                                      className="text-[9px] px-1.5 py-0.2 bg-[#FAF3EC] text-[#8C4F1A] border border-[#E8DACB] rounded font-medium"
                                    >
                                      {n}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-3 text-[#6D5A4E] font-medium">
                              {item.secondary || '—'}
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-[#8C4F1A]">
                              ★ {item.generalRating?.toFixed(1) || '0.0'}
                            </td>
                            <td className="py-3 px-3 font-mono text-[#6D5A4E]">
                              {item.ratingsCount || 0} reviews ({item.userCount || 0} users)
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleOpenEditItem(item)}
                                  title="Edit Entry Details"
                                  className="p-1.5 text-[#6D5A4E] hover:text-[#2B1D14] hover:bg-[#F2E8DC] rounded-md transition-colors cursor-pointer"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleResetAllRatings(item.id, item.name)}
                                  title="Reset Ratings to baseline"
                                  className="p-1.5 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleBlacklistFromCatalog(item)}
                                  title="Blacklist & Ban this item from community catalogue"
                                  className="p-1.5 text-amber-700 hover:text-rose-700 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <ShieldAlert className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCommunityItem(item.id, item.name)}
                                  title="Delete Community Entry (can be re-added later)"
                                  className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2b: BLACKLIST & BLOCKED REGISTRY */}
          {activeTab === 'blacklist' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#2B1D14] flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <span>Community Blacklist & Blocked Registry</span>
                  </h4>
                  <p className="text-xs text-[#7A6757]">
                    Explicitly prohibit inappropriate, spam, or duplicate items from being registered in the community catalogue. Items on this list cannot be added by any user.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddBlacklistOpen(!isAddBlacklistOpen)}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Blacklist Rule</span>
                  </button>
                  <button
                    type="button"
                    onClick={fetchBlacklist}
                    title="Refresh Blacklist"
                    className="p-1.5 bg-[#FAF3EC] hover:bg-[#F0E4D6] border border-[#E5DACD] text-[#8C4F1A] rounded-lg transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                </div>
              </div>

              {/* Add Blacklist Rule Collapsible Form */}
              {isAddBlacklistOpen && (
                <form
                  onSubmit={handleAddBlacklist}
                  className="bg-rose-50/70 border border-rose-200 rounded-xl p-4 space-y-3 animate-fade-in shadow-2xs"
                >
                  <div className="flex items-center justify-between border-b border-rose-200 pb-2">
                    <h5 className="font-bold text-xs text-rose-900 flex items-center gap-1.5">
                      <Ban className="w-3.5 h-3.5 text-rose-600" />
                      <span>Create New Blacklist Entry</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setIsAddBlacklistOpen(false)}
                      className="text-rose-600 hover:text-rose-900 text-xs cursor-pointer"
                    >
                      Cancel
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div>
                      <label className="block text-[#6D5A4E] font-medium mb-1">Target Category *</label>
                      <select
                        value={newBlacklistType}
                        onChange={(e) => setNewBlacklistType(e.target.value as any)}
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg focus:outline-none focus:border-rose-500 font-medium text-[#2B1D14]"
                      >
                        <option value="coffee">Coffee Beans</option>
                        <option value="equipment">Brewing Equipment</option>
                        <option value="cafe">Cafes</option>
                        <option value="all">All Categories</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[#6D5A4E] font-medium mb-1">Item Name *</label>
                      <input
                        type="text"
                        value={newBlacklistName}
                        onChange={(e) => setNewBlacklistName(e.target.value)}
                        placeholder="Exact or clean item name..."
                        required
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg focus:outline-none focus:border-rose-500 text-[#2B1D14]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#6D5A4E] font-medium mb-1">
                        Roaster / Brand / City (Optional)
                      </label>
                      <input
                        type="text"
                        value={newBlacklistSecondary}
                        onChange={(e) => setNewBlacklistSecondary(e.target.value)}
                        placeholder="Leave blank for any roaster/brand"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg focus:outline-none focus:border-rose-500 text-[#2B1D14]"
                      />
                    </div>

                    <div>
                      <label className="block text-[#6D5A4E] font-medium mb-1">Moderation Reason</label>
                      <input
                        type="text"
                        value={newBlacklistReason}
                        onChange={(e) => setNewBlacklistReason(e.target.value)}
                        placeholder="e.g. Inappropriate / Spam entry"
                        className="w-full px-2.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg focus:outline-none focus:border-rose-500 text-[#2B1D14]"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddBlacklistOpen(false)}
                      className="px-3 py-1.5 text-xs text-[#6D5A4E] hover:text-[#2B1D14] bg-white border border-[#D5C7B8] rounded-lg transition-colors cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isBlacklisting || !newBlacklistName.trim()}
                      className="px-4 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <ShieldAlert className="w-3.5 h-3.5" />
                      <span>{isBlacklisting ? 'Blacklisting...' : 'Confirm Blacklist Rule'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* Search filter for blacklisted items */}
              <div className="flex items-center justify-between gap-3 bg-[#FAF7F2] p-2 rounded-xl border border-[#E5DACD]">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#A8988A]" />
                  <input
                    type="text"
                    value={blacklistSearch}
                    onChange={(e) => setBlacklistSearch(e.target.value)}
                    placeholder="Search blocked entries by name, roaster, or reason..."
                    className="w-full pl-9 pr-3 py-1.5 bg-white border border-[#D5C7B8] rounded-lg text-xs text-[#2B1D14] placeholder-[#A8988A] focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="text-xs text-[#7A6757] font-mono whitespace-nowrap">
                  {blacklist.length} rules active
                </div>
              </div>

              {/* Blacklist Table */}
              <div className="bg-white rounded-xl border border-[#E5DACD] overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-[420px]">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#FAF7F2] border-b border-[#E5DACD] sticky top-0 z-10 text-[#6D5A4E] font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Type</th>
                        <th className="py-2.5 px-4">Prohibited Item</th>
                        <th className="py-2.5 px-3">Roaster / Brand / City</th>
                        <th className="py-2.5 px-3">Moderation Reason</th>
                        <th className="py-2.5 px-3">Blocked On</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E6DB]">
                      {blacklist.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-10 text-[#8C7A6D]">
                            <div className="flex flex-col items-center justify-center gap-1.5">
                              <ShieldAlert className="w-8 h-8 text-[#C8B8A6]" />
                              <div className="font-semibold text-[#2B1D14]">No items currently on the blacklist</div>
                              <p className="text-[11px] text-[#A8988A] max-w-sm">
                                All items in the catalogue can be freely registered or re-added. Add a blacklist rule above to permanently block specific entries.
                              </p>
                            </div>
                          </td>
                        </tr>
                      ) : (
                        (() => {
                          const q = blacklistSearch.toLowerCase().trim();
                          const filtered = blacklist.filter((b: any) => {
                            if (!q) return true;
                            return (
                              (b.name && b.name.toLowerCase().includes(q)) ||
                              (b.secondary && b.secondary.toLowerCase().includes(q)) ||
                              (b.reason && b.reason.toLowerCase().includes(q)) ||
                              (b.type && b.type.toLowerCase().includes(q))
                            );
                          });

                          if (filtered.length === 0) {
                            return (
                              <tr>
                                <td colSpan={6} className="text-center py-8 text-[#8C7A6D]">
                                  No blacklisted entries match "{blacklistSearch}".
                                </td>
                              </tr>
                            );
                          }

                          return filtered.map((entry: any) => (
                            <tr key={entry.id} className="hover:bg-rose-50/40 transition-colors">
                              <td className="py-3 px-3">
                                <span
                                  className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                                    entry.type === 'coffee'
                                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                      : entry.type === 'equipment'
                                      ? 'bg-blue-100 text-blue-900 border border-blue-300'
                                      : entry.type === 'cafe'
                                      ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                                      : 'bg-purple-100 text-purple-900 border border-purple-300'
                                  }`}
                                >
                                  {entry.type}
                                </span>
                              </td>
                              <td className="py-3 px-4 font-semibold text-[#2B1D14]">
                                <div>{entry.name}</div>
                                <span className="font-mono text-[9px] text-[#A8988A] block">
                                  ID: {entry.id}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-[#6D5A4E]">
                                {entry.secondary || <span className="text-[#A8988A] italic">Any</span>}
                              </td>
                              <td className="py-3 px-3 text-[#6D5A4E] max-w-[200px] truncate">
                                <span title={entry.reason}>{entry.reason || 'Administrative ban'}</span>
                              </td>
                              <td className="py-3 px-3 text-[#7A6757] text-[11px] whitespace-nowrap">
                                <div>{entry.createdAt ? new Date(entry.createdAt).toLocaleDateString() : '—'}</div>
                                <span className="text-[10px] text-[#A8988A]">by {entry.blacklistedBy || 'Admin'}</span>
                              </td>
                              <td className="py-3 px-4 text-right">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveBlacklist(entry.id, entry.name)}
                                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 hover:text-emerald-900 border border-emerald-200 rounded-md text-xs font-semibold transition-colors cursor-pointer shadow-2xs inline-flex items-center gap-1"
                                >
                                  <Check className="w-3 h-3 text-emerald-600" />
                                  <span>Unblock</span>
                                </button>
                              </td>
                            </tr>
                          ));
                        })()
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: RATINGS PREVIEW & MODERATION */}
          {activeTab === 'ratings' && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-serif font-bold text-base text-[#2B1D14]">
                    User Ratings Breakdown & Moderation Suite
                  </h4>
                  <p className="text-xs text-[#7A6757]">
                    Preview all aggregated and individual user ratings. Expand any card to inspect or delete specific user scores.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRecalculateAllRatings}
                    className="px-3 py-1.5 bg-[#FAF3EC] hover:bg-[#F0E4D6] border border-[#E5DACD] text-xs font-semibold text-[#8C4F1A] rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-[#C87D32]" />
                    <span>Recalculate All Ratings</span>
                  </button>
                  <div className="flex gap-1">
                    {(['coffees', 'equipment', 'cafes'] as const).map((t) => (
                      <button
                        key={t}
                        onClick={() => setCatalogTypeFilter(t)}
                        className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                          catalogTypeFilter === t
                            ? 'bg-[#3A291E] text-white shadow-2xs'
                            : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Items List with expandable user ratings */}
              <div className="space-y-3">
                {filteredCatalogItems.length === 0 ? (
                  <div className="bg-white p-8 rounded-xl border border-[#E0D5C7] text-center text-xs text-[#8C7A6D]">
                    No items found.
                  </div>
                ) : (
                  filteredCatalogItems.map((item: any) => {
                    const isExpanded = expandedRatingItemId === item.id;
                    const userRatingsList: any[] = Array.isArray(item.userRatings) ? item.userRatings : [];

                    return (
                      <div
                        key={item.id}
                        className="bg-white rounded-xl border border-[#E0D5C7] overflow-hidden shadow-2xs transition-all"
                      >
                        {/* Item Summary Bar */}
                        <div
                          onClick={() => setExpandedRatingItemId(isExpanded ? null : item.id)}
                          className="p-3.5 flex items-center justify-between hover:bg-[#FAF7F2] transition-colors cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-[#FAF1E4] rounded-lg text-[#C87D32]">
                              <Star className="w-4 h-4 fill-current" />
                            </div>
                            <div>
                              <span className="font-serif font-bold text-sm text-[#2B1D14] block">
                                {item.name}
                              </span>
                              <span className="text-[11px] text-[#7A6757]">
                                {item.secondary || 'Artisan'} · Total reviews: {item.ratingsCount || 0}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className="font-mono text-sm font-bold text-[#8C4F1A] block">
                                ★ {item.generalRating?.toFixed(1) || '0.0'}
                              </span>
                              <span className="text-[10px] text-[#8C7A6D]">
                                {userRatingsList.length} user reviews recorded
                              </span>
                            </div>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4 text-[#8C7A6D]" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-[#8C7A6D]" />
                            )}
                          </div>
                        </div>

                        {/* Expanded User Breakdown Panel */}
                        {isExpanded && (
                          <div className="p-4 bg-[#FAF7F2] border-t border-[#EDE2D4] space-y-3">
                            {item.type === 'coffee' && item.generalTastingNotes && item.generalTastingNotes.length > 0 && (
                              <div className="p-3 bg-white rounded-lg border border-[#E0D5C7] space-y-1.5 shadow-2xs">
                                <span className="text-[10px] uppercase font-bold text-[#8C4F1A] tracking-wider block">
                                  Server Consensus Tasting Notes (Top 5 Proper Casing):
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {item.generalTastingNotes.map((note: string) => {
                                    const count = item.tastingNotesBreakdown?.find(
                                      (b: any) => b.note.toLowerCase() === note.toLowerCase()
                                    )?.count;
                                    return (
                                      <span
                                        key={note}
                                        className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 bg-[#FAF3EC] text-[#553E2E] rounded border border-[#DFCFC0] font-semibold"
                                      >
                                        <span>{note}</span>
                                        {count !== undefined && count > 0 && (
                                          <span className="text-[10px] px-1.5 py-0.2 bg-[#E6DACB] text-[#554032] rounded-full font-mono">
                                            {count}
                                          </span>
                                        )}
                                      </span>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            <div className="flex items-center justify-between text-xs">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-[#8C4F1A]">
                                  Individual User Ratings Breakdown:
                                </span>
                              </div>
                              <button
                                onClick={() => handleResetAllRatings(item.id, item.name)}
                                className="text-[11px] text-amber-700 hover:text-amber-900 underline font-medium cursor-pointer"
                              >
                                Reset all user ratings to 0
                              </button>
                            </div>

                            {userRatingsList.length === 0 ? (
                              <p className="text-xs text-[#8C7A6D] italic">
                                No individual user ratings recorded yet. General rating defaults to 0.0 until evaluated by registered baristas.
                              </p>
                            ) : (
                              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                                {userRatingsList.map((ur) => (
                                  <div
                                    key={ur.userId}
                                    className="p-2.5 bg-white rounded-lg border border-[#E0D5C7] flex items-center justify-between text-xs shadow-2xs"
                                  >
                                    <div>
                                      <span className="font-semibold text-[#2B1D14] block">
                                        {ur.username}
                                      </span>
                                      <span className="text-[10px] text-[#8C7A6D] font-mono">
                                        ID: {ur.userId}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className="font-mono font-bold text-[#8C4F1A]">
                                        {ur.rating.toFixed(1)} ★
                                      </span>
                                      <button
                                        onClick={() => handleDeleteRating(item.id, ur.userId, ur.username)}
                                        title="Delete this user rating"
                                        className="p-1 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded cursor-pointer"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SERVER RAW DATA INSPECTOR */}
          {activeTab === 'raw-data' && (
            <div className="space-y-4">
              {/* Server Access Guide Box */}
              <div className="p-4 bg-[#FAF3EC] border border-[#E5DACD] rounded-xl space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#C87D32]" />
                    <span className="font-serif font-bold text-sm text-[#2B1D14]">
                      How Administrators Access Server Raw Data
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setResetSystemConfirmText('');
                        setIsResetSystemOpen(true);
                      }}
                      className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-300 text-xs font-semibold text-rose-700 rounded-lg transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                      title="Emergency: Revert all stored server information to 0"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                      <span>Emergency Reset (Revert to 0)</span>
                    </button>
                    <button
                      onClick={handleCleanSessions}
                      className="px-2.5 py-1.5 bg-[#FAF7F2] hover:bg-[#F2E8DC] border border-[#D5C7B8] text-xs font-semibold text-[#3A291E] rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Clear expired sessions from sessions.json"
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#C87D32]" />
                      <span>Clean Stale Sessions</span>
                    </button>
                    <button
                      onClick={handleDownloadFullDump}
                      disabled={!rawDbData}
                      className="px-3 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Full DB Dump (.json)</span>
                    </button>
                  </div>
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

              {/* Emergency Reset Callout Banner */}
              <div className="p-4 bg-rose-50/80 border border-rose-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-start gap-2.5">
                  <div className="p-2 bg-rose-100 rounded-lg text-rose-700 mt-0.5 shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-serif font-bold text-sm text-rose-950">
                      Emergency Server Purge &amp; Factory Reset to Zero
                    </h5>
                    <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                      Removes all community coffees, equipment, and cafes from the server registry. Deletes all non-admin user accounts and guest caches to revert stored data to 0. Administrator accounts remain active, and users can re-populate their data anytime by importing their backup JSON files.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setResetSystemConfirmText('');
                    setIsResetSystemOpen(true);
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-semibold shrink-0 shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Execute Reset to 0</span>
                </button>
              </div>

              {/* Raw Table Selector & Filter */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5DACD] pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => setRawTableTab('community')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      rawTableTab === 'community'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Community Ratings (community_items.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('blacklist')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      rawTableTab === 'blacklist'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Blacklist Registry (blacklisted_items.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('deleted_seeds')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      rawTableTab === 'deleted_seeds'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Deleted Seeds (deleted_seeds.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('users')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      rawTableTab === 'users'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Users & Libraries (users.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('sessions')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      rawTableTab === 'sessions'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Sessions (sessions.json)
                  </button>
                  <button
                    onClick={() => setRawTableTab('guests')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                      rawTableTab === 'guests'
                        ? 'bg-[#3A291E] text-white shadow-2xs'
                        : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                    }`}
                  >
                    Guest Libraries (guests.json)
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <div className="relative">
                    <input
                      type="text"
                      value={rawSearchQuery}
                      onChange={(e) => setRawSearchQuery(e.target.value)}
                      placeholder="Filter JSON contents..."
                      className="px-2.5 py-1 text-xs bg-white border border-[#D5C7B8] rounded-md focus:outline-none"
                    />
                  </div>
                  {rawDbData && (
                    <button
                      onClick={() => {
                        const content = JSON.stringify(
                          rawTableTab === 'community'
                            ? rawDbData.tables?.communityItems?.records
                            : rawTableTab === 'blacklist'
                            ? rawDbData.tables?.blacklistedItems?.records
                            : rawTableTab === 'deleted_seeds'
                            ? rawDbData.tables?.deletedSeeds?.records
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
                        : rawTableTab === 'blacklist'
                        ? 'blacklisted_items.json'
                        : rawTableTab === 'deleted_seeds'
                        ? 'deleted_seeds.json'
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
                    : (() => {
                        const targetObj =
                          rawTableTab === 'community'
                            ? rawDbData?.tables?.communityItems?.records || {}
                            : rawTableTab === 'blacklist'
                            ? rawDbData?.tables?.blacklistedItems?.records || []
                            : rawTableTab === 'deleted_seeds'
                            ? rawDbData?.tables?.deletedSeeds?.records || []
                            : rawTableTab === 'users'
                            ? rawDbData?.tables?.users?.records || []
                            : rawTableTab === 'sessions'
                            ? rawDbData?.tables?.sessions?.records || []
                            : rawDbData?.tables?.guests?.records || {};

                        const rawString = JSON.stringify(targetObj, null, 2);
                        if (!rawSearchQuery.trim()) return rawString;

                        // Filter lines matching search
                        const lines = rawString.split('\n');
                        const matched = lines.filter((l) =>
                          l.toLowerCase().includes(rawSearchQuery.toLowerCase().trim())
                        );
                        return `// Filtered for "${rawSearchQuery}" (${matched.length} lines found):\n` + matched.join('\n');
                      })()}
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
              : activeTab === 'community' || activeTab === 'ratings'
              ? `${ratingsBreakdown.coffees.length} coffees · ${ratingsBreakdown.equipment.length} equipment · ${ratingsBreakdown.cafes.length} cafes`
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

      {/* MODAL 1: ADD NEW USER */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
              <h4 className="font-serif font-bold text-lg text-[#2B1D14]">Create New User Account</h4>
              <button onClick={() => setIsAddUserOpen(false)} className="text-[#8C7A6D] hover:text-[#2B1D14]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateUser} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold block mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="e.g. barista_mike"
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Password</label>
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Account Role</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNewRole('user')}
                    className={`flex-1 p-2 rounded-lg font-semibold border cursor-pointer ${
                      newRole === 'user' ? 'bg-[#3A291E] text-white border-[#3A291E]' : 'bg-white text-[#6D5A4E] border-[#D5C7B8]'
                    }`}
                  >
                    Standard User
                  </button>
                  <button
                    type="button"
                    onClick={() => setNewRole('admin')}
                    className={`flex-1 p-2 rounded-lg font-semibold border cursor-pointer ${
                      newRole === 'admin' ? 'bg-[#C87D32] text-white border-[#C87D32]' : 'bg-white text-[#6D5A4E] border-[#D5C7B8]'
                    }`}
                  >
                    Administrator
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={includeSampleData}
                  onChange={(e) => setIncludeSampleData(e.target.checked)}
                  className="rounded text-[#C87D32] focus:ring-[#C87D32]"
                />
                <span className="text-[#6D5A4E]">Pre-seed user library with standard coffee shelf sample catalog</span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg text-[#6D5A4E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: RESET PASSWORD */}
      {isResetPasswordOpen && resetTargetUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
              <h4 className="font-serif font-bold text-base text-[#2B1D14]">Reset Password</h4>
              <button onClick={() => setIsResetPasswordOpen(false)} className="text-[#8C7A6D] hover:text-[#2B1D14]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleResetPassword} className="space-y-3 text-xs">
              <p className="text-[#6D5A4E]">
                Set a new password for account <strong>{resetTargetUser.username}</strong>:
              </p>
              <div>
                <label className="font-semibold block mb-1">New Password</label>
                <input
                  type="password"
                  required
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  placeholder="Min 3 characters"
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg text-[#6D5A4E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD COMMUNITY ITEM (MANUAL DATA ENTRY) */}
      {isAddCommunityItemOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
              <h4 className="font-serif font-bold text-lg text-[#2B1D14]">Add to Community Catalog</h4>
              <button onClick={() => setIsAddCommunityItemOpen(false)} className="text-[#8C7A6D] hover:text-[#2B1D14]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateCommunityItem} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Item Category</label>
                <div className="flex gap-2">
                  {(['coffee', 'equipment', 'cafe'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setNewEntryType(cat)}
                      className={`flex-1 p-2 rounded-lg font-semibold capitalize border cursor-pointer ${
                        newEntryType === cat
                          ? 'bg-[#3A291E] text-white border-[#3A291E]'
                          : 'bg-white text-[#6D5A4E] border-[#D5C7B8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={newEntryName}
                  onChange={(e) => setNewEntryName(e.target.value)}
                  placeholder={
                    newEntryType === 'coffee'
                      ? 'e.g. Tropical Weather'
                      : newEntryType === 'equipment'
                      ? 'e.g. Ode Gen 2'
                      : 'e.g. Blue Bottle Cafe'
                  }
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {newEntryType === 'coffee' ? 'Roaster' : newEntryType === 'equipment' ? 'Brand' : 'City'}
                </label>
                <input
                  type="text"
                  required
                  value={newEntrySecondary}
                  onChange={(e) => setNewEntrySecondary(e.target.value)}
                  placeholder={
                    newEntryType === 'coffee'
                      ? 'e.g. Onyx Coffee Lab'
                      : newEntryType === 'equipment'
                      ? 'e.g. Fellow'
                      : 'e.g. San Francisco'
                  }
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {newEntryType === 'coffee' ? 'Origin Country' : newEntryType === 'equipment' ? 'Equipment Category' : 'Country'}
                </label>
                <input
                  type="text"
                  value={newEntryOriginOrCat}
                  onChange={(e) => setNewEntryOriginOrCat(e.target.value)}
                  placeholder={
                    newEntryType === 'coffee'
                      ? 'e.g. Ethiopia'
                      : newEntryType === 'equipment'
                      ? 'e.g. Grinder'
                      : 'e.g. USA'
                  }
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Initial / Official Rating</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={newEntryRating}
                  onChange={(e) => setNewEntryRating(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Description / Flavor Notes</label>
                <textarea
                  rows={2}
                  value={newEntryDescription}
                  onChange={(e) => setNewEntryDescription(e.target.value)}
                  placeholder="Flavor notes, technical specifications, or location review..."
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCommunityItemOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg text-[#6D5A4E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: EDIT COMMUNITY ITEM */}
      {isEditCommunityItemOpen && editingItem && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-md rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
              <h4 className="font-serif font-bold text-lg text-[#2B1D14]">Edit Community Entry</h4>
              <button onClick={() => setIsEditCommunityItemOpen(false)} className="text-[#8C7A6D] hover:text-[#2B1D14]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleUpdateCommunityItem} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Name</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Roaster / Brand / City</label>
                <input
                  type="text"
                  required
                  value={editSecondary}
                  onChange={(e) => setEditSecondary(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>
              <div>
                <label className="font-semibold block mb-1">Description / Notes</label>
                <textarea
                  rows={3}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditCommunityItemOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg text-[#6D5A4E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-4 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: INSPECT & MANAGE SPECIFIC USER'S LIBRARY */}
      {inspectUser && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-3xl rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
              <div>
                <h4 className="font-serif font-bold text-lg text-[#2B1D14] flex items-center gap-2">
                  <Eye className="w-5 h-5 text-[#C87D32]" />
                  <span>User Library Inspector: {inspectUser.username}</span>
                </h4>
                <p className="text-xs text-[#7A6757]">
                  View, inject, or delete items directly from this user's stored persistent library
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsInjectItemOpen(true)}
                  className="px-3 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Inject Item</span>
                </button>
                <button
                  onClick={() => handleWipeUserLibrary(inspectUser.id, inspectUser.username)}
                  className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                  title="Wipe all library items for this user"
                >
                  <Eraser className="w-3.5 h-3.5" />
                  <span>Wipe Library</span>
                </button>
                <button onClick={() => setInspectUser(null)} className="text-[#8C7A6D] hover:text-[#2B1D14] cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Sub-tabs for user library */}
            <div className="flex gap-2 border-b border-[#E5DACD] pb-2 text-xs">
              {(['coffees', 'equipment', 'cafes', 'customNotes'] as const).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setInspectTab(cat)}
                  className={`px-3 py-1.5 rounded-lg font-semibold capitalize transition-all cursor-pointer ${
                    inspectTab === cat
                      ? 'bg-[#3A291E] text-white'
                      : 'bg-white text-[#6D5A4E] hover:bg-[#F2E8DC] border border-[#E0D5C7]'
                  }`}
                >
                  {cat === 'customNotes' ? 'Notes' : cat} ({inspectUserData?.[cat]?.length || 0})
                </button>
              ))}
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto space-y-2">
              {isInspectingLoading ? (
                <div className="text-center py-8 text-xs text-[#8C7A6D]">Loading user library...</div>
              ) : !inspectUserData || !inspectUserData[inspectTab] || inspectUserData[inspectTab].length === 0 ? (
                <div className="text-center py-8 text-xs text-[#8C7A6D] bg-white rounded-xl border border-[#E0D5C7]">
                  No {inspectTab} saved in {inspectUser.username}'s library. Click "Inject Item" to add one!
                </div>
              ) : (
                inspectUserData[inspectTab].map((item: any) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white rounded-xl border border-[#E0D5C7] flex items-center justify-between text-xs hover:bg-[#FAF7F2] transition-colors"
                  >
                    <div>
                      <span className="font-semibold text-[#2B1D14] block">
                        {item.name || item.title || 'Untitled'}
                      </span>
                      <span className="text-[11px] text-[#7A6757]">
                        {item.roaster || item.brand || item.city || item.category || 'Specialty'} · Rating: {item.userRating || item.rating || 5} ★
                      </span>
                      <span className="font-mono text-[9px] text-[#A8988A] block">
                        ID: {item.id}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        handleDeleteUserItem(inspectUser.id, inspectTab, item.id, item.name || item.title || 'Item')
                      }
                      title="Delete this entry from user library"
                      className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 6: INJECT ITEM INTO USER'S LIBRARY */}
      {isInjectItemOpen && inspectUser && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-[#FAF7F2] border border-[#E5DACD] w-full max-w-sm rounded-2xl shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DACD] pb-3">
              <h4 className="font-serif font-bold text-base text-[#2B1D14]">
                Inject Item for {inspectUser.username}
              </h4>
              <button onClick={() => setIsInjectItemOpen(false)} className="text-[#8C7A6D] hover:text-[#2B1D14]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleInjectItemSubmit} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold block mb-1">Target Category</label>
                <div className="flex gap-1.5">
                  {(['coffees', 'equipment', 'cafes'] as const).map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setInjectCategory(cat)}
                      className={`flex-1 p-1.5 rounded-lg font-semibold capitalize border cursor-pointer ${
                        injectCategory === cat
                          ? 'bg-[#3A291E] text-white border-[#3A291E]'
                          : 'bg-white text-[#6D5A4E] border-[#D5C7B8]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">Item Name</label>
                <input
                  type="text"
                  required
                  value={injectName}
                  onChange={(e) => setInjectName(e.target.value)}
                  placeholder="e.g. Geisha Village Reserve"
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">Roaster / Brand / City</label>
                <input
                  type="text"
                  value={injectSecondary}
                  onChange={(e) => setInjectSecondary(e.target.value)}
                  placeholder="e.g. Tim Wendelboe"
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div>
                <label className="font-semibold block mb-1">User Rating (1-5 ★)</label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={injectRating}
                  onChange={(e) => setInjectRating(e.target.value)}
                  className="w-full p-2 bg-white rounded-lg border border-[#D5C7B8] focus:outline-none focus:ring-1 focus:ring-[#C87D32]"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsInjectItemOpen(false)}
                  className="px-3.5 py-1.5 bg-white border border-[#D5C7B8] rounded-lg text-[#6D5A4E] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-3.5 py-1.5 bg-[#C87D32] hover:bg-[#B06B26] text-white font-semibold rounded-lg shadow-2xs cursor-pointer"
                >
                  Inject into Library
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 7: EMERGENCY FULL SYSTEM RESET */}
      {isResetSystemOpen && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F2] border-2 border-rose-300 w-full max-w-lg rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-start gap-3 border-b border-[#E5DACD] pb-3">
              <div className="p-2.5 bg-rose-100 rounded-xl text-rose-700 shrink-0 mt-0.5">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-serif font-bold text-lg text-rose-950">
                  Full Server Registry Reset (Revert to 0)
                </h4>
                <p className="text-xs text-rose-800 mt-0.5">
                  Emergency &amp; testing action: reverts all stored server-side information to zero.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsResetSystemOpen(false);
                  setResetSystemConfirmText('');
                }}
                disabled={isResettingSystem}
                className="text-[#8C7A6D] hover:text-[#2B1D14] cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white rounded-xl p-3.5 border border-rose-200 text-xs text-[#4A3728] space-y-2">
              <div className="font-bold text-rose-900 flex items-center gap-1.5">
                <span>The following data will be permanently removed from the server:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-[#6D5A4E] ml-1">
                <li><strong>All equipment</strong> removed from server registry (reverted to 0)</li>
                <li><strong>All cafes</strong> removed from server registry (reverted to 0)</li>
                <li><strong>All coffees &amp; tasting notes</strong> removed from server registry (reverted to 0)</li>
                <li><strong>All non-admin users</strong> deleted from server storage</li>
                <li><strong>All guest session caches</strong> wiped from server</li>
              </ul>
              <div className="p-2 bg-[#FAF3EC] rounded-lg border border-[#EDE2D4] text-[11px] text-[#7A6757] mt-2">
                💡 <strong>Restoration note:</strong> Your current admin login will remain active. Users may still restore their saved JSON backups at any time, which will re-populate the server-side registry.
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#2B1D14] block">
                Type <span className="font-mono font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded">RESET</span> to confirm:
              </label>
              <input
                type="text"
                value={resetSystemConfirmText}
                onChange={(e) => setResetSystemConfirmText(e.target.value)}
                placeholder="Type RESET here"
                disabled={isResettingSystem}
                className="w-full px-3 py-2 bg-white rounded-lg border border-[#D5C7B8] text-xs font-mono tracking-widest text-[#2B1D14] focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase placeholder:normal-case placeholder:tracking-normal"
              />
            </div>

            {error && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg text-xs">
                {error}
              </div>
            )}

            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#E5DACD]">
              <button
                type="button"
                onClick={() => {
                  setIsResetSystemOpen(false);
                  setResetSystemConfirmText('');
                }}
                disabled={isResettingSystem}
                className="px-3.5 py-2 bg-white hover:bg-[#F2E8DC] border border-[#D5C7B8] rounded-lg text-xs font-semibold text-[#6D5A4E] cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleEmergencySystemReset}
                disabled={isResettingSystem || resetSystemConfirmText.trim().toUpperCase() !== 'RESET'}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg shadow-sm transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                {isResettingSystem ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Purging Server Registry...</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Execute Reset to 0</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* In-App Confirmation Modal Dialog (Safe replacement for window.confirm) */}
      {confirmDialog && (
        <div className="fixed inset-0 z-70 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-fade-in">
          <div className="bg-[#FAF7F2] border border-[#D5C7B8] text-[#2B1D14] w-full max-w-md rounded-2xl shadow-2xl p-6 flex flex-col gap-4 animate-scale-in">
            <div className="flex items-center gap-3">
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-2xs ${
                  confirmDialog.isDestructive ? 'bg-rose-100 text-rose-600' : 'bg-amber-100 text-amber-700'
                }`}
              >
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#2B1D14]">
                  {confirmDialog.title}
                </h4>
                <p className="text-[11px] text-[#8C7A6D]">Confirmation Required</p>
              </div>
            </div>

            <p className="text-xs text-[#6D5A4E] leading-relaxed whitespace-pre-wrap bg-white/70 p-3 rounded-xl border border-[#E5DACD]">
              {confirmDialog.message}
            </p>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#E5DACD]">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 text-xs font-semibold text-[#6D5A4E] bg-white border border-[#D5C7B8] hover:bg-[#F2E8DC] rounded-xl transition-colors cursor-pointer"
              >
                {confirmDialog.cancelLabel || 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  const action = confirmDialog.onConfirm;
                  setConfirmDialog(null);
                  await action();
                }}
                className={`px-4 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer ${
                  confirmDialog.isDestructive
                    ? 'bg-rose-600 hover:bg-rose-700'
                    : 'bg-[#C87D32] hover:bg-[#B06B26]'
                }`}
              >
                {confirmDialog.confirmLabel || 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
