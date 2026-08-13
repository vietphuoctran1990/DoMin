/* ============================================================
   CHIẾN SĨ DÒ MÌN - Đồ họa (SVG vẽ tay, không cần ảnh ngoài)
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- Ngôi sao đỏ trên mũ bộ đội ---------- */
  const STAR_PATH = 'M0,-6 L1.53,-2.1 L5.71,-1.85 L2.47,0.8 L3.53,4.85 ' +
                    'L0,2.6 L-3.53,4.85 L-2.47,0.8 L-5.71,-1.85 L-1.53,-2.1 Z';

  /* ============================================================
     NHÂN VẬT: em bé mặc quân phục, đội mũ bộ đội có sao đỏ
     ============================================================ */
  function hero() {
    return `
<svg class="hero-svg" viewBox="0 0 100 150" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="uniform" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#8cc16a"/>
      <stop offset="100%" stop-color="#5d8f42"/>
    </linearGradient>
    <linearGradient id="capG" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#7fb85e"/>
      <stop offset="100%" stop-color="#456f2e"/>
    </linearGradient>
    <radialGradient id="skinG" cx="40%" cy="35%">
      <stop offset="0%" stop-color="#ffe6c9"/>
      <stop offset="100%" stop-color="#f9c99b"/>
    </radialGradient>
  </defs>

  <ellipse class="hero-shadow" cx="50" cy="143" rx="25" ry="5.5"/>

  <!-- CHÂN -->
  <g class="leg leg-b">
    <rect x="38" y="98" width="12" height="30" rx="6" fill="#4c7a37"/>
    <rect x="34" y="122" width="19" height="13" rx="6" fill="#54402c"/>
  </g>
  <g class="leg leg-f">
    <rect x="51" y="98" width="12" height="30" rx="6" fill="#5b8c42"/>
    <rect x="48" y="122" width="19" height="13" rx="6" fill="#634c34"/>
  </g>

  <!-- TAY SAU -->
  <g class="arm arm-b">
    <rect x="20" y="72" width="11" height="28" rx="5.5" fill="#5d8f42"/>
    <circle cx="25.5" cy="101" r="7" fill="#f9c99b"/>
  </g>

  <!-- THÂN + QUÂN PHỤC -->
  <g class="torso">
    <rect x="28" y="66" width="44" height="42" rx="15" fill="url(#uniform)"/>
    <path d="M40 66 L50 78 L60 66 Z" fill="#a8d98a"/>
    <rect x="27" y="94" width="46" height="9" rx="4.5" fill="#6b4f31"/>
    <rect x="45" y="93" width="10" height="11" rx="3" fill="#f4c542"/>
    <rect x="33" y="76" width="10" height="8" rx="2.5" fill="#4e7a35"/>
    <rect x="57" y="76" width="10" height="8" rx="2.5" fill="#4e7a35"/>
  </g>

  <!-- ĐẦU -->
  <g class="head">
    <ellipse cx="22" cy="48" rx="5" ry="6" fill="#f9c99b"/>
    <ellipse cx="78" cy="48" rx="5" ry="6" fill="#f9c99b"/>
    <circle cx="50" cy="46" r="27" fill="url(#skinG)"/>

    <!-- mắt -->
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

    <!-- MŨ BỘ ĐỘI -->
    <g class="cap">
      <path d="M18 34 Q50 -2 82 34 Z" fill="url(#capG)"/>
      <ellipse cx="50" cy="34" rx="35" ry="7.5" fill="#3f6a2b"/>
      <ellipse cx="50" cy="31" rx="35" ry="6" fill="#5b8c42"/>
      <g transform="translate(50,20)"><path d="${STAR_PATH}" fill="#ffdd57"
         stroke="#e23b3b" stroke-width="1.4"/></g>
    </g>
  </g>

  <!-- TAY TRƯỚC -->
  <g class="arm arm-f">
    <rect x="69" y="72" width="11" height="28" rx="5.5" fill="#7fb85e"/>
    <circle cx="74.5" cy="101" r="7" fill="#ffd9b3"/>
  </g>
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

  global.Sprites = { hero, flower, TERRAINS, decorate, PETAL_SETS };
})(window);
