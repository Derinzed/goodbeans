import React, { useState, useEffect } from 'react';
import { X, UserPlus, LogIn, Lock, User, AlertCircle, ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';
import { authApi, UserProfile } from '../services/authApi';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile, token: string, serverData?: any, vault?: any) => void;
  initialDataToSave?: any;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  initialDataToSave,
  initialMode = 'login',
}) => {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialMode || 'login');
      setError(null);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanUsername = username.trim();
    if (!cleanUsername) {
      setError('Please enter your username.');
      return;
    }
    if (!password) {
      setError('Please enter your password.');
      return;
    }
    if (tab === 'register' && password.length < 3) {
      setError('Password must be at least 3 characters long.');
      return;
    }

    setIsLoading(true);
    try {
      if (tab === 'register') {
        const res = await authApi.register(cleanUsername, password, initialDataToSave);
        if (!res.success || !res.token || !res.user) {
          setError(res.error || 'Registration failed. That username may already be taken.');
          setIsLoading(false);
          return;
        }
        if (res.vault) {
          authApi.saveCurrentVault(res.vault, initialDataToSave);
        }
        onAuthSuccess(res.user, res.token, res.data, res.vault);
        onClose();
      } else {
        let res = await authApi.login(cleanUsername, password);
        // If login failed because server container was freshly published/redeployed, check local vault
        if ((!res.success || !res.user) && typeof window !== 'undefined') {
          const registry = authApi.getVaultRegistry();
          const matchedVault = registry[cleanUsername.toLowerCase()] || authApi.getCurrentVault();

          if (matchedVault) {
            // Restore user seamlessly on server
            const syncRes = await authApi.syncVault(
              {
                ...matchedVault,
                password,
              },
              initialDataToSave
            );
            if (syncRes.success && syncRes.user && syncRes.token) {
              res = syncRes;
            }
          }
        }

        if (!res.success || !res.token || !res.user) {
          setError(res.error || 'Invalid username or password.');
          setIsLoading(false);
          return;
        }
        if (res.vault) {
          authApi.saveCurrentVault(res.vault, res.data);
        }
        onAuthSuccess(res.user, res.token, res.data, res.vault);
        onClose();
      }
    } catch (err: any) {
      setError(err?.message || 'Server connection error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF7F2] border border-[#E5DACD] text-[#2C241E] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5DACD] bg-[#F4EDE4]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#3A291E] flex items-center justify-center text-white shadow-xs">
              {tab === 'login' ? (
                <LogIn className="w-4 h-4 text-[#ECA357]" />
              ) : (
                <UserPlus className="w-4 h-4 text-[#ECA357]" />
              )}
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2B1D14]">
                {tab === 'login' ? 'Log In to Goodbeans' : 'Create an Account'}
              </h3>
              <p className="text-[11px] text-[#7A6757]">
                {tab === 'login'
                  ? 'Access your saved coffee collection & cloud sync'
                  : 'Instant setup — no email or phone verification needed'}
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

        {/* Tab switch */}
        <div className="flex border-b border-[#E5DACD] bg-[#EDE4D8]/60 p-1">
          <button
            type="button"
            onClick={() => {
              setTab('login');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'login'
                ? 'bg-[#FAF7F2] text-[#2B1D14] shadow-xs'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Log In</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setTab('register');
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              tab === 'register'
                ? 'bg-[#FAF7F2] text-[#2B1D14] shadow-xs'
                : 'text-[#6B5A4E] hover:text-[#2B1D14]'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 text-[#C87D32]" />
            <span>Create Account</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {tab === 'register' && (
            <div className="p-3 bg-[#FAF3EC] border border-[#EDE2D4] rounded-xl text-xs text-[#8C4F1A] flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C87D32] shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold block">Simple & Instant Registration</span>
                Choose a username and password. No email or phone verification needed. Your
                existing coffee library, shelves, and tasting notes will be safely saved to your
                account.
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Username */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#2B1D14] block">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C7A6D]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. barista_sam"
                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-[#D5C7B8] text-sm text-[#2C2017] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
                autoFocus
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-[#2B1D14] block">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#8C7A6D]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full pl-9 pr-3 py-2 bg-white rounded-lg border border-[#D5C7B8] text-sm text-[#2C2017] focus:outline-none focus:ring-2 focus:ring-[#C87D32]/40"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 px-4 bg-[#C87D32] hover:bg-[#B06B26] text-white text-xs font-semibold rounded-lg shadow-sm hover:shadow transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <span>Please wait...</span>
            ) : tab === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>Log In</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>Create Account & Save Library</span>
              </>
            )}
          </button>

          {/* Alternate action callout */}
          <div className="pt-3 border-t border-[#E5DACD] text-center space-y-2">
            {tab === 'login' ? (
              <>
                <p className="text-xs text-[#7A6757]">
                  Don't have an account yet?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab('register');
                    setError(null);
                  }}
                  className="w-full py-2 px-3 bg-[#FAF7F2] hover:bg-[#F2E8DC] border border-[#D5C7B8] text-xs font-semibold text-[#3A291E] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <UserPlus className="w-3.5 h-3.5 text-[#C87D32]" />
                  <span>Create a New Account</span>
                </button>
              </>
            ) : (
              <>
                <p className="text-xs text-[#7A6757]">
                  Already have an account?
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setTab('login');
                    setError(null);
                  }}
                  className="w-full py-2 px-3 bg-[#FAF7F2] hover:bg-[#F2E8DC] border border-[#D5C7B8] text-xs font-semibold text-[#3A291E] rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <LogIn className="w-3.5 h-3.5 text-[#C87D32]" />
                  <span>Log In to Existing Account</span>
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};
