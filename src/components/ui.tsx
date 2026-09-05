import {
  createContext, useContext, useEffect, useRef, useState,
  ReactNode, InputHTMLAttributes, SelectHTMLAttributes, TextareaHTMLAttributes, ButtonHTMLAttributes,
} from 'react';
import { X, CheckCircle2, AlertTriangle, Info, Inbox } from 'lucide-react';
import { cx } from '../lib/utils';

/* ---------------- Boutons ---------------- */
type BtnVariant = 'primary' | 'gold' | 'outline' | 'ghost' | 'danger' | 'navy';
export function Btn({
  variant = 'primary', size = 'md', className, ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' }) {
  const v: Record<BtnVariant, string> = {
    primary: 'bg-royal-700 text-white hover:bg-royal-800 shadow-sm shadow-royal-900/20',
    gold: 'bg-gold-400 text-navy-900 hover:bg-gold-500 shadow-sm shadow-gold-700/20',
    outline: 'border border-line bg-card text-ink hover:border-royal-500 hover:text-royal-700',
    ghost: 'text-soft hover:bg-royal-50 hover:text-royal-700',
    danger: 'bg-flame-600 text-white hover:bg-flame-700',
    navy: 'bg-navy-900 text-white hover:bg-navy-800',
  };
  const s = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-[15px]',
  }[size];
  return (
    <button
      className={cx(
        'inline-flex items-center justify-center gap-2 rounded-md font-semibold transition-all duration-200 active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 cursor-pointer',
        v[variant], s, className,
      )}
      {...props}
    />
  );
}

/* ---------------- Formulaires ---------------- */
export function Field({ label, hint, error, required, children }: {
  label: string; hint?: string; error?: string; required?: boolean; children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-soft">
        <span>{label}{required && <span className="text-flame-600"> *</span>}</span>
        {hint && <span className="normal-case tracking-normal text-[11px] text-soft/70">{hint}</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs font-medium text-flame-600">{error}</span>}
    </label>
  );
}
const inputBase =
  'w-full rounded-md border border-line bg-white px-3 py-2.5 text-sm text-ink placeholder:text-soft/60 transition-colors focus:border-royal-500 focus:outline-none focus:ring-2 focus:ring-royal-500/20';
export function Input(props: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(inputBase, props.className)} {...props} />;
}
export function Select(props: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={cx(inputBase, 'cursor-pointer', props.className)} {...props} />;
}
export function Textarea({ max, value, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement> & { max?: number }) {
  const len = String(value ?? '').length;
  return (
    <div>
      <textarea className={cx(inputBase, 'min-h-[90px] resize-y', props.className)} value={value} {...props} />
      {max && (
        <div className={cx('mt-1 text-right font-mono text-[11px]', len > max ? 'text-flame-600 font-semibold' : 'text-soft/70')}>
          {len} / {max}
        </div>
      )}
    </div>
  );
}
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex cursor-pointer items-center gap-2.5"
    >
      <span className={cx('relative h-5.5 w-10 rounded-full transition-colors duration-200', checked ? 'bg-forest-600' : 'bg-line')}>
        <span className={cx('absolute top-0.5 h-4.5 w-4.5 rounded-full bg-white shadow transition-transform duration-200', checked ? 'translate-x-5' : 'translate-x-0.5')} />
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </button>
  );
}

