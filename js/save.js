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
    missed: [],          /* câu bé làm sai, để cho gặp lại mà ôn */
    weak: {},            /* { math: 3 } - đếm số lần sai theo chủ đề */
    endlessBest: 0,      /* kỷ lục Vùng Đất Bí Ẩn */
    endlessPlayed: 0,
    music: true,
    voice: true,
    topic: 'mix',
    diff: 1,
    tutorial: false
  };

  const MAX_MISSED = 12;
  const FIRST_CLEAR_BONUS = 2;   /* sao thưởng thêm cho lần đầu qua một chặng */

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

    /* Trả về SỐ SAO BÉ THỰC SỰ NHẬN để màn qua chặng hiện đúng con số */
    setNodeStars(id, stars) {
      const old = this.data.progress[id] || 0;
      let got;
      if (old === 0) {
        /* lần đầu qua chặng: thưởng thêm cho bõ công khám phá */
        this.data.progress[id] = stars;
        got = stars + FIRST_CLEAR_BONUS;
      } else if (stars > old) {
        this.data.progress[id] = stars;
        got = stars - old;            /* chơi lại tốt hơn: bù phần chênh */
      } else {
        got = 1;                      /* chơi lại vẫn được 1 sao động viên */
      }
      this.addStars(got);
      this.commit();
      return got;
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

    /* ============================================================
       ÔN LẠI: nhớ những câu bé làm sai để cho gặp lại
       ============================================================ */
    remember(q) {
      if (!q) return;
      this.data.weak[q.topic] = (this.data.weak[q.topic] || 0) + 1;
      /* đã có câu y hệt trong sổ thì thôi */
      if (this.data.missed.some(m => m.prompt === q.prompt)) { this.commit(); return; }
      this.data.missed.push({
        topic: q.topic, prompt: q.prompt, speak: q.speak, hint: q.hint,
        explain: q.explain || null, visual: q.visual,
        answers: q.answers, correct: q.correct
      });
      while (this.data.missed.length > MAX_MISSED) this.data.missed.shift();
      this.commit();
    },

    /* Lấy một câu cũ để ôn lại (chỉ lấy câu thuộc chủ đề đang chơi,
       và tránh lặp lại đúng câu vừa ôn xong) */
    takeMissed(topics, avoidPrompt) {
      let list = this.data.missed
        .map((m, i) => ({ m, i }))
        .filter(x => !topics || topics.indexOf('mix') >= 0 || topics.indexOf(x.m.topic) >= 0);
      if (list.length > 1 && avoidPrompt) {
        const other = list.filter(x => x.m.prompt !== avoidPrompt);
        if (other.length) list = other;
      }
      if (!list.length) return null;
      const chosen = list[Math.floor(Math.random() * list.length)];
      return { q: chosen.m, index: chosen.i };
    },

    /* Bé làm đúng câu ôn tập -> xoá khỏi sổ */
    forgetMissed(prompt) {
      const i = this.data.missed.findIndex(m => m.prompt === prompt);
      if (i >= 0) { this.data.missed.splice(i, 1); this.commit(); }
    },

    /* ---------- kỷ lục vùng vô tận ---------- */
    setEndless(dist) {
      this.data.endlessPlayed++;
      if (dist > this.data.endlessBest) {
        this.data.endlessBest = dist;
        this.commit();
        return true;
      }
      this.commit();
      return false;
    },

    /* Đã hạ trùm cuối chưa -> mở Vùng Đất Bí Ẩn */
    endlessUnlocked() {
      const C = global.Content;
      return this.nodeStars(C.nodeId(C.ZONES.length, C.NODES_PER_ZONE)) > 0;
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
