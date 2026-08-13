/* ============================================================
   CHIẾN SĨ DÒ MÌN - Ngân hàng câu hỏi
   Mỗi câu hỏi có dạng:
   {
     topic:   'math',
     prompt:  'Chuỗi hiển thị',
     speak:   'Chuỗi để đọc thành tiếng',
     visual:  {type:'emoji'|'swatch'|'html'|'none', value:'...'},
     hint:    'Gợi ý khi bé dùng kính lúp',
     explain: {text, visual}   - chỉ bé cách làm khi bé sai nhiều lần
     answers: [{label, emoji, color}, ...]  (4 đáp án, đã trộn)
     correct: chỉ số đáp án đúng
   }
   ============================================================ */
(function (global) {
  'use strict';

  /* ---------- tiện ích ---------- */
  const rnd = n => Math.floor(Math.random() * n);
  const pick = arr => arr[rnd(arr.length)];

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = rnd(i + 1);
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /** Trộn 4 đáp án và trả về {answers, correct} */
  function build(correctAnswer, wrongAnswers) {
    const all = shuffle([correctAnswer].concat(wrongAnswers.slice(0, 3)));
    return { answers: all, correct: all.indexOf(correctAnswer) };
  }

  /** Bỏ emoji để đọc cho tự nhiên */
  function plain(str) {
    return String(str)
      .replace(/[\u{1F000}-\u{1FAFF}\u{2190}-\u{21FF}\u{2600}-\u{27BF}\u{FE0F}\u{20E3}]/gu, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /* Bộ nhớ tránh lặp câu cho các ngân hàng cố định */
  const usedBank = {};
  function pickUnused(key, list) {
    if (!usedBank[key] || usedBank[key].length >= Math.max(4, Math.floor(list.length * 0.75))) {
      usedBank[key] = [];
    }
    let idx;
    let guard = 0;
    do { idx = rnd(list.length); guard++; } while (usedBank[key].includes(idx) && guard < 80);
    usedBank[key].push(idx);
    return list[idx];
  }

  /** Câu hỏi dạng "chọn 1 trong 4" lấy từ ngân hàng cố định */
  function fromBank(topic, key, list, visual) {
    const it = pickUnused(key, list);
    const made = build({ label: it.a }, it.w.map(x => ({ label: x })));
    return {
      topic, prompt: it.q, speak: plain(it.q), hint: it.h,
      visual: visual || { type: 'none' },
      answers: made.answers, correct: made.correct
    };
  }

  const COUNT_ICONS = ['🍎', '🍌', '🐥', '⭐', '🎈', '🌸', '🍓', '🐝', '🚗', '🐟', '🧁', '🐞'];
  const ICON_NAMES = {
    '🍎': 'quả táo', '🍌': 'quả chuối', '🐥': 'chú gà con', '⭐': 'ngôi sao',
    '🎈': 'quả bóng bay', '🌸': 'bông hoa', '🍓': 'quả dâu', '🐝': 'chú ong',
    '🚗': 'chiếc ô tô', '🐟': 'con cá', '🧁': 'chiếc bánh', '🐞': 'con bọ rùa'
  };

  /* ============================================================
     1. PHÉP TÍNH
     ============================================================ */
  function genAdd(diff) {
    const max = diff === 1 ? 5 : diff === 2 ? 10 : 20;
    const kinds = diff === 1 ? ['+'] : diff === 2 ? ['+', '-'] : ['+', '-', '-', '+'];
    const op = pick(kinds);
    let a, b, res, prompt, speak, hint, visual = null, explain = null;
    const ic = pick(COUNT_ICONS);

    if (op === '+') {
      a = 1 + rnd(max - 1);
      b = 1 + rnd(Math.max(1, max - a));
      res = a + b;
      prompt = `${a} + ${b} = ?`;
      speak = `${a} cộng ${b} bằng mấy?`;
      hint = `Bé có ${a} rồi lấy thêm ${b} nữa. Đếm tiếp từ ${a}: ${
        Array.from({ length: b }, (_, i) => a + i + 1).join(', ')
      }.`;
      if (res <= 12) {
        visual = { type: 'emoji', value: ic.repeat(a) + ' ➕ ' + ic.repeat(b) };
        explain = {
          text: `${a} cái, thêm ${b} cái nữa. Bé đếm hết tất cả: ${res} cái!`,
          visual: { type: 'emoji', value: ic.repeat(res) }
        };
      }
    } else {
      a = 2 + rnd(max - 1);
      b = 1 + rnd(a - 1);
      res = a - b;
      prompt = `${a} − ${b} = ?`;
      speak = `${a} trừ ${b} bằng mấy?`;
      hint = `Bé có ${a} cái, cho đi ${b} cái. Đếm lùi từ ${a}: ${
        Array.from({ length: b }, (_, i) => a - i - 1).join(', ')
      }.`;
      if (a <= 12) {
        visual = { type: 'emoji', value: ic.repeat(res) + '❌'.repeat(b) };
        explain = {
          text: `Có ${a} cái, bỏ đi ${b} cái (dấu ❌). Còn lại ${res} cái!`,
          visual: { type: 'emoji', value: ic.repeat(res) }
        };
      }
    }

    /* đáp án nhiễu phải gần kết quả để bé còn phải suy nghĩ,
       nhưng không quá xa lạ (vd 1+3 mà có đáp án 14) */
    const wrongs = [];
    const deltas = res <= 6
      ? shuffle([1, -1, 2, -2, 3, -3, 4])
      : shuffle([1, -1, 2, -2, 3, -3, 5, -5]);
    for (const d of deltas) {
      const v = res + d;
      if (v >= 0 && v !== res && !wrongs.includes(v)) wrongs.push(v);
      if (wrongs.length === 3) break;
    }

    const made = build({ label: String(res) }, wrongs.map(w => ({ label: String(w) })));
    return {
      topic: 'math', prompt, speak, hint, explain,
      visual: visual || { type: 'none' },
      answers: made.answers, correct: made.correct
    };
  }

  /* So sánh lớn hơn / bé hơn */
  function genCompare(diff) {
    const max = diff === 1 ? 9 : diff === 2 ? 20 : 50;
    const nums = [];
    while (nums.length < 4) {
      const n = 1 + rnd(max);
      if (!nums.includes(n)) nums.push(n);
    }
    const big = Math.random() < 0.5;
    const res = big ? Math.max.apply(null, nums) : Math.min.apply(null, nums);
    const sorted = nums.slice().sort((a, b) => a - b);

    const made = build({ label: String(res) },
      nums.filter(n => n !== res).map(n => ({ label: String(n) })));

    return {
      topic: 'math',
      prompt: big ? 'Số nào LỚN NHẤT?' : 'Số nào BÉ NHẤT?',
      speak: big ? 'Số nào lớn nhất?' : 'Số nào bé nhất?',
      hint: big
        ? 'Số càng đứng sau khi đếm thì càng lớn. Bé thử đếm xem số nào tới sau cùng nhé.'
        : 'Số càng đứng trước khi đếm thì càng bé. Bé đếm từ 1 xem gặp số nào trước nhất.',
      explain: {
        text: `Xếp từ bé đến lớn: ${sorted.join(' < ')}. Vậy số ${big ? 'lớn nhất' : 'bé nhất'} là ${res}.`,
        visual: { type: 'none' }
      },
      visual: { type: 'emoji', value: big ? '⬆️ 🔍' : '⬇️ 🔍' },
      answers: made.answers, correct: made.correct
    };
  }

  /* Chia đều cho các bạn */
  function genShare(diff) {
    const per = 1 + rnd(diff === 1 ? 3 : 5);
    const friends = 2 + rnd(diff >= 3 ? 3 : 2);
    const total = per * friends;
    const wrongs = [];
    for (const d of shuffle([1, -1, 2, -2, 3])) {
      const v = per + d;
      if (v >= 1 && v !== per && !wrongs.includes(v)) wrongs.push(v);
      if (wrongs.length === 3) break;
    }
    const made = build({ label: String(per) }, wrongs.map(w => ({ label: String(w) })));
    return {
      topic: 'math',
      prompt: `Bé có ${total} cái kẹo, chia đều cho ${friends} bạn. Mỗi bạn được mấy cái?`,
      speak: `Bé có ${total} cái kẹo, chia đều cho ${friends} bạn. Mỗi bạn được mấy cái?`,
      hint: `Bé chia lần lượt: đưa mỗi bạn 1 cái, rồi lại 1 cái nữa... cho tới hết ${total} cái.`,
      explain: {
        text: `${friends} bạn, mỗi bạn ${per} cái. Đếm lại: ${
          Array.from({ length: friends }, () => per).join(' + ')} = ${total} ✔`,
        visual: { type: 'emoji', value: ('🍬'.repeat(per) + ' | ').repeat(friends) }
      },
      visual: { type: 'emoji', value: '🍬'.repeat(Math.min(total, 12)) },
      answers: made.answers, correct: made.correct
    };
  }

  /* ============================================================
     2. ĐẾM SỐ
     ============================================================ */
  function genCount(diff) {
    const max = diff === 1 ? 5 : diff === 2 ? 9 : 14;
    const n = 1 + rnd(max);
    const ic = pick(COUNT_ICONS);
    const name = ICON_NAMES[ic] || 'món đồ';

    const wrongs = [];
    for (const d of shuffle([1, -1, 2, -2, 3, 4])) {
      const v = n + d;
      if (v >= 1 && v !== n && !wrongs.includes(v)) wrongs.push(v);
      if (wrongs.length === 3) break;
    }

    const made = build({ label: String(n) }, wrongs.map(w => ({ label: String(w) })));
    return {
      topic: 'count',
      prompt: `Có bao nhiêu ${name}?`,
      speak: `Có bao nhiêu ${name}?`,
      hint: `Bé chỉ tay vào từng cái và đếm nhé: 1, 2, 3... Có tất cả ${n} ${name}.`,
      explain: {
        text: `Bé đếm cùng nhé: ${Array.from({ length: n }, (_, i) => i + 1).join(', ')}. Tất cả là ${n}!`,
        visual: { type: 'emoji', value: ic.repeat(n) }
      },
      visual: { type: 'emoji', value: ic.repeat(n) },
      answers: made.answers, correct: made.correct
    };
  }

  /* Số liền trước / liền sau */
  function genNeighbor(diff) {
    const max = diff === 1 ? 9 : diff === 2 ? 20 : 50;
    const after = Math.random() < 0.5;
    const n = 2 + rnd(max - 2);
    const res = after ? n + 1 : n - 1;

    const wrongs = [];
    for (const d of shuffle([1, -1, 2, -2, 3])) {
      const v = res + d;
      if (v >= 0 && v !== res && v !== n && !wrongs.includes(v)) wrongs.push(v);
      if (wrongs.length === 3) break;
    }
    const made = build({ label: String(res) }, wrongs.map(w => ({ label: String(w) })));

    return {
      topic: 'count',
      prompt: after ? `Số nào đứng NGAY SAU số ${n}?` : `Số nào đứng NGAY TRƯỚC số ${n}?`,
      speak: after ? `Số nào đứng ngay sau số ${n}?` : `Số nào đứng ngay trước số ${n}?`,
      hint: after
        ? `Bé đếm ${n - 1}, ${n}, rồi tới số nào nữa?`
        : `Bé đếm tới ${n} rồi lùi lại một bước xem là số mấy.`,
      explain: {
        text: `Dãy số: ${n - 1}, ${n}, ${n + 1}. Vậy số đứng ${after ? 'ngay sau' : 'ngay trước'} ${n} là ${res}.`,
        visual: { type: 'none' }
      },
      visual: { type: 'emoji', value: after ? `${n} ➡️ ❓` : `❓ ➡️ ${n}` },
      answers: made.answers, correct: made.correct
    };
  }

  /* Dãy số còn thiếu */
  function genSequence(diff) {
    const step = diff === 1 ? 1 : pick([1, 2, 2, 5]);
    const start = 1 + rnd(diff === 1 ? 5 : 10);
    const seq = [0, 1, 2, 3].map(i => start + i * step);
    const hole = 1 + rnd(2);
    const res = seq[hole];
    const shown = seq.map((v, i) => (i === hole ? '__' : v)).join(', ');

    const wrongs = [];
    for (const d of shuffle([step, -step, 1, -1, 2])) {
      const v = res + d;
      if (v >= 0 && v !== res && !wrongs.includes(v) && !seq.includes(v)) wrongs.push(v);
      if (wrongs.length === 3) break;
    }
    while (wrongs.length < 3) {
      const v = res + 1 + wrongs.length * 2;
      if (!wrongs.includes(v)) wrongs.push(v);
    }

    const made = build({ label: String(res) }, wrongs.map(w => ({ label: String(w) })));
    return {
      topic: 'count',
      prompt: `Số nào còn thiếu?  ${shown}`,
      speak: `Dãy số ${seq.map((v, i) => (i === hole ? 'mấy' : v)).join(', ')}. Số còn thiếu là số nào?`,
      hint: step === 1
        ? 'Dãy này đếm liên tiếp: mỗi số hơn số trước 1 đơn vị.'
        : `Dãy này mỗi số hơn số trước ${step} đơn vị đó bé.`,
      explain: {
        text: `Dãy đầy đủ là: ${seq.join(', ')} — mỗi lần thêm ${step}. Chỗ trống là ${res}.`,
        visual: { type: 'none' }
      },
      visual: { type: 'none' },
      answers: made.answers, correct: made.correct
    };
  }

  /* ============================================================
     3. MÀU SẮC
     ============================================================ */
  const COLORS = [
    { name: 'Đỏ', hex: '#ef4444' },
    { name: 'Vàng', hex: '#facc15' },
    { name: 'Xanh lá', hex: '#22c55e' },
    { name: 'Xanh dương', hex: '#3b82f6' },
    { name: 'Cam', hex: '#fb923c' },
    { name: 'Tím', hex: '#a855f7' },
    { name: 'Hồng', hex: '#f472b6' },
    { name: 'Nâu', hex: '#a16207' },
    { name: 'Đen', hex: '#374151' },
    { name: 'Trắng', hex: '#f8fafc' },
    { name: 'Xám', hex: '#9ca3af' }
  ];

  const COLOR_THINGS = [
    { emoji: '🍌', name: 'quả chuối chín', color: 'Vàng' },
    { emoji: '🍅', name: 'quả cà chua chín', color: 'Đỏ' },
    { emoji: '🌿', name: 'chiếc lá non', color: 'Xanh lá' },
    { emoji: '☁️', name: 'đám mây', color: 'Trắng' },
    { emoji: '🍆', name: 'quả cà tím', color: 'Tím' },
    { emoji: '🥕', name: 'củ cà rốt', color: 'Cam' },
    { emoji: '🌊', name: 'nước biển', color: 'Xanh dương' },
    { emoji: '🐻', name: 'chú gấu nâu', color: 'Nâu' },
    { emoji: '🍓', name: 'quả dâu tây', color: 'Đỏ' },
    { emoji: '🌻', name: 'bông hướng dương', color: 'Vàng' },
    { emoji: '🐧', name: 'áo của chú chim cánh cụt', color: 'Đen' },
    { emoji: '🌷', name: 'bông hoa tulip hồng', color: 'Hồng' },
    { emoji: '🍊', name: 'quả cam', color: 'Cam' },
    { emoji: '🥬', name: 'cây rau cải', color: 'Xanh lá' },
    { emoji: '🍫', name: 'thanh sô cô la', color: 'Nâu' },
    { emoji: '❄️', name: 'bông tuyết', color: 'Trắng' },
    { emoji: '🍇', name: 'chùm nho tím', color: 'Tím' },
    { emoji: '🐘', name: 'chú voi', color: 'Xám' },
    { emoji: '🌰', name: 'hạt dẻ', color: 'Nâu' },
    { emoji: '🐤', name: 'chú gà con', color: 'Vàng' }
  ];

  const COLOR_LIKE = {
    'Đỏ': 'quả cà chua', 'Vàng': 'quả chuối chín', 'Xanh lá': 'chiếc lá cây',
    'Xanh dương': 'bầu trời', 'Cam': 'củ cà rốt', 'Tím': 'quả nho tím',
    'Hồng': 'bông hoa hồng phấn', 'Nâu': 'thanh sô cô la', 'Đen': 'ban đêm',
    'Trắng': 'bông tuyết', 'Xám': 'chú voi'
  };

  function colorAnswer(c) { return { label: c.name, color: c.hex }; }

  function genColor(diff) {
    const useThing = Math.random() < 0.55;

    if (useThing) {
      const t = pickUnused('colorthing', COLOR_THINGS);
      const right = COLORS.find(c => c.name === t.color);
      const wrongs = shuffle(COLORS.filter(c => c.name !== t.color)).slice(0, 3);
      const made = build(colorAnswer(right), wrongs.map(colorAnswer));
      return {
        topic: 'color',
        prompt: `${t.name.charAt(0).toUpperCase() + t.name.slice(1)} có màu gì?`,
        speak: `${t.name} có màu gì?`,
        hint: `Bé nhớ lại xem ${t.name} trông thế nào nhé. Nó có màu ${t.color.toLowerCase()} đó!`,
        explain: {
          text: `${t.emoji} ${t.name} có màu ${t.color.toLowerCase()}.`,
          visual: { type: 'swatch', value: right.hex }
        },
        visual: { type: 'emoji', value: t.emoji },
        answers: made.answers, correct: made.correct
      };
    }

    const pool = diff === 1 ? COLORS.slice(0, 6) : COLORS;
    const right = pick(pool);
    const wrongs = shuffle(COLORS.filter(c => c.name !== right.name)).slice(0, 3);
    const made = build(colorAnswer(right), wrongs.map(colorAnswer));
    return {
      topic: 'color',
      prompt: 'Đây là màu gì?',
      speak: 'Đây là màu gì?',
      hint: `Ô màu này giống màu của ${COLOR_LIKE[right.name] || 'một thứ quen thuộc'} đó bé!`,
      explain: {
        text: `Đây là màu ${right.name.toLowerCase()}, giống màu của ${COLOR_LIKE[right.name]}.`,
        visual: { type: 'swatch', value: right.hex }
      },
      visual: { type: 'swatch', value: right.hex },
      answers: made.answers, correct: made.correct
    };
  }

  /* ============================================================
     4. CON VẬT
     ============================================================ */
  const ANIMALS = [
    { q: 'Con vật nào kêu "meo meo"?', a: '🐱 Mèo', w: ['🐶 Chó', '🐮 Bò', '🐔 Gà'], h: 'Bạn ấy hay rình bắt chuột và thích cuộn tròn ngủ.' },
    { q: 'Con vật nào kêu "gâu gâu"?', a: '🐶 Chó', w: ['🐷 Lợn', '🐸 Ếch', '🐭 Chuột'], h: 'Bạn ấy trông nhà cho bé, vẫy đuôi khi thấy chủ.' },
    { q: 'Con vật nào có vòi rất dài?', a: '🐘 Voi', w: ['🦒 Hươu cao cổ', '🦁 Sư tử', '🐴 Ngựa'], h: 'Bạn ấy to nhất rừng, tai to như cái quạt.' },
    { q: 'Con vật nào biết bay?', a: '🐦 Chim', w: ['🐢 Rùa', '🐠 Cá', '🐌 Ốc sên'], h: 'Bạn ấy có hai cánh và làm tổ trên cây.' },
    { q: 'Con vật nào sống dưới nước?', a: '🐟 Cá', w: ['🐇 Thỏ', '🐓 Gà trống', '🐨 Gấu koala'], h: 'Bạn ấy có vây và mang để thở dưới nước.' },
    { q: 'Con vật nào cho bé sữa uống?', a: '🐮 Bò', w: ['🐯 Hổ', '🐍 Rắn', '🦊 Cáo'], h: 'Bạn ấy kêu "ụm bò" và ăn cỏ ngoài đồng.' },
    { q: 'Con vật nào có cổ dài nhất?', a: '🦒 Hươu cao cổ', w: ['🐹 Chuột hamster', '🐧 Chim cánh cụt', '🐢 Rùa'], h: 'Bạn ấy vươn cổ hái lá trên ngọn cây cao.' },
    { q: 'Con vật nào nhảy giỏi và kêu "ộp ộp"?', a: '🐸 Ếch', w: ['🐘 Voi', '🐴 Ngựa', '🐔 Gà mái'], h: 'Bạn ấy sống gần ao và có hai chân sau rất khỏe.' },
    { q: 'Con vật nào làm ra mật ngọt?', a: '🐝 Ong', w: ['🦋 Bướm', '🐜 Kiến', '🕷️ Nhện'], h: 'Bạn ấy vo ve quanh những bông hoa cả ngày.' },
    { q: 'Con vật nào có mai cứng trên lưng?', a: '🐢 Rùa', w: ['🐕 Chó', '🐑 Cừu', '🐿️ Sóc'], h: 'Bạn ấy bò rất chậm và mang "ngôi nhà" theo mình.' },
    { q: 'Con vật nào gáy "ò ó o" gọi bé dậy?', a: '🐓 Gà trống', w: ['🐤 Gà con', '🦆 Vịt', '🐦 Chim sẻ'], h: 'Bạn ấy có mào đỏ trên đầu và gáy lúc sáng sớm.' },
    { q: 'Con vật nào thích ăn cà rốt?', a: '🐰 Thỏ', w: ['🐊 Cá sấu', '🐻 Gấu', '🐬 Cá heo'], h: 'Bạn ấy có hai tai dài và nhảy tưng tưng.' },
    { q: 'Con vật nào là "chúa tể rừng xanh"?', a: '🦁 Sư tử', w: ['🐭 Chuột', '🐑 Cừu', '🐣 Gà con'], h: 'Bạn ấy có bờm oai vệ và tiếng gầm rất to.' },
    { q: 'Con vật nào bơi giỏi và hay nhảy trên mặt biển?', a: '🐬 Cá heo', w: ['🐫 Lạc đà', '🦘 Kangaroo', '🐓 Gà trống'], h: 'Bạn ấy rất thông minh, sống ở biển và hay kêu chít chít.' },
    { q: 'Con vật nào có túi trước bụng để đựng con?', a: '🦘 Kangaroo', w: ['🐄 Bò sữa', '🐖 Lợn', '🐈 Mèo'], h: 'Bạn ấy nhảy bằng hai chân sau rất khỏe, sống ở Úc.' },
    { q: 'Con vật nào có bướu trên lưng, đi trên sa mạc?', a: '🐫 Lạc đà', w: ['🐧 Chim cánh cụt', '🐸 Ếch', '🐙 Bạch tuộc'], h: 'Bạn ấy chịu khát rất giỏi, đi giữa cát nóng.' },
    { q: 'Con vật nào có 8 cái chân dài?', a: '🐙 Bạch tuộc', w: ['🐟 Cá', '🐦 Chim', '🐄 Bò'], h: 'Bạn ấy sống dưới biển, phun mực khi sợ.' },
    { q: 'Con vật nào chăng tơ để bắt mồi?', a: '🕷️ Nhện', w: ['🐝 Ong', '🐌 Ốc sên', '🐞 Bọ rùa'], h: 'Bạn ấy giăng lưới tơ ở góc nhà.' },
    { q: 'Con vật nào biến thành bướm khi lớn?', a: '🐛 Sâu bướm', w: ['🐟 Cá con', '🐥 Gà con', '🐁 Chuột con'], h: 'Bạn ấy bò trên lá, cuộn kén rồi hoá thành bướm.' },
    { q: 'Con vật nào sống ở Nam Cực lạnh giá?', a: '🐧 Chim cánh cụt', w: ['🦁 Sư tử', '🐘 Voi', '🐒 Khỉ'], h: 'Bạn ấy mặc "áo vest" đen trắng và trượt trên băng.' },
    { q: 'Con vật nào thích ăn chuối và leo cây giỏi?', a: '🐒 Khỉ', w: ['🐄 Bò', '🐊 Cá sấu', '🐢 Rùa'], h: 'Bạn ấy có đuôi dài, hay nhăn mặt trêu bé.' },
    { q: 'Con vật nào có nhiều gai nhọn trên lưng?', a: '🦔 Nhím', w: ['🐇 Thỏ', '🐈 Mèo', '🐖 Lợn'], h: 'Khi sợ, bạn ấy cuộn tròn lại thành quả bóng gai.' },
    { q: 'Con vật nào kêu "ủn ỉn"?', a: '🐷 Lợn', w: ['🐴 Ngựa', '🦆 Vịt', '🐐 Dê'], h: 'Bạn ấy có mũi tròn, thích lăn trong bùn.' },
    { q: 'Con vật nào kêu "cạc cạc" và bơi trong ao?', a: '🦆 Vịt', w: ['🐓 Gà', '🐦 Chim sẻ', '🦉 Cú'], h: 'Bạn ấy có mỏ dẹt và chân có màng để bơi.' },
    { q: 'Con vật nào thức đêm, mắt to tròn?', a: '🦉 Cú', w: ['🐝 Ong', '🦋 Bướm', '🐓 Gà trống'], h: 'Ban đêm bạn ấy kêu "hu hu" trong rừng.' },
    { q: 'Con vật nào chở người và chạy rất nhanh?', a: '🐴 Ngựa', w: ['🐌 Ốc sên', '🐢 Rùa', '🐛 Sâu'], h: 'Bạn ấy có bờm dài, phi "lộc cộc" trên đường.' },
    { q: 'Con vật nào cho bé len để đan áo ấm?', a: '🐑 Cừu', w: ['🐊 Cá sấu', '🐟 Cá', '🐝 Ong'], h: 'Bạn ấy có bộ lông xoăn trắng như mây.' },
    { q: 'Con vật nào có màu đỏ chấm đen, hay đậu trên lá?', a: '🐞 Bọ rùa', w: ['🐜 Kiến', '🕷️ Nhện', '🦗 Châu chấu'], h: 'Bạn ấy nhỏ xíu, tròn tròn, cánh đỏ có chấm.' },
    { q: 'Con vật nào tha mồi thành hàng dài?', a: '🐜 Kiến', w: ['🦋 Bướm', '🐦 Chim', '🐠 Cá'], h: 'Bạn ấy bé xíu nhưng khoẻ, đi thành đoàn.' },
    { q: 'Con vật nào có cánh sặc sỡ, bay quanh vườn hoa?', a: '🦋 Bướm', w: ['🐛 Sâu', '🐌 Ốc sên', '🐢 Rùa'], h: 'Bạn ấy vốn là sâu, lớn lên mọc cánh đẹp.' },
    { q: 'Con vật nào bò chậm và mang vỏ xoắn?', a: '🐌 Ốc sên', w: ['🐆 Báo', '🐇 Thỏ', '🐬 Cá heo'], h: 'Bạn ấy đi tới đâu để lại vệt bóng tới đó.' },
    { q: 'Con vật nào có sọc vằn đen trắng?', a: '🦓 Ngựa vằn', w: ['🐘 Voi', '🦁 Sư tử', '🐻 Gấu'], h: 'Bạn ấy giống ngựa nhưng mặc "áo kẻ sọc".' },
    { q: 'Con vật nào ngủ đông cả mùa lạnh?', a: '🐻 Gấu', w: ['🐓 Gà', '🐟 Cá', '🐝 Ong'], h: 'Bạn ấy to lớn, thích ăn mật ong và cá.' },
    { q: 'Con vật nào có hàm răng sắc, sống ở đầm lầy?', a: '🐊 Cá sấu', w: ['🐑 Cừu', '🐥 Gà con', '🐰 Thỏ'], h: 'Bạn ấy nằm im như khúc gỗ dưới nước.' },
    { q: 'Con vật nào chạy nhanh nhất trên cạn?', a: '🐆 Báo', w: ['🐢 Rùa', '🐌 Ốc sên', '🐧 Chim cánh cụt'], h: 'Bạn ấy có bộ lông đốm và chân dài.' },
    { q: 'Con vật nào có râu dài và thích ăn phô mai?', a: '🐭 Chuột', w: ['🐘 Voi', '🐊 Cá sấu', '🦒 Hươu cao cổ'], h: 'Bạn ấy nhỏ xíu, hay chui vào hang.' },
    { q: 'Con vật nào leo cây tích trữ hạt dẻ?', a: '🐿️ Sóc', w: ['🐬 Cá heo', '🦆 Vịt', '🐖 Lợn'], h: 'Bạn ấy có cái đuôi to xù như cây chổi.' },
    { q: 'Con vật nào kêu "be be" và có sừng cong?', a: '🐐 Dê', w: ['🐟 Cá', '🐦 Chim', '🐙 Bạch tuộc'], h: 'Bạn ấy có râu dưới cằm, thích trèo lên đá.' },
    { q: 'Con vật nào ôm cành bạch đàn ngủ cả ngày?', a: '🐨 Gấu koala', w: ['🐓 Gà trống', '🐜 Kiến', '🦈 Cá mập'], h: 'Bạn ấy sống ở Úc, tai tròn xù như bông.' },
    { q: 'Con vật nào có vây lưng nhọn, là "sát thủ" của biển?', a: '🦈 Cá mập', w: ['🐤 Gà con', '🐇 Thỏ', '🐞 Bọ rùa'], h: 'Bạn ấy răng rất sắc, bơi rất nhanh dưới biển.' },
    { q: 'Con vật nào nhảy xa và kêu "rích rích" trên đồng cỏ?', a: '🦗 Châu chấu', w: ['🐳 Cá voi', '🐘 Voi', '🐄 Bò'], h: 'Bạn ấy màu xanh lá, chân sau dài để bật nhảy.' },
    { q: 'Con vật nào to nhất dưới biển và phun nước lên cao?', a: '🐳 Cá voi', w: ['🐟 Cá cơm', '🦐 Con tôm', '🐌 Ốc sên'], h: 'Bạn ấy khổng lồ, phun vòi nước như đài phun.' }
  ];

  function genAnimal() { return fromBank('animal', 'animal', ANIMALS); }

  /* ============================================================
     5. CÂU ĐỐ
     ============================================================ */
  const RIDDLES = [
    { q: 'Cái gì sáng rực ban ngày, giúp cây cối lớn lên?', a: '☀️ Mặt trời', w: ['🌙 Mặt trăng', '⭐ Ngôi sao', '☁️ Đám mây'], h: 'Sáng ra bé thấy nó mọc ở đằng đông, chiếu nắng ấm.' },
    { q: 'Cái gì tròn tròn, sáng dịu trên trời ban đêm?', a: '🌙 Mặt trăng', w: ['☀️ Mặt trời', '🚀 Tên lửa', '🪁 Cánh diều'], h: 'Đêm rằm nó tròn và sáng, chị Hằng ở trên đó.' },
    { q: 'Cái gì che mưa che nắng cho bé khi ra đường?', a: '☂️ Cái ô', w: ['👟 Đôi giày', '🪑 Cái ghế', '🥄 Cái thìa'], h: 'Bé bung nó ra khi trời mưa, có cán để cầm.' },
    { q: 'Cái gì có bốn chân, để bé ngồi học bài?', a: '🪑 Cái ghế', w: ['🚪 Cái cửa', '🎒 Cái cặp', '🧦 Đôi tất'], h: 'Bé đặt mông lên nó khi ngồi vào bàn.' },
    { q: 'Cái gì có kim ngắn kim dài, chỉ giờ cho bé?', a: '⏰ Đồng hồ', w: ['📚 Quyển sách', '🖍️ Bút màu', '🧸 Gấu bông'], h: 'Nó kêu tích tắc và đánh thức bé buổi sáng.' },
    { q: 'Quả gì vỏ xanh, ruột đỏ, có hạt đen, mùa hè ăn mát?', a: '🍉 Dưa hấu', w: ['🍇 Nho', '🥥 Dừa', '🍋 Chanh'], h: 'Bổ ra thì đỏ au, bé hay ăn cho mát ngày nóng.' },
    { q: 'Quả gì nhiều "mắt", có gai, ăn chua chua ngọt ngọt?', a: '🍍 Quả dứa', w: ['🍎 Quả táo', '🍌 Quả chuối', '🍑 Quả đào'], h: 'Nó có cái mào lá xanh trên đầu như vương miện.' },
    { q: 'Cái gì bé mang trên lưng khi đi học?', a: '🎒 Cái cặp', w: ['🛏️ Cái giường', '🍽️ Cái đĩa', '🚲 Xe đạp'], h: 'Bé bỏ sách vở, bút chì vào trong đó.' },
    { q: 'Cái gì chảy ra từ vòi, bé dùng để rửa tay?', a: '💧 Nước', w: ['🔥 Lửa', '🌬️ Gió', '🧂 Muối'], h: 'Nó trong veo, mát lạnh, bé uống mỗi ngày.' },
    { q: 'Phương tiện nào bay được trên bầu trời?', a: '✈️ Máy bay', w: ['🚌 Xe buýt', '🚢 Con tàu', '🚲 Xe đạp'], h: 'Nó có hai cánh to và bay rất cao trên mây.' },
    { q: 'Cái gì bé đánh mỗi sáng để răng trắng thơm?', a: '🪥 Bàn chải', w: ['🥄 Cái thìa', '✏️ Bút chì', '🧹 Cái chổi'], h: 'Bé bóp kem lên nó rồi chải răng.' },
    { q: 'Mùa nào bé được nghỉ hè, đi biển tắm mát?', a: '☀️ Mùa hè', w: ['❄️ Mùa đông', '🍂 Mùa thu', '🌷 Mùa xuân'], h: 'Mùa nóng nhất trong năm, ve kêu râm ran.' },
    { q: 'Cái gì bé đi vào chân khi ra ngoài?', a: '👟 Đôi giày', w: ['🧤 Găng tay', '👒 Cái mũ', '👓 Cái kính'], h: 'Nó có dây buộc, giúp chân bé không bị đau.' },
    { q: 'Cái gì bé đội lên đầu để che nắng?', a: '👒 Cái mũ', w: ['🧦 Đôi tất', '👞 Đôi dép', '🧣 Khăn quàng'], h: 'Nó tròn tròn, có vành che nắng cho mặt bé.' },
    { q: 'Cái gì mở ra là thấy chữ và tranh?', a: '📚 Quyển sách', w: ['🍳 Cái chảo', '🚿 Vòi sen', '🔑 Chìa khoá'], h: 'Bé lật từng trang để đọc truyện.' },
    { q: 'Cái gì bé dùng để vẽ tranh?', a: '🖍️ Bút màu', w: ['🥄 Cái thìa', '🧦 Đôi tất', '🔨 Cái búa'], h: 'Nó nhiều màu, tô lên giấy thành bức tranh.' },
    { q: 'Cái gì bé dùng để xúc cơm ăn?', a: '🥄 Cái thìa', w: ['✏️ Bút chì', '🪥 Bàn chải', '📏 Cái thước'], h: 'Nó có cán dài và đầu tròn để múc.' },
    { q: 'Cái gì kêu "reng reng" khi có người gọi?', a: '📞 Điện thoại', w: ['🛏️ Cái giường', '🪟 Cửa sổ', '🥿 Đôi dép'], h: 'Bố mẹ dùng nó để nói chuyện với người ở xa.' },
    { q: 'Cái gì lạnh buốt, giữ đồ ăn tươi lâu?', a: '🧊 Tủ lạnh', w: ['🔥 Bếp lửa', '🕯️ Cây nến', '☀️ Mặt trời'], h: 'Mở ra là hơi lạnh phả vào mặt bé.' },
    { q: 'Cái gì bé nằm lên để ngủ ngon?', a: '🛏️ Cái giường', w: ['🪜 Cái thang', '🚪 Cái cửa', '🪣 Cái xô'], h: 'Trên đó có gối và chăn ấm.' },
    { q: 'Cái gì bay lên trời nhờ có dây và gió?', a: '🪁 Cánh diều', w: ['🐟 Con cá', '🪨 Hòn đá', '🥔 Củ khoai'], h: 'Chiều hè bé thả nó ngoài đồng, có đuôi dài.' },
    { q: 'Cái gì có nhiều nước, sóng vỗ, có cát vàng?', a: '🏖️ Bãi biển', w: ['🏔️ Ngọn núi', '🏫 Trường học', '🏠 Ngôi nhà'], h: 'Bé đi đó vào mùa hè, xây lâu đài cát.' },
    { q: 'Cái gì to lớn, cao chót vót, có tuyết ở đỉnh?', a: '🏔️ Ngọn núi', w: ['🌊 Con sóng', '🍃 Chiếc lá', '🪺 Cái tổ'], h: 'Muốn lên đỉnh thì phải leo rất lâu.' },
    { q: 'Cái gì bé đến mỗi ngày để học chữ cùng bạn?', a: '🏫 Trường học', w: ['🏥 Bệnh viện', '🏪 Cửa hàng', '🏰 Lâu đài'], h: 'Ở đó có cô giáo, bảng đen và nhiều bạn.' },
    { q: 'Ai là người dạy bé học ở lớp?', a: '👩‍🏫 Cô giáo', w: ['👨‍🍳 Đầu bếp', '👮 Chú công an', '👨‍🚒 Lính cứu hoả'], h: 'Người đứng trên bục giảng, cầm phấn viết bảng.' },
    { q: 'Ai chữa bệnh cho bé khi bé bị ốm?', a: '👨‍⚕️ Bác sĩ', w: ['👨‍🌾 Bác nông dân', '👩‍🎤 Ca sĩ', '👨‍🔧 Thợ sửa xe'], h: 'Người mặc áo blouse trắng, đeo ống nghe.' },
    { q: 'Ai trồng lúa, trồng rau ngoài đồng?', a: '👨‍🌾 Bác nông dân', w: ['👨‍✈️ Phi công', '👩‍🚀 Phi hành gia', '👮 Chú công an'], h: 'Người đội nón lá, làm việc trên cánh đồng.' },
    { q: 'Ai lái máy bay đưa mọi người đi xa?', a: '👨‍✈️ Phi công', w: ['👨‍🍳 Đầu bếp', '👩‍🏫 Cô giáo', '👨‍⚕️ Bác sĩ'], h: 'Người ngồi trong buồng lái, mặc đồng phục có mũ.' },
    { q: 'Cái gì cháy sáng, nóng, bé không được sờ vào?', a: '🔥 Lửa', w: ['❄️ Nước đá', '🌧️ Cơn mưa', '💨 Làn gió'], h: 'Nó đỏ rực, dùng để nấu chín thức ăn.' },
    { q: 'Cái gì rơi từ trên trời xuống làm ướt đường?', a: '🌧️ Mưa', w: ['⭐ Ngôi sao', '🎈 Bóng bay', '🍂 Chiếc lá'], h: 'Khi nó tới, bé phải mang ô.' },
    { q: 'Cái gì thổi làm lá cây lay động mà không nhìn thấy?', a: '💨 Gió', w: ['🪨 Hòn đá', '🧱 Viên gạch', '🥛 Ly sữa'], h: 'Nó làm diều bay lên và tóc bé bay bay.' },
    { q: 'Cái gì bảy màu, hiện lên sau cơn mưa?', a: '🌈 Cầu vồng', w: ['🌪️ Cơn lốc', '🌫️ Sương mù', '🌑 Bóng tối'], h: 'Nó cong cong như chiếc cầu trên bầu trời.' },
    { q: 'Quả gì màu tím, mọc thành chùm, ăn ngọt?', a: '🍇 Chùm nho', w: ['🥕 Củ cà rốt', '🥔 Củ khoai', '🌽 Bắp ngô'], h: 'Nhiều quả nhỏ tròn dính vào một cành.' },
    { q: 'Củ gì màu cam, thỏ rất thích ăn?', a: '🥕 Cà rốt', w: ['🍆 Cà tím', '🥒 Quả dưa chuột', '🧅 Củ hành'], h: 'Nó dài, nhọn một đầu, có lá xanh trên đầu.' },
    { q: 'Cái gì có nhiều hạt vàng, luộc lên ăn rất ngon?', a: '🌽 Bắp ngô', w: ['🍎 Quả táo', '🍐 Quả lê', '🥥 Quả dừa'], h: 'Nó có râu và lớp áo lá bọc ngoài.' },
    { q: 'Cái gì bé thổi phồng lên rồi bay lơ lửng?', a: '🎈 Bóng bay', w: ['🧱 Viên gạch', '🔑 Chìa khoá', '🪑 Cái ghế'], h: 'Sinh nhật nào cũng có nó, đủ màu sắc.' },
    { q: 'Cái gì bé cắm nến lên rồi thổi ngày sinh nhật?', a: '🎂 Cái bánh kem', w: ['🍜 Bát phở', '🥗 Đĩa rau', '🍚 Bát cơm'], h: 'Nó ngọt, có kem và nến ở trên.' },
    { q: 'Cái gì dùng để mở khoá cửa?', a: '🔑 Chìa khoá', w: ['🥄 Cái thìa', '🖍️ Bút màu', '🧦 Đôi tất'], h: 'Nó nhỏ bằng kim loại, cắm vào ổ rồi xoay.' },
    { q: 'Cái gì bé nhìn vào thấy chính mình?', a: '🪞 Cái gương', w: ['🚪 Cái cửa', '📕 Quyển vở', '🪣 Cái xô'], h: 'Nó sáng bóng, treo trong nhà tắm.' },
    { q: 'Cái gì có hai bánh, bé đạp để đi?', a: '🚲 Xe đạp', w: ['🚁 Trực thăng', '🚤 Ca nô', '🛒 Xe đẩy'], h: 'Bé ngồi lên yên và đạp bằng hai chân.' },
    { q: 'Cái gì chạy trên đường ray, kéo nhiều toa dài?', a: '🚂 Tàu hoả', w: ['✈️ Máy bay', '🚗 Ô tô', '🛵 Xe máy'], h: 'Nó kêu "tu tu" và rất dài.' },
    { q: 'Cái gì nổi trên mặt nước, chở người qua sông?', a: '🚢 Con thuyền', w: ['🚌 Xe buýt', '🚡 Cáp treo', '🛺 Xe ba bánh'], h: 'Nó có buồm hoặc mái chèo.' }
  ];

  function genRiddle() { return fromBank('riddle', 'riddle', RIDDLES); }

  /* ============================================================
     6. HÌNH KHỐI
     ============================================================ */
  const SHAPES = [
    { q: 'Đâu là hình tròn?', a: '🔵 Hình tròn', w: ['🔺 Tam giác', '🟨 Hình vuông', '⭐ Ngôi sao'], h: 'Hình tròn lăn được, không có góc nhọn nào cả.' },
    { q: 'Hình nào có 3 cạnh?', a: '🔺 Tam giác', w: ['🔵 Hình tròn', '🟩 Hình vuông', '❤️ Trái tim'], h: 'Bé đếm các cạnh nhé: 1, 2, 3 cạnh.' },
    { q: 'Hình nào có 4 cạnh bằng nhau?', a: '🟦 Hình vuông', w: ['🔺 Tam giác', '⭕ Hình tròn', '🌙 Trăng lưỡi liềm'], h: 'Bốn cạnh dài bằng nhau, giống viên gạch vuông.' },
    { q: 'Đâu là ngôi sao?', a: '⭐ Ngôi sao', w: ['🟪 Hình vuông', '🔻 Tam giác', '🔴 Hình tròn'], h: 'Nó có 5 cánh nhọn và lấp lánh trên trời đêm.' },
    { q: 'Quả bóng có dạng hình gì?', a: '⭕ Hình tròn', w: ['⬛ Hình vuông', '🔺 Tam giác', '➖ Đường thẳng'], h: 'Vật gì lăn được thì thường tròn đó bé.' },
    { q: 'Mái nhà thường có dạng hình gì?', a: '🔺 Tam giác', w: ['⭕ Hình tròn', '⭐ Ngôi sao', '❤️ Trái tim'], h: 'Bé nhìn nóc nhà: hai mái chụm lại thành ba cạnh.' },
    { q: 'Đâu là hình trái tim?', a: '❤️ Trái tim', w: ['🔷 Hình thoi', '🟧 Hình vuông', '🔵 Hình tròn'], h: 'Hình bé hay vẽ để tặng mẹ đó!' },
    { q: 'Cái bánh xe có dạng hình gì?', a: '⭕ Hình tròn', w: ['🔺 Tam giác', '🟥 Hình vuông', '⬆️ Mũi tên'], h: 'Nó phải lăn được thì xe mới chạy.' },
    { q: 'Hình nào KHÔNG có góc nhọn?', a: '🔵 Hình tròn', w: ['🔺 Tam giác', '⬛ Hình vuông', '⭐ Ngôi sao'], h: 'Bé sờ thử: hình nào trơn tru, không có mũi nhọn?' },
    { q: 'Quyển sách có dạng hình gì?', a: '▭ Hình chữ nhật', w: ['⭕ Hình tròn', '🔺 Tam giác', '⭐ Ngôi sao'], h: 'Nó có 4 góc vuông, hai cạnh dài hai cạnh ngắn.' },
    { q: 'Hình nào có 4 góc vuông nhưng cạnh dài ngắn khác nhau?', a: '▭ Hình chữ nhật', w: ['🟦 Hình vuông', '🔵 Hình tròn', '🔺 Tam giác'], h: 'Giống cái cửa ra vào hoặc quyển vở của bé.' },
    { q: 'Miếng bánh pizza cắt ra có dạng gần giống hình gì?', a: '🔺 Tam giác', w: ['⭕ Hình tròn', '⬛ Hình vuông', '➖ Đường thẳng'], h: 'Một đầu nhọn, một đầu to.' },
    { q: 'Đâu là hình thoi (như con diều)?', a: '🔷 Hình thoi', w: ['⭕ Hình tròn', '🔺 Tam giác', '⭐ Ngôi sao'], h: 'Giống cánh diều bé thả, đứng trên một góc nhọn.' },
    { q: 'Mặt trăng đêm mùng một có dạng gì?', a: '🌙 Trăng lưỡi liềm', w: ['⭕ Hình tròn', '🟦 Hình vuông', '🔺 Tam giác'], h: 'Nó cong cong như một cái móc.' },
    { q: 'Hình nào có 5 cánh?', a: '⭐ Ngôi sao', w: ['🔺 Tam giác', '🟪 Hình vuông', '🔵 Hình tròn'], h: 'Bé đếm các cánh nhọn nhé: 1, 2, 3, 4, 5.' },
    { q: 'Đồng hồ treo tường thường có dạng hình gì?', a: '⭕ Hình tròn', w: ['🔺 Tam giác', '⭐ Ngôi sao', '❤️ Trái tim'], h: 'Kim quay vòng quanh nên mặt nó tròn.' },
    { q: 'Viên xúc xắc có các mặt hình gì?', a: '⬛ Hình vuông', w: ['⭕ Hình tròn', '🔺 Tam giác', '🌙 Lưỡi liềm'], h: 'Sáu mặt giống hệt nhau, mỗi mặt bốn cạnh bằng nhau.' },
    { q: 'Cái nón lá của bà có dạng gần giống hình gì?', a: '🔺 Tam giác', w: ['⬛ Hình vuông', '⭕ Hình tròn', '▭ Hình chữ nhật'], h: 'Nhìn từ bên cạnh thì đỉnh nhọn, đáy rộng.' },
    { q: 'Hình nào lăn được?', a: '⭕ Hình tròn', w: ['⬛ Hình vuông', '🔺 Tam giác', '▭ Hình chữ nhật'], h: 'Hình có góc thì lăn sẽ bị vướng đó bé.' },
    { q: 'Cửa ra vào nhà bé thường có dạng hình gì?', a: '▭ Hình chữ nhật', w: ['⭕ Hình tròn', '⭐ Ngôi sao', '🔺 Tam giác'], h: 'Nó cao và hẹp, có 4 góc vuông.' },
    { q: 'Hình nào có nhiều cạnh nhất?', a: '⬛ Hình vuông', w: ['🔺 Tam giác', '➖ Đường thẳng', '⭕ Hình tròn'], h: 'Tam giác 3 cạnh, hình vuông thì mấy cạnh nhỉ?' },
    { q: 'Quả trứng có dạng gần giống hình gì?', a: '🥚 Hình bầu dục', w: ['⬛ Hình vuông', '🔺 Tam giác', '⭐ Ngôi sao'], h: 'Giống hình tròn nhưng bị kéo dài ra một chút.' }
  ];

  function genShape() { return fromBank('shape', 'shape', SHAPES); }

  /* ============================================================
     7. CHỮ CÁI
     ============================================================ */
  const ALPHABET = ['A', 'Ă', 'Â', 'B', 'C', 'D', 'Đ', 'E', 'Ê', 'G', 'H', 'I', 'K',
    'L', 'M', 'N', 'O', 'Ô', 'Ơ', 'P', 'Q', 'R', 'S', 'T', 'U', 'Ư', 'V', 'X', 'Y'];

  const WORDS = [
    { w: 'MÈO', e: '🐱', l: 'M' }, { w: 'CHÓ', e: '🐶', l: 'C' },
    { w: 'GÀ', e: '🐔', l: 'G' }, { w: 'BÒ', e: '🐮', l: 'B' },
    { w: 'CÁ', e: '🐟', l: 'C' }, { w: 'VOI', e: '🐘', l: 'V' },
    { w: 'HOA', e: '🌸', l: 'H' }, { w: 'NHÀ', e: '🏠', l: 'N' },
    { w: 'KẸO', e: '🍬', l: 'K' }, { w: 'SÁCH', e: '📚', l: 'S' },
    { w: 'TÁO', e: '🍎', l: 'T' }, { w: 'DỪA', e: '🥥', l: 'D' },
    { w: 'LÁ', e: '🍃', l: 'L' }, { w: 'BÚT', e: '✏️', l: 'B' },
    { w: 'GẤU', e: '🐻', l: 'G' }, { w: 'XE', e: '🚗', l: 'X' },
    { w: 'ONG', e: '🐝', l: 'O' }, { w: 'MŨ', e: '👒', l: 'M' },
    { w: 'RÙA', e: '🐢', l: 'R' }, { w: 'THỎ', e: '🐰', l: 'T' },
    { w: 'QUẢ', e: '🍐', l: 'Q' }, { w: 'PHỞ', e: '🍜', l: 'P' },
    { w: 'ÊCH', e: '🐸', l: 'Ê' }, { w: 'ĐÈN', e: '💡', l: 'Đ' },
    { w: 'ÁO', e: '👕', l: 'A' }, { w: 'ỐC', e: '🐌', l: 'Ô' }
  ];

  function genLetter(diff) {
    const kind = Math.random();

    /* a) chữ cái đầu của từ */
    if (kind < 0.5) {
      const it = pickUnused('word', WORDS);
      const wrongs = shuffle(ALPHABET.filter(c => c !== it.l)).slice(0, 3);
      const made = build({ label: it.l }, wrongs.map(c => ({ label: c })));
      return {
        topic: 'letter',
        prompt: `Từ "${it.w}" bắt đầu bằng chữ gì?`,
        speak: `Từ ${it.w} bắt đầu bằng chữ gì?`,
        hint: `Bé đọc chậm chậm: "${it.w}"... âm đầu tiên nghe như chữ gì nào?`,
        explain: {
          text: `${it.w} — chữ đứng đầu tiên là chữ ${it.l}.`,
          visual: { type: 'emoji', value: `${it.e} ${it.l}${it.w.slice(1).toLowerCase()}` }
        },
        visual: { type: 'emoji', value: it.e },
        answers: made.answers, correct: made.correct
      };
    }

    /* b) từ nào bắt đầu bằng chữ ... */
    if (kind < 0.8) {
      const it = pickUnused('word2', WORDS);
      const others = shuffle(WORDS.filter(x => x.l !== it.l)).slice(0, 3);
      const made = build({ label: `${it.e} ${it.w}` }, others.map(x => ({ label: `${x.e} ${x.w}` })));
      return {
        topic: 'letter',
        prompt: `Từ nào bắt đầu bằng chữ "${it.l}"?`,
        speak: `Từ nào bắt đầu bằng chữ ${it.l}?`,
        hint: `Bé đọc thầm từng từ, để ý âm đầu tiên xem có phải chữ ${it.l} không.`,
        explain: {
          text: `${it.w} bắt đầu bằng chữ ${it.l}.`,
          visual: { type: 'emoji', value: `${it.e} ${it.w}` }
        },
        visual: { type: 'emoji', value: '🔤' },
        answers: made.answers, correct: made.correct
      };
    }

    /* c) chữ đứng sau trong bảng chữ cái */
    const i = rnd(ALPHABET.length - 1);
    const res = ALPHABET[i + 1];
    const wrongs = shuffle(ALPHABET.filter(c => c !== res && c !== ALPHABET[i])).slice(0, 3);
    const made = build({ label: res }, wrongs.map(c => ({ label: c })));
    return {
      topic: 'letter',
      prompt: `Chữ nào đứng ngay sau chữ "${ALPHABET[i]}"?`,
      speak: `Chữ nào đứng ngay sau chữ ${ALPHABET[i]}?`,
      hint: 'Bé đọc bảng chữ cái: a, ă, â, b, c, d, đ, e, ê, g, h...',
      explain: {
        text: `Trong bảng chữ cái: ... ${ALPHABET.slice(Math.max(0, i - 1), i + 2).join(', ')} ...`,
        visual: { type: 'none' }
      },
      visual: { type: 'emoji', value: '🔤' },
      answers: made.answers, correct: made.correct
    };
  }

  /* ============================================================
     8. ĐỜI SỐNG: giờ giấc, tiền, ngày trong tuần
     ============================================================ */
  const WEEKDAYS = ['Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ Nhật'];

  function genClock(diff) {
    const h = 1 + rnd(12);
    const half = diff >= 3 && Math.random() < 0.4;
    const m = half ? 30 : 0;
    const label = half ? `${h} giờ 30` : `${h} giờ`;

    const wrongSet = new Set();
    while (wrongSet.size < 3) {
      const wh = 1 + rnd(12);
      const wm = Math.random() < 0.3 ? 30 : 0;
      const wl = wm === 30 ? `${wh} giờ 30` : `${wh} giờ`;
      if (wl !== label) wrongSet.add(wl);
    }

    const made = build({ label }, [...wrongSet].map(x => ({ label: x })));
    return {
      topic: 'life',
      prompt: 'Đồng hồ chỉ mấy giờ?',
      speak: 'Đồng hồ chỉ mấy giờ?',
      hint: half
        ? 'Kim dài chỉ số 6 nghĩa là 30 phút. Kim ngắn vừa đi qua số mấy thì là giờ đó.'
        : 'Kim dài chỉ số 12 nghĩa là đúng giờ. Bé xem kim ngắn chỉ vào số mấy nhé.',
      explain: {
        text: `Kim ngắn chỉ số ${h}, kim dài chỉ số ${half ? '6 (tức 30 phút)' : '12 (đúng giờ)'} → ${label}.`,
        visual: { type: 'html', value: global.Sprites ? Sprites.clock(h, m) : '' }
      },
      visual: { type: 'html', value: global.Sprites ? Sprites.clock(h, m) : '' },
      answers: made.answers, correct: made.correct
    };
  }

  function genMoney(diff) {
    const notes = diff === 1 ? [1, 2] : diff === 2 ? [1, 2, 5] : [1, 2, 5, 10];
    const a = pick(notes), b = pick(notes);
    const res = a + b;
    const fmt = n => (n * 1000).toLocaleString('vi-VN');

    const wrongs = [];
    for (const d of shuffle([1, -1, 2, -2, 3, 5])) {
      const v = res + d;
      if (v > 0 && v !== res && !wrongs.includes(v)) wrongs.push(v);
      if (wrongs.length === 3) break;
    }
    const made = build({ label: fmt(res) + 'đ' }, wrongs.map(w => ({ label: fmt(w) + 'đ' })));

    return {
      topic: 'life',
      prompt: `Bé có ${fmt(a)}đ và ${fmt(b)}đ. Tất cả là bao nhiêu?`,
      speak: `Bé có ${a} nghìn đồng và ${b} nghìn đồng. Tất cả là bao nhiêu nghìn đồng?`,
      hint: `Bé tính ${a} + ${b} nghìn là ra rồi đó!`,
      explain: {
        text: `${a} nghìn + ${b} nghìn = ${res} nghìn, tức ${fmt(res)} đồng.`,
        visual: { type: 'emoji', value: '💵'.repeat(a) + ' ➕ ' + '💵'.repeat(b) }
      },
      visual: { type: 'emoji', value: '💵'.repeat(a) + ' ➕ ' + '💵'.repeat(b) },
      answers: made.answers, correct: made.correct
    };
  }

  function genWeekday() {
    const i = rnd(WEEKDAYS.length);
    const after = Math.random() < 0.5;
    const j = after ? (i + 1) % WEEKDAYS.length : (i + WEEKDAYS.length - 1) % WEEKDAYS.length;
    const res = WEEKDAYS[j];
    const wrongs = shuffle(WEEKDAYS.filter(d => d !== res && d !== WEEKDAYS[i])).slice(0, 3);
    const made = build({ label: res }, wrongs.map(d => ({ label: d })));

    return {
      topic: 'life',
      prompt: after ? `Sau ${WEEKDAYS[i]} là thứ mấy?` : `Trước ${WEEKDAYS[i]} là thứ mấy?`,
      speak: after ? `Sau ${WEEKDAYS[i]} là thứ mấy?` : `Trước ${WEEKDAYS[i]} là thứ mấy?`,
      hint: 'Một tuần có: Thứ Hai, Thứ Ba, Thứ Tư, Thứ Năm, Thứ Sáu, Thứ Bảy, Chủ Nhật.',
      explain: {
        text: `Thứ tự trong tuần: ${WEEKDAYS.join(' → ')}. Vậy ${after ? 'sau' : 'trước'} ${WEEKDAYS[i]} là ${res}.`,
        visual: { type: 'none' }
      },
      visual: { type: 'emoji', value: '📅' },
      answers: made.answers, correct: made.correct
    };
  }

  function genLife(diff) {
    const r = Math.random();
    if (r < 0.45) return genClock(diff);
    if (r < 0.8) return genMoney(diff);
    return genWeekday();
  }

  /* ============================================================
     Bộ sinh theo chủ đề
     ============================================================ */
  function genMath(diff) {
    const r = Math.random();
    if (r < 0.6) return genAdd(diff);
    if (r < 0.85) return genCompare(diff);
    return genShare(diff);
  }

  function genCounting(diff) {
    const r = Math.random();
    if (r < 0.5) return genCount(diff);
    if (r < 0.78) return genNeighbor(diff);
    return genSequence(diff);
  }

  const TOPICS = [
    { key: 'math', name: 'Phép tính', icon: '➕', color: '#ff8fab' },
    { key: 'count', name: 'Đếm số', icon: '🔢', color: '#7ed957' },
    { key: 'color', name: 'Màu sắc', icon: '🎨', color: '#4cc9f0' },
    { key: 'animal', name: 'Con vật', icon: '🐻', color: '#ffb703' },
    { key: 'riddle', name: 'Câu đố', icon: '🧩', color: '#c77dff' },
    { key: 'shape', name: 'Hình khối', icon: '🔷', color: '#4ecdc4' },
    { key: 'letter', name: 'Chữ cái', icon: '🔤', color: '#f4845f' },
    { key: 'life', name: 'Giờ & Tiền', icon: '⏰', color: '#90be6d' },
    { key: 'mix', name: 'Tổng hợp', icon: '🎲', color: '#ff6b6b' }
  ];

  const GEN = {
    math: genMath, count: genCounting, color: genColor,
    animal: genAnimal, riddle: genRiddle, shape: genShape,
    letter: genLetter, life: genLife
  };

  let lastPrompt = '';

  function make(topicKey, diff) {
    const keys = Object.keys(GEN);
    let q = null;
    for (let t = 0; t < 8; t++) {
      const key = (!topicKey || topicKey === 'mix') ? pick(keys) : topicKey;
      q = (GEN[key] || genMath)(diff || 1);
      if (q.prompt !== lastPrompt) break;
    }
    lastPrompt = q.prompt;
    return q;
  }

  global.Questions = {
    TOPICS, make, plain, shuffle,
    topicName: k => (TOPICS.find(t => t.key === k) || { name: 'Câu hỏi' }).name,
    topicIcon: k => (TOPICS.find(t => t.key === k) || { icon: '❓' }).icon,
    bankSize: { animal: ANIMALS.length, riddle: RIDDLES.length, shape: SHAPES.length, word: WORDS.length }
  };
})(window);
