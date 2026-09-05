import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal, LayoutGrid, List, ChevronDown, X } from 'lucide-react';
import { useDb, searchProfiles, type DirectoryQuery } from '../lib/db';
import { COUNTRIES, cx } from '../lib/utils';
import { PageHero, ParticipantCard } from '../components/bits';
import { Btn, Input, Select, EmptyState, CardSkeleton } from '../components/ui';
import { t } from '../lib/i18n';

const PAGE = 12;

export default function DirectoryPage() {
  const db = useDb();
  const [sp, setSp] = useSearchParams();
  const [q, setQ] = useState(sp.get('q') || '');
  const [loading, setLoading] = useState(true);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [view, setView] = useState<'cards' | 'compact'>('cards');
  const [limit, setLimit] = useState(PAGE);
  const [f, setF] = useState<DirectoryQuery>({
    country: sp.get('country') || '', residenceCountry: '', city: '', typeId: sp.get('type') || '',
    sectorId: sp.get('sector') || '', organization: '', topicId: sp.get('topic') || '',
    verifiedOnly: sp.get('verified') === '1', speakersOnly: sp.get('speakers') === '1', sort: 'relevance',
  });

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 450);
    return () => clearTimeout(timer);
  }, []);
  useEffect(() => setLimit(PAGE), [q, f]);

  const results = useMemo(() => searchProfiles(db, { ...f, q }), [db, q, f]);
  const shown = results.slice(0, limit);
  const activeFilters = [f.country, f.residenceCountry, f.city, f.typeId, f.sectorId, f.organization, f.topicId].filter(Boolean).length + (f.verifiedOnly ? 1 : 0) + (f.speakersOnly ? 1 : 0);

  const reset = () => {
    setF({ country: '', residenceCountry: '', city: '', typeId: '', sectorId: '', organization: '', topicId: '', verifiedOnly: false, speakersOnly: false, sort: 'relevance' });
    setQ('');
    setSp({});
  };

  return (
    <div>
      <PageHero kicker="Annuaire officiel" title="Les participants du Sommet" desc="Recherchez par nom, fonction, organisation, pays, secteur ou centre d’intérêt — accents et casse ignorés.">
        <div className="relative mt-5 max-w-2xl">
          <Search size={18} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-soft" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Essayer : Congo, transition numerique, ambassade, investisseur, FIJADA…"
            className="py-3.5 pr-10 pl-11 text-[15px] shadow-lg shadow-navy-950/20"
            aria-label="Rechercher un participant"
          />
          {q && (
            <button onClick={() => setQ('')} aria-label="Effacer" className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer text-soft hover:text-ink"><X size={16} /></button>
          )}
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* barre outils */}
        <div className="mb-5 flex flex-wrap items-center gap-2.5">
          <Btn variant={filtersOpen ? 'navy' : 'outline'} size="sm" onClick={() => setFiltersOpen((v) => !v)}>
            <SlidersHorizontal size={14} /> Filtres {activeFilters > 0 && <span className="rounded-full bg-gold-400 px-1.5 font-mono text-[10px] font-bold text-navy-900">{activeFilters}</span>}
            <ChevronDown size={13} className={cx('transition-transform', filtersOpen && 'rotate-180')} />
          </Btn>
          <Select value={f.sort} onChange={(e) => setF({ ...f, sort: e.target.value as any })} className="w-auto py-1.5 text-[13px]" aria-label="Trier">
            <option value="relevance">Tri : pertinence</option>
            <option value="alpha">Ordre alphabétique</option>
            <option value="recent">Récemment inscrits</option>
            <option value="verified">Profils vérifiés</option>
            <option value="speakers">Intervenants officiels</option>
          </Select>
          <p className="ml-auto font-mono text-[11.5px] tracking-wide text-soft uppercase">
            <strong className="text-royal-800">{results.length}</strong> profil{results.length > 1 ? 's' : ''}
          </p>
          <div className="flex overflow-hidden rounded-md border border-line">
            <button onClick={() => setView('cards')} aria-label="Vue cartes" className={cx('cursor-pointer p-2 transition-colors', view === 'cards' ? 'bg-navy-900 text-white' : 'bg-card text-soft hover:text-royal-700')}><LayoutGrid size={15} /></button>
            <button onClick={() => setView('compact')} aria-label="Vue compacte" className={cx('cursor-pointer p-2 transition-colors', view === 'compact' ? 'bg-navy-900 text-white' : 'bg-card text-soft hover:text-royal-700')}><List size={15} /></button>
          </div>
        </div>

        {/* filtres */}
        {filtersOpen && (
          <div className="toast-in mb-6 grid gap-4 rounded-lg border border-line bg-card p-5 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block">
              <span className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.14em] text-soft uppercase">Pays représenté</span>
              <Select value={f.country} onChange={(e) => setF({ ...f, country: e.target.value })}>
                <option value="">Tous</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.14em] text-soft uppercase">Pays de résidence</span>
              <Select value={f.residenceCountry} onChange={(e) => setF({ ...f, residenceCountry: e.target.value })}>
                <option value="">Tous</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.14em] text-soft uppercase">Type de participant</span>
              <Select value={f.typeId} onChange={(e) => setF({ ...f, typeId: e.target.value })}>
                <option value="">Tous</option>
                {db.participantTypes.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.14em] text-soft uppercase">Secteur</span>
              <Select value={f.sectorId} onChange={(e) => setF({ ...f, sectorId: e.target.value })}>
                <option value="">Tous</option>
                {db.sectors.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.14em] text-soft uppercase">Panel / centre d’intérêt</span>
              <Select value={f.topicId} onChange={(e) => setF({ ...f, topicId: e.target.value })}>
                <option value="">Tous</option>
                {db.topics.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.14em] text-soft uppercase">Organisation</span>
              <Input value={f.organization} onChange={(e) => setF({ ...f, organization: e.target.value })} placeholder="FIJADA, ministère…" />
            </label>
            <label className="block">
              <span className="mb-1 block font-mono text-[10.5px] font-medium tracking-[0.14em] text-soft uppercase">Ville</span>
              <Input value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} placeholder="Kinshasa…" />
            </label>
            <div className="flex items-end gap-4">
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink">
                <input type="checkbox" checked={!!f.verifiedOnly} onChange={(e) => setF({ ...f, verifiedOnly: e.target.checked })} className="h-4 w-4 accent-[#157A4E]" /> Vérifiés
              </label>
              <label className="flex cursor-pointer items-center gap-2 text-[13px] font-semibold text-ink">
                <input type="checkbox" checked={!!f.speakersOnly} onChange={(e) => setF({ ...f, speakersOnly: e.target.checked })} className="h-4 w-4 accent-[#153B8E]" /> Intervenants
              </label>
            </div>
            <div className="sm:col-span-2 lg:col-span-4">
              <Btn variant="ghost" size="sm" onClick={reset}><X size={13} /> Réinitialiser les filtres</Btn>
            </div>
          </div>
        )}

        {/* résultats */}
        {loading ? (
          <div className={cx('grid gap-4', view === 'cards' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1')}>
            {Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} />)}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            title={t('empty.search')}
            desc="Essayez d’élargir vos critères : « Congo », « investisseur », « transition numerique » (sans accent)…"
            action={<Btn variant="outline" onClick={reset}>Réinitialiser la recherche</Btn>}
          />
        ) : view === 'cards' ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {shown.map((p) => <ParticipantCard key={p.id} profile={p} db={db} />)}
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map((p) => <ParticipantCard key={p.id} profile={p} db={db} compact />)}
          </div>
        )}

        {!loading && results.length > limit && (
          <div className="mt-8 flex justify-center">
            <Btn variant="outline" onClick={() => setLimit((l) => l + PAGE)}>
              Charger plus ({results.length - limit} restants)
            </Btn>
          </div>
        )}
      </div>
    </div>
  );
}
