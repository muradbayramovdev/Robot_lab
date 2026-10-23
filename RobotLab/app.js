// ============================================================
//  app.js  –  Robot Lab  |  Vanilla JS + Tailwind CSS
//
//  Responsibilities:
//    INDEX PAGE  (index.html)
//      - Render the featured hero card  (#featured-slot)
//      - Render the portfolio card grid (#project-grid)
//
//    DETAIL PAGE (project.html)
//      - Read ?id= from the URL
//      - Render the split-layout detail view (#detail-root)
// ============================================================


// ─── Utility: safely escape text for insertion into HTML ────
// Prevents names/descriptions with < > & from breaking the layout.
function esc(str) {
  const div = document.createElement('div');
  div.textContent = String(str);
  return div.innerHTML;
}

// ─── Utility: normalize a single project entry ──────────────
// Supports both the new data.js schema (title/image/specs/category)
// and any legacy keys, filling missing fields with safe defaults.
function normalizeProject(p) {
  if (!p || typeof p !== 'object') return null;

  // id: accept string OR number — store as the original value so
  // URL matching (parseInt vs string compare) works either way.
  const rawId = p.id;
  const id = (rawId !== undefined && rawId !== null) ? rawId : 0;

  // name: new schema uses 'title', old schema used 'name'
  const name = (typeof p.title === 'string' && p.title.trim())
    ? p.title.trim()
    : (typeof p.name === 'string' && p.name.trim())
      ? p.name.trim()
      : 'Unnamed Project';

  // coverImage: new schema uses 'image', old used 'coverImage'
  const coverImage = (typeof p.image === 'string' && p.image.trim())
    ? p.image.trim()
    : (typeof p.coverImage === 'string' ? p.coverImage : '');

  // specs block (new schema) or flat fields (old schema)
  const specs = (p.specs && typeof p.specs === 'object') ? p.specs : {};

  const processor = (typeof specs.processor === 'string' && specs.processor.trim())
    ? specs.processor.trim()
    : (typeof p.processor === 'string' && p.processor.trim())
      ? p.processor.trim()
      : 'Unknown';

  const dimensions = (typeof specs.motors === 'string' && specs.motors.trim())
    ? specs.motors.trim()
    : (typeof p.dimensions === 'string' && p.dimensions.trim())
      ? p.dimensions.trim()
      : '—';

  // tags: array (old) or category string (new)
  let tags;
  if (Array.isArray(p.tags) && p.tags.length > 0) {
    tags = p.tags.filter(t => typeof t === 'string' && t.trim());
  } else if (typeof p.category === 'string' && p.category.trim()) {
    tags = [p.category.trim()];
  } else {
    tags = ['General'];
  }

  // description: shortDesc for card grid, description for detail
  const description = (typeof p.description === 'string' && p.description.trim())
    ? p.description.trim()
    : 'No description available.';

  const shortDesc = (typeof p.shortDesc === 'string' && p.shortDesc.trim())
    ? p.shortDesc.trim()
    : description;

  // features list (new schema only)
  const features = Array.isArray(p.features)
    ? p.features.filter(f => typeof f === 'string' && f.trim())
    : [];

  return {
    id,
    name,
    coverImage,
    processor,
    dimensions,
    description,
    shortDesc,
    features,
    tags,
    codeSnippet:  typeof p.codeSnippet === 'string' ? p.codeSnippet : '// No code snippet provided.',
    codeLanguage: typeof p.codeLanguage === 'string' && p.codeLanguage.trim() ? p.codeLanguage.trim() : 'Code',
    // optional spec extras
    power: specs.power || p.power || null,
    dof:   p.dof || null,
    // extra spec fields from new schema for the detail page
    sensors: typeof specs.sensors === 'string' ? specs.sensors : null,
  };
}

