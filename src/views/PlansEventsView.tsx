import React, { useState } from 'react';
import {
  CalendarDays,
  Target,
  Plus,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  AlertCircle,
  Bell,
  Pin,
  Calendar,
  Percent,
  Banknote,
  Edit2,
  Trash2,
} from 'lucide-react';
import {
  PlanItem,
  EventItem,
  Announcement,
  PlanType,
  PlanStatus,
  EventType,
  Member,
} from '../types';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';

interface PlansEventsViewProps {
  plans: PlanItem[];
  events: EventItem[];
  announcements: Announcement[];
  members: Member[];
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const PlansEventsView: React.FC<PlansEventsViewProps> = ({
  plans,
  events,
  announcements,
  members,
  onRefresh,
  onShowToast,
}) => {
  const { canManagePlans, profile } = useAuth();
  const [subTab, setSubTab] = useState<'plans' | 'events' | 'announcements'>('plans');

  // Modals
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PlanItem | null>(null);

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isAnnouncementModalOpen, setIsAnnouncementModalOpen] = useState(false);

  // Plan form states
  const [planTitle, setPlanTitle] = useState('');
  const [planType, setPlanType] = useState<PlanType>('Сар');
  const [planPeriod, setPlanPeriod] = useState('2025 оны 10-р сар');
  const [planResponsible, setPlanResponsible] = useState(members[0]?.full_name || 'Батбаатар Тэмүүлэн');
  const [planDeadline, setPlanDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [planStatus, setPlanStatus] = useState<PlanStatus>('Явагдаж буй');
  const [planProgress, setPlanProgress] = useState<number>(50);
  const [planDescription, setPlanDescription] = useState('');
  const [planBudget, setPlanBudget] = useState<number>(0);

  // Event form states
  const [eventTitle, setEventTitle] = useState('');
  const [eventType, setEventType] = useState<EventType>('Уулзалт');
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventTime, setEventTime] = useState('14:00');
  const [eventLocation, setEventLocation] = useState('МУИС-ийн Номын сангийн 502 танхим');
  const [eventOrganizer, setEventOrganizer] = useState('UNICEF Оюутны Төлөөлөл');
  const [eventDescription, setEventDescription] = useState('');
  const [eventMaxParticipants, setEventMaxParticipants] = useState<number>(50);
  const [eventRegOpen, setEventRegOpen] = useState<boolean>(true);

  // Announcement form states
  const [annTitle, setAnnTitle] = useState('');
  const [annContent, setAnnContent] = useState('');
  const [annCategory, setAnnCategory] = useState<'Чухал' | 'Арга хэмжээ' | 'Мэдэгдэл'>('Мэдэгдэл');
  const [annPinned, setAnnPinned] = useState(false);

  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Open Plan Modal
  const openNewPlanModal = () => {
    setEditingPlan(null);
    setPlanTitle('');
    setPlanType('Сар');
    setPlanPeriod('2025 оны 10-р сар');
    setPlanResponsible(members[0]?.full_name || 'Батбаатар Тэмүүлэн');
    setPlanDeadline(new Date().toISOString().split('T')[0]);
    setPlanStatus('Явагдаж буй');
    setPlanProgress(20);
    setPlanDescription('');
    setPlanBudget(350000);
    setFormError('');
    setIsPlanModalOpen(true);
  };

