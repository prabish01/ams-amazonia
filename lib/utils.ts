import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, differenceInMinutes, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h}h ${m}m`;
}

export function formatHKDate(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy");
}

export function formatHKDateTime(date: Date | string): string {
  return format(new Date(date), "dd MMM yyyy, HH:mm");
}

export function formatTime(date: Date | string): string {
  return format(new Date(date), "HH:mm");
}

export function calcDurationMinutes(entry: Date, exit: Date): number {
  return differenceInMinutes(exit, entry);
}

export function getWeekRange(date: Date = new Date()) {
  return {
    start: startOfWeek(date, { weekStartsOn: 1 }),
    end: endOfWeek(date, { weekStartsOn: 1 }),
  };
}

export function getMonthRange(date: Date = new Date()) {
  return {
    start: startOfMonth(date),
    end: endOfMonth(date),
  };
}

export function formatCurrency(amount: number | string): string {
  return `HK$${Number(amount).toLocaleString("en-HK", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function getYearsOfService(hireDate: Date | string): number {
  const hire = new Date(hireDate);
  const now = new Date();
  const years = now.getFullYear() - hire.getFullYear();
  const m = now.getMonth() - hire.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < hire.getDate())) return years - 1;
  return years;
}

/** HK Annual Leave entitlement by years of service (Employment Ordinance Cap. 57) */
export function getHKAnnualLeaveEntitlement(yearsOfService: number): number {
  if (yearsOfService < 1) return 0;
  return Math.min(7 + (yearsOfService - 1), 14);
}

/** HK Sick Leave accumulated days (2 per month, max 120) */
export function getHKSickLeaveAccumulated(monthsOfService: number): number {
  return Math.min(monthsOfService * 2, 120);
}
