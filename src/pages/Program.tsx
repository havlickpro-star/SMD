import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Download, Star, Bell, BellOff, Trash2, AlertTriangle, Clock } from 'lucide-react';
import { useDb, toggleAgenda, setAgendaFlag } from '../lib/db';
import { useAuth } from '../lib/auth';
import { fmtDate, toICS, downloadFile, sessionsOverlap, cx, sessionRange } from '../lib/utils';
import { t } from '../lib/i18n';
import { Btn, Tabs, EmptyState, Reveal, Toggle } from '../components/ui';
import { PageHero, SessionBlock, CategoryChip } from '../components/bits';
import type { Session } from '../lib/types';

const DAYS: Array<{ id: string; date: string; label: string; sub: string }> = [
  { id: 'd0', date: '2026-09-08', label: '08 sept.', sub: 'Pré-sommet' },
  { id: 'd1', date: '2026-09-09', label: '09 sept.', sub: 'Jour 1 · Ouverture' },
  { id: 'd2', date: '2026-09-10', label: '10 sept.', sub: 'Jour 2 · Coopération' },
  { id: 'd3', date: '2026-09-11', label: '11 sept.', sub: 'Jour 3 · Clôture' },
  { id: 'd4', date: '2026-09-12', label: '12 sept.', sub: 'Post-sommet' },
];

