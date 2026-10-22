import { createClient } from '@supabase/supabase-js';
import {
  Member,
  MembershipRequest,
  AttendanceRecord,
  ParticipationRecord,
  PlanItem,
  EventItem,
  Announcement,
  AttendanceStats,
} from '../types';
import {
  INITIAL_DEMO_MEMBERS,
  INITIAL_DEMO_REQUESTS,
  INITIAL_DEMO_EVENTS,
  INITIAL_DEMO_ATTENDANCE,
  INITIAL_DEMO_PARTICIPATION,
  INITIAL_DEMO_PLANS,
  INITIAL_DEMO_ANNOUNCEMENTS,
} from './mockData';

// Fallback credentials from user's uploaded .env_d337de4e
const FALLBACK_SUPABASE_URL = 'https://uzmxglrczpgdxjpkurbb.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV6bXhnbHJjenBnZHhqcGt1cmJiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTI2NjUzMzQsImV4cCI6MjEwODI0MTMzNH0.RTNA8KJIMjoFO3Gh4e7tgFY1HlIXFk6sOaPiNblmqio';

export const SUPABASE_URL =
  import.meta.env.VITE_SUPABASE_URL || FALLBACK_SUPABASE_URL;
export const SUPABASE_ANON_KEY =
  import.meta.env.VITE_SUPABASE_ANON_KEY || FALLBACK_SUPABASE_ANON_KEY;

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Calculate attendance statistics according to UNICEF Student Hub specification:
// "Exclude Чөлөөтэй from the attendance percentage denominator"
export function calculateAttendanceStats(records: AttendanceRecord[]): AttendanceStats {
  const present = records.filter((r) => r.status === 'Ирсэн').length;
  const late = records.filter((r) => r.status === 'Хоцорсон').length;
  const absent = records.filter((r) => r.status === 'Тасалсан').length;
  const excused = records.filter((r) => r.status === 'Чөлөөтэй').length;
  const total = records.length;

  // Crucial formula: Exclude Чөлөөтэй from denominator
  const denominator = present + late + absent;
  const percentage =
    denominator > 0 ? Math.round(((present + late) / denominator) * 100) : 100;

  return {
    present,
    late,
    absent,
    excused,
    total,
    denominator,
    percentage,
  };
}

// Storage keys for local clean state (v2 - empty of demo people)
const STORAGE_KEYS = {
  MEMBERS: 'unicef_hub_members_real_v2',
  REQUESTS: 'unicef_hub_requests_real_v2',
  EVENTS: 'unicef_hub_events_real_v2',
  ATTENDANCE: 'unicef_hub_attendance_real_v2',
  PARTICIPATION: 'unicef_hub_participation_real_v2',
  PLANS: 'unicef_hub_plans_real_v2',
  ANNOUNCEMENTS: 'unicef_hub_announcements_real_v2',
  DEMO_MODE: 'unicef_hub_force_demo_mode',
};

// Purge any old v1 mock data keys from localStorage on script load
try {
  const oldKeys = [
    'unicef_hub_members_v1',
    'unicef_hub_requests_v1',
    'unicef_hub_events_v1',
    'unicef_hub_attendance_v1',
    'unicef_hub_participation_v1',
    'unicef_hub_plans_v1',
    'unicef_hub_announcements_v1',
  ];
  oldKeys.forEach((k) => localStorage.removeItem(k));
} catch {
  // ignore
}

function getLocalData<T>(key: string, defaultData: T): T {
  try {
    const item = localStorage.getItem(key);
    if (!item) return defaultData;
    return JSON.parse(item) as T;
  } catch {
    return defaultData;
  }
}

function setLocalData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
}

class DataService {
  private hasLiveTables: boolean | null = null;
  private forceDemoMode: boolean = false;

  constructor() {
    this.forceDemoMode = localStorage.getItem(STORAGE_KEYS.DEMO_MODE) === 'true';
  }

  isDemoMode(): boolean {
    return this.forceDemoMode || this.hasLiveTables === false;
  }

