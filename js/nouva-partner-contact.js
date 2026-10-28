/* Kartu kontak WhatsApp mitra NOUVA untuk halaman pelanggan. */
(function(){
  const cfg = window.NOUVA_CONFIG || {};
  const phone = String(cfg.WHATSAPP_MITRA || "").replace(/\D/g, "");
  const message = encodeURIComponent("Halo Mitra NOUVA, saya ingin bertanya mengenai produk/pesanan saya.");
  document.querySelectorAll("[data-nouva-partner-contact]").forEach((el)=>{
    el.classList.add("partner-contact-card");
    el.innerHTML = `
      <div class="partner-wa-icon" aria-hidden="true">
        <svg viewBox="0 0 32 32"><path d="M16 3.2A12.4 12.4 0 0 0 5.3 22l-1.7 6.2 6.4-1.7A12.4 12.4 0 1 0 16 3.2Zm0 22.5a10 10 0 0 1-5.1-1.4l-.4-.2-3.8 1 1-3.7-.2-.4A10 10 0 1 1 16 25.7Zm5.5-7.4c-.3-.2-1.8-.9-2.1-1s-.5-.2-.7.2-.8 1-1 1.2-.4.2-.7.1a8.1 8.1 0 0 1-2.4-1.5 9.1 9.1 0 0 1-1.7-2.1c-.2-.3 0-.5.1-.7l.5-.6.3-.5c.1-.2 0-.4 0-.6l-1-2.3c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4s-1.2 1.2-1.2 2.8 1.2 3.2 1.4 3.4 2.4 3.7 5.8 5.1c.8.3 1.4.5 1.9.6.8.2 1.5.2 2 .1.6-.1 1.8-.7 2-1.4s.2-1.3.1-1.4-.3-.2-.6-.4Z"/></svg>
      </div>
      <div class="partner-contact-copy">
        <strong>Kontak WhatsApp Mitra NOUVA</strong>
        <p>${phone ? "Hubungi mitra untuk bertanya tentang produk atau pesanan." : "Nomor WhatsApp mitra belum diatur. Isi WHATSAPP_MITRA di js/nouva-config.js agar tombol ini aktif."}</p>
      </div>
      ${phone ? `<a class="partner-wa-button" href="https://wa.me/${phone}?text=${message}" target="_blank" rel="noopener noreferrer">Chat WhatsApp</a>` : `<span class="partner-wa-button partner-wa-disabled" aria-disabled="true">WhatsApp belum diatur</span>`}
    `;
  });
})();
