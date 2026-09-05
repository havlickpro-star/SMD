import { Link } from 'react-router-dom';
import { MapPin, CalendarDays, Landmark, Globe2, ArrowLeft, ShieldAlert, Compass } from 'lucide-react';
import { useDb } from '../lib/db';
import { PageHero } from '../components/bits';
import { Btn } from '../components/ui';

export function AboutPage() {
  const db = useDb();
  return (
    <div>
      <PageHero kicker="FIJADA — Forum International de la Jeunesse Africaine pour le Développement de l’Afrique" title="À propos du Sommet Mondial de la Diplomatie" desc="La 3e édition réunit à Kinshasa diplomates, institutions, investisseurs, universitaires, jeunes leaders et société civile autour d’un même objectif : faire de la diplomatie contemporaine un levier de développement durable." />
      <div className="mx-auto max-w-4xl space-y-8 px-4 py-10 sm:px-6">
        <div className="rounded-xl border border-line bg-card p-7">
          <p className="border-l-[3px] border-gold-400 bg-paper px-4 py-3 text-[15px] leading-relaxed font-semibold text-navy-900 italic">{db.event.theme}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <div className="rounded-lg border border-line bg-paper p-4">
              <CalendarDays size={18} className="text-royal-700" />
              <p className="mt-2 font-display text-sm font-bold text-ink">08 – 12 septembre 2026</p>
              <p className="text-xs text-soft">Pré-sommet le 08, trois journées officielles, post-sommet le 12.</p>
            </div>
            <div className="rounded-lg border border-line bg-paper p-4">
              <Landmark size={18} className="text-royal-700" />
              <p className="mt-2 font-display text-sm font-bold text-ink">Centre Culturel et Artistique des Pays d’Afrique</p>
              <p className="text-xs text-soft">Kinshasa, République Démocratique du Congo.</p>
            </div>
            <div className="rounded-lg border border-line bg-paper p-4">
              <Globe2 size={18} className="text-royal-700" />
              <p className="mt-2 font-display text-sm font-bold text-ink">La RDC, Cœur de l’Afrique</p>
              <p className="text-xs text-soft">Un carrefour diplomatique et économique continental.</p>
            </div>
          </div>
        </div>

        <section>
          <h2 className="font-display text-xl font-extrabold text-navy-900">Les cinq journées</h2>
          <div className="mt-4 space-y-2.5">
            {[
              ['08 septembre — Pré-sommet', 'Arrivée des délégations, enregistrement, réunion technique des chefs de délégation et cocktail d’accueil.'],
              ['09 septembre — Jour 1', 'Cérémonie officielle d’ouverture, conférence inaugurale et panel de haut niveau sur la paix, la sécurité et la géopolitique.'],
              ['10 septembre — Jour 2', 'Panels simultanés (diplomatie économique, investissements, commerce international, transition numérique), rencontres B2B, ateliers et salon des partenaires.'],
              ['11 septembre — Jour 3', 'Recommandations, Déclaration de Kinshasa, signatures de protocoles, photo officielle et cérémonie de clôture.'],
              ['12 septembre — Post-sommet', 'Circuit touristique et culturel de Kinshasa, déjeuner culturel, soirée de gala et départ des délégations.'],
            ].map(([ti, d]) => (
              <div key={ti} className="rounded-lg border border-line bg-card p-4 transition-shadow hover:shadow-md">
                <p className="font-display text-[14.5px] font-bold text-royal-800">{ti}</p>
                <p className="mt-1 text-[13.5px] text-soft">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl bg-navy-900 p-7 text-white">
          <p className="font-mono text-[11px] font-semibold tracking-[0.2em] text-gold-400 uppercase">Après le Sommet</p>
          <h2 className="mt-2 font-display text-xl font-extrabold">SMD Network — un réseau durable</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/75">
            L’architecture de la plateforme (éditions, années, participants et sessions liés à chaque édition) permettra
            de transformer l’annuaire en réseau professionnel permanent après l’événement, au service des prochaines
            éditions du Sommet Mondial de la Diplomatie.
          </p>
          <Link to="/inscription" className="mt-4 inline-block"><Btn variant="gold">Rejoindre le réseau</Btn></Link>
        </section>
      </div>
    </div>
  );
}

function LegalShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <PageHero kicker="Documents officiels" title={title} />
      <div className="mx-auto max-w-3xl space-y-5 px-4 py-10 sm:px-6">
        {children}
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm font-bold text-royal-700"><ArrowLeft size={14} /> Retour à l’accueil</Link>
      </div>
    </div>
  );
}
function Clause({ n, ti, children }: { n: string; ti: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-line bg-card p-6">
      <h2 className="font-display text-[16px] font-extrabold text-navy-900"><span className="mr-2 font-mono text-[13px] text-gold-500">{n}</span>{ti}</h2>
      <div className="mt-2 space-y-2 text-[14px] leading-relaxed text-soft">{children}</div>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <LegalShell title="Politique de confidentialité">
      <Clause n="01" ti="Responsable de traitement">
        <p>Les données collectées sur l’Annuaire SMD — FIJADA 2026 sont traitées par le FIJADA (Forum International de la Jeunesse Africaine pour le Développement de l’Afrique), organisateur du Sommet Mondial de la Diplomatie, dans le cadre exclusif de l’événement et du networking professionnel associé.</p>
      </Clause>
      <Clause n="02" ti="Données collectées">
        <p>Identité professionnelle (nom, fonction, organisation, pays, biographie), coordonnées (téléphone, e-mail, LinkedIn, site web) et préférences (centres d’intérêt, agenda). Aucune donnée sensible n’est exigée. Les mots de passe sont stockés hachés, jamais en clair.</p>
      </Clause>
      <Clause n="03" ti="Visibilité et consentement">
        <p>Chaque coordonnée dispose d’un réglage de visibilité : visible par tous les participants connectés, visible après mise en relation acceptée, ou privée. Les participants non connectés et les moteurs de recherche n’ont jamais accès aux coordonnées privées.</p>
      </Clause>
      <Clause n="04" ti="Vos droits">
        <p>Vous pouvez modifier vos informations, masquer vos coordonnées, exporter vos données (JSON) et supprimer votre compte à tout moment depuis « Confidentialité & compte ». Pour toute question : privacy@fijada-smd.cd.</p>
      </Clause>
      <Clause n="05" ti="Sécurité">
        <p>Contrôle d’accès par rôle, validation des entrées, journalisation des actions d’administration, limitation des tentatives de connexion et sessions persistantes sécurisées. Le badge « Vérifié SMD » est attribué uniquement par l’administration FIJADA.</p>
      </Clause>
    </LegalShell>
  );
}

export function TermsPage() {
  return (
    <LegalShell title="Conditions d’utilisation">
      <Clause n="01" ti="Objet">
        <p>La plateforme constitue l’annuaire numérique officiel, l’outil de networking et l’agenda interactif de la 3e édition du Sommet Mondial de la Diplomatie (Kinshasa, 08–12 septembre 2026). Elle prolonge l’expérience du Sommet avant, pendant et après l’événement.</p>
      </Clause>
      <Clause n="02" ti="Comptes et rôles">
        <p>L’inscription est réservée aux participants légitimes du Sommet. Les rôles (super_admin, admin, moderator, participant) déterminent les droits d’accès. Les profils sont soumis à vérification par l’administration FIJADA ; aucun utilisateur ne peut s’auto-attribuer le badge « Vérifié SMD ».</p>
      </Clause>
      <Clause n="03" ti="Conduite">
        <p>Les échanges doivent demeurer professionnels et conformes à l’esprit diplomatique du Sommet. L’administration peut suspendre ou supprimer tout compte en cas d’abus, après journalisation de la décision.</p>
      </Clause>
      <Clause n="04" ti="Programme officiel">
        <p>Seul le programme publié par l’administration fait foi. Les activités sans horaire officiel sont affichées en programme de journée ; aucun horaire n’est inventé.</p>
      </Clause>
      <Clause n="05" ti="Données de démonstration">
        <p>Les profils marqués « DÉMO » sont des données fictives destinées au développement et à l’évaluation de la plateforme ; ils ne représentent aucune personne réelle.</p>
      </Clause>
    </LegalShell>
  );
}

export function NotFoundPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <Compass size={40} className="text-royal-700" />
      <p className="mt-4 font-mono text-[12px] tracking-[0.3em] text-soft uppercase">Erreur 404</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-navy-900">Cette page n’existe pas</h1>
      <p className="mt-2 max-w-md text-sm text-soft">Le lien est peut-être erroné, ou la page a été déplacée lors d’une mise à jour du programme.</p>
      <Link to="/" className="mt-6"><Btn>Retour à l’accueil</Btn></Link>
    </div>
  );
}

export function AccessDeniedPage() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <ShieldAlert size={40} className="text-flame-600" />
      <p className="mt-4 font-mono text-[12px] tracking-[0.3em] text-soft uppercase">Accès refusé</p>
      <h1 className="mt-2 font-display text-3xl font-extrabold text-navy-900">Espace réservé à l’administration</h1>
      <p className="mt-2 max-w-md text-sm text-soft">Cette section est protégée et nécessite un rôle administrateur FIJADA. Si vous pensez qu’il s’agit d’une erreur, contactez superadmin@fijada-smd.cd.</p>
      <Link to="/" className="mt-6"><Btn variant="outline">Retour à l’accueil</Btn></Link>
    </div>
  );
}
