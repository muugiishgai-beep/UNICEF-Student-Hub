import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Filter,
  Calendar,
  Users,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileSpreadsheet,
  Award,
  PieChart,
} from 'lucide-react';
import {
  Member,
  AttendanceRecord,
  ParticipationRecord,
  PlanItem,
  AttendanceStats,
} from '../types';
import { calculateAttendanceStats } from '../lib/supabase';

interface ReportsViewProps {
  members: Member[];
  attendance: AttendanceRecord[];
  participation: ParticipationRecord[];
  plans: PlanItem[];
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  members,
  attendance,
  participation,
  plans,
  onShowToast,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Filtered Attendance Data
  const filteredAttendance = useMemo(() => {
    return attendance.filter((a) => {
      const matchMember = selectedMemberId === 'all' || a.member_id === selectedMemberId;
      const matchStart = !startDate || a.date >= startDate;
      const matchEnd = !endDate || a.date <= endDate;
      return matchMember && matchStart && matchEnd;
    });
  }, [attendance, selectedMemberId, startDate, endDate]);

  // Filtered Participation Data
  const filteredParticipation = useMemo(() => {
    return participation.filter((p) => {
      const matchMember = selectedMemberId === 'all' || p.member_id === selectedMemberId;
      const matchStart = !startDate || p.date >= startDate;
      const matchEnd = !endDate || p.date <= endDate;
      return matchMember && matchStart && matchEnd;
    });
  }, [participation, selectedMemberId, startDate, endDate]);

  const stats: AttendanceStats = useMemo(() => {
    return calculateAttendanceStats(filteredAttendance);
  }, [filteredAttendance]);

  const totalFilteredVolunteerHours = useMemo(() => {
    return filteredParticipation.reduce((acc, curr) => acc + Number(curr.volunteer_hours || 0), 0);
  }, [filteredParticipation]);