  setDemoMode(enabled: boolean) {
    this.forceDemoMode = enabled;
    localStorage.setItem(STORAGE_KEYS.DEMO_MODE, enabled ? 'true' : 'false');
  }

  async checkDatabaseHealth(): Promise<{ isConnected: boolean; hasTables: boolean; message: string }> {
    try {
      const { data, error } = await supabase.from('members').select('id').limit(1);
      if (error) {
        if (
          error.code === '42P01' ||
          error.code === 'PGRST205' ||
          error.message.includes('relation "public.members" does not exist')
        ) {
          this.hasLiveTables = false;
          return {
            isConnected: true,
            hasTables: false,
            message:
              'Supabase төсөлтэй амжилттай холбогдсон боловч хүснэгтүүд үүсээгүй байна. "Өгөгдлийн сан" хэсэгт байрлах SQL-г Supabase-д ажиллуулна уу.',
          };
        }
        this.hasLiveTables = false;
        return {
          isConnected: false,
          hasTables: false,
          message: error.message || 'Supabase холболтын алдаа',
        };
      }
      this.hasLiveTables = true;
      return {
        isConnected: true,
        hasTables: true,
        message: 'Supabase өгөгдлийн сан бэлэн, бодит горимд ажиллаж байна.',
      };
    } catch {
      this.hasLiveTables = false;
      return {
        isConnected: false,
        hasTables: false,
        message: 'Сүлжээ эсвэл хандалтын алдаа гарлаа.',
      };
    }
  }

  // --- MEMBERS ---
  async getMembers(): Promise<Member[]> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('members')
          .select('*')
          .order('role', { ascending: true })
          .order('full_name', { ascending: true });

