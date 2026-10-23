// ============================================================
//  matrix.js  –  Robot Lab  |  Matrix rain background effect
//
//  Renders a very subtle falling-code animation on a <canvas>
//  that sits fixed behind all page content (z-index: 0).
//
//  Design decisions:
//   • Characters are a mix of katakana + digits + symbols —
//     classic Matrix look but robotics-flavoured
//   • Two green shades: bright head char, dim trailing chars
//   • Canvas opacity is controlled by CSS (currently 0.13)
//     so the gradient background still shows through clearly
//   • requestAnimationFrame with a frame-rate cap keeps CPU low
//   • ResizeObserver resets the canvas on window resize;
//     the previous rAF loop is cancelled before re-init so
//     there is never more than one active animation loop
//   • Page Visibility API pauses drawing when the tab is hidden
//   • Respects prefers-reduced-motion — skips the effect entirely
// ============================================================

(function () {
  'use strict';

  // ── Respect prefers-reduced-motion ──────────────────────
  // Users who have requested reduced motion get no animation.
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const canvas = document.getElementById('matrix-canvas');
  if (!canvas) return;                    // safety — not on this page

  const ctx = canvas.getContext('2d');

  // ── Character pool ──────────────────────────────────────
  // Katakana range + digits + a few code symbols
  const CHARS =
    'アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン' +
    '0123456789' +
    '{}[]<>/\\|=+-*&^%$#@!;:.,~';

  const CHAR_LIST = CHARS.split('');

  // ── Visual settings ─────────────────────────────────────
  const FONT_SIZE    = 14;   // px — column width = FONT_SIZE
  const FPS_CAP      = 20;   // max frames per second — keeps CPU low
  const MS_PER_FRAME = 1000 / FPS_CAP;

  // Green palette — dark mode matrix greens
  const COLOR_HEAD   = '#39ff14';   // neon green — the leading character
  const COLOR_TRAIL  = '#00aa33';   // medium green — trailing characters
  const COLOR_FADE   = '#005522';   // deep green — near-faded characters

  // ── State ───────────────────────────────────────────────
  let columns    = 0;    // number of vertical columns
  let drops      = [];   // y-position (in rows) for each column's head
  let lastFrame  = 0;    // timestamp of last rendered frame
  let rafHandle  = null; // current requestAnimationFrame handle
  let resizeTimer;       // debounce timer for resize events

  // ── Setup / resize ──────────────────────────────────────
  // Cancel any running loop before mutating shared state,
  // then rebuild columns/drops for the new canvas dimensions.
  function init() {
    // Stop the current loop so it never reads a stale drops array
    if (rafHandle !== null) {
      cancelAnimationFrame(rafHandle);
      rafHandle = null;
    }

    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;

    columns = Math.floor(canvas.width / FONT_SIZE);

    // Stagger starting positions so columns don't all start at row 0
    drops = Array.from({ length: columns }, () =>
      Math.floor(Math.random() * -(canvas.height / FONT_SIZE))
    );

    // Reset timestamp so the new loop doesn't skip its first frame
    lastFrame = 0;

    // Restart the animation loop
    rafHandle = requestAnimationFrame(draw);
  }

  // ── Draw one frame ──────────────────────────────────────
  function draw(timestamp) {
    // Always re-queue first so a return never orphans the loop
    rafHandle = requestAnimationFrame(draw);

    // Frame-rate cap — skip frames that arrive too soon
    if (timestamp - lastFrame < MS_PER_FRAME) return;
    lastFrame = timestamp;

    // Translucent black overlay — creates the fade-trail effect.
    // Lower alpha = longer, slower-fading trails.
    ctx.fillStyle = 'rgba(0, 0, 0, 0.045)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.font = `${FONT_SIZE}px 'JetBrains Mono', 'Fira Code', monospace`;

    for (let col = 0; col < drops.length; col++) {
      const row = drops[col];
      const y   = row * FONT_SIZE;

      // Only draw if the character is within the visible canvas area
      if (y > 0 && y <= canvas.height + FONT_SIZE) {
        const char = CHAR_LIST[Math.floor(Math.random() * CHAR_LIST.length)];

        // Head character is the brightest
        if (y <= FONT_SIZE * 2) {
          ctx.fillStyle = COLOR_HEAD;
        } else if (y <= canvas.height * 0.4) {
          ctx.fillStyle = COLOR_TRAIL;
        } else {
          ctx.fillStyle = COLOR_FADE;
        }

        ctx.fillText(char, col * FONT_SIZE, y);
      }

      // Advance the drop downward
      drops[col]++;

      // Reset to top (with a random delay chance) when it exits the bottom
      if (drops[col] * FONT_SIZE > canvas.height && Math.random() > 0.975) {
        drops[col] = Math.floor(Math.random() * -20); // start above canvas
      }
    }
  }

  // ── Resize handling ─────────────────────────────────────
  // Debounced so rapid resize events don't spam init().
  // init() itself cancels the running loop before mutating state.
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(init, 150);
  });

  // ── Page Visibility API — pause when tab is hidden ──────
  // Cancels the rAF loop entirely when the user switches tabs
  // or minimises the window; restarts it when they return.
  // This prevents wasted GPU/CPU on invisible pages.
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      if (rafHandle !== null) {
        cancelAnimationFrame(rafHandle);
        rafHandle = null;
      }
    } else {
      // Resume only if we're not already running
      if (rafHandle === null) {
        lastFrame = 0;
        rafHandle = requestAnimationFrame(draw);
      }
    }
  });

  // ── Boot ────────────────────────────────────────────────
  init();

})();
