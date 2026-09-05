import { useSyncExternalStore } from 'react';
import type {
  DB, User, Profile, ContactDetails, Session, BadgeId, Role, Verification,
  Topic, Sector, ParticipantType, Notif, Announcement, ConnectionRequest,
} from './types';
import { uid, hashPassword, colorFor, fold } from './utils';

const KEY = 'smd_fijada_db_v1';
const SESSION_KEY = 'smd_fijada_session_v1';

/* ------------------------------------------------------------------ */
/* Identifiants du Super Admin — injectés via variables d'environnement */
/* ------------------------------------------------------------------ */
const env = (import.meta as any).env || {};
export const ADMIN_EMAIL: string = env.VITE_ADMIN_EMAIL || 'superadmin@fijada-smd.cd';
export const ADMIN_INITIAL_PASSWORD: string = env.VITE_ADMIN_INITIAL_PASSWORD || 'Fijada!2026';

/* ------------------------- store ------------------------- */
let cache: DB | null = null;
let version = 0;
const listeners = new Set<() => void>();

function persist() {
  if (cache) localStorage.setItem(KEY, JSON.stringify(cache));
}
function bump() {
  version++;
  listeners.forEach((l) => l());
}
export function subscribe(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
export function getDb(): DB {
  if (!cache) {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) cache = JSON.parse(raw) as DB;
    } catch {
      cache = null;
    }
    if (!cache) {
      cache = seed();
      persist();
    }
  }
  return cache;
}
export function mutate(fn: (db: DB) => void) {
  const db = getDb();
  fn(db);
  persist();
  bump();
}
export function useDb(): DB {
  useSyncExternalStore(subscribe, () => version);
  return getDb();
}
export function resetDemo() {
  localStorage.removeItem(KEY);
  localStorage.removeItem(SESSION_KEY);
  cache = null;
  getDb();
  bump();
}

/* ------------------------- helpers ------------------------- */
function notify(db: DB, userId: string, type: Notif['type'], title: string, message: string, link?: string) {
  db.notifications.unshift({ id: uid(), userId, type, title, message, read: false, link, createdAt: Date.now() });
}
function logAudit(db: DB, admin: User | null, action: string, entityType: string, entityId: string, oldData?: string, newData?: string) {
  db.audits.unshift({
    id: uid(), adminId: admin?.id || 'system', adminName: admin?.username || 'SYSTEM',
    action, entityType, entityId, oldData, newData, createdAt: Date.now(),
  });
}

function baseUser(partial: Partial<User> & { email: string; username: string; password: string; role: Role }): User {
  const now = Date.now();
  return {
    id: uid(), passwordHash: hashPassword(partial.password), emailVerified: false,
    suspended: false, mustChangePassword: false, loginAttempts: 0, createdAt: now, updatedAt: now,
    role: partial.role, email: partial.email, username: partial.username,
    ...('id' in partial && partial.id ? { id: partial.id as string } : {}),
  };
}
function baseProfile(u: User, data: Partial<Profile> & { firstName: string; lastName: string }): Profile {
  const now = Date.now();
  const p: Profile = {
    id: uid(), userId: u.id, eventId: 'smd-2026', fullName: '', avatarColor: colorFor(data.firstName + data.lastName),
    verification: 'unverified', badges: [], featured: false, demo: true, published: true, topics: [],
    createdAt: now, updatedAt: now, ...data,
  } as Profile;
  p.fullName = data.fullName || `${data.firstName} ${data.lastName}`;
  return p;
}
function baseContacts(profileId: string, data?: Partial<ContactDetails>): ContactDetails {
  return {
    profileId, phoneVis: 'connected', whatsappVis: 'connected', faxVis: 'private',
    emailVis: 'public', linkedinVis: 'public', websiteVis: 'public', ...data,
  };
}

/* ------------------------- taxonomies ------------------------- */
const TYPES: string[] = [
  'Organisateur', 'Intervenant', 'Panéliste', 'Modérateur', 'Invité officiel', 'Diplomate',
  'Représentant gouvernemental', 'Représentant d’organisation internationale', 'Investisseur',
  'Entrepreneur', 'Chef d’entreprise', 'Universitaire', 'Chercheur', 'Jeune leader',
  'Média / Presse', 'Société civile', 'Partenaire', 'Participant',
];
const SECTORS: string[] = [
  'Diplomatie & Relations internationales', 'Secteur public & Gouvernance', 'Organisations internationales',
  'Finance & Investissement', 'Commerce & Industrie', 'Technologies & Numérique', 'Environnement & Climat',
  'Éducation & Recherche', 'Culture & Médias', 'Société civile & ONG', 'Énergie & Infrastructures',
  'Agriculture & Agro-industrie',
];
const TOPICS: Array<[string, string]> = [
  ['Diplomatie économique', 'Mobiliser les leviers économiques au service des stratégies diplomatiques.'],
  ['Investissements', 'Financement du développement, capitaux et partenariats publics-privés.'],
  ['Commerce international', 'Échanges, zones de libre-échange et intégration des marchés.'],
  ['Transition numérique', 'Souveraineté numérique, innovation et gouvernance des technologies.'],
  ['Paix et sécurité', 'Prévention des conflits, sécurité régionale et multilatéralisme.'],
  ['Coopération internationale', 'Partenariats entre États, institutions et organisations.'],
  ['Enjeux géopolitiques', 'Équilibres mondiaux, alliances et mutations stratégiques.'],
  ['Leadership des jeunes', 'Formation, participation et leadership de la nouvelle génération.'],
  ['Diplomatie environnementale', 'Climat, biodiversité et négociations environnementales.'],
  ['Diplomatie culturelle', 'Rayonnement culturel, patrimoine et soft power.'],
  ['Gouvernance', 'Institutions, transparence et État de droit.'],
  ['Développement durable', 'Agenda 2030 et modèles de croissance responsables.'],
  ['Intégration africaine', 'ZLECAf, communautés économiques et unité continentale.'],
  ['Innovation', 'Solutions nouvelles pour les défis du continent.'],
  ['Entrepreneuriat', 'Création de valeur, PME et écosystèmes entrepreneuriaux.'],
  ['Jeunesse africaine', 'Démographie, éducation et opportunités pour la jeunesse.'],
];

