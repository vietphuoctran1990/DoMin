/* ============================================================
   CHIẾN SĨ DÒ MÌN - Bản đồ hành trình
   5 vùng, mỗi vùng 3 chặng + 1 trận Sếp Bom.
   ============================================================ */
(function (global) {
  'use strict';

  const $ = id => document.getElementById(id);

  const Journey = {
    zone: 1,
    onPick: null,      /* game.js gán: function(zoneIndex, nodeIndex) */
    onHome: null,
    el: {},

    init() {
      ['mapScreen', 'mapZoneName', 'mapZoneIntro', 'mapStars', 'mapBody', 'mapNodes',
        'mapDeco', 'mapPrev', 'mapNext', 'mapHome'].forEach(id => { this.el[id] = $(id); });

      this.el.mapPrev.addEventListener('click', () => this.go(-1));
      this.el.mapNext.addEventListener('click', () => this.go(1));
      this.el.mapHome.addEventListener('click', () => { Sound.click(); if (this.onHome) this.onHome(); });
    },

    go(d) {
      const max = Content.ZONES.length;
      const z = Math.min(max, Math.max(1, this.zone + d));
      if (z === this.zone) return;
      this.zone = z;
      Sound.click();
      this.render(true);
    },

    /* Mở bản đồ, tự nhảy tới vùng bé đang chơi dở */
    open(focusCurrent) {
      if (focusCurrent) this.zone = Save.currentNode().zone;
      this.el.mapScreen.hidden = false;
      this.render(false);
    },

    close() { this.el.mapScreen.hidden = true; },

    render(animate) {
      const C = Content;
      const z = this.zone;
      const zone = C.ZONES[z - 1];
      const unlocked = Save.isZoneUnlocked(z);
      const cur = Save.currentNode();

      this.el.mapZoneName.textContent = `${zone.icon} ${zone.name}`;
      this.el.mapZoneIntro.textContent = unlocked
        ? zone.intro
        : '🔒 Hạ Sếp Bom của vùng trước để mở khóa vùng này nhé!';
      this.el.mapStars.textContent = Save.data.stars;
      this.el.mapBody.dataset.terrain = zone.key;
      this.el.mapBody.classList.toggle('locked-zone', !unlocked);

      this.el.mapPrev.disabled = z <= 1;
      this.el.mapNext.disabled = z >= C.ZONES.length;

      /* trang trí nền theo vùng */
      const t = Sprites.TERRAINS.find(x => x.key === zone.key) || Sprites.TERRAINS[0];
      this.el.mapDeco.innerHTML = '';
      t.mid.concat(t.ground).forEach((emo, i) => {
        const s = document.createElement('span');
        s.className = 'deco';
        s.textContent = emo;
        s.style.left = (4 + (i * 97 / (t.mid.length + t.ground.length))).toFixed(1) + '%';
        s.style.bottom = (4 + (i % 3) * 9) + '%';
        s.style.fontSize = (3.4 + (i % 3)) + 'vmin';
        s.style.setProperty('--sway', (2.8 + (i % 4) * 0.6) + 's');
        this.el.mapDeco.appendChild(s);
      });

      /* các chặng */
      const nodes = this.el.mapNodes;
      nodes.innerHTML = '';

      for (let n = 1; n <= C.NODES_PER_ZONE; n++) {
        const spot = C.NODE_SPOTS[n - 1];
        const isBoss = n === C.NODES_PER_ZONE;
        const id = C.nodeId(z, n);
        const stars = Save.nodeStars(id);
        const open = Save.isNodeUnlocked(z, n);
        const isCurrent = open && cur.zone === z && cur.node === n;

        /* dấu chân nối các chặng */
        if (n > 1) {
          const a = C.NODE_SPOTS[n - 2], b = spot;
          for (let k = 1; k <= 4; k++) {
            const f = document.createElement('span');
            f.className = 'foot-dot';
            f.textContent = '·';
            f.style.left = (a.x + (b.x - a.x) * k / 5).toFixed(1) + '%';
            f.style.top = (a.y + (b.y - a.y) * k / 5).toFixed(1) + '%';
            nodes.appendChild(f);
          }
        }

        const b = document.createElement('button');
        b.className = 'map-node' +
          (isBoss ? ' boss-node' : '') +
          (open ? '' : ' locked') +
          (isCurrent ? ' current' : '') +
          (stars > 0 ? ' done' : '');
        b.style.setProperty('--x', spot.x + '%');
        b.style.setProperty('--y', spot.y + '%');
        if (animate) b.style.setProperty('--in', (n * 0.07).toFixed(2) + 's');

        const face = !open ? '🔒' : (isBoss ? '💣' : String(n));
        const starRow = [0, 1, 2]
          .map(i => `<i class="${i < stars ? '' : 'dim'}">⭐</i>`).join('');

        b.innerHTML =
          `<span class="node-face">${face}</span>` +
          (isBoss ? '<span class="node-tag">SẾP BOM</span>' : '') +
          `<span class="node-stars">${starRow}</span>`;

        b.setAttribute('aria-label', isBoss ? 'Trận Sếp Bom' : 'Chặng ' + n);

        /* bé đứng ngay tại chặng đang chờ chơi */
        if (isCurrent) {
          const me = document.createElement('div');
          me.className = 'map-me';
          me.style.setProperty('--x', spot.x + '%');
          me.style.setProperty('--y', spot.y + '%');
          me.innerHTML = Sprites.hero(Save.outfit());
          nodes.appendChild(me);
        }

        if (open) {
          b.addEventListener('click', () => {
            Sound.click();
            if (this.onPick) this.onPick(z, n);
          });
        } else {
          b.addEventListener('click', () => {
            Sound.click();
            toastMap('🔒 Bé hãy qua chặng trước đã nhé!');
          });
        }
        nodes.appendChild(b);
      }
    }
  };

  function toastMap(msg) {
    const wrap = $('toastWrap');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 2300);
  }

  global.Journey = Journey;
})(window);
