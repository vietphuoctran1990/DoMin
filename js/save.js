/* ============================================================
   CHIẾN SĨ DÒ MÌN - Lưu tiến trình của bé (localStorage)
   ============================================================ */
(function (global) {
  'use strict';

  const KEY = 'domin_save_v1';

  const DEFAULT = {
    stars: 0,            /* sao đang có, dùng để mua đồ */
    starsEarned: 0,      /* tổng sao từng kiếm được */
    best: 0,             /* điểm cao nhất */
    progress: {},        /* { "1-1": 3 } - số sao đạt được ở từng chặng */
    owned: ['cap_army', 'uni_green', 'acc_none', 'pet_none'],
    equipped: { cap: 'cap_army', uni: 'uni_green', acc: 'acc_none', pet: 'pet_none' },
    stickers: [],
    items: { hint: 1, fifty: 1, shield: 1 },
    music: true,
    voice: true,
    topic: 'mix',
    diff: 1,
    tutorial: false
  };

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  const Save = {
    data: clone(DEFAULT),

    load() {
      let raw = null;
      try { raw = localStorage.getItem(KEY); } catch (e) { raw = null; }
      if (raw) {
        try {
          const d = JSON.parse(raw);
          this.data = Object.assign(clone(DEFAULT), d);
          this.data.equipped = Object.assign(clone(DEFAULT.equipped), d.equipped || {});
          this.data.items = Object.assign(clone(DEFAULT.items), d.items || {});
        } catch (e) { this.data = clone(DEFAULT); }
      } else {
        this.migrateOld();
      }
      return this.data;
    },

    /* Người chơi từ bản trước: giữ lại điểm cao và lựa chọn cũ */
    migrateOld() {
      const get = k => {
        try { const v = localStorage.getItem('domin_' + k); return v === null ? null : JSON.parse(v); }
        catch (e) { return null; }
      };
      const best = get('best'), topic = get('topic'), diff = get('diff');
      const music = get('music'), voice = get('voice'), tut = get('tutorialShown');
      if (best !== null) this.data.best = best;
      if (topic !== null) this.data.topic = topic;
      if (diff !== null) this.data.diff = diff;
      if (music !== null) this.data.music = music;
      if (voice !== null) this.data.voice = voice;
      if (tut !== null) this.data.tutorial = tut;
      this.commit();
    },

    commit() {
      try { localStorage.setItem(KEY, JSON.stringify(this.data)); } catch (e) {}
    },

    set(k, v) { this.data[k] = v; this.commit(); },

    /* ---------- sao ---------- */
    addStars(n) {
      this.data.stars += n;
      this.data.starsEarned += n;
      this.commit();
    },
    spend(n) {
      if (this.data.stars < n) return false;
      this.data.stars -= n;
      this.commit();
      return true;
    },

    /* ---------- hành trình ---------- */
    nodeStars(id) { return this.data.progress[id] || 0; },

    setNodeStars(id, stars) {
      const old = this.data.progress[id] || 0;
      if (stars > old) {
        this.data.progress[id] = stars;
        this.addStars(stars - old);   /* chỉ thưởng phần sao tăng thêm */
      } else {
        this.addStars(1);             /* chơi lại vẫn được 1 sao động viên */
      }
      this.commit();
    },

    /* Chặng đầu tiên luôn mở. Chặng sau mở khi chặng trước đã xong.
       Vùng sau mở khi đã hạ Sếp Bom của vùng trước. */
    isNodeUnlocked(zone, node) {
      const C = global.Content;
      if (zone === 1 && node === 1) return true;
      if (node > 1) return this.nodeStars(C.nodeId(zone, node - 1)) > 0;
      return this.nodeStars(C.nodeId(zone - 1, C.NODES_PER_ZONE)) > 0;
    },

    isZoneUnlocked(zone) { return this.isNodeUnlocked(zone, 1); },

    /* Chặng đang chờ bé chơi tiếp */
    currentNode() {
      const C = global.Content;
      for (let z = 1; z <= C.ZONES.length; z++) {
        for (let n = 1; n <= C.NODES_PER_ZONE; n++) {
          if (this.isNodeUnlocked(z, n) && this.nodeStars(C.nodeId(z, n)) === 0) return { zone: z, node: n };
        }
      }
      return { zone: C.ZONES.length, node: C.NODES_PER_ZONE };
    },

    /* ---------- tủ đồ ---------- */
    has(id) { return this.data.owned.indexOf(id) >= 0; },

    buy(id) {
      const it = global.Content.findItem(id);
      if (!it || this.has(id)) return false;
      if (!this.spend(it.price)) return false;
      this.data.owned.push(id);
      this.commit();
      return true;
    },

    equip(slot, id) {
      if (!this.has(id)) return false;
      this.data.equipped[slot] = id;
      this.commit();
      return true;
    },

    outfit() { return Object.assign({}, this.data.equipped); },

    /* ---------- sticker ---------- */
    hasSticker(id) { return this.data.stickers.indexOf(id) >= 0; },

    addSticker(id) {
      if (!id || this.hasSticker(id)) return null;
      this.data.stickers.push(id);
      this.commit();
      return global.Content.sticker(id);
    },

    /* Tặng một sticker bé chưa có */
    grantSticker(preferId) {
      const C = global.Content;
      if (preferId && !this.hasSticker(preferId)) return this.addSticker(preferId);
      const left = C.STICKERS.filter(s => !this.hasSticker(s.id));
      if (!left.length) return null;
      return this.addSticker(left[Math.floor(Math.random() * left.length)].id);
    },

    /* ---------- vật phẩm ---------- */
    addItem(k, n) {
      this.data.items[k] = Math.max(0, (this.data.items[k] || 0) + (n === undefined ? 1 : n));
      this.commit();
    },

    reset() {
      this.data = clone(DEFAULT);
      this.commit();
    }
  };

  global.Save = Save;
})(window);
