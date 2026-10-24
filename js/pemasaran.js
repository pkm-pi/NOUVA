import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

/*
 * Isi dua nilai ini dari Supabase > Project Settings > API.
 * Gunakan Project URL dan anon/public key. JANGAN gunakan service_role key di browser.
 */
const SUPABASE_URL = "https://adlfcoedutgvjhqfvbii.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_7xBrB5laI-OeP1OrOEXuRA_WHnL9UJH";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const $ = (id) => document.getElementById(id);

const monthSelect = $("monthSelect");
const yearSelect = $("yearSelect");
const historyBody = $("historyBody");
const historyCount = $("historyCount");
const message = $("marketingMessage");
const modal = $("postModal");
const form = $("postForm");

let historyData = [];
let targets = { Instagram: 10, Facebook: 10, TikTok: 5 };
let activityChart = null;
let loading = false;

const current = new Date();
monthSelect.value = String(current.getMonth() + 1).padStart(2, "0");
yearSelect.value = String(current.getFullYear());

function setMessage(text, kind = "info") {
  if (!message) return;
  message.textContent = text;
  message.dataset.kind = kind;
}

function formatDate(value) {
  return new Date(value + "T00:00:00").toLocaleDateString("id-ID", {
    day: "2-digit", month: "short", year: "numeric"
  });
}

function selectedMonthRows() {
  const period = `${yearSelect.value}-${monthSelect.value}`;
  return historyData.filter(row => row.post_date.startsWith(period));
}

function updateTargets(rows) {
  const done = { Instagram: 0, Facebook: 0, TikTok: 0 };
  rows.forEach(row => {
    if (row.status === "Sudah Diposting" && done[row.platform] !== undefined) done[row.platform]++;
  });
  const ids = { Instagram: "ig", Facebook: "fb", TikTok: "tt" };
  Object.keys(done).forEach(platform => {
    const key = ids[platform];
    const target = Number(targets[platform] || 0);
    const percent = target > 0 ? Math.min(100, Math.round(done[platform] / target * 100)) : 0;
    $(`${key}Target`).textContent = target;
    $(`${key}Done`).textContent = done[platform];
    $(`${key}Progress`).textContent = `${percent}%`;
    $(`${key}Bar`).style.width = `${percent}%`;
  });
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[char]));
}

function updateTable(rows) {
  const sorted = [...rows].sort((a, b) => b.post_date.localeCompare(a.post_date));
  historyBody.innerHTML = sorted.map(row => `
    <tr>
      <td>${formatDate(row.post_date)}</td>
      <td><span class="platform-badge ${row.platform.toLowerCase()}">${escapeHTML(row.platform)}</span></td>
      <td class="title-cell">${escapeHTML(row.content_title)}</td>
      <td>${escapeHTML(row.content_type)}</td>
      <td>
        <select class="status-select ${row.status === "Sudah Diposting" ? "posted" : "not-posted"}"
          data-id="${row.id}" aria-label="Status posting">
          <option value="Sudah Diposting" ${row.status === "Sudah Diposting" ? "selected" : ""}>Sudah Diposting</option>
          <option value="Belum Diposting" ${row.status === "Belum Diposting" ? "selected" : ""}>Belum Diposting</option>
        </select>
      </td>
    </tr>`).join("");

  historyCount.textContent = `Menampilkan ${sorted.length ? 1 : 0}–${sorted.length} dari ${sorted.length} data`;
  historyBody.querySelectorAll(".status-select").forEach(select => {
    select.addEventListener("change", async () => {
      const { error } = await supabase.from("marketing_postings")
        .update({ status: select.value })
        .eq("id", select.dataset.id);
      if (error) {
        setMessage(`Gagal memperbarui status: ${error.message}`, "error");
        await loadMarketing();
        return;
      }
      const row = historyData.find(item => item.id === select.dataset.id);
      if (row) row.status = select.value;
      refresh();
      setMessage("Status posting berhasil diperbarui.", "success");
    });
  });
}

function weekNumber(dateString) {
  return Math.min(5, Math.floor((new Date(dateString + "T00:00:00").getDate() - 1) / 7) + 1);
}

