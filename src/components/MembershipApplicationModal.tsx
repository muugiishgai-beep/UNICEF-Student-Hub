import React, { useState } from 'react';
import { Send, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { dbService } from '../lib/supabase';

interface MembershipApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onSuccessSubmitted?: () => void;
}

export const MembershipApplicationModal: React.FC<MembershipApplicationModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
  onSuccessSubmitted,
}) => {
  const [fullName, setFullName] = useState('');
  const [studentId, setStudentId] = useState('');
  const [university, setUniversity] = useState('Монгол Улсын Их Сургууль');
  const [major, setMajor] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [skills, setSkills] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName || !studentId || !university || !major || !email || !phone || !reason || !skills) {
      setErrorMessage('Бүх шаардлагатай талбарыг бүрэн бөглөнө үү.');
      return;
    }

    setLoading(true);
    try {
      await dbService.submitRequest({
        full_name: fullName.trim(),
        student_id: studentId.trim(),
        university: university.trim(),
        major: major.trim(),
        email: email.trim(),
        phone: phone.trim(),
        reason: reason.trim(),
        skills_interests: skills.trim(),
      });

      setLoading(false);
      setSubmitted(true);
      onShowToast('Таны хүсэлт амжилттай илгээгдлээ!', 'success');
      if (onSuccessSubmitted) onSuccessSubmitted();
    } catch (err: any) {
      setLoading(false);
      setErrorMessage(err.message || 'Хүсэлт илгээхэд алдаа гарлаа.');
    }
  };

  const handleResetAndClose = () => {
    setSubmitted(false);
    setFullName('');
    setStudentId('');
    setMajor('');
    setEmail('');
    setPhone('');
    setReason('');
    setSkills('');
    setErrorMessage('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Клубт элсэх хүсэлт гаргах</h3>
              <p className="text-xs text-slate-500">UNICEF-ийн дэмжлэгтэй оюутны клубт нэгдэх анкет</p>
            </div>
          </div>
          <button
            onClick={handleResetAndClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto">
          {submitted ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-lg font-bold text-slate-900">Хүсэлт амжилттай бүртгэгдлээ!</h4>
              <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                Таны мэдээллийг клубийн удирдах зөвлөл хянаж үзэх бөгөөд зөвшөөрөгдсөн тохиолдолд таны бүртгүүлсэн цахим шуудан болон утсаар мэдэгдэх болно.
              </p>
              <div className="pt-4">
                <button
                  onClick={handleResetAndClose}
                  className="px-6 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-500/20 transition-all"
                >
                  Ойлголоо, цонхыг хаах
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {errorMessage && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Бүтэн нэр (Овог нэр) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Жишээ: Цэцэгмаагийн Бат"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Оюутны код <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={studentId}
                    onChange={(e) => setStudentId(e.target.value)}
                    placeholder="Жишээ: B241090012"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
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
                    value={university}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="МУИС, ШУТИС, СЭЗИС г.м"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Мэргэжил ба курс <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={major}
                    onChange={(e) => setMajor(e.target.value)}
                    placeholder="Жишээ: Нийгмийн ажилтан, 2-р курс"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Цахим шуудан (Email) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="yourname@gmail.com"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Утасны дугаар <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="9911-XXXX"
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Клубт элсэх шалтгаан, зорилго <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  rows={3}
                  placeholder="Яагаад энэхүү клубт элсэх хүсэлтэй байгаагаа тайлбарлана уу..."
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Таны давуу тал, сонирхол ба ур чадвар <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  rows={2}
                  placeholder="Жишээ: Арга хэмжээ зохион байгуулах, гэрэл зураг авах, инфографик бэлтгэх, илтгэх чадвар г.м"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={handleResetAndClose}
                  className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-semibold"
                >
                  Болих
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-sky-500/20 transition-all disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  {loading ? 'Илгээж байна...' : 'Хүсэлт илгээх'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