function slug(s: string): string {
  return fold(s).replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

/* ------------------------- programme officiel ------------------------- */
const VENUE = 'Centre Culturel et Artistique des Pays d’Afrique, Kinshasa';
interface SessSeed {
  id: string; date: string; startTime?: string; endTime?: string; dayPart?: string;
  title: string; description?: string; subItems?: string[]; category: string;
  location?: string; room?: string; topicId?: string; parallelGroup?: string; speakerIds?: string[];
}
function programSeed(): Session[] {
  const S = (s: SessSeed): Session => ({
    eventId: 'smd-2026', subItems: [], speakerIds: [], createdAt: Date.now(), updatedAt: Date.now(),
    location: VENUE, ...s,
  });
  const seeds: SessSeed[] = [
    // 08 — Pré-sommet (journée, sans horaires officiels)
    { id: 'S-0801', date: '2026-09-08', dayPart: 'Journée', title: 'Arrivée et accueil des délégations', category: 'accueil', location: 'Aéroport International de N’Djili — Kinshasa', description: 'Accueil officiel des délégations internationales dès leur arrivée à Kinshasa.', subItems: ['Arrivée des délégations internationales à l’aéroport international de N’Djili', 'Accueil officiel par le comité d’organisation', 'Transfert vers les hôtels partenaires'] },
    { id: 'S-0802', date: '2026-09-08', dayPart: 'Journée', title: 'Installation et enregistrement des participants', category: 'accueil', location: 'Centre d’accréditation — Hôtels partenaires', description: 'Formalités d’usage et remise des documents officiels du Sommet.', subItems: ['Remise des badges et kits de participation', 'Distribution des documents officiels du sommet'] },
    { id: 'S-0803', date: '2026-09-08', dayPart: 'Journée', title: 'Réunion technique avec les chefs de délégation', category: 'officiel', room: 'Salle des délégations', description: 'Coordination logistique et protocolaire avec les chefs de délégation.' },
    { id: 'S-0804', date: '2026-09-08', dayPart: 'Soirée', title: 'Soirée de bienvenue — Cocktail d’accueil', category: 'networking', room: 'Terrasse panoramique', description: 'Cocktail d’accueil favorisant les premiers échanges entre participants.' },
    // 09 — Jour 1
    { id: 'S-0901', date: '2026-09-09', startTime: '08:00', endTime: '09:00', title: 'Accueil des participants et installation', category: 'accueil', location: VENUE, room: 'Hall principal' },
    { id: 'S-0902', date: '2026-09-09', startTime: '09:00', endTime: '11:00', title: 'Cérémonie officielle d’ouverture', category: 'ceremonie', room: 'Grande Salle', description: 'Ouverture solennelle de la 3e édition du Sommet Mondial de la Diplomatie.', subItems: ['Hymne national de la RDC', 'Allocution du Président du FIJADA', 'Discours des autorités nationales', 'Messages des partenaires et des organisations internationales', 'Discours d’ouverture officielle'], speakerIds: ['P-JEANCLAUDE-MBALA'] },
    { id: 'S-0903', date: '2026-09-09', startTime: '11:00', endTime: '13:00', title: 'Conférence inaugurale — La Diplomatie Contemporaine comme levier pour promouvoir un Développement durable', category: 'conference', room: 'Grande Salle', description: 'Conférence inaugurale autour du thème officiel du Sommet.', speakerIds: ['P-AMINA-DIALLO', 'P-NADIA-ELAMRANI'] },
    { id: 'S-0904', date: '2026-09-09', startTime: '13:00', endTime: '14:00', title: 'Pause-café', category: 'pause', room: 'Esplanade' },
    { id: 'S-0905', date: '2026-09-09', startTime: '14:00', endTime: '16:00', title: 'Panel de haut niveau — Paix, sécurité et enjeux géopolitiques', category: 'panel', topicId: 'paix-et-securite', room: 'Grande Salle', description: 'Échanges de haut niveau sur les axes majeurs de la stabilité continentale.', subItems: ['Paix et sécurité', 'Coopération internationale', 'Enjeux géopolitiques'], speakerIds: ['P-AMINA-DIALLO', 'P-GRACE-WANJIRU', 'P-LEILA-BENALI'] },
    { id: 'S-0906', date: '2026-09-09', startTime: '16:00', endTime: '17:30', title: 'Networking entre délégations — Fin de la première journée', category: 'networking', room: 'Salon des délégations' },
    // 10 — Jour 2
    { id: 'S-1001', date: '2026-09-10', startTime: '08:30', endTime: '11:00', title: 'Panel — Diplomatie économique', category: 'panel', topicId: 'diplomatie-economique', room: 'Salle A', parallelGroup: 'J2-A', speakerIds: ['P-NADIA-ELAMRANI'] },
    { id: 'S-1002', date: '2026-09-10', startTime: '08:30', endTime: '11:00', title: 'Panel — Investissements', category: 'panel', topicId: 'investissements', room: 'Salle B', parallelGroup: 'J2-A', speakerIds: ['P-FATOU-NDIAYE'] },
    { id: 'S-1003', date: '2026-09-10', startTime: '08:30', endTime: '11:00', title: 'Panel — Commerce international', category: 'panel', topicId: 'commerce-international', room: 'Salle C', parallelGroup: 'J2-A', speakerIds: ['P-DAVID-OKONKWO'] },
    { id: 'S-1004', date: '2026-09-10', startTime: '08:30', endTime: '11:00', title: 'Panel — Transition numérique', category: 'panel', topicId: 'transition-numerique', room: 'Salle D', parallelGroup: 'J2-A', speakerIds: ['P-GRACE-WANJIRU'] },
    { id: 'S-1005', date: '2026-09-10', startTime: '11:00', endTime: '13:00', title: 'Rencontres B2B — Investisseurs, entreprises et institutions', category: 'b2b', room: 'Salon des partenaires', description: 'Sessions de rencontres structurées entre investisseurs, entreprises et institutions.' },
    { id: 'S-1006', date: '2026-09-10', startTime: '13:00', endTime: '14:00', title: 'Pause-café', category: 'pause', room: 'Esplanade' },
    { id: 'S-1007', date: '2026-09-10', startTime: '14:00', endTime: '17:30', title: 'Ateliers thématiques', category: 'atelier', room: 'Salles d’ateliers', parallelGroup: 'J2-B', description: 'Travaux en ateliers autour des thématiques du Sommet.', subItems: ['Leadership des jeunes', 'Diplomatie environnementale', 'Diplomatie culturelle', 'Gouvernance et développement durable'] },
    { id: 'S-1008', date: '2026-09-10', startTime: '14:00', endTime: '17:30', title: 'Salon des partenaires & exposition des opportunités économiques de la RDC', category: 'expo', room: 'Hall d’exposition', parallelGroup: 'J2-B', description: 'Stands des partenaires et exposition des opportunités économiques de la RDC.' },
    // 11 — Jour 3
    { id: 'S-1101', date: '2026-09-11', startTime: '08:30', endTime: '10:00', title: 'Présentation des recommandations des ateliers', category: 'pleniere', room: 'Grande Salle' },
    { id: 'S-1102', date: '2026-09-11', startTime: '10:00', endTime: '11:00', title: 'Adoption de la Déclaration de Kinshasa sur la Diplomatie et le Développement Durable', category: 'officiel', room: 'Grande Salle', description: 'Lecture et adoption solennelle de la Déclaration de Kinshasa.' },
    { id: 'S-1103', date: '2026-09-11', startTime: '11:00', endTime: '12:00', title: 'Signature des protocoles d’accord et des partenariats', category: 'officiel', room: 'Grande Salle' },
    { id: 'S-1104', date: '2026-09-11', startTime: '12:00', endTime: '13:00', title: 'Photo officielle de famille', category: 'officiel', location: 'Parvis du Centre' },
    { id: 'S-1105', date: '2026-09-11', startTime: '13:00', endTime: '14:00', title: 'Pause-café', category: 'pause', room: 'Esplanade' },
    { id: 'S-1106', date: '2026-09-11', startTime: '14:00', endTime: '16:00', title: 'Cérémonie officielle de clôture', category: 'ceremonie', room: 'Grande Salle', subItems: ['Lecture du communiqué final', 'Discours des partenaires', 'Remise des certificats et distinctions', 'Discours de clôture', 'Annonce de la prochaine édition'], speakerIds: ['P-JEANCLAUDE-MBALA'] },
    // 12 — Post-sommet (sans horaires officiels)
    { id: 'S-1201', date: '2026-09-12', dayPart: 'Matin', title: 'Rassemblement des délégations & briefing', category: 'decouverte', location: 'Hôtels partenaires', description: 'Préparation du circuit officiel de la journée post-sommet.', subItems: ['Petit-déjeuner et rassemblement des participants', 'Regroupement des délégations dans les hôtels', 'Présentation du programme de la visite', 'Répartition des groupes accompagnés par les guides et les membres du protocole'] },
    { id: 'S-1202', date: '2026-09-12', dayPart: 'Matin', title: 'Circuit touristique et culturel de Kinshasa', category: 'decouverte', location: 'Kinshasa', description: 'Découverte des hauts lieux institutionnels et culturels de la capitale.', subItems: ['Palais du Peuple', 'Musée National de la RDC', 'Académie des Beaux-Arts', 'Centre-ville de Kinshasa', 'Fleuve Congo'] },
    { id: 'S-1203', date: '2026-09-12', dayPart: 'Midi & soirée', title: 'Déjeuner culturel & Soirée de Gala', category: 'gala', description: 'Célébration de la culture congolaise en clôture du Sommet.', subItems: ['Gastronomie congolaise', 'Produits locaux', 'Diversité culturelle des provinces de la RDC'] },
    { id: 'S-1204', date: '2026-09-12', dayPart: 'Fin de journée', title: 'Départ progressif des délégations', category: 'depart', location: 'Hôtels partenaires & Aéroport de N’Djili', description: 'Clôture logistique du Sommet et retour des délégations.', subItems: ['Retour aux hôtels', 'Dîner d’au revoir', 'Départ progressif des délégations', 'Départ des délégués nationaux et internationaux'] },
  ];
  return seeds.map(S);
}

/* ------------------------- seed ------------------------- */
function seed(): DB {
  const now = Date.now();
  const participantTypes: ParticipantType[] = TYPES.map((n) => ({ id: slug(n), name: n, active: true }));
  const sectors: Sector[] = SECTORS.map((n) => ({ id: slug(n), name: n, active: true }));
  const topics: Topic[] = TOPICS.map(([n, d]) => ({ id: slug(n), name: n, description: d, active: true }));

  const db: DB = {
    version: 1,
    event: {
      id: 'smd-2026', name: 'Sommet Mondial de la Diplomatie', edition: '3e édition', year: 2026,
      startDate: '2026-09-08', endDate: '2026-09-12', city: 'Kinshasa', country: 'CD',
      theme: '« La République Démocratique du Congo, Cœur de l’Afrique : la Diplomatie Contemporaine comme levier pour promouvoir un Développement Durable »',
      active: true,
    },
    users: [], profiles: [], contacts: [],
    participantTypes, sectors, topics,
    sessions: programSeed(),
    agenda: [], requests: [], favorites: [], notifications: [], announcements: [], audits: [],
  };

  /* --- Super Admin FIJADA (créé automatiquement) --- */
  const admin = baseUser({ email: ADMIN_EMAIL, username: 'superadmin-fijada', password: ADMIN_INITIAL_PASSWORD, role: 'super_admin' });
  admin.emailVerified = true;
  admin.mustChangePassword = true;
  db.users.push(admin);
  const adminProfile = baseProfile(admin, {
    firstName: 'Secrétariat', lastName: 'Général', fullName: 'Secrétariat Général — FIJADA',
    title: 'Administration officielle de la plateforme', organization: 'FIJADA — Comité d’Organisation',
    participantTypeId: 'organisateur', sectorId: slug('Organisations internationales'),
    representedCountry: 'CD', residenceCountry: 'CD', city: 'Kinshasa',
    shortBio: 'Compte officiel de l’administration du Sommet Mondial de la Diplomatie — FIJADA.',
    biography: 'Ce compte est géré par le Secrétariat Général du FIJADA. Il assure la modération de l’annuaire, la vérification des profils et la publication du programme officiel.',
    verification: 'verified', badges: ['organisateur'], featured: false, demo: false,
  });
  db.profiles.push(adminProfile);
  db.contacts.push(baseContacts(adminProfile.id, { proEmail: ADMIN_EMAIL, emailVis: 'public', phoneVis: 'private', whatsappVis: 'private', linkedinVis: 'private', websiteVis: 'private' }));
  logAudit(db, null, 'INIT — Création automatique du compte Super Admin FIJADA', 'user', admin.id, undefined, admin.email);

  /* --- Profils de démonstration (clairement marqués DÉMO) --- */
  const D = (
    username: string, firstName: string, lastName: string, country: string, title: string, org: string,
    typeId: string, sector: string, data: Partial<Profile> & { topics: string[] },
    contacts: Partial<ContactDetails>,
  ): { u: User; p: Profile } => {
    const u = baseUser({ id: 'U-' + slug(username).toUpperCase(), email: username + '@demo-smd.cd', username, password: 'Demo!2026', role: 'participant' });
    u.emailVerified = true;
    db.users.push(u);
    const p = baseProfile(u, {
      id: 'P-' + slug(username).toUpperCase().replace(/\./g, '-'), firstName, lastName,
      representedCountry: country, residenceCountry: country, title, organization: org,
      participantTypeId: typeId, sectorId: slug(sector), demo: true, ...data,
    });
    db.profiles.push(p);
    db.contacts.push(baseContacts(p.id, contacts));
    return { u, p };
  };

  D('amina.diallo', 'Amina', 'Diallo', 'SN', 'Directrice de la Coopération Régionale', 'Commission Régionale de Coopération (DÉMO)', 'diplomate', 'Diplomatie & Relations internationales',
    { city: 'Dakar', verification: 'verified', featured: true, badges: ['intervenant'], topics: ['cooperation-internationale', 'integration-africaine', 'enjeux-geopolitiques'],
      shortBio: 'Spécialiste des partenariats régionaux et de l’intégration africaine.',
      biography: 'Engagée depuis quinze ans dans la coopération régionale ouest-africaine, Amina Diallo accompagne les délégations dans la structuration de partenariats institutionnels durables. Elle intervient sur les questions d’intégration africaine et de diplomatie multilatérale. (Profil de démonstration)' },
    { phone: '+221 33 800 00 00', whatsapp: '+221 77 000 00 00', proEmail: 'a.diallo@demo-smd.cd', linkedin: 'linkedin.com/in/amina-diallo-demo', website: 'coop-demo.example', phoneVis: 'connected', whatsappVis: 'private' });

  D('jeanclaude.mbala', 'Jean-Claude', 'Mbala', 'CD', 'Président du Comité d’Organisation', 'FIJADA — Secrétariat Exécutif (DÉMO)', 'organisateur', 'Organisations internationales',
    { city: 'Kinshasa', verification: 'verified', featured: true, badges: ['organisateur', 'intervenant'], topics: ['jeunesse-africaine', 'cooperation-internationale'],
      shortBio: 'Coordonne l’organisation de la 3e édition du Sommet à Kinshasa.',
      biography: 'Jean-Claude Mbala conduit le comité d’organisation du Sommet Mondial de la Diplomatie pour le FIJADA. Il supervise l’accueil des délégations et le protocole officiel. (Profil de démonstration)' },
    { phone: '+243 81 000 00 00', proEmail: 'jc.mbala@demo-smd.cd', linkedin: 'linkedin.com/in/jc-mbala-demo', whatsapp: '+243 81 000 00 00', phoneVis: 'connected' });

  D('fatou.ndiaye', 'Fatou', 'Ndiaye', 'CI', 'Directrice des Investissements', 'Consortium Panafricain d’Investissement (DÉMO)', 'investisseur', 'Finance & Investissement',
    { city: 'Abidjan', verification: 'verified', featured: true, badges: ['intervenant', 'paneliste'], topics: ['investissements', 'diplomatie-economique', 'entrepreneuriat'],
      shortBio: 'Finance des projets structurants en Afrique de l’Ouest et centrale.',
      biography: 'Fatou Ndiaye dirige les opérations d’investissement d’un consortium panafricain. Elle participe au panel Investissements du Jour 2. (Profil de démonstration)' },
    { phone: '+225 27 00 00 00', proEmail: 'f.ndiaye@demo-smd.cd', website: 'cpi-demo.example', linkedin: 'linkedin.com/in/fatou-ndiaye-demo' });

  D('david.okonkwo', 'David', 'Okonkwo', 'NG', 'Fondateur & CEO', 'Lagos Digital Ventures (DÉMO)', 'entrepreneur', 'Technologies & Numérique',
    { city: 'Lagos', verification: 'unverified', topics: ['transition-numerique', 'innovation', 'entrepreneuriat'],
      shortBio: 'Entrepreneur tech, passionné par les écosystèmes numériques africains.',
      biography: 'David Okonkwo a fondé un studio de ventures dédié aux startups numériques ouest-africaines. Il anime le panel Commerce international. (Profil de démonstration)' },
    { proEmail: 'd.okonkwo@demo-smd.cd', linkedin: 'linkedin.com/in/david-okonkwo-demo', phone: '+234 1 000 0000', phoneVis: 'private' });

  D('grace.wanjiru', 'Grace', 'Wanjiru', 'KE', 'Représentante Résidente', 'Programme Panafricain de Développement (DÉMO)', 'representant-d-organisation-internationale', 'Organisations internationales',
    { city: 'Nairobi', verification: 'verified', featured: true, badges: ['intervenant'], topics: ['transition-numerique', 'developpement-durable', 'innovation'],
      shortBio: 'Représente un programme panafricain dédié au développement durable.',
      biography: 'Grace Wanjiru coordonne les programmes de transformation numérique et de développement durable pour l’Afrique de l’Est. (Profil de démonstration)' },
    { phone: '+254 20 000 000', proEmail: 'g.wanjiru@demo-smd.cd', website: 'ppd-demo.example', linkedin: 'linkedin.com/in/grace-wanjiru-demo', whatsapp: '+254 700 000000' });

  D('nadia.elamrani', 'Nadia', 'El Amrani', 'MA', 'Professeure d’économie internationale', 'Université de Rabat — Chaire Diplomatie (DÉMO)', 'universitaire', 'Éducation & Recherche',
    { city: 'Rabat', verification: 'verified', badges: ['intervenant', 'paneliste'], topics: ['diplomatie-economique', 'commerce-international', 'geopolitique'].map((x) => x === 'geopolitique' ? 'enjeux-geopolitiques' : x),
      shortBio: 'Chercheuse en économie internationale et diplomatie économique.',
      biography: 'Nadia El Amrani publie sur les nouvelles routes commerciales africaines et conseille plusieurs institutions régionales. (Profil de démonstration)' },
    { proEmail: 'n.elamrani@demo-smd.cd', linkedin: 'linkedin.com/in/nadia-elamrani-demo', website: 'chaire-diplomatie-demo.example', fax: '+212 5 00 00 00' });

  D('patrick.ilunga', 'Patrick', 'Ilunga', 'CD', 'Coordinateur Jeunesse', 'Réseau des Jeunes Leaders de Kinshasa (DÉMO)', 'jeune-leader', 'Société civile & ONG',
    { city: 'Kinshasa', verification: 'pending', topics: ['leadership-des-jeunes', 'jeunesse-africaine', 'entrepreneuriat'],
      shortBio: 'Mobilise la jeunesse kinoise autour du leadership et de l’engagement civique.',
      biography: 'Patrick Ilunga anime un réseau de jeunes leaders à Kinshasa et participe à l’atelier Leadership des jeunes. (Profil de démonstration)' },
    { phone: '+243 99 000 00 00', proEmail: 'p.ilunga@demo-smd.cd', whatsapp: '+243 99 000 00 00', phoneVis: 'connected' });

  D('chantal.kouassi', 'Chantal', 'Kouassi', 'CM', 'Rédactrice en chef', 'AfriPresse Médias (DÉMO)', 'media-presse', 'Culture & Médias',
    { city: 'Douala', verification: 'verified', topics: ['diplomatie-culturelle', 'cooperation-internationale'],
      shortBio: 'Couvre l’actualité diplomatique et institutionnelle du continent.',
      biography: 'Chantal Kouassi dirige la rédaction d’un média panafricain accrédité pour le Sommet. (Profil de démonstration)' },
    { proEmail: 'c.kouassi@demo-smd.cd', linkedin: 'linkedin.com/in/chantal-kouassi-demo', phone: '+237 6 00 00 00 00', phoneVis: 'connected' });

  D('samuel.kanku', 'Samuel', 'Kanku', 'CD', 'Directeur Général', 'Kivu Agro Industries (DÉMO)', 'chef-d-entreprise', 'Agriculture & Agro-industrie',
    { city: 'Goma', verification: 'pending', topics: ['entrepreneuriat', 'developpement-durable', 'investissements'],
      shortBio: 'Dirige une entreprise agro-industrielle dans l’Est de la RDC.',
      biography: 'Samuel Kanku développe des filières agricoles créatrices d’emplois dans la région des Grands Lacs. (Profil de démonstration)' },
    { phone: '+243 97 000 00 00', proEmail: 's.kanku@demo-smd.cd', phoneVis: 'connected' });

  D('leila.benali', 'Leïla', 'Benali', 'TN', 'Conseillère Climat', 'Observatoire Méditerranéen du Climat (DÉMO)', 'representant-d-organisation-internationale', 'Environnement & Climat',
    { city: 'Tunis', residenceCountry: 'TN', verification: 'verified', badges: ['intervenant'], topics: ['diplomatie-environnementale', 'developpement-durable', 'gouvernance'],
      shortBio: 'Conseille les délégations sur les négociations climatiques internationales.',
      biography: 'Leïla Benali suit les négociations climatiques pour un observatoire régional et intervient lors des ateliers de diplomatie environnementale. (Profil de démonstration)' },
    { proEmail: 'l.benali@demo-smd.cd', linkedin: 'linkedin.com/in/leila-benali-demo', website: 'omc-demo.example', fax: '+216 71 000 000', faxVis: 'connected' });

  D('etienne.mukendi', 'Étienne', 'Mukendi', 'CD', 'Chercheur en relations internationales', 'Université de Kinshasa — Département RI (DÉMO)', 'chercheur', 'Éducation & Recherche',
    { city: 'Kinshasa', verification: 'unverified', topics: ['enjeux-geopolitiques', 'paix-et-securite', 'gouvernance'],
      shortBio: 'Travaux sur la diplomatie des Grands Lacs et la sécurité régionale.',
      biography: 'Étienne Mukendi prépare une thèse sur les mécanismes de paix en Afrique centrale. (Profil de démonstration)' },
    { proEmail: 'e.mukendi@demo-smd.cd' });

  D('mariam.traore', 'Mariam', 'Traoré', 'ML', 'Secrétaire Générale', 'Coalition Sahel Société Civile (DÉMO)', 'societe-civile', 'Société civile & ONG',
    { city: 'Bamako', verification: 'verified', topics: ['paix-et-securite', 'jeunesse-africaine', 'gouvernance'],
      shortBio: 'Porte la voix des organisations de la société civile sahélienne.',
      biography: 'Mariam Traoré coordonne une coalition d’organisations citoyennes engagées pour la paix et la gouvernance au Sahel. (Profil de démonstration)' },
    { phone: '+223 20 00 00 00', proEmail: 'm.traore@demo-smd.cd', linkedin: 'linkedin.com/in/mariam-traore-demo', phoneVis: 'connected' });

  D('carlos.fernandes', 'Carlos', 'Fernandes', 'AO', 'Responsable Partenariats', 'Fonds Luso-Africain de Développement (DÉMO)', 'partenaire', 'Finance & Investissement',
    { city: 'Luanda', verification: 'verified', badges: ['partenaire'], topics: ['investissements', 'cooperation-internationale', 'integration-africaine'],
      shortBio: 'Structure les partenariats techniques et financiers du fonds.',
      biography: 'Carlos Fernandes accompagne les projets cofinancés par le fonds dans l’espace lusophone africain. (Profil de démonstration)' },
    { proEmail: 'c.fernandes@demo-smd.cd', website: 'flad-demo.example', linkedin: 'linkedin.com/in/carlos-fernandes-demo', phone: '+244 22 000 0000', phoneVis: 'connected' });

  D('sarah.vanderberg', 'Sarah', 'Van der Berg', 'BE', 'Analyste Senior', 'Bruxelles Invest Partners (DÉMO)', 'investisseur', 'Finance & Investissement',
    { city: 'Bruxelles', verification: 'unverified', topics: ['investissements', 'commerce-international'],
      shortBio: 'Analyse les opportunités d’investissement Europe–Afrique.',
      biography: 'Sarah Van der Berg suit les flux d’investissement entre l’Europe et l’Afrique centrale. (Profil de démonstration)' },
    { proEmail: 's.vanderberg@demo-smd.cd', linkedin: 'linkedin.com/in/sarah-vdb-demo', phone: '+32 2 000 00 00', phoneVis: 'private' });

  /* Annonce officielle de bienvenue */
  const ann: Announcement = {
    id: uid(), title: 'Bienvenue sur l’Annuaire SMD — FIJADA 2026',
    message: 'La plateforme officielle de networking du Sommet est ouverte. Complétez votre profil pour être visible des délégations, consultez le programme officiel et construisez votre agenda. Les profils sont vérifiés par l’administration FIJADA.',
    audience: 'all', publishedAt: now, createdBy: admin.id,
  };
  db.announcements.push(ann);

  return db;
}

/* ========================= AUTH ========================= */
export function getSessionUserId(): string | null {
  return localStorage.getItem(SESSION_KEY);
}
function setSession(userId: string | null) {
  if (userId) localStorage.setItem(SESSION_KEY, userId);
  else localStorage.removeItem(SESSION_KEY);
  bump();
}
export interface AuthResult {
  ok: boolean;
  error?: string;
  mustChangePassword?: boolean;
}

export function registerUser(data: { email: string; username: string; password: string }): AuthResult {
  const db = getDb();
  const email = data.email.trim().toLowerCase();
  const username = data.username.trim().toLowerCase();
  if (db.users.some((u) => u.email.toLowerCase() === email))
    return { ok: false, error: 'Un compte existe déjà avec cette adresse e-mail.' };
  if (db.users.some((u) => u.username.toLowerCase() === username))
    return { ok: false, error: 'Ce nom d’utilisateur est déjà pris.' };
  const u = baseUser({ email, username, password: data.password, role: 'participant' });
  const p = baseProfile(u, { firstName: '', lastName: '', fullName: '', published: false, demo: false, verification: 'unverified' });
  mutate((d) => {
    d.users.push(u);
    d.profiles.push(p);
    d.contacts.push(baseContacts(p.id, { emailVis: 'public' }));
    notify(d, u.id, 'system', 'Bienvenue à l’Annuaire SMD', 'Votre compte est créé. Complétez votre profil en quelques étapes pour apparaître dans l’annuaire officiel.', '/onboarding');
    const welcome = d.announcements.find((a) => a.audience === 'all');
    if (welcome) notify(d, u.id, 'announcement', welcome.title, welcome.message, '/a-propos');
    logAudit(d, null, 'Création de compte participant', 'user', u.id, undefined, email);
  });
  setSession(u.id);
  return { ok: true };
}

export function loginUser(identifier: string, password: string): AuthResult {
  const db = getDb();
  const id = identifier.trim().toLowerCase();
  const u = db.users.find((x) => x.email.toLowerCase() === id || x.username.toLowerCase() === id);
  if (!u) return { ok: false, error: 'Aucun compte ne correspond à cet identifiant.' };
  if (u.suspended) return { ok: false, error: 'Ce compte est suspendu. Contactez l’administration FIJADA : contact@fijada-smd.cd.' };
  if (u.lockUntil && u.lockUntil > Date.now())
    return { ok: false, error: 'Trop de tentatives. Réessayez dans 1 minute.' };
  if (u.passwordHash !== hashPassword(password)) {
    mutate((d) => {
      const uu = d.users.find((x) => x.id === u.id)!;
      uu.loginAttempts++;
      if (uu.loginAttempts >= 5) {
        uu.lockUntil = Date.now() + 60_000;
        uu.loginAttempts = 0;
      }
    });
    return { ok: false, error: 'Mot de passe incorrect.' };
  }
  mutate((d) => {
    const uu = d.users.find((x) => x.id === u.id)!;
    uu.loginAttempts = 0;
    uu.lockUntil = undefined;
    uu.lastLoginAt = Date.now();
  });
  setSession(u.id);
  return { ok: true, mustChangePassword: u.mustChangePassword };
}

export function logout() {
  setSession(null);
}
export function changePassword(userId: string, newPw: string) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId)!;
    u.passwordHash = hashPassword(newPw);
    u.mustChangePassword = false;
    u.updatedAt = Date.now();
  });
}
export function requestPasswordReset(email: string): { ok: boolean; code?: string; error?: string } {
  const db = getDb();
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u) return { ok: false, error: 'Aucun compte associé à cette adresse.' };
  const code = String(Math.floor(100000 + Math.random() * 900000));
  mutate((d) => {
    d.users.find((x) => x.id === u.id)!.resetCode = code;
  });
  // Démo : le code serait envoyé par e-mail en production.
  return { ok: true, code };
}
export function resetPassword(email: string, code: string, newPw: string): AuthResult {
  const db = getDb();
  const u = db.users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
  if (!u || u.resetCode !== code.trim()) return { ok: false, error: 'Code de récupération invalide.' };
  mutate((d) => {
    const uu = d.users.find((x) => x.id === u.id)!;
    uu.passwordHash = hashPassword(newPw);
    uu.resetCode = undefined;
    uu.mustChangePassword = false;
  });
  return { ok: true };
}
export function deleteAccount(userId: string) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.userId === userId);
    d.users = d.users.filter((x) => x.id !== userId);
    d.profiles = d.profiles.filter((x) => x.userId !== userId);
    if (p) {
      d.contacts = d.contacts.filter((c) => c.profileId !== p.id);
      d.favorites = d.favorites.filter((f) => f.profileId !== p.id);
      d.sessions.forEach((s) => {
        s.speakerIds = s.speakerIds.filter((id) => id !== p.id);
      });
    }
    d.requests = d.requests.filter((r) => r.senderId !== userId && r.receiverId !== userId);
    d.favorites = d.favorites.filter((f) => f.userId !== userId);
    d.agenda = d.agenda.filter((a) => a.userId !== userId);
    d.notifications = d.notifications.filter((n) => n.userId !== userId);
    logAudit(d, null, 'Suppression de compte (demande utilisateur)', 'user', userId);
  });
  setSession(null);
}
export function exportUserData(userId: string): object {
  const db = getDb();
  const p = db.profiles.find((x) => x.userId === userId);
  return {
    user: (() => {
      const u = db.users.find((x) => x.id === userId);
      return u ? { ...u, passwordHash: '•••', resetCode: undefined } : null;
    })(),
    profile: p || null,
    contacts: p ? db.contacts.find((c) => c.profileId === p.id) || null : null,
    favorites: db.favorites.filter((f) => f.userId === userId),
    agenda: db.agenda.filter((a) => a.userId === userId),
    requests: db.requests.filter((r) => r.senderId === userId || r.receiverId === userId),
    exportedAt: new Date().toISOString(),
  };
}

