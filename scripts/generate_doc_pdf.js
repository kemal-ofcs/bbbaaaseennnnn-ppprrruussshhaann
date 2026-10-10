const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { marked } = require('marked');

const mdPath = path.resolve('E:/Freelance/absensi-sppg-app/PANDUAN_LENGKAP_APLIKASI_SPPG.md');
const htmlPath = path.resolve('E:/Freelance/absensi-sppg-app/PANDUAN_LENGKAP_APLIKASI_SPPG.html');
const pdfPath = path.resolve('E:/Freelance/absensi-sppg-app/PANDUAN_LENGKAP_APLIKASI_SPPG.pdf');

const mdContent = fs.readFileSync(mdPath, 'utf8');

// Custom Marked Renderer
const renderer = new marked.Renderer();

// Custom Heading
renderer.heading = function({ text, depth }) {
  if (depth === 1) {
    // Title is already on cover page
    return '';
  }

  const cleanText = text.replace(/<[^>]*>/g, '');
  const id = cleanText.toLowerCase().replace(/[^a-z0-9]+/g, '-');

  if (depth === 2) {
    if (cleanText.startsWith('BAB ')) {
      const parts = cleanText.split(':');
      const babNum = parts[0].trim();
      const babTitle = parts.slice(1).join(':').trim();
      return `
        <div class="chapter-break"></div>
        <div class="chapter-header" id="${id}">
          <div class="chapter-badge">${babNum}</div>
          <h2 class="chapter-title">${babTitle}</h2>
        </div>
      `;
    }
    if (cleanText === 'DAFTAR ISI') {
      return `
        <div class="toc-header">
          <h2 class="toc-title">DAFTAR ISI</h2>
        </div>
      `;
    }
    return `<h2 class="section-title" id="${id}">${marked.parseInline(text)}</h2>`;
  }

  if (depth === 3) {
    return `<h3 class="subsection-title">${marked.parseInline(text)}</h3>`;
  }

  if (depth === 4) {
    if (cleanText.startsWith('Q') && cleanText.includes(':')) {
      return `
        <div class="faq-question">
          <span class="faq-q-badge">FAQ</span>
          <strong>${marked.parseInline(text)}</strong>
        </div>
      `;
    }
    return `<h4 class="minor-title">${marked.parseInline(text)}</h4>`;
  }

  return `<h${depth}>${marked.parseInline(text)}</h${depth}>`;
};

// Custom Code Block
renderer.code = function({ text, lang }) {
  const rawCode = text;

  if (lang === 'mermaid') {
    return renderMermaidSteps(rawCode);
  }
  if (lang === 'text' && rawCode.includes('CLOUD SERVER & DATABASE')) {
    return renderArchitectureDiagram(rawCode);
  }
  if (lang === 'text' && rawCode.includes('ALUR SETUP AWAL APLIKASI')) {
    return renderSetupFlowBox(rawCode);
  }
  if (lang === 'text' && rawCode.includes('PROVISIONING SATU KALI')) {
    return renderProvisioningBox(rawCode);
  }
  if (lang === 'text' && rawCode.includes('FITUR SCANNER QR CODE')) {
    return renderScannerMatrix(rawCode);
  }
  if (lang === 'text' && rawCode.includes('DYNAMIC ID CARD STUDIO')) {
    return renderIdStudioBox(rawCode);
  }
  if (lang === 'text' && rawCode.includes('STANDAR OPERASIONAL PEMINDAIAN QR')) {
    return renderSopBox(rawCode);
  }

  const langTag = lang ? `<div class="code-lang-tag">${lang.toUpperCase()}</div>` : '';
  const escaped = rawCode
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  return `
    <div class="code-block-wrapper">
      ${langTag}
      <pre><code class="language-${lang || 'text'}">${escaped}</code></pre>
    </div>
  `;
};

// Custom Table
renderer.table = function({ header, rows }) {
  let headerHtml = '<thead><tr>';
  for (let cell of header) {
    headerHtml += `<th>${marked.parseInline(cell.text)}</th>`;
  }
  headerHtml += '</tr></thead>';

  let bodyHtml = '<tbody>';
  for (let row of rows) {
    bodyHtml += '<tr>';
    for (let cell of row) {
      let formattedCell = marked.parseInline(cell.text);
      formattedCell = formatBadges(formattedCell);
      bodyHtml += `<td>${formattedCell}</td>`;
    }
    bodyHtml += '</tr>';
  }
  bodyHtml += '</tbody>';

  return `<div class="table-container"><table>${headerHtml}${bodyHtml}</table></div>`;
};

