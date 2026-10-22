import React from 'react';
import {
  Users,
  CalendarCheck,
  CalendarDays,
  UserCheck,
  ArrowRight,
  Clock,
  MapPin,
  TrendingUp,
  AlertCircle,
  Bell,
  Pin,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import {
  Member,
  MembershipRequest,
  EventItem,
  AttendanceRecord,
  PlanItem,
  Announcement,
  AttendanceStats,
} from '../types';
import { calculateAttendanceStats } from '../lib/supabase';
import { NavigationTab } from '../components/Sidebar';
import { useAuth } from '../context/AuthContext';

interface DashboardViewProps {
  members: Member[];
  requests: MembershipRequest[];
  events: EventItem[];
  attendance: AttendanceRecord[];
  plans: PlanItem[];
  announcements: Announcement[];
  onNavigate: (tab: NavigationTab) => void;
  onOpenApplicationModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  members,
  requests,
  events,
  attendance,
  plans,
  announcements,
  onNavigate,
  onOpenApplicationModal,
}) => {
  const { profile, isAdmin } = useAuth();

  const activeMembersCount = members.filter((m) => m.status === 'Идэвхтэй').length;
  const pendingRequestsCount = requests.filter((r) => r.status === 'Хүлээгдэж буй').length;
  const upcomingEvents = events.slice(0, 3);
  const activePlans = plans.filter((p) => p.status === 'Явагдаж буй' || p.status === 'Төлөвлөсөн').slice(0, 4);

  // Calculate overall attendance stats
  const attendanceStats: AttendanceStats = calculateAttendanceStats(attendance);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner & Welcome */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-sky-600 via-sky-500 to-blue-600 text-white p-6 sm:p-8 shadow-xl shadow-sky-500/15">
        <div className="relative z-10 max-w-2xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-semibold text-white">
            <Sparkles className="w-3.5 h-3.5" />
            <span>UNICEF Оюутны Төв Платформ</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Сайн байна уу, {profile?.full_name || 'Оюутан залуус аа'}!
          </h2>
          <p className="text-sky-100 text-xs sm:text-sm leading-relaxed">
            Хүүхдийн эрхийг хамгаалах, оюутан залуусын сайн дурын санаачилгыг дэмжих UNICEF клубийн гишүүд, ирц, төлөвлөгөө, арга хэмжээний нэгдсэн хяналтын самбар.
          </p>
          <div className="pt-2 flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigate('members')}
              className="px-4 py-2 bg-white text-sky-700 hover:bg-sky-50 rounded-xl text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
            >
              <Users className="w-4 h-4" />
              <span>+ Гишүүн нэмэх</span>
            </button>
            <button
              onClick={() => onNavigate('attendance')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <CalendarCheck className="w-4 h-4" />
              <span>Ирц бүртгэх</span>
            </button>
            <button
              onClick={() => onNavigate('plans_events')}
              className="px-4 py-2 bg-white/15 hover:bg-white/25 text-white rounded-xl text-xs font-semibold backdrop-blur-sm transition-all flex items-center gap-1.5"
            >
              <CalendarDays className="w-4 h-4" />
              <span>Арга хэмжээ үзэх</span>
            </button>
          </div>
        </div>

        {/* Decorative background circle */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-72 h-72 rounded-full bg-white/10 blur-2xl pointer-events-none" />
      </div>

      {/* Empty members notice */}
      {members.length === 0 && (
        <div className="bg-sky-50/80 border border-sky-200 p-5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Бүртгэлтэй гишүүд одоогоор байхгүй байна</h4>
              <p className="text-xs text-slate-600 mt-0.5">
                Клубийнхээ бодит гишүүдийг нэмж, үүрэг албан тушаалыг нь өөрөө хуваарилж эхэлнэ үү.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('members')}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto shrink-0"
          >
            + Гишүүн нэмэх
          </button>
        </div>
      )}

      {/* 4 Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Members */}
        <div
          onClick={() => onNavigate('members')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-sky-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Нийт гишүүд</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Users className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{members.length}</span>
            <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
              {activeMembersCount} идэвхтэй
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Удирдах болон энгийн гишүүд</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-sky-500 transition-colors" />
          </p>
        </div>

        {/* Card 2: Attendance rate */}
        <div
          onClick={() => onNavigate('attendance')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Дундаж ирц</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{attendanceStats.percentage}%</span>
            <span className="text-xs text-sky-600 font-medium">
              ({attendanceStats.present + attendanceStats.late}/{attendanceStats.denominator})
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Чөлөөг хуваарилагчаас хассан</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </p>
        </div>

        {/* Card 3: Upcoming Events */}
        <div
          onClick={() => onNavigate('plans_events')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-indigo-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Арга хэмжээ</span>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <CalendarDays className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{events.length}</span>
            <span className="text-xs text-indigo-600 font-bold bg-indigo-50 px-2 py-0.5 rounded-full">
              зарлагдсан
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Сургалт, сайн дурын аян</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
          </p>
        </div>

        {/* Card 4: Pending Membership Requests */}
        <div
          onClick={() => onNavigate('requests')}
          className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs hover:shadow-md hover:border-amber-300 transition-all cursor-pointer group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Шинэ хүсэлт</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-110 transition-transform">
              <UserCheck className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{pendingRequestsCount}</span>
            <span className="text-xs text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded-full">
              хүлээгдэж буй
            </span>
          </div>
          <p className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>{isAdmin ? 'Шалгаж шийдвэрлэх' : 'Хүсэлтийн жагсаалт'}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </p>
        </div>
      </div>

      {/* Main Grid: Announcements + Upcoming Events & Plans */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Announcements & Active Plans */}
        <div className="lg:col-span-2 space-y-6">
          {/* Announcements Board */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-sky-500" />
                <h3 className="text-base font-bold text-slate-900">Зарлалын самбар</h3>
              </div>
              <span className="text-xs text-slate-400">Нийт {announcements.length} зарлал</span>
            </div>

            <div className="space-y-3">
              {announcements.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  Одоогоор зарлал ороогүй байна.
                </div>
              ) : (
                announcements.map((ann) => (
                  <div
                    key={ann.id}
                    className={`p-4 rounded-xl border transition-all ${
                      ann.is_pinned
                        ? 'bg-sky-50/50 border-sky-200'
                        : 'bg-slate-50/50 border-slate-200/80 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        {ann.is_pinned && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500 text-white shadow-xs">
                            <Pin className="w-3 h-3" /> Чухал
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                            ann.category === 'Чухал'
                              ? 'bg-rose-100 text-rose-700'
                              : ann.category === 'Арга хэмжээ'
                              ? 'bg-indigo-100 text-indigo-700'
                              : 'bg-slate-200 text-slate-700'
                          }`}
                        >
                          {ann.category}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900">{ann.title}</h4>
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(ann.created_at).toLocaleDateString('mn-MN')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{ann.content}</p>
                    <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                      <span>Нийтэлсэн: {ann.author}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Plans & Progress */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900">Идэвхтэй төлөвлөгөө ба явц</h3>
              </div>
              <button
                onClick={() => onNavigate('plans_events')}
                className="text-xs font-semibold text-sky-600 hover:text-sky-700 flex items-center gap-1"
              >
                <span>Бүгдийг үзэх</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-4">
              {activePlans.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Одоогоор идэвхтэй төлөвлөгөө байхгүй байна.
                </div>
              ) : (
                activePlans.map((plan) => (
                  <div key={plan.id} className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/60 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900">{plan.title}</span>
                      <span className="font-extrabold text-sky-600">{plan.progress}%</span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-emerald-500 h-2 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(plan.progress, 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span>Хариуцагч: {plan.responsible_person}</span>
                      <span className="text-slate-400">Хугацаа: {plan.deadline}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right 1 Col: Upcoming Events & Quick Club Info */}
        <div className="space-y-6">
          {/* Upcoming Events Box */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-sky-500" />
                <h3 className="text-base font-bold text-slate-900">Удахгүй болох эвентүүд</h3>
              </div>
            </div>

            <div className="space-y-3">
              {upcomingEvents.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Товлогдсон арга хэмжээ байхгүй байна.
                </div>
              ) : (
                upcomingEvents.map((evt) => (
                  <div
                    key={evt.id}
                    className="p-3.5 rounded-xl border border-slate-200/80 hover:border-sky-300 transition-all bg-white shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-50 text-sky-700 border border-sky-100">
                        {evt.type}
                      </span>
                      <span className="text-[11px] font-semibold text-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-400" /> {evt.time}
                      </span>
                    </div>
                    <h4 className="font-bold text-xs text-slate-900 leading-snug">{evt.title}</h4>
                    <div className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{evt.location}</span>
                    </div>
                    <div className="pt-1 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Огноо: {evt.date}</span>
                      <span className="font-semibold text-sky-600">
                        {evt.registered_count || 0}/{evt.max_participants || '∞'} бүртгэгдсэн
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              onClick={() => onNavigate('plans_events')}
              className="mt-4 w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all text-center block"
            >
              Бүх арга хэмжээний хуваарь
            </button>
          </div>

          {/* Quick Hub Stats Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4">
            <h4 className="font-bold text-sm text-sky-400 flex items-center gap-2">
              <span>UNICEF Student Hub дүрэм</span>
            </h4>
            <div className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Ирц тооцохдоо &ldquo;Чөлөөтэй&rdquo; төлөвийг хуваарилагчаас хасдаг.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Гишүүний утасны дугаар зэрэг нууц мэдээлэл зөвхөн админд харагдана.</span>
              </div>
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>Шинэ элсэгч зөвхөн эрх бүхий админ зөвшөөрснөөр гишүүн болно.</span>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-700/60 text-[11px] text-slate-400">
              Монголын залуучуудын сайн дурын санаачилгыг дэмжих платформ.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