/* ---------------- Modal ---------------- */
export function Modal({ open, onClose, title, children, wide }: {
  open: boolean; onClose: () => void; title?: ReactNode; children: ReactNode; wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const f = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', f);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', f);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-100 flex items-end justify-center bg-navy-950/60 p-0 backdrop-blur-[2px] sm:items-center sm:p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        className={cx('toast-in max-h-[92vh] w-full overflow-y-auto rounded-t-xl border border-line bg-card p-6 shadow-2xl sm:rounded-lg', wide ? 'sm:max-w-2xl' : 'sm:max-w-lg')}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-4">
          <h3 className="font-display text-lg font-bold text-ink">{title}</h3>
          <button onClick={onClose} aria-label="Fermer" className="cursor-pointer rounded-md p-1 text-soft transition-colors hover:bg-paper hover:text-ink">
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

/* ---------------- Toasts ---------------- */
interface Toast { id: number; kind: 'success' | 'error' | 'info'; msg: string; }
const ToastCtx = createContext<{ push: (kind: Toast['kind'], msg: string) => void }>({ push: () => {} });
export function useToast() { return useContext(ToastCtx); }
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const idRef = useRef(0);
  const push = (kind: Toast['kind'], msg: string) => {
    const id = ++idRef.current;
    setToasts((t) => [...t, { id, kind, msg }].slice(-4));
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 3800);
  };
  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-3 bottom-20 z-200 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-5 sm:bottom-5 sm:items-end">
        {toasts.map((t) => (
          <div key={t.id} className={cx(
            'toast-in pointer-events-auto flex w-full max-w-sm items-start gap-2.5 rounded-lg border px-4 py-3 text-sm font-medium shadow-lg',
            t.kind === 'success' && 'border-forest-600/30 bg-forest-100 text-forest-700',
            t.kind === 'error' && 'border-flame-600/30 bg-flame-100 text-flame-700',
            t.kind === 'info' && 'border-royal-500/30 bg-royal-50 text-royal-800',
          )}>
            {t.kind === 'success' ? <CheckCircle2 size={18} className="mt-0.5 shrink-0" /> : t.kind === 'error' ? <AlertTriangle size={18} className="mt-0.5 shrink-0" /> : <Info size={18} className="mt-0.5 shrink-0" />}
            <span>{t.msg}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

/* ---------------- Divers ---------------- */
export function EmptyState({ title, desc, action, icon }: { title: string; desc?: string; action?: ReactNode; icon?: ReactNode }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-dashed border-line bg-card/60 px-6 py-14 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-royal-50 text-royal-700">
        {icon || <Inbox size={24} />}
      </div>
      <p className="font-display text-base font-bold text-ink">{title}</p>
      {desc && <p className="mt-1 max-w-sm text-sm text-soft">{desc}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('skeleton rounded-md', className)} />;
}
export function CardSkeleton() {
  return (
    <div className="rounded-lg border border-line bg-card p-5">
      <div className="flex items-center gap-3">
        <Skeleton className="h-12 w-12 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-2/3" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="mt-4 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
    </div>
  );
}

export function StatCard({ label, value, accent, sub }: { label: string; value: ReactNode; accent?: string; sub?: string }) {
  return (
    <div className="relative overflow-hidden rounded-lg border border-line bg-card p-4 transition-transform duration-200 hover:-translate-y-0.5">
      <div className={cx('absolute inset-x-0 top-0 h-1', accent || 'bg-royal-700')} />
      <p className="font-mono text-[10.5px] font-medium uppercase tracking-[0.16em] text-soft">{label}</p>
      <p className="mt-1.5 font-display text-[26px] leading-none font-extrabold text-ink">{value}</p>
      {sub && <p className="mt-1.5 text-xs text-soft">{sub}</p>}
    </div>
  );
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-line/70">
      <div className={cx('h-full rounded-full transition-all duration-500', value >= 100 ? 'bg-forest-600' : 'bg-gold-400')} style={{ width: `${Math.min(100, value)}%` }} />
    </div>
  );
}

export function SectionTitle({ kicker, title, desc, right }: { kicker: string; title: string; desc?: string; right?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <p className="mb-1.5 flex items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-royal-700">
          <span className="inline-block h-[2px] w-6 bg-gold-400" />{kicker}
        </p>
        <h2 className="font-display text-[22px] leading-tight font-extrabold text-ink sm:text-[26px]">{title}</h2>
        {desc && <p className="mt-1.5 max-w-2xl text-sm text-soft">{desc}</p>}
      </div>
      {right}
    </div>
  );
}

/* Scroll reveal */
export function Reveal({ children, className, delay }: { children: ReactNode; className?: string; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          el.classList.add('is-in');
          io.disconnect();
        }
      },
      { threshold: 0.08 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return (
    <div ref={ref} className={cx('reveal', className)} style={delay ? { animationDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  );
}

export function Tabs({ items, active, onChange }: { items: Array<{ id: string; label: ReactNode }>; active: string; onChange: (id: string) => void }) {
  return (
    <div className="no-scrollbar flex gap-1.5 overflow-x-auto rounded-lg border border-line bg-card p-1.5">
      {items.map((it) => (
        <button
          key={it.id}
          onClick={() => onChange(it.id)}
          className={cx(
            'shrink-0 cursor-pointer rounded-md px-3.5 py-2 text-sm font-semibold whitespace-nowrap transition-all duration-200',
            active === it.id ? 'bg-navy-900 text-white shadow-sm' : 'text-soft hover:bg-royal-50 hover:text-royal-700',
          )}
        >
          {it.label}
        </button>
      ))}
    </div>
  );
}
