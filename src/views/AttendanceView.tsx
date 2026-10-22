import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Save,
  Filter,
  Users,
  Search,
  CheckCheck,
  AlertCircle,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { Member, AttendanceRecord, AttendanceStatus, EventItem, AttendanceStats } from '../types';
import { calculateAttendanceStats, dbService } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface AttendanceViewProps {
  members: Member[];
  events: EventItem[];
  attendance: AttendanceRecord[];
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AttendanceView: React.FC<AttendanceViewProps> = ({
  members,
  events,
  attendance,
  onRefresh,
  onShowToast,
}) => {
  const { canRecordAttendance } = useAuth();

  const [activeTab, setActiveTab] = useState<'record' | 'history'>('record');

  // Recording mode state
  const [selectedEventTitle, setSelectedEventTitle] = useState(
    events.length > 0 ? events[0].title : 'Ээлжит уулзалт'
  );
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  );

  // Map of memberId -> status
  const [draftStatuses, setDraftStatuses] = useState<{ [memberId: string]: AttendanceStatus }>({});
  const [draftNotes, setDraftNotes] = useState<{ [memberId: string]: string }>({});
  const [isSaving, setIsSaving] = useState(false);

  // History filters
  const [historyFilterDate, setHistoryFilterDate] = useState<string>('');
  const [historyFilterEvent, setHistoryFilterEvent] = useState<string>('all');
  const [historySearch, setHistorySearch] = useState<string>('');

  const activeMembers = useMemo(() => members.filter((m) => m.status === 'Идэвхтэй'), [members]);

  // Initial load for draft statuses
  const getMemberCurrentStatus = (memberId: string): AttendanceStatus => {
    return draftStatuses[memberId] || 'Ирсэн';
  };

  const handleStatusChange = (memberId: string, status: AttendanceStatus) => {
    setDraftStatuses((prev) => ({ ...prev, [memberId]: status }));
  };

  const handleNoteChange = (memberId: string, note: string) => {
    setDraftNotes((prev) => ({ ...prev, [memberId]: note }));
  };

  const setAllStatus = (status: AttendanceStatus) => {
    const updated: { [memberId: string]: AttendanceStatus } = {};
    activeMembers.forEach((m) => {
      updated[m.id] = status;
    });
    setDraftStatuses(updated);
    onShowToast(`Бүх гишүүдийн төлөвийг "${status}" болгож тохирууллаа.`, 'info');
  };

  const handleSaveAttendance = async () => {
    if (!canRecordAttendance) {
      onShowToast('Танд ирц бүртгэх эрх байхгүй байна.', 'error');
      return;
    }

    if (!selectedEventTitle || !selectedDate) {
      onShowToast('Арга хэмжээ болон огноог сонгоно уу.', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const recordsToSave = activeMembers.map((m) => ({
        event_title: selectedEventTitle,
        date: selectedDate,
        member_id: m.id,
        member_name: m.full_name,
        status: getMemberCurrentStatus(m.id),
        note: draftNotes[m.id] || '',
      }));

      await dbService.saveAttendanceBatch(recordsToSave);
      onShowToast(`Нийт ${recordsToSave.length} гишүүний ирц амжилттай бүртгэгдлээ!`, 'success');
      onRefresh();
      setActiveTab('history');
    } catch (err: any) {
      onShowToast(err.message || 'Ирц хадгалахад алдаа гарлаа.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAttendance = async (id: string, memberName: string) => {
    if (!canRecordAttendance) {
      onShowToast('Танд ирцийн бүртгэл устгах эрх байхгүй байна.', 'error');
      return;
    }
    if (!window.confirm(`${memberName} гишүүний энэхүү ирцийн бүртгэлийг устгахдаа итгэлтэй байна уу?`)) {
      return;
    }
    try {
      await dbService.deleteAttendance(id);
      onShowToast('Ирцийн бүртгэл амжилттай устгагдлаа.', 'success');
      onRefresh();
    } catch {
      onShowToast('Устгахад алдаа гарлаа.', 'error');
    }
  };

  // Calculate live preview stats for the current draft
  const draftStats = useMemo(() => {
    const currentRecords: AttendanceRecord[] = activeMembers.map((m) => ({
      id: m.id,
      event_title: selectedEventTitle,
      date: selectedDate,
      member_id: m.id,
      member_name: m.full_name,
      status: getMemberCurrentStatus(m.id),
    }));
    return calculateAttendanceStats(currentRecords);
  }, [activeMembers, draftStatuses, selectedEventTitle, selectedDate]);

  // Overall attendance stats from saved history
  const historyStats: AttendanceStats = useMemo(() => {
    return calculateAttendanceStats(attendance);
  }, [attendance]);

  // Filtered history list
  const filteredHistory = useMemo(() => {
    return attendance.filter((item) => {
      const matchesDate = !historyFilterDate || item.date === historyFilterDate;
      const matchesEvent = historyFilterEvent === 'all' || item.event_title === historyFilterEvent;
      const matchesSearch =
        item.member_name.toLowerCase().includes(historySearch.toLowerCase()) ||
        item.event_title.toLowerCase().includes(historySearch.toLowerCase());
      return matchesDate && matchesEvent && matchesSearch;
    });
  }, [attendance, historyFilterDate, historyFilterEvent, historySearch]);

  const uniqueEventTitles = useMemo(() => {
    const set = new Set(attendance.map((a) => a.event_title));
    return Array.from(set);
  }, [attendance]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-sky-500" />
            <span>Ирцийн бүртгэлийн систем</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Арга хэмжээ, уулзалтын ирцийг хөтлөх ба &ldquo;Чөлөөтэй&rdquo; төлөвийг хуваарилагчаас хассан бодит хувийн тооцоолол
          </p>
        </div>

        {/* View Switcher */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('record')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'record'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ирц бүртгэх
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-1.5 rounded-lg transition-all ${
              activeTab === 'history'
                ? 'bg-white text-sky-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ирцийн түүх ({attendance.length})
          </button>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-400">Ирцийн хувь</div>
          <div className="text-2xl font-black text-sky-600 mt-1">
            {activeTab === 'record' ? draftStats.percentage : historyStats.percentage}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Чөлөөг хассан</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> Ирсэн
          </div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {activeTab === 'record' ? draftStats.present : historyStats.present}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Цагтаа ирсэн</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-amber-600 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Хоцорсон
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1">
            {activeTab === 'record' ? draftStats.late : historyStats.late}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Оролцсонд тооцогдоно</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-rose-600 flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5" /> Тасалсан
          </div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {activeTab === 'record' ? draftStats.absent : historyStats.absent}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Шалтгаангүй тасалсан</div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] uppercase font-bold text-blue-600 flex items-center gap-1">
            <FileText className="w-3.5 h-3.5" /> Чөлөөтэй
          </div>
          <div className="text-2xl font-black text-blue-600 mt-1">
            {activeTab === 'record' ? draftStats.excused : historyStats.excused}
          </div>
          <div className="text-[10px] text-sky-600 font-semibold mt-0.5">Хуваарилагчаас хасагдана</div>
        </div>
      </div>

      {/* TAB 1: RECORD ATTENDANCE */}
      {activeTab === 'record' && (
        <div className="space-y-6">
          {/* Controls: Event title & Date */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Арга хэмжээ / Уулзалтын нэр <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={selectedEventTitle}
                    onChange={(e) => setSelectedEventTitle(e.target.value)}
                    placeholder="Жишээ: 10-р сарын бүх гишүүдийн хурал"
                    list="event-suggestions"
                    className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <datalist id="event-suggestions">
                    {events.map((e) => (
                      <option key={e.id} value={e.title} />
                    ))}
                    <option value="Долоо хоногийн шуурхай хурал" />
                    <option value="Хүүхдийн эрхийн сургалт" />
                    <option value="Сайн дурын мод тарих ажил" />
                  </datalist>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Бүртгэх огноо <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Quick Bulk Action Buttons */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="text-slate-500 text-[11px] font-semibold">Шуурхай сонголт:</span>
                <button
                  type="button"
                  onClick={() => setAllStatus('Ирсэн')}
                  className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-[11px] font-bold border border-emerald-200 transition-colors"
                >
                  Бүгд Ирсэн
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus('Хоцорсон')}
                  className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100 text-[11px] font-bold border border-amber-200 transition-colors"
                >
                  Бүгд Хоцорсон
                </button>
                <button
                  type="button"
                  onClick={() => setAllStatus('Чөлөөтэй')}
                  className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold border border-blue-200 transition-colors"
                >
                  Бүгд Чөлөөтэй
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveAttendance}
                disabled={isSaving || !canRecordAttendance}
                className="inline-flex items-center gap-2 px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Хадгалж байна...' : 'Ирцийг баталгаажуулж хадгалах'}</span>
              </button>
            </div>
          </div>

          {/* Members Attendance Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">
                Идэвхтэй гишүүдийн жагсаалт ({activeMembers.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Нэг бүрчлэн төлөв болон тайлбар оруулна уу
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {activeMembers.length === 0 ? (
                <div className="p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
                    <Users className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Ирц бүртгэх идэвхтэй гишүүн одоогоор байхгүй байна</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Эхлээд &ldquo;Гишүүдийн удирдлага&rdquo; цэсэнд бодит гишүүдээ нэмсний дараа тэдний ирцийг энд нэгтгэн бүртгэх боломжтой болно.
                  </p>
                </div>
              ) : (
                activeMembers.map((member, idx) => {
                  const currentStatus = getMemberCurrentStatus(member.id);
                  return (
                    <div
                      key={member.id}
                      className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      {/* Member Info */}
                      <div className="flex items-center gap-3">
                        <span className="w-6 text-center text-[11px] font-mono font-bold text-slate-400">
                          {idx + 1}.
                        </span>
                        <div>
                          <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2">
                            <span>{member.full_name}</span>
                            <span className="text-[10px] font-semibold text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                              {member.role}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500">
                            {member.student_id} • {member.university}
                          </div>
                        </div>
                      </div>

                      {/* Status Selector + Note */}
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5">
                        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                          {(['Ирсэн', 'Хоцорсон', 'Тасалсан', 'Чөлөөтэй'] as AttendanceStatus[]).map(
                            (st) => {
                              const isSelected = currentStatus === st;
                              return (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(member.id, st)}
                                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                                    isSelected
                                      ? st === 'Ирсэн'
                                        ? 'bg-emerald-500 text-white shadow-xs'
                                        : st === 'Хоцорсон'
                                        ? 'bg-amber-500 text-white shadow-xs'
                                        : st === 'Тасалсан'
                                        ? 'bg-rose-500 text-white shadow-xs'
                                        : 'bg-blue-500 text-white shadow-xs'
                                      : 'text-slate-600 hover:text-slate-900'
                                  }`}
                                >
                                  {st}
                                </button>
                              );
                            }
                          )}
                        </div>

                        <input
                          type="text"
                          value={draftNotes[member.id] || ''}
                          onChange={(e) => handleNoteChange(member.id, e.target.value)}
                          placeholder="Тэмдэглэл (жишээ: 15 мин хоцорсон)..."
                          className="w-full sm:w-52 px-3 py-1 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-sky-500"
                        />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE HISTORY */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* History Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="Гишүүн эсвэл арга хэмжээгээр хайх..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <select
                value={historyFilterEvent}
                onChange={(e) => setHistoryFilterEvent(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="all">Бүх арга хэмжээ</option>
                {uniqueEventTitles.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <input
                type="date"
                value={historyFilterDate}
                onChange={(e) => setHistoryFilterDate(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>
          </div>

          {/* Table / List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                  <tr>
                    <th className="px-4 py-3">Огноо</th>
                    <th className="px-4 py-3">Арга хэмжээ</th>
                    <th className="px-4 py-3">Гишүүний нэр</th>
                    <th className="px-4 py-3">Төлөв</th>
                    <th className="px-4 py-3">Тайлбар</th>
                    {canRecordAttendance && (
                      <th className="px-4 py-3 text-right">Үйлдэл</th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={canRecordAttendance ? 6 : 5} className="p-8 text-center text-slate-400">
                        Ирцийн бүртгэл олдсонгүй.
                      </td>
                    </tr>
                  ) : (
                    filteredHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 font-mono text-slate-500 whitespace-nowrap">
                          {item.date}
                        </td>
                        <td className="px-4 py-3 font-bold text-slate-900">
                          {item.event_title}
                        </td>
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {item.member_name}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                              item.status === 'Ирсэн'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'Хоцорсон'
                                ? 'bg-amber-100 text-amber-800'
                                : item.status === 'Тасалсан'
                                ? 'bg-rose-100 text-rose-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-500 italic">
                          {item.note || '—'}
                        </td>
                        {canRecordAttendance && (
                          <td className="px-4 py-3 text-right">
                            <button
                              onClick={() => handleDeleteAttendance(item.id, item.member_name)}
                              title="Ирцийн бүртгэл устгах"
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