  const openEditPlanModal = (p: PlanItem) => {
    setEditingPlan(p);
    setPlanTitle(p.title);
    setPlanType(p.type);
    setPlanPeriod(p.target_period);
    setPlanResponsible(p.responsible_person);
    setPlanDeadline(p.deadline);
    setPlanStatus(p.status);
    setPlanProgress(p.progress);
    setPlanDescription(p.description || '');
    setPlanBudget(p.budget || 0);
    setFormError('');
    setIsPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planTitle) {
      setFormError('Төлөвлөгөөний нэрийг оруулна уу.');
      return;
    }
    setFormLoading(true);
    try {
      if (editingPlan) {
        await dbService.updatePlan(editingPlan.id, {
          title: planTitle.trim(),
          type: planType,
          target_period: planPeriod.trim(),
          responsible_person: planResponsible.trim(),
          deadline: planDeadline,
          status: planStatus,
          progress: Number(planProgress),
          description: planDescription.trim(),
          budget: Number(planBudget),
        });
        onShowToast('Төлөвлөгөө амжилттай шинэчлэгдлээ!', 'success');
      } else {
        await dbService.addPlan({
          title: planTitle.trim(),
          type: planType,
          target_period: planPeriod.trim(),
          responsible_person: planResponsible.trim(),
          deadline: planDeadline,
          status: planStatus,
          progress: Number(planProgress),
          description: planDescription.trim(),
          budget: Number(planBudget),
        });
        onShowToast('Шинэ төлөвлөгөө амжилттай нэмэгдлээ!', 'success');
      }
      setIsPlanModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Алдаа гарлаа.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventLocation) {
      setFormError('Арга хэмжээний нэр болон байршлыг оруулна уу.');
      return;
    }
    setFormLoading(true);
    try {
      await dbService.addEvent({
        title: eventTitle.trim(),
        type: eventType,
        date: eventDate,
        time: eventTime,
        location: eventLocation.trim(),
        organizer: eventOrganizer.trim(),
        description: eventDescription.trim(),
        is_registration_open: eventRegOpen,
        max_participants: Number(eventMaxParticipants),
        registered_count: 0,
      });
      onShowToast('Арга хэмжээ амжилттай зарлагдлаа!', 'success');
      setIsEventModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Алдаа гарлаа.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleSaveAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!annTitle || !annContent) {
      setFormError('Гарчиг болон агуулгыг оруулна уу.');
      return;
    }
    setFormLoading(true);
    try {
      await dbService.addAnnouncement({
        title: annTitle.trim(),
        content: annContent.trim(),
        author: profile?.full_name || 'Удирдах зөвлөл',
        is_pinned: annPinned,
        category: annCategory,
      });
      onShowToast('Зарлал амжилттай нийтлэгдлээ!', 'success');
      setIsAnnouncementModalOpen(false);
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Алдаа гарлаа.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeletePlan = async (id: string, title: string) => {
    if (!canManagePlans) {
      onShowToast('Танд төлөвлөгөө устгах эрх байхгүй.', 'error');
      return;
    }
    if (!window.confirm(`"${title}" төлөвлөгөөг устгахдаа итгэлтэй байна уу?`)) {
      return;
    }
    try {
      await dbService.deletePlan(id);
      onShowToast('Төлөвлөгөө амжилттай устгагдлаа.', 'success');
      onRefresh();
    } catch {
      onShowToast('Устгахад алдаа гарлаа.', 'error');
    }
  };

  const handleDeleteEvent = async (id: string, title: string) => {
    if (!canManagePlans) {
      onShowToast('Танд арга хэмжээ устгах эрх байхгүй.', 'error');
      return;
    }
    if (!window.confirm(`"${title}" арга хэмжээг устгахдаа итгэлтэй байна уу?`)) {
      return;
    }
    try {
      await dbService.deleteEvent(id);
      onShowToast('Арга хэмжээ амжилттай устгагдлаа.', 'success');
      onRefresh();
    } catch {
      onShowToast('Устгахад алдаа гарлаа.', 'error');
    }
  };

  const handleDeleteAnnouncement = async (id: string, title: string) => {
    if (!canManagePlans) {
      onShowToast('Танд зарлал устгах эрх байхгүй.', 'error');
      return;
    }
    if (!window.confirm(`"${title}" зарлалыг устгахдаа итгэлтэй байна уу?`)) {
      return;
    }
    try {
      await dbService.deleteAnnouncement(id);
      onShowToast('Зарлал амжилттай устгагдлаа.', 'success');
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
            <CalendarDays className="w-5 h-5 text-sky-500" />
            <span>Төлөвлөгөө, Арга хэмжээ & Зарлал</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Сар болон жилийн төлөвлөгөө, уулзалт, сургалт болон нийт гишүүдэд зориулсан мэдээллийн нэгдсэн удирдлага
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-bold self-start sm:self-auto">
          <button
            onClick={() => setSubTab('plans')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'plans' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Төлөвлөгөө ({plans.length})
          </button>
          <button
            onClick={() => setSubTab('events')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'events' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Арга хэмжээ ({events.length})
          </button>
          <button
            onClick={() => setSubTab('announcements')}
            className={`px-3 py-1.5 rounded-lg transition-all ${
              subTab === 'announcements' ? 'bg-white text-sky-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Зарлал ({announcements.length})
          </button>
        </div>
      </div>

      {/* SUBTAB 1: PLANS */}
      {subTab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Клубийн зорилтот ажлын төлөвлөгөөнүүд</span>
            {canManagePlans && (
              <button
                onClick={openNewPlanModal}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Шинэ төлөвлөгөө нэмэх</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {plans.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                Төлөвлөгөө хараахан үүсгээгүй байна.
              </div>
            ) : (
              plans.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-sky-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          p.type === 'Жил'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-sky-100 text-sky-700'
                        }`}
                      >
                        {p.type}ийн төлөвлөгөө
                      </span>
                      <span className="text-[11px] text-slate-500 font-semibold">{p.target_period}</span>
                    </div>

                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        p.status === 'Дууссан'
                          ? 'bg-emerald-100 text-emerald-800'
                          : p.status === 'Явагдаж буй'
                          ? 'bg-sky-100 text-sky-800'
                          : p.status === 'Төлөвлөсөн'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {p.status}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{p.title}</h3>

                  {p.description && (
                    <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{p.description}</p>
                  )}

                  {/* Progress Bar */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-slate-500">Гүйцэтгэлийн явц</span>
                      <span className="font-extrabold text-sky-600">{p.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(p.progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Footer details */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Хариуцагч: <b className="text-slate-800">{p.responsible_person}</b></span>
                    <span>Хугацаа: <b className="text-slate-800">{p.deadline}</b></span>
                  </div>

                  {p.budget ? (
                    <div className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                      <Banknote className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Төсөв: {p.budget.toLocaleString()} ₮</span>
                    </div>
                  ) : null}

                  {canManagePlans && (
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                      <button
                        onClick={() => handleDeletePlan(p.id, p.title)}
                        className="inline-flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-semibold"
                        title="Төлөвлөгөө устгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Устгах</span>
                      </button>
                      <button
                        onClick={() => openEditPlanModal(p)}
                        className="inline-flex items-center gap-1 text-xs text-sky-600 hover:text-sky-700 font-semibold"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Явц & Төлөв засах</span>
                      </button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 2: EVENTS */}
      {subTab === 'events' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Клубийн бүх арга хэмжээнүүд</span>
            {canManagePlans && (
              <button
                onClick={() => {
                  setEventTitle('');
                  setEventLocation('МУИС-ийн Номын сангийн 502 танхим');
                  setEventDescription('');
                  setIsEventModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Шинэ арга хэмжээ зарлах</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {events.length === 0 ? (
              <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                Арга хэмжээ зарлагдаагүй байна.
              </div>
            ) : (
              events.map((evt) => (
                <div
                  key={evt.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:border-sky-300 transition-all space-y-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">
                      {evt.type}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        evt.is_registration_open
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-200 text-slate-600'
                      }`}
                    >
                      {evt.is_registration_open ? 'Бүртгэл нээлттэй' : 'Бүртгэл хаагдсан'}
                    </span>
                  </div>

                  <h3 className="font-extrabold text-sm text-slate-900 leading-snug">{evt.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{evt.description}</p>

                  <div className="p-3 rounded-xl bg-slate-50/80 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-sky-500" />
                      <span>{evt.date} • {evt.time}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-rose-500" />
                      <span>{evt.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-3.5 h-3.5 text-slate-400" />
                      <span>Зохион байгуулагч: {evt.organizer}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Хязгаар: {evt.max_participants || 'Хязгааргүй'} хүн</span>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sky-600">Бүртгэгдсэн: {evt.registered_count || 0}</span>
                      {canManagePlans && (
                        <button
                          onClick={() => handleDeleteEvent(evt.id, evt.title)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center"
                          title="Арга хэмжээ устгах"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 3: ANNOUNCEMENTS */}
      {subTab === 'announcements' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">Нийт зарлалууд</span>
            {canManagePlans && (
              <button
                onClick={() => {
                  setAnnTitle('');
                  setAnnContent('');
                  setAnnPinned(false);
                  setIsAnnouncementModalOpen(true);
                }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Шинэ зарлал нийтлэх</span>
              </button>
            )}
          </div>

          <div className="space-y-3">
            {announcements.length === 0 ? (
              <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
                Зарлал одоогоор байхгүй байна.
              </div>
            ) : (
              announcements.map((ann) => (
                <div
                  key={ann.id}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-2.5 transition-all ${
                    ann.is_pinned ? 'border-sky-300 bg-sky-50/20' : 'border-slate-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      {ann.is_pinned && (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-sky-500 text-white shadow-xs">
                          <Pin className="w-3 h-3" /> Чухал
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {ann.category}
                      </span>
                      <h3 className="font-extrabold text-sm text-slate-900">{ann.title}</h3>
                    </div>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      {new Date(ann.created_at).toLocaleDateString('mn-MN')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line">{ann.content}</p>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                    <div>Нийтэлсэн: <b className="text-slate-700">{ann.author}</b></div>
                    {canManagePlans && (
                      <button
                        onClick={() => handleDeleteAnnouncement(ann.id, ann.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                        title="Зарлал устгах"
                      >
                        <Trash2 className="w-3 h-3" />
                        <span>Устгах</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: ADD / EDIT PLAN */}
      {isPlanModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingPlan ? 'Төлөвлөгөө шинэчлэх' : 'Шинэ төлөвлөгөө үүсгэх'}
              </h3>
              <button onClick={() => setIsPlanModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSavePlan} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Төлөвлөгөөт ажлын нэр <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={planTitle}
                  onChange={(e) => setPlanTitle(e.target.value)}
                  placeholder="Жишээ: Шинэ гишүүдийн дадлагажуулах хөтөлбөр"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Хугацааны төрөл</label>
                  <select
                    value={planType}
                    onChange={(e) => setPlanType(e.target.value as PlanType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Сар">Сарын төлөвлөгөө</option>
                    <option value="Жил">Жилийн төлөвлөгөө</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Хамрах хугацаа</label>
                  <input
                    type="text"
                    value={planPeriod}
                    onChange={(e) => setPlanPeriod(e.target.value)}
                    placeholder="2025 оны 10-р сар"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Хариуцах гишүүн / дарга</label>
                  <input
                    type="text"
                    value={planResponsible}
                    onChange={(e) => setPlanResponsible(e.target.value)}
                    placeholder="Хариуцагчийн нэр"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Эцсийн хугацаа (Deadline)</label>
                  <input
                    type="date"
                    value={planDeadline}
                    onChange={(e) => setPlanDeadline(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Төлөв</label>
                  <select
                    value={planStatus}
                    onChange={(e) => setPlanStatus(e.target.value as PlanStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Төлөвлөсөн">Төлөвлөсөн</option>
                    <option value="Явагдаж буй">Явагдаж буй</option>
                    <option value="Дууссан">Дууссан</option>
                    <option value="Цуцлагдсан">Цуцлагдсан</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Явцын хувь ({planProgress}%)</label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={planProgress}
                    onChange={(e) => setPlanProgress(parseInt(e.target.value))}
                    className="w-full accent-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Төсөв (Төгрөгөөр)</label>
                <input
                  type="number"
                  min={0}
                  step={50000}
                  value={planBudget}
                  onChange={(e) => setPlanBudget(parseFloat(e.target.value) || 0)}
                  placeholder="350000"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Дэлгэрэнгүй тайлбар</label>
                <textarea
                  value={planDescription}
                  onChange={(e) => setPlanDescription(e.target.value)}
                  rows={2}
                  placeholder="Зорилго, үйл ажиллагааны дараалал..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPlanModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {formLoading ? 'Хадгалж байна...' : 'Хадгалах'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: ADD EVENT */}
      {isEventModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Шинэ арга хэмжээ зарлах</h3>
              <button onClick={() => setIsEventModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveEvent} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Арга хэмжээний нэр *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Жишээ: Хүүхдийн эрхийн өдөрлөг"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Төрөл</label>
                  <select
                    value={eventType}
                    onChange={(e) => setEventType(e.target.value as EventType)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Сургалт">Сургалт</option>
                    <option value="Сайн дурын ажил">Сайн дурын ажил</option>
                    <option value="Чуулган">Чуулган</option>
                    <option value="Уулзалт">Уулзалт</option>
                    <option value="Аян">Аян</option>
                    <option value="Бусад">Бусад</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Огноо *</label>
                  <input
                    type="date"
                    value={eventDate}
                    onChange={(e) => setEventDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Эхлэх цаг</label>
                  <input
                    type="text"
                    value={eventTime}
                    onChange={(e) => setEventTime(e.target.value)}
                    placeholder="14:00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Хамгийн их оролцогч</label>
                  <input
                    type="number"
                    min={5}
                    value={eventMaxParticipants}
                    onChange={(e) => setEventMaxParticipants(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Байршил *</label>
                <input
                  type="text"
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Танхим, сургууль, цэцэрлэгт хүрээлэн г.м"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Зохион байгуулагч</label>
                <input
                  type="text"
                  value={eventOrganizer}
                  onChange={(e) => setEventOrganizer(e.target.value)}
                  placeholder="UNICEF Оюутны төлөөлөл"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Дэлгэрэнгүй мэдээлэл</label>
                <textarea
                  value={eventDescription}
                  onChange={(e) => setEventDescription(e.target.value)}
                  rows={2}
                  placeholder="Арга хэмжээний хөтөлбөр, урилга..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="regOpen"
                  checked={eventRegOpen}
                  onChange={(e) => setEventRegOpen(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="regOpen" className="font-semibold text-slate-700">Оюутны бүртгэлийг нээлттэй байлгах</label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {formLoading ? 'Хадгалж байна...' : 'Нийтлэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD ANNOUNCEMENT */}
      {isAnnouncementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Зарлал нийтлэх</h3>
              <button onClick={() => setIsAnnouncementModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg">✕</button>
            </div>

            <form onSubmit={handleSaveAnnouncement} className="p-6 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Зарлалын гарчиг *</label>
                <input
                  type="text"
                  value={annTitle}
                  onChange={(e) => setAnnTitle(e.target.value)}
                  placeholder="Анхааруулга эсвэл мэдээллийн гарчиг"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Ангилал</label>
                <select
                  value={annCategory}
                  onChange={(e) => setAnnCategory(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="Мэдэгдэл">Энгийн мэдэгдэл</option>
                  <option value="Чухал">Яаралтай / Чухал</option>
                  <option value="Арга хэмжээ">Арга хэмжээтэй холбоотой</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Зарлалын агуулга *</label>
                <textarea
                  value={annContent}
                  onChange={(e) => setAnnContent(e.target.value)}
                  rows={4}
                  placeholder="Нийт гишүүдэд хүргэх мэдээллээ энд бичнэ үү..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="annPin"
                  checked={annPinned}
                  onChange={(e) => setAnnPinned(e.target.checked)}
                  className="rounded text-sky-500 focus:ring-sky-500"
                />
                <label htmlFor="annPin" className="font-semibold text-slate-700">Самбарын эхэнд бэхлэх (Pin)</label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAnnouncementModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 font-semibold"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-bold shadow-md shadow-sky-500/20 disabled:opacity-50"
                >
                  {formLoading ? 'Нийтэлж байна...' : 'Нийтлэх'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
