import { useEffect, ReactNode } from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './lib/auth';
import { useDb, isAdmin } from './lib/db';
import { ToastProvider } from './components/ui';
import { Layout } from './components/Layout';
import HomePage from './pages/Home';
import { LoginPage, RegisterPage, ForgotPage } from './pages/Auth';
import OnboardingPage from './pages/Onboarding';
import DirectoryPage from './pages/Directory';
import ProfilePage from './pages/Profile';
import { ProgramPage, AgendaPage } from './pages/Program';
import { SpeakersPage, PanelsPage } from './pages/Discover';
import { NetworkingPage, ContactsPage, FavoritesPage, NotificationsPage } from './pages/Networking';
import { DashboardPage, EditProfilePage, PrivacyPage, QRPage, CardPage } from './pages/MySpace';
import { AdminDashboard, AdminParticipants, AdminProgramme, AdminTaxonomies, AdminAnnonces, AdminLogs } from './pages/Admin';
import { AboutPage, PrivacyPage as PolicyPage, TermsPage, NotFoundPage, AccessDeniedPage } from './pages/Static';

const TITLES: Array<[string, string]> = [
  ['/', 'Annuaire SMD — FIJADA 2026 | Sommet Mondial de la Diplomatie'],
  ['/annuaire', 'Annuaire des participants | Annuaire SMD — FIJADA 2026'],
  ['/programme', 'Programme officiel | Annuaire SMD — FIJADA 2026'],
  ['/agenda', 'Mon agenda | Annuaire SMD — FIJADA 2026'],
  ['/intervenants', 'Intervenants & personnalités | Annuaire SMD — FIJADA 2026'],
  ['/panels', 'Panels & thématiques | Annuaire SMD — FIJADA 2026'],
  ['/networking', 'Networking | Annuaire SMD — FIJADA 2026'],
  ['/admin', 'Administration FIJADA | Annuaire SMD — FIJADA 2026'],
];

function Meta() {
  const loc = useLocation();
  useEffect(() => {
    const hit = TITLES.find(([p]) => p === loc.pathname);
    document.title = hit ? hit[1] : loc.pathname.startsWith('/participant')
      ? 'Profil | Annuaire SMD — FIJADA 2026'
      : 'Annuaire SMD — FIJADA 2026 | Sommet Mondial de la Diplomatie';
    window.scrollTo(0, 0);
  }, [loc.pathname]);
  return null;
}

function RequireAuth({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user) return <Navigate to={`/connexion?next=${encodeURIComponent(loc.pathname)}`} replace />;
  return <>{children}</>;
}
function RequireAdmin({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/connexion?next=/admin" replace />;
  if (!isAdmin(user)) return <Navigate to="/acces-refuse" replace />;
  return <>{children}</>;
}
function SuspendedGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  if (user?.suspended) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
        <p className="font-mono text-[12px] tracking-[0.3em] text-flame-600 uppercase">Compte suspendu</p>
        <h1 className="mt-2 font-display text-3xl font-extrabold text-navy-900">Accès temporairement bloqué</h1>
        <p className="mt-3 max-w-md text-sm leading-relaxed text-soft">
          Votre compte a été suspendu par l’administration FIJADA. Pour toute régularisation, contactez :
          <a href="mailto:contact@fijada-smd.cd" className="mx-1 font-bold text-royal-700 underline">contact@fijada-smd.cd</a>
        </p>
      </div>
    );
  }
  return <>{children}</>;
}

function Shell() {
  const loc = useLocation();
  const isAdminRoute = loc.pathname.startsWith('/admin');
  const isOnboarding = loc.pathname.startsWith('/onboarding');
  useDb(); // keep layout reactive

  if (isAdminRoute) {
    return (
      <Routes>
        <Route path="/admin" element={<RequireAdmin><AdminDashboard /></RequireAdmin>} />
        <Route path="/admin/participants" element={<RequireAdmin><AdminParticipants /></RequireAdmin>} />
        <Route path="/admin/programme" element={<RequireAdmin><AdminProgramme /></RequireAdmin>} />
        <Route path="/admin/taxonomies" element={<RequireAdmin><AdminTaxonomies /></RequireAdmin>} />
        <Route path="/admin/annonces" element={<RequireAdmin><AdminAnnonces /></RequireAdmin>} />
        <Route path="/admin/logs" element={<RequireAdmin><AdminLogs /></RequireAdmin>} />
      </Routes>
    );
  }
  if (isOnboarding) {
    return <OnboardingPage />;
  }
  return (
    <Layout>
      <SuspendedGate>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/connexion" element={<LoginPage />} />
          <Route path="/inscription" element={<RegisterPage />} />
          <Route path="/mot-de-passe-oublie" element={<ForgotPage />} />
          <Route path="/annuaire" element={<DirectoryPage />} />
          <Route path="/participant/:username" element={<ProfilePage />} />
          <Route path="/intervenants" element={<SpeakersPage />} />
          <Route path="/panels" element={<PanelsPage />} />
          <Route path="/programme" element={<ProgramPage />} />
          <Route path="/agenda" element={<RequireAuth><AgendaPage /></RequireAuth>} />
          <Route path="/networking" element={<RequireAuth><NetworkingPage /></RequireAuth>} />
          <Route path="/contacts" element={<RequireAuth><ContactsPage /></RequireAuth>} />
          <Route path="/favoris" element={<RequireAuth><FavoritesPage /></RequireAuth>} />
          <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
          <Route path="/profil" element={<RequireAuth><DashboardPage /></RequireAuth>} />
          <Route path="/profil/modifier" element={<RequireAuth><EditProfilePage /></RequireAuth>} />
          <Route path="/profil/confidentialite" element={<RequireAuth><PrivacyPage /></RequireAuth>} />
          <Route path="/profil/qr" element={<RequireAuth><QRPage /></RequireAuth>} />
          <Route path="/profil/carte" element={<RequireAuth><CardPage /></RequireAuth>} />
          <Route path="/a-propos" element={<AboutPage />} />
          <Route path="/politique-confidentialite" element={<PolicyPage />} />
          <Route path="/conditions" element={<TermsPage />} />
          <Route path="/acces-refuse" element={<AccessDeniedPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </SuspendedGate>
    </Layout>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <HashRouter>
          <Meta />
          <Shell />
        </HashRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
