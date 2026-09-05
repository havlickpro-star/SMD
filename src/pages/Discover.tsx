import { useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Mic2, ArrowLeft, ArrowRight, Users, CalendarDays, BadgeCheck } from 'lucide-react';
import { useDb, searchProfiles, sessionsOfProfile } from '../lib/db';
import { cx, sessionRange, fmtDateShort } from '../lib/utils';
import { PageHero, Avatar, ParticipantCard, CategoryChip, VerifiedBadge, BadgeChips, DemoTag } from '../components/bits';
import { Tabs, Reveal } from '../components/ui';
import type { Profile } from '../lib/types';

const BADGE_TABS = [
  { id: 'all', label: 'Tous' },
  { id: 'intervenant', label: 'Intervenants officiels' },
  { id: 'paneliste', label: 'Panélistes' },
  { id: 'moderateur', label: 'Modérateurs' },
  { id: 'invite_officiel', label: 'Invités officiels' },
  { id: 'organisateur', label: 'Organisation' },
  { id: 'partenaire', label: 'Partenaires' },
];

export function SpeakersPage() {
  const db = useDb();
  const [sp, setSp] = useSearchParams();
  const tab = sp.get('tab') || 'all';

  const speakers = useMemo(() => {
    const ids = new Set<string>();
    db.sessions.forEach((s) => s.speakerIds.forEach((id) => ids.add(id)));
    let list = db.profiles.filter(
      (p) => p.published && (ids.has(p.id) || p.badges.some((b) => ['intervenant', 'paneliste', 'moderateur', 'invite_officiel', 'organisateur', 'partenaire'].includes(b))),
    );
    if (tab !== 'all') list = list.filter((p) => p.badges.includes(tab as any));
    return list.sort((a, b) => (b.verification === 'verified' ? 1 : 0) - (a.verification === 'verified' ? 1 : 0) || a.fullName.localeCompare(b.fullName, 'fr'));
  }, [db, tab]);

  return (
    <div>
      <PageHero kicker="Voix du Sommet" title="Intervenants & personnalités" desc="Les intervenants officiels, panélistes, modérateurs, invités officiels et partenaires reliés aux sessions du programme. Les profils vérifiés par l’administration FIJADA sont affichés en priorité." />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6"><Tabs items={BADGE_TABS} active={tab} onChange={(id) => setSp(id === 'all' ? {} : { tab: id })} /></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {speakers.map((p, i) => {
            const sessions = sessionsOfProfile(db, p.id);
            return (
              <Reveal key={p.id} delay={i * 40}>
                <article className="flex h-full flex-col rounded-lg border border-line bg-card p-5 transition-all duration-300 hover:-translate-y-1 hover:border-royal-200 hover:shadow-lg hover:shadow-royal-900/8">
                  <div className="flex items-start gap-3.5">
                    <Avatar profile={p} size={54} ring={p.verification === 'verified'} />
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-1.5 font-display text-[15.5px] leading-tight font-bold text-ink">{p.fullName}{p.demo && <DemoTag />}</p>
                      <p className="mt-0.5 text-[13px] font-semibold text-royal-800">{p.title}</p>
                      <p className="truncate text-xs text-soft">{p.organization}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-1.5">
                    {p.verification === 'verified' && <VerifiedBadge />}
                    <BadgeChips badges={p.badges} excludeOrganizer={tab !== 'organisateur' && tab !== 'all'} />
                  </div>
                  {sessions.length > 0 && (
                    <div className="mt-3 space-y-1.5 border-t border-dashed border-line pt-3">
                      {sessions.slice(0, 2).map((s) => (
                        <Link key={s.id} to="/programme" className="flex items-center gap-2 text-xs text-soft transition-colors hover:text-royal-700">
                          <CalendarDays size={12} className="shrink-0 text-gold-500" />
                          <span className="truncate">{s.title}</span>
                          <span className="ml-auto shrink-0 font-mono text-[10px]">{fmtDateShort(s.date)} {s.startTime || ''}</span>
                        </Link>
                      ))}
                      {sessions.length > 2 && <p className="text-[11px] font-semibold text-royal-700">+ {sessions.length - 2} autre(s) session(s)</p>}
                    </div>
                  )}
                  <Link to={`/participant/${p.userId}`} className="mt-auto inline-flex items-center gap-1.5 pt-4 text-sm font-bold text-royal-700 transition-all hover:gap-2.5">
                    Voir le profil <ArrowRight size={14} />
                  </Link>
                </article>
              </Reveal>
            );
          })}
        </div>
        {speakers.length === 0 && (
          <p className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-10 text-center text-sm text-soft">
            Aucune personnalité dans cette catégorie pour le moment.
          </p>
        )}
      </div>
    </div>
  );
}