// ─── Utility: cover image or robot-emoji placeholder ────────
// Returns an <img> tag when a real src is provided, or a styled
// placeholder div when src is empty.
// A data-img-fallback attribute is picked up by the delegated
// 'error' listener at boot — if the image 404s at runtime the
// listener swaps it for the emoji placeholder automatically.
function coverImg(src, alt, extraClasses) {
  // Only show the placeholder when there is genuinely no source path
  if (!src || !src.trim()) {
    return `<div class="flex items-center justify-center text-5xl text-white/60 bg-[#0d1b2a] ${extraClasses}" aria-label="${esc(alt)} — image coming soon" role="img">🤖</div>`;
  }
  return `<img src="${esc(src)}" alt="${esc(alt)}"
    class="object-cover ${extraClasses}" loading="lazy"
    data-img-fallback data-img-classes="${esc(extraClasses)}" />`;
}

// ─── Utility: render tag chips ──────────────────────────────
// The 'tags' property is normalized by normalizeProject() so it
// is always a non-empty array of strings before this runs.
function renderTags(project) {
  return project.tags.map(tag =>
    `<span class="rl-tag">${esc(String(tag))}</span>`
  ).join('');
}


// ════════════════════════════════════════════════════════════
//  INDEX PAGE
// ════════════════════════════════════════════════════════════