        if (!error && Array.isArray(data)) {
          this.hasLiveTables = true;
          // Filter out any leftover fake demo records if they exist in Supabase
          const realMembers = data.filter(
            (m: Member) =>
              !m.id?.startsWith('demo-') &&
              !m.email?.endsWith('@unicefhub.mn') &&
              m.full_name !== 'Батбаатар Тэмүүлэн' &&
              m.full_name !== 'Энхжаргал Ану' &&
              m.full_name !== 'Ганболд Мөнх-Эрдэнэ'
          );
          return realMembers as Member[];
        }
      } catch {
        // fallback
      }
    }
    const local = getLocalData<Member[]>(STORAGE_KEYS.MEMBERS, INITIAL_DEMO_MEMBERS);
    return local.filter(
      (m) =>
        !m.id?.startsWith('demo-') &&
        !m.email?.endsWith('@unicefhub.mn') &&
        m.full_name !== 'Батбаатар Тэмүүлэн'
    );
  }

  async addMember(member: Omit<Member, 'id' | 'created_at'>): Promise<Member> {
    const newId = `mem-${Date.now()}`;
    const newMember: Member = {
      ...member,
      id: newId,
      created_at: new Date().toISOString(),
    };

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('members')
          .insert([member])
          .select()
          .single();

        if (!error && data) {
          return data as Member;
        }
      } catch {
        // fallback to local
      }
    }

    const current = await this.getMembers();
    const updated = [newMember, ...current];
    setLocalData(STORAGE_KEYS.MEMBERS, updated);
    return newMember;
  }

  async updateMember(id: string, updates: Partial<Member>): Promise<Member> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('members')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as Member;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getMembers();
    const index = current.findIndex((m) => m.id === id);
    if (index === -1) throw new Error('Гишүүн олдсонгүй');
    const updatedItem = { ...current[index], ...updates };
    current[index] = updatedItem;
    setLocalData(STORAGE_KEYS.MEMBERS, [...current]);
    return updatedItem;
  }

  async deactivateMember(id: string): Promise<void> {
    await this.updateMember(id, { status: 'Идэвхгүй' });
  }

  async deleteMember(id: string): Promise<void> {
    if (!this.forceDemoMode) {
      try {
        await supabase.from('members').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    const current = await this.getMembers();
    const updated = current.filter((m) => m.id !== id);
    setLocalData(STORAGE_KEYS.MEMBERS, updated);
  }

  // --- MEMBERSHIP REQUESTS ---
  async getRequests(): Promise<MembershipRequest[]> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('membership_requests')
          .select('*')
          .order('submitted_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          // Filter out demo requests
          const realRequests = data.filter(
            (r: MembershipRequest) =>
              !r.id?.startsWith('demo-') &&
              r.full_name !== 'Цэнгэл Наран' &&
              r.full_name !== 'Мөнхжаргал Билгүүн'
          );
          return realRequests as MembershipRequest[];
        }
      } catch {
        // fallback
      }
    }
    const local = getLocalData<MembershipRequest[]>(STORAGE_KEYS.REQUESTS, INITIAL_DEMO_REQUESTS);
    return local.filter(
      (r) =>
        !r.id?.startsWith('demo-') &&
        r.full_name !== 'Цэнгэл Наран' &&
        r.full_name !== 'Мөнхжаргал Билгүүн'
    );
  }

  async submitRequest(
    request: Omit<MembershipRequest, 'id' | 'status' | 'submitted_at'>
  ): Promise<MembershipRequest> {
    const newRequest: MembershipRequest = {
      ...request,
      id: `req-${Date.now()}`,
      status: 'Хүлээгдэж буй',
      submitted_at: new Date().toISOString(),
    };

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('membership_requests')
          .insert([newRequest])
          .select()
          .single();

        if (!error && data) {
          return data as MembershipRequest;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getRequests();
    const updated = [newRequest, ...current];
    setLocalData(STORAGE_KEYS.REQUESTS, updated);
    return newRequest;
  }

  async updateRequestStatus(
    id: string,
    status: 'Зөвшөөрсөн' | 'Татгалзсан',
    reviewerName: string,
    reviewNotes?: string
  ): Promise<MembershipRequest> {
    const updates = {
      status,
      reviewed_by: reviewerName,
      review_notes: reviewNotes || '',
      reviewed_at: new Date().toISOString(),
    };

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('membership_requests')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          if (status === 'Зөвшөөрсөн') {
            await this.addMember({
              full_name: data.full_name,
              student_id: data.student_id,
              university: data.university,
              major: data.major,
              role: 'Гишүүн',
              status: 'Идэвхтэй',
              joined_date: new Date().toISOString().split('T')[0],
              email: data.email,
              phone: data.phone,
              bio: data.reason,
            });
          }
          return data as MembershipRequest;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getRequests();
    const index = current.findIndex((r) => r.id === id);
    if (index === -1) throw new Error('Хүсэлт олдсонгүй');

    const updatedItem = { ...current[index], ...updates };
    current[index] = updatedItem;
    setLocalData(STORAGE_KEYS.REQUESTS, [...current]);

    if (status === 'Зөвшөөрсөн') {
      await this.addMember({
        full_name: updatedItem.full_name,
        student_id: updatedItem.student_id,
        university: updatedItem.university,
        major: updatedItem.major,
        role: 'Гишүүн',
        status: 'Идэвхтэй',
        joined_date: new Date().toISOString().split('T')[0],
        email: updatedItem.email,
        phone: updatedItem.phone,
        bio: updatedItem.reason,
      });
    }

    return updatedItem;
  }

  // --- ATTENDANCE ---
  async getAttendance(): Promise<AttendanceRecord[]> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .select('*')
          .order('date', { ascending: false });

        if (!error && Array.isArray(data)) {
          const realAttendance = data.filter(
            (a: AttendanceRecord) =>
              !a.id?.startsWith('att-') &&
              !a.member_id?.startsWith('demo-') &&
              a.member_name !== 'Батбаатар Тэмүүлэн'
          );
          return realAttendance as AttendanceRecord[];
        }
      } catch {
        // fallback
      }
    }
    const local = getLocalData<AttendanceRecord[]>(STORAGE_KEYS.ATTENDANCE, INITIAL_DEMO_ATTENDANCE);
    return local.filter(
      (a) =>
        !a.id?.startsWith('att-') &&
        !a.member_id?.startsWith('demo-') &&
        a.member_name !== 'Батбаатар Тэмүүлэн'
    );
  }

  async saveAttendanceBatch(
    records: Omit<AttendanceRecord, 'id' | 'created_at'>[]
  ): Promise<AttendanceRecord[]> {
    const timestamp = new Date().toISOString();
    const newRecords: AttendanceRecord[] = records.map((r, i) => ({
      ...r,
      id: `rec-att-${Date.now()}-${i}`,
      created_at: timestamp,
    }));

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('attendance')
          .insert(records)
          .select();

        if (!error && data) {
          return data as AttendanceRecord[];
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getAttendance();
    const updated = [...newRecords, ...current];
    setLocalData(STORAGE_KEYS.ATTENDANCE, updated);
    return newRecords;
  }

  async deleteAttendance(id: string): Promise<void> {
    if (!this.forceDemoMode) {
      try {
        await supabase.from('attendance').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    const current = await this.getAttendance();
    const updated = current.filter((a) => a.id !== id);
    setLocalData(STORAGE_KEYS.ATTENDANCE, updated);
  }

  // --- PARTICIPATION ---
  async getParticipation(): Promise<ParticipationRecord[]> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('participation')
          .select('*')
          .order('date', { ascending: false });

        if (!error && Array.isArray(data)) {
          const realPart = data.filter(
            (p: ParticipationRecord) =>
              !p.id?.startsWith('part-') &&
              !p.member_id?.startsWith('demo-') &&
              p.member_name !== 'Батбаатар Тэмүүлэн'
          );
          return realPart as ParticipationRecord[];
        }
      } catch {
        // fallback
      }
    }
    const local = getLocalData<ParticipationRecord[]>(
      STORAGE_KEYS.PARTICIPATION,
      INITIAL_DEMO_PARTICIPATION
    );
    return local.filter(
      (p) =>
        !p.id?.startsWith('part-') &&
        !p.member_id?.startsWith('demo-') &&
        p.member_name !== 'Батбаатар Тэмүүлэн'
    );
  }

  async addParticipation(
    record: Omit<ParticipationRecord, 'id' | 'created_at'>
  ): Promise<ParticipationRecord> {
    const newRecord: ParticipationRecord = {
      ...record,
      id: `rec-part-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('participation')
          .insert([record])
          .select()
          .single();

        if (!error && data) {
          return data as ParticipationRecord;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getParticipation();
    const updated = [newRecord, ...current];
    setLocalData(STORAGE_KEYS.PARTICIPATION, updated);
    return newRecord;
  }

  async deleteParticipation(id: string): Promise<void> {
    if (!this.forceDemoMode) {
      try {
        await supabase.from('participation').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    const current = await this.getParticipation();
    const updated = current.filter((p) => p.id !== id);
    setLocalData(STORAGE_KEYS.PARTICIPATION, updated);
  }

  // --- PLANS ---
  async getPlans(): Promise<PlanItem[]> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .select('*')
          .order('deadline', { ascending: true });

        if (!error && Array.isArray(data)) {
          const realPlans = data.filter(
            (p: PlanItem) =>
              !p.id?.startsWith('plan-') &&
              p.responsible_person !== 'Батбаатар Тэмүүлэн' &&
              p.responsible_person !== 'Энхжаргал Ану'
          );
          return realPlans as PlanItem[];
        }
      } catch {
        // fallback
      }
    }
    const local = getLocalData<PlanItem[]>(STORAGE_KEYS.PLANS, INITIAL_DEMO_PLANS);
    return local.filter(
      (p) =>
        !p.id?.startsWith('plan-') &&
        p.responsible_person !== 'Батбаатар Тэмүүлэн' &&
        p.responsible_person !== 'Энхжаргал Ану'
    );
  }

  async addPlan(plan: Omit<PlanItem, 'id' | 'created_at'>): Promise<PlanItem> {
    const newPlan: PlanItem = {
      ...plan,
      id: `rec-plan-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .insert([plan])
          .select()
          .single();

        if (!error && data) {
          return data as PlanItem;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getPlans();
    const updated = [newPlan, ...current];
    setLocalData(STORAGE_KEYS.PLANS, updated);
    return newPlan;
  }

  async updatePlan(id: string, updates: Partial<PlanItem>): Promise<PlanItem> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('plans')
          .update(updates)
          .eq('id', id)
          .select()
          .single();

        if (!error && data) {
          return data as PlanItem;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getPlans();
    const index = current.findIndex((p) => p.id === id);
    if (index === -1) throw new Error('Төлөвлөгөө олдсонгүй');

    const updated = { ...current[index], ...updates };
    current[index] = updated;
    setLocalData(STORAGE_KEYS.PLANS, [...current]);
    return updated;
  }

  async deletePlan(id: string): Promise<void> {
    if (!this.forceDemoMode) {
      try {
        await supabase.from('plans').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    const current = await this.getPlans();
    const updated = current.filter((p) => p.id !== id);
    setLocalData(STORAGE_KEYS.PLANS, updated);
  }

  // --- EVENTS ---
  async getEvents(): Promise<EventItem[]> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('date', { ascending: true });

        if (!error && Array.isArray(data)) {
          const realEvents = data.filter((e: EventItem) => !e.id?.startsWith('demo-'));
          return realEvents as EventItem[];
        }
      } catch {
        // fallback
      }
    }
    const local = getLocalData<EventItem[]>(STORAGE_KEYS.EVENTS, INITIAL_DEMO_EVENTS);
    return local.filter((e) => !e.id?.startsWith('demo-'));
  }

  async addEvent(event: Omit<EventItem, 'id' | 'created_at'>): Promise<EventItem> {
    const newEvent: EventItem = {
      ...event,
      id: `rec-evt-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('events')
          .insert([event])
          .select()
          .single();

        if (!error && data) {
          return data as EventItem;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getEvents();
    const updated = [newEvent, ...current];
    setLocalData(STORAGE_KEYS.EVENTS, updated);
    return newEvent;
  }

  async deleteEvent(id: string): Promise<void> {
    if (!this.forceDemoMode) {
      try {
        await supabase.from('events').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    const current = await this.getEvents();
    const updated = current.filter((e) => e.id !== id);
    setLocalData(STORAGE_KEYS.EVENTS, updated);
  }

  // --- ANNOUNCEMENTS ---
  async getAnnouncements(): Promise<Announcement[]> {
    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select('*')
          .order('is_pinned', { ascending: false })
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          const realAnn = data.filter((a: Announcement) => !a.id?.startsWith('demo-'));
          return realAnn as Announcement[];
        }
      } catch {
        // fallback
      }
    }
    const local = getLocalData<Announcement[]>(
      STORAGE_KEYS.ANNOUNCEMENTS,
      INITIAL_DEMO_ANNOUNCEMENTS
    );
    return local.filter((a) => !a.id?.startsWith('demo-'));
  }

  async addAnnouncement(
    announcement: Omit<Announcement, 'id' | 'created_at'>
  ): Promise<Announcement> {
    const newAnnouncement: Announcement = {
      ...announcement,
      id: `rec-ann-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    if (!this.forceDemoMode) {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .insert([announcement])
          .select()
          .single();

        if (!error && data) {
          return data as Announcement;
        }
      } catch {
        // fallback
      }
    }

    const current = await this.getAnnouncements();
    const updated = [newAnnouncement, ...current];
    setLocalData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
    return newAnnouncement;
  }

  async deleteAnnouncement(id: string): Promise<void> {
    if (!this.forceDemoMode) {
      try {
        await supabase.from('announcements').delete().eq('id', id);
      } catch {
        // fallback
      }
    }
    const current = await this.getAnnouncements();
    const updated = current.filter((a) => a.id !== id);
    setLocalData(STORAGE_KEYS.ANNOUNCEMENTS, updated);
  }

  // Purge all demo records completely and reset to empty state
  purgeDemoRecords() {
    // Clear local storage
    Object.values(STORAGE_KEYS).forEach((k) => {
      if (k !== STORAGE_KEYS.DEMO_MODE) {
        localStorage.removeItem(k);
      }
    });
    localStorage.removeItem('unicef_active_user');
  }

  // Inspect database records to distinguish real vs demo records
  async inspectDatabaseRecords(): Promise<{
    demoMembersCount: number;
    realMembersCount: number;
    demoAttendanceCount: number;
    realAttendanceCount: number;
  }> {
    try {
      const { data: mems } = await supabase.from('members').select('id, full_name, email');
      const { data: atts } = await supabase.from('attendance').select('id, member_id, member_name');

      let demoM = 0;
      let realM = 0;
      (mems || []).forEach((m: any) => {
        if (
          m.id?.startsWith('demo-') ||
          m.email?.endsWith('@unicefhub.mn') ||
          m.full_name === 'Батбаатар Тэмүүлэн' ||
          m.full_name === 'Энхжаргал Ану'
        ) {
          demoM++;
        } else {
          realM++;
        }
      });

      let demoA = 0;
      let realA = 0;
      (atts || []).forEach((a: any) => {
        if (
          a.id?.startsWith('att-') ||
          a.member_id?.startsWith('demo-') ||
          a.member_name === 'Батбаатар Тэмүүлэн'
        ) {
          demoA++;
        } else {
          realA++;
        }
      });

      return {
        demoMembersCount: demoM,
        realMembersCount: realM,
        demoAttendanceCount: demoA,
        realAttendanceCount: realA,
      };
    } catch {
      return {
        demoMembersCount: 0,
        realMembersCount: 0,
        demoAttendanceCount: 0,
        realAttendanceCount: 0,
      };
    }
  }

  // Delete demo records from database while keeping real accounts completely safe
  async cleanDemoRecordsFromSupabase(): Promise<{ deletedCount: number; message: string }> {
    try {
      // 1. Delete demo attendance
      await supabase
        .from('attendance')
        .delete()
        .or("id.like.demo-%,id.like.att-%,member_name.eq.Батбаатар Тэмүүлэн,member_name.eq.Энхжаргал Ану");

      // 2. Delete demo participation
      await supabase
        .from('participation')
        .delete()
        .or("id.like.demo-%,id.like.part-%,member_name.eq.Батбаатар Тэмүүлэн,member_name.eq.Энхжаргал Ану");

      // 3. Delete demo requests
      await supabase
        .from('membership_requests')
        .delete()
        .or("id.like.demo-%,id.like.req-%,email.like.%@unicefhub.mn,full_name.eq.Цэнгэл Наран");

      // 4. Delete demo members (DO NOT delete real users or muugiishgai@gmail.com)
      const { data, error } = await supabase
        .from('members')
        .delete()
        .or("id.like.demo-%,email.like.%@unicefhub.mn,full_name.eq.Батбаатар Тэмүүлэн,full_name.eq.Энхжаргал Ану,full_name.eq.Ганболд Мөнх-Эрдэнэ,full_name.eq.Алтансүх Солонго,full_name.eq.Доржпүрэв Бат-Ирээдүй,full_name.eq.Оюунчимэг Номин,full_name.eq.Лхагвасүрэн Төгөлдөр,full_name.eq.Чинбат Сарнай");

      this.purgeDemoRecords();

      return {
        deletedCount: Array.isArray(data) ? (data as any[]).length : 0,
        message: 'Бүх хийсвэр/туршилтын хүмүүс болон тэдэнтэй холбоотой өгөгдлийг цэвэрлэлээ.',
      };
    } catch (err: any) {
      this.purgeDemoRecords();
      return {
        deletedCount: 0,
        message: 'Хэсэгчилсэн цэвэрлэгээ хийгдлээ: ' + (err.message || ''),
      };
    }
  }
}

export const dbService = new DataService();