/* ================= PANELS & THÉMATIQUES ================= */
export function PanelsPage() {
  const db = useDb();
  const [sp, setSp] = useSearchParams();
  const activeId = sp.get('topic');
  const active = db.topics.find((tp) => tp.id === activeId);

  const related = useMemo(() => {
    if (!active) return { sessions: [], people: [] as Profile[], speakers: [] as Profile[] };
    const sessions = db.sessions.filter((s) => s.topicId === active.id);
    const speakerIds = new Set<string>();
    sessions.forEach((s) => s.speakerIds.forEach((id) => speakerIds.add(id)));
    const speakers = db.profiles.filter((p) => speakerIds.has(p.id));
    const people = searchProfiles(db, { topicId: active.id }).slice(0, 9);
    return { sessions, speakers, people };
  }, [db, active]);

  if (active) {
    return (
      <div>
        <PageHero kicker="Thématique officielle" title={active.name} desc={active.description} />
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <Link to="/panels" className="mb-6 inline-flex items-center gap-1.5 text-sm font-bold text-royal-700 hover:text-royal-800">
            <ArrowLeft size={15} /> Toutes les thématiques
          </Link>
          <section className="mb-10">
            <h2 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Sessions associées ({related.sessions.length})</h2>
            {related.sessions.length === 0 ? (
              <p className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-6 text-sm text-soft">Les sessions rattachées à cette thématique seront publiées par l’administration FIJADA.</p>
            ) : (
              <div className="space-y-3">
                {related.sessions.map((s) => (
                  <Link key={s.id} to="/programme" className="flex items-center gap-4 rounded-lg border border-line bg-card p-4 transition-all hover:border-royal-200 hover:shadow-md">
                    <CategoryChip c={s.category} />
                    <span className="min-w-0 flex-1 truncate font-display text-sm font-bold text-ink">{s.title}</span>
                    <span className="shrink-0 font-mono text-xs text-soft">{fmtDateShort(s.date)} · {sessionRange(s)}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
          {related.speakers.length > 0 && (
            <section className="mb-10">
              <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase"><Mic2 size={13} /> Intervenants sur cette thématique</h2>
              <div className="flex flex-wrap gap-2.5">
                {related.speakers.map((p) => (
                  <Link key={p.id} to={`/participant/${p.userId}`} className="flex items-center gap-2 rounded-full border border-line bg-card py-1.5 pr-4 pl-1.5 shadow-sm transition-all hover:border-royal-300 hover:shadow-md">
                    <Avatar profile={p} size={30} />
                    <span className="text-[13px] font-bold text-ink">{p.fullName}</span>
                    {p.verification === 'verified' && <BadgeCheck size={13} className="text-forest-600" />}
                  </Link>
                ))}
              </div>
            </section>
          )}
          <section>
            <h2 className="mb-3 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">
              <Users size={13} /> Participants intéressés par cette thématique
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {related.people.map((p) => <ParticipantCard key={p.id} profile={p} db={db} />)}
            </div>
          </section>
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHero kicker="16 thématiques officielles" title="Panels & Thématiques" desc="Les grands axes de travail du Sommet Mondial de la Diplomatie — sélectionnez une thématique pour découvrir ses sessions, intervenants et participants intéressés." />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
          {db.topics.filter((tp) => tp.active).map((tp, i) => {
            const count = db.profiles.filter((p) => p.published && p.topics.includes(tp.id)).length;
            const sessCount = db.sessions.filter((s) => s.topicId === tp.id).length;
            return (
              <Reveal key={tp.id} delay={i * 35}>
                <Link to={`/panels?topic=${tp.id}`} className="group flex h-full flex-col rounded-lg border border-line bg-card p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-royal-200 hover:shadow-md">
                  <p className="font-display text-[15.5px] leading-snug font-bold text-ink group-hover:text-royal-800">{tp.name}</p>
                  <p className="mt-1.5 line-clamp-2 flex-1 text-[13px] leading-relaxed text-soft">{tp.description}</p>
                  <div className="mt-3.5 flex items-center gap-3 border-t border-dashed border-line pt-3 font-mono text-[10.5px] font-semibold tracking-wide text-soft uppercase">
                    <span className="inline-flex items-center gap-1"><Users size={11} className="text-royal-700" />{count} intéressés</span>
                    <span className="inline-flex items-center gap-1"><CalendarDays size={11} className="text-gold-500" />{sessCount} session{sessCount > 1 ? 's' : ''}</span>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </div>
    </div>
  );
}
