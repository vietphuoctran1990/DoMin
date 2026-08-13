/* ============================================================
   CHIẾN SĨ DÒ MÌN - Đồ họa (SVG vẽ tay, không cần ảnh ngoài)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- Ngôi sao đỏ trên mũ bộ đội ---------- */
  const STAR_PATH = 'M0,-6 L1.53,-2.1 L5.71,-1.85 L2.47,0.8 L3.53,4.85 ' +
                    'L0,2.6 L-3.53,4.85 L-2.47,0.8 L-5.71,-1.85 L-1.53,-2.1 Z';

  /* ============================================================
     NHÂN VẬT: em bé chiến sĩ, thay được mũ / quân phục / phụ kiện
     ============================================================ */
  let uid = 0;   /* mỗi bản vẽ một bộ id riêng, nếu trùng thì các nhân vật
                    trên cùng trang sẽ dùng nhầm màu của nhau */

  /* ---------- các kiểu mũ ---------- */
  function capSvg(id, u) {
    switch (id) {
      case 'cap_taibeo':
        return `<g class="cap">
          <ellipse cx="50" cy="30" rx="26" ry="17" fill="#9db86a"/>
          <ellipse cx="50" cy="34" rx="41" ry="9" fill="#8aa65b"/>
          <ellipse cx="50" cy="32" rx="41" ry="7.5" fill="#b3cc82"/>
          <ellipse cx="50" cy="22" rx="17" ry="8" fill="#c3d894" opacity=".7"/>
        </g>`;

      case 'cap_party':
        return `<g class="cap">
          <path d="M50 -4 L70 32 L30 32 Z" fill="url(#party${u})"/>
          <circle cx="42" cy="24" r="3" fill="#fff" opacity=".9"/>
          <circle cx="57" cy="17" r="2.6" fill="#fff" opacity=".9"/>
          <circle cx="50" cy="10" r="2.4" fill="#fff" opacity=".9"/>
          <ellipse cx="50" cy="32" rx="21" ry="4.5" fill="#ff8fb1"/>
          <circle cx="50" cy="-6" r="7" fill="#ffd166"/>
        </g>`;

      case 'cap_space':
        return `<g class="cap">
          <ellipse cx="50" cy="42" rx="34" ry="30" fill="#dff6ff" opacity=".45"/>
          <ellipse cx="50" cy="42" rx="34" ry="30" fill="none" stroke="#fff" stroke-width="3.5"/>
          <path d="M28 28 Q34 20 46 18" stroke="#fff" stroke-width="4"
                fill="none" stroke-linecap="round" opacity=".9"/>
          <rect x="16" y="38" width="9" height="14" rx="4" fill="#cfd8e3"/>
          <rect x="75" y="38" width="9" height="14" rx="4" fill="#cfd8e3"/>
        </g>`;

      case 'cap_crown':
        return `<g class="cap">
          <path d="M24 30 L24 12 L36 22 L50 6 L64 22 L76 12 L76 30 Z" fill="url(#crown${u})"/>
          <rect x="22" y="28" width="56" height="8" rx="4" fill="#f0a500"/>
          <circle cx="50" cy="16" r="3.4" fill="#ff5d8f"/>
          <circle cx="30" cy="20" r="2.6" fill="#4cc9f0"/>
          <circle cx="70" cy="20" r="2.6" fill="#4cc9f0"/>
        </g>`;

      default: /* cap_army - mũ bộ đội có sao đỏ */
        return `<g class="cap">
          <path d="M18 34 Q50 -2 82 34 Z" fill="url(#capG${u})"/>
          <ellipse cx="50" cy="34" rx="35" ry="7.5" fill="#3f6a2b"/>
          <ellipse cx="50" cy="31" rx="35" ry="6" fill="#5b8c42"/>
          <g transform="translate(50,20)"><path d="${STAR_PATH}" fill="#ffdd57"
             stroke="#e23b3b" stroke-width="1.4"/></g>
        </g>`;
    }
  }

  /* ---------- phụ kiện vẽ phía sau thân ---------- */
  function accBack(id) {
    if (id === 'acc_backpack') {
      return `<g class="acc-back">
        <rect x="14" y="70" width="20" height="28" rx="8" fill="#e8654f"/>
        <rect x="17" y="78" width="14" height="9" rx="4" fill="#ffd166"/>
      </g>`;
    }
    if (id === 'acc_wings') {
      return `<g class="acc-back">
        <path d="M32 70 Q6 56 10 84 Q18 96 34 92 Z" fill="#ffffff" opacity=".95"/>
        <path d="M68 70 Q94 56 90 84 Q82 96 66 92 Z" fill="#ffffff" opacity=".95"/>
        <path d="M32 70 Q14 62 14 82" stroke="#dbeafe" stroke-width="2.5" fill="none"/>
        <path d="M68 70 Q86 62 86 82" stroke="#dbeafe" stroke-width="2.5" fill="none"/>
      </g>`;
    }
    return '';
  }

  /* ---------- phụ kiện vẽ phía trước ---------- */
  function accFront(id) {
    if (id === 'acc_scarf') {
      return `<g class="acc-front">
        <path d="M34 66 Q50 76 66 66 L66 72 Q50 82 34 72 Z" fill="#e63946"/>
        <path d="M46 74 L42 92 L52 88 L54 74 Z" fill="#d62839"/>
      </g>`;
    }
    if (id === 'acc_glasses') {
      return `<g class="acc-front">
        <rect x="31" y="41" width="17" height="13" rx="5" fill="#2b2b3a" opacity=".88"/>
        <rect x="52" y="41" width="17" height="13" rx="5" fill="#2b2b3a" opacity=".88"/>
        <rect x="47" y="45" width="6" height="3" rx="1.5" fill="#2b2b3a" opacity=".88"/>
        <path d="M34 44 L40 44" stroke="#fff" stroke-width="2" opacity=".55" stroke-linecap="round"/>
      </g>`;
    }
    return '';
  }

  function hero(outfit) {
    const o = outfit || {};
    const uni = (global.Content ? global.Content.uniform(o.uni) : null) || {
      c1: '#8cc16a', c2: '#5d8f42', c3: '#a8d98a', c4: '#4e7a35', arm: '#7fb85e', leg: '#4c7a37'
    };
    const cap = o.cap || 'cap_army';
    const acc = o.acc || 'acc_none';
    const u = ++uid;
    const legDark = uni.leg;
    const legLight = uni.c2;

    return `
<svg class="hero-svg" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="uniform${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="${uni.c1}"/>
      <stop offset="100%" stop-color="${uni.c2}"/>
    </linearGradient>
    <linearGradient id="capG${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7fb85e"/>
      <stop offset="100%" stop-color="#456f2e"/>
    </linearGradient>
    <linearGradient id="party${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ff8fb1"/>
      <stop offset="100%" stop-color="#c77dff"/>
    </linearGradient>
    <linearGradient id="crown${u}" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffe066"/>
      <stop offset="100%" stop-color="#f4a300"/>
    </linearGradient>
    <radialGradient id="skinG${u}" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#ffe6c9"/>
      <stop offset="100%" stop-color="#f9c99b"/>
    </radialGradient>
  </defs>

  <ellipse class="hero-shadow" cx="50" cy="143" rx="25" ry="5.5"/>

  ${accBack(acc)}

  <!-- CHÂN -->
  <g class="leg leg-b">
    <rect x="38" y="98" width="12" height="30" rx="6" fill="${legDark}"/>
    <rect x="34" y="122" width="19" height="13" rx="6" fill="#54402c"/>
  </g>
  <g class="leg leg-f">
    <rect x="51" y="98" width="12" height="30" rx="6" fill="${legLight}"/>
    <rect x="48" y="122" width="19" height="13" rx="6" fill="#634c34"/>
  </g>

  <!-- TAY SAU -->
  <g class="arm arm-b">
    <rect x="20" y="72" width="11" height="28" rx="5.5" fill="${uni.c2}"/>
    <circle cx="25.5" cy="101" r="7" fill="#f9c99b"/>
  </g>

  <!-- THÂN + QUÂN PHỤC -->
  <g class="torso">
    <rect x="28" y="66" width="44" height="42" rx="15" fill="url(#uniform${u})"/>
    <path d="M40 66 L50 78 L60 66 Z" fill="${uni.c3}"/>
    <rect x="27" y="94" width="46" height="9" rx="4.5" fill="#6b4f31"/>
    <rect x="45" y="93" width="10" height="11" rx="3" fill="#f4c542"/>
    <rect x="33" y="76" width="10" height="8" rx="2.5" fill="${uni.c4}"/>
    <rect x="57" y="76" width="10" height="8" rx="2.5" fill="${uni.c4}"/>
  </g>

  <!-- ĐẦU -->
  <g class="head">
    <ellipse cx="22" cy="48" rx="5" ry="6" fill="#f9c99b"/>
    <ellipse cx="78" cy="48" rx="5" ry="6" fill="#f9c99b"/>
    <circle cx="50" cy="46" r="27" fill="url(#skinG${u})"/>

    <!-- mắt (có nháy mắt ngẫu nhiên) -->
    <g class="eyes">
      <ellipse cx="40" cy="47" rx="6.2" ry="7" fill="#fff"/>
      <ellipse cx="60" cy="47" rx="6.2" ry="7" fill="#fff"/>
      <circle class="pupil" cx="41" cy="48.5" r="4" fill="#2b2b3a"/>
      <circle class="pupil" cx="61" cy="48.5" r="4" fill="#2b2b3a"/>
      <circle cx="42.6" cy="46.6" r="1.5" fill="#fff"/>
      <circle cx="62.6" cy="46.6" r="1.5" fill="#fff"/>
    </g>

    <!-- má hồng + miệng cười -->
    <ellipse cx="31" cy="56" rx="5.5" ry="3.6" fill="#ffb0b8" opacity=".75"/>
    <ellipse cx="69" cy="56" rx="5.5" ry="3.6" fill="#ffb0b8" opacity=".75"/>
    <path class="mouth" d="M43 58 Q50 65 57 58" stroke="#b4593f" stroke-width="2.6"
          fill="none" stroke-linecap="round"/>

    ${accFront(acc)}
    ${capSvg(cap, u)}
  </g>

  <!-- TAY TRƯỚC -->
  <g class="arm arm-f">
    <rect x="69" y="72" width="11" height="28" rx="5.5" fill="${uni.arm}"/>
    <circle cx="74.5" cy="101" r="7" fill="#ffd9b3"/>
  </g>
</svg>`;
  }

  /* ============================================================
     SẾP BOM - trùm cuối mỗi vùng
     ============================================================ */
  function boss(zone) {
    const u = ++uid;
    const emoji = (zone && zone.boss && zone.boss.emoji) || '💣';
    return `
<svg class="boss-svg" viewBox="0 0 140 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bombG${u}" cx="36%" cy="30%">
      <stop offset="0%" stop-color="#6b7280"/>
      <stop offset="55%" stop-color="#374151"/>
      <stop offset="100%" stop-color="#111827"/>
    </radialGradient>
  </defs>

  <!-- ngòi nổ -->
  <rect x="64" y="18" width="12" height="20" rx="4" fill="#8b5a2b"/>
  <path class="boss-fuse" d="M70 20 Q86 8 78 -2" stroke="#c2a06b" stroke-width="5"
        fill="none" stroke-linecap="round"/>
  <g class="boss-spark"><circle cx="78" cy="-2" r="8" fill="#ffcc33"/>
    <circle cx="78" cy="-2" r="4.5" fill="#fff6c2"/></g>

  <!-- thân bom -->
  <circle cx="70" cy="88" r="52" fill="url(#bombG${u})"/>
  <ellipse cx="52" cy="66" rx="16" ry="11" fill="#fff" opacity=".18"/>

  <!-- mặt dữ tợn -->
  <g class="boss-face">
    <path d="M40 70 L60 78" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <path d="M100 70 L80 78" stroke="#fff" stroke-width="6" stroke-linecap="round"/>
    <ellipse cx="54" cy="90" rx="10" ry="11" fill="#fff"/>
    <ellipse cx="86" cy="90" rx="10" ry="11" fill="#fff"/>
    <circle cx="56" cy="92" r="5.5" fill="#e11d48"/>
    <circle cx="88" cy="92" r="5.5" fill="#e11d48"/>
    <path class="boss-mouth" d="M50 116 Q70 104 90 116" stroke="#fff" stroke-width="5"
          fill="none" stroke-linecap="round"/>
  </g>

  <!-- huy hiệu vùng -->
  <circle cx="70" cy="132" r="15" fill="#fff" opacity=".92"/>
  <text x="70" y="139" font-size="18" text-anchor="middle">${emoji}</text>
</svg>`;
  }

  /* ============================================================
     BÔNG HOA MÌN
     ============================================================ */
  const PETAL_SETS = [
    { petal: '#ff8fb1', petal2: '#ff5d92', core: '#fff3b0', core2: '#ffd166' },
    { petal: '#8ad7ff', petal2: '#4cc9f0', core: '#fff3b0', core2: '#ffd166' },
    { petal: '#ffd166', petal2: '#f9a826', core: '#ffe8f0', core2: '#ff8fb1' },
    { petal: '#c9a7ff', petal2: '#9b6bff', core: '#d8ffd0', core2: '#7ed957' }
  ];

  function flower(i) {
    const c = PETAL_SETS[i % PETAL_SETS.length];
    const n = 8;
    let petals = '';
    for (let p = 0; p < n; p++) {
      const a = (360 / n) * p;
      petals += `<ellipse cx="60" cy="27" rx="16" ry="25" fill="url(#pg${i})"
                  transform="rotate(${a} 60 60)"/>`;
    }
    return `
<svg class="mine-svg" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="pg${i}" cx="50%" cy="30%">
      <stop offset="0%" stop-color="${c.petal}"/>
      <stop offset="100%" stop-color="${c.petal2}"/>
    </radialGradient>
    <radialGradient id="cg${i}" cx="38%" cy="32%">
      <stop offset="0%" stop-color="${c.core}"/>
      <stop offset="100%" stop-color="${c.core2}"/>
    </radialGradient>
  </defs>
  <g class="petal-ring">${petals}</g>
  <circle cx="60" cy="60" r="33" fill="${c.core2}" opacity=".55"/>
  <circle cx="60" cy="60" r="30" fill="url(#cg${i})"/>
  <circle cx="60" cy="60" r="30" fill="none" stroke="#fff" stroke-width="2.5" opacity=".8"/>
</svg>`;
  }

  /* ============================================================
     ĐỊA HÌNH - thay đổi theo tiến trình
     ============================================================ */
  const TERRAINS = [
    {
      key: 'meadow', name: '🌼 Cánh Đồng Hoa',
      far: ['☁️', '☁️', '🌈', '☁️'],
      mid: ['🌳', '🌲', '🌻', '🌳', '🍀'],
      ground: ['🌱', '🌼', '🍄', '🌿', '🐞']
    },
    {
      key: 'beach', name: '🏖️ Bãi Biển Vàng',
      far: ['☁️', '⛵', '🐬', '☁️'],
      mid: ['🌴', '🏖️', '🌴', '⛱️'],
      ground: ['🐚', '⭐', '🦀', '🪸', '🐠']
    },
    {
      key: 'forest', name: '🌲 Rừng Xanh Bí Ẩn',
      far: ['⛰️', '☁️', '🦅', '⛰️'],
      mid: ['🌲', '🌳', '🌲', '🍁', '🌲'],
      ground: ['🍄', '🌿', '🐿️', '🪵', '🦋']
    },
    {
      key: 'snow', name: '❄️ Đỉnh Núi Tuyết',
      far: ['🏔️', '☁️', '🏔️', '❄️'],
      mid: ['🎄', '⛄', '🎄', '🏠'],
      ground: ['❄️', '🐧', '⛸️', '❄️', '🦌']
    },
    {
      key: 'space', name: '🚀 Hành Tinh Lạ',
      far: ['🪐', '⭐', '🌟', '🛸'],
      mid: ['🚀', '🌑', '👾', '🗿'],
      ground: ['⭐', '💎', '🪨', '👽', '🔮']
    }
  ];

  const rnd = (a, b) => a + Math.random() * (b - a);

  function fillLayer(el, list, opt) {
    el.innerHTML = '';
    const count = opt.count;
    for (let i = 0; i < count; i++) {
      const s = document.createElement('span');
      s.className = 'deco';
      s.textContent = list[i % list.length];
      s.style.left = (i * (100 / count) + rnd(-3, 6)).toFixed(2) + '%';
      s.style.bottom = rnd(opt.bMin, opt.bMax).toFixed(1) + '%';
      s.style.fontSize = rnd(opt.sMin, opt.sMax).toFixed(1) + 'vmin';
      s.style.setProperty('--sway', rnd(2.6, 5.5).toFixed(2) + 's');
      s.style.setProperty('--delay', rnd(0, 2).toFixed(2) + 's');
      s.style.opacity = opt.op;
      el.appendChild(s);
    }
  }

  function decorate(terrain, refs) {
    fillLayer(refs.far, terrain.far, { count: 5, bMin: 55, bMax: 88, sMin: 4.5, sMax: 8, op: 0.85 });
    fillLayer(refs.mid, terrain.mid, { count: 6, bMin: 22, bMax: 34, sMin: 6, sMax: 10, op: 1 });
    fillLayer(refs.ground, terrain.ground, { count: 8, bMin: 2, bMax: 18, sMin: 3, sMax: 5.5, op: 1 });
  }

  global.Sprites = { hero, boss, flower, TERRAINS, decorate, PETAL_SETS };
})(window);
