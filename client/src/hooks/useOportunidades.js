import { useEffect, useState } from 'react';
import { mensajeDeError } from '../services/api';
import { listarOportunidades } from '../services/oportunidadesService';

export default function useOportunidades() {
  const [oportunidades, setOportunidades] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let montado = true;

    listarOportunidades()
      .then((items) => {
        if (montado) setOportunidades(items);
      })
      .catch((err) => {
        if (montado) setError(mensajeDeError(err, 'No se pudieron cargar las oportunidades'));
      })
      .finally(() => {
        if (montado) setCargando(false);
      });

    return () => {
      montado = false;
    };
  }, []);

  return { oportunidades, cargando, error };
}
