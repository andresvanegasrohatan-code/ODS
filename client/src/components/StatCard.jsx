const TEMA = {
  brand: {
    wrap: 'from-brand/12 via-white to-brand/5',
    icon: 'bg-brand-tint text-brand-dark',
    text: 'text-brand-dark',
  },
  gold: {
    wrap: 'from-gold/15 via-white to-gold/5',
    icon: 'bg-gold-tint text-gold',
    text: 'text-gold',
  },
  violet: {
    wrap: 'from-violet/15 via-white to-violet/5',
    icon: 'bg-violet-tint text-violet',
    text: 'text-violet',
  },
  ok: {
    wrap: 'from-ok/15 via-white to-ok/5',
    icon: 'bg-ok-tint text-ok',
    text: 'text-ok',
  },
};

export default function StatCard({ valor, etiqueta, color = 'brand' }) {
  const estilo = TEMA[color] || TEMA.brand;

  return (
    <div className={`rounded-[24px] border border-line bg-gradient-to-br ${estilo.wrap} p-5 shadow-soft`}>
      <div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${estilo.icon}`}>
        <span className="text-lg">•</span>
      </div>
      <div className={`font-display text-4xl font-bold ${estilo.text}`}>{valor}</div>
      <div className="mt-1 text-sm text-ink-soft">{etiqueta}</div>
    </div>
  );
}
