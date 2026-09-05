import { useMemo, useState, ReactNode } from 'react';
import { Link, NavLink } from 'react-router-dom';
import {
  LayoutDashboard, Users, CalendarDays, Tags, Megaphone, ScrollText, ShieldCheck,
  Check, X, Trash2, Pencil, Star, Ban, RotateCcw, Search, Plus, AlertTriangle,
} from 'lucide-react';
import {
  useDb, isAdmin, adminSetVerification, adminSetSuspended, adminSetRole, adminSetBadges,
  adminSetFeatured, adminDeleteUser, adminUpdateProfile, adminSaveSession, adminDeleteSession,
  taxonomyAdd, taxonomyRemove, taxonomyToggle, sendAnnouncement, type TaxKind,
} from '../lib/db';
import { useAuth } from '../lib/auth';
import { cx, fmtDateTime, uid, countryName } from '../lib/utils';
import { Btn, Input, Select, Textarea, Field, Modal, Toggle, StatCard, useToast, EmptyState, Tabs } from '../components/ui';
import { Avatar, VerificationTag, DemoTag } from '../components/bits';
import type { Profile, Session, BadgeId, Role, Verification, User } from '../lib/types';

const NAV_ITEMS = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/participants', label: 'Participants', icon: Users },
  { to: '/admin/programme', label: 'Programme', icon: CalendarDays },
  { to: '/admin/taxonomies', label: 'Taxonomies', icon: Tags },
  { to: '/admin/annonces', label: 'Annonces', icon: Megaphone },
  { to: '/admin/logs', label: 'Journal d’audit', icon: ScrollText },
];

function Shell({ children, title, desc }: { children: ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-navy-950 min-h-screen">
      <div className="flag-bar h-1" />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="flex items-center gap-2 font-mono text-[11px] font-semibold tracking-[0.2em] text-gold-400 uppercase">
              <ShieldCheck size={13} /> Back-office FIJADA
            </p>
            <h1 className="mt-1 font-display text-2xl font-extrabold text-white">{title}</h1>
            <p className="mt-1 text-sm text-white/60">{desc}</p>
          </div>
          <Link to="/" className="text-[13px] font-bold text-white/70 hover:text-gold-400">← Retour au site</Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-[210px_1fr]">
          <aside className="no-scrollbar flex gap-1.5 overflow-x-auto lg:flex-col">
            {NAV_ITEMS.map(({ to, label, icon: I, end }) => (
              <NavLink
                key={to}
                to={to}
                end={end}
                className={({ isActive }) =>
                  cx(
                    'flex shrink-0 items-center gap-2.5 rounded-md px-3.5 py-2.5 text-[13px] font-bold whitespace-nowrap transition-colors',
                    isActive ? 'bg-gold-400 text-navy-900' : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white',
                  )
                }
              >
                <I size={15} /> {label}
              </NavLink>
            ))}
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </div>
  );
}

function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('rounded-lg border border-white/10 bg-white/[0.04] p-5', className)}>{children}</div>;
}
function THead({ children }: { children: ReactNode }) {
  return <th className="px-3 py-2.5 text-left font-mono text-[10px] font-semibold tracking-[0.14em] text-white/50 uppercase">{children}</th>;
}

