import React, { useState, useMemo } from 'react';
import {
  Award,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Search,
  Filter,
  UserCheck,
  TrendingUp,
  Briefcase,
  Star,
  Trash2,
} from 'lucide-react';
import { ParticipationRecord, Member, TaskStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';

interface ParticipationViewProps {
  members: Member[];
  participation: ParticipationRecord[];
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ParticipationView: React.FC<ParticipationViewProps> = ({
  members,
  participation,
  onRefresh,
  onShowToast,
}) => {
  const { canRecordAttendance } = useAuth();

  const [search, setSearch] = useState('');
  const [filterMemberId, setFilterMemberId] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [memberId, setMemberId] = useState(members[0]?.id || '');
  const [eventTitle, setEventTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [volunteerHours, setVolunteerHours] = useState<number>(4);
  const [assignedTask, setAssignedTask] = useState('');
  const [taskStatus, setTaskStatus] = useState<TaskStatus>('Дууссан');
  const [achievement, setAchievement] = useState('');
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Summary Metrics
  const totalVolunteerHours = useMemo(() => {
    return participation.reduce((acc, curr) => acc + Number(curr.volunteer_hours || 0), 0);
  }, [participation]);

  const totalAchievementsCount = useMemo(() => {
    return participation.filter((p) => Boolean(p.achievement)).length;
  }, [participation]);

  const totalTasksCompleted = useMemo(() => {
    return participation.filter((p) => p.task_status === 'Дууссан').length;
  }, [participation]);

  // Leaderboard
  const leaderboard = useMemo(() => {
    const map = new Map<string, { name: string; hours: number; events: number; achievements: number }>();
    participation.forEach((p) => {
      const current = map.get(p.member_id) || {
        name: p.member_name,
        hours: 0,
        events: 0,
        achievements: 0,
      };
      current.hours += Number(p.volunteer_hours || 0);
      current.events += 1;
      if (p.achievement) current.achievements += 1;
      map.set(p.member_id, current);
    });

    return Array.from(map.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 5);
  }, [participation]);

  // Filtered List
  const filteredList = useMemo(() => {
    return participation.filter((p) => {
      const matchesSearch =
        p.member_name.toLowerCase().includes(search.toLowerCase()) ||
        p.event_title.toLowerCase().includes(search.toLowerCase()) ||
        (p.assigned_task && p.assigned_task.toLowerCase().includes(search.toLowerCase())) ||
        (p.achievement && p.achievement.toLowerCase().includes(search.toLowerCase()));

      const matchesMember = filterMemberId === 'all' || p.member_id === filterMemberId;
      const matchesStatus = filterStatus === 'all' || p.task_status === filterStatus;

      return matchesSearch && matchesMember && matchesStatus;
    });
  }, [participation, search, filterMemberId, filterStatus]);

  const handleOpenModal = () => {
    if (members.length > 0 && !memberId) {
      setMemberId(members[0].id);
    }
    setEventTitle('');
    setDate(new Date().toISOString().split('T')[0]);
    setVolunteerHours(4);
    setAssignedTask('');
    setTaskStatus('Дууссан');
    setAchievement('');
    setFormError('');
    setIsModalOpen(true);
  };

  const handleSaveParticipation = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const targetMember = members.find((m) => m.id === memberId);
    if (!targetMember) {
      setFormError('Гишүүнийг сонгоно уу.');
      return;
    }
    if (!eventTitle) {
      setFormError('Арга хэмжээ эсвэл ажлын нэрийг оруулна уу.');
      return;
    }

    setLoading(true);
    try {
      await dbService.addParticipation({
        member_id: targetMember.id,
        member_name: targetMember.full_name,
        event_title: eventTitle.trim(),
        date,
        volunteer_hours: Number(volunteerHours),
        assigned_task: assignedTask.trim(),
        task_status: taskStatus,
        achievement: achievement.trim(),
      });

      onShowToast('Оролцоо, ажлын цагийн бүртгэл амжилттай хадгалагдлаа!', 'success');
      setIsModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Алдаа гарлаа.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteParticipation = async (id: string, eventTitle: string) => {
    if (!canRecordAttendance) {
      onShowToast('Танд оролцооны бүртгэл устгах эрх байхгүй байна.', 'error');
      return;
    }
    if (!window.confirm(`"${eventTitle}" арга хэмжээний оролцооны бүртгэлийг устгахдаа итгэлтэй байна уу?`)) {
      return;
    }
    try {
      await dbService.deleteParticipation(id);
      onShowToast('Оролцооны бүртгэл амжилттай устгагдлаа.', 'success');
      onRefresh();
    } catch {
      onShowToast('Устгахад алдаа гарлаа.', 'error');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-sky-500" />
            <span>Оролцоо ба Сайн дурын цаг</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Гишүүдийн сайн дурын ажлын цаг, хариуцсан даалгавар болон гаргасан амжилтуудын нэгдсэн бүртгэл
          </p>
        </div>

        {canRecordAttendance && (
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Оролцоо бүртгэх</span>
          </button>
        )}
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Нийт сайн дурын цаг</span>
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalVolunteerHours}</span>
            <span className="text-xs text-slate-500 font-semibold">цаг бүртгэгдсэн</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Нийгэмд үзүүлсэн бодит үр нөлөө</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Дууссан даалгавар</span>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalTasksCompleted}</span>
            <span className="text-xs text-emerald-600 font-semibold">хийгдэж дууссан</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Хариуцсан төсөл, ажлууд</p>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase">Батламж ба амжилт</span>
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Star className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900">{totalAchievementsCount}</span>
            <span className="text-xs text-amber-600 font-semibold">шагнал, батламж</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Оюутнуудын идэвх зүтгэл</p>
        </div>
      </div>

      {/* Grid: Leaderboard + History Table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Leaderboard Top 5 */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-sky-500" />
            <h3 className="font-bold text-sm text-slate-900">Сайн дурын ажлын манлайлагчид</h3>
          </div>

          <div className="space-y-3">
            {leaderboard.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs">
                Бүртгэл хараахан хийгдээгүй байна.
              </div>
            ) : (
              leaderboard.map((item, idx) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl border border-slate-100 bg-slate-50/70 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black ${
                        idx === 0
                          ? 'bg-amber-400 text-slate-900'
                          : idx === 1
                          ? 'bg-slate-300 text-slate-800'
                          : idx === 2
                          ? 'bg-amber-700/60 text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {idx + 1}
                    </div>
                    <div>
                      <div className="font-extrabold text-xs text-slate-900">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {item.events} эвент • {item.achievements} батламж
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-xs font-black text-sky-600">{item.hours} цаг</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Right 2 cols: Participation Logs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Арга хэмжээ, даалгавраар хайх..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <select
                value={filterMemberId}
                onChange={(e) => setFilterMemberId(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">Бүх гишүүд</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name} ({m.role})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">Бүх төлөв</option>
                <option value="Дууссан">Дууссан</option>
                <option value="Хийгдэж буй">Хийгдэж буй</option>
                <option value="Хоцорсон">Хоцорсон</option>
              </select>
            </div>
          </div>

          {/* List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="divide-y divide-slate-100">
              {filteredList.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                    <Award className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Оролцоо, ажлын цагийн бүртгэл одоогоор байхгүй байна</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Гишүүдийн сайн дурын ажилд оролцсон цаг, хариуцсан даалгавар болон гаргасан амжилтыг энд тэмдэглэх боломжтой.
                  </p>
                  {canRecordAttendance && (
                    <button
                      onClick={handleOpenModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Оролцоо бүртгэх</span>
                    </button>
                  )}
                </div>
              ) : (
                filteredList.map((item) => (
                  <div key={item.id} className="p-4 hover:bg-slate-50/70 transition-colors space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-extrabold text-xs text-slate-900">{item.event_title}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold text-sky-600">{item.member_name}</span>
                          <span>•</span>
                          <span>{item.date}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                          <Clock className="w-3 h-3 text-sky-500" />
                          <span>{item.volunteer_hours} цаг</span>
                        </span>
                        {item.task_status && (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                              item.task_status === 'Дууссан'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.task_status === 'Хийгдэж буй'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.task_status}
                          </span>
                        )}
                        {canRecordAttendance && (
                          <button
                            onClick={() => handleDeleteParticipation(item.id, item.event_title)}
                            title="Бүртгэл устгах"
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {item.assigned_task && (
                      <div className="text-xs text-slate-600 flex items-center gap-1.5">
                        <Briefcase className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>Хариуцсан даалгавар: <b>{item.assigned_task}</b></span>
                      </div>
                    )}

                    {item.achievement && (
                      <div className="text-xs text-amber-800 bg-amber-50/70 p-2 rounded-lg border border-amber-200/60 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span>Амжилт / Шагнал: <b>{item.achievement}</b></span>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Оролцоо & Цагийн бүртгэл нэмэх</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveParticipation} className="p-6 space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Гишүүн сонгох</label>
                <select
                  value={memberId}
                  onChange={(e) => setMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.full_name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Арга хэмжээний нэр <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Жишээ: Дэлхийн Хүүхдийн Өдрийн чуулган"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Огноо</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Сайн дурын цаг</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={volunteerHours}
                    onChange={(e) => setVolunteerHours(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Хариуцсан даалгавар</label>
                <input
                  type="text"
                  value={assignedTask}
                  onChange={(e) => setAssignedTask(e.target.value)}
                  placeholder="Жишээ: Танхим бэлтгэл, бүртгэл хөтлөх"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Даалгаврын төлөв</label>
                  <select
                    value={taskStatus}
                    onChange={(e) => setTaskStatus(e.target.value as TaskStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Дууссан">Дууссан</option>
                    <option value="Хийгдэж буй">Хийгдэж буй</option>
                    <option value="Хоцорсон">Хоцорсон</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Амжилт / Батламж</label>
                  <input
                    type="text"
                    value={achievement}
                    onChange={(e) => setAchievement(e.target.value)}
                    placeholder="Талархлын хуудас г.м"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {loading ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
