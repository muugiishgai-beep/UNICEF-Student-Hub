import React, { useState, useEffect } from 'react';
import {
  Database,
  Copy,
  Check,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Server,
  Globe,
  Key,
  Terminal,
  FileCode,
  Layers,
  Lock,
  Trash2,
} from 'lucide-react';
import { dbService, SUPABASE_URL } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

interface DatabaseViewProps {
  onShowToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const DatabaseView: React.FC<DatabaseViewProps> = ({ onShowToast }) => {
  const { isDemoMode, toggleDemoMode } = useAuth();
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{
    isConnected: boolean;
    hasTables: boolean;
    message: string;
  } | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);
  const [inspectionData, setInspectionData] = useState<{
    demoMembersCount: number;
    realMembersCount: number;
    demoAttendanceCount: number;
    realAttendanceCount: number;
  } | null>(null);

  useEffect(() => {
    checkHealth();
    runInspection();
  }, []);

  const runInspection = async () => {
    const data = await dbService.inspectDatabaseRecords();
    setInspectionData(data);
  };

  const checkHealth = async () => {
    setIsChecking(true);
    const status = await dbService.checkDatabaseHealth();
    setHealthStatus(status);
    setIsChecking(false);
  };

  const handleCleanDemoData = async () => {
    if (confirm('Та бүх хийсвэр, туршилтын хүмүүсийн өгөгдлийг цэвэрлэхдээ итгэлтэй байна уу? (Бодит хэрэглэгч болон администраторын бүртгэл хэвээр үлдэнэ)')) {
      setIsCleaning(true);
      const res = await dbService.cleanDemoRecordsFromSupabase();
      setIsCleaning(false);
      onShowToast(res.message, 'success');
      await runInspection();
      setTimeout(() => window.location.reload(), 800);
    }
  };

