export default function Alert({ tipo = 'error', children }) {
  if (!children) return null;
  const estilo = tipo === 'ok' ? 'bg-ok-tint text-ok' : 'bg-red-50 text-danger';
  return (
    <div role="alert" className={`mb-4 rounded-lg px-3 py-2.5 text-sm ${estilo}`}>
      {children}
    </div>
  );
}
