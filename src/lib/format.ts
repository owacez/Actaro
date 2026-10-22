// Shared presentation formatting. Stored values stay raw/ISO; only display changes.
export function plural(count: number, singular: string, pluralForm = `${singular}s`) {
  return `${count} ${count === 1 ? singular : pluralForm}`;
}
// Civil dates (YYYY-MM-DD) read as "Thu, Oct 22"; the year appears only when it differs.
export function displayDate(value: string, now = new Date()) {
  const date = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('en', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    ...(value.slice(0, 4) === String(now.getFullYear()) ? {} : { year: 'numeric' }),
  }).format(date);
}
// A date range without weekdays, e.g. "Sep 23 – Oct 22".
export function displayRange(start: string, end: string, now = new Date()) {
  const short = (value: string) => displayDate(value, now).replace(/^[A-Z][a-z]{2}, /, '');
  return `${short(start)} – ${short(end)}`;
}
