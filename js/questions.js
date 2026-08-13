/* ============================================================
   CHIẾN SĨ DÒ MÌN - Ngân hàng câu hỏi
   Mỗi câu hỏi có dạng:
   {
     topic:   'math',
     prompt:  'Chuỗi hiển thị',
     speak:   'Chuỗi để đọc thành tiếng',
     visual:  {type:'emoji'|'swatch'|'none', value:'...'},
     hint:    'Gợi ý khi bé dùng kính lúp',
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
    if (!usedBank[key] || usedBank[key].length >= list.length) usedBank[key] = [];
    let idx;
    let guard = 0;
    do { idx = rnd(list.length); guard++; } while (usedBank[key].includes(idx) && guard < 60);
    usedBank[key].push(idx);
    return list[idx];
  }

  /* ============================================================
     1. PHÉP TÍNH
     ============================================================ */
  const COUNT_ICONS = ['🍎', '🍌', '🐥', '⭐', '🎈', '🌸', '🍓', '🐝', '🚗', '🐟', '🧁', '🐞'];

  function genMath(diff) {
    const max = diff === 1 ? 5 : diff === 2 ? 10 : 20;
    const kinds = diff === 1 ? ['+'] : diff === 2 ? ['+', '-'] : ['+', '-', '-', '+'];
    const op = pick(kinds);
    let a, b, res, prompt, speak, hint, visual = null;

    if (op === '+') {
      a = 1 + rnd(max - 1);
      b = 1 + rnd(Math.max(1, max - a));
      res = a + b;
      prompt = `${a} + ${b} = ?`;
      speak = `${a} cộng ${b} bằng mấy?`;
      hint = `Bé có ${a} rồi lấy thêm ${b} nữa. Đếm tiếp từ ${a}: ${
        Array.from({ length: b }, (_, i) => a + i + 1).join(', ')
      }.`;
      if (res <= 10) {
        const ic = pick(COUNT_ICONS);
        visual = { type: 'emoji', value: ic.repeat(a) + ' ➕ ' + ic.repeat(b) };
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
      if (a <= 10) {
        const ic = pick(COUNT_ICONS);
        visual = { type: 'emoji', value: ic.repeat(res) + '❌'.repeat(b) };
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

    const made = build(
      { label: String(res) },
      wrongs.map(w => ({ label: String(w) }))
    );

    return {
      topic: 'math', prompt, speak, hint,
      visual: visual || { type: 'none' },
      answers: made.answers, correct: made.correct
    };
  }

  /* ============================================================
     2. ĐẾM SỐ LƯỢNG
     ============================================================ */
  function genCount(diff) {
    const max = diff === 1 ? 5 : diff === 2 ? 9 : 14;
    const n = 1 + rnd(max);
    const ic = pick(COUNT_ICONS);
    const NAMES = {
      '🍎': 'quả táo', '🍌': 'quả chuối', '🐥': 'chú gà con', '⭐': 'ngôi sao',
      '🎈': 'quả bóng bay', '🌸': 'bông hoa', '🍓': 'quả dâu', '🐝': 'chú ong',
      '🚗': 'chiếc ô tô', '🐟': 'con cá', '🧁': 'chiếc bánh', '🐞': 'con bọ rùa'
    };
    const name = NAMES[ic] || 'món đồ';

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
      visual: { type: 'emoji', value: ic.repeat(n) },
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
    { name: 'Trắng', hex: '#f8fafc' }
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
    { emoji: '🌷', name: 'bông hoa tulip hồng', color: 'Hồng' }
  ];

  function colorAnswer(c) {
    return { label: c.name, color: c.hex };
  }

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
      hint: `Ô màu này giống màu của ${
        right.name === 'Đỏ' ? 'quả cà chua' :
        right.name === 'Vàng' ? 'quả chuối chín' :
        right.name === 'Xanh lá' ? 'chiếc lá cây' :
        right.name === 'Xanh dương' ? 'bầu trời' :
        right.name === 'Cam' ? 'củ cà rốt' :
        right.name === 'Tím' ? 'quả nho tím' :
        right.name === 'Hồng' ? 'bông hoa hồng phấn' :
        right.name === 'Nâu' ? 'thanh sô cô la' :
        right.name === 'Đen' ? 'ban đêm' : 'bông tuyết'
      } đó bé!`,
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
    { q: 'Con vật nào thích ăn cà rốt?', a: '🐰 Thỏ', w: ['🐊 Cá sấu', '🐻 Gấu', '🐬 Cá heo'], h: 'Bạn ấy có hai tai dài và nhảy tưng tưng.' }
  ];

  function genAnimal() {
    const it = pickUnused('animal', ANIMALS);
    const made = build({ label: it.a }, it.w.map(x => ({ label: x })));
    return {
      topic: 'animal', prompt: it.q, speak: plain(it.q), hint: it.h,
      visual: { type: 'none' },
      answers: made.answers, correct: made.correct
    };
  }

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
    { q: 'Mùa nào bé được nghỉ hè, đi biển tắm mát?', a: '☀️ Mùa hè', w: ['❄️ Mùa đông', '🍂 Mùa thu', '🌷 Mùa xuân'], h: 'Mùa nóng nhất trong năm, ve kêu râm ran.' }
  ];

  function genRiddle() {
    const it = pickUnused('riddle', RIDDLES);
    const made = build({ label: it.a }, it.w.map(x => ({ label: x })));
    return {
      topic: 'riddle', prompt: it.q, speak: plain(it.q), hint: it.h,
      visual: { type: 'emoji', value: '❓' },
      answers: made.answers, correct: made.correct
    };
  }

  /* ============================================================
     6. HÌNH KHỐI
     ============================================================ */
  const SHAPES = [
    { q: 'Đâu là hình tròn?', a: '🔵 Hình tròn', w: ['🔺 Tam giác', '🟨 Hình vuông', '⭐ Ngôi sao'], h: 'Hình tròn lăn được, không có góc nhọn nào cả.' },
    { q: 'Hình nào có 3 cạnh?', a: '🔺 Tam giác', w: ['🔵 Hình tròn', '🟩 Hình vuông', '❤️ Trái tim'], h: 'Bé đếm các cạnh nhé: 1, 2, 3 cạnh.' },
    { q: 'Hình nào có 4 cạnh bằng nhau?', a: '🟦 Hình vuông', w: ['🔺 Tam giác', '⭕ Hình tròn', '🌙 Trăng lưỡi liềm'], h: 'Bốn cạnh dài bằng nhau, giống viên gạch vuông.' },
    { q: 'Đâu là ngôi sao?', a: '⭐ Ngôi sao', w: ['🟪 Hình vuông', '🔻 Tam giác', '🔴 Hình tròn'], h: 'Nó có 5 cánh nhọn và lấp lánh trên trời đêm.' },
    { q: 'Quả bóng có dạng hình gì?', a: '⭕ Hình tròn', w: ['⬛ Hình vuông', '🔺 Tam giác', '➖ Đường thẳng'], h: 'Vật gì lăn được thì thường tròn đó bé.' },
    { q: 'Mái nhà thường có dạng hình gì?', a: '🔺 Tam giác', w: ['⭕ Hình tròn', '⭐ Ngôi sao', '❤️ Trái tim'], h: 'Bé nhìn nóc nhà: hai mái chụm lại thành ba cạnh.' }
  ];

  function genShape() {
    const it = pickUnused('shape', SHAPES);
    const made = build({ label: it.a }, it.w.map(x => ({ label: x })));
    return {
      topic: 'shape', prompt: it.q, speak: plain(it.q), hint: it.h,
      visual: { type: 'none' },
      answers: made.answers, correct: made.correct
    };
  }

  /* ============================================================
     Danh sách chủ đề + bộ sinh câu hỏi
     ============================================================ */
  const TOPICS = [
    { key: 'math', name: 'Phép tính', icon: '➕', color: '#ff8fab' },
    { key: 'count', name: 'Đếm số', icon: '🔢', color: '#7ed957' },
    { key: 'color', name: 'Màu sắc', icon: '🎨', color: '#4cc9f0' },
    { key: 'animal', name: 'Con vật', icon: '🐻', color: '#ffb703' },
    { key: 'riddle', name: 'Câu đố', icon: '🧩', color: '#c77dff' },
    { key: 'shape', name: 'Hình khối', icon: '🔷', color: '#4ecdc4' },
    { key: 'mix', name: 'Tổng hợp', icon: '🎲', color: '#ff6b6b' }
  ];

  const GEN = {
    math: genMath, count: genCount, color: genColor,
    animal: genAnimal, riddle: genRiddle, shape: genShape
  };

  let lastPrompt = '';

  function make(topicKey, diff) {
    const keys = Object.keys(GEN);
    let q = null;
    for (let t = 0; t < 8; t++) {
      const key = topicKey === 'mix' ? pick(keys) : topicKey;
      q = (GEN[key] || genMath)(diff || 1);
      if (q.prompt !== lastPrompt) break;
    }
    lastPrompt = q.prompt;
    return q;
  }

  global.Questions = {
    TOPICS,
    make,
    plain,
    topicName: k => (TOPICS.find(t => t.key === k) || { name: 'Câu hỏi' }).name,
    topicIcon: k => (TOPICS.find(t => t.key === k) || { icon: '❓' }).icon
  };
})(window);
