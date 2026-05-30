// Lingala — ambient sticky-footer player. The piece is an original Web Audio
// synthesis of a Congolese rumba *sebene* (~1:39 per pass, then it loops): a
// 3-2 son clave backbone, a walking pentatonic bass, the cavacha drum groove,
// clipped mi-solo rhythm guitar, and interlocking lead/second-guitar arpeggios
// that build to a full-band peak. Click-to-play, all synthesized — no samples,
// no dependencies. Uses the site's design tokens and no icon font.
//
// Scheduling: a look-ahead scheduler hands the audio clock one bar at a time
// (~1.5s ahead) instead of building all ~2400 nodes at once. That removes the
// main-thread spike that previously starved the audio thread at the loop seam
// (heard as a crackle/dropout), and makes the loop seamless.
//
// NOTE: synthesized triangle/saw waves only approximate a real Congolese guitar
// tone. If this becomes the app's audio identity, the step up is a recorded
// sebene loop from a Congolese guitarist (see todo.md).
(function () {
  const playBtn = document.getElementById('ambientBtn');
  const vizRow = document.getElementById('ambientViz');
  const prog = document.getElementById('ambientProg');
  const glyph = document.getElementById('ambientGlyph');
  if (!playBtn || !vizRow) return;

  const BPM = 116, BEAT = 60 / BPM, BARS = 48, DUR = BARS * 4 * BEAT;
  const LOOP_SECONDS = 300;   // loop the piece for ~5 minutes, then auto-off
  const LOOKAHEAD = 1.5;      // schedule this many seconds of audio ahead
  const TICK_MS = 200;        // how often the scheduler tops up

  // Mini visualizer bars.
  [10, 16, 8, 20, 12, 24, 9, 18, 14, 22, 11, 19, 15, 23, 8, 16].forEach((h, i) => {
    const el = document.createElement('span');
    el.className = 'vbar';
    el.style.cssText = `height:${h}px; animation-delay:${(i * 0.065).toFixed(2)}s; animation-duration:${(0.4 + (i % 5) * 0.06).toFixed(2)}s;`;
    vizRow.appendChild(el);
  });

  let actx = null, masterG = null, comp = null, playing = false, ticker = null;
  let sessionStart = 0, startTime = 0, nextBarTime = 0, curBar = 0, barBase = 0;
  let snareBuf = null, hatBuf = null, congaBuf = null;
  // iOS silent-switch workaround: an <audio> element fed by a MediaStream of the
  // Web Audio output routes through the device's MEDIA channel, which ignores
  // the ring/silent switch. Without this, iOS treats raw Web Audio as "ambient"
  // and mutes it whenever the phone is on silent.
  let routerAudio = null, streamDest = null;

  // E-rooted pentatonic/diatonic note bank for the sebene's bass + guitars.
  const N = {
    E1: 41.20, A1: 55.00, B1: 61.74,
    E2: 82.41, Gs2: 103.83, A2: 110.00, B2: 123.47, Cs3: 138.59, D3: 146.83, E3: 164.81,
    Fs3: 185.00, Gs3: 207.65, A3: 220.00, B3: 246.94, Cs4: 277.18, D4: 293.66, E4: 329.63,
    Fs4: 369.99, Gs4: 415.30, A4: 440.00, B4: 493.88, Cs5: 554.37, D5: 587.33, E5: 659.25,
    Fs5: 739.99, Gs5: 830.61, A5: 880.00, B5: 987.77, Cs6: 1108.73,
  };

  function getCtx() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    return actx;  // resume() happens in start(), inside a real user gesture
  }

  // All voice/percussion times are within-bar beat offsets, resolved against
  // barBase (the absolute audio time of the current bar's downbeat).

  // A pitched, enveloped voice (bass, guitars, horns).
  function env(dest, freq, off, durBeats, vol, type, opt = {}) {
    const t = barBase + off * BEAT;
    if (t < actx.currentTime - 0.05) return;
    const o = actx.createOscillator();
    const g = actx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (opt.bend) o.frequency.exponentialRampToValueAtTime(freq * opt.bend, t + durBeats * BEAT * 0.5);
    const atk = opt.atk ?? 0.006;
    const peak = opt.peak ?? vol;
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(peak, t + atk);
    if (opt.sustain) {
      g.gain.setValueAtTime(peak, t + durBeats * BEAT * 0.6);
      g.gain.exponentialRampToValueAtTime(0.001, t + durBeats * BEAT);
    } else {
      g.gain.exponentialRampToValueAtTime(0.001, t + durBeats * BEAT * 0.92);
    }
    let node = o;
    if (opt.filter) {
      const f = actx.createBiquadFilter();
      f.type = 'lowpass'; f.frequency.value = opt.filter;
      o.connect(f); node = f;
    }
    node.connect(g); g.connect(dest);
    o.start(t); o.stop(t + durBeats * BEAT + 0.06);
  }

  // Short decaying noise buffer — raw material for drums/percussion (made once).
  function noise(decay) {
    const len = Math.floor(actx.sampleRate * 0.3);
    const b = actx.createBuffer(1, len, actx.sampleRate);
    const d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (actx.sampleRate * decay));
    return b;
  }

  // A filtered noise hit (snare / hat / conga / clave click).
  function hit(buf, off, vol, fq, Q, type = 'bandpass') {
    const t = barBase + off * BEAT;
    if (t < actx.currentTime - 0.05) return;
    const s = actx.createBufferSource();
    const f = actx.createBiquadFilter();
    const g = actx.createGain();
    f.type = type; f.frequency.value = fq; f.Q.value = Q;
    g.gain.value = vol;
    s.buffer = buf; s.connect(f); f.connect(g); g.connect(comp);
    s.start(t);
  }

  // A pitched kick with a fast downward sweep, soft 4ms onset (no click).
  function kick(off, vol) {
    const t = barBase + off * BEAT;
    if (t < actx.currentTime - 0.05) return;
    const o = actx.createOscillator(), g = actx.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.004);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.22);
    o.connect(g); g.connect(comp);
    o.start(t); o.stop(t + 0.25);
  }

  // Schedule every event of one bar (0..47), relative to barTime.
  function scheduleBar(bar, barTime) {
    barBase = barTime;
    const d = comp;
    const fadeOut = bar >= 44 ? Math.max(0, (BARS - bar) / 4) : 1;

    // —— CLAVE 3-2 son: the asymmetric backbone ——
    [0, 0.75, 1.5, 2.5, 3.5].forEach((off, i) => hit(hatBuf, off, 0.16 * fadeOut, i < 3 ? 2400 : 2100, 3, 'bandpass'));

    // —— BASS: walking pentatonic ——
    [[N.E2, 0, 1.5], [N.B1, 1.5, 0.5], [N.E2, 2, 1], [N.Gs2, 3, 0.5], [N.Fs3, 3.5, 0.5]]
      .forEach(([f, off, len]) => env(d, f, off, len, 0.34 * fadeOut, 'sine', { filter: 300 }));

    // —— CAVACHA drum groove (from bar 8) ——
    if (bar >= 8) {
      const fi = bar < 10 ? (bar - 8) / 2 : 1;
      for (let s = 0; s < 4; s++) kick(s, 0.4 * fi * fadeOut);
      hit(snareBuf, 1, 0.3 * fi * fadeOut, 1900, 1.2, 'bandpass');
      hit(snareBuf, 3, 0.3 * fi * fadeOut, 1900, 1.2, 'bandpass');
      for (let h = 0; h < 8; h++) hit(hatBuf, h * 0.5, (h % 2 === 0 ? 0.14 : 0.085) * fi * fadeOut, 7000, 0.8, 'highpass');
      hit(hatBuf, 0.75, 0.07 * fi * fadeOut, 8000, 0.8, 'highpass');
      hit(hatBuf, 2.75, 0.07 * fi * fadeOut, 8000, 0.8, 'highpass');
    }

    // —— conga accents (from bar 12) ——
    if (bar >= 12) {
      hit(congaBuf, 1.5, 0.18 * fadeOut, 380, 2, 'bandpass');
      hit(congaBuf, 2.25, 0.14 * fadeOut, 520, 2, 'bandpass');
      hit(congaBuf, 3.75, 0.16 * fadeOut, 300, 2, 'bandpass');
    }

    // —— RHYTHM GUITAR: mi-solo offbeat chords (bars 16-44) ——
    if (bar >= 16 && bar < 44) {
      const fi = bar < 18 ? (bar - 16) / 2 : 1;
      const ch = [[N.E3, N.Gs3, N.B3], [N.A2, N.Cs4, N.E4], [N.B2, N.D4, N.Fs4]][bar % 3];
      [0.5, 1.5, 2.5, 3.5].forEach((off) => ch.forEach((f) => env(d, f, off, 0.4, 0.07 * fi * fadeOut, 'triangle', { atk: 0.004, filter: 2600 })));
    }

    // —— LEAD GUITAR: interlocking sebene arpeggio (bars 24-46) ——
    if (bar >= 24 && bar < 46) {
      const fi = bar < 26 ? (bar - 24) / 2 : 1;
      const figs = [
        [N.E5, N.Gs5, N.B5, N.Gs5, N.E5, N.B4, N.E5, N.Gs5],
        [N.A4, N.Cs5, N.E5, N.Cs5, N.A4, N.E5, N.A5, N.E5],
        [N.Fs5, N.A5, N.B5, N.A5, N.Fs5, N.Cs5, N.Fs5, N.A5],
        [N.B4, N.D5, N.Fs5, N.B5, N.Fs5, N.D5, N.B4, N.Fs5],
      ];
      const fig = figs[Math.floor(bar / 2) % figs.length];
      for (let s = 0; s < 8; s++) env(d, fig[s], s * 0.5 + (s % 2 === 1 ? 0.04 : 0), 0.55, 0.115 * fi * fadeOut, 'triangle', { atk: 0.003, bend: 0.997, filter: 4500 });
    }

    // —— second guitar: answering line, octave interplay (bars 30-44) ——
    if (bar >= 30 && bar < 44) {
      const a = [[N.B4, N.E5, N.B4, N.Gs4], [N.Cs5, N.A4, N.E5, N.Cs5], [N.D5, N.A4, N.Fs4, N.A4]][bar % 3];
      [1, 2, 3, 3.5].forEach((off, i) => env(d, a[i], off, 0.5, 0.075 * fadeOut, 'triangle', { atk: 0.003, filter: 3800 }));
    }

    // —— horn-style stabs at peak (bars 36-44) ——
    if (bar >= 36 && bar < 44 && bar % 2 === 0) {
      [N.E4, N.Gs4, N.B4].forEach((f) => env(d, f, 2, 0.8, 0.06 * fadeOut, 'sawtooth', { atk: 0.01, filter: 2200, sustain: true }));
    }
  }

  // The intro pickup arpeggio, scheduled once just before the first downbeat.
  function scheduleIntro(t) {
    barBase = t;
    [N.E4, N.Gs4, N.B4, N.E5].forEach((f, i) => env(comp, f, -1 + i * 0.25, 0.4, 0.09, 'triangle', { atk: 0.004, filter: 3500 }));
  }

  // Top up the schedule: hand over any bar whose downbeat is within LOOKAHEAD.
  function pump() {
    while (nextBarTime < actx.currentTime + LOOKAHEAD) {
      scheduleBar(curBar, nextBarTime);
      nextBarTime += 4 * BEAT;
      curBar = (curBar + 1) % BARS;   // wrap → seamless loop
    }
  }

  function setUI(on) {
    glyph.textContent = on ? '❚❚' : '►';
    playBtn.setAttribute('aria-label', on ? 'Pause music' : 'Play music');
    document.querySelectorAll('.vbar').forEach((b) => { b.style.animationPlayState = on ? 'running' : 'paused'; });
    // Lets the hero background equalizer fade in/out with playback.
    document.documentElement.classList.toggle('sound-playing', on);
  }

  // Resume the context (must run inside a user gesture) and play. Returns true
  // only once audio is genuinely running, so the UI never shows "playing" while
  // the context is still suspended (= the "unpaused but silent" bug).
  async function start() {
    if (playing) return true;
    const ctx = getCtx();
    try { await ctx.resume(); } catch (e) { /* ignore */ }
    if (ctx.state !== 'running' || playing) return false;   // gesture didn't grant audio
    localStorage.setItem('lingala.audio', 'on');            // remember across pages (new key — old 'off' ignored)

    masterG = ctx.createGain();
    masterG.gain.value = 0.55;
    // A compressor glues the mix and keeps dense peaks off the clipping ceiling.
    comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18; comp.knee.value = 6; comp.ratio.value = 4; comp.attack.value = 0.004; comp.release.value = 0.2;
    comp.connect(masterG);
    // Route the output through EXACTLY ONE destination. Doubling up
    // (ctx.destination + MediaStream) produced a comb-filter "in a room"
    // artifact because the two paths have slightly different latencies.
    let routedViaStream = false;
    if (typeof ctx.createMediaStreamDestination === 'function') {
      try {
        streamDest = ctx.createMediaStreamDestination();
        masterG.connect(streamDest);
        routerAudio = new Audio();
        routerAudio.playsInline = true;
        routerAudio.setAttribute('playsinline', '');
        routerAudio.srcObject = streamDest.stream;
        await routerAudio.play();
        routedViaStream = true;
      } catch (e) {
        // Stream path failed — tear it down and fall through to ctx.destination.
        try { masterG.disconnect(streamDest); } catch (e2) {}
        streamDest = null; routerAudio = null;
      }
    }
    if (!routedViaStream) masterG.connect(ctx.destination);

    snareBuf = noise(0.02); hatBuf = noise(0.005); congaBuf = noise(0.04);

    startTime = ctx.currentTime + 0.6;   // lead-in so the pickup notes land
    nextBarTime = startTime; curBar = 0;
    scheduleIntro(startTime);
    pump();                              // schedule the first bar(s) immediately

    sessionStart = ctx.currentTime;
    playing = true;
    setUI(true);
    ticker = setInterval(() => {
      if (actx.currentTime - sessionStart >= LOOP_SECONDS) { stop(true); return; }  // 5 min → stop
      pump();
      if (prog) {
        const pos = actx.currentTime - startTime;
        if (pos >= 0) prog.style.width = ((pos % DUR) / DUR * 100).toFixed(1) + '%';
      }
    }, TICK_MS);
    return true;
  }

  // auto = true when the 5-minute session ends on its own (then it stays off).
  function stop(auto = false) {
    clearInterval(ticker);
    playing = false;
    if (masterG) {
      try {
        const now = actx.currentTime;
        masterG.gain.cancelScheduledValues(now);
        masterG.gain.setValueAtTime(masterG.gain.value, now);
        masterG.gain.linearRampToValueAtTime(0, now + (auto ? 0.6 : 0.4));
      } catch (e) { /* ignore */ }
    }
    setUI(false);
    if (routerAudio) { try { routerAudio.pause(); } catch (e) { /* ignore */ } }
    // An auto-stop (5-min timeout) must NOT persist 'off', or the next page load
    // would never re-arm autoplay. Only an explicit pause (below) stays off.
    if (prog) setTimeout(() => { prog.style.width = '0%'; }, auto ? 1200 : 400);
  }

  playBtn.addEventListener('click', () => {
    if (playing) { stop(); localStorage.setItem('lingala.audio', 'off'); }  // explicit pause: stays off across pages
    else start();
  });

  // Autoplay is intentionally OFF: the music starts only when the visitor
  // presses the footer ▶ button (the click handler above). No auto-start on
  // first interaction, no carry-over between pages.
})();
