import React from 'react';
import {
  Menu,
  Shield,
  Database,
  User,
  PlusCircle,
  HelpCircle,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onToggleMobileSidebar: () => void;
  onOpenAuthModal: () => void;
  onOpenDatabaseModal: () => void;
  onOpenApplicationModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  onToggleMobileSidebar,
  onOpenAuthModal,
  onOpenDatabaseModal,
  onOpenApplicationModal,
}) => {
  const { profile, isDemoMode } = useAuth();

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Left: Mobile hamburger + Brand */}
          <div className="flex items-center gap-3">
            <button
              onClick={onToggleMobileSidebar}
              className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
              aria-label="Цэс нээх"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5">
              {/* UNICEF-styled blue circular emblem */}
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-600 to-sky-400 text-white flex items-center justify-center font-black text-sm shadow-md shadow-sky-500/25 tracking-tighter">
                UN
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h1 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1">
                    <span className="text-sky-500 font-black">UNICEF</span> ОЮУТНЫ ХОЛБОО
                  </h1>
                  <span className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-200/80 font-bold">
                    HUB
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 flex items-center gap-1">
                  <span>Оюутны клубийн нэгдсэн систем</span>
                  <span className="hidden md:inline text-slate-300">•</span>
                  <span className="hidden md:inline text-slate-400 text-[10px]">
                    (Албан ёсны бүтээгдэхүүн биш)
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Right: Actions, Database status, Profile & Auth */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Database Status Button */}
            <button
              onClick={onOpenDatabaseModal}
              title="Supabase өгөгдлийн сангийн тохиргоо, SQL"
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                isDemoMode
                  ? 'bg-amber-50/80 text-amber-800 border-amber-200 hover:bg-amber-100/80'
                  : 'bg-emerald-50/80 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>{isDemoMode ? 'Туршилтын горим' : 'Supabase холбогдсон'}</span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isDemoMode ? 'bg-amber-500' : 'bg-emerald-500 animate-pulse'
                }`}
              />
            </button>

            {/* Quick Membership application button for visitors */}
            <button
              onClick={onOpenApplicationModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all"
            >
              <PlusCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>Элсэх хүсэлт</span>
            </button>

            {/* User profile / Role preview button */}
            <button
              onClick={onOpenAuthModal}
              className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl border border-slate-200 hover:border-sky-300 hover:bg-sky-50/50 bg-white text-slate-700 transition-all shadow-2xs"
            >
              <div className="w-7 h-7 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                {profile?.full_name ? profile.full_name.charAt(0) : <User className="w-3.5 h-3.5" />}
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-bold text-slate-900 leading-tight">
                  {profile?.full_name || 'Нэвтрэх'}
                </div>
                <div className="text-[10px] text-sky-600 font-semibold leading-tight">
                  {profile?.role || 'Зочин'}
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