/* ========================= PROFILS ========================= */
export function profileOf(db: DB, userId: string): Profile | undefined {
  return db.profiles.find((p) => p.userId === userId);
}
export function updateProfile(profileId: string, patch: Partial<Profile>) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.id === profileId);
    if (!p) return;
    Object.assign(p, patch, { updatedAt: Date.now() });
    if (patch.firstName !== undefined || patch.lastName !== undefined)
      p.fullName = `${p.firstName} ${p.lastName}`.trim();
  });
}
export function updateContacts(profileId: string, patch: Partial<ContactDetails>) {
  mutate((d) => {
    const c = d.contacts.find((x) => x.profileId === profileId);
    if (c) Object.assign(c, patch);
  });
}
export function publishProfile(profileId: string) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.id === profileId);
    if (p) {
      p.published = true;
      p.verification = 'pending';
      p.updatedAt = Date.now();
    }
  });
}

/* ========================= NETWORKING ========================= */
export function sendRequest(senderId: string, receiverId: string, message?: string): AuthResult {
  const db = getDb();
  if (db.requests.some((r) => r.senderId === senderId && r.receiverId === receiverId && r.status === 'pending'))
    return { ok: false, error: 'Une demande est déjà en attente pour ce participant.' };
  const req: ConnectionRequest = { id: uid(), senderId, receiverId, message, status: 'pending', createdAt: Date.now() };
  mutate((d) => {
    d.requests.unshift(req);
    const sp = d.profiles.find((p) => p.userId === senderId);
    notify(d, receiverId, 'request', 'Nouvelle demande de mise en relation',
      `${sp?.fullName || 'Un participant'} souhaite vous connecter sur l’Annuaire SMD.`, '/networking');
  });
  return { ok: true };
}
export function respondRequest(requestId: string, accept: boolean) {
  mutate((d) => {
    const r = d.requests.find((x) => x.id === requestId);
    if (!r) return;
    r.status = accept ? 'accepted' : 'refused';
    r.respondedAt = Date.now();
    const rp = d.profiles.find((p) => p.userId === r.receiverId);
    notify(d, r.senderId, accept ? 'accepted' : 'refused',
      accept ? 'Demande acceptée' : 'Demande refusée',
      accept
        ? `${rp?.fullName || 'Le participant'} a accepté votre mise en relation. Retrouvez ses coordonnées dans « Mes contacts SMD ».`
        : `${rp?.fullName || 'Le participant'} n’a pas donné suite à votre demande.`,
      accept ? '/contacts' : '/networking');
  });
}
export function cancelRequest(requestId: string) {
  mutate((d) => {
    const r = d.requests.find((x) => x.id === requestId);
    if (r) {
      r.status = 'cancelled';
      r.respondedAt = Date.now();
    }
  });
}
export function contactUserIds(db: DB, userId: string): string[] {
  return db.requests
    .filter((r) => r.status === 'accepted' && (r.senderId === userId || r.receiverId === userId))
    .map((r) => (r.senderId === userId ? r.receiverId : r.senderId));
}
export function acceptedRequestBetween(db: DB, a: string, b: string): boolean {
  return db.requests.some(
    (r) => r.status === 'accepted' &&
      ((r.senderId === a && r.receiverId === b) || (r.senderId === b && r.receiverId === a)),
  );
}
export function toggleFavorite(userId: string, profileId: string) {
  mutate((d) => {
    const i = d.favorites.findIndex((f) => f.userId === userId && f.profileId === profileId);
    if (i >= 0) d.favorites.splice(i, 1);
    else d.favorites.unshift({ userId, profileId, createdAt: Date.now() });
  });
}

