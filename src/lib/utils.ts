import type { Profile, ContactDetails, Session } from './types';

export function uid(): string {
  return (
    Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
  ).toUpperCase();
}

export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(' ');
}

/** Recherche tolérante : casse + accents ignorés. */
export function fold(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

/** Hash déterministe (démo, côté client) — les mots de passe ne sont jamais stockés en clair. */
export function hashPassword(pw: string): string {
  const input = 'smd-fijada::2026::' + pw;
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < input.length; i++) {
    h1 = (h1 ^ input.charCodeAt(i)) >>> 0;
    h1 = (h1 * 16777619) >>> 0;
    h2 = ((h2 << 5) + h2 + input.charCodeAt(i) * (i + 7)) | 0;
  }
  return 'v1$' + h1.toString(16) + '$' + (h2 >>> 0).toString(16) + '$' + input.length.toString(16);
}

const MONTHS_FR = [
  'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
];

export function fmtDate(d: number | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_FR[date.getMonth()]} ${date.getFullYear()}`;
}
export function fmtDateShort(d: number | string): string {
  const date = typeof d === 'string' ? new Date(d + 'T12:00:00') : new Date(d);
  return `${String(date.getDate()).padStart(2, '0')} ${MONTHS_FR[date.getMonth()].slice(0, 4)}.`;
}
export function fmtDateTime(d: number): string {
  const date = new Date(d);
  return `${fmtDate(d)} · ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
