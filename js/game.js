/* ============================================================
   CHIẾN SĨ DÒ MÌN - Logic trò chơi
   ============================================================ */
(function (global) {
  'use strict';

  const QUESTIONS_PER_LEVEL = 8;   // số câu mỗi chặng
  const TERRAIN_EVERY = 3;         // cứ 3 câu đúng thì đổi địa hình
  const WALK_MS = 750;

  /* 4 vị trí đặt hoa mìn (% của sân chơi) */
  /* Sân dọc/vuông: 4 hoa xếp 2 hàng. */
  const SPOTS_TALL = [
    { x: 21, y: 25 }, { x: 74, y: 21 },
    { x: 17, y: 57 }, { x: 73, y: 60 }
  ];
  /* Sân rất ngang (điện thoại xoay ngang): xếp thành vòng cung một hàng,
     nếu không hoa hàng trên sẽ đè lên hàng dưới. */
  const SPOTS_WIDE = [
    { x: 12, y: 33 }, { x: 37, y: 20 },
    { x: 63, y: 20 }, { x: 88, y: 33 }
  ];
  const HOME = { x: 46, y: 86 };

  function currentSpots() {
    const r = el.stage.getBoundingClientRect();
    return (r.width / Math.max(1, r.height) >= 2) ? SPOTS_WIDE : SPOTS_TALL;
  }

  const $ = id => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);

  /* ---------- tham chiếu DOM ---------- */
  const el = {};
  const IDS = ['hud', 'hudLevel', 'hudScore', 'hudStreak', 'hudStreakChip', 'trail',
    'btnMusic', 'btnVoice', 'btnPause', 'questionCard', 'qBadge', 'qText', 'qVisual',
    'btnSpeak', 'hintBubble', 'hintText', 'stage', 'layerFar', 'layerMid', 'groundDeco',
    'field', 'hero', 'heroInner', 'shieldAura', 'fx', 'terrainName', 'items',
    'itemHint', 'itemFifty', 'itemShield', 'cntHint', 'cntFifty', 'cntShield',
    'splash', 'startLine', 'btnInstall', 'btnFull', 'iosTip',
    'menu', 'menuHero', 'topics', 'levels', 'btnStart', 'bestScore',
    'winScreen', 'winTitle', 'winStars', 'winScore', 'winMsg', 'winReward',
    'btnNext', 'btnHome', 'pauseScreen', 'btnResume', 'btnQuit', 'toastWrap'];

  /* ---------- trạng thái ---------- */
  const G = {
    screen: 'menu',
    topic: 'mix',
    baseDiff: 1,
    level: 1,
    qIndex: 0,
    score: 0,
    levelScore: 0,
    streak: 0,
    bestStreak: 0,
    mistakes: 0,
    totalCorrect: 0,
    terrainIdx: 0,
    items: { hint: 1, fifty: 1, shield: 1 },
    shieldOn: false,
    busy: true,
    q: null,
    mines: [],
    firstTry: true,
    stepTimer: null
  };

  const ITEM_INFO = {
    hint: { ico: '🔍', name: 'Kính lúp' },
    fifty: { ico: '✂️', name: '50 : 50' },
    shield: { ico: '💖', name: 'Tim chống bom' }
  };

  /* ============================================================
     LƯU TRỮ
     ============================================================ */
  const store = {
    get(k, d) {
      try { const v = localStorage.getItem('domin_' + k); return v === null ? d : JSON.parse(v); }
      catch (e) { return d; }
    },
    set(k, v) { try { localStorage.setItem('domin_' + k, JSON.stringify(v)); } catch (e) {} }
  };

  /* ============================================================
     TIỆN ÍCH GIAO DIỆN
     ============================================================ */
  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    el.toastWrap.appendChild(t);
    setTimeout(() => t.remove(), 2300);
  }

  function popText(text, x, y) {
    const p = document.createElement('div');
    p.className = 'pop-text';
    p.textContent = text;
    p.style.setProperty('--x', x + '%');
    p.style.setProperty('--y', y + '%');
    el.fx.appendChild(p);
    setTimeout(() => p.remove(), 1200);
  }

  function particles(x, y, chars, count, spread) {
    for (let i = 0; i < count; i++) {
      const s = document.createElement('div');
      s.className = 'piece';
      s.textContent = chars[i % chars.length];
      const ang = (Math.PI * 2 * i) / count + rnd(-0.3, 0.3);
      const dist = rnd(spread * 0.5, spread);
      s.style.setProperty('--x', x + '%');
      s.style.setProperty('--y', y + '%');
      s.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      s.style.setProperty('--dy', Math.sin(ang) * dist + 'px');
      s.style.setProperty('--rot', rnd(-540, 540).toFixed(0) + 'deg');
      s.style.setProperty('--t', rnd(0.7, 1.2).toFixed(2) + 's');
      el.fx.appendChild(s);
      setTimeout(() => s.remove(), 1400);
    }
  }

  function confetti() {
    const chars = ['🎉', '⭐', '🎊', '🌟', '💫', '🎈', '🌸'];
    for (let i = 0; i < 26; i++) {
      const s = document.createElement('div');
      s.className = 'piece';
      s.textContent = chars[i % chars.length];
      s.style.setProperty('--x', rnd(5, 95) + '%');
      s.style.setProperty('--y', '-8%');
      s.style.setProperty('--dx', rnd(-40, 40) + 'px');
      s.style.setProperty('--dy', rnd(220, 420) + 'px');
      s.style.setProperty('--rot', rnd(-720, 720).toFixed(0) + 'deg');
      s.style.setProperty('--t', rnd(1.1, 2).toFixed(2) + 's');
      el.fx.appendChild(s);
      setTimeout(() => s.remove(), 2100);
    }
  }

  /* ============================================================
     ĐỊA HÌNH
     ============================================================ */
  function applyTerrain(showName) {
    const t = Sprites.TERRAINS[G.terrainIdx % Sprites.TERRAINS.length];
    el.stage.dataset.terrain = t.key;
    Sprites.decorate(t, { far: el.layerFar, mid: el.layerMid, ground: el.groundDeco });
    if (showName) {
      el.terrainName.textContent = t.name;
      el.terrainName.classList.remove('show');
      void el.terrainName.offsetWidth;
      el.terrainName.classList.add('show');
    }
  }

  /* ============================================================
     NHÂN VẬT
     ============================================================ */
  function heroTo(x, y) {
    const cur = parseFloat(el.hero.style.left) || HOME.x;
    el.hero.classList.toggle('flip', x < cur - 1);
    el.hero.style.left = x + '%';
    el.hero.style.top = y + '%';
  }

  function heroJump(x, y) {
    const tr = el.hero.style.transition;
    el.hero.style.transition = 'none';
    el.hero.style.left = x + '%';
    el.hero.style.top = y + '%';
    void el.hero.offsetWidth;
    el.hero.style.transition = tr || '';
  }

  function startWalk() {
    el.hero.classList.add('walking');
    clearInterval(G.stepTimer);
    Sound.step();
    G.stepTimer = setInterval(() => Sound.step(), 200);
  }

  function stopWalk() {
    el.hero.classList.remove('walking');
    clearInterval(G.stepTimer);
    G.stepTimer = null;
  }

  /* ============================================================
     DỰNG CÂU HỎI
     ============================================================ */
  function renderTrail() {
    let html = '';
    for (let i = 0; i < QUESTIONS_PER_LEVEL; i++) {
      const cls = i < G.qIndex ? 'done' : (i === G.qIndex ? 'now' : '');
      html += `<i class="${cls}"></i>`;
    }
    html += '<span class="flag">🚩</span>';
    el.trail.innerHTML = html;
  }

  function renderQuestion(q) {
    el.qBadge.textContent = Questions.topicIcon(q.topic) + ' ' + Questions.topicName(q.topic);
    el.qText.textContent = q.prompt;

    if (q.visual && q.visual.type === 'emoji') {
      el.qVisual.textContent = q.visual.value;
      el.qVisual.hidden = false;
    } else if (q.visual && q.visual.type === 'swatch') {
      el.qVisual.innerHTML = `<span class="swatch-big" style="background:${q.visual.value}"></span>`;
      el.qVisual.hidden = false;
    } else {
      el.qVisual.textContent = '';
      el.qVisual.hidden = true;
    }

    el.questionCard.classList.remove('swap');
    void el.questionCard.offsetWidth;
    el.questionCard.classList.add('swap');

    el.hintBubble.hidden = true;
  }

  function renderMines(q) {
    el.field.innerHTML = '';
    G.mines = [];

    const order = [0, 1, 2, 3];
    const spots = currentSpots();
    lastLayout = spots === SPOTS_WIDE ? 'wide' : 'tall';
    const jit = spots === SPOTS_WIDE ? 1.5 : 3;
    q.answers.forEach((ans, i) => {
      const spot = spots[order[i]];
      const x = spot.x + rnd(-jit, jit);
      const y = spot.y + rnd(-jit * 0.8, jit * 0.8);

      const b = document.createElement('button');
      b.className = 'mine';
      b.style.setProperty('--x', x.toFixed(2) + '%');
      b.style.setProperty('--y', y.toFixed(2) + '%');
      b.style.setProperty('--in', (i * 0.09).toFixed(2) + 's');
      b.dataset.index = i;
      b.setAttribute('aria-label', 'Đáp án ' + (i + 1) + ': ' + Questions.plain(ans.label));

      /* tách emoji đứng đầu ra một dòng riêng cho dễ nhìn: 🐱 / Mèo */
      const em = /^([\p{Extended_Pictographic}️‍]+)\s+([\s\S]+)$/u.exec(ans.label);
      const text = em ? em[2] : ans.label;
      const inner = em ? `<span class="ans-ico">${em[1]}</span>${em[2]}` : ans.label;
      const size = (text.length <= 3 && !ans.color) ? ' big' : (text.length > 9 ? ' small' : '');
      const swatch = ans.color
        ? `<span class="swatch" style="background:${ans.color}"></span>` : '';

      b.innerHTML =
        `<div class="mine-art">${Sprites.flower(order[i])}</div>` +
        `<div class="mine-label${size}">${swatch}${inner}</div>` +
        `<div class="stem"></div>`;

      b.addEventListener('click', () => choose(i, b, x, y));
      el.field.appendChild(b);
      G.mines.push({ el: b, x, y, dead: false, index: i });
    });
  }

  /* Xoay màn hình giữa chừng: dời hoa sang bố cục mới, giữ nguyên hoa đã nổ */
  let lastLayout = null;

  function relayoutMines() {
    const spots = currentSpots();
    const mode = spots === SPOTS_WIDE ? 'wide' : 'tall';
    if (mode === lastLayout || !G.mines.length) { lastLayout = mode; return; }
    lastLayout = mode;
    G.mines.forEach((m, i) => {
      const s = spots[i];
      m.x = s.x; m.y = s.y;
      m.el.style.setProperty('--x', s.x + '%');
      m.el.style.setProperty('--y', s.y + '%');
    });
  }

  function speakQuestion() {
    const q = G.q;
    if (!q) return;
    let txt = q.speak || q.prompt;
    if (q.visual && q.visual.type === 'emoji' && q.topic === 'count') txt = q.speak;
    el.btnSpeak.classList.add('talking');
    setTimeout(() => el.btnSpeak.classList.remove('talking'), 2200);
    Sound.speak(txt);
  }

  function nextQuestion() {
    G.q = Questions.make(G.topic, effectiveDiff());
    G.firstTry = true;
    renderQuestion(G.q);
    renderMines(G.q);
    renderTrail();
    heroTo(HOME.x, HOME.y);
    G.busy = false;
    setTimeout(speakQuestion, 380);
  }

  function effectiveDiff() {
    return Math.min(3, G.baseDiff + Math.floor((G.level - 1) / 3));
  }

  /* ============================================================
     CHỌN ĐÁP ÁN
     ============================================================ */
  function choose(i, btn, x, y) {
    if (G.busy || G.screen !== 'play') return;
    const mine = G.mines[i];
    if (!mine || mine.dead) return;

    G.busy = true;
    Sound.resume();
    Sound.shutUp();
    el.hintBubble.hidden = true;
    btn.classList.add('picked');

    startWalk();
    heroTo(x, Math.min(y + 14, 88));

    setTimeout(() => {
      stopWalk();
      if (i === G.q.correct) onCorrect(mine);
      else onWrong(mine);
    }, WALK_MS + 60);
  }

  /* ---------- ĐÚNG ---------- */
  function onCorrect(mine) {
    Sound.correct();
    mine.el.classList.add('win');
    el.hero.classList.add('cheer');
    setTimeout(() => el.hero.classList.remove('cheer'), 1100);

    particles(mine.x, mine.y, ['⭐', '✨', '💛', '🌟', '💫'], 12, 130);
    popText(pickPraise(), mine.x, mine.y);
    if (global.PWA) PWA.buzz(35);

    const gained = G.firstTry ? 10 : 5;
    G.score += gained;
    G.levelScore += gained;
    G.streak++;
    G.bestStreak = Math.max(G.bestStreak, G.streak);
    G.totalCorrect++;
    G.qIndex++;

    el.hudScore.textContent = G.score;
    el.hudStreak.textContent = G.streak;
    el.hudStreakChip.classList.add('pop');
    setTimeout(() => el.hudStreakChip.classList.remove('pop'), 260);
    renderTrail();

    if (G.shieldOn) setShield(false);

    /* thưởng vật phẩm khi trả lời đúng liên tiếp */
    if (G.streak > 0 && G.streak % 3 === 0) setTimeout(() => giveRandomItem(), 700);

    Sound.speak(pickPraiseVoice());

    setTimeout(() => {
      if (G.qIndex >= QUESTIONS_PER_LEVEL) {
        levelComplete();
      } else if (G.totalCorrect % TERRAIN_EVERY === 0) {
        marchForward();
      } else {
        nextQuestion();
      }
    }, 1150);
  }

  const PRAISES = ['GIỎI QUÁ!', 'CHÍNH XÁC!', 'TUYỆT VỜI!', 'XUẤT SẮC!', 'HOAN HÔ!'];
  const PRAISE_VOICE = ['Giỏi quá!', 'Chính xác rồi!', 'Tuyệt vời!', 'Bé giỏi lắm!', 'Hoan hô chiến sĩ nhí!'];
  let praiseIdx = 0;
  function pickPraise() { return PRAISES[(praiseIdx++) % PRAISES.length]; }
  function pickPraiseVoice() { return PRAISE_VOICE[praiseIdx % PRAISE_VOICE.length]; }

  /* ---------- SAI ---------- */
  function onWrong(mine) {
    G.firstTry = false;
    mine.dead = true;

    /* Trái tim chống bom cứu bé */
    if (G.shieldOn) {
      setShield(false);
      Sound.shield();
      mine.el.classList.add('dead');
      particles(mine.x, mine.y, ['💖', '✨', '💗'], 8, 90);
      popText('ĐƯỢC BẢO VỆ!', mine.x, mine.y);
      toast('💖 Trái tim đã che chở cho bé!');
      Sound.speak('Trái tim đã cứu bé! Thử đáp án khác nhé.');
      G.busy = false;
      return;
    }

    /* nổ mìn */
    Sound.wrong();
    if (global.PWA) PWA.buzz([0, 70, 50, 110]);
    boom(mine.x, mine.y);
    el.stage.classList.add('shake');
    setTimeout(() => el.stage.classList.remove('shake'), 520);

    mine.el.classList.add('dead');
    G.streak = 0;
    G.mistakes++;
    el.hudStreak.textContent = 0;

    /* bé bị hất về vạch xuất phát */
    el.hero.classList.add('blast', 'dizzy');
    heroTo(HOME.x, HOME.y);
    setTimeout(() => {
      el.hero.classList.remove('blast');
      setTimeout(() => el.hero.classList.remove('dizzy'), 500);
      G.busy = false;
      Sound.speak('Ối! Sai rồi. Bé quay lại vạch xuất phát và thử lại nhé.');
    }, 900);
  }

  function boom(x, y) {
    const b = document.createElement('div');
    b.className = 'boom';
    b.style.setProperty('--x', x + '%');
    b.style.setProperty('--y', y + '%');
    b.innerHTML = '<div class="ball"></div><div class="ring"></div><div class="emo">💥</div>';
    el.fx.appendChild(b);
    setTimeout(() => b.remove(), 900);

    const s = document.createElement('div');
    s.className = 'smoke';
    s.style.setProperty('--x', x + '%');
    s.style.setProperty('--y', y + '%');
    el.fx.appendChild(s);
    setTimeout(() => s.remove(), 1700);

    const f = document.createElement('div');
    f.className = 'flash';
    el.fx.appendChild(f);
    setTimeout(() => f.remove(), 400);

    particles(x, y, ['🌸', '💨', '🍃', '💥', '🌼'], 10, 150);
  }

  /* ============================================================
     ĐI TIẾP - ĐỔI ĐỊA HÌNH
     ============================================================ */
  function marchForward() {
    G.busy = true;
    el.field.innerHTML = '';
    el.hero.classList.remove('flip');
    startWalk();
    heroTo(118, HOME.y);

    /* cảnh vật lùi lại phía sau */
    el.layerMid.style.transform = 'translateX(-30%)';
    el.layerFar.style.transform = 'translateX(-12%)';

    setTimeout(() => {
      G.terrainIdx++;
      applyTerrain(true);
      el.layerMid.style.transform = '';
      el.layerFar.style.transform = '';
      heroJump(-18, HOME.y);
      heroTo(HOME.x, HOME.y);
      Sound.sparkle();

      setTimeout(() => {
        stopWalk();
        nextQuestion();
      }, WALK_MS + 60);
    }, WALK_MS + 60);
  }

  /* ============================================================
     VẬT PHẨM
     ============================================================ */
  function updateItems() {
    el.cntHint.textContent = G.items.hint;
    el.cntFifty.textContent = G.items.fifty;
    el.cntShield.textContent = G.items.shield;
    el.itemHint.classList.toggle('empty', G.items.hint <= 0);
    el.itemFifty.classList.toggle('empty', G.items.fifty <= 0);
    el.itemShield.classList.toggle('empty', G.items.shield <= 0 && !G.shieldOn);
    el.itemShield.classList.toggle('on', G.shieldOn);
  }

  function giveRandomItem(silent) {
    const keys = ['hint', 'fifty', 'shield'];
    const k = keys[Math.floor(Math.random() * keys.length)];
    G.items[k]++;
    updateItems();
    const btn = k === 'hint' ? el.itemHint : k === 'fifty' ? el.itemFifty : el.itemShield;
    btn.classList.remove('gain');
    void btn.offsetWidth;
    btn.classList.add('gain');
    Sound.item();
    if (!silent) toast(`${ITEM_INFO[k].ico} Bé nhận được ${ITEM_INFO[k].name}!`);
    return k;
  }

  function setShield(on) {
    G.shieldOn = on;
    el.shieldAura.hidden = !on;
    updateItems();
  }

  function useHint() {
    if (G.busy || G.screen !== 'play' || G.items.hint <= 0 || !G.q) return;
    G.items.hint--;
    updateItems();
    Sound.item();
    el.hintText.textContent = G.q.hint;
    el.hintBubble.hidden = false;
    Sound.speak(Questions.plain(G.q.hint));
  }

  function useFifty() {
    if (G.busy || G.screen !== 'play' || G.items.fifty <= 0 || !G.q) return;
    const alive = G.mines.filter(m => !m.dead && m.index !== G.q.correct);
    if (alive.length < 2) { toast('Chỉ còn ít đáp án thôi, bé chọn thử nhé!'); return; }
    G.items.fifty--;
    updateItems();
    Sound.item();

    const kill = alive.sort(() => Math.random() - 0.5).slice(0, 2);
    kill.forEach((m, i) => {
      setTimeout(() => {
        m.dead = true;
        m.el.classList.add('gone');
        particles(m.x, m.y, ['✨', '💨'], 5, 70);
      }, i * 220);
    });
    toast('✂️ Đã loại 2 đáp án sai!');
    Sound.speak('Đã bớt hai đáp án sai rồi nhé!');
  }

  function useShield() {
    if (G.busy || G.screen !== 'play') return;
    if (G.shieldOn) { toast('💖 Trái tim đang bảo vệ bé rồi!'); return; }
    if (G.items.shield <= 0) return;
    G.items.shield--;
    setShield(true);
    Sound.shield();
    toast('💖 Trái tim chống bom đã sẵn sàng!');
  }

  /* ============================================================
     QUA CHẶNG
     ============================================================ */
  function levelComplete() {
    G.screen = 'win';
    G.busy = true;
    Sound.levelUp();
    confetti();
    el.hero.classList.add('cheer');

    const stars = G.mistakes === 0 ? 3 : G.mistakes <= 2 ? 2 : 1;
    el.winStars.innerHTML = [0, 1, 2]
      .map(i => `<span class="${i < stars ? '' : 'dim'}">⭐</span>`).join('');
    el.winTitle.textContent = stars === 3 ? 'Hoàn hảo, chiến sĩ nhí! 🏅' : 'Hoan hô chiến sĩ nhí! 🎉';
    el.winScore.textContent = G.levelScore;
    el.winMsg.textContent = stars === 3
      ? 'Bé vượt bãi mìn mà không sai câu nào!'
      : `Bé đã vượt qua chặng ${G.level} an toàn!`;

    const gained = giveRandomItem(true);
    el.winReward.textContent = `Phần thưởng: ${ITEM_INFO[gained].ico} ${ITEM_INFO[gained].name} +1`;

    const best = store.get('best', 0);
    if (G.score > best) {
      store.set('best', G.score);
      setTimeout(() => toast('🏆 Kỷ lục mới của bé!'), 500);
    }

    el.winScreen.hidden = false;
    Sound.speak(`Chúc mừng! Bé đã vượt qua chặng ${G.level}. Bé được ${stars} ngôi sao.`);
  }

  function nextLevel() {
    G.level++;
    G.qIndex = 0;
    G.levelScore = 0;
    G.mistakes = 0;
    G.screen = 'play';
    el.winScreen.hidden = true;
    el.hero.classList.remove('cheer');
    el.hudLevel.textContent = G.level;
    G.terrainIdx++;
    applyTerrain(true);
    heroJump(HOME.x, HOME.y);
    renderTrail();
    nextQuestion();
  }

  /* ============================================================
     BẮT ĐẦU / KẾT THÚC
     ============================================================ */
  function startGame() {
    G.screen = 'play';
    G.level = 1;
    G.qIndex = 0;
    G.score = 0;
    G.levelScore = 0;
    G.streak = 0;
    G.mistakes = 0;
    G.totalCorrect = 0;
    G.terrainIdx = 0;
    G.items = { hint: 1, fifty: 1, shield: 1 };
    setShield(false);

    el.hudLevel.textContent = 1;
    el.hudScore.textContent = 0;
    el.hudStreak.textContent = 0;
    el.hero.classList.remove('cheer', 'blast', 'dizzy');
    updateItems();
    applyTerrain(true);
    heroJump(HOME.x, HOME.y);
    el.menu.hidden = true;
    el.winScreen.hidden = true;

    Sound.resume();
    if (Sound.musicOn) Sound.startMusic();

    document.body.dataset.playing = '1';
    if (global.PWA) PWA.keepAwake(true);

    renderTrail();
    nextQuestion();
    Sound.speak('Chiến sĩ nhí ơi, cùng dò mìn nào!');

    if (!store.get('tutorialShown', false)) {
      store.set('tutorialShown', true);
      setTimeout(() => toast('👉 Chạm vào bông hoa có đáp án đúng nhé!'), 1400);
    }
  }

  function goHome() {
    G.screen = 'menu';
    G.busy = true;
    stopWalk();
    Sound.shutUp();
    el.winScreen.hidden = true;
    el.pauseScreen.hidden = true;
    el.menu.hidden = false;
    el.field.innerHTML = '';
    el.hero.classList.remove('cheer', 'blast', 'dizzy');
    setShield(false);
    showBest();
    document.body.dataset.playing = '0';
    if (global.PWA) PWA.keepAwake(false);
  }

  function showBest() {
    const best = store.get('best', 0);
    el.bestScore.textContent = best > 0 ? `🏆 Điểm cao nhất: ${best}` : '';
  }

  /* ============================================================
     MENU
     ============================================================ */
  function buildMenu() {
    el.menuHero.innerHTML = Sprites.hero();

    el.topics.innerHTML = '';
    Questions.TOPICS.forEach(t => {
      const b = document.createElement('button');
      b.className = 'topic-btn' + (t.key === G.topic ? ' is-on' : '');
      b.dataset.key = t.key;
      b.innerHTML = `<span>${t.icon}</span><span>${t.name}</span>`;
      b.addEventListener('click', () => {
        G.topic = t.key;
        store.set('topic', t.key);
        [...el.topics.children].forEach(c => c.classList.toggle('is-on', c === b));
        Sound.resume(); Sound.click();
      });
      el.topics.appendChild(b);
    });

    [...el.levels.children].forEach(b => {
      b.classList.toggle('is-on', +b.dataset.diff === G.baseDiff);
      b.addEventListener('click', () => {
        G.baseDiff = +b.dataset.diff;
        store.set('diff', G.baseDiff);
        [...el.levels.children].forEach(c => c.classList.toggle('is-on', c === b));
        Sound.resume(); Sound.click();
      });
    });
  }

  /* ============================================================
     ÂM THANH / NÚT ĐIỀU KHIỂN
     ============================================================ */
  function syncSoundButtons() {
    el.btnMusic.classList.toggle('off', !Sound.musicOn);
    el.btnVoice.classList.toggle('off', !Sound.voiceOn);
  }

  function bind() {
    el.btnStart.addEventListener('click', () => {
      Sound.resume(); Sound.click();
      startGame();
    });

    el.itemHint.addEventListener('click', useHint);
    el.itemFifty.addEventListener('click', useFifty);
    el.itemShield.addEventListener('click', useShield);

    el.btnSpeak.addEventListener('click', () => { Sound.resume(); speakQuestion(); });

    el.btnMusic.addEventListener('click', () => {
      Sound.resume();
      Sound.toggleMusic(!Sound.musicOn);
      store.set('music', Sound.musicOn);
      syncSoundButtons();
    });

    el.btnVoice.addEventListener('click', () => {
      Sound.voiceOn = !Sound.voiceOn;
      if (!Sound.voiceOn) Sound.shutUp();
      store.set('voice', Sound.voiceOn);
      syncSoundButtons();
      Sound.click();
    });

    el.btnPause.addEventListener('click', () => {
      if (G.screen !== 'play') return;
      G.screen = 'pause';
      G.busy = true;
      Sound.shutUp();
      Sound.stopMusic();
      if (global.PWA) PWA.keepAwake(false);
      el.pauseScreen.hidden = false;
    });

    el.btnResume.addEventListener('click', () => {
      el.pauseScreen.hidden = true;
      G.screen = 'play';
      G.busy = false;
      Sound.resume();
      if (Sound.musicOn) Sound.startMusic();
      if (global.PWA) PWA.keepAwake(true);
    });

    el.btnInstall.addEventListener('click', async () => {
      Sound.click();
      const ok = await PWA.install();
      if (ok) toast('🎉 Đã cài game vào máy của bé!');
      el.btnInstall.hidden = true;
    });

    el.btnFull.addEventListener('click', () => { Sound.click(); PWA.toggleFullscreen(); });

    global.addEventListener('beforeinstallprompt', () => { el.btnInstall.hidden = false; });

    el.btnQuit.addEventListener('click', goHome);
    el.btnHome.addEventListener('click', goHome);
    el.btnNext.addEventListener('click', () => { Sound.click(); nextLevel(); });

    /* bàn phím: 1-4 chọn đáp án */
    document.addEventListener('keydown', e => {
      if (G.screen !== 'play') return;
      const n = ['1', '2', '3', '4'].indexOf(e.key);
      if (n >= 0 && G.mines[n]) G.mines[n].el.click();
      if (e.key === 'h') useHint();
      if (e.key === 'f') useFifty();
      if (e.key === 's') useShield();
    });

    /* tạm dừng nhạc khi rời khỏi trang */
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { Sound.stopMusic(); Sound.shutUp(); }
      else if (Sound.musicOn && G.screen === 'play') Sound.startMusic();
    });
  }

  /* ---------- các nút riêng của bản web app ---------- */
  function setupAppButtons() {
    const P = global.PWA;
    if (!P) return;
    if (P.installEvent) el.btnInstall.hidden = false;
    if (P.fullscreenSupported && !P.standalone) el.btnFull.hidden = false;
    if (P.isIOS && !P.standalone) el.iosTip.hidden = false;
  }

  /* ---------- ẩn màn hình chờ khi font + đồ họa đã sẵn sàng ---------- */
  function hideSplash() {
    const done = () => {
      el.splash.classList.add('hide');
      setTimeout(() => { el.splash.hidden = true; }, 500);
    };
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    let called = false;
    const once = () => { if (!called) { called = true; done(); } };
    fonts.then(() => setTimeout(once, 120));
    setTimeout(once, 2500); /* mạng chậm cũng không bắt bé chờ quá lâu */
  }

  /* ============================================================
     KHỞI ĐỘNG
     ============================================================ */
  function init() {
    IDS.forEach(id => { el[id] = $(id); });

    el.heroInner.innerHTML = Sprites.hero();

    G.topic = store.get('topic', 'mix');
    G.baseDiff = store.get('diff', 1);
    Sound.musicOn = store.get('music', true);
    Sound.voiceOn = store.get('voice', true);

    buildMenu();
    bind();
    syncSoundButtons();
    showBest();
    applyTerrain(false);
    renderTrail();
    heroJump(HOME.x, HOME.y);
    setupAppButtons();
    hideSplash();

    /* xoay ngang/dọc: xếp lại vị trí hoa và đưa nhân vật về đúng chỗ */
    let resizeTimer = null;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        if (G.screen === 'play' && !G.busy) {
          relayoutMines();
          heroJump(HOME.x, HOME.y);
        } else if (G.screen !== 'play') {
          heroJump(HOME.x, HOME.y);
        }
      }, 220);
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.DoMin = G;
})(window);
