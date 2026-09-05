import { useState, FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, KeyRound, Mail, LogIn, UserPlus, Info } from 'lucide-react';
import { useDb, loginUser, registerUser, requestPasswordReset, resetPassword, changePassword, ADMIN_EMAIL, ADMIN_INITIAL_PASSWORD } from '../lib/db';
import { useAuth } from '../lib/auth';
import { validEmail, strongPassword, cx } from '../lib/utils';
import { Btn, Field, Input, Modal, useToast } from '../components/ui';
import { Logo } from '../components/bits';

function AuthShell({ title, sub, children }: { title: string; sub: string; children: React.ReactNode }) {
  return (
    <div className="bg-globe-hero min-h-[calc(100vh-64px)]">
      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:py-16">
        <div className="hidden lg:block">
          <Logo />
          <p className="mt-6 border-l-[3px] border-gold-400 pl-4 font-display text-[26px] leading-tight font-extrabold text-navy-900">
            Le réseau officiel des participants du Sommet Mondial de la Diplomatie
          </p>
          <ul className="mt-8 space-y-4">
            {[
              ['Identifiez les délégations', 'Fonction, institution, pays et domaines d’expertise de chaque participant.'],
              ['Connectez-vous aux bons acteurs', 'Demandes de mise en relation modérées et coordonnées protégées.'],
              ['Construisez votre agenda', 'Programme officiel des 5 journées et sessions personnalisées.'],
            ].map(([ti, d]) => (
              <li key={ti} className="flex gap-3">
                <span className="mt-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-royal-700 font-mono text-[11px] font-bold text-white">✓</span>
                <div>
                  <p className="font-display text-[15px] font-bold text-ink">{ti}</p>
                  <p className="text-sm text-soft">{d}</p>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-10 rounded-lg border border-line bg-card p-4">
            <p className="font-mono text-[10px] tracking-[0.18em] text-soft uppercase">Kinshasa · RDC — 08–12 septembre 2026</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-soft">
              « La République Démocratique du Congo, Cœur de l’Afrique : la Diplomatie Contemporaine comme levier
              pour promouvoir un Développement Durable »
            </p>
          </div>
        </div>
        <div className="w-full max-w-md justify-self-center lg:justify-self-start">
          <div className="rounded-xl border border-line bg-card p-6 shadow-lg shadow-royal-900/5 sm:p-8">
            <h1 className="font-display text-[22px] font-extrabold text-navy-900">{title}</h1>
            <p className="mt-1 text-sm text-soft">{sub}</p>
            <div className="mt-6">{children}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ================= CONNEXION ================= */
export function LoginPage() {
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const toast = useToast();
  const [identifier, setIdentifier] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');
  const [forcePw, setForcePw] = useState(false);
  const [npw, setNpw] = useState('');
  const [npw2, setNpw2] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const r = loginUser(identifier, pw);
    if (!r.ok) return setErr(r.error || 'Connexion impossible.');
    if (r.mustChangePassword) return setForcePw(true);
    toast.push('success', 'Connexion réussie. Bienvenue sur l’Annuaire SMD.');
    nav(sp.get('next') || '/profil');
  };

  const submitForce = (e: FormEvent) => {
    e.preventDefault();
    const weak = strongPassword(npw);
    if (weak) return setErr(weak);
    if (npw !== npw2) return setErr('Les deux mots de passe ne correspondent pas.');
    const { user } = { user: null as any };
    void user;
    const uidNow = localStorage.getItem('smd_fijada_session_v1');
    if (uidNow) changePassword(uidNow, npw);
    setForcePw(false);
    toast.push('success', 'Mot de passe mis à jour. Bienvenue.');
    nav('/admin');
  };

  return (
    <AuthShell title="Connexion" sub="Accédez à l’annuaire officiel des participants.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="E-mail ou nom d’utilisateur" required>
          <Input value={identifier} onChange={(e) => setIdentifier(e.target.value)} autoComplete="username" required placeholder="vous@institution.org" />
        </Field>
        <Field label="Mot de passe" required>
          <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required placeholder="••••••••" />
        </Field>
        {err && <p className="rounded-md bg-flame-100 px-3 py-2 text-[13px] font-semibold text-flame-700">{err}</p>}
        <Btn type="submit" className="w-full" size="lg"><LogIn size={16} /> Se connecter</Btn>
        <div className="flex items-center justify-between text-[13px]">
          <Link to="/mot-de-passe-oublie" className="font-semibold text-royal-700 hover:underline">Mot de passe oublié ?</Link>
          <Link to="/inscription" className="font-semibold text-royal-700 hover:underline">Créer un compte</Link>
        </div>
      </form>
      <div className="mt-6 rounded-lg border border-dashed border-royal-200 bg-royal-50/60 p-4">
        <p className="flex items-center gap-1.5 font-mono text-[10px] font-semibold tracking-[0.16em] text-royal-800 uppercase"><Info size={12} /> Comptes de démonstration</p>
        <div className="mt-2 space-y-1.5 font-mono text-[11.5px] text-royal-800">
          <p><strong>Super Admin :</strong> {ADMIN_EMAIL} · {ADMIN_INITIAL_PASSWORD}</p>
          <p><strong>Participant DÉMO :</strong> amina.diallo@demo-smd.cd · Demo!2026</p>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-soft">
          En production, le compte Super Admin est initialisé depuis les variables d’environnement
          <code className="mx-1 rounded bg-white px-1">ADMIN_EMAIL</code>et<code className="mx-1 rounded bg-white px-1">ADMIN_INITIAL_PASSWORD</code>
          et impose un changement de mot de passe à la première connexion.
        </p>
      </div>

      <Modal open={forcePw} onClose={() => setForcePw(false)} title="Première connexion — sécurisez votre compte">
        <p className="text-sm text-soft">
          Conformément à la politique de sécurité FIJADA, le mot de passe initial du compte administrateur doit être
          remplacé avant toute utilisation. Cette action est journalisée.
        </p>
        <form onSubmit={submitForce} className="mt-4 space-y-4">
          <Field label="Nouveau mot de passe" required hint="8+ caractères, lettres et chiffres">
            <Input type="password" value={npw} onChange={(e) => setNpw(e.target.value)} required />
          </Field>
          <Field label="Confirmation" required>
            <Input type="password" value={npw2} onChange={(e) => setNpw2(e.target.value)} required />
          </Field>
          <Btn type="submit" className="w-full"><ShieldCheck size={15} /> Mettre à jour et continuer</Btn>
        </form>
      </Modal>
    </AuthShell>
  );
}

/* ================= INSCRIPTION ================= */
export function RegisterPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [consent, setConsent] = useState(false);
  const [err, setErr] = useState('');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    if (!validEmail(email)) return setErr('Adresse e-mail invalide.');
    if (!/^[a-z0-9._-]{3,24}$/.test(username.toLowerCase()))
      return setErr('Nom d’utilisateur : 3 à 24 caractères (lettres, chiffres, points, tirets).');
    const weak = strongPassword(pw);
    if (weak) return setErr(weak);
    if (pw !== pw2) return setErr('Les deux mots de passe ne correspondent pas.');
    if (!consent) return setErr('Vous devez accepter la politique de confidentialité et les conditions d’utilisation.');
    const r = registerUser({ email, username, password: pw });
    if (!r.ok) return setErr(r.error || 'Inscription impossible.');
    toast.push('success', 'Compte créé ! Complétez maintenant votre profil officiel.');
    nav('/onboarding');
  };

  return (
    <AuthShell title="Créer un compte participant" sub="L’inscription est ouverte aux délégations, institutions, partenaires et invités du Sommet.">
      <form onSubmit={submit} className="space-y-4">
        <Field label="Adresse e-mail" required hint="Unique — servira à la vérification">
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@institution.org" required />
        </Field>
        <Field label="Nom d’utilisateur" required hint="Unique — visible dans l’annuaire">
          <div className="relative">
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 font-mono text-sm text-soft">@</span>
            <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="prenom.nom" className="pl-7" required />
          </div>
        </Field>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Mot de passe" required hint="8+ caractères, lettres et chiffres">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </Field>
          <Field label="Confirmation" required>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} required />
          </Field>
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 rounded-md border border-line bg-paper px-3 py-2.5">
          <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[#153B8E]" />
          <span className="text-[13px] leading-relaxed text-soft">
            J’accepte la <Link to="/politique-confidentialite" className="font-semibold text-royal-700 underline">politique de confidentialité</Link> et les{' '}
            <Link to="/conditions" className="font-semibold text-royal-700 underline">conditions d’utilisation</Link>, et je consens au traitement de mes
            données professionnelles dans le cadre du Sommet.
          </span>
        </label>
        {err && <p className="rounded-md bg-flame-100 px-3 py-2 text-[13px] font-semibold text-flame-700">{err}</p>}
        <Btn type="submit" className="w-full" size="lg"><UserPlus size={16} /> Créer mon compte</Btn>
        <p className="text-center text-[13px] text-soft">
          Déjà inscrit ? <Link to="/connexion" className="font-semibold text-royal-700 hover:underline">Se connecter</Link>
        </p>
      </form>
    </AuthShell>
  );
}

/* ================= MOT DE PASSE OUBLIÉ ================= */
export function ForgotPage() {
  const nav = useNavigate();
  const toast = useToast();
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState('');
  const [demoCode, setDemoCode] = useState('');
  const [code, setCode] = useState('');
  const [pw, setPw] = useState('');
  const [err, setErr] = useState('');

  const send = (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const r = requestPasswordReset(email);
    if (!r.ok) return setErr(r.error || 'Impossible d’envoyer le code.');
    setDemoCode(r.code || '');
    setStep(2);
    toast.push('info', 'Code de récupération généré (démo : affiché ci-dessous).');
  };
  const reset = (e: FormEvent) => {
    e.preventDefault();
    setErr('');
    const weak = strongPassword(pw);
    if (weak) return setErr(weak);
    const r = resetPassword(email, code, pw);
    if (!r.ok) return setErr(r.error || 'Réinitialisation impossible.');
    toast.push('success', 'Mot de passe réinitialisé. Vous pouvez vous connecter.');
    nav('/connexion');
  };

  return (
    <AuthShell title="Récupération du mot de passe" sub="Un code de vérification est envoyé à votre adresse e-mail.">
      {step === 1 ? (
        <form onSubmit={send} className="space-y-4">
          <Field label="Adresse e-mail du compte" required>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="vous@institution.org" required />
          </Field>
          {err && <p className="rounded-md bg-flame-100 px-3 py-2 text-[13px] font-semibold text-flame-700">{err}</p>}
          <Btn type="submit" className="w-full"><Mail size={15} /> Envoyer le code</Btn>
        </form>
      ) : (
        <form onSubmit={reset} className="space-y-4">
          <div className="rounded-md border border-dashed border-gold-400/70 bg-gold-100 px-3 py-2.5 text-[13px] text-gold-700">
            <strong>Démo</strong> — en production, ce code est envoyé par e-mail : <span className="font-mono text-base font-bold">{demoCode}</span>
          </div>
          <Field label="Code de vérification" required>
            <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="6 chiffres" className="font-mono" required />
          </Field>
          <Field label="Nouveau mot de passe" required hint="8+ caractères, lettres et chiffres">
            <Input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required />
          </Field>
          {err && <p className="rounded-md bg-flame-100 px-3 py-2 text-[13px] font-semibold text-flame-700">{err}</p>}
          <Btn type="submit" className="w-full"><KeyRound size={15} /> Réinitialiser le mot de passe</Btn>
        </form>
      )}
      <p className={cx('mt-5 text-center text-[13px] text-soft')}>
        <Link to="/connexion" className="font-semibold text-royal-700 hover:underline">Retour à la connexion</Link>
      </p>
    </AuthShell>
  );
}
