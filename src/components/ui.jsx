import { X } from "lucide-react";

export function Button({ children, variant = "primary", className = "", ...props }) {
  const variants = {
    primary: "bg-garden-pine text-white hover:bg-garden-leaf shadow-card",
    secondary: "bg-white text-garden-pine border border-garden-moss hover:bg-garden-moss/45",
    ghost: "text-garden-pine hover:bg-garden-moss/55",
    danger: "bg-garden-rose text-white hover:brightness-95"
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

export function Card({ children, className = "" }) {
  return <section className={`rounded-3xl border border-white/80 bg-white/[0.86] p-5 shadow-card backdrop-blur transition ${className}`}>{children}</section>;
}

export function Badge({ children, tone = "green" }) {
  const tones = {
    green: "bg-garden-moss text-garden-pine",
    amber: "bg-amber-100 text-amber-800",
    red: "bg-red-100 text-red-700",
    blue: "bg-sky-100 text-sky-800",
    gray: "bg-stone-100 text-stone-700"
  };

  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]}`}>{children}</span>;
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-garden-pine/35 p-3 backdrop-blur-sm sm:items-center">
      <div className="max-h-[92vh] w-full max-w-2xl overflow-auto rounded-3xl bg-garden-paper p-5 shadow-soft">
        <div className="mb-5 flex items-center justify-between gap-4">
          <h2 className="text-xl font-bold text-garden-pine">{title}</h2>
          <Button variant="ghost" className="h-10 w-10 rounded-full p-0" onClick={onClose} aria-label="Fermer">
            <X size={18} />
          </Button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }) {
  return (
    <label className="grid gap-1.5 text-sm font-semibold text-garden-pine">
      <span>{label}</span>
      {children}
    </label>
  );
}

export const inputClass =
  "min-h-11 rounded-xl border border-garden-moss bg-white px-3 py-2 text-sm outline-none transition placeholder:text-stone-400 focus:border-garden-leaf focus:ring-4 focus:ring-garden-moss/45";

export function EmptyState({ title, text }) {
  return (
    <div className="rounded-2xl border border-dashed border-garden-sage/60 bg-white/55 p-8 text-center">
      <p className="font-bold text-garden-pine">{title}</p>
      <p className="mt-1 text-sm text-garden-leaf">{text}</p>
    </div>
  );
}