  // Member-wise Attendance Table
  const memberAttendanceBreakdown = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        role: string;
        present: number;
        late: number;
        absent: number;
        excused: number;
      }
    >();

    members.forEach((m) => {
      map.set(m.id, {
        name: m.full_name,
        role: m.role,
        present: 0,
        late: 0,
        absent: 0,
        excused: 0,
      });
    });

    filteredAttendance.forEach((rec) => {
      const item = map.get(rec.member_id);
      if (item) {
        if (rec.status === 'Ирсэн') item.present += 1;
        else if (rec.status === 'Хоцорсон') item.late += 1;
        else if (rec.status === 'Тасалсан') item.absent += 1;
        else if (rec.status === 'Чөлөөтэй') item.excused += 1;
      }
    });

    return Array.from(map.entries())
      .map(([id, data]) => {
        const denominator = data.present + data.late + data.absent;
        const rate =
          denominator > 0 ? Math.round(((data.present + data.late) / denominator) * 100) : 100;
        return {
          id,
          ...data,
          rate,
          totalMeetings: data.present + data.late + data.absent + data.excused,
        };
      })
      .sort((a, b) => b.rate - a.rate);
  }, [members, filteredAttendance]);

  // CSV Export with UTF-8 BOM
  const exportAttendanceCSV = () => {
    if (filteredAttendance.length === 0) {
      onShowToast('Экспортлох ирцийн өгөгдөл олдсонгүй.', 'error');
      return;
    }

    const headers = ['Огноо', 'Арга хэмжээ', 'Гишүүний нэр', 'Төлөв', 'Тайлбар'];
    const rows = filteredAttendance.map((a) => [
      `"${a.date}"`,
      `"${a.event_title.replace(/"/g, '""')}"`,
      `"${a.member_name.replace(/"/g, '""')}"`,
      `"${a.status}"`,
      `"${(a.note || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csvContent, `UNICEF_Ирцийн_Тайлан_${new Date().toISOString().split('T')[0]}.csv`);
    onShowToast('Ирцийн тайлан CSV амжилттай татагдлаа!', 'success');
  };

  const exportMembersCSV = () => {
    if (members.length === 0) {
      onShowToast('Экспортлох гишүүн олдсонгүй.', 'error');
      return;
    }

    const headers = [
      'Овог нэр',
      'Оюутны код',
      'Сургууль',
      'Мэргэжил',
      'Албан тушаал',
      'Төлөв',
      'Элссэн огноо',
      'И-мэйл',
      'Утас',
    ];

    const rows = members.map((m) => [
      `"${m.full_name.replace(/"/g, '""')}"`,
      `"${m.student_id}"`,
      `"${m.university.replace(/"/g, '""')}"`,
      `"${m.major.replace(/"/g, '""')}"`,
      `"${m.role}"`,
      `"${m.status}"`,
      `"${m.joined_date}"`,
      `"${m.email}"`,
      `"${m.phone}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csvContent, `UNICEF_Гишүүдийн_Жагсаалт_${new Date().toISOString().split('T')[0]}.csv`);
    onShowToast('Гишүүдийн нэрсийн жагсаалт CSV амжилттай татагдлаа!', 'success');
  };

  const exportParticipationCSV = () => {
    if (filteredParticipation.length === 0) {
      onShowToast('Экспортлох оролцооны өгөгдөл олдсонгүй.', 'error');
      return;
    }

    const headers = ['Огноо', 'Гишүүний нэр', 'Арга хэмжээ', 'Сайн дурын цаг', 'Хариуцсан ажил', 'Төлөв', 'Амжилт'];
    const rows = filteredParticipation.map((p) => [
      `"${p.date}"`,
      `"${p.member_name.replace(/"/g, '""')}"`,
      `"${p.event_title.replace(/"/g, '""')}"`,
      p.volunteer_hours,
      `"${(p.assigned_task || '').replace(/"/g, '""')}"`,
      `"${p.task_status || ''}"`,
      `"${(p.achievement || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    downloadBlob(csvContent, `UNICEF_Оролцооны_Тайлан_${new Date().toISOString().split('T')[0]}.csv`);
    onShowToast('Оролцоо, ажлын тайлан CSV амжилттай татагдлаа!', 'success');
  };

  const downloadBlob = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-sky-500" />
            <span>Тайлан, Шинжилгээ & CSV Экспорт</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Ирц, оролцооны график үзүүлэлт болон Excel-д нийцтэй UTF-8 форматаар файл татаж авах
          </p>
        </div>

        {/* Export Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={exportAttendanceCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
            title="Ирцийн бүртгэлийг CSV хэлбэрээр татах"
          >
            <Download className="w-3.5 h-3.5 text-sky-600" />
            <span>Ирц (CSV)</span>
          </button>
          <button
            onClick={exportMembersCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-all"
            title="Гишүүдийн мэдээллийг CSV хэлбэрээр татах"
          >
            <Download className="w-3.5 h-3.5 text-emerald-600" />
            <span>Гишүүд (CSV)</span>
          </button>
          <button
            onClick={exportParticipationCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
            title="Оролцоо, ажлын цагийн тайланг татах"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Оролцоо (CSV)</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Гишүүнээр шүүх</label>
          <select
            value={selectedMemberId}
            onChange={(e) => setSelectedMemberId(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">Бүх гишүүд ({members.length})</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name} ({m.role})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Эхлэх огноо</label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold text-slate-500 mb-1">Дуусах огноо</label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="w-full px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>
      </div>

      {/* Charts & Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Breakdown Visual */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-sky-500" />
              <span>Ирцийн хувь ба бүтцийн харьцаа</span>
            </h3>
          </div>

          <div className="py-4 text-center">
            <div className="text-4xl font-black text-sky-600">{stats.percentage}%</div>
            <div className="text-xs text-slate-500 font-semibold mt-1">Бодит ирцийн гүйцэтгэл</div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              Хуваарилагч: {stats.denominator} (Чөлөөтэй {stats.excused}-г хассан)
            </div>
          </div>

          {/* Graphical Bars */}
          <div className="space-y-3 pt-2 border-t border-slate-100 text-xs">
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-bold text-emerald-700">Ирсэн: {stats.present}</span>
                <span className="font-mono text-slate-500">
                  {stats.total > 0 ? Math.round((stats.present / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.present / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-bold text-amber-700">Хоцорсон: {stats.late}</span>
                <span className="font-mono text-slate-500">
                  {stats.total > 0 ? Math.round((stats.late / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-amber-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.late / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-bold text-rose-700">Тасалсан: {stats.absent}</span>
                <span className="font-mono text-slate-500">
                  {stats.total > 0 ? Math.round((stats.absent / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-rose-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.absent / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>

            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="font-bold text-blue-700">Чөлөөтэй: {stats.excused}</span>
                <span className="font-mono text-slate-500">
                  {stats.total > 0 ? Math.round((stats.excused / stats.total) * 100) : 0}%
                </span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${stats.total > 0 ? (stats.excused / stats.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Member-by-Member Breakdown Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-sky-500" />
              <span>Гишүүн тус бүрийн ирцийн биелэлт</span>
            </h3>
            <span className="text-xs text-slate-400">Ирцийн хувиар эрэмбэлэгдсэн</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">Гишүүний нэр</th>
                  <th className="px-3 py-2.5">Үүрэг</th>
                  <th className="px-3 py-2.5 text-center">Ирсэн</th>
                  <th className="px-3 py-2.5 text-center">Хоцорсон</th>
                  <th className="px-3 py-2.5 text-center">Тасалсан</th>
                  <th className="px-3 py-2.5 text-center">Чөлөө</th>
                  <th className="px-3 py-2.5 text-right">Ирцийн хувь</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {memberAttendanceBreakdown.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-3 py-2.5 font-bold text-slate-900">{row.name}</td>
                    <td className="px-3 py-2.5 text-slate-500 text-[11px]">{row.role}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-emerald-600">{row.present}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-amber-600">{row.late}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-rose-600">{row.absent}</td>
                    <td className="px-3 py-2.5 text-center font-bold text-blue-600">{row.excused}</td>
                    <td className="px-3 py-2.5 text-right font-black">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md ${
                          row.rate >= 80
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.rate >= 60
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {row.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
