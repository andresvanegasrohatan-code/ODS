const ETIQUETAS = {
  brand: 'bg-brand-tint text-brand-dark',
  violet: 'bg-violet-tint text-violet',
  gold: 'bg-gold-tint text-gold',
};

export default function ContentCard({ item }) {
  return (
    <div className="card !p-5">
      <span className={`mb-3 inline-block rounded-full px-2.5 py-1 text-[11px] font-bold ${ETIQUETAS[item.color]}`}>
        {item.etiqueta}
      </span>
      <h4 className="mb-1 text-base">{item.titulo}</h4>
      <p className="text-sm leading-relaxed text-ink-soft">{item.texto}</p>
      {item.fecha && <p className="mt-3 text-xs text-ink-soft">📅 {item.fecha}</p>}
      {item.url && (
        <a
          className="mt-4 inline-flex text-sm font-semibold text-brand-dark underline underline-offset-4 hover:text-brand"
          href={item.url}
          target={item.url.startsWith('https://') ? '_blank' : undefined}
          rel={item.url.startsWith('https://') ? 'noreferrer' : undefined}
        >
          {item.enlaceTexto || 'Más información'}
        </a>
      )}
      {item.informacionUrl && (
        <a
          className="ml-4 inline-flex text-sm font-semibold text-brand-dark underline underline-offset-4 hover:text-brand"
          href={item.informacionUrl}
          target="_blank"
          rel="noreferrer"
        >
          Información oficial
        </a>
      )}
    </div>
  );
}
