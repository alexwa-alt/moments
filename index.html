/* game.js
   Runs the game: which screen is showing, which round we are on,
   building the answer boxes, scoring, and calling the effects.
   It uses the other files:  Faces (photos), Q (questions),
   Scenes (pictures) and FX (celebrations). */

(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  // ---------- game state ----------
  const G = {
    mode: 'both', rounds: [], idx: 0, score: 0, streak: 0, bestStreak: 0, firstTry: 0,
    q: null, attempts: 0, hintUsed: false, done: false, used: [], selected: null
  };
  let scene = null, dpr = 1, lastTs = 0;

  // ---------- screens ----------
  function show(name) {
    ['setup', 'menu', 'game', 'end'].forEach(s => $('screen-' + s).classList.toggle('active', s === name));
    window.scrollTo(0, 0);
    if (name === 'game') resizeStage();
    if (name !== 'end' && name !== 'game') FX.clear();
  }

  // ---------- the main canvas ----------
  const stage = $('stage'), sctx = stage.getContext('2d');

  function resizeStage() {
    const wrap = $('stage-wrap');
    const cssW = Math.max(300, wrap.clientWidth);
    const U = cssW / Scenes.width;
    const cssH = Math.round(cssW * (cssW < 640 ? 0.8 : 0.56));    // taller picture on phones
    dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    stage.style.width = cssW + 'px'; stage.style.height = cssH + 'px';
    stage.width = Math.round(cssW * dpr); stage.height = Math.round(cssH * dpr);
    Scenes.setSize(U, cssH / U);
    stage._U = U; stage._H = cssH / U;
  }
  window.addEventListener('resize', () => { if ($('screen-game').classList.contains('active')) resizeStage(); });

  function frame(ts) {
    const dt = Math.min(0.05, (ts - lastTs) / 1000 || 0.016);
    lastTs = ts;
    if (scene && $('screen-game').classList.contains('active')) {
      const U = stage._U || 1;
      scene.update(dt);
      sctx.setTransform(dpr * U, 0, 0, dpr * U, 0, 0);
      scene.draw(sctx);
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // pointer -> drawing coordinates (for dragging the pin)
  function toScene(e) {
    const r = stage.getBoundingClientRect();
    return [(e.clientX - r.left) / r.width * Scenes.width, (e.clientY - r.top) / r.height * stage._H];
  }
  stage.addEventListener('pointerdown', e => {
    if (!scene || scene.kind !== 'pin') return;
    stage.setPointerCapture(e.pointerId);
    const [x, y] = toScene(e); scene.pointer('down', x, y);
  });
  stage.addEventListener('pointermove', e => {
    if (!scene || scene.kind !== 'pin') return;
    const [x, y] = toScene(e); scene.pointer('move', x, y);
  });
  const endDrag = () => { if (scene && scene.kind === 'pin') scene.pointer('up', 0, 0); };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // ---------- 1. photos ----------
  function updateContinue() { $('btn-continue').disabled = !Faces.ready(); }
  Faces.initSetup(updateContinue);

  $('btn-cartoon').addEventListener('click', () => { Faces.useCartoons(); });
  $('btn-continue').addEventListener('click', () => {
    Faces.stopAll();
    [0, 1].forEach(i => { $('menu-face-' + i).src = Faces.url(i); $('menu-name-' + i).textContent = Faces.name(i); });
    show('menu');
  });

  // ---------- 2. choose a mode ----------
  document.querySelectorAll('.mode').forEach(b => b.addEventListener('click', () => startGame(b.dataset.mode)));
  $('btn-back-faces').addEventListener('click', () => show('setup'));

  function buildRounds(mode) {
    const seq = {
      moments: ['moment', 'balance', 'direction', 'moment', 'balance', 'direction', 'balance', 'moment'],
      cog: ['pin', 'pin', 'topple', 'pin', 'topple', 'pin', 'topple', 'pin'],
      both: ['moment', 'balance', 'pin', 'direction', 'topple', 'balance', 'pin', 'direction', 'topple', 'pin']
    }[mode];
    const n = seq.length;
    return seq.map((type, i) => {
      const f = n > 1 ? i / (n - 1) : 0;
      return {
        type, tough: f >= 0.5,
        tier: f < 0.34 ? 'easy' : f < 0.67 ? 'mid' : 'hard',
        unknown: Math.random() < 0.5 ? 'd' : 'F'
      };
    });
  }

  function startGame(mode) {
    FX.unlock(); FX.clear();
    Object.assign(G, { mode, rounds: buildRounds(mode), idx: 0, score: 0, streak: 0, bestStreak: 0, firstTry: 0, used: [] });
    show('game');
    startRound();
  }

  // ---------- 3. a round ----------
  function startRound() {
    const spec = G.rounds[G.idx], pi = G.idx % 2;
    const q = Q.make(spec, pi, G.used);
    Object.assign(G, { q, attempts: 0, hintUsed: false, done: false, selected: null });

    scene = Scenes.create(q.scene);
    stage.style.touchAction = q.scene.kind === 'pin' ? 'none' : 'auto';   // so dragging the pin doesn't scroll the page

    $('hud-round').textContent = `Round ${G.idx + 1} of ${G.rounds.length}`;
    $('turn-img').src = Faces.url(pi);
    $('turn-name').textContent = `${Faces.name(pi)}’s turn`;
    $('turn-sub').textContent = `${Faces.name(1 - pi)} is the checker. Agree before you press Check!`;
    $('title').textContent = q.title;
    $('prompt').innerHTML = q.prompt;
    $('talk-text').textContent = q.talk;
    $('feedback').innerHTML = '';
    $('btn-next').hidden = true;
    $('btn-hint').hidden = false; $('btn-hint').disabled = false;
    updateHud();
    buildControls(q);
    if (q.inputKind === 'number') $('ans').focus({ preventScroll: true });
  }

  function updateHud() {
    $('hud-score').textContent = `⭐ ${G.score}`;
    $('hud-streak').textContent = G.streak >= 2 ? `🔥 ${G.streak}` : '';
  }

  function buildControls(q) {
    const c = $('controls');
    c.innerHTML = '';
    if (q.inputKind === 'number') {
      const row = document.createElement('div'); row.className = 'answer-row';
      const inp = document.createElement('input');
      inp.id = 'ans'; inp.type = 'text'; inp.inputMode = 'decimal'; inp.autocomplete = 'off';
      inp.placeholder = 'Type your answer'; inp.setAttribute('aria-label', 'Your answer');
      inp.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
      const u = document.createElement('span'); u.className = 'unit'; u.textContent = q.unit;
      row.append(inp, u); c.append(row);
    } else if (q.inputKind === 'choice') {
      const row = document.createElement('div'); row.className = 'choices';
      q.choices.forEach(ch => {
        const b = document.createElement('button');
        b.className = 'choice'; b.textContent = ch.label; b.setAttribute('aria-pressed', 'false');
        b.addEventListener('click', () => {
          if (G.done) return;
          G.selected = ch.id; FX.click();
          row.querySelectorAll('.choice').forEach(x => x.setAttribute('aria-pressed', String(x === b)));
        });
        row.append(b);
      });
      c.append(row);
    }
    const go = document.createElement('button');
    go.id = 'btn-check'; go.className = 'btn primary big';
    go.textContent = q.inputKind === 'pin' ? 'Check my pin 📍' : 'Check ✓';
    go.addEventListener('click', submit);
    c.append(go);
  }

  function getAnswer() {
    const q = G.q;
    if (q.inputKind === 'number') {
      const v = parseFloat($('ans').value.replace(',', '.'));
      return Number.isFinite(v) ? v : null;
    }
    if (q.inputKind === 'choice') return G.selected;
    return scene.getPin();
  }

  function say(html, cls) { $('feedback').innerHTML = `<div class="fb ${cls}">${html}</div>`; }

  function submit() {
    if (G.done) return;
    const ans = getAnswer();
    if (ans === null) {
      say({ number: 'Type a number first.', choice: 'Choose one of the options first.', pin: 'Tap the shape to place your pin first.' }[G.q.inputKind], 'warn');
      return;
    }
    G.attempts++;
    const res = G.q.check(ans);
    if (res.ok) finishRound(true, ans);
    else if (G.attempts >= 2) finishRound(false, ans);
    else {
      scene.onWrong(ans);
      FX.wrong(false);
      say(`${res.msg} <b>One more go!</b>`, 'warn');
    }
  }

  function finishRound(ok, ans) {
    G.done = true;
    let html = '';
    if (ok) {
      let pts = G.attempts === 1 ? 100 : 50;
      if (G.hintUsed) pts -= 25;
      pts = Math.max(pts, 10);
      G.streak++; G.bestStreak = Math.max(G.bestStreak, G.streak);
      if (G.attempts === 1) G.firstTry++;
      const bonus = Math.min(50, (G.streak - 1) * 10);
      G.score += pts + bonus;
      html = `<div class="fb good"><b>Correct!</b> +${pts + bonus} points${bonus ? ` (streak bonus +${bonus})` : ''}</div>`;
      FX.celebrate(G.streak >= 3 ? 2 : 1, G.idx % 2);
    } else {
      G.streak = 0;
      html = '<div class="fb bad"><b>Not this time.</b> Here is how it works:</div>';
      FX.wrong(true);
    }
    scene.onReveal(ok, ans);
    $('feedback').innerHTML = html + `<div class="explain">${G.q.explain}</div>`;
    updateHud();

    $('controls').querySelectorAll('input,button').forEach(el => { el.disabled = true; });
    $('btn-hint').hidden = true;
    $('btn-next').hidden = false;
    $('btn-next').textContent = G.idx + 1 >= G.rounds.length ? 'See results 🏁' : 'Next round ▶';
    $('btn-next').focus({ preventScroll: true });
  }

  $('btn-hint').addEventListener('click', () => {
    if (G.done) return;
    if (!G.hintUsed) { G.hintUsed = true; }
    scene.onHint();
    const old = $('feedback').innerHTML;
    $('feedback').innerHTML = old + `<div class="fb hint">💡 ${G.q.hint} <small>(this round’s points are 25 lower)</small></div>`;
  });

  $('btn-next').addEventListener('click', () => {
    FX.clear();
    G.idx++;
    if (G.idx >= G.rounds.length) endGame(); else startRound();
  });

  $('btn-mute').addEventListener('click', () => {
    const m = !FX.isMuted(); FX.setMuted(m);
    $('btn-mute').textContent = m ? '🔇' : '🔊';
    $('btn-mute').setAttribute('aria-label', m ? 'Sound off' : 'Sound on');
  });
  $('btn-menu').addEventListener('click', () => {
    if (window.confirm('Leave this game and go back to the menu?')) { FX.clear(); show('menu'); }
  });

  // ---------- 4. results ----------
  function endGame() {
    const n = G.rounds.length, pct = G.firstTry / n;
    const title = pct >= 0.9 ? '🏆 Moment Master' : pct >= 0.7 ? '⭐ Balance Boss' : pct >= 0.5 ? '🙂 Turning-Point Hero' : '🌱 Pivot Apprentice';
    [0, 1].forEach(i => { $('end-face-' + i).src = Faces.url(i); $('end-name-' + i).textContent = Faces.name(i); });
    $('end-title').textContent = title;
    $('end-score').textContent = G.score;
    $('end-first').textContent = `${G.firstTry} of ${n}`;
    $('end-streak').textContent = G.bestStreak;
    show('end');
    FX.celebrate(3, 0);
  }
  $('btn-again').addEventListener('click', () => { FX.clear(); startGame(G.mode); });
  $('btn-other').addEventListener('click', () => { FX.clear(); show('menu'); });
  $('btn-newfaces').addEventListener('click', () => { FX.clear(); show('setup'); });

  show('setup');
})();
