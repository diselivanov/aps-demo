export const MONTHS = [
  "Январь",
  "Февраль",
  "Март",
  "Апрель",
  "Май",
  "Июнь",
  "Июль",
  "Август",
  "Сентябрь",
  "Октябрь",
  "Ноябрь",
  "Декабрь",
];

export const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDate(value: string): Date | null {
  if (!value) return null;
  const [y, m, d] = value.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

export function formatDisplay(value: string): string {
  const date = parseDate(value);
  if (!date) return "";
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const y = date.getFullYear();
  return `${d}.${m}.${y}`;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function getCalendarDays(viewDate: Date): Date[] {
  const first = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const last = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0);

  const startWeekday = (first.getDay() + 6) % 7;
  const totalDays = last.getDate();
  const days: Date[] = [];

  for (let i = startWeekday; i > 0; i--) {
    days.push(new Date(first.getFullYear(), first.getMonth(), 1 - i));
  }
  for (let d = 1; d <= totalDays; d++) {
    days.push(new Date(first.getFullYear(), first.getMonth(), d));
  }
  while (days.length < 42) {
    const lastDay = days[days.length - 1];
    days.push(
      new Date(
        lastDay.getFullYear(),
        lastDay.getMonth(),
        lastDay.getDate() + 1,
      ),
    );
  }
  return days;
}
