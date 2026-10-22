import React, { useState } from 'react';
import { LogIn, UserPlus, Shield, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MemberRole } from '../types';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { signIn, signUp, quickLoginAs, profile } = useAuth();
  const [tab, setTab] = useState<'signin' | 'signup' | 'roles'>('signin');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!email || !password) {
      setErrorMessage('Цахим шуудан болон нууц үгээ оруулна уу.');
      return;
    }
    setLoading(true);
    const result = await signIn(email, password);
    setLoading(false);
    if (result.success) {
      onShowToast('Амжилттай нэвтэрлээ!', 'success');
      onClose();
    } else {
      setErrorMessage(result.error || 'Нэвтрэхэд алдаа гарлаа.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    if (!fullName || !email || !password) {
      setErrorMessage('Бүх талбарыг бөглөнө үү.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage('Нууц үг хамгийн багадаа 6 оронтой байх ёстой.');
      return;
    }
    setLoading(true);
    const result = await signUp(email, password, fullName);
    setLoading(false);
    if (result.success) {
      onShowToast('Бүртгэл амжилттай үүсгэгдлээ!', 'success');
      onClose();
    } else {
      setErrorMessage(result.error || 'Бүртгэл үүсгэхэд алдаа гарлаа.');
    }
  };

  const handleSwitchAdminRole = (role: MemberRole) => {
    const adminEmail = profile?.email || 'muugiishgai@gmail.com';
    const adminName = profile?.full_name || 'Администратор';
    quickLoginAs(role, adminName, adminEmail);
    onShowToast(`Таны удирдлагын эрх "${role}" болж солигдлоо.`, 'success');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Системд нэвтрэх</h3>
                <p className="text-xs text-slate-500">UNICEF Оюутны Холбооны удирдлага</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
            >
              ✕
            </button>
          </div>

          {/* Current profile info */}
          {profile && (
            <div className="mt-4 p-2.5 bg-white/90 rounded-xl border border-sky-100 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">Нэвтэрсэн хаяг:</span>
                <span className="font-bold text-slate-900">{profile.email}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 font-bold text-[11px]">
                {profile.role}
              </span>
            </div>
          )}

          {/* Navigation tabs */}
          <div className="flex items-center gap-1 mt-4 p-1 bg-slate-200/60 rounded-xl text-xs font-semibold">
            <button
              onClick={() => { setTab('signin'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                tab === 'signin' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Нэвтрэх
            </button>
            <button
              onClick={() => { setTab('signup'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                tab === 'signup' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Бүртгүүлэх
            </button>
            <button
              onClick={() => { setTab('roles'); setErrorMessage(''); }}
              className={`flex-1 py-1.5 rounded-lg transition-all ${
                tab === 'roles' ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Эрх солих
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {errorMessage && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* TAB 1: Real Email/Password Sign In */}
          {tab === 'signin' && (
            <form onSubmit={handleSignIn} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Цахим шуудан (Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="таны-хаяг@жишээ.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Нууц үг (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="******"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                {loading ? 'Шалгаж байна...' : 'Нэвтрэх'}
              </button>
            </form>
          )}

          {/* TAB 2: Real Sign Up */}
          {tab === 'signup' && (
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Бүтэн нэр</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Таны нэр"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Цахим шуудан (Email)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Нууц үг (Password)</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Дор хаяж 6 тэмдэгт"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                {loading ? 'Бүртгэж байна...' : 'Бүртгүүлэх'}
              </button>
            </form>
          )}

          {/* TAB 3: Real Account Role Switcher */}
          {tab === 'roles' && (
            <div className="space-y-2.5 text-xs">
              <p className="text-slate-500 text-[11px] mb-2 leading-relaxed">
                Та өөрийн администратор эрхээрээ системийн бусад дүрүүдийн харагдах байдлыг шалгах боломжтой:
              </p>

              <button
                onClick={() => handleSwitchAdminRole('Тэргүүн')}
                className="w-full p-2.5 rounded-xl border border-sky-200 bg-sky-50/60 hover:bg-sky-100 flex items-center justify-between text-left transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900">Тэргүүн (Бүрэн админ эрх)</div>
                  <div className="text-[11px] text-slate-500">Гишүүн нэмэх, засах, устгах, хүсэлт батлах</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-200 text-sky-800">Админ</span>
              </button>

              <button
                onClick={() => handleSwitchAdminRole('Дэд тэргүүн')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900">Дэд тэргүүн</div>
                  <div className="text-[11px] text-slate-500">Админ удирдлага, ирц ба хүсэлт шалгах</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">Админ</span>
              </button>

              <button
                onClick={() => handleSwitchAdminRole('Санхүүгийн дарга')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900">Санхүүгийн дарга</div>
                  <div className="text-[11px] text-slate-500">Төсөв, төлөвлөгөө, ирц хөтлөх эрхтэй</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">Санхүү</span>
              </button>

              <button
                onClick={() => handleSwitchAdminRole('Нарийн бичгийн дарга')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900">Нарийн бичгийн дарга</div>
                  <div className="text-[11px] text-slate-500">Ирц, хүсэлт шалгах, бүртгэл хөтлөх</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">Админ</span>
              </button>

              <button
                onClick={() => handleSwitchAdminRole('Гишүүн')}
                className="w-full p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 flex items-center justify-between text-left transition-all"
              >
                <div>
                  <div className="font-bold text-slate-900">Энгийн гишүүн</div>
                  <div className="text-[11px] text-slate-500">Зөвхөн харах эрх (нууц холбоо барих мэдээлэл масклагдана)</div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">Гишүүн</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
