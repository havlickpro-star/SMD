import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, CalendarDays, Users, Globe2 } from 'lucide-react';
import { useDb, computeStats, searchProfiles, upcomingSessions } from '../lib/db';
import { fmtDateShort, sessionRange, countryOf } from '../lib/utils';
import { t } from '../lib/i18n';
import { Btn, StatCard, Reveal, SectionTitle, Modal } from '../components/ui';
import { ParticipantCard, BadgeMockup, CategoryChip } from '../components/bits';

const TICKER =
  'Kinshasa · République Démocratique du Congo · 08 – 12 septembre 2026 · Centre Culturel et Artistique des Pays d’Afrique · 3e édition · ';

export default function HomePage() {
  const db = useDb();
  const stats = computeStats(db);
  const [countriesOpen, setCountriesOpen] = useState(false);

  const featured = searchProfiles(db, { sort: 'relevance' }).filter((p) => p.featured || p.verification === 'verified').slice(0, 6);
  const highlights = upcomingSessions(db, 4);
  const topicsWithCount = db.topics
    .filter((tp) => tp.active)
    .map((tp) => ({ topic: tp, count: db.profiles.filter((p) => p.published && p.topics.includes(tp.id)).length }))
    .sort((a, b) => b.count - a.count);

  const countryCounts = new Map<string, number>();
  db.profiles.filter((p) => p.published && p.representedCountry).forEach((p) => {
    countryCounts.set(p.representedCountry!, (countryCounts.get(p.representedCountry!) || 0) + 1);
  });
  const countries = [...countryCounts.entries()].sort((a, b) => b[1] - a[1]);

  return (
    <div>
      {/* ============ OUVERTURE : salle des délégations ============ */}
      <section className="bg-globe-hero relative overflow-hidden border-b border-line">
        <div className="bg-dotted pointer-events-none absolute inset-0 opacity-60" />
        <div className="relative mx-auto grid max-w-7xl items-center gap-10 px-4 pt-12 pb-14 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:pt-16 lg:pb-20">
          <div>
            <Reveal>
              <p className="inline-flex items-center gap-2 rounded-full border border-royal-200 bg-card px-3.5 py-1.5 font-mono text-[10.5px] font-semibold tracking-[0.18em] text-royal-800 uppercase">
                <span className="pulse-dot h-1.5 w-1.5 rounded-full bg-forest-600" />
                Sommet Mondial de la Diplomatie · {db.event.edition}
              </p>
            </Reveal>
            <Reveal delay={80}>
              <h1 className="mt-5 font-display text-[34px] leading-[1.04] font-black tracking-tight text-navy-900 sm:text-[52px] lg:text-[58px]">
                Annuaire <span className="text-royal-700">SMD</span> —<br />
                FIJADA <span className="relative inline-block text-gold-500">2026<span className="absolute -bottom-1 left-0 h-1.5 w-full bg-gold-400/50" /></span>
              </h1>
            </Reveal>
            <Reveal delay={140}>
              <p className="mt-5 max-w-xl border-l-[3px] border-gold-400 bg-card/80 px-4 py-3 text-[15px] leading-relaxed font-semibold text-navy-900 shadow-sm">
                {t('app.tagline')}
              </p>
            </Reveal>
            <Reveal delay={200}>
              <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-soft">
                Connectez-vous aux acteurs de la diplomatie, du développement, de l’investissement et de la
                coopération internationale réunis à Kinshasa.
              </p>
            </Reveal>
            <Reveal delay={260}>
              <div className="mt-7 flex flex-wrap items-center gap-3">
                <Link to="/annuaire"><Btn size="lg">{t('cta.explore')} <ArrowRight size={16} /></Btn></Link>
                <Link to="/programme"><Btn size="lg" variant="outline">{t('cta.program')} <CalendarDays size={16} /></Btn></Link>
              </div>
            </Reveal>
            <Reveal delay={320}>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 font-mono text-[11px] font-medium tracking-[0.12em] text-soft uppercase">
                <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} className="text-royal-700" /> 08 – 12 sept. 2026</span>
                <span className="inline-flex items-center gap-1.5"><MapPin size={13} className="text-royal-700" /> Kinshasa · RDC</span>
                <span className="inline-flex items-center gap-1.5"><Globe2 size={13} className="text-royal-700" /> {stats.countries} pays représentés</span>
              </div>
            </Reveal>
          </div>
          <Reveal delay={200} className="hidden justify-center lg:flex">
            <div className="relative">
              <div className="bg-dotted absolute -inset-10 -z-10 rounded-full opacity-70" />
              <BadgeMockup />
            </div>
          </Reveal>
        </div>
        {/* ruban défilant */}
        <div className="relative border-y border-navy-900/20 bg-gold-400 py-2 text-navy-900">
          <div className="animate-marquee flex w-max font-mono text-[11px] font-bold tracking-[0.22em] uppercase">
            <span className="pr-2">{TICKER.repeat(3)}</span>
            <span className="pr-2">{TICKER.repeat(3)}</span>
          </div>
        </div>
      </section>

      {/* ============ Statistiques officielles (base réelle) ============ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionTitle kicker="En chiffres" title="Qui est présent au Sommet ?" desc="Statistiques calculées en temps réel depuis l’annuaire officiel — aucune donnée fictive." />
        <Reveal>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <StatCard label="Participants inscrits" value={stats.participants} accent="bg-royal-700" />
            <StatCard label="Profils vérifiés" value={stats.verified} accent="bg-forest-600" />
            <StatCard label="Pays représentés" value={stats.countries} accent="bg-gold-400" />
            <StatCard label="Organisations" value={stats.organizations} accent="bg-tealx-700" />
            <StatCard label="Intervenants officiels" value={stats.speakers} accent="bg-flame-600" />
          </div>
        </Reveal>
        <Reveal delay={100}>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <Btn variant="outline" size="sm" onClick={() => setCountriesOpen(true)}><Globe2 size={14} /> Voir les pays représentés</Btn>
            <Link to="/annuaire" className="inline-flex items-center gap-1 text-sm font-bold text-royal-700 hover:text-royal-800">
              Explorer les participants <ArrowRight size={14} />
            </Link>
          </div>
        </Reveal>
      </section>

      {/* ============ Profils à découvrir ============ */}
      <section className="border-y border-line bg-card/60">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
          <SectionTitle
            kicker="À découvrir"
            title="Profils mis en avant"
            desc="Délégations, intervenants et partenaires vérifiés par l’administration FIJADA."
            right={<Link to="/annuaire" className="inline-flex items-center gap-1 text-sm font-bold text-royal-700 hover:gap-2 transition-all">Tout l’annuaire <ArrowRight size={14} /></Link>}
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((p, i) => (
              <Reveal key={p.id} delay={i * 60}><ParticipantCard profile={p} db={db} /></Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============ Prochains temps forts ============ */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
        <SectionTitle
          kicker="Programme officiel"
          title="Prochains temps forts"
          desc="Les sessions à venir du Sommet, du pré-sommet du 08 septembre au post-sommet du 12 septembre."
          right={<Link to="/programme" className="inline-flex items-center gap-1 text-sm font-bold text-royal-700 transition-all hover:gap-2">Programme complet <ArrowRight size={14} /></Link>}
        />
        <div className="grid gap-3 md:grid-cols-2">
          {highlights.map((s, i) => (
            <Reveal key={s.id} delay={i * 60}>
              <Link to="/programme" className="group flex h-full items-start gap-4 rounded-lg border border-line bg-card p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-royal-200 hover:shadow-md">
                <div className="flex h-14 w-14 shrink-0 flex-col items-center justify-center rounded-md bg-navy-900 text-white">
                  <span className="font-mono text-[9px] tracking-widest text-gold-400 uppercase">{fmtDateShort(s.date).split(' ')[1]}</span>
                  <span className="font-display text-xl leading-none font-extrabold">{fmtDateShort(s.date).split(' ')[0]}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CategoryChip c={s.category} />
                    <span className="font-mono text-[11px] font-bold text-royal-800">{sessionRange(s)}</span>
                  </div>
                  <p className="mt-1 line-clamp-2 font-display text-[14.5px] leading-snug font-bold text-ink group-hover:text-royal-800">{s.title}</p>
                  {s.room && <p className="mt-0.5 text-xs text-soft">{s.room} · {s.location}</p>}
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ============ Panels & thématiques ============ */}
      <section className="border-y border-line bg-navy-900 text-white">
        <div className="bg-dotted-light">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <p className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-gold-400 uppercase">
                  <span className="inline-block h-[2px] w-6 bg-gold-400" />16 thématiques officielles
                </p>
                <h2 className="font-display text-[22px] font-extrabold sm:text-[26px]">Panels & centres d’intérêt</h2>
              </div>
              <Link to="/panels" className="inline-flex items-center gap-1 text-sm font-bold text-gold-400 transition-all hover:gap-2">Toutes les thématiques <ArrowRight size={14} /></Link>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              {topicsWithCount.slice(0, 12).map(({ topic, count }, i) => (
                <Reveal key={topic.id} delay={i * 40}>
                  <Link to={`/panels?topic=${topic.id}`} className="group flex items-center justify-between gap-2 rounded-md border border-white/12 bg-white/4 px-4 py-3 transition-all duration-200 hover:border-gold-400/60 hover:bg-white/8">
                    <span className="text-[13.5px] font-semibold text-white/90 group-hover:text-white">{topic.name}</span>
                    <span className="flex shrink-0 items-center gap-1 font-mono text-[10.5px] text-gold-400"><Users size={11} />{count}</span>
                  </Link>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ============ CTA final ============ */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <Reveal>
          <div className="relative overflow-hidden rounded-xl border border-line bg-card p-8 sm:p-10">
            <div className="flag-bar absolute inset-x-0 top-0 h-1.5" />
            <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
              <div>
                <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-royal-700 uppercase">Rejoignez le réseau officiel</p>
                <h2 className="mt-2 font-display text-[24px] leading-tight font-extrabold text-navy-900 sm:text-[30px]">
                  Vous participez au Sommet ?<br className="hidden sm:block" /> Créez votre profil en quelques minutes.
                </h2>
                <p className="mt-2 max-w-xl text-sm text-soft">
                  Identification des délégations, mises en relation, agenda personnalisé et QR code de badge —
                  l’annuaire prolonge l’expérience du Sommet avant, pendant et après Kinshasa.
                </p>
              </div>
              <div className="flex shrink-0 flex-col gap-2.5 sm:flex-row">
                <Link to="/inscription"><Btn size="lg" variant="gold">Créer mon profil</Btn></Link>
                <Link to="/a-propos"><Btn size="lg" variant="outline">À propos du Sommet</Btn></Link>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* ============ Modal pays représentés ============ */}
      <Modal open={countriesOpen} onClose={() => setCountriesOpen(false)} title="Pays représentés au Sommet" wide>
        <p className="mb-4 text-sm text-soft">{countries.length} pays et territoires comptent au moins un participant inscrit dans l’annuaire.</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {countries.map(([code, count]) => {
            const c = countryOf(code);
            return (
              <div key={code} className="flex items-center justify-between gap-2 rounded-md border border-line bg-paper px-3 py-2.5 transition-colors hover:border-royal-300">
                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold text-ink">
                  <span aria-hidden className="text-lg leading-none">{c?.flag}</span>
                  <span className="truncate">{c?.name || code}</span>
                </span>
                <span className="flex shrink-0 items-center gap-1 rounded-full bg-royal-50 px-2 py-0.5 font-mono text-[10.5px] font-bold text-royal-800">
                  <Users size={10.5} />{count}
                </span>
              </div>
            );
          })}
        </div>
      </Modal>
    </div>
  );
}