// Custom Paragraph
renderer.paragraph = function({ text }) {
  if (text.startsWith('### (Web Admin Cloud')) {
    return ''; // Included in cover page
  }
  if (text.startsWith('**Jawab**:')) {
    let parsed = marked.parseInline(text);
    return `<div class="faq-answer">${parsed}</div>`;
  }
  if (text.startsWith('$$') && text.endsWith('$$')) {
    const formula = text.slice(2, -2).trim();
    return `<div class="math-block"><div class="math-formula">${formula}</div></div>`;
  }
  if (text.startsWith('*Dokumen ini merupakan')) {
    let parsed = marked.parseInline(text);
    return `<div class="doc-footer-notice">${parsed}</div>`;
  }

  let parsed = marked.parseInline(text);
  let formatted = formatBadges(parsed);
  return `<p class="doc-para">${formatted}</p>`;
};

// Helper badge formatter
function formatBadges(str) {
  return str
    .replace(/<strong>Hadir Tepat Waktu<\/strong>/g, '<span class="badge badge-success">Hadir Tepat Waktu</span>')
    .replace(/<strong>Terlambat<\/strong>/g, '<span class="badge badge-warning">Terlambat</span>')
    .replace(/<strong>Pulang Cepat<\/strong>/g, '<span class="badge badge-orange">Pulang Cepat</span>')
    .replace(/<strong>Pulang Normal \/ Lembur<\/strong>/g, '<span class="badge badge-info">Pulang Normal / Lembur</span>')
    .replace(/<strong>Alfa \(Tidak Hadir\)<\/strong>/g, '<span class="badge badge-danger">Alfa (Tidak Hadir)</span>')
    .replace(/<strong>Alfa<\/strong>/g, '<span class="badge badge-danger">Alfa</span>')
    .replace(/<strong>Izin \/ Sakit \/ Dispensasi \/ Cuti<\/strong>/g, '<span class="badge badge-blue">Izin / Sakit / Dispen / Cuti</span>')
    .replace(/<strong>Libur \(Tidak dibangkitkan Alfa\)<\/strong>/g, '<span class="badge badge-purple">Libur</span>');
}

// Visual Component Renderers
function renderMermaidSteps(raw) {
  const steps = [
    { num: '1', title: 'Buat DB Turso', desc: 'Database tenant mandiri & auth token isolasi' },
    { num: '2', title: 'Deploy Web Server', desc: 'Next.js 16 API ke Vercel/VPS + Custom Domain' },
    { num: '3', title: 'Provisioning Superadmin', desc: 'Inisialisasi schema & akun SPD001 pertama' },
    { num: '4', title: 'Uji Web Admin Portal', desc: 'Verifikasi login & modul dashboard operational' },
    { num: '5', title: 'Compile Desktop Setup', desc: 'Build release NSIS Installer (.exe/.msi)' },
    { num: '6', title: 'Compile Mobile APK', desc: 'Build release APK Android ARM64/Split' },
    { num: '7', title: 'Uji Offline & Sync', desc: 'Verifikasi Outbox SQLite & Push Cloud' },
    { num: '8', title: 'Serah Terima Customer', desc: 'Penyerahan kredensial, APK, Desktop, & Manual' }
  ];

  let cards = steps.map(s => `
    <div class="step-card">
      <div class="step-number">${s.num}</div>
      <div class="step-content">
        <div class="step-title">${s.title}</div>
        <div class="step-desc">${s.desc}</div>
      </div>
    </div>
  `).join('');

  return `
    <div class="pipeline-wrapper">
      <div class="pipeline-header">
        <span class="pipeline-badge">WORKFLOW DEVELOPER</span>
        <strong>Checklist 8 Tahap Rilis & Serah Terima Aplikasi</strong>
      </div>
      <div class="pipeline-grid">
        ${cards}
      </div>
    </div>
  `;
}

