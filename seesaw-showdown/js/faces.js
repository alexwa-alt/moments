/* faces.js
   Takes the two photos (camera or file) and draws faces inside the game.
   Photos are kept in memory only. They are never uploaded or saved. */

const Faces = (() => {
  const SIZE = 256;                                   // each face is stored as 256 x 256 pixels
  const players = [
    { name: '', canvas: null, url: '' },
    { name: '', canvas: null, url: '' }
  ];
  const streams = [null, null];                       // live camera streams
  const ui = [null, null];                            // per-card screen controllers
  let onChange = () => {};

  // ---------- making face images ----------
  // Crops the middle square out of a video/photo. Mirrored so it matches the "selfie" preview.
  function cropToCanvas(source, sw, sh, mirror) {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const g = c.getContext('2d');
    const side = Math.min(sw, sh);
    const sx = (sw - side) / 2, sy = (sh - side) / 2;
    if (mirror) { g.translate(SIZE, 0); g.scale(-1, 1); }
    g.drawImage(source, sx, sy, side, side, 0, 0, SIZE, SIZE);
    return c;
  }

  function emojiFace(emoji, bg) {
    const c = document.createElement('canvas');
    c.width = c.height = SIZE;
    const g = c.getContext('2d');
    g.fillStyle = bg; g.fillRect(0, 0, SIZE, SIZE);
    g.font = `${SIZE * 0.68}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(emoji, SIZE / 2, SIZE / 2 + SIZE * 0.05);
    return c;
  }

  function setFace(i, canvas) {
    players[i].canvas = canvas;
    players[i].url = canvas.toDataURL('image/jpeg', 0.85);
    if (ui[i]) ui[i].refresh();
    onChange();
  }

  function stopStream(i) {
    if (streams[i]) { streams[i].getTracks().forEach(t => t.stop()); streams[i] = null; }
  }
  function stopAll() { stopStream(0); stopStream(1); }

  // ---------- the setup screen (two player cards) ----------
  function initSetup(cb) {
    onChange = cb;
    document.querySelectorAll('.player-card').forEach(card => {
      const i = Number(card.dataset.player);
      const video = card.querySelector('video');
      const snap = card.querySelector('canvas.snap');
      const box = card.querySelector('.cam-box');
      const cd = card.querySelector('.countdown');
      const main = card.querySelector('.btn-main');
      const file = card.querySelector('input[type=file]');
      const msg = card.querySelector('.cam-msg');
      const nameInput = card.querySelector('.name-input');
      let state = 'idle';                              // idle | live | count | done

      function setState(s) {
        state = s;
        card.dataset.state = s;
        main.disabled = (s === 'count');
        main.textContent = s === 'idle' ? '📷 Start camera'
          : s === 'live' ? '📸 Take photo'
          : s === 'count' ? 'Smile…'
          : '🔄 Retake';
      }

      function refresh() {                             // draw the stored face into the preview
        if (!players[i].canvas) return;
        const g = snap.getContext('2d');
        g.clearRect(0, 0, SIZE, SIZE);
        g.drawImage(players[i].canvas, 0, 0);
        setState('done');
      }
      ui[i] = { refresh };

      async function startCamera() {
        msg.textContent = '';
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          msg.textContent = 'The camera is not available here. Use “Take / choose photo” instead.';
          return;
        }
        stopAll();
        try {
          streams[i] = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: { ideal: 720 }, height: { ideal: 720 } },
            audio: false
          });
          video.srcObject = streams[i];
          await video.play();
          setState('live');
        } catch (err) {
          msg.textContent = `Could not open the camera (${err.name || 'error'}). Allow camera access in the browser, or use “Take / choose photo”.`;
          setState(players[i].canvas ? 'done' : 'idle');
        }
      }

      function countdownThenSnap() {
        if (!video.videoWidth) { msg.textContent = 'Camera is still starting. Try again in a second.'; return; }
        setState('count');
        let n = 3;
        cd.textContent = n;
        const timer = setInterval(() => {
          n--;
          if (n > 0) { cd.textContent = n; return; }
          clearInterval(timer);
          cd.textContent = '';
          const c = cropToCanvas(video, video.videoWidth, video.videoHeight, true);
          stopStream(i);
          box.classList.add('flash');
          setTimeout(() => box.classList.remove('flash'), 400);
          setFace(i, c);
        }, 750);
      }

      main.addEventListener('click', () => {
        if (state === 'live') countdownThenSnap();
        else startCamera();                            // idle or done (retake)
      });

      file.addEventListener('change', () => {
        const f = file.files && file.files[0];
        if (!f) return;
        stopStream(i);
        const url = URL.createObjectURL(f);
        const img = new Image();
        img.onload = () => {
          setFace(i, cropToCanvas(img, img.naturalWidth, img.naturalHeight, false));
          URL.revokeObjectURL(url);
        };
        img.onerror = () => { msg.textContent = 'That file could not be read as a picture.'; URL.revokeObjectURL(url); };
        img.src = url;
        file.value = '';
      });

      nameInput.addEventListener('input', () => { players[i].name = nameInput.value; });
      setState('idle');
    });
  }

  // ---------- party hat + face drawing (used by the game and the balloons) ----------
  function hat(ctx, r) {
    ctx.save();
    ctx.rotate(0.22);
    ctx.translate(0, -r * 0.85);
    ctx.beginPath(); ctx.moveTo(-r * 0.5, 0); ctx.lineTo(r * 0.5, 0); ctx.lineTo(0, -r * 1.05); ctx.closePath();
    ctx.fillStyle = '#ff4f8b'; ctx.fill();
    ctx.strokeStyle = '#ffd23f'; ctx.lineWidth = Math.max(2, r * 0.1);
    ctx.beginPath(); ctx.moveTo(-r * 0.3, -r * 0.3); ctx.lineTo(r * 0.3, -r * 0.3); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-r * 0.16, -r * 0.62); ctx.lineTo(r * 0.16, -r * 0.62); ctx.stroke();
    ctx.beginPath(); ctx.arc(0, -r * 1.07, r * 0.13, 0, Math.PI * 2); ctx.fillStyle = '#ffd23f'; ctx.fill();
    ctx.restore();
  }

  function draw(ctx, i, x, y, r, o) {
    o = o || {};
    const c = players[i].canvas;
    if (!c) return;
    ctx.save();
    ctx.translate(x, y);
    if (o.rot) ctx.rotate(o.rot);
    ctx.save();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.clip();
    ctx.drawImage(c, -r, -r, 2 * r, 2 * r);
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.lineWidth = Math.max(2, r * 0.09); ctx.strokeStyle = o.ring || '#fff'; ctx.stroke();
    ctx.beginPath(); ctx.arc(0, 0, r + Math.max(1, r * 0.05), 0, Math.PI * 2);
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(20,20,60,.3)'; ctx.stroke();
    if (o.hat) hat(ctx, r);
    ctx.restore();
  }

  function drawEmoji(ctx, emoji, x, y, r) {
    ctx.save();
    ctx.font = `${r * 1.7}px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(emoji, x, y + r * 0.08);
    ctx.restore();
  }

  // ---------- public ----------
  return {
    initSetup,
    draw, drawEmoji,
    name: i => players[i].name.trim() || `Player ${i + 1}`,
    canvas: i => players[i].canvas,
    url: i => players[i].url,
    ready: () => !!(players[0].canvas && players[1].canvas),
    useCartoons() {                                    // fallback if nobody wants to use the camera
      if (!players[0].canvas) setFace(0, emojiFace('😎', '#ffd23f'));
      if (!players[1].canvas) setFace(1, emojiFace('🤪', '#8fd3ff'));
    },
    stopAll
  };
})();
