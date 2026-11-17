const { createClient } = require('@supabase/supabase-js');

let supabase;

function obtenerBucketEvidencias() {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const error = new Error('El almacenamiento privado no está configurado');
    error.code = 'STORAGE_NOT_CONFIGURED';
    throw error;
  }
  if (!supabase) {
    supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return supabase.storage.from(process.env.SUPABASE_EVIDENCIAS_BUCKET || 'equigenero-evidencias');
}

module.exports = { obtenerBucketEvidencias };
