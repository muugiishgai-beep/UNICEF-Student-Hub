import React, { useState, useEffect } from 'react';
import { Database, Copy, Check, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck, Server } from 'lucide-react';
import { dbService, SUPABASE_URL } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface DatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DatabaseModal: React.FC<DatabaseModalProps> = ({ isOpen, onClose, onShowToast }) => {
  const { isDemoMode, toggleDemoMode } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    isConnected: boolean;
    hasTables: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen) {
      checkStatus();
    }
  }, [isOpen]);

  const checkStatus = async () => {
    setIsChecking(true);
    const status = await dbService.checkDatabaseHealth();
    setHealthStatus(status);
    setIsChecking(false);
  };

  const sqlCode = `-- ================================================================
-- UNICEF ОЮУТНЫ ХОЛБОО (UNICEF STUDENT HUB)
-- PostgreSQL + Supabase Database Schema with Row Level Security (RLS)
-- ================================================================

-- 1. PROFILES (Хэрэглэгчийн бүртгэл ба систем дэх үүрэг)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text not null,
  full_name text not null,
  role text not null default 'Гишүүн',
  member_id uuid,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. MEMBERS (Клубийн албан ёсны гишүүд)
create table if not exists public.members (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  student_id text not null,
  university text not null,
  major text not null,
  role text not null default 'Гишүүн',
  status text not null default 'Идэвхтэй',
  joined_date date not null default current_date,
  email text not null,
  phone text not null,
  bio text,
  avatar_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. MEMBERSHIP REQUESTS (Элсэх хүсэлтүүд)
create table if not exists public.membership_requests (
  id uuid default gen_random_uuid() primary key,
  full_name text not null,
  student_id text not null,
  university text not null,
  major text not null,
  email text not null,
  phone text not null,
  reason text not null,
  skills_interests text not null,
  status text not null default 'Хүлээгдэж буй',
  submitted_at timestamp with time zone default timezone('utc'::text, now()) not null,
  reviewed_by text,
  review_notes text,
  reviewed_at timestamp with time zone
);

-- 4. ATTENDANCE (Ирцийн бүртгэл)
create table if not exists public.attendance (
  id uuid default gen_random_uuid() primary key,
  event_id uuid,
  event_title text not null,
  date date not null default current_date,
  member_id uuid references public.members(id) on delete cascade not null,
  member_name text not null,
  status text not null default 'Ирсэн',
  note text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. PARTICIPATION (Оролцоо ба сайн дурын ажлын бүртгэл)
create table if not exists public.participation (
  id uuid default gen_random_uuid() primary key,
  member_id uuid references public.members(id) on delete cascade not null,
  member_name text not null,
  event_title text not null,
  date date not null default current_date,
  volunteer_hours numeric not null default 0,
  assigned_task text,
  task_status text default 'Хийгдэж буй',
  achievement text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PLANS (Сар ба жилийн төлөвлөгөө)
create table if not exists public.plans (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null default 'Сар',
  target_period text not null,
  responsible_person text not null,
  responsible_member_id uuid references public.members(id) on delete set null,
  deadline date not null,
  status text not null default 'Төлөвлөсөн',
  progress integer not null default 0,
  description text,
  budget numeric default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. EVENTS (Арга хэмжээ, уулзалтууд)
create table if not exists public.events (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  type text not null default 'Уулзалт',
  date date not null,
  time text not null default '14:00',
  location text not null,
  organizer text not null,
  description text not null,
  is_registration_open boolean not null default true,
  max_participants integer,
  registered_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. ANNOUNCEMENTS (Зарлалын самбар)
create table if not exists public.announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  author text not null,
  is_pinned boolean not null default false,
  category text not null default 'Мэдэгдэл',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS Идэвхжүүлэх
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.membership_requests enable row level security;
alter table public.attendance enable row level security;
alter table public.participation enable row level security;
alter table public.plans enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;

-- Бодлогууд (Policies)
create policy "Нийт хэрэглэгч хүсэлт илгээх боломжтой" on public.membership_requests for insert with check (true);
create policy "Нийтээр арга хэмжээг харах" on public.events for select using (true);
create policy "Нийтээр зарлалыг харах" on public.announcements for select using (true);

create policy "Нэвтэрсэн хэрэглэгч гишүүдийг удирдах" on public.members for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч хүсэлтүүдийг удирдах" on public.membership_requests for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч ирц удирдах" on public.attendance for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч оролцоо удирдах" on public.participation for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч төлөвлөгөө удирдах" on public.plans for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч арга хэмжээ удирдах" on public.events for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч зарлал удирдах" on public.announcements for all using (auth.role() = 'authenticated');
`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCode);
    setCopied(true);
    onShowToast('SQL код амжилттай санах ойд хуулагдлаа!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  const handleCleanDemoData = async () => {
    if (confirm('Та бүх хийсвэр болон туршилтын хүмүүсийн өгөгдлийг цэвэрлэхдээ итгэлтэй байна уу? (Бодит администратор болон жинхэнэ гишүүдийн бүртгэл хэвээр үлдэнэ)')) {
      const res = await dbService.cleanDemoRecordsFromSupabase();
      onShowToast(res.message, 'success');
      setTimeout(() => window.location.reload(), 600);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-sky-50 to-blue-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center shadow-md shadow-sky-500/20">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">Өгөгдлийн сангийн тохиргоо (Supabase)</h3>
              <p className="text-xs text-slate-500">PostgreSQL + Row Level Security (RLS) холболт</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 text-sm text-slate-600">
          {/* Connection status card */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800 flex items-center gap-2">
                <Server className="w-4 h-4 text-sky-600" /> Холболтын төлөв:
              </span>
              <button
                onClick={checkStatus}
                disabled={isChecking}
                className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-700 font-semibold px-2 py-1 rounded bg-sky-50 hover:bg-sky-100 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
                Шалгах
              </button>
            </div>

            <div className="text-xs font-mono bg-white p-2.5 rounded-lg border border-slate-200 break-all">
              <div className="text-slate-400 font-sans mb-1">SUPABASE URL:</div>
              <div className="text-slate-700 font-semibold">{SUPABASE_URL}</div>
            </div>

            {healthStatus ? (
              <div
                className={`p-3 rounded-lg flex items-start gap-2.5 text-xs ${
                  healthStatus.hasTables
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : 'bg-amber-50 text-amber-900 border border-amber-200'
                }`}
              >
                {healthStatus.hasTables ? (
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-semibold mb-0.5">
                    {healthStatus.hasTables
                      ? 'Бодит Supabase хүснэгтүүд идэвхтэй байна'
                      : 'Supabase хүснэгт үүсгээгүй байна (Туршилтын өгөгдөл идэвхтэй)'}
                  </p>
                  <p>{healthStatus.message}</p>
                </div>
              </div>
            ) : null}

            {/* Mode switch */}
            <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
              <div>
                <span className="text-xs font-medium text-slate-700">Туршилтын горим (Demo Mode):</span>
                <p className="text-[11px] text-slate-400">
                  {isDemoMode
                    ? 'Жишээ туршилтын өгөгдлийг ашиглаж байна.'
                    : 'Бодит Supabase руу хүсэлт илгээж байна.'}
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDemoMode}
                  onChange={(e) => toggleDemoMode(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-sky-500"></div>
              </label>
            </div>
          </div>

          {/* Quick setup steps */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
              <span>Хэрхэн тохируулах вэ?</span>
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                rel="noreferrer"
                className="text-xs font-normal text-sky-600 hover:underline inline-flex items-center gap-1"
              >
                Supabase Dashboard нээх <ExternalLink className="w-3 h-3" />
              </a>
            </h4>
            <ol className="list-decimal list-inside text-xs space-y-1 text-slate-600 pl-1">
              <li>Доорх товчлуурыг дарж SQL скриптийг хуулж авна.</li>
              <li>Өөрийн Supabase төслийн <b className="text-slate-800">SQL Editor</b> хэсэгт орно.</li>
              <li>Шинэ query үүсгэж (New query), хуулсан кодоо буулган <b className="text-slate-800">Run</b> товчийг дарна.</li>
              <li>Хүснэгтүүд үүсэж, Row Level Security (RLS) аюулгүй байдал автоматаар тохируулагдана.</li>
            </ol>
          </div>

          {/* SQL Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700">PostgreSQL Schema & RLS Scripts:</span>
              <button
                onClick={copyToClipboard}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-600 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Хуулагдлаа!' : 'SQL Кодыг хуулах'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono max-h-56 overflow-y-auto leading-relaxed border border-slate-800">
              {sqlCode}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
          <button
            onClick={handleCleanDemoData}
            className="text-xs text-rose-600 hover:text-rose-700 font-medium hover:underline flex items-center gap-1.5"
          >
            Хийсвэр/туршилтын өгөгдлийг цэвэрлэх
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
          >
            Хаах
          </button>
        </div>
      </div>
    </div>
  );
};
