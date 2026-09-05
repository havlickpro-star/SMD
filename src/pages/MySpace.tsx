import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  QrCode, UserPlus, Users, Star, CalendarDays, ArrowRight, Download, Trash2, LogOut,
  Share2, Mail, MessageCircle, Copy, ShieldCheck, Eye, EyeOff, Lock, Pencil, Bell, Megaphone, Wallet,
} from 'lucide-react';
import {
  useDb, updateProfile, updateContacts, deleteAccount, exportUserData,
  toggleFavorite, upcomingSessions, computeStats,
} from '../lib/db';
import { useAuth } from '../lib/auth';
import { completeness, cx, profileUrl, copyText, downloadFile, fmtDate, sessionRange, COUNTRIES, initialsOf } from '../lib/utils';
import { t } from '../lib/i18n';
import { Btn, Field, Input, Select, Textarea, StatCard, ProgressBar, Modal, EmptyState, useToast, Reveal } from '../components/ui';
import { Avatar, PageHero, QRBlock, VerificationTag, ParticipantCard, BadgeChips, SessionBlock } from '../components/bits';
import type { Profile, Visibility } from '../lib/types';

/* ================= TABLEAU DE BORD ================= */
export function DashboardPage() {
  const db = useDb();
  const { user, profile, contacts } = useAuth();
  if (!user || !profile) return null;

  const comp = completeness(profile, contacts || undefined);
  const requests = db.requests.filter((r) => r.receiverId === user.id && r.status === 'pending').length;
  const contactCount = db.requests.filter((r) => r.status === 'accepted' && (r.senderId === user.id || r.receiverId === user.id)).length;
  const favCount = db.favorites.filter((f) => f.userId === user.id).length;
  const myAgenda = db.agenda.filter((a) => a.userId === user.id);
  const next = myAgenda.length
    ? db.sessions.filter((s) => myAgenda.some((a) => a.sessionId === s.id)).sort((a, b) => (a.date + (a.startTime || '')).localeCompare(b.date + (b.startTime || '')))[0]
    : upcomingSessions(db, 1)[0];
  const notifs = db.notifications.filter((n) => n.userId === user.id).slice(0, 4);
  const announcements = db.announcements.slice(0, 2);

  const reco = useMemo(() => {
    const speakerIds = new Set<string>();
    db.sessions.forEach((s) => s.speakerIds.forEach((id) => speakerIds.add(id)));
    return db.profiles
      .filter((p) => p.published && p.userId !== user.id && p.firstName)
      .map((p) => {
        let score = 0;
        if (p.representedCountry && p.representedCountry === profile.representedCountry) score += 3;
        score += p.topics.filter((x) => profile.topics.includes(x)).length * 2;
        if (p.verification === 'verified') score += 1;
        if (speakerIds.has(p.id)) score += 1;
        return { p, score };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map((x) => x.p);
  }, [db, user, profile]);

  return (
    <div>
      <PageHero kicker={`@${user.username}`} title={`Bonjour, ${profile.firstName || user.username}`} desc="Votre espace personnel du Sommet Mondial de la Diplomatie — profil, agenda, réseau et notifications.">
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <VerificationTag v={profile.verification} />
          <BadgeChips badges={profile.badges} />
        </div>
      </PageHero>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        {/* cartes statut */}
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Statut du profil" value={<span className="text-[16px]">{profile.verification === 'verified' ? 'Vérifié SMD' : profile.verification === 'pending' ? 'En vérification' : 'Non vérifié'}</span>} accent={profile.verification === 'verified' ? 'bg-forest-600' : 'bg-gold-400'} sub="Attribué par l’administration FIJADA" />
          <div className="relative overflow-hidden rounded-lg border border-line bg-card p-4">
            <div className={cx('absolute inset-x-0 top-0 h-1', comp >= 100 ? 'bg-forest-600' : 'bg-royal-700')} />
            <p className="font-mono text-[10.5px] font-medium tracking-[0.16em] text-soft uppercase">Complétude du profil</p>
            <p className="mt-1.5 font-display text-[26px] leading-none font-extrabold text-ink">{comp} %</p>
            <div className="mt-2"><ProgressBar value={comp} /></div>
          </div>
          <StatCard label="Demandes reçues" value={requests} accent="bg-flame-600" sub="En attente de votre réponse" />
          <StatCard label="Contacts SMD" value={contactCount} accent="bg-tealx-700" sub={`${favCount} favori${favCount > 1 ? 's' : ''} enregistré${favCount > 1 ? 's' : ''}`} />
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
          {/* colonne gauche */}
          <div className="space-y-8">
            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Prochaine session</h2>
                <Link to="/agenda" className="inline-flex items-center gap-1 text-[13px] font-bold text-royal-700 hover:gap-2 transition-all">Mon agenda <ArrowRight size={13} /></Link>
              </div>
              {next ? <SessionBlock session={next} db={db} /> : (
                <p className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-5 text-sm text-soft">Aucune session sélectionnée — explorez le programme officiel.</p>
              )}
            </section>

            <section>
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Profils recommandés pour vous</h2>
                <Link to="/annuaire" className="inline-flex items-center gap-1 text-[13px] font-bold text-royal-700 transition-all hover:gap-2">Tout voir <ArrowRight size={13} /></Link>
              </div>
              <div className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
                {reco.map((p) => <ParticipantCard key={p.id} profile={p} db={db} />)}
              </div>
            </section>

            <section>
              <h2 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Prochaines sessions du Sommet</h2>
              <div className="space-y-3">
                {upcomingSessions(db, 3).map((s) => <SessionBlock key={s.id} session={s} db={db} showSpeakers={false} />)}
              </div>
            </section>
          </div>

          {/* colonne droite */}
          <div className="space-y-5">
            <div className="overflow-hidden rounded-lg border border-line bg-card">
              <div className="flex items-center justify-between bg-navy-900 px-5 py-3">
                <p className="font-mono text-[10px] tracking-[0.18em] text-gold-400 uppercase">Mon QR code</p>
                <QrCode size={14} className="text-white/60" />
              </div>
              <div className="p-5">
                <QRBlock username={user.username} name={profile.fullName} size={120} />
                <Link to="/profil/qr" className="mt-3 block text-center text-[13px] font-bold text-royal-700 hover:underline">Gérer ma carte numérique</Link>
              </div>
            </div>

            <div className="rounded-lg border border-line bg-card p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-royal-700 uppercase"><Bell size={12} /> Notifications</h3>
                <Link to="/notifications" className="text-[12px] font-bold text-royal-700 hover:underline">Tout voir</Link>
              </div>
              {notifs.length === 0 ? <p className="text-[13px] text-soft">Aucune notification.</p> : (
                <div className="space-y-2.5">
                  {notifs.map((n) => (
                    <Link key={n.id} to="/notifications" className={cx('block rounded-md border px-3 py-2.5 transition-colors hover:border-royal-300', n.read ? 'border-line' : 'border-royal-200 bg-royal-50/60')}>
                      <p className="text-[12.5px] font-bold text-ink">{n.title}</p>
                      <p className="line-clamp-1 text-[11.5px] text-soft">{n.message}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-line bg-card p-5">
              <h3 className="mb-3 flex items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.18em] text-royal-700 uppercase"><Megaphone size={12} /> Annonces FIJADA</h3>
              <div className="space-y-2.5">
                {announcements.map((a) => (
                  <div key={a.id} className="rounded-md border-l-[3px] border-gold-400 bg-paper px-3 py-2.5">
                    <p className="text-[12.5px] font-bold text-ink">{a.title}</p>
                    <p className="line-clamp-2 text-[11.5px] text-soft">{a.message}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-line bg-card p-5">
              <h3 className="mb-3 font-mono text-[10px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Mon profil</h3>
              <div className="space-y-2">
                <Link to="/profil/modifier" className="flex items-center gap-2 text-[13px] font-semibold text-ink transition-colors hover:text-royal-700"><Pencil size={14} /> Modifier mon profil</Link>
                <Link to="/profil/confidentialite" className="flex items-center gap-2 text-[13px] font-semibold text-ink transition-colors hover:text-royal-700"><ShieldCheck size={14} /> Confidentialité & compte</Link>
                <Link to="/profil/carte" className="flex items-center gap-2 text-[13px] font-semibold text-ink transition-colors hover:text-royal-700"><Wallet size={14} /> Carte de visite numérique</Link>
                <Link to={`/participant/${user.username}`} className="flex items-center gap-2 text-[13px] font-semibold text-ink transition-colors hover:text-royal-700"><Eye size={14} /> Voir mon profil public</Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= MODIFIER MON PROFIL ================= */
export function EditProfilePage() {
  const db = useDb();
  const { user, profile, contacts } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [d, setD] = useState(() => ({
    firstName: profile?.firstName || '', lastName: profile?.lastName || '', fullName: profile?.fullName || '',
    civility: profile?.civility || '', title: profile?.title || '', organization: profile?.organization || '',
    participantTypeId: profile?.participantTypeId || '', sectorId: profile?.sectorId || '',
    representedCountry: profile?.representedCountry || '', residenceCountry: profile?.residenceCountry || '',
    city: profile?.city || '', shortBio: profile?.shortBio || '', biography: profile?.biography || '',
    topics: profile?.topics || ([] as string[]),
    phone: contacts?.phone || '', whatsapp: contacts?.whatsapp || '', fax: contacts?.fax || '',
    proEmail: contacts?.proEmail || '', linkedin: contacts?.linkedin || '', website: contacts?.website || '',
  }));
  if (!user || !profile) return null;
  const set = (p: Partial<typeof d>) => setD((x) => ({ ...x, ...p }));

  const save = () => {
    updateProfile(profile.id, {
      firstName: d.firstName, lastName: d.lastName, fullName: d.fullName || `${d.firstName} ${d.lastName}`,
      civility: d.civility || undefined, title: d.title, organization: d.organization,
      participantTypeId: d.participantTypeId || undefined, sectorId: d.sectorId || undefined,
      representedCountry: d.representedCountry || undefined, residenceCountry: d.residenceCountry || undefined,
      city: d.city, shortBio: d.shortBio, biography: d.biography, topics: d.topics,
    });
    updateContacts(profile.id, { phone: d.phone, whatsapp: d.whatsapp, fax: d.fax, proEmail: d.proEmail, linkedin: d.linkedin, website: d.website } as any);
    toast.push('success', 'Profil mis à jour avec succès.');
    nav('/profil');
  };

  return (
    <div>
      <PageHero kicker="Édition du profil officiel" title="Modifier mon profil" desc="Ces informations apparaissent dans l’annuaire et sur votre profil public. Les modifications substantielles peuvent repasser en vérification." />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="space-y-6 rounded-xl border border-line bg-card p-6 sm:p-8">
          <section className="grid gap-4 sm:grid-cols-2">
            <Field label="Prénom" required><Input value={d.firstName} onChange={(e) => set({ firstName: e.target.value })} /></Field>
            <Field label="Nom" required><Input value={d.lastName} onChange={(e) => set({ lastName: e.target.value })} /></Field>
            <Field label="Fonction" required><Input value={d.title} onChange={(e) => set({ title: e.target.value })} /></Field>
            <Field label="Organisation" required><Input value={d.organization} onChange={(e) => set({ organization: e.target.value })} /></Field>
            <Field label="Type de participant">
              <Select value={d.participantTypeId} onChange={(e) => set({ participantTypeId: e.target.value })}>
                <option value="">—</option>
                {db.participantTypes.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </Field>
            <Field label="Secteur">
              <Select value={d.sectorId} onChange={(e) => set({ sectorId: e.target.value })}>
                <option value="">—</option>
                {db.sectors.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
              </Select>
            </Field>
            <Field label="Pays représenté">
              <Select value={d.representedCountry} onChange={(e) => set({ representedCountry: e.target.value })}>
                <option value="">—</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </Select>
            </Field>
            <Field label="Pays de résidence">
              <Select value={d.residenceCountry} onChange={(e) => set({ residenceCountry: e.target.value })}>
                <option value="">—</option>
                {COUNTRIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.name}</option>)}
              </Select>
            </Field>
            <Field label="Ville"><Input value={d.city} onChange={(e) => set({ city: e.target.value })} /></Field>
          </section>
          <section className="space-y-4">
            <Field label="Présentation courte" hint="Cartes de l’annuaire"><Textarea max={250} value={d.shortBio} onChange={(e) => set({ shortBio: e.target.value })} /></Field>
            <Field label="Biographie" hint="Profil détaillé"><Textarea max={2000} value={d.biography} onChange={(e) => set({ biography: e.target.value })} rows={6} /></Field>
          </section>
          <section>
            <p className="mb-2.5 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Centres d’intérêt</p>
            <div className="flex flex-wrap gap-2">
              {db.topics.filter((tp) => tp.active).map((tp) => {
                const on = d.topics.includes(tp.id);
                return (
                  <button key={tp.id} type="button" onClick={() => set({ topics: on ? d.topics.filter((x) => x !== tp.id) : [...d.topics, tp.id] })}
                    className={cx('cursor-pointer rounded-full border px-3 py-1.5 text-[13px] font-bold transition-all', on ? 'border-royal-600 bg-royal-700 text-white' : 'border-line bg-white text-soft hover:border-royal-300')}>
                    {tp.name}
                  </button>
                );
              })}
            </div>
          </section>
          <section className="grid gap-4 border-t border-line pt-5 sm:grid-cols-2">
            <Field label="Téléphone"><Input value={d.phone} onChange={(e) => set({ phone: e.target.value })} /></Field>
            <Field label="WhatsApp"><Input value={d.whatsapp} onChange={(e) => set({ whatsapp: e.target.value })} /></Field>
            <Field label="Fax"><Input value={d.fax} onChange={(e) => set({ fax: e.target.value })} /></Field>
            <Field label="E-mail professionnel"><Input value={d.proEmail} onChange={(e) => set({ proEmail: e.target.value })} /></Field>
            <Field label="LinkedIn"><Input value={d.linkedin} onChange={(e) => set({ linkedin: e.target.value })} /></Field>
            <Field label="Site web"><Input value={d.website} onChange={(e) => set({ website: e.target.value })} /></Field>
          </section>
          <div className="flex justify-end gap-2 border-t border-line pt-5">
            <Btn variant="ghost" onClick={() => nav('/profil')}>Annuler</Btn>
            <Btn size="lg" onClick={save}>Enregistrer les modifications</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= CONFIDENTIALITÉ & COMPTE ================= */
export function PrivacyPage() {
  const { user, profile, contacts } = useAuth();
  const nav = useNavigate();
  const toast = useToast();
  const [delOpen, setDelOpen] = useState(false);
  if (!user || !profile || !contacts) return null;

  const visOptions: Array<{ v: Visibility; label: string; icon: React.ReactNode }> = [
    { v: 'public', label: 'Visible par tous les participants connectés', icon: <Eye size={13} /> },
    { v: 'connected', label: 'Visible après mise en relation acceptée', icon: <EyeOff size={13} /> },
    { v: 'private', label: 'Privé — jamais visible', icon: <Lock size={13} /> },
  ];
  const fields: Array<[string, keyof typeof contacts]> = [
    ['Téléphone', 'phoneVis'], ['WhatsApp', 'whatsappVis'], ['E-mail professionnel', 'emailVis'],
    ['Fax', 'faxVis'], ['LinkedIn', 'linkedinVis'], ['Site web', 'websiteVis'],
  ];

  const exportJson = () => {
    downloadFile(`mes-donnees-smd-${user.username}.json`, JSON.stringify(exportUserData(user.id), null, 2), 'application/json');
    toast.push('success', 'Export de vos données téléchargé.');
  };

  return (
    <div>
      <PageHero kicker="Protection des données" title="Confidentialité & compte" desc="Contrôlez la visibilité de chaque coordonnée, exportez vos données ou supprimez votre compte conformément à la politique de confidentialité du Sommet." />
      <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 sm:px-6">
        <section className="rounded-xl border border-line bg-card p-6">
          <h2 className="mb-1 font-display text-lg font-extrabold text-navy-900">Visibilité de mes coordonnées</h2>
          <p className="mb-4 text-[13px] text-soft">Les participants non connectés ne voient jamais vos coordonnées.</p>
          <div className="space-y-3">
            {fields.map(([label, key]) => (
              <div key={String(key)} className="rounded-lg border border-line bg-white p-4">
                <p className="mb-2.5 text-sm font-bold text-ink">{label}</p>
                <div className="grid gap-1.5 sm:grid-cols-3">
                  {visOptions.map((o) => (
                    <button key={o.v} type="button" onClick={() => { updateContacts(profile.id, { [key]: o.v } as any); toast.push('success', `${label} : réglage mis à jour.`); }}
                      className={cx('flex cursor-pointer items-center gap-2 rounded-md border px-2.5 py-2 text-left text-[11.5px] font-semibold transition-all', contacts[key] === o.v ? 'border-royal-500 bg-royal-50 text-royal-800' : 'border-line text-soft hover:border-royal-300')}>
                      {o.icon}{o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-line bg-card p-6">
          <h2 className="mb-4 font-display text-lg font-extrabold text-navy-900">Mes données</h2>
          <div className="flex flex-wrap gap-2.5">
            <Btn variant="outline" onClick={exportJson}><Download size={15} /> Exporter mes données (JSON)</Btn>
            <Btn variant="ghost" onClick={() => nav('/profil/modifier')}><Pencil size={15} /> Modifier mes informations</Btn>
          </div>
        </section>

        <section className="rounded-xl border border-flame-600/30 bg-card p-6">
          <h2 className="mb-2 font-display text-lg font-extrabold text-flame-700">Zone sensible</h2>
          <p className="mb-4 text-[13px] text-soft">La suppression est définitive : profil, contacts, favoris et agenda seront effacés de la plateforme.</p>
          <Btn variant="danger" onClick={() => setDelOpen(true)}><Trash2 size={15} /> Supprimer mon compte</Btn>
        </section>
      </div>

      <Modal open={delOpen} onClose={() => setDelOpen(false)} title="Confirmer la suppression du compte">
        <p className="text-sm text-soft">Votre compte <strong className="text-ink">@{user.username}</strong> et toutes vos données seront définitivement supprimés. Cette action est irréversible.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setDelOpen(false)}>Conserver mon compte</Btn>
          <Btn variant="danger" onClick={() => { deleteAccount(user.id); toast.push('info', 'Compte supprimé.'); nav('/'); }}><Trash2 size={14} /> Supprimer définitivement</Btn>
        </div>
      </Modal>
    </div>
  );
}

/* ================= MON QR CODE & CARTE NUMÉRIQUE ================= */
export function QRPage() {
  const { user, profile } = useAuth();
  if (!user || !profile) return null;
  return (
    <div>
      <PageHero kicker="Badge numérique" title="Mon QR code personnel" desc="Ce QR code unique renvoie vers votre profil public — il peut être imprimé sur votre badge officiel. Il ne contient jamais vos coordonnées privées." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="overflow-hidden rounded-xl border border-line bg-card shadow-lg shadow-royal-900/5">
          <div className="bg-navy-900 px-6 py-4">
            <p className="font-display text-sm font-extrabold text-white">SMD <span className="text-gold-400">·</span> FIJADA 2026 — Badge numérique</p>
          </div>
          <div className="flag-bar h-1" />
          <div className="grid gap-8 p-8 sm:grid-cols-[auto_1fr] sm:items-center">
            <div className="justify-self-center"><QRBlock username={user.username} name={profile.fullName} size={190} /></div>
            <div>
              <div className="flex items-center gap-4">
                <Avatar profile={profile} size={64} ring={profile.verification === 'verified'} />
                <div>
                  <p className="font-display text-xl font-extrabold text-ink">{profile.fullName || '—'}</p>
                  <p className="text-sm font-semibold text-royal-800">{profile.title || '—'}</p>
                  <p className="text-[13px] text-soft">{profile.organization || '—'}</p>
                  <p className="mt-1 font-mono text-[11px] tracking-wide text-soft uppercase">@{user.username}</p>
                </div>
              </div>
              <ul className="mt-5 space-y-1.5 text-[13px] text-soft">
                <li>• Téléchargez le QR en PNG pour impression badge</li>
                <li>• Copiez le lien pour vos signatures d’e-mail</li>
                <li>• Le lien reste actif après le Sommet (réseau durable SMD Network)</li>
              </ul>
            </div>
          </div>
          <div className="flag-bar h-1" />
        </div>
        <div className="mt-5 text-center">
          <Link to="/profil/carte" className="text-sm font-bold text-royal-700 hover:underline">Voir ma carte de visite numérique →</Link>
        </div>
      </div>
    </div>
  );
}

export function CardPage() {
  const db = useDb();
  const { user, profile } = useAuth();
  const toast = useToast();
  if (!user || !profile) return null;
  const url = profileUrl(user.username);
  const country = COUNTRIES.find((c) => c.code === profile.representedCountry);

  const shareWA = () => window.open(`https://wa.me/?text=${encodeURIComponent(`${profile.fullName} — Annuaire SMD FIJADA 2026 : ${url}`)}`, '_blank');
  const shareMail = () => window.open(`mailto:?subject=${encodeURIComponent('Carte de visite — Annuaire SMD FIJADA 2026')}&body=${encodeURIComponent(`${profile.fullName}\n${profile.title} — ${profile.organization}\n${url}`)}`, '_self');
  const shareNative = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: profile.fullName, url }); } catch { /* annulé */ }
    } else {
      (await copyText(url)) && toast.push('success', 'Lien copié.');
    }
  };

  return (
    <div>
      <PageHero kicker="Carte de visite digitale" title="Ma carte numérique SMD" desc="Une carte partageable, pensée pour le networking du Sommet — par WhatsApp, e-mail ou partage natif." />
      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-md overflow-hidden rounded-xl border border-line bg-white shadow-2xl shadow-royal-900/15 transition-transform duration-300 hover:-translate-y-1">
          <div className="bg-navy-900 px-6 py-4 text-white">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-extrabold">ANNUAIRE <span className="text-gold-400">SMD</span></p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-white/60 uppercase">{db.event.edition}</p>
            </div>
          </div>
          <div className="flag-bar h-1" />
          <div className="p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full font-display text-2xl font-bold text-white" style={{ background: `linear-gradient(135deg, ${profile.avatarColor}, #0C2560)` }}>
                {initialsOf(profile)}
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg leading-tight font-extrabold text-ink">{profile.fullName}</p>
                <p className="text-[13px] font-semibold text-royal-800">{profile.title}</p>
                <p className="truncate text-xs text-soft">{profile.organization}</p>
                <p className="mt-1 text-xs font-bold text-ink">{country ? `${country.flag} ${country.name}` : ''}</p>
              </div>
            </div>
            <div className="mt-5 flex items-center justify-between gap-4 rounded-lg bg-paper p-4">
              <div className="min-w-0">
                <p className="font-mono text-[9.5px] tracking-[0.16em] text-soft uppercase">Scannez pour voir le profil</p>
                <p className="mt-1 truncate font-mono text-[11px] font-semibold text-royal-800">/participant/{user.username}</p>
                <p className="mt-2 text-[11px] text-soft">Kinshasa · 08–12 sept. 2026</p>
              </div>
              <div className="shrink-0 rounded-md bg-white p-2"><QRBlock username={user.username} size={84} /></div>
            </div>
          </div>
          <div className="flag-bar h-1.5" />
        </div>

        <div className="mt-7 flex flex-wrap justify-center gap-2.5">
          <Btn variant="outline" onClick={async () => { (await copyText(url)) && toast.push('success', 'Lien copié dans le presse-papiers.'); }}><Copy size={14} /> Copier le lien</Btn>
          <Btn variant="outline" onClick={shareWA}><MessageCircle size={14} /> WhatsApp</Btn>
          <Btn variant="outline" onClick={shareMail}><Mail size={14} /> E-mail</Btn>
          <Btn onClick={shareNative}><Share2 size={14} /> Partager</Btn>
        </div>
      </div>
    </div>
  );
}
