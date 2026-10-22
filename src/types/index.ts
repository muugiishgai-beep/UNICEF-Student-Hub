export type MemberRole =
  | 'Тэргүүн'
  | 'Дэд тэргүүн'
  | 'Санхүүгийн дарга'
  | 'Нарийн бичгийн дарга'
  | 'Зөвлөх'
  | 'Багш'
  | 'Гишүүн';

export type MemberStatus = 'Идэвхтэй' | 'Идэвхгүй';

export interface Member {
  id: string;
  full_name: string;
  student_id: string;
  university: string;
  major: string;
  role: MemberRole;
  status: MemberStatus;
  joined_date: string;
  email: string;
  phone: string;
  bio?: string;
  avatar_url?: string;
  created_at?: string;
}

export type RequestStatus = 'Хүлээгдэж буй' | 'Зөвшөөрсөн' | 'Татгалзсан';

export interface MembershipRequest {
  id: string;
  full_name: string;
  student_id: string;
  university: string;
  major: string;
  email: string;
  phone: string;
  reason: string;
  skills_interests: string;
  status: RequestStatus;
  submitted_at: string;
  reviewed_by?: string;
  review_notes?: string;
  reviewed_at?: string;
}

export type AttendanceStatus = 'Ирсэн' | 'Тасалсан' | 'Хоцорсон' | 'Чөлөөтэй';

export interface AttendanceRecord {
  id: string;
  event_id?: string;
  event_title: string;
  date: string;
  member_id: string;
  member_name: string;
  status: AttendanceStatus;
  note?: string;
  created_at?: string;
}

export type TaskStatus = 'Хийгдэж буй' | 'Дууссан' | 'Хоцорсон';

export interface ParticipationRecord {
  id: string;
  member_id: string;
  member_name: string;
  event_title: string;
  date: string;
  volunteer_hours: number;
  assigned_task?: string;
  task_status?: TaskStatus;
  achievement?: string;
  created_at?: string;
}

export type PlanType = 'Сар' | 'Жил';
export type PlanStatus = 'Төлөвлөсөн' | 'Явагдаж буй' | 'Дууссан' | 'Цуцлагдсан';

export interface PlanItem {
  id: string;
  title: string;
  type: PlanType;
  target_period: string;
  responsible_person: string;
  responsible_member_id?: string;
  deadline: string;
  status: PlanStatus;
  progress: number; // 0 - 100
  description?: string;
  budget?: number;
  created_at?: string;
}

export type EventType =
  | 'Сургалт'
  | 'Сайн дурын ажил'
  | 'Чуулган'
  | 'Уулзалт'
  | 'Аян'
  | 'Бусад';

export interface EventItem {
  id: string;
  title: string;
  type: EventType;
  date: string;
  time: string;
  location: string;
  organizer: string;
  description: string;
  is_registration_open: boolean;
  max_participants?: number;
  registered_count?: number;
  created_at?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  author: string;
  is_pinned: boolean;
  category: 'Чухал' | 'Арга хэмжээ' | 'Мэдэгдэл';
  created_at: string;
}

export interface CurrentUserProfile {
  id: string;
  email: string;
  full_name: string;
  role: MemberRole;
  isAdmin: boolean;
  member_id?: string;
}

export interface AttendanceStats {
  present: number;
  late: number;
  absent: number;
  excused: number;
  total: number;
  denominator: number; // total - excused
  percentage: number; // ((present + late) / (total - excused)) * 100
}
