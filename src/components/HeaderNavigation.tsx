import { useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, ChevronDown, Crown, LayoutDashboard, LogOut, Settings, UserRound } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useStudySyncStore } from '../store/useStudySyncStore';

interface HeaderNavigationProps {
  onBack: () => void;
  onNavigateHome: () => void;
  context?: ReactNode;
}

export default function HeaderNavigation({ onBack, onNavigateHome, context }: HeaderNavigationProps) {
  const navigate = useNavigate();
  const user = useStudySyncStore((state) => state.user);
  const logout = useStudySyncStore((state) => state.logout);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const initials = user?.name.split(' ').map((part) => part[0]).join('').slice(0, 2).toUpperCase() || '';

  return (
    <>
      <div className="fixed left-0 right-0 top-0 z-40 flex h-[72px] min-w-0 items-center gap-2 border-b border-gray-100 bg-white px-4 shadow-sm sm:px-6">
      <button
        type="button"
        onClick={onNavigateHome}
        aria-label="Go to StudySync home"
        title="Go to StudySync home"
        className="flex shrink-0 items-center gap-2 rounded-lg py-1.5 pr-2 text-brand-primary transition-colors hover:bg-brand-surface-low cursor-pointer"
      >
        <BookOpen className="h-5 w-5" fill="currentColor" />
        <span className="hidden text-lg font-extrabold tracking-tight sm:inline">StudySync</span>
      </button>
      <button
        type="button"
        onClick={onBack}
        aria-label="Go back"
        title="Go back"
        className="flex h-9 shrink-0 items-center gap-1 rounded-lg px-2 text-brand-primary transition-colors hover:bg-brand-surface-low cursor-pointer"
      >
        <ArrowLeft className="h-5 w-5" />
        <span className="hidden text-xs font-bold md:inline">Back</span>
      </button>

      <div className="flex min-w-0 flex-1 items-center justify-end overflow-hidden px-1 sm:px-2">{context}</div>

      <button
        type="button"
        onClick={() => navigate(user ? '/pro' : '/auth?mode=login')}
        className="ml-auto flex shrink-0 items-center gap-1.5 rounded-lg bg-[#f3ebff] px-3 py-2 text-xs font-extrabold text-brand-secondary transition-colors hover:bg-[#e9ddff] cursor-pointer lg:ml-0"
      >
        <Crown className="h-4 w-4" />
        <span className="hidden sm:inline">{user?.isPro ? 'Pro' : 'Premium'}</span>
      </button>

      <div className="relative shrink-0">
        <button
          type="button"
          onClick={() => user ? setProfileMenuOpen((open) => !open) : navigate('/auth?mode=login')}
          aria-label={user ? 'Open profile menu' : 'Log in'}
          aria-expanded={user ? profileMenuOpen : undefined}
          className="flex items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-brand-surface-low cursor-pointer"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-primary text-xs font-black text-white">
            {user ? initials : <UserRound className="h-4 w-4" />}
          </span>
          <ChevronDown className="hidden h-4 w-4 text-brand-outline sm:block" />
        </button>

        {user && profileMenuOpen && (
          <div className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-lg border border-gray-100 bg-white shadow-xl">
            <div className="border-b border-gray-100 px-4 py-3">
              <p className="truncate text-sm font-extrabold text-brand-on-surface">{user.name}</p>
              <p className="mt-0.5 truncate text-xs text-brand-on-surface-variant">{user.email}</p>
              {user.isPro && <span className="mt-2 inline-flex rounded bg-[#f2ebff] px-2 py-1 text-[9px] font-black uppercase text-brand-secondary">Pro account</span>}
            </div>
            <div className="p-1.5">
              <button type="button" onClick={() => navigate('/dashboard')} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-bold text-brand-on-surface-variant hover:bg-brand-surface-low cursor-pointer">
                <LayoutDashboard className="h-4 w-4" />Dashboard
              </button>
              <button type="button" onClick={() => navigate('/dashboard?view=settings')} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-bold text-brand-on-surface-variant hover:bg-brand-surface-low cursor-pointer">
                <Settings className="h-4 w-4" />Settings
              </button>
              <button type="button" onClick={async () => { await logout(); navigate('/'); }} className="flex w-full items-center gap-2 rounded-md px-3 py-2.5 text-left text-xs font-bold text-brand-error hover:bg-red-50 cursor-pointer">
                <LogOut className="h-4 w-4" />Log out
              </button>
            </div>
          </div>
        )}
      </div>
      </div>
      <div aria-hidden="true" className="h-10 w-full shrink-0" />
    </>
  );
}
