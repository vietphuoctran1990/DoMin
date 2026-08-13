/* ============================================================
   CHIẾN SĨ DÒ MÌN - Logic trò chơi
   Hai chế độ:
   - Hành trình: 5 vùng x (3 chặng + 1 trận Sếp Bom)
   - Chơi nhanh: chọn chủ đề, chơi từng chặng nối tiếp nhau
   ============================================================ */
(function (global) {
  'use strict';

  const TERRAIN_EVERY = 3;   /* chơi nhanh: 3 câu đúng thì sang địa hình mới */
  const WALK_MS = 750;

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
  /* Đánh Sếp Bom: chừa chỗ phía trên cho trùm cuối (bom + tên + thanh ngòi nổ) */
  const SPOTS_BOSS_TALL = [
    { x: 19, y: 48 }, { x: 78, y: 45 },
    { x: 22, y: 77 }, { x: 75, y: 78 }
  ];
  /* Sân ngang mà đánh trùm: Sếp Bom đứng nép sang trái (xem .wide-layout trong CSS),
     hoa mìn dồn sang phải để không ai che ai. */
  const SPOTS_BOSS_WIDE = [
    { x: 36, y: 30 }, { x: 55, y: 20 },
    { x: 74, y: 26 }, { x: 91, y: 44 }
  ];

  const HOME = { x: 46, y: 86 };

  const $ = id => document.getElementById(id);
  const rnd = (a, b) => a + Math.random() * (b - a);
  const pick = a => a[Math.floor(Math.random() * a.length)];

  /* ---------- tham chiếu DOM ---------- */
  const el = {};
  const IDS = ['hud', 'hudLevel', 'hudScore', 'hudStreak', 'hudStreakChip', 'hudHearts',
    'trail', 'btnMusic', 'btnVoice', 'btnPause',
    'questionCard', 'qBadge', 'qText', 'qVisual', 'btnSpeak', 'hintBubble', 'hintText',
    'teachBubble', 'teachText', 'teachVisual',
    'stage', 'layerFar', 'layerMid', 'groundDeco', 'field', 'hero', 'heroInner', 'heroPet',
    'shieldAura', 'fx', 'terrainName', 'bossWrap', 'bossArt', 'bossName', 'bossHp', 'startLine',
    'items', 'itemHint', 'itemFifty', 'itemShield', 'cntHint', 'cntFifty', 'cntShield',
    'splash', 'btnInstall', 'btnFull', 'iosTip',
    'menu', 'menuHero', 'menuPet', 'menuStars', 'btnJourney', 'btnQuick',
    'btnWardrobeMenu', 'btnAlbumMenu', 'bestScore',
    'quickPlay', 'topics', 'levels', 'btnStart', 'btnQuickBack',
    'winScreen', 'winTitle', 'winStars', 'winScore', 'winMsg', 'winReward', 'winSticker',
    'btnNext', 'btnHome', 'loseScreen', 'loseTitle', 'loseMsg', 'loseStats',
    'btnRetry', 'btnLoseMap',
    'pauseScreen', 'btnResume', 'btnQuit', 'toastWrap',
    'btnWardrobeMap', 'btnAlbumMap', 'btnEndless'];

  /* ---------- trạng thái ---------- */
  const G = {
    screen: 'menu',
    mode: 'free',        /* 'free' | 'journey' | 'boss' */
    zone: 1,
    node: 1,
    topicPool: ['mix'],
    diff: 1,
    level: 1,
    qIndex: 0,
    total: Content.QUESTIONS_PER_NODE,
    score: 0,
    levelScore: 0,
    streak: 0,
    mistakes: 0,
    totalCorrect: 0,
    terrainIdx: 0,
    hearts: 3,
    bossHp: 0,
    bossMax: 0,
    distance: 0,       /* Vùng Đất Bí Ẩn: đã đi được bao xa */
    shieldOn: false,
    busy: true,
    q: null,
    mines: [],
    firstTry: true,
    wrongThisQ: 0,     /* sai mấy lần ở câu đang hỏi -> sai 2 lần thì chỉ bé cách làm */
    isReview: false,   /* câu này là câu ôn lại */
    lastReview: '',    /* câu vừa ôn, để không cho lặp lại ngay */
    stepTimer: null,
    blinkTimer: null
  };

  /* chế độ nào thì trả lời sai bị mất trái tim */
  function usesHearts() { return G.mode === 'boss' || G.mode === 'endless'; }

  const ITEM_INFO = {
    hint: { ico: '🔍', name: 'Kính lúp' },
    fifty: { ico: '✂️', name: '50 : 50' },
    shield: { ico: '💖', name: 'Tim chống bom' }
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

  function popText(text, x, y, cls) {
    const p = document.createElement('div');
    p.className = 'pop-text' + (cls ? ' ' + cls : '');
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
  function refreshHero() {
    el.heroInner.innerHTML = Sprites.hero(Save.outfit());
    const pet = Content.pet(Save.data.equipped.pet);
    el.heroPet.textContent = pet.emoji || '';
    el.heroPet.hidden = !pet.emoji;
    scheduleBlink();
  }

  /* nháy mắt ngẫu nhiên cho nhân vật trông có hồn hơn */
  function scheduleBlink() {
    clearTimeout(G.blinkTimer);
    G.blinkTimer = setTimeout(() => {
      const eyes = el.heroInner.querySelector('.eyes');
      if (eyes) {
        eyes.classList.add('blink');
        setTimeout(() => eyes.classList.remove('blink'), 180);
      }
      scheduleBlink();
    }, rnd(2600, 6000));
  }

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
     BỐ CỤC HOA MÌN
     ============================================================ */
  function currentSpots() {
    const r = el.stage.getBoundingClientRect();
    const wide = r.width / Math.max(1, r.height) >= 2;
    if (G.mode === 'boss') return wide ? SPOTS_BOSS_WIDE : SPOTS_BOSS_TALL;
    return wide ? SPOTS_WIDE : SPOTS_TALL;
  }

  let lastLayout = null;

  function layoutKey() {
    const s = currentSpots();
    const key = s === SPOTS_WIDE ? 'wide' : s === SPOTS_TALL ? 'tall'
      : s === SPOTS_BOSS_WIDE ? 'bwide' : 'btall';
    el.stage.classList.toggle('wide-layout', key === 'wide' || key === 'bwide');
    return key;
  }

  function relayoutMines() {
    const spots = currentSpots();
    const mode = layoutKey();
    if (mode === lastLayout || !G.mines.length) { lastLayout = mode; return; }
    lastLayout = mode;
    G.mines.forEach((m, i) => {
      const s = spots[i];
      m.x = s.x; m.y = s.y;
      m.el.style.setProperty('--x', s.x + '%');
      m.el.style.setProperty('--y', s.y + '%');
    });
  }

  /* ============================================================
     DỰNG CÂU HỎI
     ============================================================ */
  function renderTrail() {
    /* Đánh Sếp Bom thì thanh tiến trình nhường chỗ cho thanh ngòi nổ
       vẽ ngay dưới trùm cuối - bé nhìn là hiểu ngay còn mấy ngòi. */
    if (G.mode === 'boss') { renderBossHp(); return; }

    /* Vùng vô tận: thanh chạy tới ngôi sao thưởng kế tiếp */
    const total = G.mode === 'endless' ? Content.ENDLESS.starEvery : G.total;
    const at = G.mode === 'endless' ? G.distance % Content.ENDLESS.starEvery : G.qIndex;

    let html = '';
    for (let i = 0; i < total; i++) {
      const cls = i < at ? 'done' : (i === at ? 'now' : '');
      html += `<i class="${cls}"></i>`;
    }
    html += `<span class="flag">${G.mode === 'endless' ? '⭐' : '🚩'}</span>`;
    el.trail.innerHTML = html;
  }

  function renderBossHp() {
    let html = '';
    for (let i = 0; i < G.bossMax; i++) {
      html += `<i class="${i < G.bossHp ? '' : 'cut'}">🧨</i>`;
    }
    el.bossHp.innerHTML = html;
  }

  function renderHearts() {
    const show = usesHearts();
    el.hudHearts.hidden = !show;
    if (!show) return;
    el.hudHearts.innerHTML = [0, 1, 2]
      .map(i => `<span class="${i < G.hearts ? '' : 'dim'}">❤️</span>`).join('');
  }

  /* vẽ phần minh hoạ của câu hỏi (emoji / ô màu / hình vẽ như đồng hồ) */
  function paintVisual(host, visual) {
    if (!visual || visual.type === 'none' || !visual.value) {
      host.textContent = '';
      host.hidden = true;
      return;
    }
    if (visual.type === 'swatch') {
      host.innerHTML = `<span class="swatch-big" style="background:${visual.value}"></span>`;
    } else if (visual.type === 'html') {
      host.innerHTML = visual.value;
    } else {
      host.textContent = visual.value;
    }
    host.hidden = false;
  }

  function renderQuestion(q) {
    el.qBadge.textContent = Questions.topicIcon(q.topic) + ' ' + Questions.topicName(q.topic) +
      (G.isReview ? ' • ôn lại' : '');
    el.qText.textContent = q.prompt;
    paintVisual(el.qVisual, q.visual);

    el.questionCard.classList.remove('swap');
    void el.questionCard.offsetWidth;
    el.questionCard.classList.add('swap');

    el.hintBubble.hidden = true;
    el.teachBubble.hidden = true;
  }

  /* ============================================================
     CÔ GIÁO CHỈ BÉ - hiện khi bé sai 2 lần ở cùng một câu
     ============================================================ */
  function showTeach(q) {
    const right = q.answers[q.correct].label;
    const ex = q.explain;
    const text = ex && ex.text
      ? ex.text
      : `Đáp án đúng là "${Questions.plain(right)}". ${q.hint || ''}`;

    el.teachText.textContent = text;
    paintVisual(el.teachVisual, ex ? ex.visual : null);
    el.teachBubble.hidden = false;
    el.hintBubble.hidden = true;

    /* chỉ thẳng vào bông hoa đúng cho bé bước tới */
    const m = G.mines[q.correct];
    if (m && !m.dead) m.el.classList.add('teach-glow');

    Sound.item();
    Sound.speak(Questions.plain(text) + ' Bé chọn bông hoa đang nhấp nháy nhé.');
  }

  function renderMines(q) {
    el.field.innerHTML = '';
    G.mines = [];

    const spots = currentSpots();
    lastLayout = layoutKey();
    /* sân trùm cuối chật hơn nên xê dịch ít thôi kẻo hoa chồng lên nhau */
    const jit = lastLayout === 'tall' ? 3 : 1.5;

    q.answers.forEach((ans, i) => {
      const spot = spots[i];
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
        `<div class="mine-art">${Sprites.flower(i)}</div>` +
        `<div class="mine-label${size}">${swatch}${inner}</div>` +
        `<div class="stem"></div>`;

      b.addEventListener('click', () => choose(i, b, x, y));
      el.field.appendChild(b);
      G.mines.push({ el: b, x, y, dead: false, index: i });
    });
  }

  function speakQuestion() {
    if (!G.q) return;
    el.btnSpeak.classList.add('talking');
    setTimeout(() => el.btnSpeak.classList.remove('talking'), 2200);
    Sound.speak(G.q.speak || G.q.prompt);
  }

  /* Thỉnh thoảng cho bé gặp lại một câu từng làm sai.
     Tỉ lệ tăng dần theo số câu trong sổ: sổ chỉ có 1 câu mà lấy tỉ lệ cao
     thì bé gặp đi gặp lại đúng câu đó, phát chán. Đáp án cũng được xếp lại
     vị trí để bé phải nghĩ chứ không nhớ chỗ. */
  function pickQuestion() {
    const n = Save.data.missed.length;
    const chance = Math.min(0.3, 0.08 + 0.06 * n);

    if (n && Math.random() < chance) {
      const found = Save.takeMissed(G.topicPool, G.lastReview);
      if (found) {
        const q = JSON.parse(JSON.stringify(found.q));
        const rightLabel = q.answers[q.correct].label;
        q.answers = Questions.shuffle(q.answers);
        q.correct = q.answers.findIndex(a => a.label === rightLabel);
        G.isReview = true;
        G.lastReview = q.prompt;
        return q;
      }
    }
    G.isReview = false;
    return Questions.make(pick(G.topicPool), G.diff);
  }

  function nextQuestion() {
    G.q = pickQuestion();
    G.firstTry = true;
    G.wrongThisQ = 0;
    renderQuestion(G.q);
    renderMines(G.q);
    renderTrail();
    heroTo(HOME.x, HOME.y);
    G.busy = false;
    setTimeout(speakQuestion, 380);
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
    G.totalCorrect++;

    el.hudScore.textContent = G.score;
    el.hudStreak.textContent = G.streak;
    el.hudStreakChip.classList.add('pop');
    setTimeout(() => el.hudStreakChip.classList.remove('pop'), 260);

    if (G.shieldOn) setShield(false);
    if (G.streak > 0 && G.streak % 3 === 0) setTimeout(() => giveRandomItem(), 700);

    /* làm đúng ngay lần đầu một câu từng sai -> coi như đã thuộc, xoá khỏi sổ ôn */
    if (G.isReview && G.firstTry) {
      Save.forgetMissed(G.q.prompt);
      popText('THUỘC RỒI! 🎓', mine.x, mine.y, 'review-pop');
    }

    Sound.speak(pickPraiseVoice());

    /* --- Vùng Đất Bí Ẩn: đi tiếp mãi --- */
    if (G.mode === 'endless') {
      G.distance++;
      el.hudLevel.textContent = G.distance;
      G.diff = Math.min(3, 1 + Math.floor(G.distance / Content.ENDLESS.diffUpEvery));
      renderTrail();

      if (G.distance % Content.ENDLESS.starEvery === 0) {
        Save.addStars(1);
        toast('⭐ Bé đi xa quá! Thưởng 1 sao.');
      }

      setTimeout(() => {
        if (G.distance % Content.ENDLESS.terrainEvery === 0) marchForward();
        else nextQuestion();
      }, 950);
      return;
    }

    if (G.mode === 'boss') {
      G.bossHp--;
      hitBoss();
      renderTrail();
      setTimeout(() => {
        if (G.bossHp <= 0) bossWin();
        else nextQuestion();
      }, 1000);
      return;
    }

    G.qIndex++;
    renderTrail();

    setTimeout(() => {
      if (G.qIndex >= G.total) levelComplete();
      else if (G.totalCorrect % TERRAIN_EVERY === 0) marchForward();
      else nextQuestion();
    }, 950);
  }

  const PRAISES = ['GIỎI QUÁ!', 'CHÍNH XÁC!', 'TUYỆT VỜI!', 'XUẤT SẮC!', 'HOAN HÔ!'];
  const PRAISE_VOICE = ['Giỏi quá!', 'Chính xác rồi!', 'Tuyệt vời!', 'Bé giỏi lắm!', 'Hoan hô chiến sĩ nhí!'];
  let praiseIdx = 0;
  function pickPraise() { return PRAISES[(praiseIdx++) % PRAISES.length]; }
  function pickPraiseVoice() { return PRAISE_VOICE[praiseIdx % PRAISE_VOICE.length]; }

  /* ---------- SAI ---------- */
  function onWrong(mine) {
    const firstMiss = G.firstTry;
    G.firstTry = false;
    G.wrongThisQ++;
    mine.dead = true;

    /* ghi vào sổ để lần sau cho bé gặp lại câu này */
    if (firstMiss && !G.isReview) Save.remember(G.q);

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

    if (usesHearts()) {
      G.hearts--;
      renderHearts();
      if (G.mode === 'boss') laughBoss();
    }

    /* bé bị hất về vạch xuất phát */
    el.hero.classList.add('blast', 'dizzy');
    heroTo(HOME.x, HOME.y);

    setTimeout(() => {
      el.hero.classList.remove('blast');
      setTimeout(() => el.hero.classList.remove('dizzy'), 500);

      if (usesHearts() && G.hearts <= 0) {
        if (G.mode === 'boss') bossLose(); else endlessEnd();
        return;
      }

      G.busy = false;

      /* sai tới lần thứ hai ở cùng một câu -> chỉ luôn cách làm cho bé */
      if (G.wrongThisQ >= 2) {
        showTeach(G.q);
        return;
      }

      Sound.speak(usesHearts()
        ? 'Ối! Bé mất một trái tim rồi. Cẩn thận nhé!'
        : 'Ối! Sai rồi. Bé quay lại vạch xuất phát và thử lại nhé.');
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
     SẾP BOM
     ============================================================ */
  function hitBoss() {
    el.bossWrap.classList.remove('hurt');
    void el.bossWrap.offsetWidth;
    el.bossWrap.classList.add('hurt');
    Sound.sparkle();
    particles(50, 20, ['💥', '✨', '⚡'], 8, 110);
    popText('-1 NGÒI!', 50, 26, 'boss-pop');
  }

  function laughBoss() {
    el.bossWrap.classList.remove('laugh');
    void el.bossWrap.offsetWidth;
    el.bossWrap.classList.add('laugh');
  }

  function bossWin() {
    G.screen = 'win';
    G.busy = true;
    const zone = Content.ZONES[G.zone - 1];

    el.bossWrap.classList.add('defeated');
    Sound.levelUp();
    confetti();
    particles(50, 24, ['💥', '🎉', '⭐', '✨'], 16, 200);

    const stars = Math.max(1, G.hearts);
    const nodeId = Content.nodeId(G.zone, Content.NODES_PER_ZONE);
    const starsGot = Save.setNodeStars(nodeId, stars);
    const sticker = Save.grantSticker(Content.BOSS_STICKERS[G.zone - 1]);
    const nextZone = G.zone < Content.ZONES.length;

    showWin({
      title: `Hạ gục ${zone.boss.name}! 🏅`,
      stars, starsGot,
      msg: nextZone
        ? `Vùng mới đã mở: ${Content.ZONES[G.zone].icon} ${Content.ZONES[G.zone].name}!`
        : 'Bé đã đi hết cả hành trình. Siêu chiến sĩ nhí! 🎖️',
      sticker,
      speak: `Tuyệt vời! Bé đã hạ gục ${zone.boss.name}!`
    });
  }

  function bossLose() {
    G.screen = 'lose';
    G.busy = true;
    stopWalk();
    Sound.wrong();
    const zone = Content.ZONES[G.zone - 1];
    el.loseTitle.textContent = 'Sếp Bom mạnh quá!';
    el.loseMsg.textContent = `${zone.boss.name} vẫn còn ngòi nổ. Bé nghỉ một chút rồi thử lại nhé!`;
    el.loseStats.hidden = true;
    el.btnRetry.textContent = '🔁 THỬ LẠI';
    el.loseScreen.hidden = false;
    Sound.speak('Không sao đâu! Bé thử lại lần nữa nhé.');
  }

  /* ============================================================
     ĐI TIẾP - ĐỔI CẢNH
     ============================================================ */
  function marchForward() {
    G.busy = true;
    el.field.innerHTML = '';
    el.hero.classList.remove('flip');
    startWalk();
    heroTo(118, HOME.y);

    el.layerMid.style.transform = 'translateX(-30%)';
    el.layerFar.style.transform = 'translateX(-12%)';

    setTimeout(() => {
      /* Hành trình: đi sâu hơn vào cùng một vùng (cảnh vật đổi, địa hình giữ nguyên).
         Chơi nhanh / vùng vô tận: sang hẳn địa hình mới. */
      if (G.mode === 'free' || G.mode === 'endless') {
        G.terrainIdx++;
        applyTerrain(true);
      } else {
        applyTerrain(false);
      }
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
    const it = Save.data.items;
    el.cntHint.textContent = it.hint;
    el.cntFifty.textContent = it.fifty;
    el.cntShield.textContent = it.shield;
    el.itemHint.classList.toggle('empty', it.hint <= 0);
    el.itemFifty.classList.toggle('empty', it.fifty <= 0);
    el.itemShield.classList.toggle('empty', it.shield <= 0 && !G.shieldOn);
    el.itemShield.classList.toggle('on', G.shieldOn);
  }

  function giveRandomItem(silent) {
    const k = pick(['hint', 'fifty', 'shield']);
    Save.addItem(k, 1);
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
    if (G.busy || G.screen !== 'play' || Save.data.items.hint <= 0 || !G.q) return;
    Save.addItem('hint', -1);
    updateItems();
    Sound.item();
    el.hintText.textContent = G.q.hint;
    el.teachBubble.hidden = true;   /* chỉ hiện một bong bóng, kẻo thẻ câu hỏi phình to */
    el.hintBubble.hidden = false;
    Sound.speak(Questions.plain(G.q.hint));
  }

  function useFifty() {
    if (G.busy || G.screen !== 'play' || Save.data.items.fifty <= 0 || !G.q) return;
    const alive = G.mines.filter(m => !m.dead && m.index !== G.q.correct);
    if (alive.length < 2) { toast('Chỉ còn ít đáp án thôi, bé chọn thử nhé!'); return; }
    Save.addItem('fifty', -1);
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
    if (Save.data.items.shield <= 0) return;
    Save.addItem('shield', -1);
    setShield(true);
    Sound.shield();
    toast('💖 Trái tim chống bom đã sẵn sàng!');
  }

  /* ============================================================
     KẾT THÚC CHẶNG
     ============================================================ */
  function showWin(opt) {
    el.winTitle.textContent = opt.title;
    el.winStars.innerHTML = [0, 1, 2]
      .map(i => `<span class="${i < opt.stars ? '' : 'dim'}">⭐</span>`).join('');
    el.winScore.textContent = G.levelScore;
    el.winMsg.textContent = opt.msg;

    if (opt.sticker) {
      el.winSticker.hidden = false;
      el.winSticker.innerHTML =
        `<span class="ws-label">Sticker mới!</span>` +
        `<span class="ws-emo">${opt.sticker.e}</span>` +
        `<span class="ws-name">${opt.sticker.n}</span>`;
    } else {
      el.winSticker.hidden = true;
    }

    const gained = giveRandomItem(true);
    const starsGot = opt.starsGot === undefined ? opt.stars : opt.starsGot;
    el.winReward.textContent =
      `+${starsGot} ⭐   •   ${ITEM_INFO[gained].ico} ${ITEM_INFO[gained].name} +1`;

    if (G.score > Save.data.best) {
      Save.set('best', G.score);
      setTimeout(() => toast('🏆 Kỷ lục mới của bé!'), 500);
    }

    el.btnNext.textContent = G.mode === 'free' ? '➡️ ĐI TIẾP' : '🗺️ BẢN ĐỒ';
    el.btnHome.textContent = G.mode === 'free' ? '🏠 Về nhà' : '🔁 Chơi lại chặng này';

    el.winScreen.hidden = false;
    Sound.speak(opt.speak);
  }

  function levelComplete() {
    G.screen = 'win';
    G.busy = true;
    Sound.levelUp();
    confetti();
    el.hero.classList.add('cheer');

    const stars = G.mistakes === 0 ? 3 : G.mistakes <= 2 ? 2 : 1;
    let sticker = null;
    let starsGot;

    if (G.mode === 'journey') {
      starsGot = Save.setNodeStars(Content.nodeId(G.zone, G.node), stars);
      sticker = Save.grantSticker();
    } else {
      starsGot = 1;
      Save.addStars(1);
      if (G.level % 2 === 0) sticker = Save.grantSticker();
    }

    showWin({
      title: stars === 3 ? 'Hoàn hảo, chiến sĩ nhí! 🏅' : 'Hoan hô chiến sĩ nhí! 🎉',
      stars, starsGot,
      msg: stars === 3
        ? 'Bé vượt bãi mìn mà không sai câu nào!'
        : 'Bé đã vượt qua chặng này an toàn!',
      sticker,
      speak: `Chúc mừng! Bé được ${stars} ngôi sao.`
    });
  }

  /* ============================================================
     BẮT ĐẦU CÁC CHẾ ĐỘ
     ============================================================ */
  function resetRun() {
    G.qIndex = 0;
    G.levelScore = 0;
    G.streak = 0;
    G.mistakes = 0;
    G.totalCorrect = 0;
    G.hearts = 3;
    setShield(false);
    el.hero.classList.remove('cheer', 'blast', 'dizzy');
    el.bossWrap.classList.remove('hurt', 'laugh', 'defeated');
    el.hudStreak.textContent = 0;
    el.hudScore.textContent = G.score;
    updateItems();
    refreshHero();
    document.body.dataset.playing = '1';
    if (global.PWA) PWA.keepAwake(true);
    Sound.resume();
    if (Sound.musicOn) Sound.startMusic();
  }

  function enterStage() {
    el.menu.hidden = true;
    el.quickPlay.hidden = true;
    el.winScreen.hidden = true;
    el.loseScreen.hidden = true;
    Journey.close();
    G.screen = 'play';
    heroJump(HOME.x, HOME.y);
  }

  /* --- Hành trình --- */
  function startNode(zoneIdx, nodeIdx) {
    const zone = Content.ZONES[zoneIdx - 1];
    const isBoss = nodeIdx === Content.NODES_PER_ZONE;

    G.zone = zoneIdx;
    G.node = nodeIdx;
    G.mode = isBoss ? 'boss' : 'journey';
    G.topicPool = zone.topics.slice();
    G.diff = zone.diff;
    G.score = 0;
    G.terrainIdx = zoneIdx - 1;
    G.total = Content.QUESTIONS_PER_NODE;
    G.bossMax = isBoss ? zone.boss.hp : 0;
    G.bossHp = G.bossMax;

    resetRun();
    enterStage();
    applyTerrain(true);

    el.hudLevel.textContent = `${zoneIdx}-${nodeIdx}`;
    el.stage.classList.toggle('boss-mode', isBoss);
    el.hud.classList.toggle('boss-hud', isBoss);
    el.bossWrap.hidden = !isBoss;
    if (isBoss) {
      el.bossArt.innerHTML = Sprites.boss(zone);
      el.bossName.textContent = zone.boss.name;
    }

    renderHearts();
    renderTrail();
    nextQuestion();

    Sound.speak(isBoss
      ? `Cẩn thận! ${zone.boss.name} xuất hiện. Bé cắt hết ngòi nổ nhé!`
      : `Chặng ${nodeIdx}, ${zone.name}. Cùng dò mìn nào!`);

    firstTimeTip();
  }

  /* --- Vùng Đất Bí Ẩn: đi được càng xa càng giỏi --- */
  function startEndless() {
    const E = Content.ENDLESS;
    G.mode = 'endless';
    G.topicPool = ['mix'];
    G.diff = 1;
    G.score = 0;
    G.distance = 0;
    G.terrainIdx = 0;
    G.total = E.starEvery;

    resetRun();
    G.hearts = E.hearts;
    enterStage();
    applyTerrain(true);

    el.hudLevel.textContent = 0;
    el.stage.classList.remove('boss-mode');
    el.hud.classList.remove('boss-hud');
    el.bossWrap.hidden = true;
    renderHearts();
    renderTrail();
    nextQuestion();
    Sound.speak('Vùng đất bí ẩn! Bé đi được càng xa càng giỏi nhé.');
  }

  function endlessEnd() {
    G.screen = 'lose';
    G.busy = true;
    stopWalk();

    const stars = Math.floor(G.distance / Content.ENDLESS.starEvery);
    const isRecord = Save.setEndless(G.distance);

    el.loseTitle.textContent = isRecord ? 'KỶ LỤC MỚI! 🏆' : 'Bé về nhà an toàn 🏠';
    el.loseMsg.textContent = `Bé đã đi được ${G.distance} chặng trong Vùng Đất Bí Ẩn!`;
    el.loseStats.textContent =
      `🏆 Kỷ lục: ${Save.data.endlessBest} chặng   •   ⭐ Nhận được: ${stars} sao`;
    el.loseStats.hidden = false;
    el.btnRetry.textContent = '🔁 ĐI LẦN NỮA';
    el.loseScreen.hidden = false;

    Sound.levelUp();
    if (isRecord) confetti();
    Sound.speak(isRecord
      ? `Kỷ lục mới! Bé đi được ${G.distance} chặng.`
      : `Bé đi được ${G.distance} chặng. Giỏi lắm!`);
  }

  /* --- Chơi nhanh --- */
  function startFree() {
    G.mode = 'free';
    G.topicPool = [Save.data.topic];
    G.diff = Save.data.diff;
    G.level = 1;
    G.score = 0;
    G.terrainIdx = 0;
    G.total = Content.QUESTIONS_PER_NODE;

    resetRun();
    enterStage();
    applyTerrain(true);

    el.hudLevel.textContent = 1;
    el.stage.classList.remove('boss-mode');
    el.hud.classList.remove('boss-hud');
    el.bossWrap.hidden = true;
    renderHearts();
    renderTrail();
    nextQuestion();
    Sound.speak('Chiến sĩ nhí ơi, cùng dò mìn nào!');
    firstTimeTip();
  }

  function nextFreeLevel() {
    G.level++;
    G.diff = Math.min(3, Save.data.diff + Math.floor((G.level - 1) / 3));
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

  function firstTimeTip() {
    if (Save.data.tutorial) return;
    Save.set('tutorial', true);
    setTimeout(() => toast('👉 Chạm vào bông hoa có đáp án đúng nhé!'), 1400);
  }

  /* ============================================================
     ĐIỀU HƯỚNG MÀN HÌNH
     ============================================================ */
  function goMenu() {
    G.screen = 'menu';
    G.busy = true;
    stopWalk();
    Sound.shutUp();
    el.winScreen.hidden = true;
    el.loseScreen.hidden = true;
    el.pauseScreen.hidden = true;
    el.quickPlay.hidden = true;
    Journey.close();
    el.menu.hidden = false;
    el.field.innerHTML = '';
    el.hero.classList.remove('cheer', 'blast', 'dizzy');
    setShield(false);
    document.body.dataset.playing = '0';
    if (global.PWA) PWA.keepAwake(false);
    refreshMenu();
  }

  function goMap() {
    G.screen = 'map';
    G.busy = true;
    stopWalk();
    Sound.shutUp();
    el.winScreen.hidden = true;
    el.loseScreen.hidden = true;
    el.pauseScreen.hidden = true;
    el.menu.hidden = true;
    el.field.innerHTML = '';
    document.body.dataset.playing = '0';
    if (global.PWA) PWA.keepAwake(false);
    el.btnEndless.hidden = !Save.endlessUnlocked();
    Journey.open(true);
  }

  function refreshMenu() {
    el.menuHero.innerHTML = Sprites.hero(Save.outfit());
    const pet = Content.pet(Save.data.equipped.pet);
    el.menuPet.textContent = pet.emoji || '';
    el.menuPet.hidden = !pet.emoji;
    el.menuStars.textContent = Save.data.stars;
    el.bestScore.textContent = Save.data.best > 0 ? `🏆 Điểm cao nhất: ${Save.data.best}` : '';
  }

  /* ============================================================
     MENU CHƠI NHANH
     ============================================================ */
  function buildQuickPlay() {
    el.topics.innerHTML = '';
    Questions.TOPICS.forEach(t => {
      const b = document.createElement('button');
      b.className = 'topic-btn' + (t.key === Save.data.topic ? ' is-on' : '');
      b.dataset.key = t.key;
      b.innerHTML = `<span>${t.icon}</span><span>${t.name}</span>`;
      b.addEventListener('click', () => {
        Save.set('topic', t.key);
        [...el.topics.children].forEach(c => c.classList.toggle('is-on', c === b));
        Sound.resume(); Sound.click();
      });
      el.topics.appendChild(b);
    });

    [...el.levels.children].forEach(b => {
      b.classList.toggle('is-on', +b.dataset.diff === Save.data.diff);
      b.addEventListener('click', () => {
        Save.set('diff', +b.dataset.diff);
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
    /* --- menu --- */
    el.btnJourney.addEventListener('click', () => { Sound.resume(); Sound.click(); goMap(); });
    el.btnQuick.addEventListener('click', () => {
      Sound.resume(); Sound.click();
      el.quickPlay.hidden = false;
    });
    el.btnQuickBack.addEventListener('click', () => { Sound.click(); el.quickPlay.hidden = true; });
    el.btnStart.addEventListener('click', () => { Sound.resume(); Sound.click(); startFree(); });

    el.btnWardrobeMenu.addEventListener('click', () => { Sound.resume(); Sound.click(); Wardrobe.open(); });
    el.btnAlbumMenu.addEventListener('click', () => { Sound.resume(); Sound.click(); Album.open(); });
    el.btnWardrobeMap.addEventListener('click', () => { Sound.click(); Wardrobe.open(); });
    el.btnAlbumMap.addEventListener('click', () => { Sound.click(); Album.open(); });

    /* --- vật phẩm --- */
    el.itemHint.addEventListener('click', useHint);
    el.itemFifty.addEventListener('click', useFifty);
    el.itemShield.addEventListener('click', useShield);
    el.btnSpeak.addEventListener('click', () => { Sound.resume(); speakQuestion(); });

    /* --- âm thanh --- */
    el.btnMusic.addEventListener('click', () => {
      Sound.resume();
      Sound.toggleMusic(!Sound.musicOn);
      Save.set('music', Sound.musicOn);
      syncSoundButtons();
    });

    el.btnVoice.addEventListener('click', () => {
      Sound.voiceOn = !Sound.voiceOn;
      if (!Sound.voiceOn) Sound.shutUp();
      Save.set('voice', Sound.voiceOn);
      syncSoundButtons();
      Sound.click();
    });

    /* --- tạm dừng --- */
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

    el.btnQuit.addEventListener('click', () => {
      Sound.click();
      if (G.mode === 'free') goMenu(); else goMap();
    });

    /* --- kết thúc chặng --- */
    el.btnNext.addEventListener('click', () => {
      Sound.click();
      if (G.mode === 'free') nextFreeLevel();
      else goMap();
    });

    el.btnHome.addEventListener('click', () => {
      Sound.click();
      if (G.mode === 'free') goMenu();
      else startNode(G.zone, G.node);
    });

    /* --- thua trận boss / hết đường ở vùng vô tận --- */
    el.btnRetry.addEventListener('click', () => {
      Sound.click();
      if (G.mode === 'endless') startEndless();
      else startNode(G.zone, G.node);
    });
    el.btnLoseMap.addEventListener('click', () => { Sound.click(); goMap(); });
    el.btnEndless.addEventListener('click', () => { Sound.resume(); Sound.click(); startEndless(); });

    /* --- web app --- */
    el.btnInstall.addEventListener('click', async () => {
      Sound.click();
      const ok = await PWA.install();
      if (ok) toast('🎉 Đã cài game vào máy của bé!');
      el.btnInstall.hidden = true;
    });
    el.btnFull.addEventListener('click', () => { Sound.click(); PWA.toggleFullscreen(); });
    global.addEventListener('beforeinstallprompt', () => { el.btnInstall.hidden = false; });

    /* --- bàn phím --- */
    document.addEventListener('keydown', e => {
      if (G.screen !== 'play') return;
      const n = ['1', '2', '3', '4'].indexOf(e.key);
      if (n >= 0 && G.mines[n]) G.mines[n].el.click();
      if (e.key === 'h') useHint();
      if (e.key === 'f') useFifty();
      if (e.key === 's') useShield();
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { Sound.stopMusic(); Sound.shutUp(); }
      else if (Sound.musicOn && G.screen === 'play') Sound.startMusic();
    });

    /* --- xoay ngang/dọc --- */
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

  /* ---------- các nút riêng của bản web app ---------- */
  function setupAppButtons() {
    const P = global.PWA;
    if (!P) return;
    if (P.installEvent) el.btnInstall.hidden = false;
    if (P.fullscreenSupported && !P.standalone) el.btnFull.hidden = false;
    if (P.isIOS && !P.standalone) el.iosTip.hidden = false;
  }

  function hideSplash() {
    const done = () => {
      el.splash.classList.add('hide');
      setTimeout(() => { el.splash.hidden = true; }, 500);
    };
    const fonts = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
    let called = false;
    const once = () => { if (!called) { called = true; done(); } };
    fonts.then(() => setTimeout(once, 120));
    setTimeout(once, 2500);
  }

  /* ============================================================
     KHỞI ĐỘNG
     ============================================================ */
  function init() {
    IDS.forEach(id => { el[id] = $(id); });

    Save.load();
    Sound.musicOn = Save.data.music;
    Sound.voiceOn = Save.data.voice;

    refreshHero();

    Journey.init();
    Journey.onPick = (z, n) => startNode(z, n);
    Journey.onHome = goMenu;

    Wardrobe.init();
    Wardrobe.onClose = () => { refreshHero(); refreshMenu(); Journey.render(false); };
    Album.init();
    Album.onClose = () => { refreshMenu(); };

    buildQuickPlay();
    bind();
    syncSoundButtons();
    refreshMenu();
    applyTerrain(false);
    renderTrail();
    heroJump(HOME.x, HOME.y);
    setupAppButtons();
    hideSplash();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  global.DoMin = G;
})(window);
