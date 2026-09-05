import { ReactNode, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import QRCode from 'react-qr-code';
import {
  BadgeCheck, Star, Share2, ArrowRight, CalendarPlus, CalendarCheck, MapPin, Clock,
  Users, Download, Copy, AlertTriangle, Sparkles,
} from 'lucide-react';
import type { Profile, Session, DB } from '../lib/types';
import { cx, countryOf, initialsOf, profileUrl, copyText, sessionRange, uid } from '../lib/utils';
import { t } from '../lib/i18n';
import { useAuth } from '../lib/auth';
import { toggleFavorite, toggleAgenda, isAdmin } from '../lib/db';
import { Btn, Modal, useToast } from './ui';

/* ---------------- Logo ---------------- */
export function Logo({ light, small }: { light?: boolean; small?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <svg width={small ? 30 : 36} height={small ? 30 : 36} viewBox="0 0 64 64" aria-hidden>
        <rect width="64" height="64" rx="14" fill={light ? '#F0B429' : '#0C2560'} />
        <circle cx="32" cy="33" r="16" fill="none" stroke={light ? '#0C2560' : '#F0B429'} strokeWidth="2.6" />
        <ellipse cx="32" cy="33" rx="7.5" ry="16" fill="none" stroke={light ? '#0C2560' : '#F0B429'} strokeWidth="1.8" />
        <line x1="16" y1="33" x2="48" y2="33" stroke={light ? '#0C2560' : '#F0B429'} strokeWidth="1.8" />
        <path d="M32 6l2.4 5 5.5.7-4 3.8 1 5.4-4.9-2.6-4.9 2.6 1-5.4-4-3.8 5.5-.7z" fill={light ? '#0C2560' : '#F0B429'} />
      </svg>
      <span className="leading-none">
        <span className={cx('block font-display font-extrabold tracking-tight', small ? 'text-[15px]' : 'text-[17px]', light ? 'text-white' : 'text-navy-900')}>
          ANNUAIRE <span className="text-gold-400">SMD</span>
        </span>
        <span className={cx('mt-0.5 block font-mono uppercase tracking-[0.22em]', small ? 'text-[8.5px]' : 'text-[9.5px]', light ? 'text-white/70' : 'text-soft')}>
          FIJADA · Kinshasa 2026
        </span>
      </span>
    </Link>
  );
}

/* ---------------- Avatar ---------------- */
export function Avatar({ profile, size = 48, ring }: { profile: Profile; size?: number; ring?: boolean }) {
  return (
    <div
      aria-hidden
      className={cx('flex shrink-0 select-none items-center justify-center rounded-full font-display font-bold text-white', ring && 'ring-2 ring-gold-400 ring-offset-2 ring-offset-card')}
      style={{ width: size, height: size, background: `linear-gradient(135deg, ${profile.avatarColor}, #0C2560)`, fontSize: size * 0.34 }}
    >
      {initialsOf(profile) || '?'}
    </div>
  );
}

/* ---------------- Badges & tags ---------------- */
export function VerifiedBadge({ compact }: { compact?: boolean }) {
  return (
    <span
      title={t('label.verifiedTooltip')}
      className="group relative inline-flex items-center gap-1 rounded-full bg-forest-100 px-2 py-0.5 text-[11px] font-bold text-forest-700"
    >
      <BadgeCheck size={12.5} strokeWidth={2.6} />
      {!compact && t('label.verified')}
      <span className="pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 w-52 -translate-x-1/2 rounded-md bg-navy-900 px-3 py-2 text-[11px] font-medium text-white opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {t('label.verifiedTooltip')}
      </span>
    </span>
  );
}
export function VerificationTag({ v }: { v: Profile['verification'] }) {
  if (v === 'verified') return <VerifiedBadge />;
  if (v === 'pending')
    return <span className="inline-flex items-center gap-1 rounded-full bg-gold-100 px-2 py-0.5 text-[11px] font-bold text-gold-700"><Clock size={11} />{t('label.pending')}</span>;
  return <span className="inline-flex items-center gap-1 rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-soft">{t('label.unverified')}</span>;
}
export function DemoTag() {
  return <span className="rounded-sm border border-gold-400/60 bg-gold-100 px-1.5 py-px font-mono text-[9.5px] font-semibold tracking-[0.12em] text-gold-700 uppercase">Démo</span>;
}
const BADGE_LABELS: Record<string, string> = {
  intervenant: 'Intervenant officiel', paneliste: 'Panéliste', moderateur: 'Modérateur',
  invite_officiel: 'Invité officiel', organisateur: 'Organisateur', partenaire: 'Partenaire officiel',
};
export function BadgeChips({ badges, excludeOrganizer }: { badges: string[]; excludeOrganizer?: boolean }) {
  const list = badges.filter((b) => !(excludeOrganizer && b === 'organisateur'));
  if (!list.length) return null;
  return (
    <span className="flex flex-wrap gap-1">
      {list.map((b) => (
        <span key={b} className="inline-flex items-center gap-1 rounded-full bg-royal-50 px-2 py-0.5 text-[11px] font-bold text-royal-800">
          <Sparkles size={10.5} />{BADGE_LABELS[b] || b}
        </span>
      ))}
    </span>
  );
}
export function CountryBadge({ code, prefix }: { code?: string; prefix?: string }) {
  const c = countryOf(code);
  if (!c) return <span className="text-xs text-soft">—</span>;
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink">
      <span aria-hidden className="text-[15px] leading-none">{c.flag}</span>
      {prefix && <span className="font-mono text-[10px] tracking-wide text-soft uppercase">{prefix}</span>}
      {c.name}
    </span>
  );
}

