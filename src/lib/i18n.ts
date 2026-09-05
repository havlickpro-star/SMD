/**
 * Architecture i18n — V1 : français.
 * Les dictionnaires `en`, `pt`, `es` seront ajoutés sans casser la structure.
 */
export type Lang = 'fr' | 'en' | 'pt' | 'es';

const fr = {
  'app.name': 'Annuaire SMD — FIJADA 2026',
  'app.tagline': 'Le réseau officiel des participants du Sommet Mondial de la Diplomatie',
  'nav.home': 'Accueil',
  'nav.directory': 'Annuaire',
  'nav.speakers': 'Intervenants',
  'nav.panels': 'Panels',
  'nav.program': 'Programme',
  'nav.agenda': 'Mon agenda',
  'nav.networking': 'Networking',
  'nav.contacts': 'Mes contacts',
  'nav.favorites': 'Favoris',
  'nav.notifications': 'Notifications',
  'nav.profile': 'Mon profil',
  'nav.admin': 'Administration',
  'nav.login': 'Connexion',
  'nav.logout': 'Déconnexion',
  'nav.about': 'À propos du Sommet',
  'cta.explore': 'Explorer l’annuaire',
  'cta.program': 'Voir le programme',
  'action.viewProfile': 'Voir le profil',
  'action.connect': 'Demander une mise en relation',
  'action.favorite': 'Ajouter aux favoris',
  'action.share': 'Partager',
  'action.showContacts': 'Afficher les contacts',
  'label.verified': 'Vérifié SMD',
  'label.verifiedTooltip': 'Profil vérifié par l’administration FIJADA.',
  'label.pending': 'En cours de vérification',
  'label.unverified': 'Non vérifié',
  'label.demo': 'Profil de démonstration',
  'empty.favorites': 'Vous n’avez encore ajouté aucun participant à vos favoris.',
  'empty.networking': 'Aucune demande de mise en relation pour le moment.',
  'empty.agenda': 'Votre agenda est vide. Ajoutez des sessions depuis le programme officiel.',
  'empty.search': 'Aucun profil ne correspond à votre recherche.',
  'privacy.locked':
    'Cette coordonnée sera visible après acceptation de votre demande de mise en relation.',
  'privacy.privateField': 'Cette coordonnée est privée.',
};

const dictionaries: Record<Lang, Record<string, string>> = {
  fr,
  en: {},
  pt: {},
  es: {},
};

let current: Lang = (localStorage.getItem('smd_lang') as Lang) || 'fr';

export function getLang(): Lang {
  return current;
}
export function setLang(l: Lang) {
  current = l;
  localStorage.setItem('smd_lang', l);
}
export function t(key: string): string {
  return dictionaries[current][key] ?? dictionaries.fr[key] ?? key;
}
