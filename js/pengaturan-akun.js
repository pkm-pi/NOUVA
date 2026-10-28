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

    // Pasang handler Keluar seawal mungkin agar tombol tetap berfungsi
    // meskipun pemuatan profil mengalami error.
    const logoutButton = $("logoutButton");
    if (logoutButton && !logoutButton.dataset.logoutBound) {
      logoutButton.dataset.logoutBound = "true";
      logoutButton.addEventListener("click", async () => {
        logoutButton.disabled = true;
        const oldContent = logoutButton.innerHTML;
        logoutButton.innerHTML = "<span>Keluar...</span>";

        try {
          if (window.nouvaSupabaseReady && window.nouvaSupabase) {
            const { error } = await window.nouvaSupabase.auth.signOut();
            if (error) console.error("Logout Supabase:", error);
          }
        } catch (error) {
          console.error("Logout NOUVA:", error);
        } finally {
          // Halaman index berada satu tingkat di atas folder admin.
          window.location.replace("../index.html");
        }
      });
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
        .select("id, full_name, phone, username, role")
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
      if ($("emailAkun")) $("emailAkun").value = session.user.email || "";
      if ($("usernameAkun")) $("usernameAkun").value = profile.username || "";
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
          if (target === "usernameAkun") {
            const username = value.toLowerCase();
            if (!/^[a-z0-9_]{3,24}$/.test(username)) {
              showMessage("Username harus 3–24 karakter dan hanya berisi huruf, angka, atau garis bawah (_).", "error");
              input.focus();
              return;
            }
            if (username === (profile.username || "").toLowerCase()) {
              showMessage("Username tidak berubah.", "info");
              return;
            }
            const { data: available, error: availabilityError } = await sb.rpc("nouva_username_available", { p_username: username });
            if (availabilityError) {
              showMessage("Tidak dapat memeriksa username. Pastikan fungsi nouva_username_available tersedia di Supabase.", "error");
              return;
            }
            if (!available) {
              showMessage("Username sudah digunakan. Pilih username lain.", "error");
              input.focus();
              return;
            }
          }
          button.disabled = true;
          const oldText = button.textContent;
          button.textContent = "Menyimpan...";
          let patch;
          if (target === "namaKamu") patch = { full_name: value };
          else if (target === "usernameAkun") patch = { username: value.toLowerCase() };
          else patch = { phone: value || null };
          const { error } = await sb.from("profiles").update(patch).eq("id", session.user.id);
          if (!error && target === "usernameAkun") profile.username = value.toLowerCase();
          if (!error && target === "namaKamu") profile.full_name = value; 
          if (!error && target === "nomorHp") profile.phone = value || null;
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


    } catch (error) {
      console.error("Pengaturan akun:", error);
      showMessage("Tidak dapat memuat akun: " + (error.message || "Terjadi kesalahan."), "error");
    }
  };
})();
