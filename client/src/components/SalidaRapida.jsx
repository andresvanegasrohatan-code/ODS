import { useCallback, useEffect, useRef } from 'react';

const VENTANA_DOBLE_ESCAPE_MS = 1_500;

export default function SalidaRapida({ limpiar }) {
  const limpiarRef = useRef(limpiar);

  useEffect(() => {
    limpiarRef.current = limpiar;
  }, [limpiar]);

  const salir = useCallback(() => {
    limpiarRef.current?.();
    window.location.replace(new URL('/salida-rapida', window.location.origin).href);
  }, []);

  useEffect(() => {
    let ultimoEscape = 0;
    function detectarEscape(evento) {
      if (evento.key !== 'Escape' || evento.repeat) return;
      const ahora = Date.now();
      if (ahora - ultimoEscape <= VENTANA_DOBLE_ESCAPE_MS) {
        evento.preventDefault();
        salir();
        ultimoEscape = 0;
      } else {
        ultimoEscape = ahora;
      }
    }

    window.addEventListener('keydown', detectarEscape);
    return () => window.removeEventListener('keydown', detectarEscape);
  }, [salir]);

  return (
    <button
      type="button"
      className="rounded-lg border border-red-300 bg-white px-3 py-2 text-xs font-semibold text-red-800 transition hover:bg-red-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700 sm:text-sm"
      onClick={salir}
      aria-label="Salir rápidamente a una página neutra"
      title="También puedes presionar Escape dos veces"
    >
      Salida rápida
    </button>
  );
}