function renderArchitectureDiagram(raw) {
  return `
    <div class="diagram-box">
      <div class="diagram-header">
        <span class="diagram-pill">ARSITEKTUR MULTI-CLIENT & LOCAL-FIRST</span>
        <span class="diagram-sub">Ecosystem Absensi SPPG (Zero-Downtime Offline First)</span>
      </div>
      
      <div class="arch-container">
        <!-- Cloud Server -->
        <div class="arch-node cloud-node">
          <div class="node-icon">☁️</div>
          <div class="node-body">
            <div class="node-title">CLOUD SERVER & DATABASE (TURSO LIBSQL)</div>
            <div class="node-sub">Next.js 16 Backend API · Web Admin Portal · Master Authority Synchronization</div>
          </div>
        </div>

        <div class="arch-sync-line">
          <div class="sync-badge">⇄ Bi-directional Outbox Sync (Zero Schema Drift) ⇄</div>
        </div>

        <div class="arch-clients-grid">
          <!-- Desktop Client -->
          <div class="arch-node client-node">
            <div class="node-header">
              <div class="node-icon">🖥️</div>
              <div class="node-title">DESKTOP CLIENT (TAURI v2)</div>
            </div>
            <ul class="node-features">
              <li>Front Desk & Pos Keamanan PC</li>
              <li>USB Barcode Scanner & Webcam</li>
              <li>Local SQLite (rusqlite WAL Mode)</li>
              <li>Full Offline Bi-directional Sync</li>
              <li>Offline Vault (AES-256-GCM + Argon2id)</li>
            </ul>
          </div>

          <!-- Mobile Client -->
          <div class="arch-node client-node">
            <div class="node-header">
              <div class="node-icon">📱</div>
              <div class="node-title">MOBILE ANDROID (TAURI v2)</div>
            </div>
            <ul class="node-features">
              <li>Smartphone Android & Tablet Portable</li>
              <li>Kamera Belakang ZXing + Flash/Torch</li>
              <li>Background GPS Geofencing Real-time</li>
              <li>Haptic Vibration & TTS Voice Synthesizer</li>
              <li>Local SQLite & Sub-second Response</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  `;
}

function renderSetupFlowBox(raw) {
  const steps = [
    "Provisioning Satu Kali & Akun Superadmin Pertama",
    "Lengkapi Profil Instansi & Upload Logo, TTD, Stempel Resmi",
    "Set Titik Koordinat GPS Kantor & Radius Geofence",
    "Atur Parameter Keamanan Pemindai & Cooldown Anti Double-Scan",
    "Aktifkan Otomasi Generate Alfa Harian",
    "Buat Master Shift Kerja (Pagi, Siang, Malam, Fleksibel)",
    "Input Kalender Hari Libur Nasional & Khusus Instansi",
    "Buat Akun Operator & Role Hak Akses (Admin, Manajer, Scanner)",
    "Masukkan Data Karyawan (Input Form / Import Excel)",
    "Desain Template di ID Card Studio & Cetak Kartu Karyawan"
  ];

  let items = steps.map((s, idx) => `
    <div class="setup-flow-item">
      <span class="setup-flow-num">${idx + 1}</span>
      <span class="setup-flow-text">${s}</span>
    </div>
  `).join('');

  return `
    <div class="setup-flow-card">
      <div class="setup-flow-header">
        <span class="setup-flow-badge">PANDUAN ADMINISTRATOR</span>
        <strong>10 Tahapan Konfigurasi Awal Sistem</strong>
      </div>
      <div class="setup-flow-grid">
        ${items}
      </div>
    </div>
  `;
}

function renderProvisioningBox(raw) {
  return `
    <div class="provisioning-card">
      <div class="provisioning-header">
        <span class="provisioning-badge">KEAMANAN ZERO-DEFAULT</span>
        <strong>Formulir Provisioning Satu Kali (First-Time Superadmin Setup)</strong>
      </div>
      <div class="provisioning-grid">
        <div class="prov-item">
          <div class="prov-label">URL & Auth Token Turso</div>
          <div class="prov-desc">Diisi saat instalasi rilis mandiri (diamankan di Vault AES-256-GCM)</div>
        </div>
        <div class="prov-item">
          <div class="prov-label">Kode Operator</div>
          <div class="prov-desc">Otomatis terkunci <code>SPD001</code> (Hak akses Superadmin Master)</div>
        </div>
        <div class="prov-item">
          <div class="prov-label">Nama & Username</div>
          <div class="prov-desc">Nama pimpinan / instansi & username unik (alfanumerik min 3 karakter)</div>
        </div>
        <div class="prov-item">
          <div class="prov-label">Password Kuat (Min 12 Karakter)</div>
          <div class="prov-desc">Wajib kombinasi huruf besar, huruf kecil, angka, simbol & anti-username</div>
        </div>
      </div>
      <div class="prov-footer">
        <span class="prov-lock-icon">🔒</span>
        <span>Setelah tersimpan, formulir ini <strong>ditutup permanen</strong> secara atomik dalam database cloud.</span>
      </div>
    </div>
  `;
}