  const sqlScript = `-- ================================================================
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

-- ROW LEVEL SECURITY (RLS)
alter table public.profiles enable row level security;
alter table public.members enable row level security;
alter table public.membership_requests enable row level security;
alter table public.attendance enable row level security;
alter table public.participation enable row level security;
alter table public.plans enable row level security;
alter table public.events enable row level security;
alter table public.announcements enable row level security;

-- Policies
create policy "Нийт хэрэглэгч хүсэлт илгээх боломжтой" on public.membership_requests for insert with check (true);
create policy "Нийтээр арга хэмжээг харах" on public.events for select using (true);
create policy "Нийтээр зарлалыг харах" on public.announcements for select using (true);

create policy "Нэвтэрсэн хэрэглэгч гишүүдийг удирдах" on public.members for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч хүсэлт шалгах" on public.membership_requests for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч ирц удирдах" on public.attendance for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч оролцоо удирдах" on public.participation for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч төлөвлөгөө удирдах" on public.plans for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч арга хэмжээ удирдах" on public.events for all using (auth.role() = 'authenticated');
create policy "Нэвтэрсэн хэрэглэгч зарлал удирдах" on public.announcements for all using (auth.role() = 'authenticated');
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(sqlScript);
    setCopied(true);
    onShowToast('SQL скрипт амжилттай хуулагдлаа!', 'success');
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-500" />
            <span>Өгөгдлийн сан ба Систем нийтлэлт</span>
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Supabase PostgreSQL холболт, Row Level Security (RLS) аюулгүй байдал болон хэрэглээний заавар
          </p>
        </div>

        <button
          onClick={checkHealth}
          disabled={isChecking}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isChecking ? 'animate-spin' : ''}`} />
          <span>Холболт шалгах</span>
        </button>
      </div>

      {/* Connection & Configuration Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Supabase status card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Server className="w-4 h-4 text-sky-500" />
              <span>Supabase Холболт</span>
            </span>
            <span
              className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                healthStatus?.hasTables
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}
            >
              {healthStatus?.hasTables ? 'Бүрэн холбогдсон' : 'Хүснэгт үүсгээгүй'}
            </span>
          </div>

          <div className="text-xs font-mono bg-slate-50 p-3 rounded-xl border border-slate-200 break-all space-y-1">
            <div className="text-slate-400 font-sans text-[11px]">Төслийн хаяг (URL):</div>
            <div className="text-slate-800 font-semibold">{SUPABASE_URL}</div>
          </div>

          {healthStatus && (
            <p className="text-xs text-slate-600 bg-sky-50/70 p-3 rounded-xl border border-sky-100">
              {healthStatus.message}
            </p>
          )}

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-700">Туршилтын горим (Demo Mode):</span>
            <button
              onClick={() => toggleDemoMode(!isDemoMode)}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors ${
                isDemoMode
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-500 text-white'
              }`}
            >
              {isDemoMode ? 'Туршилт (Идэвхтэй)' : 'Бодит Supabase'}
            </button>
          </div>
        </div>

        {/* Public URLs & Deployment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-emerald-500" />
              <span>Нийтлэх ба Нээлттэй хаяг (Public URL)</span>
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Идэвхтэй
            </span>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed">
            Энэхүү систем нь үүлэн дэд бүтцэд шууд ажиллаж байгаа бөгөөд бусад хүмүүс дараах хаягаар нээж үзэх, гишүүнээр элсэх хүсэлтээ илгээх боломжтой:
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono break-all text-sky-700 font-semibold">
            https://ais-dev-kipr7ewuk4sx76tfqtjaii-982174287152.asia-east1.run.app
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-1">
            <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Гишүүдийн хувийн мэдээлэл, ирцийн засах эрх зөвхөн нэвтэрсэн админд нээлттэй.</span>
          </div>
        </div>
      </div>

      {/* Demo Records Cleanup & Inspection Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Өгөгдлийн сангийн цэвэрлэгээ (Хийсвэр өгөгдлийг арилгах)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Хийсвэр болон бодит хэрэглэгчдийг ялгаж шалгах, шаардлагагүй туршилтын өгөгдлийг найдвартай устгах
            </p>
          </div>

          <button
            onClick={handleCleanDemoData}
            disabled={isCleaning}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-500/20 transition-all disabled:opacity-50 self-start sm:self-auto shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isCleaning ? 'Цэвэрлэж байна...' : 'Хийсвэр/Туршилтын өгөгдлийг цэвэрлэх'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Гишүүдийн бүртгэл:</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Бодит гишүүд:</span>
              <span className="font-black text-emerald-600 font-mono">{inspectionData?.realMembersCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Хийсвэр/туршилтын гишүүд:</span>
              <span className="font-bold text-amber-600 font-mono">{inspectionData?.demoMembersCount ?? 0}</span>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase">Ирцийн бүртгэл:</span>
            <div className="flex items-center justify-between">
              <span className="text-slate-700">Бодит ирцийн бичилт:</span>
              <span className="font-black text-emerald-600 font-mono">{inspectionData?.realAttendanceCount ?? 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Хийсвэр ирцийн бичилт:</span>
              <span className="font-bold text-amber-600 font-mono">{inspectionData?.demoAttendanceCount ?? 0}</span>
            </div>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 italic">
          * Анхааруулга: Энэхүү цэвэрлэгээ нь таны бодит администратор эрх болон шинээр оруулсан бодит гишүүдийн мэдээллийг хэзээ ч устгахгүй.
        </p>
      </div>

      {/* SQL Script Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-500" />
              <span>Supabase PostgreSQL Хүснэгт үүсгэх SQL код</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Энэхүү кодыг Supabase төслийн SQL Editor-т буулган &ldquo;Run&rdquo; хийснээр бүх хүснэгт ба RLS бодлого үүснэ.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold shadow-md shadow-sky-500/20 transition-all self-start sm:self-auto"
          >
            {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Хуулагдлаа!' : 'SQL скриптийг хуулах'}</span>
          </button>
        </div>

        <pre className="p-4 bg-slate-900 text-slate-200 rounded-xl text-xs font-mono max-h-96 overflow-y-auto leading-relaxed border border-slate-800">
          {sqlScript}
        </pre>
      </div>

      {/* Security Architecture Info */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-md space-y-4 text-xs">
        <h4 className="font-bold text-sm text-sky-400 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4" />
          <span>Аюулгүй байдал & Эрх хуваарилалт (RBAC & RLS)</span>
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 leading-relaxed">
          <div className="space-y-1">
            <b className="text-white">1. Сервер түвшний Row Level Security:</b>
            <p>
              Хэрэглэгчийн эрх зөвхөн вэб дээр бус PostgreSQL өгөгдлийн сангийн түвшинд RLS бодлогоор баталгаажсан.
            </p>
          </div>
          <div className="space-y-1">
            <b className="text-white">2. Secret түлхүүрийн нууцлал:</b>
            <p>
              Frontend талд хэзээ ч Supabase service-role түлхүүрийг ашиглахгүй, зөвхөн аюулгүй anon түлхүүрийг хэрэглэнэ.
            </p>
          </div>
          <div className="space-y-1">
            <b className="text-white">3. Зөвшөөрлийн шатлал:</b>
            <p>
              Элсэх хүсэлт гаргасан хүн шууд идэвхтэй гишүүн болохгүй, админ зөвшөөрсний дараа энгийн &ldquo;Гишүүн&rdquo; эрхтэй болно.
            </p>
          </div>
          <div className="space-y-1">
            <b className="text-white">4. Хувийн мэдээллийн хамгаалалт:</b>
            <p>
              Оюутны утас, хувийн и-мэйлийг бусад хэрэглэгчдэд нууцалж масклан харуулна.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