export function ProgramPage() {
  const db = useDb();
  const [day, setDay] = useState('d1');
  const current = DAYS.find((x) => x.id === day)!;
  const sessions = useMemo(
    () => db.sessions.filter((s) => s.date === current.date)
      .sort((a, b) => (a.startTime || a.dayPart || '').localeCompare(b.startTime || b.dayPart || '')),
    [db, current],
  );

  return (
    <div>
      <PageHero kicker="08 – 12 septembre 2026 · Kinshasa" title="Programme officiel du Sommet" desc="Cinq journées : pré-sommet, trois jours de travaux officiels et programme post-sommet. Les activités sans horaire officiel sont présentées en programme de journée.">
        <p className="mt-4 max-w-2xl rounded-md border-l-[3px] border-gold-400 bg-white/8 px-4 py-3 text-[13px] leading-relaxed text-white/85 italic">
          {db.event.theme}
        </p>
      </PageHero>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <Tabs
          items={DAYS.map((d) => ({ id: d.id, label: <span className="flex items-center gap-2">{d.label}<span className={cx('hidden rounded-sm px-1.5 py-0.5 font-mono text-[9px] tracking-wider uppercase sm:inline', day === d.id ? 'bg-gold-400 text-navy-900' : 'bg-paper text-soft')}>{d.sub}</span></span> }))}
          active={day}
          onChange={setDay}
        />

        <div className="mt-4 flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl font-extrabold text-navy-900">{fmtDate(current.date)} 2026 — {current.sub}</h2>
          <p className="font-mono text-[11px] tracking-wider text-soft uppercase">{sessions.length} activité(s)</p>
        </div>
        {current.date === '2026-09-08' || current.date === '2026-09-12' ? (
          <p className="mt-2 rounded-md bg-gold-100 px-3.5 py-2.5 text-[12.5px] font-medium text-gold-700">
            Les horaires de cette journée n’ont pas encore été précisés dans le programme officiel — aucune heure n’est donc affichée.
          </p>
        ) : null}

        <div className="mt-5 space-y-3.5">
          {sessions.map((s, i) => (
            <Reveal key={s.id} delay={i * 40}><SessionBlock session={s} db={db} /></Reveal>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ================= MON AGENDA ================= */
export function AgendaPage() {
  const db = useDb();
  const { user } = useAuth();

  const mySessions = useMemo(() => {
    if (!user) return [] as Array<{ s: Session; item: (typeof db.agenda)[number] }>;
    return db.agenda
      .filter((a) => a.userId === user.id)
      .map((a) => ({ s: db.sessions.find((s) => s.id === a.sessionId), item: a }))
      .filter((x): x is { s: Session; item: (typeof db.agenda)[number] } => !!x.s)
      .sort((a, b) => (a.s.date + (a.s.startTime || '99')).localeCompare(b.s.date + (b.s.startTime || '99')));
  }, [db, user]);

  if (!user) return null;

  const conflicts: Array<[Session, Session]> = [];
  for (let i = 0; i < mySessions.length; i++)
    for (let j = i + 1; j < mySessions.length; j++)
      if (sessionsOverlap(mySessions[i].s, mySessions[j].s)) conflicts.push([mySessions[i].s, mySessions[j].s]);

  const exportICS = () => {
    downloadFile('agenda-smd-fijada-2026.ics', toICS(mySessions.map((x) => x.s), 'Kinshasa'), 'text/calendar');
  };

  return (
    <div>
      <PageHero kicker="Mes sessions personnalisées" title="Mon agenda du Sommet" desc="Retrouvez les sessions que vous avez sélectionnées, journée par journée, et exportez-les vers votre calendrier.">
        {mySessions.length > 0 && (
          <Btn variant="gold" className="mt-4" onClick={exportICS}><Download size={15} /> Ajouter à mon calendrier (.ics)</Btn>
        )}
      </PageHero>

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {conflicts.length > 0 && (
          <div className="mb-6 rounded-lg border border-flame-600/30 bg-flame-100 p-4">
            <p className="flex items-center gap-2 font-display text-sm font-bold text-flame-700"><AlertTriangle size={16} /> Chevauchement horaire détecté</p>
            <ul className="mt-2 space-y-1 text-[13px] text-flame-700">
              {conflicts.map(([a, b]) => (
                <li key={a.id + b.id}>• « {a.title} » et « {b.title} » se déroulent en même temps ({fmtDate(a.date)} · {sessionRange(a)}).</li>
              ))}
            </ul>
          </div>
        )}

        {mySessions.length === 0 ? (
          <EmptyState
            icon={<CalendarDays size={24} />}
            title="Votre agenda est vide"
            desc={t('empty.agenda')}
            action={<Link to="/programme"><Btn>Parcourir le programme officiel</Btn></Link>}
          />
        ) : (
          DAYS.map((d) => {
            const list = mySessions.filter((x) => x.s.date === d.date);
            if (!list.length) return null;
            return (
              <section key={d.id} className="mb-8">
                <h2 className="mb-3 flex items-center gap-2.5 font-display text-lg font-extrabold text-navy-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-md bg-navy-900 font-mono text-[10px] text-gold-400">{d.label.split(' ')[0]}</span>
                  {fmtDate(d.date)} — {d.sub}
                </h2>
                <div className="space-y-3">
                  {list.map(({ s, item }) => (
                    <div key={s.id} className={cx('rounded-lg border bg-card p-4 transition-shadow hover:shadow-md', item.notToMiss ? 'border-gold-400' : 'border-line')}>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <CategoryChip c={s.category} />
                            <span className="inline-flex items-center gap-1 font-mono text-xs font-bold text-royal-800"><Clock size={12} />{sessionRange(s)}</span>
                            {s.room && <span className="text-xs text-soft">{s.room}</span>}
                          </div>
                          <p className="mt-1.5 font-display text-[15px] font-bold text-ink">{s.title}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            onClick={() => setAgendaFlag(user.id, s.id, 'notToMiss', !item.notToMiss)}
                            title="À ne pas manquer"
                            aria-label="À ne pas manquer"
                            className={cx('cursor-pointer rounded-md p-2 transition-all hover:scale-110', item.notToMiss ? 'bg-gold-100 text-gold-500' : 'text-soft/40 hover:text-gold-500')}
                          >
                            <Star size={17} fill={item.notToMiss ? 'currentColor' : 'none'} />
                          </button>
                          <button
                            onClick={() => setAgendaFlag(user.id, s.id, 'reminder', !item.reminder)}
                            title={item.reminder ? 'Rappel interne activé' : 'Rappel interne désactivé'}
                            aria-label="Rappel"
                            className={cx('cursor-pointer rounded-md p-2 transition-all hover:scale-110', item.reminder ? 'bg-royal-50 text-royal-700' : 'text-soft/40 hover:text-royal-700')}
                          >
                            {item.reminder ? <Bell size={17} /> : <BellOff size={17} />}
                          </button>
                          <button
                            onClick={() => toggleAgenda(user.id, s.id)}
                            title="Retirer de mon agenda"
                            aria-label="Retirer"
                            className="cursor-pointer rounded-md p-2 text-soft/40 transition-all hover:scale-110 hover:text-flame-600"
                          >
                            <Trash2 size={17} />
                          </button>
                        </div>
                      </div>
                      {item.notToMiss && <p className="mt-2 font-mono text-[10px] font-bold tracking-[0.14em] text-gold-700 uppercase">★ À ne pas manquer · rappel interne {item.reminder ? 'activé' : 'désactivé'}</p>}
                    </div>
                  ))}
                </div>
              </section>
            );
          })
        )}

        {mySessions.length > 0 && (
          <div className="rounded-lg border border-line bg-card p-5">
            <div className="flex items-center gap-3">
              <span className="relative flex h-5.5 w-10 items-center rounded-full bg-forest-600">
                <span className="absolute left-5 h-4.5 w-4.5 rounded-full bg-white shadow" />
              </span>
              <div>
                <p className="text-sm font-bold text-ink">Rappels internes activés</p>
                <p className="text-xs text-soft">Une notification interne vous alertera avant chaque session avec rappel — gérez-les session par session ci-dessus.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
