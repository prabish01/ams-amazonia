export type Role = "SUPER_ADMIN" | "ADMIN" | "STAFF";
export type EmploymentType = "FULL_TIME" | "PART_TIME";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
export type LeavePayType = "FULL" | "FOUR_FIFTHS" | "UNPAID";

export interface User {
  id: string;
  email: string;
  name: string;
  nickname?: string | null;
  phone?: string | null;
  avatarUrl?: string | null;
  hkid?: string | null;
  bankName?: string | null;
  bankCode?: string | null;
  bankAccountNumber?: string | null;
  // Payroll fields
  staffNumber?: string | null;
  autopayDay?: number | null;
  foodAllowance?: string | null;
  monthlySalary?: string | null;
  incentive?: string | null;
  monthlyDeduction?: string | null;
  monthlyAdjustment?: string | null;
  role: Role;
  employmentType: EmploymentType;
  hireDate: string;
  isActive: boolean;
  restaurantId?: string | null;
  restaurant?: Restaurant | null;
  categoryId?: string | null;
  staffCategory?: StaffCategory | null;
  createdAt: string;
  updatedAt: string;
}

export interface Restaurant {
  id: string;
  name: string;
  address?: string | null;
  cuisineType?: string | null;
  description?: string | null;
  logoUrl?: string | null;
  isActive: boolean;
  _count?: { staff: number };
  createdAt: string;
  updatedAt: string;
}

export interface StaffCategory {
  id: string;
  name: string;
  description?: string | null;
  restaurantId: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  staffId: string;
  staff?: User;
  restaurantId: string;
  date: string;
  entryTime: string;
  exitTime?: string | null;
  durationMinutes?: number | null;
  isManualCorrection: boolean;
  correctedBy?: string | null;
  correctionNote?: string | null;
  createdAt: string;
}

export interface LeaveCategory {
  id: string;
  code: string;
  name: string;
  description?: string | null;
  isStatutory: boolean;
  isPaid: boolean;
  payType: LeavePayType;
  maxDaysPerYear?: number | null;
  isCustom: boolean;
  createdBy?: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staff?: User;
  restaurantId: string;
  categoryId: string;
  category?: LeaveCategory;
  startDate: string;
  endDate: string;
  daysRequested: number;
  reason?: string | null;
  attachmentUrl?: string | null;
  status: LeaveStatus;
  reviewedBy?: string | null;
  reviewNote?: string | null;
  reviewedAt?: string | null;
  createdAt: string;
}

export interface LeaveBalance {
  id: string;
  staffId: string;
  categoryId: string;
  category?: LeaveCategory;
  year: number;
  allocated: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface SalaryRate {
  id: string;
  restaurantId: string;
  staffId?: string | null;
  staff?: User | null;
  categoryId?: string | null;
  category?: StaffCategory | null;
  hourlyRate: string;
  effectiveFrom: string;
  effectiveTo?: string | null;
  createdBy: string;
  createdAt: string;
}

export interface EarningsSummary {
  staffId: string;
  staffName: string;
  totalHours: number;
  regularHours: number;
  overtimeHours: number;
  hourlyRate: number;
  grossEarnings: number;
  leavePayments: number;
  holidayPay: number;
  totalPayable: number;
  period: { start: string; end: string };
}

export interface ReportData {
  staff: User;
  attendance: Attendance[];
  leaveRequests: LeaveRequest[];
  earnings: EarningsSummary;
  period: { start: string; end: string };
}

// Auth session
export interface Session {
  user: {
    id: string;
    email: string;
    name: string;
    role: Role;
    restaurantId?: string | null;
    avatarUrl?: string | null;
  };
}
