/* Supabase browser client. Gunakan hanya publishable/anon key. */
(function () {
  const cfg = window.NOUVA_CONFIG || {};
  const valid = cfg.SUPABASE_URL && !cfg.SUPABASE_URL.startsWith("ISI_") && cfg.SUPABASE_PUBLIC_KEY && !cfg.SUPABASE_PUBLIC_KEY.startsWith("ISI_");
  window.nouvaSupabaseReady = Boolean(valid && window.supabase);
  window.nouvaSupabase = window.nouvaSupabaseReady ? window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_PUBLIC_KEY) : null;
})();