function updateChart(rows) {
  const values = { Instagram: [0,0,0,0,0], Facebook: [0,0,0,0,0], TikTok: [0,0,0,0,0] };
  rows.forEach(row => {
    if (row.status === "Sudah Diposting" && values[row.platform]) {
      values[row.platform][weekNumber(row.post_date) - 1]++;
    }
  });
  const canvas = $("activityChart");
  const ctx = canvas.getContext("2d");
  const instagramGradient = ctx.createLinearGradient(0, 0, 0, 220);
  instagramGradient.addColorStop(0, "#833AB4"); instagramGradient.addColorStop(.5, "#E1306C"); instagramGradient.addColorStop(1, "#F77737");
  const facebookGradient = ctx.createLinearGradient(0, 0, 0, 220);
  facebookGradient.addColorStop(0, "#1877F2"); facebookGradient.addColorStop(1, "#8AB4F8");
  const tiktokGradient = ctx.createLinearGradient(0, 0, 0, 220);
  tiktokGradient.addColorStop(0, "#000000"); tiktokGradient.addColorStop(1, "#646464");

  if (activityChart) activityChart.destroy();
  activityChart = new Chart(canvas, {
    type: "bar",
    data: {
      labels: ["Minggu 1", "Minggu 2", "Minggu 3", "Minggu 4", "Minggu 5"],
      datasets: [
        { label: "Instagram", data: values.Instagram, backgroundColor: instagramGradient, borderRadius: 5, barThickness: 10 },
        { label: "Facebook", data: values.Facebook, backgroundColor: facebookGradient, borderRadius: 5, barThickness: 10 },
        { label: "TikTok", data: values.TikTok, backgroundColor: tiktokGradient, borderRadius: 5, barThickness: 10 }
      ]
    },
    options: {
      responsive: true, maintainAspectRatio: false,
      plugins: { legend: { position: "top", align: "start", labels: { usePointStyle: true, boxWidth: 9, font: { size: 11, weight: "600" }, padding: 12 } } },
      scales: { x: { grid: { display: false }, ticks: { font: { size: 10 } } }, y: { beginAtZero: true, ticks: { stepSize: 1, font: { size: 8 } }, grid: { color: "#dedfd8" } } }
    }
  });
}

function refresh() {
  const rows = selectedMonthRows();
  updateTargets(rows);
  updateTable(rows);
  updateChart(rows);
}

async function loadMarketing() {
  if (loading) return;
  loading = true;
  setMessage("Memuat data pemasaran...");
  const start = `${yearSelect.value}-${monthSelect.value}-01`;
  const endDate = new Date(Number(yearSelect.value), Number(monthSelect.value), 1);
  const end = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, "0")}-01`;

  const [postsResult, targetsResult] = await Promise.all([
    supabase.from("marketing_postings")
      .select("id, post_date, platform, content_title, content_type, status")
      .gte("post_date", start).lt("post_date", end)
      .order("post_date", { ascending: false }),
    supabase.from("marketing_monthly_targets")
      .select("platform, target_count")
      .eq("target_month", start)
  ]);

  if (postsResult.error || targetsResult.error) {
    const err = postsResult.error || targetsResult.error;
    setMessage(`Tidak dapat memuat data Supabase: ${err.message}. Pastikan SQL pemasaran sudah dijalankan dan konfigurasi Supabase benar.`, "error");
    historyData = [];
    targets = { Instagram: 10, Facebook: 10, TikTok: 5 };
    refresh();
    loading = false;
    return;
  }

  historyData = postsResult.data || [];
  targets = { Instagram: 10, Facebook: 10, TikTok: 5 };
  (targetsResult.data || []).forEach(row => { targets[row.platform] = row.target_count; });
  refresh();
  setMessage(historyData.length ? "Data pemasaran berhasil dimuat dari Supabase." : "Belum ada catatan posting pada bulan ini. Tambahkan melalui tombol Catat Postingan.", "success");
  loading = false;
}

monthSelect.addEventListener("change", loadMarketing);
yearSelect.addEventListener("change", loadMarketing);

$("openPostModal").addEventListener("click", () => {
  $("postDate").value = `${yearSelect.value}-${monthSelect.value}-${String(current.getDate()).padStart(2, "0")}`;
  modal.classList.add("show"); modal.setAttribute("aria-hidden", "false");
});
function closeModal() { modal.classList.remove("show"); modal.setAttribute("aria-hidden", "true"); }
$("closePostModal").addEventListener("click", closeModal);
modal.addEventListener("click", event => { if (event.target === modal) closeModal(); });

form.addEventListener("submit", async event => {
  event.preventDefault();
  const submit = form.querySelector('[type="submit"]');
  submit.disabled = true;
  submit.textContent = "Menyimpan...";
  const payload = {
    post_date: $("postDate").value,
    platform: $("postPlatform").value,
    content_title: $("postTitle").value.trim(),
    content_type: $("postType").value,
    status: $("postStatus").value
  };
  const { error } = await supabase.from("marketing_postings").insert(payload);
  submit.disabled = false;
  submit.textContent = "Simpan Catatan";
  if (error) {
    setMessage(`Gagal menyimpan postingan: ${error.message}`, "error");
    return;
  }
  closeModal();
  form.reset();
  monthSelect.value = payload.post_date.slice(5, 7);
  yearSelect.value = payload.post_date.slice(0, 4);
  await loadMarketing();
});

loadMarketing();
