/**
 * Mirrors docs/api-contract.md. Kept hand-written (instead of generated) so the
 * frontend has one obvious place to look, and so a contract drift shows up as a
 * type error rather than a runtime surprise.
 */

export type UserRole = "SUPER_ADMIN" | "ADMIN" | "SECRETARY" | "PASTOR";
export type MemberStatus = "ACTIVE" | "INACTIVE";
export type AbsenceReason = "NO_ATTENDANCE_IN_PERIOD" | "CONSECUTIVE_MISSES";

/**
 * A kind of gathering. This used to be a fixed enum every congregation shared;
 * it is now data each congregation owns and edits in Configurações, so names and
 * colours come from the API — never from a hardcoded label map.
 */
export interface MeetingType {
  id: string;
  name: string;
  color: string | null;
  sortOrder: number;
  active: boolean;
  /** Meetings currently using it — a type in use cannot be deleted. */
  meetingCount?: number;
}

/** How a visitor heard about the congregation. Congregation-owned list. */
export interface ReferralSource {
  id: string;
  name: string;
  sortOrder: number;
  active: boolean;
  visitorCount?: number;
}

/** The subset embedded in a meeting or a metrics point. */
export interface MeetingTypeRef {
  id: string;
  name: string;
  color: string | null;
}

/** The subset embedded in a visitor. */
export interface ReferralSourceRef {
  id: string;
  name: string;
}

export interface PaginationMeta {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface Paginated<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface Congregation {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  createdAt: string;
}

/** An effective setting, plus whether it came from the installation default. */
export interface EffectiveRule {
  value: number;
  inherited: boolean;
}

export interface CongregationRules {
  attendanceRateWindow: EffectiveRule;
  absenceAlertDays: EffectiveRule;
  absenceAlertConsecutiveMeetings: EffectiveRule;
}

export interface CongregationDetail extends Congregation {
  address: string | null;
  phone: string | null;
  email: string | null;
  timezone: string;
  logoUrl: string | null;
  /** Raw overrides — `null` means "inherit the installation default". */
  attendanceRateWindow: number | null;
  absenceAlertDays: number | null;
  absenceAlertConsecutiveMeetings: number | null;
  /** What is actually in force, so the UI can show "herdado: 30" on an empty field. */
  rules: CongregationRules;
  stats: {
    members: number;
    visitors: number;
    meetings: number;
    users: number;
  };
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  /**
   * Null on a brand-new installation: a SUPER_ADMIN exists before any
   * congregation does, and has to create the first one from `/setup`.
   */
  congregation: Pick<Congregation, "id" | "name" | "slug"> | null;
}

export interface LoginResponse {
  token: string;
  user: AuthUser;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active: boolean;
  createdAt: string;
}

export interface MemberStats {
  /** 0..1 */
  attendanceRate: number;
  attendedCount: number;
  consideredCount: number;
  lastAttendanceAt: string | null;
  daysSinceLastAttendance: number | null;
  consecutiveMissed: number;
  inAbsenceAlert: boolean;
  absenceReasons: AbsenceReason[];
}

export interface Member {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  /** YYYY-MM-DD */
  birthDate: string | null;
  /** YYYY-MM-DD */
  baptismDate: string | null;
  address: string | null;
  notes: string | null;
  status: MemberStatus;
  createdAt: string;
  convertedFromVisitor: boolean;
  stats: MemberStats;
}

export interface MemberAttendanceEntry {
  meetingId: string;
  date: string;
  type: MeetingTypeRef;
  present: boolean;
}

export interface MemberDetail extends Member {
  recentAttendance: MemberAttendanceEntry[];
}

export interface VisitorStats {
  visitCount: number;
  firstVisitAt: string | null;
  lastVisitAt: string | null;
}

export interface Visitor {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  referralSource: ReferralSourceRef | null;
  notes: string | null;
  convertedToMemberId: string | null;
  convertedAt: string | null;
  createdAt: string;
  stats: VisitorStats;
}

export interface MeetingAttendanceSummary {
  presentMembers: number;
  presentVisitors: number;
  totalPresent: number;
  eligibleMembers: number;
  /** 0..1 */
  attendanceRate: number;
}

export interface Meeting {
  id: string;
  type: MeetingTypeRef;
  date: string;
  description: string | null;
  createdAt: string;
  attendanceSummary: MeetingAttendanceSummary;
}

export interface AttendanceMemberRow {
  memberId: string;
  name: string;
  phone: string | null;
  status: MemberStatus;
  present: boolean;
  attendanceId: string | null;
}

export interface AttendanceVisitorRow {
  visitorId: string;
  name: string;
  phone: string | null;
  present: boolean;
  attendanceId: string | null;
}

export interface AttendanceSheet {
  meeting: Pick<Meeting, "id" | "type" | "date" | "description">;
  members: AttendanceMemberRow[];
  visitors: AttendanceVisitorRow[];
  summary: MeetingAttendanceSummary;
}

export interface ToggleAttendanceResponse {
  attendanceId: string;
  memberId?: string;
  visitorId?: string;
  present: boolean;
  summary: MeetingAttendanceSummary;
}

export interface AttendanceTrendPoint {
  meetingId: string;
  date: string;
  type: MeetingTypeRef;
  totalPresent: number;
  /** 0..1 */
  attendanceRate: number;
}

export interface DashboardMetrics {
  activeMembers: number;
  inactiveMembers: number;
  totalVisitors: number;
  visitorsThisMonth: number;
  averageAttendance: number;
  /** 0..1 */
  averageAttendanceRate: number;
  lastMeeting: {
    id: string;
    date: string;
    type: MeetingTypeRef;
    totalPresent: number;
    attendanceRate: number;
  } | null;
  absenceAlertCount: number;
  attendanceTrend: AttendanceTrendPoint[];
}

export interface AttendanceRankingRow {
  memberId: string;
  name: string;
  attendedCount: number;
  consideredCount: number;
  /** 0..1 */
  attendanceRate: number;
}

export interface AbsenceAlert {
  memberId: string;
  name: string;
  phone: string | null;
  status: MemberStatus;
  lastAttendanceAt: string | null;
  daysSinceLastAttendance: number | null;
  consecutiveMissed: number;
  reasons: AbsenceReason[];
}

export interface AbsenceAlertsResponse {
  items: AbsenceAlert[];
  meta: { days: number; consecutiveMeetings: number; total: number };
}

export interface AttendanceOverTimePoint {
  period: string;
  label: string;
  meetings: number;
  totalPresent: number;
  members: number;
  visitors: number;
  /** 0..1 */
  attendanceRate: number;
}

export interface ConvertVisitorResponse {
  member: Member;
  visitor: Visitor;
  migratedAttendances: number;
}
