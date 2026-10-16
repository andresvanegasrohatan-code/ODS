const ESTILOS = {
  Activo: 'bg-ok-tint text-ok',
  Pendiente: 'bg-gold-tint text-gold',
  Resuelto: 'bg-violet-tint text-violet',
};

export default function Badge({ estado }) {
  return (
    <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${ESTILOS[estado] || 'bg-line text-ink-soft'}`}>
      {estado}
    </span>
  );
}
