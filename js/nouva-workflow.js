/* Helper alur Nouva. Hanya memakai publishable key di browser. */
window.NouvaWorkflow = {
  async requireRole(role, redirect) {
    const sb = window.nouvaSupabase;
    if (!window.nouvaSupabaseReady || !sb) throw new Error("Supabase belum siap. Periksa js/nouva-config.js.");
    const { data: { session }, error: sessionError } = await sb.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session) {
      alert("Silakan login terlebih dahulu.");
      location.href = redirect;
      throw new Error("Sesi login tidak ditemukan.");
    }
    const { data: profile, error } = await sb.from("profiles")
      .select("id,full_name,phone,role").eq("id", session.user.id).single();
    if (error) throw error;
    if (profile.role !== role) {
      alert("Akun ini tidak memiliki akses ke halaman tersebut.");
      location.href = redirect;
      throw new Error("Role tidak sesuai.");
    }
    return { session, profile, sb };
  },
  escape(value) {
    return String(value ?? "").replace(/[&<>"']/g, c => ({
      "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"
    }[c]));
  },
  money(value) {
    return new Intl.NumberFormat("id-ID", { style:"currency", currency:"IDR", maximumFractionDigits:0 }).format(Number(value || 0));
  },
  date(value) {
    if (!value) return "Belum ditentukan";
    return new Date(value + (String(value).length === 10 ? "T00:00:00" : "")).toLocaleDateString("id-ID", {day:"2-digit",month:"long",year:"numeric"});
  }
};