export function timeAgo(d: number): string {
  const s = Math.max(1, Math.floor((Date.now() - d) / 1000));
  if (s < 60) return 'à l’instant';
  const m = Math.floor(s / 60);
  if (m < 60) return `il y a ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 24) return `il y a ${h} h`;
  const j = Math.floor(h / 24);
  return `il y a ${j} j`;
}

export function sessionRange(s: Session): string {
  if (s.startTime && s.endTime) return `${s.startTime} – ${s.endTime}`;
  if (s.startTime) return `À partir de ${s.startTime}`;
  if (s.dayPart) return s.dayPart;
  return 'Programme de journée';
}

export function sessionsOverlap(a: Session, b: Session): boolean {
  if (a.id === b.id || a.date !== b.date) return false;
  if (!a.startTime || !b.startTime || !a.endTime || !b.endTime) return false;
  return a.startTime < b.endTime && b.startTime < a.endTime;
}

/* ---------------- Pays ---------------- */
export interface Country {
  code: string;
  name: string;
  flag: string;
}
export const COUNTRIES: Country[] = [
  { code: 'CD', name: 'RD Congo', flag: '🇨🇩' },
  { code: 'CG', name: 'Congo', flag: '🇨🇬' },
  { code: 'SN', name: 'Sénégal', flag: '🇸🇳' },
  { code: 'CI', name: 'Côte d’Ivoire', flag: '🇨🇮' },
  { code: 'CM', name: 'Cameroun', flag: '🇨🇲' },
  { code: 'GA', name: 'Gabon', flag: '🇬🇦' },
  { code: 'ML', name: 'Mali', flag: '🇲🇱' },
  { code: 'BF', name: 'Burkina Faso', flag: '🇧🇫' },
  { code: 'TG', name: 'Togo', flag: '🇹🇬' },
  { code: 'BJ', name: 'Bénin', flag: '🇧🇯' },
  { code: 'NE', name: 'Niger', flag: '🇳🇪' },
  { code: 'TD', name: 'Tchad', flag: '🇹🇩' },
  { code: 'CF', name: 'Centrafrique', flag: '🇨🇫' },
  { code: 'RW', name: 'Rwanda', flag: '🇷🇼' },
  { code: 'BI', name: 'Burundi', flag: '🇧🇮' },
  { code: 'UG', name: 'Ouganda', flag: '🇺🇬' },
  { code: 'TZ', name: 'Tanzanie', flag: '🇹🇿' },
  { code: 'KE', name: 'Kenya', flag: '🇰🇪' },
  { code: 'ET', name: 'Éthiopie', flag: '🇪🇹' },
  { code: 'NG', name: 'Nigeria', flag: '🇳🇬' },
  { code: 'GH', name: 'Ghana', flag: '🇬🇭' },
  { code: 'ZA', name: 'Afrique du Sud', flag: '🇿🇦' },
  { code: 'AO', name: 'Angola', flag: '🇦🇴' },
  { code: 'MZ', name: 'Mozambique', flag: '🇲🇿' },
  { code: 'ZM', name: 'Zambie', flag: '🇿🇲' },
  { code: 'MA', name: 'Maroc', flag: '🇲🇦' },
  { code: 'TN', name: 'Tunisie', flag: '🇹🇳' },
  { code: 'DZ', name: 'Algérie', flag: '🇩🇿' },
  { code: 'EG', name: 'Égypte', flag: '🇪🇬' },
  { code: 'MG', name: 'Madagascar', flag: '🇲🇬' },
  { code: 'MU', name: 'Île Maurice', flag: '🇲🇺' },
  { code: 'FR', name: 'France', flag: '🇫🇷' },
  { code: 'BE', name: 'Belgique', flag: '🇧🇪' },
  { code: 'CH', name: 'Suisse', flag: '🇨🇭' },
  { code: 'DE', name: 'Allemagne', flag: '🇩🇪' },
  { code: 'GB', name: 'Royaume-Uni', flag: '🇬🇧' },
  { code: 'US', name: 'États-Unis', flag: '🇺🇸' },
  { code: 'CA', name: 'Canada', flag: '🇨🇦' },
  { code: 'PT', name: 'Portugal', flag: '🇵🇹' },
  { code: 'ES', name: 'Espagne', flag: '🇪🇸' },
  { code: 'TR', name: 'Turquie', flag: '🇹🇷' },
  { code: 'CN', name: 'Chine', flag: '🇨🇳' },
  { code: 'JP', name: 'Japon', flag: '🇯🇵' },
  { code: 'BR', name: 'Brésil', flag: '🇧🇷' },
  { code: 'IN', name: 'Inde', flag: '🇮🇳' },
  { code: 'AE', name: 'Émirats arabes unis', flag: '🇦🇪' },
];

export function countryOf(code?: string): Country | undefined {
  return COUNTRIES.find((c) => c.code === code);
}
export function countryName(code?: string): string {
  return countryOf(code)?.name ?? '—';
}

/* ---------------- Avatar ---------------- */
const AV_COLORS = ['#153B8E', '#0F6140', '#9C6F06', '#A32F23', '#0E6E78', '#A05A24', '#102F71', '#5B21B6'];
export function colorFor(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0;
  return AV_COLORS[Math.abs(h) % AV_COLORS.length];
}
export function initialsOf(p: Profile): string {
  return ((p.firstName[0] || '') + (p.lastName[0] || '')).toUpperCase();
}

/* ---------------- Complétude ---------------- */
export function completeness(p: Profile, c?: ContactDetails): number {
  const checks = [
    !!p.firstName, !!p.lastName, !!p.title, !!p.organization,
    !!p.participantTypeId, !!p.sectorId, !!p.representedCountry,
    !!p.city, !!p.shortBio, !!p.biography, !!(c && (c.phone || c.proEmail)),
    p.topics.length > 0,
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

/* ---------------- Partage / fichiers ---------------- */
export function profileUrl(username: string): string {
  return `${location.origin}${location.pathname}#/participant/${username}`;
}
export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
export function downloadFile(name: string, content: string, type = 'text/plain') {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function toICS(sessions: Session[], location: string): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//FIJADA//Annuaire SMD 2026//FR'];
  for (const s of sessions) {
    const d = s.date.replace(/-/g, '');
    const st = (s.startTime || '09:00').replace(':', '') + '00';
    const et = (s.endTime || s.startTime || '10:00').replace(':', '') + '00';
    lines.push(
      'BEGIN:VEVENT',
      `UID:${s.id}@smd-fijada2026`,
      `DTSTART:${d}T${st}`,
      `DTEND:${d}T${et}`,
      `SUMMARY:${(s.title || '').replace(/,/g, '\\,')}`,
      `LOCATION:${((s.room ? s.room + ', ' : '') + (s.location || location)).replace(/,/g, '\\,')}`,
      'END:VEVENT',
    );
  }
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

export function validEmail(e: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e);
}
export function strongPassword(pw: string): string | null {
  if (pw.length < 8) return 'Le mot de passe doit contenir au moins 8 caractères.';
  if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw))
    return 'Le mot de passe doit combiner lettres et chiffres.';
  return null;
}
