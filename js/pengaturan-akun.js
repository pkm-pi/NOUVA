/* Pengaturan profil untuk admin dan pelanggan NOUVA.
   Profil disimpan di public.profiles; kata sandi dikelola Supabase Auth. */
(function () {
  const $ = (id) => document.getElementById(id);

  function showMessage(message, type = "info") {
    const el = $("accountMessage");
    if (!el) return;
    el.textContent = message;
    el.dataset.kind = type;
  }

  window.initNouvaAccountSettings = async function ({ expectedRole, loginUrl }) {
    const sb = window.nouvaSupabase;
    if (!window.nouvaSupabaseReady || !sb) {
      showMessage("Koneksi Supabase belum siap. Periksa js/nouva-config.js.", "error");
      return;
    }

    let session;
    try {
      const result = await sb.auth.getSession();
      if (result.error) throw result.error;
      session = result.data.session;
      if (!session) {
        alert("Silakan login terlebih dahulu.");
        location.href = loginUrl;
        return;
      }

      const profileResult = await sb.from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", session.user.id)
        .single();
      if (profileResult.error) throw profileResult.error;

      const profile = profileResult.data;
      if (profile.role !== expectedRole) {
        alert("Halaman ini hanya dapat dibuka oleh akun " +
          (expectedRole === "admin" ? "admin." : "pelanggan."));
        location.href = loginUrl;
        return;
      }

      $("namaKamu").value = profile.full_name || "";
      $("nomorHp").value = profile.phone || "";
      const nameLabel = document.querySelector(".admin-name");
      if (nameLabel && expectedRole === "admin") nameLabel.textContent = profile.full_name || "Admin";

      document.querySelectorAll(".setting-btn[data-target]").forEach((button) => {
        button.addEventListener("click", async () => {
          const target = button.dataset.target;
          const input = $(target);
          const value = input.value.trim();
          if (target === "namaKamu" && !value) {
            showMessage("Nama tidak boleh kosong.", "error");
            input.focus();
            return;
          }
          button.disabled = true;
          const oldText = button.textContent;
          button.textContent = "Menyimpan...";
          const patch = target === "namaKamu" ? { full_name: value } : { phone: value || null };
          const { error } = await sb.from("profiles").update(patch).eq("id", session.user.id);
          button.disabled = false;
          button.textContent = oldText;
          if (error) {
            showMessage("Gagal menyimpan profil: " + error.message, "error");
            return;
          }
          if (target === "namaKamu" && nameLabel && expectedRole === "admin") nameLabel.textContent = value;
          showMessage("Profil berhasil diperbarui.", "success");
        });
      });

      $("passwordButton").addEventListener("click", async () => {
        const nextPassword = prompt("Masukkan kata sandi baru (minimal 6 karakter):");
        if (nextPassword === null) return;
        if (nextPassword.length < 6) {
          showMessage("Kata sandi minimal 6 karakter.", "error");
          return;
        }
        const confirmation = prompt("Ulangi kata sandi baru:");
        if (confirmation === null) return;
        if (nextPassword !== confirmation) {
          showMessage("Konfirmasi kata sandi tidak cocok.", "error");
          return;
        }
        const button = $("passwordButton");
        button.disabled = true;
        const { error } = await sb.auth.updateUser({ password: nextPassword });
        button.disabled = false;
        if (error) {
          showMessage("Gagal mengganti kata sandi: " + error.message, "error");
          return;
        }
        showMessage("Kata sandi berhasil diganti.", "success");
      });

      $("logoutButton").addEventListener("click", async () => {
        if (!confirm("Yakin ingin keluar dari akun?")) return;
        const { error } = await sb.auth.signOut();
        if (error) {
          showMessage("Gagal keluar: " + error.message, "error");
          return;
        }
        location.href = loginUrl;
      });

      showMessage("Data akun berhasil dimuat dari Supabase.", "success");
    } catch (error) {
      console.error("Pengaturan akun:", error);
      showMessage("Tidak dapat memuat akun: " + (error.message || "Terjadi kesalahan."), "error");
    }
  };
})();
