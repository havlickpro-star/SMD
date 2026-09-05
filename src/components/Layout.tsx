import { useState, ReactNode } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  Bell, Home, Users, CalendarDays, UserPlus, UserCircle2, LogOut, ChevronDown,
  ShieldCheck, AlertTriangle, ArrowRight, RotateCcw, Star,
} from 'lucide-react';
import { useAuth } from '../lib/auth';
import { useDb, logout, isAdmin, resetDemo } from '../lib/db';
import { cx, completeness } from '../lib/utils';
import { t } from '../lib/i18n';
import { Logo, Avatar } from './bits';
import { Btn, Modal } from './ui';

const NAV = [
  { to: '/', label: () => t('nav.home'), end: true },
  { to: '/annuaire', label: () => t('nav.directory') },
  { to: '/intervenants', label: () => t('nav.speakers') },
  { to: '/panels', label: () => t('nav.panels') },
  { to: '/programme', label: () => t('nav.program') },
  { to: '/agenda', label: () => t('nav.agenda'), auth: true },
  { to: '/networking', label: () => t('nav.networking'), auth: true },
];

export function Layout({ children }: { children: ReactNode }) {
  const { user, profile } = useAuth();
  const db = useDb();
  const nav = useNavigate();
  const loc = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const unread = user ? db.notifications.filter((n) => n.userId === user.id && !n.read).length : 0;
  const pendingRequests = user ? db.requests.filter((r) => r.receiverId === user.id && r.status === 'pending').length : 0;
  const needsProfile = !!user && profile && (!profile.published || completeness(profile) < 60) && !loc.pathname.startsWith('/onboarding');

  const linkCls = ({ isActive }: { isActive: boolean }) =>
    cx(
      'relative shrink-0 rounded-md px-3 py-2 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150',
      isActive ? 'text-gold-400' : 'text-white/75 hover:bg-white/8 hover:text-white',
    );

  return (
    <div className="flex min-h-screen flex-col">
      {/* barre tricolore signature */}
      <div className="flag-bar h-1" />

      {/* header desktop */}
      <header className="sticky top-0 z-50 border-b border-white/10 bg-navy-900 text-white shadow-md shadow-navy-950/20">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4 sm:px-6">
          <Logo light small />
          <nav className="no-scrollbar ml-4 hidden flex-1 items-center gap-0.5 overflow-x-auto lg:flex" aria-label="Navigation principale">
            {NAV.filter((n) => !n.auth || !!user).map((n) => (
              <NavLink key={n.to} to={n.to} end={n.end as boolean | undefined} className={linkCls}>
                {n.label()}
              </NavLink>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-1.5">
            {user && (
              <Link to="/notifications" aria-label={`${t('nav.notifications')} (${unread} non lues)`} className="relative rounded-md p-2 text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                <Bell size={18} />
                {(unread > 0 || pendingRequests > 0) && (
                  <span className="absolute top-0.5 right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold-400 px-1 font-mono text-[9px] font-bold text-navy-900">
                    {unread + pendingRequests}
                  </span>
                )}
              </Link>
            )}
            {user && profile ? (
              <div className="relative">
                <button onClick={() => setMenuOpen((v) => !v)} className="flex cursor-pointer items-center gap-2 rounded-md py-1 pr-1 pl-1 transition-colors hover:bg-white/10" aria-haspopup="menu" aria-expanded={menuOpen}>
                  <Avatar profile={profile} size={32} />
                  <span className="hidden max-w-[130px] truncate text-[13px] font-bold sm:block">{profile.firstName || user.username}</span>
                  <ChevronDown size={14} className={cx('transition-transform', menuOpen && 'rotate-180')} />
                </button>
                {menuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(false)} />
                    <div className="absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-lg border border-line bg-card text-ink shadow-xl">
                      <div className="border-b border-line bg-paper px-4 py-3">
                        <p className="truncate font-display text-sm font-bold">{profile.fullName || user.username}</p>
                        <p className="truncate text-xs text-soft">@{user.username}</p>
                      </div>
                      {[
                        { to: '/profil', icon: <UserCircle2 size={15} />, label: t('nav.profile') },
                        { to: '/contacts', icon: <Users size={15} />, label: t('nav.contacts') },
                        { to: '/favoris', icon: <Star size={15} />, label: t('nav.favorites') },
                        ...(isAdmin(user) ? [{ to: '/admin', icon: <ShieldCheck size={15} />, label: t('nav.admin') }] : []),
                      ].map((it) => (
                        <Link key={it.to} to={it.to} onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] font-semibold text-ink transition-colors hover:bg-royal-50 hover:text-royal-800">
                          {it.icon}{it.label}
                        </Link>
                      ))}
                      <button
                        onClick={() => { logout(); setMenuOpen(false); nav('/'); }}
                        className="flex w-full cursor-pointer items-center gap-2.5 border-t border-line px-4 py-2.5 text-left text-[13px] font-semibold text-flame-600 transition-colors hover:bg-flame-100"
                      >
                        <LogOut size={15} />{t('nav.logout')}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/connexion" className="rounded-md px-3 py-2 text-[13px] font-bold text-white/85 transition-colors hover:text-white">{t('nav.login')}</Link>
                <Link to="/inscription" className="rounded-md bg-gold-400 px-3.5 py-2 text-[13px] font-bold text-navy-900 shadow-sm transition-all hover:bg-gold-500">Inscription</Link>
              </div>
            )}
          </div>
        </div>
        {/* nav mobile secondaire */}
        <nav className="no-scrollbar flex items-center gap-0.5 overflow-x-auto border-t border-white/8 px-2 py-1 lg:hidden" aria-label="Navigation mobile">
          {NAV.filter((n) => !n.auth || !!user).map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end as boolean | undefined} className={linkCls}>
              {n.label()}
            </NavLink>
          ))}
        </nav>
      </header>

      {/* bannière profil incomplet */}
      {needsProfile && (
        <div className="border-b border-gold-400/40 bg-gold-100">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-3 px-4 py-2.5 sm:px-6">
            <AlertTriangle size={16} className="text-gold-700" />
            <p className="flex-1 text-[13px] font-semibold text-gold-700">
              {profile!.published ? 'Votre profil est incomplet — complétez-le pour être pleinement visible dans l’annuaire.' : 'Votre profil n’est pas encore publié — finalisez votre présentation pour apparaître dans l’annuaire.'}
            </p>
            <Link to={profile!.published ? '/profil/modifier' : '/onboarding'} className="inline-flex items-center gap-1 text-[13px] font-bold text-navy-900 underline-offset-2 hover:underline">
              Compléter mon profil <ArrowRight size={13} />
            </Link>
          </div>
        </div>
      )}

      <main className="flex-1 pb-24 lg:pb-0">{children}</main>

      {/* footer */}
      <footer className="mt-16 bg-navy-950 text-white">
        <div className="flag-bar h-1" />
        <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <Logo light small />
            <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-white/60">
              {t('app.tagline')} — 3e édition organisée par le FIJADA à Kinshasa, République Démocratique du Congo.
            </p>
            <p className="mt-4 font-mono text-[10px] tracking-[0.18em] text-white/40 uppercase">08 – 12 septembre 2026 · Centre Culturel et Artistique des Pays d’Afrique</p>
          </div>
          <div>
            <p className="mb-3 font-mono text-[10.5px] font-semibold tracking-[0.2em] text-gold-400 uppercase">Plateforme</p>
            {[['/annuaire', t('nav.directory')], ['/intervenants', t('nav.speakers')], ['/programme', t('nav.program')], ['/panels', t('nav.panels')]].map(([to, l]) => (
              <Link key={to} to={to} className="block py-1 text-[13px] text-white/70 transition-colors hover:text-gold-400">{l}</Link>
            ))}
          </div>
          <div>
            <p className="mb-3 font-mono text-[10.5px] font-semibold tracking-[0.2em] text-gold-400 uppercase">Participants</p>
            {[['/inscription', 'Créer un compte'], ['/connexion', t('nav.login')], ['/agenda', t('nav.agenda')], ['/profil/qr', 'Mon QR code']].map(([to, l]) => (
              <Link key={to} to={to} className="block py-1 text-[13px] text-white/70 transition-colors hover:text-gold-400">{l}</Link>
            ))}
          </div>
          <div>
            <p className="mb-3 font-mono text-[10.5px] font-semibold tracking-[0.2em] text-gold-400 uppercase">Informations</p>
            {[['/a-propos', t('nav.about')], ['/politique-confidentialite', 'Politique de confidentialité'], ['/conditions', 'Conditions d’utilisation'], ['/admin', 'Administration FIJADA']].map(([to, l]) => (
              <Link key={to} to={to} className="block py-1 text-[13px] text-white/70 transition-colors hover:text-gold-400">{l}</Link>
            ))}
            <button onClick={() => setResetOpen(true)} className="mt-3 inline-flex cursor-pointer items-center gap-1.5 font-mono text-[10.5px] tracking-wider text-white/40 uppercase transition-colors hover:text-flame-600">
              <RotateCcw size={11} /> Réinitialiser la démo
            </button>
          </div>
        </div>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 px-4 py-4 sm:px-6">
            <p className="font-mono text-[10px] tracking-wider text-white/40 uppercase">© 2026 FIJADA — Forum International de la Jeunesse Africaine pour le Développement de l’Afrique</p>
            <p className="font-mono text-[10px] tracking-wider text-white/40 uppercase">Plateforme officielle · SMD Network</p>
          </div>
        </div>
      </footer>

      {/* nav inférieure mobile */}
      <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-line bg-card/95 backdrop-blur lg:hidden" aria-label="Navigation inférieure">
        <div className="grid grid-cols-5">
          {[
            { to: '/', icon: Home, label: t('nav.home') },
            { to: '/annuaire', icon: Users, label: t('nav.directory') },
            { to: '/programme', icon: CalendarDays, label: t('nav.program') },
            { to: user ? '/networking' : '/connexion', icon: UserPlus, label: 'Réseau' },
            { to: user ? '/profil' : '/connexion', icon: UserCircle2, label: t('nav.profile') },
          ].map(({ to, icon: I, label }) => (
            <NavLink
              key={label}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                cx('relative flex flex-col items-center gap-0.5 py-2.5 text-[9.5px] font-bold transition-colors', isActive ? 'text-royal-700' : 'text-soft/70')
              }
            >
              {({ isActive }) => (
                <>
                  <span className={cx('absolute top-0 h-0.5 w-8 rounded-full transition-all', isActive ? 'bg-gold-400' : 'bg-transparent')} />
                  <I size={19} strokeWidth={isActive ? 2.4 : 2} />
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Réinitialiser les données de démonstration">
        <p className="text-sm text-soft">Toutes les données locales (comptes créés, demandes, agenda…) seront remplacées par le jeu de démonstration initial et le programme officiel. Vous serez déconnecté.</p>
        <div className="mt-5 flex justify-end gap-2">
          <Btn variant="ghost" onClick={() => setResetOpen(false)}>Annuler</Btn>
          <Btn variant="danger" onClick={() => { resetDemo(); setResetOpen(false); nav('/'); }}>Réinitialiser</Btn>
        </div>
      </Modal>
    </div>
  );
}
