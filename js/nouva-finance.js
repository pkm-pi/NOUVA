/* Integrasi pembukuan NOUVA ke Supabase */
(function(){
  const cfg=window.NOUVA_CONFIG||{};
  window.nouvaFinanceClient=(cfg.SUPABASE_URL&&cfg.SUPABASE_PUBLIC_KEY&&window.supabase)
    ? window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_PUBLIC_KEY) : null;
  window.nouvaFinanceReady=!!window.nouvaFinanceClient;
  window.nouvaFinanceError=function(err){
    console.error('[NOUVA Pembukuan]',err);
    return err?.message || 'Terjadi kesalahan saat mengakses Supabase.';
  };
})();