/* ========================= AGENDA ========================= */
export function toggleAgenda(userId: string, sessionId: string) {
  mutate((d) => {
    const i = d.agenda.findIndex((a) => a.userId === userId && a.sessionId === sessionId);
    if (i >= 0) d.agenda.splice(i, 1);
    else d.agenda.unshift({ userId, sessionId, notToMiss: false, reminder: true, createdAt: Date.now() });
  });
}
export function setAgendaFlag(userId: string, sessionId: string, key: 'notToMiss' | 'reminder', val: boolean) {
  mutate((d) => {
    const a = d.agenda.find((x) => x.userId === userId && x.sessionId === sessionId);
    if (a) a[key] = val;
  });
}

/* ========================= NOTIFICATIONS ========================= */
export function markAllRead(userId: string) {
  mutate((d) => d.notifications.forEach((n) => { if (n.userId === userId) n.read = true; }));
}
export function markRead(id: string) {
  mutate((d) => { const n = d.notifications.find((x) => x.id === id); if (n) n.read = true; });
}

/* ========================= ADMIN ========================= */
export function isAdmin(u: User | undefined | null): boolean {
  return !!u && (u.role === 'super_admin' || u.role === 'admin' || u.role === 'moderator');
}
export function adminSetVerification(profileId: string, v: Verification, admin: User) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.id === profileId);
    if (!p) return;
    const old = p.verification;
    p.verification = v;
    p.updatedAt = Date.now();
    logAudit(d, admin, v === 'verified' ? 'Vérification de profil' : 'Retrait/modification du statut de vérification', 'profile', profileId, old, v);
    if (v === 'verified') notify(d, p.userId, 'verified', 'Profil vérifié', 'Votre profil a été vérifié par l’administration FIJADA. Le badge « Vérifié SMD » est désormais affiché.', '/profil');
  });
}
export function adminSetSuspended(userId: string, suspended: boolean, admin: User) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (!u) return;
    u.suspended = suspended;
    logAudit(d, admin, suspended ? 'Suspension de compte' : 'Réactivation de compte', 'user', userId, String(!suspended), String(suspended));
  });
}
export function adminSetRole(userId: string, role: Role, admin: User) {
  mutate((d) => {
    const u = d.users.find((x) => x.id === userId);
    if (!u) return;
    const old = u.role;
    u.role = role;
    logAudit(d, admin, 'Attribution de rôle', 'user', userId, old, role);
  });
}
export function adminSetBadges(profileId: string, badges: BadgeId[], admin: User) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.id === profileId);
    if (!p) return;
    const old = p.badges.join(',');
    p.badges = badges;
    logAudit(d, admin, 'Attribution de badges', 'profile', profileId, old, badges.join(','));
  });
}
export function adminSetFeatured(profileId: string, featured: boolean, admin: User) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.id === profileId);
    if (!p) return;
    p.featured = featured;
    logAudit(d, admin, featured ? 'Mise en avant d’un profil' : 'Retrait de la mise en avant', 'profile', profileId, String(!featured), String(featured));
  });
}
export function adminDeleteUser(userId: string, admin: User) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.userId === userId);
    d.users = d.users.filter((x) => x.id !== userId);
    d.profiles = d.profiles.filter((x) => x.userId !== userId);
    if (p) d.contacts = d.contacts.filter((c) => c.profileId !== p.id);
    d.requests = d.requests.filter((r) => r.senderId !== userId && r.receiverId !== userId);
    d.favorites = d.favorites.filter((f) => f.userId !== userId);
    d.agenda = d.agenda.filter((a) => a.userId !== userId);
    logAudit(d, admin, 'Suppression de compte', 'user', userId);
  });
}
export function adminUpdateProfile(profileId: string, patch: Partial<Profile>, admin: User) {
  mutate((d) => {
    const p = d.profiles.find((x) => x.id === profileId);
    if (!p) return;
    const old = JSON.stringify(patch && Object.keys(patch).map((k) => (p as any)[k]));
    Object.assign(p, patch, { updatedAt: Date.now() });
    if (patch.firstName !== undefined || patch.lastName !== undefined) p.fullName = `${p.firstName} ${p.lastName}`.trim();
    logAudit(d, admin, 'Modification de profil par admin', 'profile', profileId, old, JSON.stringify(patch));
  });
}
export function adminSaveSession(session: Session, isNew: boolean, admin: User, announceUrgent: boolean) {
  mutate((d) => {
    if (isNew) {
      d.sessions.push(session);
      logAudit(d, admin, 'Création de session', 'session', session.id, undefined, session.title);
    } else {
      const i = d.sessions.findIndex((s) => s.id === session.id);
      const old = i >= 0 ? d.sessions[i].title + ' ' + (d.sessions[i].startTime || '') : '';
      d.sessions[i] = { ...session, updatedAt: Date.now() };
      logAudit(d, admin, 'Modification de session', 'session', session.id, old, session.title + ' ' + (session.startTime || ''));
    }
    if (announceUrgent) {
      d.users.forEach((u) => {
        if (u.role === 'participant' && !u.suspended)
          notify(d, u.id, 'program', 'Mise à jour urgente du programme', `« ${session.title} » — ${session.date} ${session.startTime || session.dayPart || ''}. Consultez le programme officiel.`, '/programme');
      });
    }
  });
}
export function adminDeleteSession(sessionId: string, admin: User) {
  mutate((d) => {
    const s = d.sessions.find((x) => x.id === sessionId);
    d.sessions = d.sessions.filter((x) => x.id !== sessionId);
    d.agenda = d.agenda.filter((a) => a.sessionId !== sessionId);
    if (s) logAudit(d, admin, 'Suppression de session', 'session', sessionId, s.title);
  });
}
export type TaxKind = 'participantTypes' | 'sectors' | 'topics';
export function taxonomyAdd(kind: TaxKind, name: string, description?: string, admin?: User | null) {
  mutate((d) => {
    const id = slug(name);
    if (kind === 'topics') {
      if ((d.topics as Topic[]).some((x) => x.id === id)) return;
      (d.topics as Topic[]).push({ id, name, description: description || '', active: true });
    } else if (kind === 'sectors') {
      if ((d.sectors as Sector[]).some((x) => x.id === id)) return;
      (d.sectors as Sector[]).push({ id, name, active: true });
    } else {
      if ((d.participantTypes as ParticipantType[]).some((x) => x.id === id)) return;
      (d.participantTypes as ParticipantType[]).push({ id, name, active: true });
    }
    if (admin) logAudit(d, admin, 'Ajout taxonomie (' + kind + ')', kind, id, undefined, name);
  });
}
export function taxonomyRemove(kind: TaxKind, id: string, admin?: User | null) {
  mutate((d) => {
    if (kind === 'topics') d.topics = d.topics.filter((x) => x.id !== id);
    else if (kind === 'sectors') d.sectors = d.sectors.filter((x) => x.id !== id);
    else d.participantTypes = d.participantTypes.filter((x) => x.id !== id);
    if (admin) logAudit(d, admin, 'Suppression taxonomie (' + kind + ')', kind, id);
  });
}
export function taxonomyToggle(kind: TaxKind, id: string, active: boolean, admin?: User | null) {
  mutate((d) => {
    const list = (d as any)[kind] as Array<{ id: string; active: boolean }>;
    const item = list.find((x) => x.id === id);
    if (item) item.active = active;
    if (admin) logAudit(d, admin, (active ? 'Activation' : 'Désactivation') + ' taxonomie (' + kind + ')', kind, id);
  });
}
export function sendAnnouncement(admin: User, data: { title: string; message: string; audience: Announcement['audience']; audienceValue?: string }): number {
  let count = 0;
  mutate((d) => {
    d.announcements.unshift({ id: uid(), ...data, publishedAt: Date.now(), createdBy: admin.id });
    const targets = d.users.filter((u) => u.role === 'participant' && !u.suspended);
    for (const u of targets) {
      const p = d.profiles.find((x) => x.userId === u.id);
      let match = data.audience === 'all';
      if (data.audience === 'country') match = p?.representedCountry === data.audienceValue || p?.residenceCountry === data.audienceValue;
      if (data.audience === 'topic') match = !!p?.topics.includes(data.audienceValue || '');
      if (data.audience === 'type') match = p?.participantTypeId === data.audienceValue;
      if (data.audience === 'speakers') match = d.sessions.some((s) => s.speakerIds.includes(p?.id || '§'));
      if (match) {
        notify(d, u.id, 'announcement', data.title, data.message, '/notifications');
        count++;
      }
    }
    logAudit(d, admin, 'Envoi d’une annonce officielle', 'announcement', data.title, undefined, `audience=${data.audience}`);
  });
  return count;
}

