/* ============================================================
   CHIẾN SĨ DÒ MÌN - Tủ đồ (mua & mặc đồ) và Album sticker
   ============================================================ */
(function (global) {
  'use strict';

  const $ = id => document.getElementById(id);

  /* ============================================================
     TỦ ĐỒ
     ============================================================ */
  const Wardrobe = {
    slot: 'cap',
    onClose: null,
    el: {},

    init() {
      ['wardrobe', 'wardStars', 'wardHero', 'wardPet', 'wardTabs', 'wardGrid', 'wardClose']
        .forEach(id => { this.el[id] = $(id); });

      Content.SLOTS.forEach(s => {
        const b = document.createElement('button');
        b.className = 'tab-btn' + (s.key === this.slot ? ' is-on' : '');
        b.dataset.slot = s.key;
        b.innerHTML = `<span>${s.icon}</span><span>${s.name}</span>`;
        b.addEventListener('click', () => {
          this.slot = s.key;
          Sound.click();
          this.render();
        });
        this.el.wardTabs.appendChild(b);
      });

      this.el.wardClose.addEventListener('click', () => {
        Sound.click();
        this.close();
      });
    },

    open() {
      this.el.wardrobe.hidden = false;
      this.render();
    },

    close() {
      this.el.wardrobe.hidden = true;
      if (this.onClose) this.onClose();
    },

    preview() {
      this.el.wardHero.innerHTML = Sprites.hero(Save.outfit());
      const pet = Content.pet(Save.data.equipped.pet);
      this.el.wardPet.textContent = pet.emoji || '';
      this.el.wardPet.hidden = !pet.emoji;
    },

    render() {
      this.el.wardStars.textContent = Save.data.stars;
      this.preview();

      [...this.el.wardTabs.children].forEach(b =>
        b.classList.toggle('is-on', b.dataset.slot === this.slot));

      const slot = Content.SLOTS.find(s => s.key === this.slot);
      const grid = this.el.wardGrid;
      grid.innerHTML = '';

      slot.list.forEach(item => {
        const owned = Save.has(item.id);
        const worn = Save.data.equipped[this.slot] === item.id;
        const canBuy = Save.data.stars >= item.price;

        const c = document.createElement('button');
        c.className = 'ward-item' + (worn ? ' worn' : '') + (!owned && !canBuy ? ' poor' : '');
        c.innerHTML =
          `<span class="wi-ico">${item.icon}</span>` +
          `<span class="wi-name">${item.name}</span>` +
          `<span class="wi-tag">${
            worn ? '✅ Đang mặc' : owned ? 'Mặc thử' : `⭐ ${item.price}`
          }</span>`;

        c.addEventListener('click', () => {
          if (worn) { Sound.click(); return; }

          if (owned) {
            Save.equip(this.slot, item.id);
            Sound.item();
            this.render();
            return;
          }

          if (!canBuy) {
            Sound.click();
            toast(`Bé cần ${item.price - Save.data.stars} ⭐ nữa nhé!`);
            return;
          }

          if (Save.buy(item.id)) {
            Save.equip(this.slot, item.id);
            Sound.levelUp();
            burst(c);
            toast(`🎉 Bé có ${item.name} rồi!`);
            Sound.speak(`Bé vừa nhận được ${item.name}`);
            this.render();
          }
        });

        grid.appendChild(c);
      });
    }
  };

  /* ============================================================
     ALBUM STICKER
     ============================================================ */
  const Album = {
    onClose: null,
    el: {},

    init() {
      ['album', 'albumCount', 'albumGrid', 'albumClose'].forEach(id => { this.el[id] = $(id); });
      this.el.albumClose.addEventListener('click', () => {
        Sound.click();
        this.close();
      });
    },

    open() {
      this.el.album.hidden = false;
      this.render();
    },

    close() {
      this.el.album.hidden = true;
      if (this.onClose) this.onClose();
    },

    render(highlightId) {
      const total = Content.STICKERS.length;
      const got = Save.data.stickers.length;
      this.el.albumCount.textContent = `Bé đã sưu tầm ${got} / ${total} sticker`;

      const grid = this.el.albumGrid;
      grid.innerHTML = '';
      Content.STICKERS.forEach(s => {
        const owned = Save.hasSticker(s.id);
        const c = document.createElement('div');
        c.className = 'sticker' + (owned ? '' : ' locked') + (s.id === highlightId ? ' brand-new' : '');
        c.innerHTML =
          `<span class="sk-emo">${owned ? s.e : '❔'}</span>` +
          `<span class="sk-name">${owned ? s.n : '???'}</span>`;
        grid.appendChild(c);
      });
    }
  };

  /* ---------- tiện ích dùng chung ---------- */
  function toast(msg) {
    const wrap = $('toastWrap');
    if (!wrap) return;
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    wrap.appendChild(t);
    setTimeout(() => t.remove(), 2300);
  }

  function burst(host) {
    const r = host.getBoundingClientRect();
    for (let i = 0; i < 10; i++) {
      const s = document.createElement('div');
      s.className = 'free-piece';
      s.textContent = ['✨', '⭐', '🎉'][i % 3];
      s.style.left = (r.left + r.width / 2) + 'px';
      s.style.top = (r.top + r.height / 2) + 'px';
      const a = (Math.PI * 2 * i) / 10;
      s.style.setProperty('--dx', Math.cos(a) * 70 + 'px');
      s.style.setProperty('--dy', Math.sin(a) * 70 + 'px');
      document.body.appendChild(s);
      setTimeout(() => s.remove(), 1000);
    }
  }

  global.Wardrobe = Wardrobe;
  global.Album = Album;
})(window);