/* ================= DASHBOARD ================= */
export function AdminDashboard() {
  const db = useDb();
  const speakerIds = new Set<string>();
  db.sessions.forEach((s) => s.speakerIds.forEach((id) => speakerIds.add(id)));
  const pub = db.profiles.filter((p) => p.published && p.firstName);
  const lastLogins = [...db.users].filter((u) => u.lastLoginAt).sort((a, b) => (b.lastLoginAt || 0) - (a.lastLoginAt || 0)).slice(0, 6);

  return (
    <Shell title="Tableau de bord" desc="Vue d’ensemble de la plateforme et de la communauté du Sommet.">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
        <StatCard label="Comptes" value={db.users.length} accent="bg-royal-500" />
        <StatCard label="Profils complets" value={pub.filter((p) => p.biography && p.shortBio && p.title && p.organization).length} accent="bg-forest-600" />
        <StatCard label="Profils incomplets" value={pub.filter((p) => !(p.biography && p.shortBio && p.title && p.organization)).length} accent="bg-copper-700" />
        <StatCard label="Vérifiés" value={pub.filter((p) => p.verification === 'verified').length} accent="bg-forest-600" />
        <StatCard label="En attente" value={pub.filter((p) => p.verification === 'pending').length} accent="bg-gold-400" />
        <StatCard label="Suspendus" value={db.users.filter((u) => u.suspended).length} accent="bg-flame-600" />
        <StatCard label="Pays représentés" value={new Set(pub.map((p) => p.representedCountry).filter(Boolean)).size} accent="bg-tealx-700" />
        <StatCard label="Organisations" value={new Set(pub.map((p) => p.organization?.toLowerCase()).filter(Boolean)).size} accent="bg-royal-500" />
        <StatCard label="Intervenants" value={pub.filter((p) => speakerIds.has(p.id)).length} accent="bg-gold-400" />
        <StatCard label="Mises en relation" value={db.requests.length} accent="bg-tealx-700" />
        <StatCard label="Sessions" value={db.sessions.length} accent="bg-royal-500" />
        <StatCard label="Annonces" value={db.announcements.length} accent="bg-flame-600" />
      </div>
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <h3 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-gold-400 uppercase">Connexions récentes</h3>
          {lastLogins.length === 0 ? <p className="text-sm text-white/50">Aucune connexion enregistrée.</p> : (
            <div className="space-y-2">
              {lastLogins.map((u) => {
                const p = db.profiles.find((x) => x.userId === u.id);
                return (
                  <div key={u.id} className="flex items-center justify-between gap-3 rounded-md bg-white/5 px-3 py-2">
                    <span className="text-[13px] font-bold text-white">{p?.fullName || u.username}</span>
                    <span className="font-mono text-[11px] text-white/50">{fmtDateTime(u.lastLoginAt!)}</span>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
        <Card>
          <h3 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-gold-400 uppercase">Dernières actions sensibles</h3>
          <div className="space-y-2">
            {db.audits.slice(0, 6).map((a) => (
              <div key={a.id} className="rounded-md bg-white/5 px-3 py-2">
                <p className="text-[12.5px] font-bold text-white">{a.action}</p>
                <p className="font-mono text-[10.5px] text-white/50">{a.adminName} · {fmtDateTime(a.createdAt)} · {a.entityType}/{a.entityId}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Shell>
  );
}

/* ================= PARTICIPANTS ================= */
export function AdminParticipants() {
  const db = useDb();
  const { user: admin } = useAuth();
  const toast = useToast();
  const [q, setQ] = useState('');
  const [edit, setEdit] = useState<{ p: Profile; u: User } | null>(null);
  const [del, setDel] = useState<{ p: Profile; u: User } | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.users
      .filter((u) => u.role === 'participant' || (u.role !== 'super_admin' && u.role !== 'admin' && u.role !== 'moderator'))
      .filter((u) => u.id !== admin?.id)
      .map((u) => ({ u, p: db.profiles.find((x) => x.userId === u.id) }))
      .filter((x) => !!x.p && (!term || (x.p!.fullName + ' ' + x.u.username + ' ' + (x.p!.organization || '')).toLowerCase().includes(term)));
  }, [db, q, admin]);

  const act = (fn: () => void, msg: string) => { fn(); toast.push('success', msg); };

  const BADGES: Array<{ id: BadgeId; label: string }> = [
    { id: 'intervenant', label: 'Intervenant officiel' }, { id: 'paneliste', label: 'Panéliste' },
    { id: 'moderateur', label: 'Modérateur' }, { id: 'invite_officiel', label: 'Invité officiel' },
    { id: 'organisateur', label: 'Organisateur' }, { id: 'partenaire', label: 'Partenaire officiel' },
  ];

  return (
    <Shell title="Gestion des participants" desc="Vérification, badges, rôles, mise en avant, suspension et suppression — chaque action est journalisée.">
      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher un participant…" className="border-white/15 bg-white/5 pl-9 text-white placeholder:text-white/40" />
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-white/10">
            <tr>
              <THead>Participant</THead><THead>Type</THead><THead>Pays</THead><THead>Statut</THead><THead>Rôle</THead><THead>Actions</THead>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ u, p }) => (
              <tr key={u.id} className="border-b border-white/5 transition-colors hover:bg-white/4">
                <td className="px-3 py-3">
                  <div className="flex items-center gap-2.5">
                    <Avatar profile={p!} size={34} />
                    <div>
                      <p className="flex items-center gap-1.5 font-bold text-white">{p!.fullName}{p!.demo && <DemoTag />}</p>
                      <p className="font-mono text-[10.5px] text-white/40">@{u.username} · {p!.title || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-3 py-3 text-white/70">{db.participantTypes.find((x) => x.id === p!.participantTypeId)?.name || '—'}</td>
                <td className="px-3 py-3 text-white/70">{countryName(p!.representedCountry)}</td>
                <td className="px-3 py-3"><VerificationTag v={p!.verification} /></td>
                <td className="px-3 py-3">
                  <select
                    value={u.role}
                    onChange={(e) => admin && act(() => adminSetRole(u.id, e.target.value as Role, admin), 'Rôle mis à jour.')}
                    className="cursor-pointer rounded-md border border-white/15 bg-white/5 px-2 py-1 text-xs font-bold text-white"
                  >
                    <option value="participant" className="text-ink">participant</option>
                    <option value="moderator" className="text-ink">moderator</option>
                    <option value="admin" className="text-ink">admin</option>
                  </select>
                </td>
                <td className="px-3 py-3">
                  <div className="flex items-center gap-1">
                    {p!.verification !== 'verified' ? (
                      <IconBtn title="Vérifier le profil" className="text-forest-600" onClick={() => admin && act(() => adminSetVerification(p!.id, 'verified', admin), `${p!.fullName} vérifié — badge « Vérifié SMD » attribué.`)}><Check size={14} /></IconBtn>
                    ) : (
                      <IconBtn title="Retirer la vérification" className="text-gold-400" onClick={() => admin && act(() => adminSetVerification(p!.id, 'unverified', admin), 'Vérification retirée.')}><RotateCcw size={14} /></IconBtn>
                    )}
                    <IconBtn title={p!.featured ? 'Retirer la mise en avant' : 'Mettre en avant'} className="text-gold-400" onClick={() => admin && act(() => adminSetFeatured(p!.id, !p!.featured, admin), p!.featured ? 'Mise en avant retirée.' : 'Profil mis en avant sur l’accueil.')}>
                      <Star size={14} fill={p!.featured ? 'currentColor' : 'none'} />
                    </IconBtn>
                    <IconBtn title="Modifier" onClick={() => setEdit({ p: p!, u })}><Pencil size={14} /></IconBtn>
                    {u.suspended ? (
                      <IconBtn title="Réactiver" className="text-forest-600" onClick={() => admin && act(() => adminSetSuspended(u.id, false, admin), 'Compte réactivé.')}><RotateCcw size={14} /></IconBtn>
                    ) : (
                      <IconBtn title="Suspendre" className="text-flame-600" onClick={() => admin && act(() => adminSetSuspended(u.id, true, admin), 'Compte suspendu.')}><Ban size={14} /></IconBtn>
                    )}
                    <IconBtn title="Supprimer" className="text-flame-600" onClick={() => setDel({ p: p!, u })}><Trash2 size={14} /></IconBtn>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length === 0 && <p className="px-4 py-8 text-center text-sm text-white/50">Aucun participant trouvé.</p>}
      </Card>

      {/* modal édition */}
      <Modal open={!!edit} onClose={() => setEdit(null)} title={edit ? `Modifier — ${edit.p.fullName}` : ''} wide>
        {edit && admin && <EditParticipantForm key={edit.u.id} p={edit.p} admin={admin} onDone={() => { setEdit(null); toast.push('success', 'Profil mis à jour.'); }} />}
      </Modal>

      {/* modal suppression */}
      <Modal open={!!del} onClose={() => setDel(null)} title="Supprimer ce compte ?">
        {del && (
          <>
            <p className="text-sm text-soft">Le compte <strong className="text-ink">@{del.u.username}</strong> ({del.p.fullName}) ainsi que son profil, ses contacts, favoris et demandes seront définitivement supprimés. Action journalisée.</p>
            <div className="mt-5 flex justify-end gap-2">
              <Btn variant="ghost" onClick={() => setDel(null)}>Annuler</Btn>
              <Btn variant="danger" onClick={() => { if (admin) adminDeleteUser(del.u.id, admin); toast.push('info', 'Compte supprimé.'); setDel(null); }}><Trash2 size={14} /> Supprimer définitivement</Btn>
            </div>
          </>
        )}
      </Modal>
    </Shell>
  );
}

function IconBtn({ children, onClick, title, className }: { children: ReactNode; onClick: () => void; title: string; className?: string }) {
  return (
    <button title={title} aria-label={title} onClick={onClick} className={cx('cursor-pointer rounded-md p-1.5 text-white/60 transition-all hover:scale-110 hover:bg-white/10', className)}>
      {children}
    </button>
  );
}

function EditParticipantForm({ p, admin, onDone }: { p: Profile; admin: User; onDone: () => void }) {
  const db = useDb();
  const [d, setD] = useState({
    firstName: p.firstName, lastName: p.lastName, title: p.title || '', organization: p.organization || '',
    representedCountry: p.representedCountry || '', verification: p.verification, featured: p.featured, badges: p.badges,
  });
  const BADGES: Array<{ id: BadgeId; label: string }> = [
    { id: 'intervenant', label: 'Intervenant officiel' }, { id: 'paneliste', label: 'Panéliste' },
    { id: 'moderateur', label: 'Modérateur' }, { id: 'invite_officiel', label: 'Invité officiel' },
    { id: 'organisateur', label: 'Organisateur' }, { id: 'partenaire', label: 'Partenaire officiel' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Prénom"><Input value={d.firstName} onChange={(e) => setD({ ...d, firstName: e.target.value })} /></Field>
        <Field label="Nom"><Input value={d.lastName} onChange={(e) => setD({ ...d, lastName: e.target.value })} /></Field>
        <Field label="Fonction"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
        <Field label="Organisation"><Input value={d.organization} onChange={(e) => setD({ ...d, organization: e.target.value })} /></Field>
        <Field label="Statut de vérification">
          <Select value={d.verification} onChange={(e) => setD({ ...d, verification: e.target.value as Verification })}>
            <option value="unverified">Non vérifié</option><option value="pending">En cours de vérification</option><option value="verified">Vérifié</option>
          </Select>
        </Field>
      </div>
      <div>
        <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-soft uppercase">Badges officiels</p>
        <div className="grid grid-cols-2 gap-1.5">
          {BADGES.map((b) => (
            <label key={b.id} className="flex cursor-pointer items-center gap-2 rounded-md border border-line px-2.5 py-2 text-[12.5px] font-semibold text-ink">
              <input type="checkbox" checked={d.badges.includes(b.id)} className="h-3.5 w-3.5 accent-[#153B8E]"
                onChange={(e) => setD({ ...d, badges: e.target.checked ? [...d.badges, b.id] : d.badges.filter((x) => x !== b.id) })} />
              {b.label}
            </label>
          ))}
        </div>
      </div>
      <Toggle checked={d.featured} onChange={(v) => setD({ ...d, featured: v })} label="Profil mis en avant sur la page d’accueil" />
      <div className="flex justify-end gap-2 border-t border-line pt-4">
        <Btn variant="ghost" onClick={onDone}>Annuler</Btn>
        <Btn onClick={() => {
          adminUpdateProfile(p.id, {
            firstName: d.firstName, lastName: d.lastName, title: d.title, organization: d.organization,
            representedCountry: d.representedCountry || undefined, verification: d.verification,
            featured: d.featured, badges: d.badges,
          }, admin);
          if (d.verification === 'verified' && p.verification !== 'verified') adminSetVerification(p.id, 'verified', admin);
          onDone();
        }}>Enregistrer</Btn>
      </div>
    </div>
  );
}

/* ================= PROGRAMME ================= */
const CATEGORIES = ['accueil', 'ceremonie', 'conference', 'panel', 'pause', 'networking', 'b2b', 'atelier', 'expo', 'pleniere', 'officiel', 'decouverte', 'gala', 'depart'];
const DATES = ['2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-12'];

export function AdminProgramme() {
  const db = useDb();
  const { user: admin } = useAuth();
  const toast = useToast();
  const [editing, setEditing] = useState<Session | 'new' | null>(null);
  const [delId, setDelId] = useState<string | null>(null);

  return (
    <Shell title="Gestion du programme" desc="Créez, modifiez ou supprimez des sessions, associez intervenants et panels, signalez les mises à jour urgentes.">
      <div className="mb-4"><Btn variant="gold" onClick={() => setEditing('new')}><Plus size={15} /> Nouvelle session</Btn></div>
      {DATES.map((date) => {
        const list = db.sessions.filter((s) => s.date === date).sort((a, b) => (a.startTime || a.dayPart || 'z').localeCompare(b.startTime || b.dayPart || 'z'));
        return (
          <div key={date} className="mb-5">
            <h3 className="mb-2 font-mono text-[11px] font-semibold tracking-[0.16em] text-gold-400 uppercase">{date}</h3>
            <Card className="divide-y divide-white/5 p-0">
              {list.map((s) => (
                <div key={s.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  <span className="w-24 shrink-0 font-mono text-xs font-bold text-white">{s.startTime ? `${s.startTime}–${s.endTime || ''}` : s.dayPart || '—'}</span>
                  <span className="min-w-0 flex-1 truncate text-[13.5px] font-semibold text-white">{s.title}{s.urgent && <span className="ml-2 rounded-sm bg-flame-600 px-1.5 py-0.5 text-[9px] font-bold uppercase">urgent</span>}</span>
                  <span className="font-mono text-[10.5px] text-white/40">{s.room || ''}</span>
                  <div className="flex gap-1">
                    <IconBtn title="Modifier" onClick={() => setEditing(s)}><Pencil size={14} /></IconBtn>
                    <IconBtn title="Supprimer" className="text-flame-600" onClick={() => setDelId(s.id)}><Trash2 size={14} /></IconBtn>
                  </div>
                </div>
              ))}
              {list.length === 0 && <p className="px-4 py-3 text-[13px] text-white/40">Aucune session.</p>}
            </Card>
          </div>
        );
      })}

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Nouvelle session' : 'Modifier la session'} wide>
        {editing && admin && <SessionForm key={editing === 'new' ? 'new' : editing.id} session={editing === 'new' ? null : editing} admin={admin} onDone={() => { setEditing(null); toast.push('success', 'Session enregistrée.'); }} />}
      </Modal>

      <Modal open={!!delId} onClose={() => setDelId(null)} title="Supprimer cette session ?">
        <p className="text-sm text-soft">La session sera retirée du programme officiel et des agendas des participants. Action journalisée.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setDelId(null)}>Annuler</Btn>
          <Btn variant="danger" onClick={() => { if (admin && delId) adminDeleteSession(delId, admin); toast.push('info', 'Session supprimée.'); setDelId(null); }}><Trash2 size={14} /> Supprimer</Btn>
        </div>
      </Modal>
    </Shell>
  );
}

function SessionForm({ session, admin, onDone }: { session: Session | null; admin: User; onDone: () => void }) {
  const db = useDb();
  const [d, setD] = useState(() => ({
    title: session?.title || '', date: session?.date || '2026-09-09', startTime: session?.startTime || '',
    endTime: session?.endTime || '', dayPart: session?.dayPart || '', category: session?.category || 'panel',
    room: session?.room || '', location: session?.location || 'Centre Culturel et Artistique des Pays d’Afrique, Kinshasa',
    description: session?.description || '', topicId: session?.topicId || '', parallelGroup: session?.parallelGroup || '',
    speakerIds: session?.speakerIds || ([] as string[]), urgent: !!session?.urgent,
  }));
  const speakers = db.profiles.filter((p) => p.published && p.verification === 'verified' || p.badges.length > 0);
  const save = (announce: boolean) => {
    const s: Session = {
      id: session?.id || 'S-' + uid(), eventId: 'smd-2026', date: d.date,
      startTime: d.startTime || undefined, endTime: d.endTime || undefined, dayPart: d.dayPart || undefined,
      title: d.title, description: d.description || undefined, category: d.category,
      room: d.room || undefined, location: d.location, topicId: d.topicId || undefined,
      parallelGroup: d.parallelGroup || undefined, urgent: d.urgent, speakerIds: d.speakerIds,
      createdAt: session?.createdAt || Date.now(), updatedAt: Date.now(),
    };
    adminSaveSession(s, !session, admin, announce);
    onDone();
  };
  return (
    <div className="space-y-4">
      <Field label="Titre de la session" required><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} /></Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Journée">
          <Select value={d.date} onChange={(e) => setD({ ...d, date: e.target.value })}>
            {DATES.map((x) => <option key={x} value={x}>{x}</option>)}
          </Select>
        </Field>
        <Field label="Catégorie">
          <Select value={d.category} onChange={(e) => setD({ ...d, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Heure de début" hint="Laisser vide si non précisée"><Input type="time" value={d.startTime} onChange={(e) => setD({ ...d, startTime: e.target.value })} /></Field>
        <Field label="Heure de fin"><Input type="time" value={d.endTime} onChange={(e) => setD({ ...d, endTime: e.target.value })} /></Field>
        <Field label="Moment de journée" hint="Si pas d’horaire (Matin, Midi…)"><Input value={d.dayPart} onChange={(e) => setD({ ...d, dayPart: e.target.value })} placeholder="Matin" /></Field>
        <Field label="Salle"><Input value={d.room} onChange={(e) => setD({ ...d, room: e.target.value })} placeholder="Grande Salle" /></Field>
        <Field label="Panel / thématique">
          <Select value={d.topicId} onChange={(e) => setD({ ...d, topicId: e.target.value })}>
            <option value="">—</option>
            {db.topics.filter((x) => x.active).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </Select>
        </Field>
        <Field label="Groupe de simultanéité" hint="ex. J2-A"><Input value={d.parallelGroup} onChange={(e) => setD({ ...d, parallelGroup: e.target.value })} /></Field>
      </div>
      <Field label="Description"><Textarea value={d.description} onChange={(e) => setD({ ...d, description: e.target.value })} rows={3} /></Field>
      <div>
        <p className="mb-2 font-mono text-[11px] font-semibold tracking-[0.14em] text-soft uppercase">Intervenants associés</p>
        <div className="grid max-h-44 grid-cols-2 gap-1.5 overflow-y-auto rounded-md border border-line p-2">
          {speakers.map((p) => (
            <label key={p.id} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[12.5px] font-semibold text-ink hover:bg-paper">
              <input type="checkbox" checked={d.speakerIds.includes(p.id)} className="h-3.5 w-3.5 accent-[#153B8E]"
                onChange={(e) => setD({ ...d, speakerIds: e.target.checked ? [...d.speakerIds, p.id] : d.speakerIds.filter((x) => x !== p.id) })} />
              <span className="truncate">{p.fullName}</span>
            </label>
          ))}
        </div>
      </div>
      <Toggle checked={d.urgent} onChange={(v) => setD({ ...d, urgent: v })} label="Marquer comme mise à jour urgente du programme" />
      <div className="flex flex-wrap justify-end gap-2 border-t border-line pt-4">
        <Btn variant="ghost" onClick={onDone}>Annuler</Btn>
        <Btn variant="outline" onClick={() => save(false)}>Enregistrer</Btn>
        <Btn onClick={() => save(true)}><AlertTriangle size={14} /> Enregistrer & notifier tous les participants</Btn>
      </div>
    </div>
  );
}

/* ================= TAXONOMIES ================= */
export function AdminTaxonomies() {
  const db = useDb();
  const { user: admin } = useAuth();
  const toast = useToast();
  const [tab, setTab] = useState('types');
  const [newItem, setNewItem] = useState('');

  const kind: TaxKind = tab === 'types' ? 'participantTypes' : tab === 'sectors' ? 'sectors' : 'topics';
  const items: Array<{ id: string; name: string; active: boolean; description?: string }> =
    kind === 'topics' ? db.topics as any : kind === 'sectors' ? db.sectors as any : db.participantTypes as any;

  return (
    <Shell title="Taxonomies" desc="Types de participants, secteurs d’activité et panels — administrables pour les prochaines éditions (SMD Network).">
      <div className="mb-5 max-w-xl"><Tabs items={[{ id: 'types', label: 'Types de participants' }, { id: 'sectors', label: 'Secteurs' }, { id: 'topics', label: 'Panels' }]} active={tab} onChange={(id) => { setTab(id); setNewItem(''); }} /></div>
      <Card>
        <form className="mb-4 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (newItem.trim()) { taxonomyAdd(kind, newItem.trim(), undefined, admin); toast.push('success', `« ${newItem} » ajouté.`); setNewItem(''); } }}>
          <Input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder={`Nouveau ${tab === 'topics' ? 'panel' : tab === 'sectors' ? 'secteur' : 'type'}…`} className="border-white/15 bg-white/5 text-white placeholder:text-white/40" />
          <Btn type="submit" variant="gold"><Plus size={14} /> Ajouter</Btn>
        </form>
        <div className="divide-y divide-white/5">
          {items.map((it) => (
            <div key={it.id} className="flex items-center gap-3 py-2.5">
              <span className={cx('flex-1 text-[13.5px] font-semibold', it.active ? 'text-white' : 'text-white/35 line-through')}>{it.name}</span>
              <span className="font-mono text-[10px] text-white/35">{it.id}</span>
              <Toggle checked={it.active} onChange={(v) => { taxonomyToggle(kind, it.id, v, admin); toast.push('info', v ? 'Activé.' : 'Désactivé.'); }} />
              <IconBtn title="Supprimer" className="text-flame-600" onClick={() => { taxonomyRemove(kind, it.id, admin); toast.push('info', 'Supprimé.'); }}><Trash2 size={14} /></IconBtn>
            </div>
          ))}
        </div>
      </Card>
    </Shell>
  );
}

/* ================= ANNONCES ================= */
export function AdminAnnonces() {
  const db = useDb();
  const { user: admin } = useAuth();
  const toast = useToast();
  const [d, setD] = useState({ title: '', message: '', audience: 'all' as 'all' | 'country' | 'topic' | 'type' | 'speakers', audienceValue: '' });

  const send = () => {
    if (!admin || !d.title.trim() || !d.message.trim()) return toast.push('error', 'Titre et message requis.');
    const count = sendAnnouncement(admin, d);
    toast.push('success', `Annonce publiée — ${count} participant(s) notifié(s).`);
    setD({ title: '', message: '', audience: 'all', audienceValue: '' });
  };

  return (
    <Shell title="Annonces officielles" desc="Diffusez une annonce ciblée : tous les participants, un pays, un panel, un type de participant ou les intervenants.">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <Card>
          <h3 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-gold-400 uppercase">Nouvelle annonce</h3>
          <div className="space-y-3.5">
            <Field label="Titre"><Input value={d.title} onChange={(e) => setD({ ...d, title: e.target.value })} placeholder="Information importante…" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" /></Field>
            <Field label="Message"><Textarea value={d.message} onChange={(e) => setD({ ...d, message: e.target.value })} rows={4} placeholder="Contenu de l’annonce officielle…" className="border-white/15 bg-white/5 text-white placeholder:text-white/40" /></Field>
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Audience">
                <Select value={d.audience} onChange={(e) => setD({ ...d, audience: e.target.value as any, audienceValue: '' })} className="border-white/15 bg-white/5 text-white">
                  <option value="all" className="text-ink">Tous les participants</option>
                  <option value="country" className="text-ink">Un pays</option>
                  <option value="topic" className="text-ink">Un panel</option>
                  <option value="type" className="text-ink">Un type de participant</option>
                  <option value="speakers" className="text-ink">Les intervenants</option>
                </Select>
              </Field>
              {d.audience !== 'all' && d.audience !== 'speakers' && (
                <Field label="Cible">
                  <Select value={d.audienceValue} onChange={(e) => setD({ ...d, audienceValue: e.target.value })} className="border-white/15 bg-white/5 text-white">
                    <option value="" className="text-ink">—</option>
                    {(d.audience === 'topic' ? db.topics.map((x) => ({ id: x.id, name: x.name })) :
                      d.audience === 'type' ? db.participantTypes.map((x) => ({ id: x.id, name: x.name })) :
                      [{ id: 'CD', name: 'RD Congo' }, { id: 'SN', name: 'Sénégal' }, { id: 'CI', name: 'Côte d’Ivoire' }, { id: 'CM', name: 'Cameroun' }, { id: 'KE', name: 'Kenya' }, { id: 'NG', name: 'Nigeria' }, { id: 'MA', name: 'Maroc' }, { id: 'AO', name: 'Angola' }]).map((x) => (
                      <option key={x.id} value={x.id} className="text-ink">{x.name}</option>
                    ))}
                  </Select>
                </Field>
              )}
            </div>
            <Btn variant="gold" onClick={send}><Megaphone size={14} /> Publier l’annonce</Btn>
          </div>
        </Card>
        <Card>
          <h3 className="mb-3 font-mono text-[11px] font-semibold tracking-[0.16em] text-gold-400 uppercase">Historique</h3>
          {db.announcements.length === 0 ? <p className="text-sm text-white/50">Aucune annonce.</p> : (
            <div className="space-y-2.5">
              {db.announcements.map((a) => (
                <div key={a.id} className="rounded-md border-l-[3px] border-gold-400 bg-white/5 px-3.5 py-2.5">
                  <p className="text-[13px] font-bold text-white">{a.title}</p>
                  <p className="line-clamp-2 text-[12px] text-white/60">{a.message}</p>
                  <p className="mt-1 font-mono text-[10px] text-white/40 uppercase">{fmtDateTime(a.publishedAt)} · audience : {a.audience}{a.audienceValue ? ` / ${a.audienceValue}` : ''}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </Shell>
  );
}

/* ================= JOURNAL D'AUDIT ================= */
export function AdminLogs() {
  const db = useDb();
  const [q, setQ] = useState('');
  const logs = db.audits.filter((a) => !q.trim() || (a.action + ' ' + a.adminName + ' ' + a.entityType + ' ' + a.entityId).toLowerCase().includes(q.toLowerCase()));
  return (
    <Shell title="Journal d’audit" desc="Toutes les actions administratives sensibles : vérifications, modifications, suspensions, suppressions, rôles, programme, annonces.">
      <div className="relative mb-4 max-w-md">
        <Search size={15} className="absolute top-1/2 left-3 -translate-y-1/2 text-white/40" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filtrer le journal…" className="border-white/15 bg-white/5 pl-9 text-white placeholder:text-white/40" />
      </div>
      <Card className="overflow-x-auto p-0">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-white/10">
            <tr><THead>Date</THead><THead>Administrateur</THead><THead>Action</THead><THead>Entité</THead><THead>Détail</THead></tr>
          </thead>
          <tbody>
            {logs.map((a) => (
              <tr key={a.id} className="border-b border-white/5 transition-colors hover:bg-white/4">
                <td className="px-3 py-2.5 font-mono text-[11px] whitespace-nowrap text-white/60">{fmtDateTime(a.createdAt)}</td>
                <td className="px-3 py-2.5 font-bold text-white">@{a.adminName}</td>
                <td className="px-3 py-2.5 text-[13px] text-white/85">{a.action}</td>
                <td className="px-3 py-2.5 font-mono text-[11px] text-white/50">{a.entityType}/{a.entityId.slice(0, 18)}</td>
                <td className="max-w-[220px] truncate px-3 py-2.5 font-mono text-[10.5px] text-white/40">
                  {a.oldData && a.newData ? `${a.oldData.slice(0, 30)} → ${a.newData.slice(0, 30)}` : (a.newData || a.oldData || '—')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {logs.length === 0 && <p className="px-4 py-8 text-center text-sm text-white/50">Aucune entrée.</p>}
      </Card>
    </Shell>
  );
}