/* ========================= RECHERCHE & STATS ========================= */
export interface DirectoryQuery {
  q?: string;
  country?: string;
  residenceCountry?: string;
  city?: string;
  typeId?: string;
  sectorId?: string;
  organization?: string;
  topicId?: string;
  verifiedOnly?: boolean;
  speakersOnly?: boolean;
  sort?: 'relevance' | 'alpha' | 'recent' | 'verified' | 'speakers';
}
export function searchProfiles(db: DB, opts: DirectoryQuery): Profile[] {
  const q = opts.q ? fold(opts.q) : '';
  const terms = q.split(/\s+/).filter(Boolean);
  const speakerIds = new Set<string>();
  db.sessions.forEach((s) => s.speakerIds.forEach((id) => speakerIds.add(id)));

  let list: Array<{ p: Profile; hay: string; speaker: boolean }> = db.profiles
    .filter((p) => p.published && p.firstName)
    .map((p) => {
    const type = db.participantTypes.find((x) => x.id === p.participantTypeId)?.name || '';
    const sector = db.sectors.find((x) => x.id === p.sectorId)?.name || '';
    const topicNames = p.topics.map((tid) => db.topics.find((x) => x.id === tid)?.name || '').join(' ');
    const hay = fold([p.fullName, p.firstName, p.lastName, p.title, p.organization, p.city, type, sector, topicNames, (p as any).username || db.users.find(u=>u.id===p.userId)?.username || ''].join(' · '));
    return { p, hay, speaker: speakerIds.has(p.id) };
  });

  if (opts.country) list = list.filter((x) => x.p.representedCountry === opts.country);
  if (opts.residenceCountry) list = list.filter((x) => x.p.residenceCountry === opts.residenceCountry);
  if (opts.city) list = list.filter((x) => fold(x.p.city || '').includes(fold(opts.city!)));
  if (opts.typeId) list = list.filter((x) => x.p.participantTypeId === opts.typeId);
  if (opts.sectorId) list = list.filter((x) => x.p.sectorId === opts.sectorId);
  if (opts.organization) list = list.filter((x) => fold(x.p.organization || '').includes(fold(opts.organization!)));
  if (opts.topicId) list = list.filter((x) => x.p.topics.includes(opts.topicId!));
  if (opts.verifiedOnly) list = list.filter((x) => x.p.verification === 'verified');
  if (opts.speakersOnly) list = list.filter((x) => x.speaker);

  if (terms.length) {
    list = list.filter((x) => terms.every((t) => x.hay.includes(t)));
  }

  const sort = opts.sort || 'relevance';
  list.sort((a, b) => {
    if (sort === 'alpha') return a.p.fullName.localeCompare(b.p.fullName, 'fr');
    if (sort === 'recent') return b.p.createdAt - a.p.createdAt;
    if (sort === 'verified') return (b.p.verification === 'verified' ? 1 : 0) - (a.p.verification === 'verified' ? 1 : 0) || a.p.fullName.localeCompare(b.p.fullName, 'fr');
    if (sort === 'speakers') return (b.speaker ? 1 : 0) - (a.speaker ? 1 : 0) || a.p.fullName.localeCompare(b.p.fullName, 'fr');
    // pertinence : vérifiés & mis en avant d'abord
    const av = (a.p.verification === 'verified' ? 2 : 0) + (a.p.featured ? 2 : 0) + (a.speaker ? 1 : 0);
    const bv = (b.p.verification === 'verified' ? 2 : 0) + (b.p.featured ? 2 : 0) + (b.speaker ? 1 : 0);
    return bv - av || a.p.fullName.localeCompare(b.p.fullName, 'fr');
  });
  return list.map((x) => x.p);
}

export function computeStats(db: DB) {
  const published = db.profiles.filter((p) => p.published && p.firstName);
  const speakerIds = new Set<string>();
  db.sessions.forEach((s) => s.speakerIds.forEach((id) => speakerIds.add(id)));
  const countries = new Set(published.map((p) => p.representedCountry).filter(Boolean));
  const orgs = new Set(published.map((p) => p.organization?.trim().toLowerCase()).filter(Boolean));
  return {
    participants: published.length,
    verified: published.filter((p) => p.verification === 'verified').length,
    countries: countries.size,
    organizations: orgs.size,
    speakers: published.filter((p) => speakerIds.has(p.id)).length,
  };
}
export function sessionsOfProfile(db: DB, profileId: string): Session[] {
  return db.sessions.filter((s) => s.speakerIds.includes(profileId));
}
export function upcomingSessions(db: DB, limit: number): Session[] {
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  return [...db.sessions]
    .filter((s) => s.date >= today)
    .sort((a, b) => (a.date + (a.startTime || '99:99')).localeCompare(b.date + (b.startTime || '99:99')))
    .slice(0, limit);
}
