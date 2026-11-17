import { useEffect } from 'react';

export default function PaginaNeutra() {
  useEffect(() => {
    document.title = 'Página de inicio';
    return () => {
      document.title = 'EquiGénero';
    };
  }, []);

  return (
    <main className="grid min-h-screen place-items-center bg-white px-6 text-slate-700">
      <section className="w-full max-w-xl">
        <h1 className="text-2xl font-medium">Página de inicio</h1>
        <p className="mt-3 text-sm text-slate-500">La página solicitada ya no está disponible en esta pestaña.</p>
      </section>
    </main>
  );
}
