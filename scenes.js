/* scenes.js
   Draws the picture for each question onto the main <canvas>.
   Every scene is an object with:
     update(dt)         - move things (dt = seconds since last frame)
     draw(ctx)          - paint the picture
     pointer(kind,x,y)  - touch/mouse input (only the pin scene uses it)
     onWrong(answer)    - called after a wrong try
     onReveal(ok)       - called when the round ends (show the true answer)
     onHint()           - called when the hint button is pressed
   The drawing area is always 960 units wide. game.js scales it to fit the screen. */

const Scenes = (() => {
  const VW = 960;
  let VH = 528, U = 0.5;                              // VH = drawing height, U = screen pixels per drawing unit
  const PX = 130;                                     // seesaw: drawing units per metre
  const fmt = x => String(Math.round(x * 100) / 100);
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const noop = () => {};

  // ---------- drawing helpers ----------
  function setFont(ctx, size, weight) {                // never smaller than ~11 screen pixels
    ctx.font = `${weight || '700'} ${Math.max(size, 11 / U)}px "Trebuchet MS","Avenir Next",system-ui,sans-serif`;
  }
  function rr(ctx, x, y, w, h, r) {                    // rounded rectangle path
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function pill(ctx, text, x, y, o) {                  // label with a rounded background
    o = o || {};
    const size = o.size || 18;
    setFont(ctx, size);
    const w = ctx.measureText(text).width + 18, h = Math.max(size, 11 / U) + 12;
    rr(ctx, x - w / 2, y - h / 2, w, h, h / 2);
    ctx.fillStyle = o.bg || 'rgba(255,255,255,.94)'; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = o.border || '#c9d3ec'; ctx.stroke();
    ctx.fillStyle = o.fg || '#1b1f4b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, x, y + 1);
  }
  function sky(ctx, groundY) {
    const g = ctx.createLinearGradient(0, 0, 0, VH);
    g.addColorStop(0, '#a9defa'); g.addColorStop(1, '#e6f6ff');
    ctx.fillStyle = g; ctx.fillRect(0, 0, VW, VH);
    if (groundY != null) {
      ctx.fillStyle = '#7ccf6a'; ctx.fillRect(0, groundY, VW, VH - groundY);
      ctx.fillStyle = '#58b24a'; ctx.fillRect(0, groundY, VW, 8);
    }
  }
  function arrow(ctx, x0, y0, x1, y1, color, width) {
    const a = Math.atan2(y1 - y0, x1 - x0), h = 16 + width;
    ctx.strokeStyle = color; ctx.fillStyle = color; ctx.lineWidth = width; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1 - Math.cos(a) * h * 0.6, y1 - Math.sin(a) * h * 0.6); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(x1, y1);
    ctx.lineTo(x1 - Math.cos(a - 0.45) * h, y1 - Math.sin(a - 0.45) * h);
    ctx.lineTo(x1 - Math.cos(a + 0.45) * h, y1 - Math.sin(a + 0.45) * h);
    ctx.closePath(); ctx.fill();
  }
  function wood(ctx, x, y, w, h) {
    const g = ctx.createLinearGradient(0, y, 0, y + h);
    g.addColorStop(0, '#e6b673'); g.addColorStop(1, '#b8863f');
    ctx.fillStyle = g; rr(ctx, x, y, w, h, 4); ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = '#7a5524'; ctx.stroke();
  }

  // =====================================================
  // SPANNER  (moment = force x distance)
  // =====================================================
  function makeSpanner(p) {
    return {
      kind: 'spanner', p, rev: false, ok: false, spin: 0, spinning: false, t: 0,
      update(dt) {
        this.t += dt;
        if (this.spinning) { this.spin += dt / 1.4; if (this.spin >= 1) { this.spin = 1; this.spinning = false; } }
      },
      pointer: noop, onWrong: noop, onHint: noop,
      onReveal(ok) { this.rev = true; this.ok = ok; if (ok) { this.spinning = true; this.spin = 0; } },
      draw(ctx) {
        const nx = 170, ny = VH * 0.58;
        const len = 120 + Math.min(1.5, p.d) / 1.5 * 520;      // not to scale!
        const known = k => this.rev || p.unknown !== k;
        const ang = this.spin >= 1 ? 0 : ease(this.spin) * Math.PI * 2;

        const bg = ctx.createLinearGradient(0, 0, 0, VH);
        bg.addColorStop(0, '#dbe7f5'); bg.addColorStop(1, '#f4f8fc');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, VW, VH);
        ctx.fillStyle = '#b48a56'; ctx.fillRect(0, VH * 0.88, VW, VH * 0.12);        // workbench

        ctx.save();
        ctx.translate(nx, ny); ctx.rotate(ang);
        const metal = ctx.createLinearGradient(0, -20, 0, 20);
        metal.addColorStop(0, '#f1f4f6'); metal.addColorStop(1, '#8fa3ad');
        ctx.fillStyle = metal; ctx.strokeStyle = '#4f6772'; ctx.lineWidth = 2.5;
        rr(ctx, 0, -17, len + 24, 34, 17); ctx.fill(); ctx.stroke();                 // handle
        ctx.beginPath(); ctx.arc(0, 0, 56, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // head
        ctx.beginPath();                                                              // nut (hexagon)
        for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3; ctx.lineTo(Math.cos(a) * 32, Math.sin(a) * 32); }
        ctx.closePath(); ctx.fillStyle = '#37474f'; ctx.fill();
        ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI * 2); ctx.fillStyle = '#cfd8dc'; ctx.fill();

        // the push
        arrow(ctx, len, -118, len, -22, '#e53935', 7);
        Faces.draw(ctx, p.pi, len, -165, 40, { ring: '#ffd23f' });
        pill(ctx, `F = ${known('F') ? fmt(p.F) : '?'} N`, len + 74, -92, { fg: '#b71c1c', border: '#e53935' });

        // distance
        const yy = 62;
        ctx.strokeStyle = '#1b1f4b'; ctx.lineWidth = 2.5; ctx.lineCap = 'butt';
        ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(len, yy);
        ctx.moveTo(0, yy - 9); ctx.lineTo(0, yy + 9); ctx.moveTo(len, yy - 9); ctx.lineTo(len, yy + 9); ctx.stroke();
        pill(ctx, `distance = ${known('d') ? p.dText : '?'}`, len / 2, yy + 26);

        // turning effect
        ctx.strokeStyle = '#6a4cff'; ctx.lineWidth = 6; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(0, 0, 84, -2.7, -0.55); ctx.stroke();
        const E = [84 * Math.cos(-0.55), 84 * Math.sin(-0.55)], tg = [-Math.sin(-0.55), Math.cos(-0.55)], nn = [Math.cos(-0.55), Math.sin(-0.55)];
        ctx.fillStyle = '#6a4cff'; ctx.beginPath();
        ctx.moveTo(E[0] + tg[0] * 22, E[1] + tg[1] * 22);
        ctx.lineTo(E[0] + nn[0] * 12, E[1] + nn[1] * 12); ctx.lineTo(E[0] - nn[0] * 12, E[1] - nn[1] * 12);
        ctx.closePath(); ctx.fill();
        pill(ctx, `moment = ${known('M') ? fmt(p.M) + ' N m' : '?'}`, 6, -122, { fg: '#3d2bb5', border: '#6a4cff' });
        ctx.restore();

        setFont(ctx, 14, '600'); ctx.fillStyle = '#5a6488'; ctx.textAlign = 'right'; ctx.textBaseline = 'alphabetic';
        ctx.fillText('(diagram not to scale)', VW - 16, VH - 14);
      }
    };
  }

  // =====================================================
  // SEESAW  (balance + direction questions)
  // =====================================================
  function tiltOf(loads) {                              // radians: negative = left side down
    let ML = 0, MR = 0;
    loads.forEach(l => { const m = (l.W == null ? 0 : l.W) * l.td; if (l.side === 'L') ML += m; else MR += m; });
    if (Math.abs(ML - MR) < 1e-6 || ML + MR === 0) return 0;
    return -clamp((ML - MR) / (ML + MR) * 60, -10, 10) * Math.PI / 180;
  }

  function drawLoad(ctx, l) {
    const x = (l.side === 'L' ? -1 : 1) * l.d * PX;
    const plank = -14;
    let top;
    if (l.face != null) {
      const r = 20 + 16 * Math.sqrt(Math.min(l.sizeW, 900) / 500);
      const col = l.face === 0 ? '#ff7a59' : '#22b5a6';
      rr(ctx, x - r * 0.62, plank - r * 0.95, r * 1.24, r * 0.95, r * 0.3);
      ctx.fillStyle = col; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(20,20,60,.35)'; ctx.stroke();
      Faces.draw(ctx, l.face, x, plank - r * 0.95 - r * 0.72, r);
      top = plank - r * 0.95 - r * 0.72 - r - 6;
      pill(ctx, `${Faces.name(l.face)}: ${l.wLabel}`, x, top - 14, { size: 17 });
    } else {
      const s = 30 + 22 * Math.sqrt(l.sizeW / 300);
      ctx.fillStyle = '#c8923f'; ctx.fillRect(x - s / 2, plank - s, s, s);
      ctx.lineWidth = 2.5; ctx.strokeStyle = '#6d4a17'; ctx.strokeRect(x - s / 2, plank - s, s, s);
      ctx.beginPath(); ctx.moveTo(x - s / 2, plank - s); ctx.lineTo(x + s / 2, plank); ctx.moveTo(x + s / 2, plank - s); ctx.lineTo(x - s / 2, plank); ctx.stroke();
      top = plank - s;
      pill(ctx, l.wLabel, x, top - 14, { size: 17 });
    }
    // distance marker under the plank
    const yy = 40 + 26 * l.order, col = l.side === 'L' ? '#e8553a' : '#0f8f84';
    ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = 'butt';
    ctx.beginPath(); ctx.moveTo(0, yy); ctx.lineTo(x, yy);
    ctx.moveTo(0, yy - 7); ctx.lineTo(0, yy + 7); ctx.moveTo(x, yy - 7); ctx.lineTo(x, yy + 7); ctx.stroke();
    ctx.setLineDash([3, 5]); ctx.beginPath(); ctx.moveTo(x, 4); ctx.lineTo(x, yy - 7); ctx.stroke(); ctx.setLineDash([]);
    setFont(ctx, 16); ctx.fillStyle = col; ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText(l.dLabel, x / 2, yy + 8);
  }

  function makeSeesaw(p) {
    const loads = p.loads.map(l => ({
      side: l.side, face: l.face, crate: !!l.crate,
      trueD: l.d, trueW: l.W, unkD: !!l.unkD, unkW: !!l.unkW,
      d: l.unkD ? l.decoyD : l.d, td: l.unkD ? l.decoyD : l.d,
      W: l.unkW ? null : l.W, sizeW: l.unkW ? 350 : l.W,
      wLabel: l.unkW ? '? N' : `${fmt(l.W)} N`,
      dLabel: l.unkD ? 'd = ?' : `d = ${fmt(l.d)} m`,
      order: 0
    }));
    ['L', 'R'].forEach(side => loads.filter(l => l.side === side).forEach((l, i) => { l.order = i; }));
    const sumStr = side => loads.filter(l => l.side === side).map(l => `${fmt(l.trueW)}×${fmt(l.trueD)}`).join(' + ');
    const sumVal = side => loads.filter(l => l.side === side).reduce((s, l) => s + l.trueW * l.trueD, 0);

    return {
      kind: 'seesaw', p, loads, ang: 0, vel: 0, tang: 0, released: !p.held, showMoments: false, ok: false, t: 0,
      pointer: noop, onHint: noop,
      update(dt) {
        this.t += dt;
        // springy plank so it wobbles into place
        this.vel += ((this.tang - this.ang) * 60 - this.vel * 6) * dt;
        this.ang += this.vel * dt;
        const k = 1 - Math.exp(-dt * 8);
        this.loads.forEach(l => { l.d += (l.td - l.d) * k; });
      },
      onWrong(v) {
        if (p.mode !== 'balance') return;               // direction rounds don't show a result until the end
        this.released = true;
        this.loads.forEach(l => {
          if (l.unkD) { l.td = clamp(v, 0.05, 3.1); l.dLabel = `d = ${fmt(v)} m (your answer)`; }
          if (l.unkW) { l.W = clamp(v, 1, 1500); l.sizeW = clamp(v, 50, 900); l.wLabel = `${fmt(v)} N (your answer)`; }
        });
        this.tang = tiltOf(this.loads);
      },
      onReveal(ok) {
        this.released = true; this.showMoments = true; this.ok = ok;
        this.loads.forEach(l => {
          l.td = l.trueD; l.W = l.trueW; l.sizeW = l.trueW;
          l.wLabel = `${fmt(l.trueW)} N`; l.dLabel = `d = ${fmt(l.trueD)} m`;
        });
        this.tang = tiltOf(this.loads);
      },
      draw(ctx) {
        const cx = VW / 2, cy = VH * 0.62, gy = cy + 86;
        sky(ctx, gy);

        // pivot (fulcrum)
        ctx.fillStyle = '#8d6e63'; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx - 52, gy); ctx.lineTo(cx + 52, gy); ctx.closePath(); ctx.fill();
        // blocks that hold the plank level until it is released
        if (!this.released) { ctx.fillStyle = '#9aa3b2'; ctx.fillRect(cx - 3 * PX - 14, cy, 28, 86); ctx.fillRect(cx + 3 * PX - 14, cy, 28, 86); }

        ctx.save();
        ctx.translate(cx, cy); ctx.rotate(this.ang);
        wood(ctx, -3.2 * PX, -14, 6.4 * PX, 14);
        ctx.strokeStyle = '#5d4020'; ctx.fillStyle = '#5d4020'; ctx.lineWidth = 1.5;
        setFont(ctx, 14, '600'); ctx.textAlign = 'center'; ctx.textBaseline = 'top';
        for (let m = -3; m <= 3; m += 0.5) {
          const x = m * PX, whole = (m % 1 === 0);
          ctx.beginPath(); ctx.moveTo(x, -14); ctx.lineTo(x, whole ? -6 : -10); ctx.stroke();
          if (whole && m !== 0) ctx.fillText(String(Math.abs(m)), x, 3);
        }
        this.loads.forEach(l => drawLoad(ctx, l));
        ctx.restore();

        ctx.beginPath(); ctx.arc(cx, cy, 8, 0, Math.PI * 2); ctx.fillStyle = '#d32f2f'; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = '#fff'; ctx.stroke();
        pill(ctx, 'pivot', cx, gy + 22, { size: 15 });

        if (this.showMoments) {
          const a = sumVal('L'), b = sumVal('R');
          pill(ctx, `↺ anticlockwise ${sumStr('L')} = ${fmt(a)} N m`, VW * 0.27, 28, { size: 16, fg: '#b0371f', border: '#e8553a' });
          pill(ctx, `↻ clockwise ${sumStr('R')} = ${fmt(b)} N m`, VW * 0.73, 28, { size: 16, fg: '#0b6b62', border: '#0f8f84' });
          if (Math.abs(a - b) < 1e-9) pill(ctx, '⚖️ BALANCED', cx, 70, { size: 22, fg: '#fff', bg: '#6a4cff', border: '#fff' });
        } else {
          pill(ctx, 'distances are measured from the pivot, in metres', cx, 28, { size: 15, fg: '#4a5480' });
        }
      }
    };
  }

  // =====================================================
  // BUS ON A SLOPE  (centre of gravity and toppling)
  // =====================================================
  function makeTopple(p) {
    return {
      kind: 'topple', p, t: 0, rev: false, ok: false, prog: 0,
      pointer: noop, onWrong: noop, onHint: noop,
      onReveal(ok) { this.rev = true; this.ok = ok; },
      update(dt) {
        this.t += dt;
        if (this.rev) this.prog = Math.min(1, this.prog + dt / (p.topples ? 1.1 : 0.7));
      },
      draw(ctx) {
        const th = p.th * Math.PI / 180, cos = Math.cos(th), sin = Math.sin(th);
        const S = VH * 0.105;                                    // drawing units per metre
        const Ox = 430, Oy = VH * 0.62;                          // middle of the bus's base, on the slope
        const bx = (p.w / 2) * S;                                // downhill wheel contact (distance along slope)
        sky(ctx);

        // slope
        const ex = cos * 1500, ey = sin * 1500;
        ctx.fillStyle = '#7ccf6a'; ctx.beginPath();
        ctx.moveTo(Ox - ex, Oy - ey); ctx.lineTo(Ox + ex, Oy + ey); ctx.lineTo(Ox + ex, Oy + ey + 2500); ctx.lineTo(Ox - ex, Oy - ey + 2500);
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = '#58b24a'; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(Ox - ex, Oy - ey); ctx.lineTo(Ox + ex, Oy + ey); ctx.stroke();

        // angle marker
        const Px = Ox + 270 * cos, Py = Oy + 270 * sin;
        ctx.strokeStyle = '#1b1f4b'; ctx.lineWidth = 2.5; ctx.setLineDash([6, 6]);
        ctx.beginPath(); ctx.moveTo(Px, Py); ctx.lineTo(Px - 150, Py); ctx.stroke(); ctx.setLineDash([]);
        ctx.beginPath(); ctx.arc(Px, Py, 80, Math.PI, Math.PI + th); ctx.stroke();
        setFont(ctx, 20); ctx.fillStyle = '#1b1f4b'; ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.fillText(`${p.th}°`, Px - 90, Py - 14);

        // the bus (drawn in the slope's own tilted frame)
        const falling = this.rev && p.topples;
        const roll = falling ? ease(this.prog) * 1.15 : 0;
        ctx.save();
        ctx.translate(Ox, Oy); ctx.rotate(th);
        if (falling) { ctx.translate(bx, 0); ctx.rotate(roll); ctx.translate(-bx, 0); }
        else if (this.rev) ctx.translate(0, -Math.sin(this.prog * Math.PI) * 10);

        // base (the wheels)
        ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = 7; ctx.lineCap = 'round';
        ctx.beginPath(); ctx.moveTo(-bx, 3); ctx.lineTo(bx, 3); ctx.stroke();

        const bw = (p.w + 0.5) * S, H = 4.2 * S, wr = 0.34 * S, x0 = -bw / 2;
        rr(ctx, x0, -H, bw, H - wr * 1.1, S * 0.25);
        const body = ctx.createLinearGradient(0, -H, 0, 0); body.addColorStop(0, '#f04a45'); body.addColorStop(1, '#c62828');
        ctx.fillStyle = body; ctx.fill(); ctx.lineWidth = 3; ctx.strokeStyle = '#7f1a17'; ctx.stroke();
        ctx.fillStyle = '#ffd23f'; ctx.fillRect(x0 + 2, -H * 0.5, bw - 4, H * 0.045);     // stripe between decks

        const wh = H * 0.17, wy = p.high ? -H * 0.76 : -H * 0.3, ww = bw * 0.17;
        for (let k = 0; k < 4; k++) {                                                    // windows on both decks
          [-H * 0.76, -H * 0.3].forEach(y => {
            rr(ctx, x0 + bw * (0.09 + 0.225 * k), y - wh / 2, ww, wh, 5);
            ctx.fillStyle = '#d6efff'; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#7f1a17'; ctx.stroke();
          });
        }
        for (let k = 0; k < 4; k++) {                                                    // passengers
          const px = x0 + bw * (0.09 + 0.225 * k) + ww / 2, r = Math.min(wh, ww) * 0.5;
          if (k === 1) Faces.draw(ctx, 0, px, wy, r);
          else if (k === 2) Faces.draw(ctx, 1, px, wy, r);
          else Faces.drawEmoji(ctx, k === 0 ? '😄' : '🥸', px, wy, r);
        }
        [-bx, bx].forEach(x => {                                                          // wheels
          ctx.beginPath(); ctx.arc(x, -wr, wr, 0, Math.PI * 2); ctx.fillStyle = '#263238'; ctx.fill();
          ctx.beginPath(); ctx.arc(x, -wr, wr * 0.45, 0, Math.PI * 2); ctx.fillStyle = '#b0bec5'; ctx.fill();
        });

        // centre of gravity target
        const gy = -p.hg * S;
        ctx.beginPath(); ctx.arc(0, gy, 15, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
        ctx.lineWidth = 2.5; ctx.strokeStyle = '#1b1f4b'; ctx.stroke();
        ctx.fillStyle = '#1b1f4b';
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.arc(0, gy, 15, 0, Math.PI / 2); ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.arc(0, gy, 15, Math.PI, Math.PI * 1.5); ctx.closePath(); ctx.fill();
        ctx.restore();

        if (!falling) {
          // dashed line of action of the weight (straight down in the real world)
          const Gx = Ox + p.hg * S * sin, Gy = Oy - p.hg * S * cos;
          const Hy = Oy + p.hg * Math.tan(th) * sin * S;
          const inside = !p.topples;
          ctx.strokeStyle = '#1b1f4b'; ctx.lineWidth = 3; ctx.setLineDash([9, 7]);
          ctx.beginPath(); ctx.moveTo(Gx, Gy); ctx.lineTo(Gx, Hy); ctx.stroke(); ctx.setLineDash([]);
          arrow(ctx, Gx, Hy - 52, Gx, Hy - 2, '#1b1f4b', 3);
          ctx.beginPath(); ctx.arc(Gx, Hy, 9, 0, Math.PI * 2);
          ctx.fillStyle = this.rev ? (inside ? '#2bb673' : '#e53935') : '#fff'; ctx.fill();
          ctx.lineWidth = 2.5; ctx.strokeStyle = '#1b1f4b'; ctx.stroke();
          pill(ctx, 'weight', Gx + 54, Gy + (Hy - Gy) * 0.5, { size: 15 });
        }
        if (!falling) pill(ctx, 'CoG', Ox + p.hg * S * sin - 46, Oy - p.hg * S * cos - 26, { size: 15 });

        if (this.rev) {
          if (p.topples && this.prog > 0.6) pill(ctx, '💥 TOPPLED!', Ox + 120, Oy - 200, { size: 26, fg: '#fff', bg: '#e53935', border: '#fff' });
          if (!p.topples) pill(ctx, '✅ STABLE!', Ox + 120, Oy - 230, { size: 26, fg: '#fff', bg: '#2bb673', border: '#fff' });
        }
        pill(ctx, 'yellow line = base (between the wheels)', VW / 2, 26, { size: 15, fg: '#4a5480' });
      }
    };
  }

  // =====================================================
  // PIN THE CENTRE OF GRAVITY
  // =====================================================
  function makePin(p) {
    const xs = p.pts.map(q => q[0]), ys = p.pts.map(q => q[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), miny = Math.min(...ys), maxy = Math.max(...ys);
    const bw = maxx - minx, bh = maxy - miny;
    const lay = () => {
      const sc = Math.min(520 / bw, VH * 0.66 / bh);
      return { sc, ox: (VW - bw * sc) / 2 - minx * sc, oy: (VH - bh * sc) / 2 + 14 - miny * sc };
    };
    const toScreen = (x, y, L) => [L.ox + x * L.sc, L.oy + y * L.sc];

    return {
      kind: 'pin', p, pin: null, drag: false, hint: false, rev: false, ok: false, t: 0,
      update(dt) { this.t += dt; },
      onWrong: noop,
      onHint() { this.hint = true; },
      onReveal(ok) { this.rev = true; this.ok = ok; this.drag = false; },
      getPin() { return this.pin; },
      pointer(kind, x, y) {
        if (this.rev) return;
        const L = lay();
        if (kind === 'down') this.drag = true;
        if (kind === 'up') { this.drag = false; return; }
        if (this.drag) this.pin = { x: (clamp(x, 10, VW - 10) - L.ox) / L.sc, y: (clamp(y, 10, VH - 10) - L.oy) / L.sc };
      },
      draw(ctx) {
        const L = lay();
        const bg = ctx.createLinearGradient(0, 0, 0, VH);
        bg.addColorStop(0, '#f6e7c8'); bg.addColorStop(1, '#ecd6a8');
        ctx.fillStyle = bg; ctx.fillRect(0, 0, VW, VH);                                   // corkboard-ish

        // the shape, with the player's face faintly printed on it
        ctx.save();
        ctx.beginPath();
        p.pts.forEach((q, i) => { const [sx, sy] = toScreen(q[0], q[1], L); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
        ctx.closePath();
        ctx.shadowColor = 'rgba(60,40,10,.35)'; ctx.shadowBlur = 14; ctx.shadowOffsetY = 6;
        ctx.fillStyle = '#ffd966'; ctx.fill();
        ctx.shadowColor = 'transparent';
        ctx.clip();
        const fc = Faces.canvas(p.pi);
        if (fc) {
          const s = Math.max(bw, bh) * L.sc * 1.05, [cx, cy] = toScreen((minx + maxx) / 2, (miny + maxy) / 2, L);
          ctx.globalAlpha = 0.32; ctx.drawImage(fc, cx - s / 2, cy - s / 2, s, s); ctx.globalAlpha = 1;
        }
        ctx.restore();
        ctx.beginPath();
        p.pts.forEach((q, i) => { const [sx, sy] = toScreen(q[0], q[1], L); if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy); });
        ctx.closePath(); ctx.lineWidth = 4; ctx.strokeStyle = '#8a5a00'; ctx.lineJoin = 'round'; ctx.stroke();

        if (this.hint || this.rev) {                                                      // helper lines
          ctx.strokeStyle = '#6a4cff'; ctx.lineWidth = 2.5; ctx.setLineDash([8, 7]);
          p.lines.forEach(([a, b]) => {
            const [x0, y0] = toScreen(a[0], a[1], L), [x1, y1] = toScreen(b[0], b[1], L);
            ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
          });
          ctx.setLineDash([]);
        }

        if (this.rev) {                                                                   // true centre of gravity
          const [cx, cy] = toScreen(p.centroid.x, p.centroid.y, L);
          if (this.pin && !this.ok) {
            const [px, py] = toScreen(this.pin.x, this.pin.y, L);
            ctx.strokeStyle = '#e53935'; ctx.lineWidth = 3; ctx.setLineDash([6, 6]);
            ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(cx, cy); ctx.stroke(); ctx.setLineDash([]);
          }
          const pulse = 1 + Math.sin(this.t * 6) * 0.08;
          ctx.beginPath(); ctx.arc(cx, cy, 20 * pulse, 0, Math.PI * 2); ctx.fillStyle = '#fff'; ctx.fill();
          ctx.lineWidth = 3; ctx.strokeStyle = '#1b1f4b'; ctx.stroke();
          ctx.fillStyle = '#1b1f4b';
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 20 * pulse, 0, Math.PI / 2); ctx.closePath(); ctx.fill();
          ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, 20 * pulse, Math.PI, Math.PI * 1.5); ctx.closePath(); ctx.fill();
          pill(ctx, 'CoG', cx + 44, cy - 30, { size: 17 });
        }

        if (this.pin) {                                                                   // the player's pin
          const [px, py] = toScreen(this.pin.x, this.pin.y, L);
          ctx.beginPath(); ctx.ellipse(px + 5, py + 6, 11, 5, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(0,0,0,.25)'; ctx.fill();
          ctx.beginPath(); ctx.arc(px, py - 10, 14, 0, Math.PI * 2);
          const g = ctx.createRadialGradient(px - 4, py - 15, 2, px, py - 10, 15); g.addColorStop(0, '#ff8a80'); g.addColorStop(1, '#c62828');
          ctx.fillStyle = g; ctx.fill(); ctx.lineWidth = 2; ctx.strokeStyle = '#7f1a17'; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(px, py - 1); ctx.lineTo(px, py + 5); ctx.strokeStyle = '#555'; ctx.lineWidth = 3; ctx.stroke();
        } else {
          pill(ctx, 'Tap or drag on the shape to place the pin 📍', VW / 2, 30, { size: 17 });
        }
        if (this.rev) pill(ctx, this.ok ? '🎯 BULLSEYE!' : 'Here is the real centre of gravity', VW / 2, 30, { size: 20, fg: '#fff', bg: this.ok ? '#2bb673' : '#6a4cff', border: '#fff' });
      }
    };
  }

  // ---------- public ----------
  return {
    setSize(unit, height) { U = unit; VH = height; },
    width: VW,
    create(d) {
      switch (d.kind) {
        case 'spanner': return makeSpanner(d);
        case 'seesaw': return makeSeesaw(d);
        case 'topple': return makeTopple(d);
        case 'pin': return makePin(d);
      }
      throw new Error('Unknown scene: ' + d.kind);
    }
  };
})();
