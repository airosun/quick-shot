/* Quick Shot icon set.
   Every icon is inline SVG, so it looks identical on every phone, browser and TV
   (emoji differ between Apple, Android, Windows and some TVs can't draw them).
   Used by index.html / app.js, answer-monitor.html and question-log.html.

   qsIcon(name, extraClass)   -> '<svg …>' string for any icon below
   qsDie(n)                   -> die face 1–6
   qsPiece(colorHex, shape)   -> a player's game piece with their shape on top
   Any element with data-qs-icon="name" is filled in automatically on load. */
(function () {
  const O = '#13284a'; // shared outline colour: gives every icon the same "sticker" look
  const S = `stroke="${O}" stroke-linejoin="round" stroke-linecap="round"`;
  const txt = (t, size, fill, y = 44) =>
    `<text x="32" y="${y}" text-anchor="middle" font-family="'Arial Black','Arial Rounded MT Bold',Arial,Helvetica,sans-serif" font-weight="900" font-size="${size}" fill="${fill}" stroke="${O}" stroke-width="5" paint-order="stroke" stroke-linejoin="round">${t}</text>`;
  const pips = (n, color = O) => {
    const P = { tl: [19, 19], tr: [45, 19], ml: [19, 32], c: [32, 32], mr: [45, 32], bl: [19, 45], br: [45, 45] };
    const map = { 1: ['c'], 2: ['tr', 'bl'], 3: ['tr', 'c', 'bl'], 4: ['tl', 'tr', 'bl', 'br'], 5: ['tl', 'tr', 'c', 'bl', 'br'], 6: ['tl', 'tr', 'ml', 'mr', 'bl', 'br'] };
    return (map[n] || map[1]).map(k => `<circle cx="${P[k][0]}" cy="${P[k][1]}" r="${n === 1 ? 7 : 5.2}" fill="${n === 1 ? '#e63946' : color}"/>`).join('');
  };
  const checker = (x, y, w, h, cols, rows) => {
    let s = '';
    const cw = w / cols, ch = h / rows;
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if ((r + c) % 2 === 0) s += `<rect x="${(x + c * cw).toFixed(2)}" y="${(y + r * ch).toFixed(2)}" width="${cw.toFixed(2)}" height="${ch.toFixed(2)}" fill="${O}"/>`;
    return s;
  };
  const feet = (dx = 0, dy = 0, sc = 1) => `<g transform="translate(${dx} ${dy}) scale(${sc})">
    <ellipse cx="22" cy="40" rx="7" ry="11" fill="#e2e8f0" ${S} stroke-width="3" transform="rotate(-14 22 40)"/>
    <circle cx="16" cy="25" r="2.6" fill="#e2e8f0" ${S} stroke-width="2"/><circle cx="21.5" cy="23.5" r="2.6" fill="#e2e8f0" ${S} stroke-width="2"/><circle cx="27" cy="24.5" r="2.4" fill="#e2e8f0" ${S} stroke-width="2"/>
    <ellipse cx="43" cy="30" rx="7" ry="11" fill="#e2e8f0" ${S} stroke-width="3" transform="rotate(14 43 30)"/>
    <circle cx="38" cy="14.5" r="2.4" fill="#e2e8f0" ${S} stroke-width="2"/><circle cx="43.5" cy="13.5" r="2.6" fill="#e2e8f0" ${S} stroke-width="2"/><circle cx="49" cy="15" r="2.6" fill="#e2e8f0" ${S} stroke-width="2"/></g>`;
  const medal = (fill, rim, n) => `
    <path d="M18 4h11l7 20H25z" fill="#3b82f6" ${S} stroke-width="3"/><path d="M46 4H35l-7 20h11z" fill="#ef4444" ${S} stroke-width="3"/>
    <circle cx="32" cy="41" r="18" fill="${fill}" ${S} stroke-width="3"/><circle cx="32" cy="41" r="12.5" fill="none" stroke="${rim}" stroke-width="2.5"/>
    ${txt(n, 17, '#fff', 47)}`;

  const ICONS = {
    // ---- board spaces ----
    choose: `<circle cx="30" cy="34" r="24" fill="#fff" ${S} stroke-width="3"/><circle cx="30" cy="34" r="17" fill="#e63946"/><circle cx="30" cy="34" r="10.5" fill="#fff"/><circle cx="30" cy="34" r="5" fill="#e63946"/>
      <path d="M31 33L53 11" stroke="${O}" stroke-width="4.5" stroke-linecap="round"/><path d="M47 9l9-5-2 10-5 2z" fill="#ffd166" ${S} stroke-width="2.5"/>`,
    pig: `<path d="M14 22L11 6l15 9z" fill="#f28ab2" ${S} stroke-width="3"/><path d="M50 22l3-16-15 9z" fill="#f28ab2" ${S} stroke-width="3"/>
      <circle cx="32" cy="35" r="22" fill="#f9b4cf" ${S} stroke-width="3"/><ellipse cx="25" cy="27" rx="6" ry="3" fill="#fff" opacity=".45"/>
      <circle cx="23.5" cy="30" r="3.2" fill="${O}"/><circle cx="40.5" cy="30" r="3.2" fill="${O}"/>
      <ellipse cx="32" cy="42.5" rx="11" ry="7.5" fill="#f28ab2" ${S} stroke-width="2.6"/><ellipse cx="28" cy="42.5" rx="2" ry="3" fill="${O}"/><ellipse cx="36" cy="42.5" rx="2" ry="3" fill="${O}"/>`,
    headstart: `<rect x="26" y="3" width="12" height="7" rx="2" fill="#94a3b8" ${S} stroke-width="2.6"/><path d="M32 10v5" stroke="${O}" stroke-width="4"/>
      <path d="M48 12l5 5" stroke="${O}" stroke-width="5" stroke-linecap="round"/>
      <circle cx="32" cy="37" r="23" fill="#fff" ${S} stroke-width="3"/><circle cx="32" cy="37" r="17.5" fill="#dbeafe"/>
      <path d="M32 37V22" stroke="#e63946" stroke-width="4" stroke-linecap="round"/><path d="M32 37l10 6" stroke="${O}" stroke-width="3.5" stroke-linecap="round"/><circle cx="32" cy="37" r="3" fill="${O}"/>
      <path d="M32 21.5a15.5 15.5 0 0 1 15.5 15.5H32z" fill="#22c55e" opacity=".55"/>`,
    hint: `<path d="M32 5C20.5 5 12.5 13.5 12.5 24c0 7.5 4.2 11.5 7.2 15.5 2.1 2.8 3.3 5 3.3 8.5h18c0-3.5 1.2-5.7 3.3-8.5 3-4 7.2-8 7.2-15.5C51.5 13.5 43.5 5 32 5z" fill="#ffd43b" ${S} stroke-width="3"/>
      <path d="M21 22c.5-5.5 4.5-9.5 10-10" stroke="#fff" stroke-width="3.5" fill="none" stroke-linecap="round" opacity=".85"/>
      <path d="M26 37l6-7 6 7" stroke="#e8890c" stroke-width="2.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="22.5" y="48" width="19" height="6" rx="2.5" fill="#a5b4c8" ${S} stroke-width="2.6"/><rect x="24.5" y="54" width="15" height="6" rx="2.5" fill="#8396ad" ${S} stroke-width="2.6"/>`,
    swap: `<path d="M7 19h31v-9l19 15-19 15v-9H7z" fill="#3b82f6" ${S} stroke-width="3"/><path d="M57 45H26v9L7 39l19-15v9h31z" fill="#f59e0b" ${S} stroke-width="3"/>`,
    solo: `<ellipse cx="32" cy="57" rx="20" ry="4.5" fill="#0003"/>
      <path d="M13 50h38v5a3 3 0 0 1-3 3H16a3 3 0 0 1-3-3z" fill="#6d3fb5" ${S} stroke-width="3"/>
      <path d="M20 50c1-9 5-15 7-22h10c2 7 6 13 7 22z" fill="#8b5cf6" ${S} stroke-width="3"/>
      <rect x="22" y="25" width="20" height="5" rx="2.5" fill="#7c4dd8" ${S} stroke-width="2.6"/><circle cx="32" cy="15" r="10" fill="#a78bfa" ${S} stroke-width="3"/>
      <ellipse cx="28.5" cy="11.5" rx="3.5" ry="2.2" fill="#fff" opacity=".6"/>`,
    locked: `<path d="M20 31v-9a12 12 0 0 1 24 0v9" fill="none" stroke="${O}" stroke-width="10"/><path d="M20 31v-9a12 12 0 0 1 24 0v9" fill="none" stroke="#b6c3d4" stroke-width="5"/>
      <rect x="11" y="28" width="42" height="31" rx="6" fill="#ffb703" ${S} stroke-width="3"/><rect x="15" y="32" width="34" height="5" rx="2.5" fill="#fff" opacity=".4"/>
      <circle cx="32" cy="42" r="5" fill="${O}"/><rect x="30" y="44" width="4" height="9" rx="2" fill="${O}"/>`,
    double: txt('×2', 36, '#fff', 45),
    add2: txt('+2', 38, '#fff', 46),
    add3: txt('+3', 38, '#fff', 46),
    start: `<path d="M6 25h30V12l23 20-23 20V39H6z" fill="#22c55e" ${S} stroke-width="3.2"/><path d="M10 29h28" stroke="#fff" stroke-width="3" opacity=".5" stroke-linecap="round"/>`,
    flag: `<path d="M14 6v54" stroke="${O}" stroke-width="5" stroke-linecap="round"/><path d="M14 6v54" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round"/>
      <rect x="16" y="8" width="40" height="28" fill="#fff"/>${checker(16, 8, 40, 28, 5, 4)}<rect x="16" y="8" width="40" height="28" fill="none" ${S} stroke-width="3"/>`,
    die3d: `<path d="M32 5l25 12.5L32 30 7 17.5z" fill="#fff" ${S} stroke-width="3"/><path d="M7 17.5L32 30v28L7 45.5z" fill="#e2e9f3" ${S} stroke-width="3"/><path d="M57 17.5v28L32 58V30z" fill="#c9d4e4" ${S} stroke-width="3"/>
      <ellipse cx="32" cy="17.5" rx="4.4" ry="2.4" fill="#e63946"/>
      <ellipse cx="14" cy="27" rx="2.3" ry="3" fill="${O}"/><ellipse cx="25" cy="44" rx="2.3" ry="3" fill="${O}"/>
      <ellipse cx="50" cy="26" rx="2.3" ry="3" fill="${O}"/><ellipse cx="44.5" cy="37" rx="2.3" ry="3" fill="${O}"/><ellipse cx="39" cy="48" rx="2.3" ry="3" fill="${O}"/>`,
    // ---- stats / leaderboard ----
    trophy: `<path d="M19 13H9c0 11 5 16 11 16" fill="none" stroke="${O}" stroke-width="3.5"/><path d="M45 13h10c0 11-5 16-11 16" fill="none" stroke="${O}" stroke-width="3.5"/>
      <path d="M18 7h28v15c0 10-6 17-14 17s-14-7-14-17z" fill="#ffc83d" ${S} stroke-width="3"/><path d="M24 12v10c0 4 2 8 5 9" stroke="#fff" stroke-width="3" fill="none" opacity=".6" stroke-linecap="round"/>
      <rect x="28" y="38" width="8" height="8" fill="#e0a526" ${S} stroke-width="2.6"/><rect x="17" y="46" width="30" height="10" rx="2.5" fill="#8a5a2b" ${S} stroke-width="3"/>`,
    player: `<circle cx="32" cy="21" r="12" fill="#93c5fd" ${S} stroke-width="3"/><path d="M10 59c0-13 10-21 22-21s22 8 22 21z" fill="#3b82f6" ${S} stroke-width="3"/>`,
    question: `<circle cx="32" cy="32" r="26" fill="#a78bfa" ${S} stroke-width="3"/>${txt('?', 38, '#fff', 46)}`,
    finish: null, // filled below (same drawing as flag)
    steps: feet(),
    blank: `<rect x="9" y="9" width="46" height="46" rx="9" fill="#e7d97c" ${S} stroke-width="3"/><rect x="15" y="15" width="34" height="34" rx="5" fill="none" stroke="#fff" stroke-width="2.5" opacity=".6"/>`,
    plus: `<circle cx="32" cy="32" r="26" fill="#22c55e" ${S} stroke-width="3"/><path d="M32 18v28M18 32h28" stroke="#fff" stroke-width="7" stroke-linecap="round"/>`,
    car: `<rect x="25" y="9" width="14" height="7" rx="2" fill="#fff" ${S} stroke-width="2.5"/>
      <path d="M6 42l5-15c1-4 3-6 7-6h28c4 0 6 2 7 6l5 15v9a3 3 0 0 1-3 3H9a3 3 0 0 1-3-3z" fill="#ffcc00" ${S} stroke-width="3"/>
      <path d="M17 26h30l4 12H13z" fill="#bfe3ff" ${S} stroke-width="2.6"/><path d="M32 26v12" stroke="${O}" stroke-width="2.6"/>
      <circle cx="19" cy="53" r="7" fill="${O}"/><circle cx="19" cy="53" r="3" fill="#cbd5e1"/><circle cx="45" cy="53" r="7" fill="${O}"/><circle cx="45" cy="53" r="3" fill="#cbd5e1"/>`,
    overshoot: `<path d="M6 14l24 18L6 50z" fill="#f97316" ${S} stroke-width="3"/><path d="M30 14l24 18-24 18z" fill="#fb923c" ${S} stroke-width="3"/><path d="M57 12v40" stroke="${O}" stroke-width="5" stroke-linecap="round"/>`,
    medal1: medal('#ffc83d', '#fff3', '1'),
    medal2: medal('#cbd5e1', '#fff6', '2'),
    medal3: medal('#d08b52', '#fff3', '3'),
    // ---- popups / headers ----
    bell: `<path d="M32 8c-10 0-16 8-16 18v12l-6 8h44l-6-8V26c0-10-6-18-16-18z" fill="#ffd43b" ${S} stroke-width="3"/><circle cx="32" cy="7" r="3.5" fill="#ffd43b" ${S} stroke-width="2.5"/>
      <circle cx="32" cy="52" r="5.5" fill="#e8890c" ${S} stroke-width="2.6"/><path d="M23 22c1-4 4-7 8-7" stroke="#fff" stroke-width="3" fill="none" opacity=".7" stroke-linecap="round"/>`,
    clipboard: `<rect x="11" y="9" width="42" height="51" rx="5" fill="#c89b6a" ${S} stroke-width="3"/><rect x="17" y="15" width="30" height="39" rx="2" fill="#fff" ${S} stroke-width="2"/>
      <rect x="23" y="4" width="18" height="11" rx="3" fill="#94a3b8" ${S} stroke-width="2.6"/><path d="M22 26h20M22 34h20M22 42h13" stroke="#64748b" stroke-width="3" stroke-linecap="round"/>`,
    stopwatch: null, // alias of headstart, filled below
  };
  ICONS.finish = ICONS.flag;
  ICONS.stopwatch = ICONS.headstart;
  ICONS.target = ICONS.choose;
  ICONS.lightbulb = ICONS.hint;

  function qsIcon(name, cls) {
    const body = ICONS[name];
    if (!body) return '';
    return `<svg class="qsi qsi-${name}${cls ? ' ' + cls : ''}" viewBox="0 0 64 64" aria-hidden="true" focusable="false">${body}</svg>`;
  }
  function qsDie(n, cls) {
    return `<svg class="qsi qsi-die${cls ? ' ' + cls : ''}" viewBox="0 0 64 64" aria-hidden="true" focusable="false"><rect x="5" y="5" width="54" height="54" rx="12" fill="#fff" ${S} stroke-width="3"/><rect x="5" y="44" width="54" height="15" rx="12" fill="#dbe4f0" opacity=".7"/><rect x="5" y="5" width="54" height="54" rx="12" fill="none" ${S} stroke-width="3"/>${pips(n)}</svg>`;
  }

  // ---- game pieces: a pawn in the player's colour, topped with their chosen shape ----
  const star = (() => {
    const cx = 20, cy = 12.2, R = 11, r = 4.7, pts = [];
    for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r : R; pts.push((cx + rr * Math.cos(a)).toFixed(2) + ' ' + (cy + rr * Math.sin(a)).toFixed(2)); }
    return 'M' + pts.join('L') + 'Z';
  })();
  const hex = (() => {
    const cx = 20, cy = 12, R = 10.2, pts = [];
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; pts.push((cx + R * Math.cos(a)).toFixed(2) + ' ' + (cy + R * Math.sin(a)).toFixed(2)); }
    return 'M' + pts.join('L') + 'Z';
  })();
  const TOPPERS = {
    Circle: `<circle cx="20" cy="12" r="9.3"/>`,
    Square: `<rect x="11" y="3" width="18" height="18" rx="3"/>`,
    Triangle: `<path d="M20 1.5L31 21H9z"/>`,
    Star: `<path d="${star}"/>`,
    Heart: `<path d="M20 21.8C10.2 15.4 8.4 10.2 10.4 6.6 12.6 2.7 17.9 3 20 7.1c2.1-4.1 7.4-4.4 9.6-.5 2 3.6.2 8.8-9.6 15.2z"/>`,
    Hexagon: `<path d="${hex}"/>`,
    Diamond: `<path d="M20 .8L30 12 20 23.2 10 12z"/>`,
  };
  function shade(hexColor, amt) { // amt -1..1 : darken / lighten
    const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(hexColor || '');
    if (!m) return hexColor;
    let h = m[1]; if (h.length === 3) h = h.split('').map(c => c + c).join('');
    const n = parseInt(h, 16), c = [n >> 16 & 255, n >> 8 & 255, n & 255].map(v => Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt));
    return '#' + c.map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function qsPiece(color, shape, cls) {
    const base = color || '#3b82f6';
    const dark = shade(base, -0.38), light = shade(base, 0.45);
    const isDark = (() => { const d = shade(base, 0).replace('#', ''); const n = parseInt(d, 16); return ((n >> 16 & 255) * .3 + (n >> 8 & 255) * .59 + (n & 255) * .11) < 60; })();
    const line = isDark ? '#9fb4d6' : O;
    const st = `stroke="${line}" stroke-width="1.8" stroke-linejoin="round"`;
    const top = TOPPERS[shape] || TOPPERS.Circle;
    return `<svg class="qsPiece${cls ? ' ' + cls : ''}" viewBox="0 0 40 50" aria-hidden="true" focusable="false">
      <ellipse cx="20" cy="46.6" rx="15.5" ry="3.1" fill="#0b1830" opacity=".35"/>
      <path d="M4.8 39.2v3.3c0 2.6 6.8 4.7 15.2 4.7s15.2-2.1 15.2-4.7v-3.3z" fill="${dark}" ${st}/>
      <ellipse cx="20" cy="39.2" rx="15.2" ry="4.7" fill="${base}" ${st}/>
      <path d="M12.8 38.6c1.2-6.6 3.4-10.6 4.6-15.2h5.2c1.2 4.6 3.4 8.6 4.6 15.2-2.2 1.2-4.6 1.7-7.2 1.7s-5-.5-7.2-1.7z" fill="${base}" ${st}/>
      <path d="M22.6 23.4c1.2 4.6 3.4 8.6 4.6 15.2-1.6.9-3.3 1.4-5.2 1.6 0-6.4-.7-11.7-1.9-16.8z" fill="${dark}" opacity=".45"/>
      <path d="M15.6 36.5c.9-4.6 2.2-8 3-11.4" stroke="${light}" stroke-width="1.7" fill="none" stroke-linecap="round" opacity=".9"/>
      <ellipse cx="20" cy="23.4" rx="7.4" ry="2.6" fill="${base}" ${st}/>
      <g fill="${base}" ${st}>${top}</g>
      <ellipse cx="16" cy="8.6" rx="3" ry="1.9" fill="#fff" opacity=".5" transform="rotate(-30 16 8.6)"/>
    </svg>`;
  }

  function hydrate(root) {
    (root || document).querySelectorAll('[data-qs-icon]').forEach(el => {
      if (el.dataset.qsDone) return;
      el.dataset.qsDone = '1';
      el.insertAdjacentHTML('afterbegin', qsIcon(el.dataset.qsIcon));
    });
  }
  window.qsIcon = qsIcon;
  window.qsDie = qsDie;
  window.qsPiece = qsPiece;
  window.qsHydrateIcons = hydrate;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', () => hydrate());
  else hydrate();
})();
