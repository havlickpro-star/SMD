import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Globe2, Eye, EyeOff, Lock, Users } from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useDb, updateProfile, updateContacts, publishProfile } from '../lib/db';
import { COUNTRIES, countryName, cx, completeness } from '../lib/utils';
import { Btn, Field, Input, Select, Textarea, useToast } from '../components/ui';
import { Logo, Avatar, CountryBadge, VerificationTag } from '../components/bits';

const STEPS = ['Identité', 'Profil professionnel', 'Présentation', 'Coordonnées', 'Centres d’intérêt', 'Confidentialité', 'Validation'];

export default function OnboardingPage() {
  const { user, profile, contacts } = useAuth();
  const db = useDb();
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState(0);

  const [d, setD] = useState(() => ({
    firstName: profile?.firstName || '', lastName: profile?.lastName || '',
    fullName: profile?.fullName || '', civility: profile?.civility || '',
    title: profile?.title || '', organization: profile?.organization || '',
    participantTypeId: profile?.participantTypeId || '', sectorId: profile?.sectorId || '',
    representedCountry: profile?.representedCountry || '', residenceCountry: profile?.residenceCountry || '',
    city: profile?.city || '', shortBio: profile?.shortBio || '', biography: profile?.biography || '',
    phone: contacts?.phone || '', whatsapp: contacts?.whatsapp || '', fax: contacts?.fax || '',
    proEmail: contacts?.proEmail || user?.email || '', linkedin: contacts?.linkedin || '', website: contacts?.website || '',
    phoneVis: contacts?.phoneVis || 'connected', whatsappVis: contacts?.whatsappVis || 'connected',
    faxVis: contacts?.faxVis || 'private', emailVis: contacts?.emailVis || 'public',
    linkedinVis: contacts?.linkedinVis || 'public', websiteVis: contacts?.websiteVis || 'public',
    topics: profile?.topics || ([] as string[]),
  }));
  const [errs, setErrs] = useState<string[]>([]);

  const computedFull = useMemo(() => `${d.firstName} ${d.lastName}`.trim(), [d.firstName, d.lastName]);
  const set = (patch: Partial<typeof d>) => setD((x) => ({ ...x, ...patch }));

  const saveStep = (next: number) => {
    if (!profile) return;
    const errors: string[] = [];
    if (step === 0) {
      if (!d.firstName.trim()) errors.push('Le prénom est requis.');
      if (!d.lastName.trim()) errors.push('Le nom est requis.');
    }
    if (step === 1) {
      if (!d.title.trim()) errors.push('La fonction est requise.');
      if (!d.organization.trim()) errors.push('L’organisation est requise.');
      if (!d.representedCountry) errors.push('Le pays représenté est requis.');
    }
    if (step === 2 && d.shortBio.length > 250) errors.push('La présentation courte dépasse 250 caractères.');
    if (errors.length) return setErrs(errors);
    setErrs([]);

    updateProfile(profile.id, {
      firstName: d.firstName.trim(), lastName: d.lastName.trim(),
      fullName: (d.fullName.trim() || computedFull), civility: d.civility || undefined,
      title: d.title.trim(), organization: d.organization.trim(),
      participantTypeId: d.participantTypeId || undefined, sectorId: d.sectorId || undefined,
      representedCountry: d.representedCountry || undefined, residenceCountry: d.residenceCountry || undefined,
      city: d.city.trim() || undefined, shortBio: d.shortBio, biography: d.biography, topics: d.topics,
    });
    updateContacts(profile.id, {
      phone: d.phone, whatsapp: d.whatsapp, fax: d.fax, proEmail: d.proEmail,
      linkedin: d.linkedin, website: d.website,
      phoneVis: d.phoneVis, whatsappVis: d.whatsappVis, faxVis: d.faxVis,
      emailVis: d.emailVis, linkedinVis: d.linkedinVis, websiteVis: d.websiteVis,
    } as any);
    setStep(next);
    window.scrollTo(0, 0);
  };

  const publish = () => {
    if (!profile) return;
    saveStep(6);
    publishProfile(profile.id);
    toast.push('success', 'Profil publié ! Il est maintenant soumis à vérification par l’administration FIJADA.');
    nav('/profil');
  };

  if (!user || !profile) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-4 text-center">
        <Logo />
        <p className="text-sm text-soft">Connectez-vous pour compléter votre profil officiel.</p>
        <Btn onClick={() => nav('/connexion')}>Se connecter</Btn>
      </div>
    );
  }

  const visOptions = [
    { v: 'public', label: 'Visible par tous les participants connectés', icon: <Eye size={13} /> },
    { v: 'connected', label: 'Visible après mise en relation acceptée', icon: <EyeOff size={13} /> },
    { v: 'private', label: 'Privé — jamais visible', icon: <Lock size={13} /> },
  ];

  return (
    <div className="bg-globe-hero min-h-screen">
      <header className="border-b border-line bg-navy-900">
        <div className="mx-auto flex h-16 max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo light small />
          <span className="font-mono text-[11px] tracking-[0.18em] text-white/70 uppercase">Assistant de profil · Étape {step + 1}/7</span>
        </div>
      </header>
      <div className="flag-bar h-1" />

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {/* barre de progression */}
        <div className="mb-8 flex items-center gap-1.5" role="progressbar" aria-valuenow={step + 1} aria-valuemin={1} aria-valuemax={7}>
          {STEPS.map((s, i) => (
            <button key={s} onClick={() => i < step && setStep(i)} className={cx('group flex-1 cursor-pointer', i > step && 'cursor-default')} title={s}>
              <span className={cx('block h-1.5 rounded-full transition-all duration-300', i < step ? 'bg-forest-600' : i === step ? 'bg-gold-400' : 'bg-line group-hover:bg-royal-200')} />
              <span className={cx('mt-1.5 hidden text-[10px] font-bold tracking-wide uppercase sm:block', i === step ? 'text-royal-800' : 'text-soft/60')}>{s}</span>
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-line bg-card p-6 shadow-lg shadow-royal-900/5 sm:p-8">
          <h1 className="font-display text-[22px] font-extrabold text-navy-900">{STEPS[step]}</h1>

          {errs.length > 0 && (
            <div className="mt-3 rounded-md bg-flame-100 px-4 py-3 text-[13px] font-semibold text-flame-700">
              {errs.map((e) => <p key={e}>• {e}</p>)}
            </div>
          )}

          {/* ÉTAPE 1 — Identité */}
          {step === 0 && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-4 rounded-lg border border-dashed border-line bg-paper p-4">
                <Avatar profile={{ ...profile, firstName: d.firstName || 'S', lastName: d.lastName || 'M' } as any} size={64} />
                <div>
                  <p className="text-sm font-bold text-ink">Photo de profil</p>
                  <p className="text-xs text-soft">V1 : avatar institutionnel généré automatiquement à partir de vos initiales (les photos seront activées après modération).</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-[120px_1fr_1fr]">
                <Field label="Civilité" hint="Optionnel">
                  <Select value={d.civility} onChange={(e) => set({ civility: e.target.value })}>
                    <option value="">—</option><option value="M.">M.</option><option value="Mme">Mme</option><option value="Dr">Dr</option><option value="Pr">Pr</option><option value="Exc.">Exc.</option>
                  </Select>
                </Field>
                <Field label="Prénom" required><Input value={d.firstName} onChange={(e) => set({ firstName: e.target.value })} placeholder="Amina" /></Field>
                <Field label="Nom" required><Input value={d.lastName} onChange={(e) => set({ lastName: e.target.value })} placeholder="Diallo" /></Field>
              </div>
              <Field label="Nom complet" hint={`Calculé : ${computedFull || '—'} (modifiable)`}>
                <Input value={d.fullName || computedFull} onChange={(e) => set({ fullName: e.target.value })} />
              </Field>
              <p className="rounded-md bg-royal-50 px-3 py-2.5 text-[13px] text-royal-800">
                Nom d’utilisateur : <strong className="font-mono">@{user.username}</strong> — il figure dans votre QR code et le lien de votre profil.
              </p>
            </div>
          )}

          {/* ÉTAPE 2 — Profil professionnel */}
          {step === 1 && (
            <div className="mt-6 space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Fonction" required><Input value={d.title} onChange={(e) => set({ title: e.target.value })} placeholder="Directrice de la Coopération" /></Field>
                <Field label="Organisation / Institution" required><Input value={d.organization} onChange={(e) => set({ organization: e.target.value })} placeholder="Ministère, ONG, entreprise…" /></Field>
                <Field label="Type de participant">
                  <Select value={d.participantTypeId} onChange={(e) => set({ participantTypeId: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {db.participantTypes.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </Select>
                </Field>
                <Field label="Secteur d’activité">
                  <Select value={d.sectorId} onChange={(e) => set({ sectorId: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {db.sectors.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
                  </Select>
                </Field>
                <Field label="Pays représenté" required>
                  <Select value={d.representedCountry} onChange={(e) => set({ representedCountry: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </Select>
                </Field>
                <Field label="Pays de résidence">
                  <Select value={d.residenceCountry} onChange={(e) => set({ residenceCountry: e.target.value })}>
                    <option value="">— Sélectionner —</option>
                    {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="Ville de résidence"><Input value={d.city} onChange={(e) => set({ city: e.target.value })} placeholder="Kinshasa" /></Field>
              {d.representedCountry && (
                <p className="flex items-center gap-2 text-sm text-soft"><Globe2 size={14} className="text-royal-700" /> Vous représenterez : <CountryBadge code={d.representedCountry} /></p>
              )}
            </div>
          )}

          {/* ÉTAPE 3 — Présentation */}
          {step === 2 && (
            <div className="mt-6 space-y-5">
              <Field label="Présentation courte" hint="Affichée sur les cartes de l’annuaire" required>
                <Textarea max={250} value={d.shortBio} onChange={(e) => set({ shortBio: e.target.value })} placeholder="Une phrase qui vous présente aux délégations…" />
              </Field>
              <Field label="Biographie" hint="Affichée sur votre profil détaillé">
                <Textarea max={2000} value={d.biography} onChange={(e) => set({ biography: e.target.value })} rows={7} placeholder="Parcours, responsabilités, domaines d’expertise…" className="min-h-[160px]" />
              </Field>
            </div>
          )}

          {/* ÉTAPE 4 — Coordonnées */}
          {step === 3 && (
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="Téléphone professionnel"><Input value={d.phone} onChange={(e) => set({ phone: e.target.value })} placeholder="+243 …" /></Field>
              <Field label="WhatsApp" hint="Optionnel"><Input value={d.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} placeholder="+243 …" /></Field>
              <Field label="Fax" hint="Optionnel"><Input value={d.fax} onChange={(e) => set({ fax: e.target.value })} placeholder="+243 …" /></Field>
              <Field label="E-mail professionnel"><Input type="email" value={d.proEmail} onChange={(e) => set({ proEmail: e.target.value })} /></Field>
              <Field label="LinkedIn"><Input value={d.linkedin} onChange={(e) => set({ linkedin: e.target.value })} placeholder="linkedin.com/in/…" /></Field>
              <Field label="Site web / portfolio"><Input value={d.website} onChange={(e) => set({ website: e.target.value })} placeholder="https://…" /></Field>
              <p className="rounded-md bg-paper px-3 py-2.5 text-xs leading-relaxed text-soft sm:col-span-2">
                Vos coordonnées restent masquées par défaut dans l’annuaire. Vous définissez leur visibilité à l’étape suivante.
              </p>
            </div>
          )}

          {/* ÉTAPE 5 — Centres d'intérêt */}
          {step === 4 && (
            <div className="mt-6">
              <p className="mb-4 flex items-center gap-2 text-sm text-soft"><Users size={15} className="text-royal-700" /> Sélectionnez les panels et thématiques qui correspondent à vos intérêts — {d.topics.length} sélectionné(s).</p>
              <div className="grid gap-2 sm:grid-cols-2">
                {db.topics.filter((tp) => tp.active).map((tp) => {
                  const on = d.topics.includes(tp.id);
                  return (
                    <button
                      key={tp.id}
                      type="button"
                      onClick={() => set({ topics: on ? d.topics.filter((x) => x !== tp.id) : [...d.topics, tp.id] })}
                      className={cx(
                        'flex cursor-pointer items-start justify-between gap-2 rounded-md border px-3.5 py-2.5 text-left transition-all duration-150',
                        on ? 'border-royal-500 bg-royal-50 shadow-sm' : 'border-line bg-white hover:border-royal-300',
                      )}
                    >
                      <span>
                        <span className={cx('block text-sm font-bold', on ? 'text-royal-800' : 'text-ink')}>{tp.name}</span>
                        <span className="mt-0.5 line-clamp-1 block text-[11.5px] text-soft">{tp.description}</span>
                      </span>
                      <span className={cx('mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors', on ? 'border-royal-600 bg-royal-600 text-white' : 'border-line text-transparent')}>
                        <Check size={12} strokeWidth={3} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* ÉTAPE 6 — Confidentialité */}
          {step === 5 && (
            <div className="mt-6 space-y-3">
              <p className="text-sm text-soft">Pour chaque coordonnée, choisissez qui peut la consulter. Ces réglages restent modifiables à tout moment.</p>
              {([
                ['Téléphone', 'phoneVis'], ['WhatsApp', 'whatsappVis'], ['E-mail professionnel', 'emailVis'],
                ['Fax', 'faxVis'], ['LinkedIn', 'linkedinVis'], ['Site web', 'websiteVis'],
              ] as Array<[string, keyof typeof d]>).map(([label, key]) => (
                <div key={key} className="rounded-lg border border-line bg-white p-4">
                  <p className="mb-2.5 text-sm font-bold text-ink">{label}</p>
                  <div className="grid gap-1.5 sm:grid-cols-3">
                    {visOptions.map((o) => (
                      <button
                        key={o.v}
                        type="button"
                        onClick={() => set({ [key]: o.v } as any)}
                        className={cx(
                          'flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[11.5px] font-semibold transition-all',
                          d[key] === o.v ? 'border-royal-500 bg-royal-50 text-royal-800' : 'border-line text-soft hover:border-royal-300',
                        )}
                      >
                        {o.icon}{o.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ÉTAPE 7 — Validation */}
          {step === 6 && (
            <div className="mt-6">
              <p className="mb-4 text-sm text-soft">Vérifiez l’aperçu de votre profil avant publication. Après publication, votre profil passera en vérification auprès de l’administration FIJADA.</p>
              <div className="overflow-hidden rounded-lg border border-line">
                <div className="flex items-center gap-4 bg-navy-900 p-5 text-white">
                  <Avatar profile={{ ...profile, firstName: d.firstName, lastName: d.lastName } as any} size={64} ring />
                  <div>
                    <p className="font-display text-lg font-extrabold">{d.fullName || computedFull || '—'}</p>
                    <p className="text-sm text-white/80">{d.title || '—'} · {d.organization || '—'}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-white/70">
                      <CountryBadge code={d.representedCountry} prefix="Représente" />
                      <VerificationTag v="pending" />
                    </div>
                  </div>
                </div>
                <div className="space-y-2 p-5 text-sm">
                  <p><span className="font-mono text-[10.5px] tracking-wider text-soft uppercase">Type</span><br />{db.participantTypes.find((x) => x.id === d.participantTypeId)?.name || '—'}</p>
                  <p><span className="font-mono text-[10.5px] tracking-wider text-soft uppercase">Secteur</span><br />{db.sectors.find((x) => x.id === d.sectorId)?.name || '—'} · {countryName(d.residenceCountry)} {d.city ? `· ${d.city}` : ''}</p>
                  {d.shortBio && <p className="rounded-md bg-paper px-3 py-2 text-[13px] text-ink">{d.shortBio}</p>}
                  <p><span className="font-mono text-[10.5px] tracking-wider text-soft uppercase">Centres d’intérêt</span><br />
                    <span className="mt-1 flex flex-wrap gap-1.5">
                      {d.topics.map((tid) => <span key={tid} className="rounded-full bg-royal-50 px-2 py-0.5 text-[11px] font-bold text-royal-800">{db.topics.find((x) => x.id === tid)?.name}</span>)}
                    </span>
                  </p>
                  <p className="text-xs text-soft">Complétude estimée : {completeness({ ...profile, ...d } as any, undefined)} %</p>
                </div>
              </div>
            </div>
          )}

          {/* navigation */}
          <div className="mt-8 flex items-center justify-between gap-3 border-t border-line pt-5">
            <Btn variant="ghost" onClick={() => (step === 0 ? nav(user ? '/profil' : '/') : setStep(step - 1))} disabled={false}>
              <ArrowLeft size={15} /> {step === 0 ? 'Plus tard' : 'Précédent'}
            </Btn>
            {step < 6 ? (
              <Btn onClick={() => saveStep(step + 1)}>Continuer <ArrowRight size={15} /></Btn>
            ) : (
              <Btn variant="gold" size="lg" onClick={publish}><Check size={16} /> Publier mon profil</Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
