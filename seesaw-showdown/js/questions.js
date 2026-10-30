/* questions.js
   Creates the physics questions and checks the answers.
   Nothing in this file draws anything. It just returns plain objects
   (data) that scenes.js draws and game.js shows on screen.

   To change difficulty, edit the lists of numbers at the top of each
   gen... function (for example the weights or distances). */

const Q = (() => {
  // ---------- small helpers ----------
  const rand = (a, b) => a + Math.random() * (b - a);
  const rint = (a, b) => Math.floor(rand(a, b + 1));
  const pick = arr => arr[Math.floor(Math.random() * arr.length)];
  const r2 = x => Math.round(x * 100) / 100;
  const fmt = x => String(r2(x));                       // 1.50 -> "1.5"
  const isStep = (x, step) => Math.abs(x / step - Math.round(x / step)) < 1e-9;
  const near = (a, b) => Math.abs(a - b) <= Math.max(0.011, Math.abs(b) * 0.01);  // 1% tolerance
  const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const nm = i => esc(Faces.name(i));

  // Discussion prompts. They are shown on screen so partners talk first.
  const TALK = {
    moment: [
      'Explain to your partner, in your own words, what a “moment” is.',
      'Why does a longer spanner make a stubborn nut easier to turn?',
      'What are the units of a moment, and where do they come from?'
    ],
    balance: [
      'Before you type: if the seat moves closer to the pivot, does its moment get bigger or smaller? Why?',
      'Explain to your partner what “balanced” means in terms of moments.',
      'Who is heavier? So who should sit closer to the pivot?'
    ],
    direction: [
      'Don’t calculate yet. Predict which side goes down and say why.',
      'Which has the bigger moment: a heavy weight close in, or a light weight far out?',
      'Convince your partner: what must be true for the seesaw to balance?'
    ],
    topple: [
      'Where does the dashed line land compared with the wheels? What does that tell you?',
      'How could the bus company make this bus more stable?',
      'Why do double-decker buses keep heavy parts low down?'
    ],
    pin: [
      'Where would you hang the shape from, and why does the CoG end up directly below the pivot?',
      'Is there a line of symmetry? What does it tell you about the CoG?',
      'Must the CoG always be inside the shape? Think of a ring or a boomerang.'
    ]
  };

  // =====================================================
  // 1. MOMENT = FORCE x DISTANCE  (spanner)
  // =====================================================
  function genMoment(pi, tough) {
    const F = pick([10, 20, 25, 30, 40, 50, 60, 80, 100, 120, 150]);   // newtons
    const d = pick([0.1, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.8, 1.0, 1.2, 1.5]); // metres
    const M = r2(F * d);
    const variant = tough ? pick(['M', 'M', 'F', 'd']) : 'M';       // which quantity is unknown
    const useCm = variant !== 'd' && Math.random() < (tough ? 0.6 : 0.3);
    const dText = useCm ? `${fmt(d * 100)} cm` : `${fmt(d)} m`;
    const who = nm(pi);
    let prompt, unit, correct, explain, hint;

    if (variant === 'M') {
      prompt = `<b>${who}</b> pushes down on the end of a spanner with a force of <b>${F} N</b>. The force acts <b>${dText}</b> from the centre of the nut. Calculate the <b>moment</b> (turning effect) about the nut.`;
      unit = 'N m'; correct = M;
      explain = `moment = force × distance = ${F} N × ${fmt(d)} m = <b>${fmt(M)} N m</b>` + (useCm ? ` (${fmt(d * 100)} cm = ${fmt(d)} m, so convert to metres first!)` : '');
      hint = 'Moment = force × perpendicular distance. Make sure the distance is in <b>metres</b> (100 cm = 1 m).';
    } else if (variant === 'F') {
      prompt = `A nut needs a moment of <b>${fmt(M)} N m</b> to turn it. <b>${who}</b> pushes on a spanner at a distance of <b>${dText}</b> from the nut. What force must ${who} apply?`;
      unit = 'N'; correct = F;
      explain = `force = moment ÷ distance = ${fmt(M)} ÷ ${fmt(d)} = <b>${fmt(F)} N</b>` + (useCm ? ` (distance converted from ${fmt(d * 100)} cm to ${fmt(d)} m)` : '');
      hint = 'Rearrange moment = force × distance to get force = moment ÷ distance. Use metres.';
    } else {
      prompt = `A nut needs a moment of <b>${fmt(M)} N m</b> to turn it. <b>${who}</b> can push with a force of <b>${F} N</b>. How far from the nut must the force be applied? Give your answer in metres.`;
      unit = 'm'; correct = d;
      explain = `distance = moment ÷ force = ${fmt(M)} ÷ ${F} = <b>${fmt(d)} m</b>`;
      hint = 'Rearrange moment = force × distance to get distance = moment ÷ force.';
    }

    return {
      type: 'moment', title: 'Spanner turn', prompt, talk: pick(TALK.moment),
      inputKind: 'number', unit, correct, explain, hint,
      check(v) {
        if (near(v, correct)) return { ok: true };
        if (useCm && (near(v, correct * 100) || near(v, correct / 100))) {
          return { ok: false, msg: 'Check your units. Convert centimetres to metres first (100 cm = 1 m).' };
        }
        return { ok: false, msg: 'Not quite. Remember: moment = force × distance.' };
      },
      scene: { kind: 'spanner', pi, F, d, M, dText, unknown: variant }
    };
  }

  // =====================================================
  // 2. PRINCIPLE OF MOMENTS: make the seesaw balance
  // =====================================================
  function genBalance(pi, unknown) {
    const wts = [200, 250, 300, 350, 400, 450, 500, 550, 600];
    const dists = [0.5, 0.75, 1, 1.25, 1.5, 2, 2.5];
    let W1, d1, W2, d2, tries = 0;
    while (tries++ < 5000) {
      W1 = pick(wts); d1 = pick(dists);
      if (unknown === 'd') {
        W2 = pick(wts); d2 = W1 * d1 / W2;
        if (W2 !== W1 && d2 >= 0.5 && d2 <= 3 && isStep(d2, 0.25) && Math.abs(d2 - d1) > 1e-9) break;
      } else {
        d2 = pick(dists); W2 = W1 * d1 / d2;
        if (d2 !== d1 && W2 >= 100 && W2 <= 900 && isStep(W2, 10)) break;
      }
    }
    if (tries >= 5000) { W1 = 400; d1 = 1.5; W2 = 300; d2 = 2; }       // safe fallback (both moments = 600)

    const a = nm(pi), b = nm(1 - pi);
    const Ml = W1 * d1;
    const decoys = [0.5, 1, 1.5, 2, 2.5, 3].filter(c => Math.abs(c - d2) >= 0.75);
    const loads = [
      { side: 'L', d: d1, W: W1, face: pi },
      { side: 'R', d: d2, W: W2, face: 1 - pi, unkD: unknown === 'd', unkW: unknown === 'F', decoyD: pick(decoys) }
    ];

    let prompt, unit, correct, explain, hint;
    if (unknown === 'd') {
      prompt = `<b>${a}</b> weighs <b>${W1} N</b> and sits <b>${fmt(d1)} m</b> to the left of the pivot. <b>${b}</b> weighs <b>${W2} N</b>. How far from the pivot must ${b} sit on the right so the seesaw balances?`;
      unit = 'm'; correct = d2;
      explain = `Balanced when anticlockwise moment = clockwise moment.<br>${W1} × ${fmt(d1)} = ${W2} × d<br>d = ${fmt(Ml)} ÷ ${W2} = <b>${fmt(d2)} m</b>`;
      hint = `${a}’s moment = ${W1} × ${fmt(d1)} = <b>${fmt(Ml)} N m</b>. ${b}’s moment must be exactly the same.`;
    } else {
      prompt = `<b>${a}</b> weighs <b>${W1} N</b> and sits <b>${fmt(d1)} m</b> to the left of the pivot. <b>${b}</b> sits <b>${fmt(d2)} m</b> to the right. What must ${b}’s weight be for the seesaw to balance?`;
      unit = 'N'; correct = W2;
      explain = `Balanced when anticlockwise moment = clockwise moment.<br>${W1} × ${fmt(d1)} = W × ${fmt(d2)}<br>W = ${fmt(Ml)} ÷ ${fmt(d2)} = <b>${fmt(W2)} N</b>`;
      hint = `${a}’s moment = ${W1} × ${fmt(d1)} = <b>${fmt(Ml)} N m</b>. ${b}’s moment must be exactly the same.`;
    }

    return {
      type: 'balance', title: 'Balance the seesaw', prompt, talk: pick(TALK.balance),
      inputKind: 'number', unit, correct, explain, hint,
      check(v) {
        if (near(v, correct)) return { ok: true };
        const Mr = unknown === 'd' ? W2 * v : v * d2;
        return {
          ok: false,
          msg: Mr > Ml
            ? 'That makes the clockwise moment too big, so the right side drops.'
            : 'That makes the clockwise moment too small, so the left side drops.'
        };
      },
      scene: { kind: 'seesaw', mode: 'balance', held: true, pi, loads }
    };
  }

  // =====================================================
  // 3. WHICH WAY WILL IT TURN?  (compare total moments)
  // =====================================================
  function genDirection(pi, tough) {
    const ws = [100, 150, 200, 250, 300, 350, 400, 450, 500, 600];
    const ds = [0.5, 1, 1.5, 2, 2.5];
    const wantBal = Math.random() < 0.25;
    let best = null;

    for (let t = 0; t < 6000 && !best; t++) {
      const nL = tough ? pick([1, 2]) : 1, nR = tough ? pick([1, 2]) : 1;
      const make = (side, n) => {
        const arr = [];
        for (let k = 0; k < n; k++) {
          let d, guard = 0;
          do { d = pick(ds); guard++; } while (arr.some(l => Math.abs(l.d - d) < 1) && guard < 30);
          if (arr.some(l => Math.abs(l.d - d) < 1)) return null;
          arr.push({ side, d, W: pick(ws) });
        }
        return arr;
      };
      const L = make('L', nL), R = make('R', nR);
      if (!L || !R) continue;
      const ML = L.reduce((s, l) => s + l.W * l.d, 0), MR = R.reduce((s, l) => s + l.W * l.d, 0);
      const diff = ML - MR;
      // a balanced case where both sides are identical is too easy to spot, so skip it
      const mirror = L.length === 1 && R.length === 1 && L[0].W === R[0].W && L[0].d === R[0].d;
      const ok = wantBal ? (Math.abs(diff) < 1e-9 && !mirror) : Math.abs(diff) >= Math.max(150, 0.12 * Math.max(ML, MR));
      if (ok) best = { L, R, ML, MR, diff };
    }
    if (!best) {
      const L = [{ side: 'L', d: 1.5, W: 400 }], R = [{ side: 'R', d: 2, W: 200 }];
      best = { L, R, ML: 600, MR: 400, diff: 200 };
    }

    const { L, R, ML, MR, diff } = best;
    // First load on each side is a person; extra loads are crates.
    L[0].face = pi; R[0].face = 1 - pi;
    [...L, ...R].forEach(l => { if (l.face == null) l.crate = true; });
    const loads = [...L, ...R];

    const correct = Math.abs(diff) < 1e-9 ? 'B' : diff > 0 ? 'L' : 'R';
    const sumStr = arr => arr.map(l => `${l.W} × ${fmt(l.d)}`).join(' + ');
    const verdict = { L: 'The <b>left side goes down</b> (anticlockwise moment is bigger).', R: 'The <b>right side goes down</b> (clockwise moment is bigger).', B: 'The moments are equal, so the seesaw <b>balances</b>.' }[correct];

    return {
      type: 'direction', title: 'Which way will it turn?',
      prompt: 'Look at the weights and distances. <b>Which way will the seesaw turn when it is let go?</b> Compare the total anticlockwise moment (left) with the total clockwise moment (right).',
      talk: pick(TALK.direction),
      inputKind: 'choice',
      choices: [
        { id: 'L', label: '⬅️ Left side goes down' },
        { id: 'B', label: '⚖️ It balances' },
        { id: 'R', label: 'Right side goes down ➡️' }
      ],
      correct,
      explain: `Anticlockwise (left): ${sumStr(L)} = <b>${fmt(ML)} N m</b><br>Clockwise (right): ${sumStr(R)} = <b>${fmt(MR)} N m</b><br>${verdict}`,
      hint: 'Work out force × distance for every weight, then add up each side. The bigger total wins.',
      check(v) {
        return v === correct ? { ok: true } : { ok: false, msg: 'Not quite. Add up the moments on each side and compare them.' };
      },
      scene: { kind: 'seesaw', mode: 'direction', held: true, pi, loads }
    };
  }

  // =====================================================
  // 4. WILL IT TOPPLE?  (centre of gravity over the base)
  // =====================================================
  function genTopple(pi, tough) {
    const margin = tough ? 0.08 : 0.15;
    let d = null;
    for (let i = 0; i < 800 && !d; i++) {
      const high = Math.random() < 0.5;
      const hg = r2(high ? rand(1.9, 2.5) : rand(1.1, 1.5));    // height of CoG above ground (m)
      const w = r2(rand(1.8, 2.6));                              // distance between wheels (m)
      const want = Math.random() < 0.5;
      const ratio = want ? rand(1 + margin, 1.9) : rand(0.35, 1 - margin);
      const th = Math.round(Math.atan(ratio * (w / 2) / hg) * 180 / Math.PI);
      if (th < 6 || th > 42) continue;
      const real = hg * Math.tan(th * Math.PI / 180) / (w / 2);  // >1 means the line lands outside the wheels
      if (real > 1 - margin && real < 1 + margin) continue;
      d = { high, hg, w, th, real, topples: real > 1 };
    }
    if (!d) d = { high: true, hg: 2.2, w: 2, th: 30, real: 1.27, topples: true };

    const story = d.high
      ? 'Everyone has rushed upstairs to the top deck.'
      : 'The passengers are downstairs and the heavy luggage is in the hold.';
    const correct = d.topples ? 'T' : 'S';

    return {
      type: 'topple', title: 'Topple test',
      prompt: `${story} The bus is parked on a slope of <b>${d.th}°</b>. The dashed line shows the direction of the bus’s weight, straight down from the <b>centre of gravity</b> (CoG). Will the bus <b>topple over</b>?`,
      talk: pick(TALK.topple),
      inputKind: 'choice',
      choices: [
        { id: 'S', label: '🚌 Stays upright' },
        { id: 'T', label: '💥 Topples over' }
      ],
      correct,
      explain: d.topples
        ? 'The dashed line from the CoG lands <b>outside the wheels</b> (the base). The weight now gives a turning moment about the downhill wheel that rolls the bus over, so it <b>topples</b>.<br><i>To be more stable: lower the CoG or widen the base.</i>'
        : 'The dashed line from the CoG lands <b>inside the wheels</b> (the base). The weight’s moment about the downhill wheel pulls the bus back down, so it <b>stays upright</b>.<br><i>To be even more stable: lower the CoG or widen the base.</i>',
      hint: 'Look at where the dashed line touches the slope. Is it between the wheels (the base) or outside them?',
      check(v) {
        return v === correct ? { ok: true } : { ok: false, msg: 'Not quite. Check where the dashed line lands compared with the wheels.' };
      },
      scene: { kind: 'topple', pi, hg: d.hg, w: d.w, th: d.th, high: d.high, topples: d.topples }
    };
  }

  // =====================================================
  // 5. FIND THE CENTRE OF GRAVITY (drag the pin)
  // =====================================================
  const circlePts = Array.from({ length: 64 }, (_, k) => [0.8 + 0.8 * Math.cos(2 * Math.PI * k / 64), 0.8 + 0.8 * Math.sin(2 * Math.PI * k / 64)]);
  const SHAPES = {
    rect: {
      label: 'rectangle', pts: [[0, 0], [1.8, 0], [1.8, 1.1], [0, 1.1]], lines: 'diag',
      why: 'The centre of the rectangle, where the diagonals (and the lines of symmetry) cross.'
    },
    circle: {
      label: 'disc', pts: circlePts, lines: [[[0, 0.8], [1.6, 0.8]], [[0.8, 0], [0.8, 1.6]]],
      why: 'The centre of the disc, where the lines of symmetry cross.'
    },
    triangle: {
      label: 'triangle', pts: [[0, 1.3], [1.9, 1.3], [0.95, 0]], lines: 'med',
      why: 'Where the three medians meet (lines from each corner to the middle of the opposite side). That is one third of the way up from the base.'
    },
    rightTri: {
      label: 'right-angled triangle', pts: [[0, 0], [0, 1.4], [1.8, 1.4]], lines: 'med',
      why: 'Where the three medians meet: one third of the way along from each of the two sides that make the right angle.'
    },
    parallelogram: {
      label: 'parallelogram', pts: [[0.6, 0], [2.1, 0], [1.5, 1.1], [0, 1.1]], lines: 'diag',
      why: 'Where the two diagonals cross.'
    },
    L: {
      label: 'L-shape', pts: [[0, 0], [0.7, 0], [0.7, 1.0], [1.7, 1.0], [1.7, 1.7], [0, 1.7]], lines: [[[0, 1.7], [1.0, 0.7]]],
      why: 'It lies on the line of symmetry, nearer the corner where most of the material is.'
    },
    T: {
      label: 'T-shape', pts: [[0, 0], [1.8, 0], [1.8, 0.6], [1.2, 0.6], [1.2, 1.8], [0.6, 1.8], [0.6, 0.6], [0, 0.6]], lines: [[[0.9, 0], [0.9, 1.8]]],
      why: 'It lies on the vertical line of symmetry, but nearer the top than the middle, because the wide top bar has more material than the stem.'
    },
    house: {
      label: 'house shape', pts: [[0, 0.8], [0.9, 0], [1.8, 0.8], [1.8, 1.8], [0, 1.8]], lines: [[[0.9, 0], [0.9, 1.8]]],
      why: 'It lies on the vertical line of symmetry, nearer the square part than the roof because the square has more material.'
    }
  };
  const TIERS = { easy: ['rect', 'circle'], mid: ['triangle', 'rightTri', 'parallelogram'], hard: ['L', 'T', 'house'] };

  function centroid(pts) {
    let A = 0, cx = 0, cy = 0;
    for (let i = 0; i < pts.length; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[(i + 1) % pts.length];
      const cr = x0 * y1 - x1 * y0;
      A += cr; cx += (x0 + x1) * cr; cy += (y0 + y1) * cr;
    }
    A /= 2;
    return { x: cx / (6 * A), y: cy / (6 * A) };
  }
  function hintLines(sh) {
    const p = sh.pts;
    if (sh.lines === 'med') {
      const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
      return [[p[0], mid(p[1], p[2])], [p[1], mid(p[0], p[2])], [p[2], mid(p[0], p[1])]];
    }
    if (sh.lines === 'diag') return [[p[0], p[2]], [p[1], p[3]]];
    return sh.lines;
  }

  function genPin(pi, tier, used) {
    const pool = TIERS[tier] || TIERS.easy;
    const fresh = pool.filter(k => !used.includes(k));
    const key = pick(fresh.length ? fresh : pool);
    used.push(key);
    const sh = SHAPES[key];
    const c = centroid(sh.pts);
    const tol = tier === 'hard' ? 0.15 : tier === 'mid' ? 0.17 : 0.2;   // in shape units

    return {
      type: 'pin', title: 'Find the centre of gravity',
      prompt: `Drag the pin to where you think the <b>centre of gravity</b> of this <b>${sh.label}</b> is. Imagine it is a flat sheet of card of the same thickness all over.`,
      talk: pick(TALK.pin),
      inputKind: 'pin', correct: c,
      explain: `${sh.why}<br><i>The weight of the whole shape acts through this one point.</i>`,
      hint: key === 'rect' || key === 'circle' || key === 'parallelogram'
        ? 'Use the lines of symmetry (or diagonals). The CoG is where they cross.'
        : key === 'triangle' || key === 'rightTri'
          ? 'Draw a line from each corner to the middle of the opposite side. They all cross at the CoG.'
          : 'The dashed line is a line of symmetry. The CoG must be somewhere on it. Which way is most of the material?',
      check(v) {
        const dx = c.x - v.x, dy = c.y - v.y;
        if (Math.hypot(dx, dy) <= tol) return { ok: true };
        const bits = [];
        if (Math.abs(dy) > tol * 0.5) bits.push(dy > 0 ? 'lower' : 'higher');
        if (Math.abs(dx) > tol * 0.5) bits.push(dx > 0 ? 'to the right' : 'to the left');
        return { ok: false, msg: `Not quite. Try a bit ${bits.join(' and ')}.` };
      },
      scene: { kind: 'pin', pi, key, pts: sh.pts, centroid: c, tol, lines: hintLines(sh) }
    };
  }

  // ---------- public ----------
  function make(spec, pi, used) {
    switch (spec.type) {
      case 'moment': return genMoment(pi, spec.tough);
      case 'balance': return genBalance(pi, spec.unknown);
      case 'direction': return genDirection(pi, spec.tough);
      case 'topple': return genTopple(pi, spec.tough);
      case 'pin': return genPin(pi, spec.tier, used);
    }
    throw new Error('Unknown question type: ' + spec.type);
  }

  return { make };
})();
