import { useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Star, Share2, UserPlus, Contact, Mail, Phone, MessageCircle, Printer,
  Globe, Linkedin, QrCode, Check, X, Building2, MapPin, Briefcase, FileText,
} from 'lucide-react';
import {
  useDb, toggleFavorite, sendRequest, respondRequest, cancelRequest,
  sessionsOfProfile, acceptedRequestBetween,
} from '../lib/db';
import { useAuth } from '../lib/auth';
import { cx, profileUrl, copyText, fold } from '../lib/utils';
import { t } from '../lib/i18n';
import { Btn, Modal, Textarea, useToast } from '../components/ui';
import { Avatar, VerifiedBadge, VerificationTag, DemoTag, BadgeChips, CountryBadge, SessionBlock, QRBlock, PageHero } from '../components/bits';
import type { Visibility, Profile } from '../lib/types';

export default function ProfilePage() {
  const { username } = useParams();
  const db = useDb();
  const { user } = useAuth();
  const nav = useNavigate();
  const toast = useToast();

  const target = useMemo(() => {
    const key = (username || '').toLowerCase();
    const u = db.users.find((x) => x.username.toLowerCase() === key || x.id === key);
    const profile = u ? db.profiles.find((p) => p.userId === u.id) : db.profiles.find((p) => p.id === key);
    return { account: u, profile: profile || null };
  }, [db, username]);

  const [contactsOpen, setContactsOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [reqOpen, setReqOpen] = useState(false);
  const [reqMsg, setReqMsg] = useState('');

  const p = target.profile;
  if (!p || !p.published) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="font-display text-xl font-bold text-ink">Profil introuvable</p>
        <p className="mt-2 text-sm text-soft">Ce profil n’existe pas ou n’a pas encore été publié.</p>
        <Link to="/annuaire" className="mt-5 inline-block"><Btn variant="outline"><ArrowLeft size={14} /> Retour à l’annuaire</Btn></Link>
      </div>
    );
  }

  const account = target.account!;
  const contact = db.contacts.find((c) => c.profileId === p.id);
  const isSelf = user?.id === account.id;
  const connected = !!user && acceptedRequestBetween(db, user.id, account.id);
  const fav = !!user && db.favorites.some((f) => f.userId === user.id && f.profileId === p.id);
  const outgoing = user && db.requests.find((r) => r.senderId === user.id && r.receiverId === account.id && r.status === 'pending');
  const incoming = user && db.requests.find((r) => r.receiverId === user.id && r.senderId === account.id && r.status === 'pending');
  const type = db.participantTypes.find((x) => x.id === p.participantTypeId)?.name;
  const sector = db.sectors.find((x) => x.id === p.sectorId)?.name;
  const sessions = sessionsOfProfile(db, p.id);

  const onFav = () => {
    if (!user) return nav('/connexion');
    toggleFavorite(user.id, p.id);
    toast.push('success', fav ? 'Retiré des favoris.' : 'Ajouté à vos favoris.');
  };
  const onShare = async () => {
    const url = profileUrl(account.username);
    if (navigator.share) {
      try { await navigator.share({ title: `${p.fullName} — Annuaire SMD FIJADA 2026`, url }); return; } catch { return; }
    }
    (await copyText(url)) && toast.push('success', 'Lien du profil copié.');
  };
  const sendReq = () => {
    if (!user) return nav('/connexion');
    const r = sendRequest(user.id, account.id, reqMsg.trim() || undefined);
    if (!r.ok) return toast.push('error', r.error || 'Impossible d’envoyer la demande.');
    setReqOpen(false);
    setReqMsg('');
    toast.push('success', 'Demande de mise en relation envoyée.');
  };

  const rows: Array<{ label: string; value?: string; vis: Visibility; icon: React.ReactNode; href?: (v: string) => string }> = [
    { label: 'Téléphone', value: contact?.phone, vis: contact?.phoneVis || 'private', icon: <Phone size={14} />, href: (v) => `tel:${v.replace(/\s/g, '')}` },
    { label: 'WhatsApp', value: contact?.whatsapp, vis: contact?.whatsappVis || 'private', icon: <MessageCircle size={14} />, href: (v) => `https://wa.me/${v.replace(/[^\d]/g, '')}` },
    { label: 'E-mail professionnel', value: contact?.proEmail, vis: contact?.emailVis || 'private', icon: <Mail size={14} />, href: (v) => `mailto:${v}` },
    { label: 'Fax', value: contact?.fax, vis: contact?.faxVis || 'private', icon: <Printer size={14} /> },
    { label: 'LinkedIn', value: contact?.linkedin, vis: contact?.linkedinVis || 'private', icon: <Linkedin size={14} />, href: (v) => (v.startsWith('http') ? v : `https://${v}`) },
    { label: 'Site web', value: contact?.website, vis: contact?.websiteVis || 'private', icon: <Globe size={14} />, href: (v) => (v.startsWith('http') ? v : `https://${v}`) },
  ];

  return (
    <div>
      <PageHero kicker={`@${account.username}`} title={
        <span className="flex flex-wrap items-center gap-3">{p.fullName}{p.verification === 'verified' && <VerifiedBadge />}{p.demo && <DemoTag />}</span>
      }>
        <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-white/80">
          <span className="inline-flex items-center gap-1.5"><Briefcase size={14} className="text-gold-400" />{p.title || '—'}</span>
          <span className="inline-flex items-center gap-1.5"><Building2 size={14} className="text-gold-400" />{p.organization || '—'}</span>
        </div>
      </PageHero>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link to="/annuaire" className="mb-5 inline-flex items-center gap-1.5 text-sm font-bold text-royal-700 hover:text-royal-800">
          <ArrowLeft size={15} /> Retour à l’annuaire
        </Link>

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
          {/* colonne principale */}
          <div className="space-y-6">
            <section className="rounded-lg border border-line bg-card p-6">
              <div className="flex flex-col gap-5 sm:flex-row">
                <Avatar profile={p} size={96} ring={p.verification === 'verified'} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <VerificationTag v={p.verification} />
                    {type && <span className="rounded-full bg-paper px-2 py-0.5 text-[11px] font-bold text-soft">{type}</span>}
                  </div>
                  <BadgeChips badges={p.badges} />
                  <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                    <p className="flex items-center gap-2"><CountryBadge code={p.representedCountry} prefix="Représente" /></p>
                    <p className="flex items-center gap-2 text-soft"><MapPin size={13} className="text-royal-700" /> Réside à {p.city || '—'}, {p.residenceCountry ? <CountryBadge code={p.residenceCountry} /> : '—'}</p>
                    {sector && <p className="flex items-center gap-2 text-soft sm:col-span-2"><FileText size={13} className="text-royal-700" /> Secteur : <span className="font-semibold text-ink">{sector}</span></p>}
                  </div>
                  {p.shortBio && <p className="mt-4 border-l-[3px] border-gold-400 bg-paper px-3.5 py-2.5 text-[14px] leading-relaxed font-medium text-ink">{p.shortBio}</p>}
                </div>
              </div>
              {p.biography && (
                <div className="mt-6 border-t border-line pt-5">
                  <h2 className="mb-2 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Biographie</h2>
                  <p className="text-[14.5px] leading-relaxed whitespace-pre-line text-soft">{p.biography}</p>
                </div>
              )}
            </section>

            {p.topics.length > 0 && (
              <section className="rounded-lg border border-line bg-card p-6">
                <h2 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Panels & centres d’intérêt</h2>
                <div className="flex flex-wrap gap-2">
                  {p.topics.map((tid) => {
                    const tp = db.topics.find((x) => x.id === tid);
                    return tp ? (
                      <Link key={tid} to={`/panels?topic=${tid}`} className="rounded-full border border-royal-200 bg-royal-50 px-3 py-1.5 text-[13px] font-bold text-royal-800 transition-colors hover:bg-royal-100">
                        {tp.name}
                      </Link>
                    ) : null;
                  })}
                </div>
              </section>
            )}

            <section>
              <h2 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">
                Sessions du programme ({sessions.length})
              </h2>
              {sessions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-line bg-card/60 px-4 py-5 text-sm text-soft">
                  Aucune session officielle associée pour le moment.
                </p>
              ) : (
                <div className="space-y-3">
                  {sessions.map((s) => <SessionBlock key={s.id} session={s} db={db} showSpeakers={false} />)}
                </div>
              )}
            </section>
          </div>

          {/* colonne latérale */}
          <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-lg border border-line bg-card p-5">
              <h2 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.18em] text-royal-700 uppercase">Actions</h2>
              <div className="space-y-2">
                {isSelf ? (
                  <>
                    <Link to="/profil/modifier" className="block"><Btn className="w-full">Modifier mon profil</Btn></Link>
                    <Link to="/profil/qr" className="block"><Btn variant="outline" className="w-full"><QrCode size={15} /> Mon QR code</Btn></Link>
                  </>
                ) : (
                  <>
                    <Btn className="w-full" onClick={() => setContactsOpen(true)}><Contact size={15} /> {t('action.showContacts')}</Btn>
                    {connected ? (
                      <Btn variant="outline" className="w-full" disabled><Check size={15} /> Contact SMD établi</Btn>
                    ) : incoming ? (
                      <div className="grid grid-cols-2 gap-2">
                        <Btn variant="gold" size="md" onClick={() => { respondRequest(incoming.id, true); toast.push('success', 'Demande acceptée.'); }}><Check size={15} /> Accepter</Btn>
                        <Btn variant="outline" onClick={() => { respondRequest(incoming.id, false); toast.push('info', 'Demande refusée.'); }}><X size={15} /> Refuser</Btn>
                      </div>
                    ) : outgoing ? (
                      <Btn variant="outline" className="w-full" onClick={() => { cancelRequest(outgoing.id); toast.push('info', 'Demande annulée.'); }}>
                        Annuler la demande en attente
                      </Btn>
                    ) : (
                      <Btn variant="gold" className="w-full" onClick={() => (user ? setReqOpen(true) : nav('/connexion'))}><UserPlus size={15} /> {t('action.connect')}</Btn>
                    )}
                  </>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <Btn variant="outline" onClick={onFav}>
                    <Star size={15} className={cx(fav && 'fill-gold-400 text-gold-500')} /> {fav ? 'Favori' : 'Favoris'}
                  </Btn>
                  <Btn variant="outline" onClick={onShare}><Share2 size={15} /> Partager</Btn>
                </div>
                {!isSelf && <Btn variant="ghost" className="w-full" onClick={() => setQrOpen(true)}><QrCode size={15} /> QR code du profil</Btn>}
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-line bg-card">
              <div className="bg-navy-900 px-5 py-3">
                <p className="font-mono text-[10px] tracking-[0.18em] text-gold-400 uppercase">Carte de visite SMD</p>
              </div>
              <div className="p-5">
                <QRBlock username={account.username} name={p.fullName} size={130} />
              </div>
              <div className="flag-bar h-1" />
            </div>
          </aside>
        </div>
      </div>

      {/* ---- Modal contacts ---- */}
      <Modal open={contactsOpen} onClose={() => setContactsOpen(false)} title={`Coordonnées de ${p.firstName || 'ce participant'}`} wide>
        <p className="mb-4 text-[13px] text-soft">
          Les coordonnées sont protégées par les règles de confidentialité définies par le participant et vérifiées par l’administration FIJADA.
        </p>
        <div className="space-y-2.5">
          {rows.map((r) => {
            const visible = isSelf || r.vis === 'public' || (r.vis === 'connected' && connected);
            return (
              <div key={r.label} className="flex items-center justify-between gap-3 rounded-md border border-line bg-paper px-4 py-3">
                <span className="flex items-center gap-2.5 text-sm font-bold text-ink">{r.icon}{r.label}</span>
                {visible && r.value ? (
                  r.href ? (
                    <a href={r.href(r.value)} target={r.href(r.value).startsWith('http') ? '_blank' : undefined} rel="noreferrer" className="font-mono text-[13px] font-semibold text-royal-700 hover:underline">
                      {r.value}
                    </a>
                  ) : (
                    <span className="font-mono text-[13px] font-semibold text-ink">{r.value}</span>
                  )
                ) : r.vis === 'connected' && !connected && !isSelf ? (
                  <span className="max-w-[260px] text-right text-[11.5px] font-medium text-gold-700">{t('privacy.locked')}</span>
                ) : (
                  <span className="text-[11.5px] font-medium text-soft">{!r.value ? 'Non renseigné' : t('privacy.privateField')}</span>
                )}
              </div>
            );
          })}
        </div>
        {!isSelf && !connected && (
          <div className="mt-4 rounded-md bg-royal-50 px-4 py-3 text-[13px] text-royal-800">
            Certaines coordonnées seront débloquées après acceptation de votre demande de mise en relation.
            {!outgoing && !incoming && (
              <button onClick={() => { setContactsOpen(false); setReqOpen(true); }} className="mt-1 block cursor-pointer font-bold underline underline-offset-2">
                Envoyer une demande maintenant
              </button>
            )}
          </div>
        )}
      </Modal>

      {/* ---- Modal demande ---- */}
      <Modal open={reqOpen} onClose={() => setReqOpen(false)} title="Demander une mise en relation">
        <p className="text-sm text-soft">
          Votre demande sera transmise à <strong className="text-ink">{p.fullName}</strong> ({fold(p.organization || '')}). Elle devra être acceptée avant tout échange de coordonnées protégées.
        </p>
        <div className="mt-4">
          <Textarea max={300} value={reqMsg} onChange={(e) => setReqMsg(e.target.value)} placeholder="Message court et professionnel (optionnel) : contexte, objectif de la mise en relation…" rows={4} />
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setReqOpen(false)}>Annuler</Btn>
          <Btn onClick={sendReq}><UserPlus size={15} /> Envoyer la demande</Btn>
        </div>
      </Modal>

      {/* ---- Modal QR ---- */}
      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title={`QR code — ${p.fullName}`}>
        <div className="flex justify-center"><QRBlock username={account.username} name={p.fullName} size={180} /></div>
        <p className="mt-4 text-center text-xs text-soft">Ce QR code renvoie uniquement vers le profil public — il ne contient aucune coordonnée privée.</p>
      </Modal>
    </div>
  );
}
