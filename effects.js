/* effects.js
   The silly bits: face balloons (tap to pop!), confetti, raining faces,
   a giant party-hat face, funny banners and little synthesised sounds.
   Everything draws on the full-screen <canvas id="fx"> that sits on top
   of the page and ignores touches (so buttons still work). */

const FX = (() => {
  const cvs = document.getElementById('fx');
  const ctx = cvs.getContext('2d');
  const bannerEl = document.getElementById('banner');
  let W = 0, H = 0, dpr = 1;
  let balloons = [], confetti = [], rain = [], texts = [], bigFace = null;
  let raf = 0, last = 0, muted = false, ac = null;

  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];

  const WIN_LINES = [
    'Newton-tastic!', 'A moment of glory!', 'Perfectly balanced!', 'That’s the pivot-al answer!',
    'Absolutely CoG-nificent!', 'Turning heads and turning moments!', 'Force × distance = FANTASTIC!',
    'Physics party time!', 'Nailed it!', 'You’ve got the moves (and the moments)!'
  ];
  const STREAK_LINES = ['🔥 ON FIRE! 🔥', 'Unstoppable!', 'Moment Master mode!', 'Streak party!'];
  const OOPS_LINES = ['Oof! Try again', 'Wobble wobble…', 'Not quite. Talk it over!', 'So close! Check the moments'];

  // ---------- sizing ----------
  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = window.innerWidth; H = window.innerHeight;
    cvs.width = Math.round(W * dpr); cvs.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  window.addEventListener('resize', resize);
  resize();

  // ---------- sound (Web Audio: made from simple tones, no files to load) ----------
  function audio() {
    if (!ac) { try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; } }
    if (ac && ac.state === 'suspended') ac.resume();
    return ac;
  }
  function tone(freq, t0, dur, type, vol, slideTo) {
    const a = audio(); if (!a || muted) return;
    const o = a.createOscillator(), g = a.createGain(), t = a.currentTime + t0;
    o.type = type || 'triangle';
    o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(a.destination);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(dur, vol) {
    const a = audio(); if (!a || muted) return;
    const len = Math.floor(a.sampleRate * dur), buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = a.createBufferSource(), g = a.createGain();
    g.gain.value = vol; src.buffer = buf; src.connect(g); g.connect(a.destination); src.start();
  }
  const sounds = {
    win() { [523, 659, 784, 1047].forEach((f, i) => tone(f, i * 0.09, 0.28, 'triangle', 0.16)); tone(300, 0.4, 0.4, 'sawtooth', 0.07, 700); },
    lose() { [196, 185, 175].forEach((f, i) => tone(f, i * 0.22, 0.24, 'sawtooth', 0.09)); tone(165, 0.66, 0.7, 'sawtooth', 0.09, 110); },
    buzz() { tone(150, 0, 0.22, 'square', 0.07); tone(120, 0.2, 0.25, 'square', 0.07); },
    pop() { noise(0.09, 0.3); tone(700, 0, 0.08, 'square', 0.05, 200); },
    click() { tone(660, 0, 0.06, 'triangle', 0.08); }
  };

  // ---------- things on screen ----------
  function newBalloon(k, who) {
    const r = rand(38, 62) * Math.min(1, W / 700 + 0.45);
    return {
      x: rand(r, W - r), baseX: 0, y: H + r * 1.5 + rand(0, 380), vy: rand(70, 130),
      r, hue: Math.floor(rand(0, 360)), face: who == null ? k % 2 : (k % 3 === 0 ? who : k % 2),
      phase: rand(0, 6.28), age: 0
    };
  }
  function addConfetti(n, x, y, burst) {
    for (let i = 0; i < n; i++) {
      confetti.push({
        x: x == null ? rand(0, W) : x, y: y == null ? rand(-H * 0.3, -10) : y,
        vx: burst ? rand(-260, 260) : rand(-40, 40), vy: burst ? rand(-380, -60) : rand(120, 320),
        w: rand(6, 12), h: rand(8, 16), rot: rand(0, 6.28), vr: rand(-8, 8),
        color: burst && burst !== true ? burst : `hsl(${Math.floor(rand(0, 360))},90%,60%)`, life: 4
      });
    }
  }
  function addRain(n) {
    for (let i = 0; i < n; i++) {
      rain.push({ x: rand(0, W), y: rand(-H * 0.6, -40), vy: rand(160, 300), r: rand(20, 36), rot: rand(0, 6.28), vr: rand(-4, 4), face: i % 2 });
    }
  }

  function drawBalloon(b) {
    const rx = b.r * 0.98, ry = b.r * 1.18;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(Math.sin(b.phase + b.age * 1.5) * 0.08);
    // string
    ctx.strokeStyle = 'rgba(60,60,90,.55)'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, ry); ctx.quadraticCurveTo(14, ry + 28, -8, ry + 62); ctx.stroke();
    // balloon body
    const g = ctx.createRadialGradient(-rx * 0.35, -ry * 0.4, rx * 0.1, 0, 0, ry * 1.1);
    g.addColorStop(0, `hsl(${b.hue},95%,78%)`); g.addColorStop(1, `hsl(${b.hue},85%,52%)`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
    // knot
    ctx.beginPath(); ctx.moveTo(0, ry - 2); ctx.lineTo(-7, ry + 9); ctx.lineTo(7, ry + 9); ctx.closePath();
    ctx.fillStyle = `hsl(${b.hue},85%,45%)`; ctx.fill();
    // face printed on the balloon
    Faces.draw(ctx, b.face, 0, -ry * 0.04, b.r * 0.76);
    // shine
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.beginPath(); ctx.ellipse(-rx * 0.62, -ry * 0.55, rx * 0.12, ry * 0.2, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }

  function popBalloon(b, i) {
    balloons.splice(i, 1);
    addConfetti(22, b.x, b.y, `hsl(${b.hue},90%,58%)`);
    texts.push({ x: b.x, y: b.y, t: 0, txt: pick(['POP!', 'BANG!', 'POP POP!', 'Splat!']) });
    sounds.pop();
    start();
  }

  // Tap or click a balloon to pop it.
  window.addEventListener('pointerdown', e => {
    audio();                                           // first touch unlocks sound on iPads/phones
    for (let i = balloons.length - 1; i >= 0; i--) {
      const b = balloons[i];
      const dx = (e.clientX - b.x) / (b.r * 1.15), dy = (e.clientY - b.y) / (b.r * 1.35);
      if (dx * dx + dy * dy <= 1) { popBalloon(b, i); break; }
    }
  }, true);

  // ---------- animation loop (runs only while something is on screen) ----------
  function frame(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000 || 0.016);
    last = ts;
    ctx.clearRect(0, 0, W, H);

    rain = rain.filter(f => f.y < H + 60);
    rain.forEach(f => {
      f.y += f.vy * dt; f.rot += f.vr * dt;
      Faces.draw(ctx, f.face, f.x, f.y, f.r, { rot: f.rot });
    });

    balloons = balloons.filter(b => b.y > -b.r * 3);
    balloons.forEach(b => {
      b.age += dt; b.y -= b.vy * dt;
      b.x += Math.sin(b.phase + b.age * 1.5) * 18 * dt;
      drawBalloon(b);
    });

    confetti = confetti.filter(c => c.life > 0 && c.y < H + 30);
    confetti.forEach(c => {
      c.vy += 420 * dt; c.x += c.vx * dt; c.y += c.vy * dt; c.rot += c.vr * dt; c.life -= dt;
      ctx.save(); ctx.translate(c.x, c.y); ctx.rotate(c.rot);
      ctx.fillStyle = c.color; ctx.fillRect(-c.w / 2, -c.h / 2, c.w, c.h);
      ctx.restore();
    });

    if (bigFace) {
      bigFace.t += dt;
      const t = bigFace.t, grow = Math.min(1, t / 0.45), out = t > 1.9 ? Math.max(0, 1 - (t - 1.9) / 0.5) : 1;
      const back = 1 + 2.7 * Math.pow(grow - 1, 3) + 1.7 * Math.pow(grow - 1, 2);   // "easeOutBack": overshoots, then settles
      const r = Math.min(W, H) * 0.17 * back * out;
      if (out <= 0) bigFace = null;
      else Faces.draw(ctx, bigFace.idx, W / 2, H * 0.34, r, { hat: true, rot: Math.sin(t * 7) * 0.18, ring: '#ffd23f' });
    }

    texts = texts.filter(x => x.t < 0.9);
    texts.forEach(x => {
      x.t += dt;
      ctx.save(); ctx.globalAlpha = Math.max(0, 1 - x.t / 0.9);
      ctx.font = '800 26px "Trebuchet MS", system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.lineWidth = 5; ctx.strokeStyle = '#fff'; ctx.fillStyle = '#ff4f8b';
      ctx.strokeText(x.txt, x.x, x.y - x.t * 60); ctx.fillText(x.txt, x.x, x.y - x.t * 60);
      ctx.restore();
    });

    if (balloons.length || confetti.length || rain.length || texts.length || bigFace) raf = requestAnimationFrame(frame);
    else { raf = 0; ctx.clearRect(0, 0, W, H); }
  }
  function start() { if (!raf) { last = performance.now(); raf = requestAnimationFrame(frame); } }

  function banner(text, bad) {
    bannerEl.textContent = text;
    bannerEl.classList.toggle('bad', !!bad);
    bannerEl.classList.remove('show'); void bannerEl.offsetWidth; bannerEl.classList.add('show');
  }

  // ---------- public ----------
  return {
    // level 1 = right answer, 2 = streak of 3+, 3 = end of game
    celebrate(level, who) {
      sounds.win();
      const n = level >= 3 ? 30 : level === 2 ? 18 : 10;
      for (let i = 0; i < n; i++) balloons.push(newBalloon(i, who));
      addConfetti(level >= 3 ? 260 : level === 2 ? 190 : 110);
      if (level >= 2) { addRain(level >= 3 ? 22 : 12); bigFace = { idx: who == null ? 0 : who, t: 0 }; }
      banner(level >= 3 ? 'WHAT A SHOWDOWN!' : level === 2 ? pick(STREAK_LINES) : pick(WIN_LINES));
      start();
    },
    wrong(final) {
      if (final) { sounds.lose(); banner('So close! Read the working below', true); }
      else { sounds.buzz(); banner(pick(OOPS_LINES), true); }
      const el = document.getElementById('stage-wrap');
      el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake');
    },
    click: () => sounds.click(),
    setMuted(m) { muted = m; },
    isMuted: () => muted,
    unlock: audio,
    clear() { balloons = []; confetti = []; rain = []; texts = []; bigFace = null; bannerEl.classList.remove('show'); ctx.clearRect(0, 0, W, H); }
  };
})();
