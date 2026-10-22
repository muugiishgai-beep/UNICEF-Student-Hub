import React from 'react';
import {
  LayoutDashboard,
  Users,
  UserCheck,
  CalendarCheck,
  Award,
  CalendarDays,
  BarChart3,
  Database,
  PlusCircle,
  ShieldAlert,
  Info,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export type NavigationTab =
  | 'dashboard'
  | 'members'
  | 'requests'
  | 'attendance'
  | 'participation'
  | 'plans_events'
  | 'reports'
  | 'database';

interface SidebarProps {
  currentTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  pendingRequestsCount: number;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  onOpenApplicationModal: () => void;
  onOpenDatabaseModal: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  pendingRequestsCount,
  isOpenMobile,
  onCloseMobile,
  onOpenApplicationModal,
  onOpenDatabaseModal,
}) => {
  const { profile, isAdmin } = useAuth();

  const navItems = [
    {
      id: 'dashboard' as NavigationTab,
      label: 'Хяналтын самбар',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'members' as NavigationTab,
      label: 'Гишүүдийн удирдлага',
      icon: Users,
      badge: null,
    },
    {
      id: 'requests' as NavigationTab,
      label: 'Элсэх хүсэлтүүд',
      icon: UserCheck,
      badge: pendingRequestsCount > 0 ? pendingRequestsCount : null,
      badgeColor: 'bg-amber-500 text-white',
    },
    {
      id: 'attendance' as NavigationTab,
      label: 'Ирцийн бүртгэл',
      icon: CalendarCheck,
      badge: null,
    },
    {
      id: 'participation' as NavigationTab,
      label: 'Оролцоо & Цаг',
      icon: Award,
      badge: null,
    },
    {
      id: 'plans_events' as NavigationTab,
      label: 'Төлөвлөгөө ба Эвент',
      icon: CalendarDays,
      badge: null,
    },
    {
      id: 'reports' as NavigationTab,
      label: 'Тайлан & Экспорт',
      icon: BarChart3,
      badge: null,
    },
    {
      id: 'database' as NavigationTab,
      label: 'Өгөгдлийн сан & SQL',
      icon: Database,
      badge: null,
    },
  ];

  const handleSelect = (tab: NavigationTab) => {
    onSelectTab(tab);
    onCloseMobile();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed lg:sticky top-16 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Navigation list */}
        <div className="p-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Үндсэн цэс
          </div>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelect(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all group ${
                  isActive
                    ? 'bg-sky-500 text-white shadow-md shadow-sky-500/20'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-500'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white text-sky-600' : item.badgeColor || 'bg-sky-100 text-sky-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Quick action button for public applicant */}
          <div className="pt-4 mt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenApplicationModal();
                onCloseMobile();
              }}
              className="w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-sky-50 text-sky-700 hover:bg-sky-100/80 border border-sky-200/80 transition-all shadow-2xs"
            >
              <PlusCircle className="w-4 h-4 text-sky-600" />
              <span>Шинээр элсэх хүсэлт</span>
            </button>
          </div>
        </div>

        {/* Bottom Disclaimer & info card */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/70 text-[11px] text-slate-500 space-y-2">
          <div className="flex items-start gap-2 text-slate-600">
            <Info className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
            <p className="leading-tight">
              Энэхүү систем нь UNICEF-ийн дэмжлэгтэй оюутны клубийн дотоод удирдлагын систем бөгөөд UNICEF-ийн албан ёсны вэб биш болно.
            </p>
          </div>
          <div className="pt-1 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <span>Хувилбар: v2.5.0</span>
            <span className="text-sky-600 font-sans font-semibold">Монгол хэлээр</span>
          </div>
        </div>
      </aside>
    </>
  );
};