/* ---------------- Carte participant ---------------- */
export function ParticipantCard({ profile, db, compact }: { profile: Profile; db: DB; compact?: boolean }) {
  const { user } = useAuth();
  const toast = useToast();
  const nav = useNavigate();
  const fav = !!user && db.favorites.some((f) => f.userId === user.id && f.profileId === profile.id);
  const type = db.participantTypes.find((x) => x.id === profile.participantTypeId)?.name;

  const onFav = () => {
    if (!user) return nav('/connexion');
    toggleFavorite(user.id, profile.id);
    toast.push('success', fav ? 'Retiré des favoris.' : 'Ajouté à vos favoris.');
  };
  const onShare = async () => {
    const url = profileUrl(profile.userId);
    if (navigator.share) {
      try { await navigator.share({ title: profile.fullName, url }); return; } catch { /* annulé */ }
    }
    (await copyText(url)) && toast.push('success', 'Lien du profil copié.');
  };

  if (compact) {
    return (
      <div className="group flex items-center gap-3 rounded-lg border border-line bg-card px-4 py-3 transition-all duration-200 hover:-translate-y-px hover:border-royal-200 hover:shadow-md">
        <Avatar profile={profile} size={40} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1.5 font-display text-sm font-bold text-ink">
            {profile.fullName}
            {profile.verification === 'verified' && <BadgeCheck size={14} className="text-forest-600" aria-label={t('label.verifiedTooltip')} />}
            {profile.demo && <DemoTag />}
          </p>
          <p className="truncate text-xs text-soft">{profile.title}{profile.organization ? ` · ${profile.organization}` : ''}</p>
        </div>
        <CountryBadge code={profile.representedCountry} />
        <button onClick={onFav} aria-label="Favori" className={cx('cursor-pointer rounded-md p-1.5 transition-colors', fav ? 'text-gold-500' : 'text-soft/50 hover:text-gold-500')}>
          <Star size={16} fill={fav ? 'currentColor' : 'none'} />
        </button>
        <Link to={`/participant/${profile.userId}`} className="rounded-md bg-royal-700 px-3 py-1.5 text-xs font-bold text-white transition-colors hover:bg-royal-800">
          {t('action.viewProfile')}
        </Link>
      </div>
    );
  }

  return (
    <article className="group relative flex flex-col rounded-lg border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-royal-200 hover:shadow-lg hover:shadow-royal-900/8">
      <div className="flex items-start justify-between">
        <Avatar profile={profile} size={56} ring={profile.verification === 'verified'} />
        <div className="flex items-center gap-1">
          <button onClick={onFav} aria-label={t('action.favorite')} title={t('action.favorite')} className={cx('cursor-pointer rounded-md p-1.5 transition-all hover:scale-110', fav ? 'text-gold-500' : 'text-soft/40 hover:text-gold-500')}>
            <Star size={18} fill={fav ? 'currentColor' : 'none'} />
          </button>
          <button onClick={onShare} aria-label={t('action.share')} title={t('action.share')} className="cursor-pointer rounded-md p-1.5 text-soft/40 transition-all hover:scale-110 hover:text-royal-700">
            <Share2 size={18} />
          </button>
        </div>
      </div>
      <div className="mt-3">
        <p className="flex flex-wrap items-center gap-1.5 font-display text-[16px] leading-tight font-bold text-ink">
          {profile.fullName}
          {profile.demo && <DemoTag />}
        </p>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
          {profile.verification === 'verified' ? <VerifiedBadge /> : isAdmin(user) ? <VerificationTag v={profile.verification} /> : null}
          {type && <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-soft">{type}</span>}
        </div>
        <p className="mt-2 text-sm font-semibold text-royal-800">{profile.title || '—'}</p>
        <p className="truncate text-xs text-soft">{profile.organization}</p>
      </div>
      <div className="mt-3 flex items-center gap-2 border-t border-dashed border-line pt-3">
        <CountryBadge code={profile.representedCountry} prefix="Représente" />
      </div>
      {profile.shortBio && (
        <p className="mt-2.5 line-clamp-2 text-[13px] leading-relaxed text-soft">{profile.shortBio}</p>
      )}
      <div className="mt-auto flex items-center justify-between pt-4">
        <Link to={`/participant/${profile.userId}`} className="inline-flex items-center gap-1.5 text-sm font-bold text-royal-700 transition-all group-hover:gap-2.5 hover:text-royal-800">
          {t('action.viewProfile')} <ArrowRight size={15} />
        </Link>
      </div>
    </article>
  );
}

/* ---------------- Catégories de session ---------------- */
const CAT_STYLE: Record<string, string> = {
  accueil: 'bg-slate-100 text-slate-700',
  ceremonie: 'bg-royal-100 text-royal-800',
  conference: 'bg-gold-100 text-gold-700',
  panel: 'bg-forest-100 text-forest-700',
  pause: 'bg-paper text-soft',
  networking: 'bg-flame-100 text-flame-700',
  b2b: 'bg-tealx-100 text-tealx-700',
  atelier: 'bg-copper-100 text-copper-700',
  expo: 'bg-tealx-100 text-tealx-700',
  pleniere: 'bg-royal-100 text-royal-800',
  officiel: 'bg-navy-900 text-white',
  decouverte: 'bg-forest-100 text-forest-700',
  gala: 'bg-gold-100 text-gold-700',
  depart: 'bg-slate-100 text-slate-600',
};
export function CategoryChip({ c }: { c: string }) {
  return <span className={cx('rounded-sm px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.1em] uppercase', CAT_STYLE[c] || 'bg-paper text-soft')}>{c}</span>;
}

/* ---------------- Bloc session ---------------- */
export function SessionBlock({ session, db, showSpeakers = true }: { session: Session; db: DB; showSpeakers?: boolean }) {
  const { user } = useAuth();
  const toast = useToast();
  const [confirmParallel, setConfirmParallel] = useState(false);
  const inAgenda = !!user && db.agenda.some((a) => a.userId === user.id && a.sessionId === session.id);
  const speakers = session.speakerIds.map((id) => db.profiles.find((p) => p.id === id)).filter(Boolean) as Profile[];

  const doToggle = () => {
    if (!user) return;
    toggleAgenda(user.id, session.id);
    toast.push('success', inAgenda ? 'Session retirée de votre agenda.' : 'Session ajoutée à votre agenda.');
  };
  const onAgenda = () => {
    if (!user) return toast.push('info', 'Connectez-vous pour construire votre agenda.');
    if (!inAgenda && session.parallelGroup) {
      const conflict = db.sessions.some(
        (s) => s.parallelGroup === session.parallelGroup && s.id !== session.id &&
          db.agenda.some((a) => a.userId === user.id && a.sessionId === s.id),
      );
      if (conflict) return setConfirmParallel(true);
    }
    doToggle();
  };

  return (
    <div className={cx('relative rounded-lg border bg-card p-4 transition-all duration-200 hover:shadow-md sm:p-5', inAgenda ? 'border-forest-600/40' : 'border-line hover:border-royal-200')}>
      {session.urgent && (
        <span className="absolute -top-2.5 right-4 inline-flex items-center gap-1 rounded-full bg-flame-600 px-2 py-0.5 text-[10px] font-bold text-white">
          <AlertTriangle size={10} /> Mise à jour urgente
        </span>
      )}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="flex shrink-0 items-center gap-2 sm:w-36 sm:flex-col sm:items-start sm:gap-1">
          <span className="inline-flex items-center gap-1.5 font-mono text-sm font-bold text-royal-800">
            <Clock size={13} />{sessionRange(session)}
          </span>
          {session.parallelGroup && (
            <span className="rounded-sm bg-gold-100 px-1.5 py-0.5 font-mono text-[9.5px] font-bold tracking-wider text-gold-700 uppercase">Sessions simultanées</span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <CategoryChip c={session.category} />
            {session.room && <span className="inline-flex items-center gap-1 text-xs text-soft"><MapPin size={11.5} />{session.room}</span>}
          </div>
          <h4 className="mt-1.5 font-display text-[15px] leading-snug font-bold text-ink">{session.title}</h4>
          {session.description && <p className="mt-1 text-[13px] leading-relaxed text-soft">{session.description}</p>}
          {session.subItems && session.subItems.length > 0 && (
            <ul className="mt-2 space-y-1">
              {session.subItems.map((s, i) => (
                <li key={i} className="flex items-start gap-2 text-[13px] text-soft">
                  <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-gold-400" />{s}
                </li>
              ))}
            </ul>
          )}
          {showSpeakers && speakers.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 font-mono text-[10px] tracking-wider text-soft uppercase"><Users size={11} /> Intervenants</span>
              {speakers.map((sp) => (
                <Link key={sp.id} to={`/participant/${sp.userId}`} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper px-2 py-0.5 text-xs font-semibold text-royal-800 transition-colors hover:border-royal-300">
                  <Avatar profile={sp} size={18} />{sp.fullName}
                </Link>
              ))}
            </div>
          )}
        </div>
        <div className="shrink-0 sm:self-center">
          <Btn variant={inAgenda ? 'outline' : 'gold'} size="sm" onClick={onAgenda} className="w-full sm:w-auto">
            {inAgenda ? <><CalendarCheck size={14} /> Dans mon agenda</> : <><CalendarPlus size={14} /> Ajouter à mon agenda</>}
          </Btn>
        </div>
      </div>
      <Modal open={confirmParallel} onClose={() => setConfirmParallel(false)} title="Sessions simultanées">
        <p className="text-sm leading-relaxed text-soft">
          Vous avez déjà sélectionné une session sur ce même créneau ({session.date} · {sessionRange(session)}).
          Ces panels se déroulent <strong className="text-ink">en simultané</strong> : n’ajoutez cette session que si vous
          acceptez le conflit horaire dans votre agenda.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setConfirmParallel(false)}>Renoncer</Btn>
          <Btn variant="gold" onClick={() => { setConfirmParallel(false); doToggle(); }}><AlertTriangle size={14} /> Ajouter malgré le conflit</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ---------------- QR ---------------- */
export function QRBlock({ username, name, size = 150 }: { username: string; name?: string; size?: number }) {
  const toast = useToast();
  const ref = useRef<HTMLDivElement>(null);
  const url = profileUrl(username);

  const download = () => {
    const svg = ref.current?.querySelector('svg');
    if (!svg) return;
    const xml = new XMLSerializer().serializeToString(svg);
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 640; canvas.height = 640;
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#FCFDFF';
      ctx.fillRect(0, 0, 640, 640);
      ctx.drawImage(img, 40, 40, 560, 560);
      canvas.toBlob((b) => {
        if (!b) return;
        const a = document.createElement('a');
        a.href = URL.createObjectURL(b);
        a.download = `qr-${username}.png`;
        a.click();
      });
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
  };
  const copy = async () => {
    (await copyText(url)) && toast.push('success', 'Lien du profil copié dans le presse-papiers.');
  };

  return (
    <div className="flex flex-col items-center">
      <div ref={ref} className="rounded-lg border-2 border-navy-900 bg-white p-3 shadow-sm" aria-label={`QR code vers le profil de ${name || username}`}>
        <QRCode value={url} size={size} fgColor="#0A1F44" bgColor="#FFFFFF" />
      </div>
      <p className="mt-3 max-w-[240px] text-center font-mono text-[10.5px] leading-relaxed break-all text-soft">/participant/{username}</p>
      <div className="mt-3 flex flex-wrap justify-center gap-2">
        <Btn size="sm" variant="outline" onClick={download}><Download size={13} /> Télécharger</Btn>
        <Btn size="sm" variant="outline" onClick={copy}><Copy size={13} /> Copier le lien</Btn>
      </div>
    </div>
  );
}

/* ---------------- Badge héros (accueil) ---------------- */
export function BadgeMockup() {
  return (
    <div className="animate-floaty relative w-[280px] select-none overflow-hidden rounded-xl border border-line bg-white shadow-2xl shadow-royal-900/25 sm:w-[300px]">
      <div className="bg-navy-900 px-5 py-3.5">
        <div className="flex items-center justify-between">
          <span className="font-display text-[13px] font-extrabold tracking-tight text-white">SMD <span className="text-gold-400">·</span> FIJADA 2026</span>
          <span className="font-mono text-[9px] tracking-[0.2em] text-white/60 uppercase">Badge officiel</span>
        </div>
      </div>
      <div className="flag-bar h-1" />
      <div className="px-5 py-5">
        <div className="flex items-center gap-3.5">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-royal-700 to-navy-900 font-display text-xl font-bold text-white">VN</div>
          <div>
            <p className="font-display text-[17px] leading-tight font-extrabold text-ink">Votre Nom</p>
            <p className="mt-0.5 text-xs font-semibold text-royal-800">Votre fonction</p>
            <p className="text-[11px] text-soft">Votre institution</p>
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between rounded-md bg-paper px-3 py-2">
          <div className="space-y-1">
            <p className="font-mono text-[9px] tracking-[0.18em] text-soft uppercase">Participant</p>
            <p className="flex items-center gap-1.5 text-xs font-bold text-ink"><span aria-hidden>🇨🇩</span> Kinshasa · 08–12 sept.</p>
          </div>
          <div className="rounded-sm bg-white p-1.5">
            <QRCode value="https://annuaire-smd-fijada2026.example/participant/votre-profil" size={52} fgColor="#0A1F44" />
          </div>
        </div>
        <div className="mt-4 flex items-center justify-between font-mono text-[9px] tracking-[0.14em] text-soft uppercase">
          <span>3e édition</span><span className="text-gold-500">★★★</span><span>Vérifié FIJADA</span>
        </div>
      </div>
      <div className="flag-bar h-1.5" />
    </div>
  );
}

export function PageHero({ kicker, title, desc, children }: { kicker: string; title: ReactNode; desc?: string; children?: ReactNode }) {
  return (
    <header className="border-b border-line bg-navy-900 text-white">
      <div className="bg-dotted-light">
        <div className="mx-auto max-w-6xl px-4 pt-10 pb-8 sm:px-6">
          <p className="mb-2 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-gold-400 uppercase">
            <span className="inline-block h-[2px] w-6 bg-gold-400" />{kicker}
          </p>
          <h1 className="font-display text-[26px] leading-tight font-extrabold tracking-tight sm:text-[34px]">{title}</h1>
          {desc && <p className="mt-2.5 max-w-2xl text-sm leading-relaxed text-white/75">{desc}</p>}
          {children}
        </div>
      </div>
    </header>
  );
}
