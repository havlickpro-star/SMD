import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UserPlus, Check, X, Star, Bell, Megaphone, ShieldCheck, CalendarDays, Mail, Phone, MessageCircle, Globe, Linkedin, Printer } from 'lucide-react';
import { useDb, respondRequest, cancelRequest, toggleFavorite, markAllRead, markRead, acceptedRequestBetween } from '../lib/db';
import { useAuth } from '../lib/auth';
import { timeAgo, cx, profileUrl, copyText } from '../lib/utils';
import { t } from '../lib/i18n';
import { Btn, Tabs, EmptyState, Modal, useToast } from '../components/ui';
import { Avatar, VerificationTag, PageHero, ParticipantCard } from '../components/bits';
import type { Profile, Visibility, Notif } from '../lib/types';

/* ================= NETWORKING / DEMANDES ================= */
export function NetworkingPage() {
  const db = useDb();
  const { user } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('received');
  if (!user) return null;

  const received = db.requests.filter((r) => r.receiverId === user.id && r.status === 'pending');
  const sent = db.requests.filter((r) => r.senderId === user.id && r.status === 'pending');
  const history = db.requests.filter((r) => (r.senderId === user.id || r.receiverId === user.id) && r.status !== 'pending');

  const profileOfUser = (uid2: string) => db.profiles.find((p) => p.userId === uid2);

  const Row = ({ r, mode }: { r: (typeof db.requests)[number]; mode: 'received' | 'sent' }) => {
    const other = mode === 'received' ? r.senderId : r.receiverId;
    const p = profileOfUser(other);
    if (!p) return null;
    return (
      <div className="rounded-lg border border-line bg-card p-4 transition-shadow hover:shadow-md sm:p-5">
        <div className="flex flex-wrap items-start gap-3.5">
          <Avatar profile={p} size={50} />
          <div className="min-w-0 flex-1">
            <Link to={`/participant/${p.userId}`} className="font-display text-[15px] font-bold text-ink hover:text-royal-800">{p.fullName}</Link>
            <p className="text-[13px] text-soft">{p.title} · {p.organization}</p>
            {r.message && <p className="mt-2 rounded-md border-l-[3px] border-royal-200 bg-paper px-3 py-2 text-[13px] text-ink italic">« {r.message} »</p>}
            <p className="mt-1.5 font-mono text-[10.5px] tracking-wide text-soft uppercase">{timeAgo(r.createdAt)}</p>
          </div>
          {mode === 'received' ? (
            <div className="flex shrink-0 gap-2">
              <Btn size="sm" variant="gold" onClick={() => { respondRequest(r.id, true); toast.push('success', `Mise en relation acceptée avec ${p.fullName}.`); }}><Check size={14} /> Accepter</Btn>
              <Btn size="sm" variant="outline" onClick={() => { respondRequest(r.id, false); toast.push('info', 'Demande refusée.'); }}><X size={14} /> Refuser</Btn>
            </div>
          ) : (
            <Btn size="sm" variant="outline" onClick={() => { cancelRequest(r.id); toast.push('info', 'Demande annulée.'); }}>Annuler</Btn>
          )}
        </div>
      </div>
    );
  };

  return (
    <div>
      <PageHero kicker="Networking officiel" title="Mises en relation" desc="Demandes reçues, demandes envoyées et historique — les coordonnées protégées se débloquent après acceptation mutuelle." />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <Tabs
          items={[
            { id: 'received', label: `Reçues${received.length ? ` (${received.length})` : ''}` },
            { id: 'sent', label: `Envoyées${sent.length ? ` (${sent.length})` : ''}` },
            { id: 'history', label: 'Historique' },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div className="mt-6 space-y-3">
          {tab === 'received' && (received.length === 0 ? <EmptyState icon={<UserPlus size={24} />} title={t('empty.networking')} desc="Lorsqu’un participant souhaitera vous connecter, sa demande apparaîtra ici." /> : received.map((r) => <Row key={r.id} r={r} mode="received" />))}
          {tab === 'sent' && (sent.length === 0 ? <EmptyState icon={<UserPlus size={24} />} title="Aucune demande envoyée" desc="Explorez l’annuaire et envoyez des demandes de mise en relation aux participants qui partagent vos centres d’intérêt." action={<Link to="/annuaire"><Btn variant="outline">Explorer l’annuaire</Btn></Link>} /> : sent.map((r) => <Row key={r.id} r={r} mode="sent" />))}
          {tab === 'history' && (history.length === 0 ? <EmptyState title="Aucun historique" desc="Vos demandes acceptées, refusées ou annulées s’afficheront ici." /> : history.map((r) => {
            const other = r.senderId === user.id ? r.receiverId : r.senderId;
            const p = profileOfUser(other);
            if (!p) return null;
            const labels: Record<string, [string, string]> = {
              accepted: ['Acceptée', 'bg-forest-100 text-forest-700'],
              refused: ['Refusée', 'bg-flame-100 text-flame-700'],
              cancelled: ['Annulée', 'bg-paper text-soft'],
            };
            const [lab, cls] = labels[r.status] || ['—', 'bg-paper text-soft'];
            return (
              <div key={r.id} className="flex items-center gap-3.5 rounded-lg border border-line bg-card px-4 py-3">
                <Avatar profile={p} size={38} />
                <div className="min-w-0 flex-1">
                  <Link to={`/participant/${p.userId}`} className="text-sm font-bold text-ink hover:text-royal-800">{p.fullName}</Link>
                  <p className="font-mono text-[10px] tracking-wide text-soft uppercase">{r.senderId === user.id ? 'Envoyée' : 'Reçue'} · {timeAgo(r.createdAt)}</p>
                </div>
                <span className={cx('rounded-full px-2.5 py-1 text-[11px] font-bold', cls)}>{lab}</span>
              </div>
            );
          }))}
        </div>
      </div>
    </div>
  );
}

/* ================= MES CONTACTS SMD ================= */
export function ContactsPage() {
  const db = useDb();
  const { user } = useAuth();
  const [detail, setDetail] = useState<Profile | null>(null);
  if (!user) return null;

  const contacts = db.requests
    .filter((r) => r.status === 'accepted' && (r.senderId === user.id || r.receiverId === user.id))
    .map((r) => db.profiles.find((p) => p.userId === (r.senderId === user.id ? r.receiverId : r.senderId)))
    .filter(Boolean) as Profile[];

  const rowsFor = (p: Profile) => {
    const c = db.contacts.find((x) => x.profileId === p.id);
    return [
      { label: 'Téléphone', value: c?.phone, vis: c?.phoneVis || 'private', icon: <Phone size={14} /> },
      { label: 'WhatsApp', value: c?.whatsapp, vis: c?.whatsappVis || 'private', icon: <MessageCircle size={14} /> },
      { label: 'E-mail professionnel', value: c?.proEmail, vis: c?.emailVis || 'private', icon: <Mail size={14} /> },
      { label: 'Fax', value: c?.fax, vis: c?.faxVis || 'private', icon: <Printer size={14} /> },
      { label: 'LinkedIn', value: c?.linkedin, vis: c?.linkedinVis || 'private', icon: <Linkedin size={14} /> },
      { label: 'Site web', value: c?.website, vis: c?.websiteVis || 'private', icon: <Globe size={14} /> },
    ];
  };

  return (
    <div>
      <PageHero kicker="Réseau établi" title="Mes contacts SMD" desc="Les participants avec lesquels une mise en relation a été acceptée. Les coordonnées autorisées par leurs règles de confidentialité sont débloquées." />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        {contacts.length === 0 ? (
          <EmptyState icon={<UserPlus size={24} />} title="Aucun contact pour le moment" desc="Acceptez ou envoyez des demandes de mise en relation pour constituer votre réseau SMD." action={<Link to="/annuaire"><Btn>Explorer l’annuaire</Btn></Link>} />
        ) : (
          <div className="space-y-3">
            {contacts.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-3.5 rounded-lg border border-line bg-card p-4 transition-shadow hover:shadow-md">
                <Avatar profile={p} size={48} />
                <div className="min-w-0 flex-1">
                  <Link to={`/participant/${p.userId}`} className="font-display text-[15px] font-bold text-ink hover:text-royal-800">{p.fullName}</Link>
                  <p className="truncate text-[13px] text-soft">{p.title} · {p.organization}</p>
                </div>
                <VerificationTag v={p.verification} />
                <Btn size="sm" variant="outline" onClick={() => setDetail(p)}>Coordonnées</Btn>
              </div>
            ))}
          </div>
        )}
      </div>
      <Modal open={!!detail} onClose={() => setDetail(null)} title={detail ? `Coordonnées — ${detail.fullName}` : ''}>
        {detail && (
          <div className="space-y-2.5">
            {rowsFor(detail).map((r) => {
              const visible = r.vis === 'public' || r.vis === 'connected';
              return (
                <div key={r.label} className="flex items-center justify-between gap-3 rounded-md border border-line bg-paper px-4 py-3">
                  <span className="flex items-center gap-2.5 text-sm font-bold text-ink">{r.icon}{r.label}</span>
                  {visible && r.value ? (
                    <span className="font-mono text-[13px] font-semibold break-all text-royal-700">{r.value}</span>
                  ) : (
                    <span className="text-[11.5px] font-medium text-soft">{!r.value ? 'Non renseigné' : t('privacy.privateField')}</span>
                  )}
                </div>
              );
            })}
            <p className="pt-1 text-xs text-soft">Mise en relation acceptée : les coordonnées « après mise en relation » sont désormais visibles.</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

/* ================= FAVORIS ================= */
export function FavoritesPage() {
  const db = useDb();
  const { user } = useAuth();
  if (!user) return null;
  const favs = db.favorites.filter((f) => f.userId === user.id)
    .map((f) => db.profiles.find((p) => p.id === f.profileId))
    .filter(Boolean) as Profile[];

  return (
    <div>
      <PageHero kicker="Sélection privée" title="Mes favoris" desc="Les profils que vous avez enregistrés — visibles par vous uniquement." />
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {favs.length === 0 ? (
          <EmptyState icon={<Star size={24} />} title={t('empty.favorites')} desc="Utilisez l’étoile sur une carte de l’annuaire pour retrouver rapidement un participant ici." action={<Link to="/annuaire"><Btn>Parcourir l’annuaire</Btn></Link>} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {favs.map((p) => <ParticipantCard key={p.id} profile={p} db={db} />)}
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= NOTIFICATIONS ================= */
const NOTIF_ICON: Record<Notif['type'], React.ReactNode> = {
  request: <UserPlus size={16} />,
  accepted: <Check size={16} />,
  refused: <X size={16} />,
  verified: <ShieldCheck size={16} />,
  program: <CalendarDays size={16} />,
  announcement: <Megaphone size={16} />,
  system: <Bell size={16} />,
};

export function NotificationsPage() {
  const db = useDb();
  const { user } = useAuth();
  const nav = useNavigate();
  if (!user) return null;
  const list = db.notifications.filter((n) => n.userId === user.id);

  return (
    <div>
      <PageHero kicker="Activité de votre compte" title="Notifications" desc="Demandes de mise en relation, vérification de profil, mises à jour du programme et annonces officielles FIJADA.">
        {list.some((n) => !n.read) && (
          <Btn variant="gold" size="sm" className="mt-4" onClick={() => markAllRead(user.id)}>Tout marquer comme lu</Btn>
        )}
      </PageHero>
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {list.length === 0 ? (
          <EmptyState icon={<Bell size={24} />} title="Aucune notification" desc="Les demandes, vérifications et annonces officielles apparaîtront ici." />
        ) : (
          <div className="space-y-2">
            {list.map((n) => (
              <button
                key={n.id}
                onClick={() => { markRead(n.id); if (n.link) nav(n.link); }}
                className={cx(
                  'flex w-full cursor-pointer items-start gap-3.5 rounded-lg border p-4 text-left transition-all hover:shadow-md',
                  n.read ? 'border-line bg-card' : 'border-royal-200 bg-royal-50/70',
                )}
              >
                <span className={cx('mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full', n.read ? 'bg-paper text-soft' : 'bg-royal-700 text-white')}>{NOTIF_ICON[n.type]}</span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-3">
                    <span className={cx('font-display text-sm', n.read ? 'font-bold text-ink' : 'font-extrabold text-royal-900')}>{n.title}</span>
                    {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-gold-400" />}
                  </span>
                  <span className="mt-0.5 block text-[13px] leading-relaxed text-soft">{n.message}</span>
                  <span className="mt-1 block font-mono text-[10px] tracking-wide text-soft/80 uppercase">{timeAgo(n.createdAt)}</span>
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