function renderScannerMatrix(raw) {
  return `
    <div class="matrix-card">
      <div class="matrix-header">
        <span class="matrix-badge">MATRIKS PEMINDAI</span>
        <strong>Perbandingan Kemampuan Scanner QR Code Berdasarkan Platform</strong>
      </div>
      <div class="matrix-grid">
        <div class="matrix-col">
          <div class="matrix-col-header web-col">🌐 VERSI WEB PORTAL</div>
          <ul class="matrix-list">
            <li>Kamera Webcam Browser / Laptop</li>
            <li>Validasi Koordinat GPS HTML5</li>
            <li>Kolom Input NIK / ID Manual</li>
            <li>Monitoring Dashboard Real-Time</li>
          </ul>
        </div>
        <div class="matrix-col">
          <div class="matrix-col-header desktop-col">🖥️ VERSI DESKTOP (PC)</div>
          <ul class="matrix-list">
            <li>Hardware USB Barcode/QR Laser</li>
            <li>Webcam PC & Laptop Terintegrasi</li>
            <li>Mode Full Offline (Local SQLite)</li>
            <li>Outbox Auto-Sync saat Internet Pulih</li>
          </ul>
        </div>
        <div class="matrix-col">
          <div class="matrix-col-header mobile-col">📱 VERSI MOBILE APK</div>
          <ul class="matrix-list">
            <li>Kamera Belakang ZXing Auto-Focus</li>
            <li>Tombol Senter (Flashlight / Torch)</li>
            <li>Haptic Feedback & Voice Synthesizer</li>
            <li>Background GPS Geofencing Presisi</li>
          </ul>
        </div>
      </div>
    </div>
  `;
}

function renderIdStudioBox(raw) {
  return `
    <div class="studio-card">
      <div class="studio-header">
        <span class="studio-badge">STUDIO DESAIN</span>
        <strong>Spesifikasi & Kapabilitas Dynamic ID Card Studio</strong>
      </div>
      <div class="studio-grid">
        <div class="studio-spec-item">
          <div class="spec-label">Standar Dimensi</div>
          <div class="spec-value">CR80 (85.6 × 53.98 mm / 1011 × 638 px HD)</div>
        </div>
        <div class="studio-spec-item">
          <div class="spec-label">Dukungan Layout</div>
          <div class="spec-value">Sisi Depan (Front) & Sisi Belakang (Back)</div>
        </div>
        <div class="studio-spec-item">
          <div class="spec-label">Editor Visual</div>
          <div class="spec-value">WYSIWYG Live Preview + Kontrol Presisi</div>
        </div>
        <div class="studio-spec-item">
          <div class="spec-label">Elemen Dinamis</div>
          <div class="spec-value">Logo, NIK, QR, TTD Direktur, Stempel, Syarat</div>
        </div>
        <div class="studio-spec-item">
          <div class="spec-label">Opsi Export</div>
          <div class="spec-value">PNG 300 DPI, Cetak Langsung, Grid A4 Massal</div>
        </div>
      </div>
    </div>
  `;
}

