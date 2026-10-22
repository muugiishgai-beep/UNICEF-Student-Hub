import React, { useState } from 'react';
import {
  UserCheck,
  Check,
  X,
  Clock,
  Mail,
  Phone,
  GraduationCap,
  Sparkles,
  ShieldAlert,
  AlertCircle,
  PlusCircle,
  Search,
} from 'lucide-react';
import { MembershipRequest } from '../types';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';

interface RequestsViewProps {
  requests: MembershipRequest[];
  onRefresh: () => void;
  onOpenApplicationModal: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const RequestsView: React.FC<RequestsViewProps> = ({
  requests,
  onRefresh,
  onOpenApplicationModal,
  onShowToast,
}) => {
  const { profile, canApproveRequests } = useAuth();
  const [filterStatus, setFilterStatus] = useState<string>('Хүлээгдэж буй');
  const [search, setSearch] = useState('');
  const [reviewNotes, setReviewNotes] = useState<{ [id: string]: string }>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const filteredRequests = requests.filter((r) => {
    const matchesFilter = filterStatus === 'all' || r.status === filterStatus;
    const matchesSearch =
      r.full_name.toLowerCase().includes(search.toLowerCase()) ||
      r.student_id.toLowerCase().includes(search.toLowerCase()) ||
      r.university.toLowerCase().includes(search.toLowerCase()) ||
      r.major.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleDecision = async (id: string, decision: 'Зөвшөөрсөн' | 'Татгалзсан') => {
    if (!canApproveRequests) {
      onShowToast('Зөвхөн эрх бүхий админ хүсэлтийг шийдвэрлэх эрхтэй.', 'error');
      return;
    }

    const note = reviewNotes[id] || '';
    setActionLoading(id);
    try {
      await dbService.updateRequestStatus(
        id,
        decision,
        profile?.full_name || 'Админ',
        note
      );

      if (decision === 'Зөвшөөрсөн') {
        onShowToast('Хүсэлтийг зөвшөөрч, гишүүнээр амжилттай бүртгэлээ!', 'success');
      } else {
        onShowToast('Хүсэлтээс татгалзлаа.', 'info');
      }
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message || 'Алдаа гарлаа.', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-sky-500" />
            <span>Элсэх хүсэлтүүдийн удирдлага</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Клубт нэгдэх хүсэлт гаргасан оюутнуудын мэдээлэл болон баталгаажуулалт
          </p>
        </div>

        <button
          onClick={onOpenApplicationModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Шинэ анкет бөглөх</span>
        </button>
      </div>

      {/* Permission alert for non-admins */}
      {!canApproveRequests && (
        <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <b>Хязгаарлагдмал эрх:</b> Хүсэлт шалгаж, шинэ гишүүнээр батлах эрх зөвхөн клубийн Тэргүүн, Дэд тэргүүн, Нарийн бичгийн даргад олгогдсон байдаг.
          </span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          <button
            onClick={() => setFilterStatus('Хүлээгдэж буй')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'Хүлээгдэж буй'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Хүлээгдэж буй ({requests.filter((r) => r.status === 'Хүлээгдэж буй').length})
          </button>
          <button
            onClick={() => setFilterStatus('Зөвшөөрсөн')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'Зөвшөөрсөн'
                ? 'bg-emerald-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Зөвшөөрсөн ({requests.filter((r) => r.status === 'Зөвшөөрсөн').length})
          </button>
          <button
            onClick={() => setFilterStatus('Татгалзсан')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'Татгалзсан'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Татгалзсан ({requests.filter((r) => r.status === 'Татгалзсан').length})
          </button>
          <button
            onClick={() => setFilterStatus('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              filterStatus === 'all'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Бүгд ({requests.length})
          </button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Хүсэлт гаргагчаар хайх..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>
      </div>

      {/* Requests List */}
      <div className="space-y-4">
        {filteredRequests.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto">
              <UserCheck className="w-6 h-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-800">Бүртгэгдсэн хүсэлт одоогоор байхгүй байна</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Шинэ оюутнууд клубт элсэх хүсэлтээ илгээсний дараа энд харагдаж, админ шалгах боломжтой болно.
            </p>
            <div className="pt-1">
              <button
                onClick={onOpenApplicationModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>+ Анкет бөглөх</span>
              </button>
            </div>
          </div>
        ) : (
          filteredRequests.map((req) => (
            <div
              key={req.id}
              className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs hover:border-sky-300 transition-all space-y-4"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-700 font-extrabold flex items-center justify-center text-sm">
                    {req.full_name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">{req.full_name}</h3>
                    <div className="text-[11px] text-slate-500 flex items-center gap-2">
                      <span className="font-mono">Оюутны код: {req.student_id}</span>
                      <span>•</span>
                      <span>{new Date(req.submitted_at).toLocaleDateString('mn-MN')}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <span
                    className={`text-xs font-bold px-3 py-1 rounded-full ${
                      req.status === 'Хүлээгдэж буй'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : req.status === 'Зөвшөөрсөн'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}
                  >
                    {req.status}
                  </span>
                </div>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs bg-slate-50/70 p-3.5 rounded-xl border border-slate-100">
                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Сургууль / Мэргэжил</span>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                    <span>{req.university} — {req.major}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">И-мэйл хаяг</span>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5 font-mono">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{req.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Утасны дугаар</span>
                  <div className="font-medium text-slate-800 flex items-center gap-1.5 font-mono">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{req.phone}</span>
                  </div>
                </div>
              </div>

              {/* Motivation & Skills */}
              <div className="space-y-2 text-xs">
                <div>
                  <span className="font-bold text-slate-700">Элсэх хүсэлт, зорилго:</span>
                  <p className="mt-1 text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {req.reason}
                  </p>
                </div>
                <div>
                  <span className="font-bold text-slate-700">Ур чадвар & Сонирхол:</span>
                  <p className="mt-1 text-slate-600 bg-white p-3 rounded-xl border border-slate-200 leading-relaxed">
                    {req.skills_interests}
                  </p>
                </div>
              </div>

              {/* Review details if already processed */}
              {req.reviewed_by && (
                <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-600 flex items-center justify-between">
                  <span>Шалгасан админ: <b className="text-slate-800">{req.reviewed_by}</b></span>
                  {req.reviewed_at && (
                    <span>Огноо: {new Date(req.reviewed_at).toLocaleDateString('mn-MN')}</span>
                  )}
                  {req.review_notes && <span>Тэмдэглэл: {req.review_notes}</span>}
                </div>
              )}

              {/* Actions for Pending Requests */}
              {req.status === 'Хүлээгдэж буй' && canApproveRequests && (
                <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <input
                    type="text"
                    value={reviewNotes[req.id] || ''}
                    onChange={(e) =>
                      setReviewNotes({ ...reviewNotes, [req.id]: e.target.value })
                    }
                    placeholder="Шийдвэрийн нэмэлт тайлбар (заавал биш)..."
                    className="w-full sm:max-w-md px-3 py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleDecision(req.id, 'Татгалзсан')}
                      disabled={actionLoading === req.id}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold transition-all disabled:opacity-50"
                    >
                      <X className="w-3.5 h-3.5" />
                      <span>Татгалзах</span>
                    </button>

                    <button
                      onClick={() => handleDecision(req.id, 'Зөвшөөрсөн')}
                      disabled={actionLoading === req.id}
                      className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Зөвшөөрч гишүүн болгох</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
