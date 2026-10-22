import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  Plus,
  UserCheck,
  UserX,
  Edit2,
  Lock,
  Phone,
  Mail,
  GraduationCap,
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  X,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { Member, MemberRole, MemberStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../lib/supabase';

interface MembersViewProps {
  members: Member[];
  onRefresh: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

const ALL_ROLES: MemberRole[] = [
  'Тэргүүн',
  'Дэд тэргүүн',
  'Санхүүгийн дарга',
  'Нарийн бичгийн дарга',
  'Зөвлөх',
  'Багш',
  'Гишүүн',
];

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  onRefresh,
  onShowToast,
}) => {
  const { canManageMembers, canViewPrivateContacts } = useAuth();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<Member | null>(null);

  // Form states for add / edit
  const [formFullName, setFormFullName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formUniversity, setFormUniversity] = useState('Монгол Улсын Их Сургууль');
  const [formMajor, setFormMajor] = useState('');
  const [formRole, setFormRole] = useState<MemberRole>('Гишүүн');
  const [formStatus, setFormStatus] = useState<MemberStatus>('Идэвхтэй');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formBio, setFormBio] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Filtering
  const filteredMembers = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        m.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.student_id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.university.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.major.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole = selectedRole === 'all' || m.role === selectedRole;
      const matchesStatus = selectedStatus === 'all' || m.status === selectedStatus;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [members, searchQuery, selectedRole, selectedStatus]);

  // Open Add Modal
  const openAddModal = () => {
    setFormFullName('');
    setFormStudentId('');
    setFormUniversity('Монгол Улсын Их Сургууль');
    setFormMajor('');
    setFormRole('Гишүүн');
    setFormStatus('Идэвхтэй');
    setFormEmail('');
    setFormPhone('');
    setFormBio('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const openEditModal = (m: Member) => {
    setEditingMember(m);
    setFormFullName(m.full_name);
    setFormStudentId(m.student_id);
    setFormUniversity(m.university);
    setFormMajor(m.major);
    setFormRole(m.role);
    setFormStatus(m.status);
    setFormEmail(m.email);
    setFormPhone(m.phone);
    setFormBio(m.bio || '');
    setFormError('');
  };

  const handleSaveMember = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formFullName || !formStudentId || !formUniversity || !formMajor || !formEmail || !formPhone) {
      setFormError('Шаардлагатай бүх талбарыг бөглөнө үү.');
      return;
    }

    setFormLoading(true);
    try {
      if (editingMember) {
        await dbService.updateMember(editingMember.id, {
          full_name: formFullName.trim(),
          student_id: formStudentId.trim(),
          university: formUniversity.trim(),
          major: formMajor.trim(),
          role: formRole,
          status: formStatus,
          email: formEmail.trim(),
          phone: formPhone.trim(),
          bio: formBio.trim(),
        });
        onShowToast('Гишүүний мэдээлэл амжилттай шинэчлэгдлээ!', 'success');
        setEditingMember(null);
      } else {
        await dbService.addMember({
          full_name: formFullName.trim(),
          student_id: formStudentId.trim(),
          university: formUniversity.trim(),
          major: formMajor.trim(),
          role: formRole,
          status: formStatus,
          joined_date: new Date().toISOString().split('T')[0],
          email: formEmail.trim(),
          phone: formPhone.trim(),
          bio: formBio.trim(),
        });
        onShowToast('Шинэ гишүүн амжилттай бүртгэгдлээ!', 'success');
        setIsAddModalOpen(false);
      }
      onRefresh();
    } catch (err: any) {
      setFormError(err.message || 'Алдаа гарлаа.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDeactivate = async (id: string, name: string) => {
    if (confirm(`Та "${name}" гишүүний төлөвийг "Идэвхгүй" болгохдоо итгэлтэй байна уу?`)) {
      try {
        await dbService.deactivateMember(id);
        onShowToast(`"${name}" гишүүн идэвхгүй боллоо.`, 'info');
        onRefresh();
      } catch (err: any) {
        onShowToast(err.message || 'Үйлдэл амжилтгүй.', 'error');
      }
    }
  };

  const handleReactivate = async (id: string, name: string) => {
    try {
      await dbService.updateMember(id, { status: 'Идэвхтэй' });
      onShowToast(`"${name}" гишүүн идэвхтэй боллоо.`, 'success');
      onRefresh();
    } catch (err: any) {
      onShowToast(err.message || 'Үйлдэл амжилтгүй.', 'error');
    }
  };

  const handleDeleteMember = async (id: string, name: string) => {
    if (confirm(`Та "${name}" гишүүнийг бүртгэлээс бүрмөсөн хасахдаа итгэлтэй байна уу?`)) {
      try {
        await dbService.deleteMember(id);
        onShowToast(`"${name}" гишүүн амжилттай хасагдлаа.`, 'info');
        onRefresh();
      } catch (err: any) {
        onShowToast(err.message || 'Алдаа гарлаа.', 'error');
      }
    }
  };

  // Helper to mask phone and email for non-admin viewers to protect personal info
  const formatProtectedPhone = (phone: string) => {
    if (canViewPrivateContacts) return phone;
    if (!phone) return '—';
    return phone.slice(0, 2) + '****' + phone.slice(-2);
  };

  const formatProtectedEmail = (email: string) => {
    if (canViewPrivateContacts) return email;
    if (!email) return '—';
    const parts = email.split('@');
    if (parts.length < 2) return '—';
    return parts[0].slice(0, 2) + '***@' + parts[1];
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-sky-500" />
            <span>Гишүүдийн удирдлага</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Клубийн нийт {members.length} гишүүний албан тушаал, анги курс, холбоо барих мэдээллийн нэгдсэн сан
          </p>
        </div>

        {canManageMembers && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>+ Гишүүн нэмэх</span>
          </button>
        )}
      </div>

      {/* Privacy Notice Banner */}
      {!canViewPrivateContacts && (
        <div className="p-3.5 rounded-xl bg-sky-50 border border-sky-200/80 text-sky-900 text-xs flex items-center gap-3">
          <Lock className="w-4 h-4 text-sky-600 shrink-0" />
          <p>
            <b className="font-semibold">Хувийн нууцлалын хамгаалалт:</b> Гишүүдийн утас болон цахим шуудангийн дэлгэрэнгүй мэдээлэл зөвхөн клубийн эрх бүхий удирдлагад ил харагдана.
          </p>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Input */}
          <div className="sm:col-span-1 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Нэр, оюутны код, сургуулиар хайх..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
            >
              <option value="all">Бүх үүрэг / Албан тушаал</option>
              {ALL_ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent bg-white"
            >
              <option value="all">Бүх төлөв (Идэвхтэй & Идэвхгүй)</option>
              <option value="Идэвхтэй">Зөвхөн Идэвхтэй</option>
              <option value="Идэвхгүй">Идэвхгүй / Чөлөөлөгдсөн</option>
            </select>
          </div>
        </div>
      </div>

      {/* Members Grid / Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {members.length === 0 ? (
          <div className="col-span-full bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-sky-50 text-sky-500 flex items-center justify-center mx-auto shadow-inner">
              <Users className="w-8 h-8" />
            </div>
            <div className="max-w-md mx-auto space-y-1">
              <h3 className="text-base font-bold text-slate-900">Одоогоор гишүүн бүртгэгдээгүй байна</h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Та клубийнхээ бодит гишүүдийг нэмж, үүрэг албан тушаалыг нь өөрөө хуваарилж эхэлнэ үү.
              </p>
            </div>
            {canManageMembers && (
              <div className="pt-2">
                <button
                  onClick={openAddModal}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all hover:scale-105"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Гишүүн нэмэх</span>
                </button>
              </div>
            )}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 text-xs">
            Хайлтад тохирох гишүүн олдсонгүй.
          </div>
        ) : (
          filteredMembers.map((member) => (
            <div
              key={member.id}
              className={`bg-white rounded-2xl border p-5 transition-all shadow-2xs hover:shadow-md ${
                member.status === 'Идэвхгүй'
                  ? 'border-slate-200 opacity-75 bg-slate-50/50'
                  : 'border-slate-200 hover:border-sky-300'
              }`}
            >
              {/* Card Header: Role & Status */}
              <div className="flex items-start justify-between gap-2">
                <span
                  className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${
                    member.role === 'Тэргүүн'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : member.role === 'Дэд тэргүүн'
                      ? 'bg-sky-100 text-sky-800'
                      : member.role === 'Санхүүгийн дарга'
                      ? 'bg-emerald-100 text-emerald-800'
                      : member.role === 'Нарийн бичгийн дарга'
                      ? 'bg-indigo-100 text-indigo-800'
                      : member.role === 'Зөвлөх' || member.role === 'Багш'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {member.role}
                </span>

                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    member.status === 'Идэвхтэй'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {member.status}
                </span>
              </div>

              {/* Member Core Info */}
              <div className="mt-3.5 space-y-2">
                <h3 className="font-extrabold text-sm text-slate-900 leading-snug">
                  {member.full_name}
                </h3>
                <div className="text-[11px] text-slate-500 flex items-center gap-1.5 font-mono">
                  <span className="font-bold text-slate-700">Код:</span> {member.student_id}
                </div>
                <div className="text-xs text-slate-600 flex items-start gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-sky-500 shrink-0 mt-0.5" />
                  <span className="leading-tight">
                    {member.university} — {member.major}
                  </span>
                </div>
              </div>

              {/* Contact Info (Masked if not admin) */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Mail className="w-3 h-3 text-slate-400" />
                    <span>И-мэйл:</span>
                  </span>
                  <span className="font-mono text-slate-700">{formatProtectedEmail(member.email)}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-1.5 text-slate-500">
                    <Phone className="w-3 h-3 text-slate-400" />
                    <span>Утас:</span>
                  </span>
                  <span className="font-mono text-slate-700">{formatProtectedPhone(member.phone)}</span>
                </div>
              </div>

              {member.bio && (
                <div className="mt-2.5 p-2 rounded-lg bg-slate-50 text-[11px] text-slate-500 italic leading-snug">
                  &ldquo;{member.bio}&rdquo;
                </div>
              )}

              {/* Action Buttons for Authorized Admins */}
              {canManageMembers && (
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    onClick={() => openEditModal(member)}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                    title="Засах"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {member.status === 'Идэвхтэй' ? (
                    <button
                      onClick={() => handleDeactivate(member.id, member.full_name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Идэвхгүй болгох"
                    >
                      <UserX className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      onClick={() => handleReactivate(member.id, member.full_name)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                      title="Идэвхжүүлэх"
                    >
                      <UserCheck className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    onClick={() => handleDeleteMember(member.id, member.full_name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors ml-1"
                    title="Бүртгэлээс хасах"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Member Modal */}
      {(isAddModalOpen || editingMember) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingMember ? 'Гишүүний мэдээлэл засах' : 'Шинэ гишүүн бүртгэх'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingMember(null);
                }}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMember} className="p-6 overflow-y-auto space-y-3.5 text-xs">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Овог нэр <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formFullName}
                    onChange={(e) => setFormFullName(e.target.value)}
                    placeholder="Батбаатар Тэмүүлэн"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Оюутны код <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formStudentId}
                    onChange={(e) => setFormStudentId(e.target.value)}
                    placeholder="B221090012"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Их/Дээд сургууль <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formUniversity}
                    onChange={(e) => setFormUniversity(e.target.value)}
                    placeholder="МУИС, ШУТИС, СЭЗИС г.м"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Мэргэжил ба курс <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formMajor}
                    onChange={(e) => setFormMajor(e.target.value)}
                    placeholder="Хэрэглээний шинжлэх ухаан, 3-р курс"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Албан тушаал / Үүрэг</label>
                  <select
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value as MemberRole)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    {ALL_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Төлөв</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as MemberStatus)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                  >
                    <option value="Идэвхтэй">Идэвхтэй</option>
                    <option value="Идэвхгүй">Идэвхгүй / Чөлөөлөгдсөн</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Цахим шуудан <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="name@unicefhub.mn"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Утас <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="9911-XXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Нэмэлт мэдээлэл / Тайлбар</label>
                <textarea
                  value={formBio}
                  onChange={(e) => setFormBio(e.target.value)}
                  rows={2}
                  placeholder="Сонирхол, хариуцсан чиглэл г.м..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingMember(null);
                  }}
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
    </div>
  );
};