function renderSopBox(raw) {
  return `
    <div class="sop-card">
      <div class="sop-header">
        <span class="sop-badge">STANDAR OPERASIONAL PROSEDUR</span>
        <strong>SOP Pemindaian QR Code Presensi Karyawan</strong>
      </div>
      <div class="sop-grid">
        <div class="sop-item">
          <div class="sop-icon">🔒</div>
          <div class="sop-info">
            <strong>Format QR Code Terenkripsi</strong>
            <div><code>ID_UNIK|TOKEN_SECURITY</code> (Anti-Manipulasi & Anti-Duplikasi)</div>
          </div>
        </div>
        <div class="sop-item">
          <div class="sop-icon">📏</div>
          <div class="sop-info">
            <strong>Jarak Pemindaian Optimal</strong>
            <div>15 cm s/d 30 cm dari lensa kamera pemindai</div>
          </div>
        </div>
        <div class="sop-item">
          <div class="sop-icon">📐</div>
          <div class="sop-info">
            <strong>Sudut Bidik Pemindaian</strong>
            <div>Tegak lurus 90° sejajar dengan permukaan kartu ID Card</div>
          </div>
        </div>
        <div class="sop-item">
          <div class="sop-icon">💡</div>
          <div class="sop-info">
            <strong>Kebutuhan Pencahayaan</strong>
            <div>Minimal 150 Lux (Gunakan fitur senter/torch jika ruangan gelap)</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

marked.use({ renderer, gfm: true, breaks: false });

// Parse Markdown to HTML
let bodyContent = marked.parse(mdContent);

// Enhance Table of Contents with modern card styling
bodyContent = bodyContent.replace(
  /<div class="toc-header">[\s\S]*?<ol>([\s\S]*?)<\/ol>/,
  (match, listItems) => {
    // Convert list items to toc cards
    const cardItems = listItems.replace(/<li><a href="([^"]+)">BAB (\d+): (.*?)<\/a><\/li>/g, (m, href, num, title) => {
      return `
        <a href="${href}" class="toc-item">
          <span class="toc-num">BAB ${num}</span>
          <span class="toc-text">${title}</span>
          <span class="toc-arrow">➔</span>
        </a>
      `;
    });

    return `
      <div class="toc-container">
        <div class="toc-header">
          <h2 class="toc-title">DAFTAR ISI</h2>
        </div>
        <div class="toc-grid">
          ${cardItems}
        </div>
      </div>
    `;
  }
);

const fullHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Buku Panduan Lengkap Aplikasi Absensi SPPG</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;0,800;1,400;1,600&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    @page {
      size: A4 portrait;
      margin: 18mm 16mm 18mm 16mm;
      @bottom-right {
        content: counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
      @bottom-left {
        content: "Absensi SPPG · Manual Operasional Sistem";
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #94a3b8;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 10pt;
      line-height: 1.6;
      color: #334155;
      background-color: #ffffff;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Cover Page */
    .cover-page {
      page-break-after: always;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 250mm;
      padding: 10mm 5mm 5mm 5mm;
      position: relative;
    }

    .cover-top-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 5mm;
    }

    .cover-brand {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .cover-logo-badge {
      width: 44px;
      height: 44px;
      background: linear-gradient(135deg, #0f172a 0%, #1e40af 100%);
      color: #ffffff;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
      font-weight: 800;
      box-shadow: 0 4px 10px rgba(30, 58, 138, 0.25);
    }

    .cover-brand-title {
      font-size: 13pt;
      font-weight: 800;
      letter-spacing: 0.5px;
      color: #0f172a;
      line-height: 1.2;
    }

    .cover-brand-tag {
      font-size: 8pt;
      font-weight: 600;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-doc-badge {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      padding: 4px 12px;
      border-radius: 20px;
      font-size: 8pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .cover-hero {
      margin-top: 25mm;
      margin-bottom: 25mm;
    }

    .cover-tagline {
      display: inline-block;
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      padding: 4px 14px;
      border-radius: 6px;
      font-size: 8.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6mm;
    }

    .cover-main-title {
      font-size: 26pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      letter-spacing: -0.5px;
      margin-bottom: 4mm;
    }

    .cover-main-title span {
      background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: #1e40af;
    }

    .cover-subtitle {
      font-size: 12pt;
      font-weight: 500;
      color: #475569;
      line-height: 1.5;
      margin-bottom: 10mm;
    }

    .cover-ecosystem-pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .eco-pill {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 8.5pt;
      font-weight: 600;
      color: #1e293b;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .cover-metadata-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 4px solid #1e40af;
      border-radius: 10px;
      padding: 6mm 8mm;
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }

    .meta-item {
      display: flex;
      flex-direction: column;
    }

    .meta-label {
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #64748b;
    }

    .meta-val {
      font-size: 9.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 2px;
    }

    .cover-bottom {
      border-top: 1px solid #e2e8f0;
      padding-top: 4mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 8pt;
      color: #64748b;
    }

    /* Chapters & Headings */
    .chapter-break {
      page-break-before: always;
      height: 0;
    }

    .chapter-header {
      margin-top: 5mm;
      margin-bottom: 6mm;
      padding-bottom: 4mm;
      border-bottom: 2px solid #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 4px;
      page-break-after: avoid;
    }

    .chapter-badge {
      display: inline-block;
      align-self: flex-start;
      background: #0f172a;
      color: #ffffff;
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 3px 10px;
      border-radius: 4px;
      text-transform: uppercase;
    }

    .chapter-title {
      font-size: 16pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.25;
      letter-spacing: -0.3px;
    }

    .section-title {
      font-size: 13pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 7mm;
      margin-bottom: 3mm;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 2mm;
      page-break-after: avoid;
    }

    .subsection-title {
      font-size: 11pt;
      font-weight: 700;
      color: #1e293b;
      margin-top: 5mm;
      margin-bottom: 2.5mm;
      page-break-after: avoid;
    }

    .minor-title {
      font-size: 10pt;
      font-weight: 700;
      color: #334155;
      margin-top: 4mm;
      margin-bottom: 2mm;
      page-break-after: avoid;
    }

    .doc-para {
      margin-bottom: 3mm;
      text-align: justify;
    }

    hr, .divider {
      border: 0;
      height: 1px;
      background: #e2e8f0;
      margin: 6mm 0;
    }

    /* Table of Contents */
    .toc-container {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 6mm 8mm;
      margin-top: 4mm;
      margin-bottom: 8mm;
      page-break-after: always;
    }

    .toc-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 4mm;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 2mm;
      letter-spacing: 0.5px;
    }

    .toc-grid {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }

    .toc-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e2e8f0;
      padding: 8px 14px;
      border-radius: 8px;
      text-decoration: none;
      color: #0f172a;
      font-weight: 600;
      font-size: 9.5pt;
    }

    .toc-num {
      background: #e2e8f0;
      color: #0f172a;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 8pt;
      font-weight: 700;
      margin-right: 10px;
    }

    .toc-text {
      flex: 1;
    }

    .toc-arrow {
      color: #94a3b8;
      font-size: 9pt;
    }

    /* Lists */
    ol, ul {
      margin-left: 6mm;
      margin-bottom: 4mm;
    }

    li {
      margin-bottom: 1.8mm;
      padding-left: 1mm;
    }

    /* Code Blocks */
    .code-block-wrapper {
      background: #0f172a;
      border-radius: 8px;
      margin: 3mm 0 4mm 0;
      overflow: hidden;
      border: 1px solid #1e293b;
      page-break-inside: avoid;
    }

    .code-lang-tag {
      background: #1e293b;
      color: #94a3b8;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.5px;
      padding: 3px 10px;
      font-family: 'JetBrains Mono', monospace;
      border-bottom: 1px solid #334155;
    }

    pre {
      padding: 8px 12px;
      margin: 0;
      overflow-x: auto;
    }

    code {
      font-family: 'JetBrains Mono', Consolas, Monaco, monospace;
      font-size: 8.5pt;
      color: #f1f5f9;
      line-height: 1.45;
    }

    p code, li code, td code {
      background: #f1f5f9;
      color: #0f172a;
      border: 1px solid #e2e8f0;
      padding: 1px 5px;
      border-radius: 4px;
      font-size: 8.5pt;
      font-weight: 600;
    }

    /* Tables */
    .table-container {
      margin: 4mm 0 5mm 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #cbd5e1;
      page-break-inside: avoid;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 8.5pt;
      text-align: left;
    }

    thead th {
      background: #0f172a;
      color: #ffffff;
      font-weight: 700;
      padding: 8px 10px;
      border: 1px solid #1e293b;
      font-size: 8.5pt;
    }

    tbody td {
      padding: 7px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: middle;
    }

    tbody tr:nth-child(even) {
      background: #f8fafc;
    }

    /* Status Badges */
    .badge {
      display: inline-block;
      padding: 2px 7px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .badge-success { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
    .badge-warning { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }
    .badge-orange  { background: #ffedd5; color: #9a3412; border: 1px solid #fed7aa; }
    .badge-danger  { background: #fee2e2; color: #991b1b; border: 1px solid #fecaca; }
    .badge-info    { background: #e0f2fe; color: #075985; border: 1px solid #bae6fd; }
    .badge-blue    { background: #dbeafe; color: #1e40af; border: 1px solid #bfdbfe; }
    .badge-purple  { background: #f3e8ff; color: #6b21a8; border: 1px solid #e9d5ff; }

    /* Visual Components */
    .pipeline-wrapper {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 5mm 6mm;
      margin: 4mm 0 5mm 0;
      page-break-inside: avoid;
    }

    .pipeline-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 4mm;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 3mm;
    }

    .pipeline-badge {
      background: #2563eb;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
      letter-spacing: 0.5px;
    }

    .pipeline-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .step-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 8px 10px;
      display: flex;
      align-items: flex-start;
      gap: 10px;
    }

    .step-number {
      width: 26px;
      height: 26px;
      background: #0f172a;
      color: #ffffff;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 9pt;
      flex-shrink: 0;
    }

    .step-title {
      font-weight: 700;
      font-size: 8.5pt;
      color: #0f172a;
    }

    .step-desc {
      font-size: 7.5pt;
      color: #64748b;
      margin-top: 1px;
    }

    /* Architecture Box */
    .diagram-box {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 5mm 6mm;
      margin: 4mm 0 5mm 0;
      page-break-inside: avoid;
    }

    .diagram-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 4mm;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2.5mm;
    }

    .diagram-pill {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
    }

    .diagram-sub {
      font-size: 7.5pt;
      font-weight: 600;
      color: #64748b;
    }

    .arch-container {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .cloud-node {
      background: #ffffff;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 8px 12px;
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .node-icon {
      font-size: 18pt;
    }

    .node-title {
      font-size: 9.5pt;
      font-weight: 800;
      color: #0f172a;
    }

    .node-sub {
      font-size: 7.5pt;
      color: #475569;
      margin-top: 2px;
    }

    .arch-sync-line {
      text-align: center;
      padding: 2px 0;
    }

    .sync-badge {
      display: inline-block;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      font-size: 7.5pt;
      font-weight: 700;
      padding: 2px 12px;
      border-radius: 20px;
    }

    .arch-clients-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 10px;
    }

    .client-node {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 8px 10px;
    }

    .node-header {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 6px;
      border-bottom: 1px solid #f1f5f9;
      padding-bottom: 4px;
    }

    .node-features {
      list-style: none;
      font-size: 7.5pt;
      color: #475569;
      line-height: 1.5;
      margin-left: 0;
    }

    .node-features li::before {
      content: "• ";
      color: #2563eb;
      font-weight: bold;
    }

    /* Setup Flow Card */
    .setup-flow-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 5mm 6mm;
      margin: 4mm 0 5mm 0;
      page-break-inside: avoid;
    }

    .setup-flow-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3.5mm;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2.5mm;
    }

    .setup-flow-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
    }

    .setup-flow-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }

    .setup-flow-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .setup-flow-num {
      width: 20px;
      height: 20px;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1d4ed8;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 7.5pt;
      flex-shrink: 0;
    }

    .setup-flow-text {
      font-size: 8pt;
      font-weight: 600;
      color: #1e293b;
    }

    /* Matrix Scanner Card */
    .matrix-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 5mm 6mm;
      margin: 4mm 0 5mm 0;
      page-break-inside: avoid;
    }

    .matrix-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3.5mm;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2.5mm;
    }

    .matrix-badge {
      background: #0f172a;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
    }

    .matrix-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .matrix-col {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px;
    }

    .matrix-col-header {
      font-size: 8pt;
      font-weight: 800;
      padding: 4px 6px;
      border-radius: 4px;
      margin-bottom: 6px;
      text-align: center;
    }

    .web-col { background: #eff6ff; color: #1e40af; }
    .desktop-col { background: #f1f5f9; color: #0f172a; }
    .mobile-col { background: #f0fdf4; color: #166534; }

    .matrix-list {
      list-style: none;
      font-size: 7.5pt;
      color: #334155;
      line-height: 1.5;
      margin-left: 0;
    }

    .matrix-list li::before {
      content: "✔ ";
      color: #16a34a;
      font-weight: bold;
    }

    /* Studio Card */
    .studio-card {
      background: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 5mm 6mm;
      margin: 4mm 0 5mm 0;
      page-break-inside: avoid;
    }

    .studio-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3.5mm;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 2.5mm;
    }

    .studio-badge {
      background: #7c3aed;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
    }

    .studio-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .studio-spec-item {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 6px 10px;
    }

    .spec-label {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      color: #64748b;
    }

    .spec-value {
      font-size: 8pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 1px;
    }

    /* SOP Card */
    .sop-card {
      background: #fffbeb;
      border: 1px solid #fef3c7;
      border-left: 4px solid #d97706;
      border-radius: 10px;
      padding: 5mm 6mm;
      margin: 4mm 0 5mm 0;
      page-break-inside: avoid;
    }

    .sop-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3.5mm;
      border-bottom: 1px solid #fde68a;
      padding-bottom: 2.5mm;
    }

    .sop-badge {
      background: #d97706;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
    }

    .sop-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .sop-item {
      background: #ffffff;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 6px 10px;
      display: flex;
      align-items: flex-start;
      gap: 8px;
    }

    .sop-icon {
      font-size: 12pt;
    }

    .sop-info strong {
      font-size: 8pt;
      color: #0f172a;
    }

    .sop-info div {
      font-size: 7.5pt;
      color: #475569;
      margin-top: 1px;
    }

    /* Provisioning Card */
    .provisioning-card {
      background: #f0f9ff;
      border: 1px solid #bae6fd;
      border-left: 4px solid #0284c7;
      border-radius: 10px;
      padding: 5mm 6mm;
      margin: 4mm 0 5mm 0;
      page-break-inside: avoid;
    }

    .provisioning-header {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 3.5mm;
      border-bottom: 1px solid #bae6fd;
      padding-bottom: 2.5mm;
    }

    .provisioning-badge {
      background: #0284c7;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 7.5pt;
      font-weight: 800;
    }

    .provisioning-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }

    .prov-item {
      background: #ffffff;
      border: 1px solid #bae6fd;
      border-radius: 6px;
      padding: 6px 10px;
    }

    .prov-label {
      font-size: 7.5pt;
      font-weight: 800;
      color: #0369a1;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .prov-desc {
      font-size: 7.5pt;
      color: #334155;
      margin-top: 2px;
    }

    .prov-footer {
      margin-top: 3.5mm;
      padding-top: 2.5mm;
      border-top: 1px dashed #bae6fd;
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 7.5pt;
      color: #0369a1;
    }

    .prov-lock-icon {
      font-size: 10pt;
    }

    /* Math Block */
    .math-block {
      background: #f1f5f9;
      border: 1px solid #cbd5e1;
      border-left: 4px solid #2563eb;
      border-radius: 8px;
      padding: 10px 16px;
      margin: 3mm 0 4mm 0;
      text-align: center;
      page-break-inside: avoid;
    }

    .math-formula {
      font-family: 'JetBrains Mono', monospace;
      font-size: 10pt;
      font-weight: 700;
      color: #0f172a;
    }

    /* FAQ */
    .faq-question {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-left: 3px solid #2563eb;
      border-radius: 6px 6px 0 0;
      padding: 6px 10px;
      margin-top: 4mm;
      font-size: 9pt;
      color: #0f172a;
      page-break-inside: avoid;
      page-break-after: avoid;
    }

    .faq-q-badge {
      background: #2563eb;
      color: #ffffff;
      font-size: 7pt;
      font-weight: 800;
      padding: 1px 6px;
      border-radius: 3px;
      margin-right: 6px;
    }

    .faq-answer {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-top: 0;
      border-radius: 0 0 6px 6px;
      padding: 8px 12px;
      margin-bottom: 4mm;
      font-size: 8.5pt;
      color: #334155;
      page-break-inside: avoid;
    }

    .doc-footer-notice {
      margin-top: 8mm;
      padding-top: 4mm;
      border-top: 1px solid #e2e8f0;
      font-size: 8pt;
      color: #64748b;
      text-align: center;
      font-style: italic;
    }
  </style>
</head>
<body>

  <!-- Cover Page -->
  <div class="cover-page">
    <div class="cover-top-bar">
      <div class="cover-brand">
        <div class="cover-logo-badge">SP</div>
        <div>
          <div class="cover-brand-title">ABSENSI SPPG</div>
          <div class="cover-brand-tag">Enterprise Attendance Suite</div>
        </div>
      </div>
      <div class="cover-doc-badge">DOKUMEN RESMI</div>
    </div>

    <div class="cover-hero">
      <div class="cover-tagline">Panduan Pengembang & Manual Operasional</div>
      <h1 class="cover-main-title">Buku Panduan Lengkap<br><span>Aplikasi Absensi SPPG</span></h1>
      <p class="cover-subtitle">Manual Konfigurasi Cloud Server, Desktop Client, dan Mobile Android APK dengan Arsitektur Local-First, Offline Vault Security, & Dynamic ID Card Studio.</p>

      <div class="cover-ecosystem-pills">
        <div class="eco-pill">🌐 Web Admin Cloud (Next.js 16)</div>
        <div class="eco-pill">🖥️ Desktop Client (Tauri v2)</div>
        <div class="eco-pill">📱 Mobile Android APK (Tauri v2)</div>
        <div class="eco-pill">⚡ LibSQL & Rusqlite WAL</div>
      </div>
    </div>

    <div class="cover-metadata-card">
      <div class="meta-item">
        <span class="meta-label">Versi Dokumen & Sistem</span>
        <span class="meta-val">v0.1.0 Production Ready (2026)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Target Pengguna</span>
        <span class="meta-val">Developer, Superadmin, Operator</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Standar Arsitektur</span>
        <span class="meta-val">Local-First (Zero Data Loss)</span>
      </div>
      <div class="meta-item">
        <span class="meta-label">Tingkat Keamanan Vault</span>
        <span class="meta-val">AES-256-GCM + Argon2id</span>
      </div>
    </div>

    <div class="cover-bottom">
      <div>PT Makmur Sentosa Abadi · SPPG Attendance Ecosystem</div>
      <div>Klasifikasi: Terbatas (Internal Operasional)</div>
    </div>
  </div>

  <!-- Main Content -->
  ${bodyContent}

</body>
</html>
`;

fs.writeFileSync(htmlPath, fullHTML, 'utf8');
console.log('Generated HTML at:', htmlPath);

// Execute Chrome to render PDF
const chromeExe = "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";
const chromeCmd = `"${chromeExe}" --headless=new --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfPath}" "file:///${htmlPath.replace(/\\/g, '/')}"`;

console.log('Executing Chrome PDF generation...');
try {
  execSync(chromeCmd, { stdio: 'inherit' });
  console.log('SUCCESS: PDF Generated at:', pdfPath);
} catch (err) {
  console.error('Error generating PDF:', err);
}