// ── Featured hero card ──────────────────────────────────────
// Shows the FIRST project in the array as the big featured card.
function renderFeatured() {
  const slot = document.getElementById('featured-slot');
  if (!slot || !projects || projects.length === 0) return;

  const p = projects[0]; // first project = featured

  // Wire up the "View featured build" button in the hero
  const heroBtn = document.getElementById('view-featured-btn');
  if (heroBtn) {
    heroBtn.addEventListener('click', () => {
      slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  slot.innerHTML = `
    <!-- Clickable featured card – links to project.html?id=X -->
    <a href="project.html?id=${p.id}"
       class="block relative rounded-xl overflow-hidden border border-slate-800
              bg-[#0d1b2a] hover:border-[#00e5ff] hover:shadow-[0_0_30px_rgba(0,229,255,0.4)]
              transition-all duration-300 group"
       aria-label="View featured project: ${esc(p.name)}">

      <!-- Project image fills the card — laser overlay sits on top -->
      ${coverImg(p.coverImage, p.name, 'w-full h-[420px] sm:h-[500px] group-hover:scale-[1.02] transition-transform duration-500')}
      <!-- Laser scan line for featured card -->
      <div class="laser-scan laser-scan--tall" aria-hidden="true"></div>

      <!-- Overlay gradient so text is readable over the image -->
      <div class="absolute inset-0 bg-gradient-to-t from-lab-black/90 via-lab-black/30 to-transparent"></div>

      <!-- Arrow icon top-right -->
      <span class="absolute top-4 right-4 w-8 h-8 rounded border border-[#00e5ff]/40 bg-[#0f172a]/60
                   flex items-center justify-center opacity-0 group-hover:opacity-100
                   transition-opacity duration-300" aria-hidden="true">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 11L11 3M11 3H5M11 3v6" stroke="#00e5ff" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
      </span>

      <!-- Bottom-left text -->
      <div class="absolute bottom-0 left-0 p-6">
        <p class="text-[#00e5ff] text-xs font-semibold uppercase tracking-widest mb-1">Featured Project</p>
        <h2 class="text-2xl font-bold text-white">${esc(p.name)}</h2>
      </div>

      <!-- Bottom-right tags -->
      <div class="absolute bottom-6 right-6 flex flex-wrap gap-2 justify-end">
        ${renderTags(p)}
      </div>
    </a>
  `;
}

// ── Portfolio grid cards ─────────────────────────────────────
function renderGrid() {
  const grid = document.getElementById('project-grid');
  if (!grid) return;

  // Remove the loading spinner
  const loader = document.getElementById('grid-loader');
  if (loader) loader.remove();

  if (!projects || projects.length === 0) {
    grid.innerHTML = '<p class="col-span-full text-white/60 text-center py-12">No projects yet. Add some to data.js!</p>';
    return;
  }

  // Render every project as a card
  // All cards are identical at rest — cyan glow only fires on hover.
  grid.innerHTML = projects.map((p) => {

    return `
      <a href="project.html?id=${p.id}"
         class="flex flex-col rounded-xl overflow-hidden border border-slate-800
                bg-[#0d1b2a] transition-all duration-300 group cursor-pointer
                hover:border-[#00e5ff] hover:shadow-[0_0_22px_rgba(0,229,255,0.55)]
                hover:-translate-y-1"
         aria-label="View ${esc(p.name)}">

        <!-- Card image — wrapped so the laser overlay can be positioned inside -->
        <div class="relative overflow-hidden w-full h-44 flex-shrink-0">
          ${coverImg(p.coverImage, p.name, 'w-full h-44 object-cover group-hover:scale-105 transition-transform duration-500')}
          <!-- Laser scan line — slides top→bottom on hover via CSS animation -->
          <div class="laser-scan" aria-hidden="true"></div>
        </div>

        <!-- Card body -->
        <div class="p-4 flex flex-col gap-2 flex-1">

          <h3 class="font-bold text-base text-white group-hover:text-[#00e5ff] transition-colors duration-300">
            ${esc(p.name)}
          </h3>

          <!-- Short description, clamped to 2 lines -->
          <p class="text-white/60 text-xs leading-relaxed rl-clamp-2 flex-1">
            ${esc(p.shortDesc)}
          </p>

          <!-- Tags -->
          <div class="flex flex-wrap gap-1.5 mt-2">
            ${renderTags(p)}
          </div>
        </div>
      </a>
    `;
  }).join('');
}


// ════════════════════════════════════════════════════════════
//  DETAIL PAGE
// ════════════════════════════════════════════════════════════

function renderDetail() {
  const root = document.getElementById('detail-root');
  if (!root) return;

  // Read the ?id= query param from the URL
  const params    = new URLSearchParams(window.location.search);
  const rawId     = params.get('id');
  // Match against both string and number ids so either schema works
  const project   = projects.find(p => String(p.id) === String(rawId));

  // ── Not found ──
  if (!project) {
    root.innerHTML = `
      <div class="text-center py-28" role="alert">
        <p class="text-red-400 text-5xl mb-4">⚠️</p>
        <h2 class="text-2xl font-bold text-red-400 mb-2">Project not found</h2>
        <p class="text-white/60 mb-8">No project with id "${esc(params.get('id') || '?')}" exists.</p>
        <a href="index.html"
           class="inline-flex items-center gap-2 px-5 py-2.5 rounded border border-[#00e5ff]
                  text-[#00e5ff] text-sm font-semibold hover:bg-[#00e5ff] hover:text-slate-900
                  transition-all duration-200">
          ← Back to all projects
        </a>
      </div>`;
    return;
  }

  // ── Update browser tab title & meta description ──
  document.title = `${project.name} – Robot Lab`;
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) metaDesc.setAttribute('content', (project.description || '').slice(0, 155));
  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) ogTitle.setAttribute('content', `${project.name} – Robot Lab`);
  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', (project.description || '').slice(0, 155));

  // ── Build spec rows from available fields ──
  // Each row: { icon SVG, label, value }
  const specRows = [
    {
      icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
               <rect x="3" y="3" width="10" height="10" rx="1" stroke="#00e5ff" stroke-width="1.2"/>
               <circle cx="8" cy="8" r="2" fill="#00e5ff"/>
             </svg>`,
      label: 'Processor',
      value: project.processor,
    },
    {
      icon: `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
               <rect x="2" y="5" width="12" height="7" rx="1" stroke="#00e5ff" stroke-width="1.2"/>
               <path d="M5 5V4a3 3 0 016 0v1" stroke="#00e5ff" stroke-width="1.2"/>
             </svg>`,
      label: 'Motors / Dimensions',
      value: project.dimensions,
    },
  ];

  // Add any extra spec fields if the project data has them
  if (project.sensors) specRows.push({ icon: '📡', label: 'Sensors',           value: project.sensors });
  if (project.power)   specRows.push({ icon: '⚡', label: 'Power',             value: project.power });
  if (project.dof)     specRows.push({ icon: '🔗', label: 'Degrees of Freedom', value: project.dof });

  const specRowsHtml = specRows.map(row => `
    <div class="flex items-center justify-between gap-4 px-4 py-3
                border border-[#1e3a4a] rounded-lg bg-[#0f172a]/40
                hover:border-[#00e5ff] hover:shadow-[0_0_12px_rgba(0,229,255,0.3)]
                transition-all duration-300">
      <div class="flex items-center gap-2 text-white/60 text-sm">
        ${typeof row.icon === 'string' && row.icon.startsWith('<')
          ? row.icon
          : `<span aria-hidden="true">${row.icon}</span>`}
        ${esc(row.label)}
      </div>
      <span class="text-white text-sm font-semibold text-right">${esc(row.value)}</span>
    </div>
  `).join('');

  // ── Determine the language label for the code block header ──
  const lang = project.codeLanguage || 'Arduino / C++';

  // ── Inject the full detail layout ──
  root.innerHTML = `
    <!-- Back button -->
    <div class="mb-8">
      <a href="index.html"
         class="inline-flex items-center gap-2 text-white/60 text-sm transition-all duration-300
                hover:text-[#00e5ff] hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <path d="M10 3L5 8l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
        </svg>
        Back to all projects
      </a>
    </div>

    <!-- Detail panel – dark navy card mimicking the screenshot modal -->
    <div class="rounded-2xl border border-[#1e3a4a] bg-[#0d1b2a] overflow-hidden">

      <!-- Panel header bar -->
      <div class="flex items-center justify-between px-6 py-4 border-b border-[#1e3a4a]">
        <div class="flex items-center gap-3">
          <!-- Circuit icon -->
          <span class="w-9 h-9 rounded-md border border-[#00e5ff]/40 bg-[#0f172a] flex items-center justify-center flex-shrink-0">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
              <rect x="4" y="4" width="8" height="8" rx="1" stroke="#00e5ff" stroke-width="1.2"/>
              <line x1="8" y1="1" x2="8" y2="4"  stroke="#00e5ff" stroke-width="1.2"/>
              <line x1="8" y1="12" x2="8" y2="15" stroke="#00e5ff" stroke-width="1.2"/>
              <line x1="1" y1="8" x2="4" y2="8"  stroke="#00e5ff" stroke-width="1.2"/>
              <line x1="12" y1="8" x2="15" y2="8" stroke="#00e5ff" stroke-width="1.2"/>
              <circle cx="8" cy="8" r="1.5" fill="#00e5ff"/>
            </svg>
          </span>
          <div>
            <p class="text-[#00e5ff] text-xs font-semibold uppercase tracking-widest leading-none mb-0.5">
              Project Details
            </p>
            <h1 class="text-xl font-bold text-white leading-none">${esc(project.name)}</h1>
          </div>
        </div>
        <!-- Close / back × -->
        <a href="index.html"
           class="text-white/60 hover:text-[#00e5ff] hover:drop-shadow-[0_0_8px_rgba(0,229,255,0.8)]
                  transition-all duration-300 text-xl leading-none px-2"
           aria-label="Close and return to projects">×</a>
      </div>

      <!-- Two-column body -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-0">

        <!-- ── LEFT COLUMN ── -->
        <div class="p-6 border-b lg:border-b-0 lg:border-r border-[#1e3a4a] flex flex-col gap-6">

          <!-- Cover image -->
          <div class="rounded-xl overflow-hidden border border-[#1e3a4a]">
            ${coverImg(project.coverImage, project.name, 'w-full h-64 sm:h-72')}
          </div>

          <!-- Description -->
          <div>
            <p class="text-[#00e5ff] text-xs font-semibold uppercase tracking-widest mb-3">Description</p>
            <p class="text-white/90 text-sm leading-relaxed">${esc(project.description)}</p>
          </div>

          <!-- Features list (shown only when the project has them) -->
          ${project.features.length > 0 ? `
          <div>
            <p class="text-[#00e5ff] text-xs font-semibold uppercase tracking-widest mb-3">Xüsusiyyətlər</p>
            <ul class="flex flex-col gap-1.5">
              ${project.features.map(f => `
                <li class="flex items-start gap-2 text-white/80 text-sm">
                  <span class="text-[#00e5ff] mt-0.5 flex-shrink-0" aria-hidden="true">▸</span>
                  ${esc(f)}
                </li>`).join('')}
            </ul>
          </div>` : ''}

          <!-- Tags -->
          <div class="flex flex-wrap gap-2">
            ${renderTags(project)}
          </div>
        </div>

        <!-- ── RIGHT COLUMN ── -->
        <div class="p-6 flex flex-col gap-6">

          <!-- Specifications table -->
          <div>
            <p class="text-[#00e5ff] text-xs font-semibold uppercase tracking-widest mb-3">Specifications</p>
            <div class="flex flex-col gap-2">
              ${specRowsHtml}
            </div>
          </div>

          <!-- Code snippet -->
          <div class="flex-1 flex flex-col">
            <p class="text-[#00e5ff] text-xs font-semibold uppercase tracking-widest mb-3">Code Snippet</p>

            <!-- Code block chrome bar -->
            <div class="rounded-t-lg border border-b-0 border-[#1e3a4a] bg-[#1e293b]
                        px-4 py-2 flex items-center justify-between">
              <span class="flex items-center gap-1.5 text-white/60 text-xs font-mono font-medium">
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 9l3-3-3-3M6 9h4" stroke="#6b8fa8" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                ${esc(lang)}
              </span>
              <!-- Traffic-light dots matching the screenshot -->
              <span class="flex items-center gap-1.5" aria-hidden="true">
                <span class="w-2.5 h-2.5 rounded-full bg-red-400/80"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-yellow-400/80"></span>
                <span class="w-2.5 h-2.5 rounded-full bg-green-400/80"></span>
              </span>
            </div>

            <!-- Scrollable code area -->
            <div class="rounded-b-lg border border-[#1e3a4a] bg-[#0f172a] overflow-auto flex-1
                        border-l-[3px] border-l-lab-cyan">
              <pre class="p-4 text-xs leading-relaxed font-mono text-white min-h-[200px]"><code>${esc(project.codeSnippet)}</code></pre>
            </div>
          </div>

        </div><!-- end right column -->
      </div><!-- end two-column body -->
    </div><!-- end detail panel -->
  `;
}


// ════════════════════════════════════════════════════════════
//  TYPEWRITER  – Hero heading animation (index page only)
// ════════════════════════════════════════════════════════════

/**
 * Types two lines of text into the hero heading one character
 * at a time, mimicking a terminal. A blinking | cursor follows
 * the active position and stays at the end when both lines
 * are done.
 *
 * Targets (set in index.html):
 *   #tw-line1  — "Robot Lab"       (white)
 *   #tw-line2  — "Hardware & Code" (cyan)
 *   #tw-cursor — the blinking |    (cyan, CSS-animated)
 */
function runTypewriter() {
  const line1El  = document.getElementById('tw-line1');
  const line2El  = document.getElementById('tw-line2');
  const cursorEl = document.getElementById('tw-cursor');

  // Nothing to do if we're not on the index page
  if (!line1El || !line2El || !cursorEl) return;

  // The two strings to type (& is the literal HTML entity value)
  const LINE1 = 'Robot Lab';
  const LINE2 = 'Hardware & Code';   // will be HTML-escaped char by char

  // Typing speed in milliseconds per character
  const CHAR_DELAY    = 80;   // normal characters
  const PAUSE_BETWEEN = 420;  // pause after line 1 finishes before line 2 starts

  // ── Phase 1: type line 1 ──────────────────────────────
  // The cursor lives after line1 while it is being typed.
  // We move it to after line2 once line1 is done.

  let i = 0;

  function typeLine1() {
    if (i < LINE1.length) {
      // escapeChar handles any special HTML characters safely
      line1El.textContent += LINE1[i];
      i++;
      setTimeout(typeLine1, CHAR_DELAY);
    } else {
      // Line 1 done — pause, then move cursor to line 2 and start
      setTimeout(startLine2, PAUSE_BETWEEN);
    }
  }

  // ── Phase 2: type line 2 ──────────────────────────────
  function startLine2() {
    // Move the cursor span to sit after line2
    line2El.parentNode.insertBefore(cursorEl, line2El.nextSibling);

    let j = 0;
    function typeLine2() {
      if (j < LINE2.length) {
        line2El.textContent += LINE2[j];
        j++;
        setTimeout(typeLine2, CHAR_DELAY);
      }
      // When j === LINE2.length the function simply stops —
      // the CSS blink animation on #tw-cursor keeps running.
    }
    typeLine2();
  }

  // Kick off with a short initial delay so the page has
  // visually settled before the typing begins.
  setTimeout(typeLine1, 300);
}


// ════════════════════════════════════════════════════════════
//  Bootstrap – run the right function(s) on DOMContentLoaded
// ════════════════════════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {

  // ── Normalize the projects array once at boot ────────────
  // Guards every render function against missing/malformed fields.
  // If the global `projects` variable didn't load (data.js missing),
  // fall back to an empty array so the UI shows its empty state.
  if (typeof projects === 'undefined' || !Array.isArray(projects)) {
    // eslint-disable-next-line no-global-assign
    window.projects = [];
  }
  // Replace each raw entry with a safe, fully-populated object.
  // Filter out any entries that normalizeProject() couldn't salvage.
  window.projects = projects.map(normalizeProject).filter(Boolean);

  // ── Delegated image-error handler ───────────────────────
  // Catches broken <img> tags emitted by coverImg() at runtime.
  // A single listener on document avoids per-image handlers and
  // works correctly even after innerHTML is set by render functions.
  document.addEventListener('error', (e) => {
    const img = e.target;
    if (img.tagName !== 'IMG' || !img.hasAttribute('data-img-fallback')) return;
    const extraClasses = img.getAttribute('data-img-classes') || '';
    const altText      = img.getAttribute('alt') || 'Project image';
    const placeholder  = document.createElement('div');
    placeholder.className = `flex items-center justify-center text-5xl text-white/60 bg-[#0d1b2a] ${extraClasses}`;
    placeholder.setAttribute('role', 'img');
    placeholder.setAttribute('aria-label', `${altText} — image not found`);
    placeholder.textContent = '🤖';
    img.replaceWith(placeholder);
  }, true /* capture phase so it fires before bubbling stops */);

  // Index page has #project-grid; detail page has #detail-root
  if (document.getElementById('project-grid')) {
    runTypewriter();   // ← hero heading animation
    renderFeatured();
    renderGrid();
  }
  if (document.getElementById('detail-root')) {
    renderDetail();
  }
});


// ════════════════════════════════════════════════════════════
//  BOOT LOADER  (index page only)
//
//  Timeline:
//    0.00s  loader visible, progress bar starts
//    0.00s–2.00s  bar fills 0→100% with a slight ease
//    2.00s  bar hits 100%, dots change to "HAZIR"
//    2.30s  fade-out begins (CSS transition 0.8s)
//    3.10s  loader set display:none — page fully interactive
// ════════════════════════════════════════════════════════════
(function bootLoader() {
  const loader = document.getElementById('boot-loader');
  const bar    = document.getElementById('boot-bar');
  const dots   = document.getElementById('boot-dots');

  // Only run on the index page
  if (!loader || !bar) return;

  const FILL_DURATION = 2000;   // ms to fill the progress bar
  const STEPS         = 80;     // number of increments
  const INTERVAL      = FILL_DURATION / STEPS;

  let step = 0;

  // Slightly uneven increments feel more realistic than a perfect linear fill
  function nextWidth(s) {
    // Fast at start, slows near the end (easeOutQuad)
    const t = s / STEPS;
    return Math.min(100, Math.round((1 - (1 - t) * (1 - t)) * 100));
  }

  const timer = setInterval(() => {
    step++;
    bar.style.width = nextWidth(step) + '%';

    // At the halfway point, cycle the blink text
    if (step === Math.floor(STEPS * 0.5)) {
      if (dots) dots.textContent = '▮▮';
    }
    if (step === Math.floor(STEPS * 0.8)) {
      if (dots) dots.textContent = '▮▮▮';
    }

    if (step >= STEPS) {
      clearInterval(timer);
      bar.style.width = '100%';

      // Brief pause at 100% so the user sees completion
      setTimeout(() => {
        if (dots) {
          dots.style.animation = 'none';
          dots.style.opacity   = '1';
          dots.textContent     = 'HAZIR ✓';
          dots.style.color     = '#39ff14';  // green = success
        }
      }, 120);

      // Start fade-out
      setTimeout(() => {
        loader.classList.add('boot-done');

        // After CSS transition finishes, remove from layout entirely
        setTimeout(() => {
          loader.style.display = 'none';
        }, 850);
      }, 480);
    }
  }, INTERVAL);
})();

