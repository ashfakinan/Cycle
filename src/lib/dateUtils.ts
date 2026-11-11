export const DEFAULT_TIMEZONE = 'Asia/Dhaka';

export const DOW_ABBR = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DOW_SHORT = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DOW_FULL = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
export const MONTHS_FULL = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
export const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * Returns current YYYY-MM-DD in the given timezone (defaults to Asia/Dhaka).
 */
export function getTodayString(timezone: string = DEFAULT_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    return formatter.format(new Date());
  } catch {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
}

/**
 * Parse YYYY-MM-DD to a local midnight Date object
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d, 12, 0, 0); // midday to avoid daylight savings edge cases
}

export function formatDateToIso(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

export function addDays(dateStr: string, days: number): string {
  const d = parseDate(dateStr);
  d.setDate(d.getDate() + days);
  return formatDateToIso(d);
}

/**
 * Day of week: 0=Sun, 1=Mon, ..., 6=Sat
 */
export function getDayOfWeek(dateStr: string): number {
  return parseDate(dateStr).getDay();
}

export function formatFullDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${DOW_FULL[d.getDay()]}, ${d.getDate()} ${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export function formatMediumDate(dateStr: string): string {
  const d = parseDate(dateStr);
  return `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]}`;
}

export function formatMonthYear(d: Date): string {
  return `${MONTHS_FULL[d.getMonth()]} ${d.getFullYear()}`;
}

export function getGreeting(): string {
  const hours = new Date().getHours();
  if (hours < 12) return 'Good morning';
  if (hours < 17) return 'Good afternoon';
  return 'Good evening';
}

/**
 * Get 7 days for the week containing referenceDateStr
 */
export function getWeekDays(
  referenceDateStr: string,
  weekStartsOn: 'sunday' | 'monday' = 'sunday'
): string[] {
  const ref = parseDate(referenceDateStr);
  const currentDow = ref.getDay();
  const startOffset = weekStartsOn === 'sunday' ? currentDow : (currentDow + 6) % 7;
  const start = new Date(ref);
  start.setDate(ref.getDate() - startOffset);

  const days: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    days.push(formatDateToIso(d));
  }
  return days;
}

/**
 * Get calendar grid cells (42 days) for a given month/year
 */
export function getMonthGrid(
  year: number,
  monthIndex: number,
  weekStartsOn: 'sunday' | 'monday' = 'sunday'
): { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] {
  const firstDayOfMonth = new Date(year, monthIndex, 1, 12);
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0, 12);
  const totalDays = lastDayOfMonth.getDate();

  const firstDow = firstDayOfMonth.getDay();
  const leadingDays = weekStartsOn === 'sunday' ? firstDow : (firstDow + 6) % 7;

  const cells: { dateStr: string; dayNumber: number; isCurrentMonth: boolean }[] = [];

  // Previous month trailing days
  for (let i = leadingDays; i > 0; i--) {
    const d = new Date(year, monthIndex, 1 - i, 12);
    cells.push({
      dateStr: formatDateToIso(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let day = 1; day <= totalDays; day++) {
    const d = new Date(year, monthIndex, day, 12);
    cells.push({
      dateStr: formatDateToIso(d),
      dayNumber: day,
      isCurrentMonth: true,
    });
  }

  // Next month leading days to complete grid (multiples of 7)
  const remaining = (7 - (cells.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const d = new Date(year, monthIndex + 1, i, 12);
    cells.push({
      dateStr: formatDateToIso(d),
      dayNumber: d.getDate(),
      isCurrentMonth: false,
    });
  }

  return cells;
}
