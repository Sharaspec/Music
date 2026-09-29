/* Wavecraft Studio — a single-page client for SunoAPI (https://docs.sunoapi.org). */
'use strict';
(() => {
  // ---------------------------------------------------------------- utils
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const shuffle = (arr) => arr.map((v) => [Math.random(), v]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
  const fmtTime = (s) => {
    s = Math.max(0, Math.floor(Number(s) || 0));
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  };
  const ago = (ts) => {
    const d = (Date.now() - ts) / 1000;
    if (d < 60) return 'just now';
    if (d < 3600) return `${Math.floor(d / 60)}m ago`;
    if (d < 86400) return `${Math.floor(d / 3600)}h ago`;
    return `${Math.floor(d / 86400)}d ago`;
  };
  const uid = () => Math.random().toString(36).slice(2, 10);

  const store = {
    get(k, d) { try { const v = localStorage.getItem('wc.' + k); return v == null ? d : JSON.parse(v); } catch { return d; } },
    set(k, v) {
      try { localStorage.setItem('wc.' + k, JSON.stringify(v)); return true; }
      catch { toast('Browser storage is full — some library data may not be saved.', 'warn'); return false; }
    },
    del(k) { try { localStorage.removeItem('wc.' + k); } catch {} },
  };
  const keyStore = {
    get() {
      try { return sessionStorage.getItem('wc.key') || JSON.parse(localStorage.getItem('wc.key') || 'null'); } catch { return null; }
    },
    set(key, remember) {
      try {
        sessionStorage.setItem('wc.key', key);
        if (remember) localStorage.setItem('wc.key', JSON.stringify(key)); else localStorage.removeItem('wc.key');
      } catch {}
    },
    clear() { try { sessionStorage.removeItem('wc.key'); localStorage.removeItem('wc.key'); } catch {} },
  };

  // ---------------------------------------------------------------- constants
  const MODELS = [
    { id: 'V6', name: 'V6', tag: 'Recommended', emoji: '🌟', desc: 'Most natural vocals and the richest detail.' },
    { id: 'V6_WILD', name: 'V6 Wild', tag: 'Experimental', emoji: '🌀', desc: 'Bolder, weirder, more distinctive.' },
    { id: 'V6_MINI', name: 'V6 Mini', tag: 'Fast', emoji: '⚡', desc: 'Light and quick — great for sketches.' },
  ];
  const LEGACY = [
    { id: 'V5_5', label: 'V5.5' }, { id: 'V5', label: 'V5' }, { id: 'V4_5PLUS', label: 'V4.5+' },
    { id: 'V4_5ALL', label: 'V4.5 All' }, { id: 'V4_5', label: 'V4.5' }, { id: 'V4', label: 'V4' },
  ];
  const DURATION_MODELS = ['V6', 'V6_WILD', 'V6_MINI', 'V5_5'];
  const SECTIONS = ['Intro', 'Verse', 'Pre-Chorus', 'Chorus', 'Bridge', 'Hook', 'Drop', 'Breakdown', 'Outro'];
  const STYLE_POOL = [
    'synth-pop', 'lo-fi hip hop', 'indie folk', 'dream pop', 'trap', 'drum & bass', 'city pop', 'afrobeats', 'reggaeton',
    'k-pop', 'bossa nova', 'jazz fusion', 'neo-soul', 'shoegaze', 'emo punk', 'country', 'gospel', 'orchestral', 'cinematic',
    'synthwave', 'house', 'techno', 'drill', 'grunge', 'bluegrass', 'phonk', 'hyperpop', 'ambient', 'chiptune', 'flamenco',
    'euphoric', 'melancholic', 'dreamy', 'aggressive', 'nostalgic', 'uplifting', 'dark', 'playful', 'romantic', 'epic',
    'female vocals', 'male vocals', 'choir', 'whispered vocals', 'rap verses', 'falsetto', 'duet',
    'acoustic guitar', 'piano', '808s', 'analog synths', 'strings', 'brass section', 'slap bass', 'vinyl crackle',
    '90 bpm', '120 bpm', '140 bpm', 'half-time', 'four-on-the-floor',
  ];
  const SIMPLE_IDEAS = [
    'An upbeat summer anthem about road-tripping with best friends, windows down, sing-along chorus',
    'A melancholic lo-fi piano ballad about missing someone on a rainy Sunday',
    'A dramatic orchestral pop song about a dragon who just wants to be a baker',
    'A funky 70s disco track about a cat who rules the dance floor',
    'Epic cinematic trailer music for a space battle, huge drums and choir',
    'A cozy acoustic folk song about making pancakes on a snowy morning',
    'A high-energy K-pop track about chasing dreams under neon city lights',
    'A heartfelt country song about an old pickup truck and a dog named Blue',
    'A chill bossa nova tune about sipping coffee at a Parisian café',
    'An 80s synthwave track about driving through a retro-futuristic city at midnight',
    'A playful ukulele song about a very dramatic houseplant',
    'A soulful gospel-inspired anthem about new beginnings',
  ];
  const LYRIC_IDEAS = [
    'A breakup song where the singer realizes they are better off, empowering and sassy',
    'A lullaby from a lighthouse to the ships at sea',
    'A hype rap about finally finishing a giant project at work',
    'A love song written from the perspective of a robot learning to feel',
    'A nostalgic song about summer nights as a teenager',
    'A funny song about a pigeon who thinks he is an eagle',
  ];
  const SOUND_IDEAS = [
    'Soft rain on a tin roof with distant thunder',
    'Lo-fi drum loop with vinyl crackle, laid back swing',
    'Futuristic UI notification chime, bright and friendly',
    'Crowd cheering in a stadium after a goal',
    'Deep cinematic riser building tension',
    'Forest ambience at dawn with birdsong and a gentle stream',
    'Funky slap bass groove loop',
    'Retro 8-bit coin pickup sound',
  ];
  const FUN = [
    'Warming up the vocal cords…', 'Tuning the virtual guitars…', 'Convincing the drummer to show up on time…',
    'Layering sweet harmonies…', 'Adding a pinch of reverb…', 'Negotiating with the bass player…',
    'Polishing the chorus hook…', 'Mastering for maximum goosebumps…', 'Feeding the metronome…',
    'Teaching the synths to feel…', 'Untangling the patch cables…', 'Asking the choir to hum along…',
  ];
  const KEYS = ['Any', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B', 'Cm', 'C#m', 'Dm', 'D#m', 'Em', 'Fm', 'F#m', 'Gm', 'G#m', 'Am', 'A#m', 'Bm'];
  const STEMS = ['Lead Vocal', 'Backing Vocals', 'Drum Kit', 'Kick', 'Snare', 'Hi-Hat', 'Bass', 'Electric Bass', 'Synth Bass', '808', 'Piano', 'Electric Piano', 'Rhodes', 'Keyboards', 'Organ', 'Synth', 'Synth Lead', 'Synth Pad', 'Synth Keys', 'Guitar', 'Acoustic Guitar', 'Electric Guitar', 'Lead Electric Guitar', 'Rhythm Electric Guitar', 'Distorted Electric Guitar', 'String Section', 'Violin', 'Cello', 'Brass Section', 'Trumpet', 'Saxophone', 'Woodwinds', 'Flute', 'Choir', 'Percussion', 'Sound Effects', 'Risers', 'Orchestra', 'Harp', 'Bells', 'Ukulele', 'Banjo', 'Mandolin', 'Accordion', 'Harmonica', 'Marimba', 'Vibraphone', 'Sitar', 'Tabla', 'Taiko'];
  const VARIETY = ['Off — exact style', 'Normal — balanced', 'High — distinct styles', 'Extra — bold exploration', 'Max — unreasonably varied'];
  const ERRORS = {
    400: 'Some parameters were invalid.', 401: 'Your API key was rejected. Check it in Settings.', 402: 'Payment required.',
    404: 'Endpoint not found.', 405: 'Rate limit exceeded — slow down a little.', 409: 'This already exists.',
    413: 'Prompt or theme is too long.', 422: 'The request could not be processed.', 429: 'Not enough credits. Top up at sunoapi.org.',
    430: 'You are calling too frequently — try again in a moment.', 451: 'Content could not be processed.',
    455: 'SunoAPI is under maintenance. Try again later.', 500: 'SunoAPI server error. Try again.',
  };

  // ---------------------------------------------------------------- state
  const S = {
    key: null,
    theme: store.get('theme', 'system'),
    settings: Object.assign({ connection: 'auto', callbackUrl: '' }, store.get('settings', {})),
    prefs: Object.assign({ model: 'V6', createMode: 'simple' }, store.get('prefs', {})),
    tracks: store.get('tracks', []),
    tasks: store.get('tasks', []),
    lyrics: store.get('lyrics', []),
    personas: store.get('personas', []),
    credits: null,
    view: 'create',
    lib: { q: '', filter: 'all', sort: 'new' },
    playing: null,
  };
  const save = {
    tracks: () => store.set('tracks', S.tracks),
    tasks: () => store.set('tasks', S.tasks.slice(0, 150)),
    lyrics: () => store.set('lyrics', S.lyrics.slice(0, 60)),
    personas: () => store.set('personas', S.personas),
    prefs: () => store.set('prefs', S.prefs),
    settings: () => store.set('settings', S.settings),
  };

  // ---------------------------------------------------------------- API
  const DIRECT = { suno: 'https://api.sunoapi.org', upload: 'https://sunoapiorg.redpandaai.co' };
  const PROXY = { suno: '/proxy/suno', upload: '/proxy/upload' };
  const useProxy = () => S.settings.connection === 'proxy' || (S.settings.connection === 'auto' && /^https?:$/.test(location.protocol));
  const base = (svc) => (useProxy() ? PROXY : DIRECT)[svc];
  const callbackUrl = () => S.settings.callbackUrl || (/^https?:$/.test(location.protocol) && !/^(localhost|127\.)/.test(location.hostname)
    ? `${location.origin}/api/callback` : 'https://example.com/suno-callback');

  class ApiError extends Error {
    constructor(code, msg, data) { super(msg); this.code = code; this.data = data; }
  }

  async function api(path, { method = 'GET', body, query, service = 'suno', key = S.key } = {}) {
    let url = base(service) + path;
    if (query) url += '?' + new URLSearchParams(query).toString();
    let res;
    try {
      res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${key}`, ...(body ? { 'Content-Type': 'application/json' } : {}) },
        body: body ? JSON.stringify(body) : undefined,
      });
    } catch (e) {
      throw new ApiError(0, useProxy()
        ? 'Network error — could not reach SunoAPI.'
        : 'Network error — the browser could not reach SunoAPI directly (try the Netlify proxy in Settings).');
    }
    let json = null;
    try { json = await res.json(); } catch {}
    if (!json) throw new ApiError(res.status, ERRORS[res.status] || `Request failed (HTTP ${res.status}).`);
    const code = Number(json.code ?? res.status);
    if (code !== 200 || !res.ok) {
      throw new ApiError(code, json.msg && json.msg !== 'success' ? `${json.msg}` : (ERRORS[code] || `Request failed (${code}).`), json.data);
    }
    return json.data;
  }

  function uploadFile(file, onProgress) {
    return new Promise((resolve, reject) => {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('uploadPath', 'wavecraft');
      fd.append('fileName', `${Date.now()}-${file.name.replace(/[^\w.-]+/g, '_')}`);
      const xhr = new XMLHttpRequest();
      xhr.open('POST', base('upload') + '/api/file-stream-upload');
      xhr.setRequestHeader('Authorization', `Bearer ${S.key}`);
      xhr.upload.onprogress = (e) => e.lengthComputable && onProgress?.(e.loaded / e.total);
      xhr.onerror = () => reject(new Error('Upload failed — network error.'));
      xhr.onload = () => {
        let j = null;
        try { j = JSON.parse(xhr.responseText); } catch {}
        const u = j?.data?.fileUrl || j?.data?.downloadUrl;
        if (xhr.status < 300 && u && (j.code == null || j.code === 200)) resolve(u);
        else reject(new Error(j?.msg || `Upload failed (HTTP ${xhr.status}).`));
      };
      xhr.send(fd);
    });
  }

  async function refreshCredits() {
    try {
      const c = await api('/api/v1/generate/credit');
      S.credits = typeof c === 'object' && c ? (c.credits ?? c.remaining ?? JSON.stringify(c)) : c;
    } catch (e) {
      if (e.code === 401) authFailed();
    }
    $('#credits-val').textContent = S.credits == null ? '—' : Number(S.credits).toLocaleString();
  }

  function authFailed() {
    toast('Your API key was rejected. Please enter a valid key.', 'err');
    signOut();
  }

  // ---------------------------------------------------------------- tasks & polling
  const KINDS = {
    music: { icon: '🎵', label: 'Song', fetch: (id) => api('/api/v1/generate/record-info', { query: { taskId: id } }), parse: parseMusic },
    lyrics: { icon: '✍️', label: 'Lyrics', fetch: (id) => api('/api/v1/lyrics/record-info', { query: { taskId: id } }), parse: parseLyrics },
    wav: { icon: '💿', label: 'WAV export', fetch: (id) => api('/api/v1/wav/record-info', { query: { taskId: id } }), parse: parseFlag },
    stems: { icon: '🎛️', label: 'Stem separation', fetch: (id) => api('/api/v1/vocal-removal/record-info', { query: { taskId: id } }), parse: parseFlag },
    midi: { icon: '🎹', label: 'MIDI', fetch: (id) => api('/api/v1/midi/record-info', { query: { taskId: id } }), parse: parseMidi },
    video: { icon: '🎬', label: 'Music video', fetch: (id) => api('/api/v1/mp4/record-info', { query: { taskId: id } }), parse: parseFlag },
    cover: { icon: '🖼️', label: 'Cover art', fetch: (id) => api('/api/v1/suno/cover/record-info', { query: { taskId: id } }), parse: parseFlag },
    recovery: { icon: '🛟', label: 'Audio recovery', fetch: (id) => api('/api/v1/suno/recovery/record-info', { query: { task_id: id } }), parse: parseRecovery },
  };
  const MUSIC_FAIL = ['CREATE_TASK_FAILED', 'GENERATE_AUDIO_FAILED', 'SENSITIVE_WORD_ERROR', 'FAILED', 'ERROR'];
  const MUSIC_STAGE = {
    PENDING: ['Queued', 12], GENERATING: ['Composing', 30], TEXT_SUCCESS: ['Lyrics & structure ready', 45],
    FIRST_SUCCESS: ['First take ready — stream it now!', 78], SUCCESS: ['Done', 100],
  };

  function parseMusic(d) {
    const status = d?.status || 'PENDING';
    const raw = d?.response?.sunoData || d?.response?.data || [];
    const tracks = Array.isArray(raw) ? raw : [];
    const [stage, pct] = MUSIC_STAGE[status] || [status.replace(/_/g, ' ').toLowerCase(), 20];
    if (status === 'SUCCESS' || (status === 'CALLBACK_EXCEPTION' && tracks.some((t) => t.audio_url))) return { state: 'success', stage: 'Done', pct: 100, tracks };
    if (MUSIC_FAIL.includes(status) || status === 'CALLBACK_EXCEPTION') {
      return { state: 'failed', error: d?.errorMessage || (status === 'SENSITIVE_WORD_ERROR' ? 'Your prompt contained restricted words.' : status.replace(/_/g, ' ').toLowerCase()) };
    }
    return { state: tracks.length ? 'partial' : 'pending', stage, pct, tracks };
  }
  function parseLyrics(d) {
    const status = d?.status || 'PENDING';
    const items = (d?.response?.data || []).filter((x) => x && x.text);
    if (status === 'SUCCESS') return { state: 'success', result: items };
    if (MUSIC_FAIL.includes(status) || status === 'CALLBACK_EXCEPTION') {
      if (items.length) return { state: 'success', result: items };
      return { state: 'failed', error: d?.errorMessage || status };
    }
    return { state: 'pending', stage: 'Writing…', pct: 40 };
  }
  function flagState(d) {
    const f = d?.successFlag;
    if (f === 'SUCCESS' || f === 1 || f === '1') return 'success';
    if (f == null || f === 'PENDING' || f === 0 || f === '0' || f === 'GENERATING') return 'pending';
    if (f === 'CALLBACK_EXCEPTION') return d?.response ? 'success' : 'failed';
    return 'failed';
  }
  function parseFlag(d) {
    const st = flagState(d);
    if (st === 'success') return { state: 'success', result: d.response || {} };
    if (st === 'failed') return { state: 'failed', error: d?.errorMessage || String(d?.successFlag || 'failed') };
    return { state: 'pending', stage: 'Processing…', pct: 40 };
  }
  function parseMidi(d) {
    const st = flagState(d);
    if (st === 'success' || d?.midiData?.state === 'complete') return { state: 'success', result: d.midiData || {} };
    if (st === 'failed') return { state: 'failed', error: d?.errorMessage || 'MIDI generation failed' };
    return { state: 'pending', stage: 'Transcribing notes…', pct: 40 };
  }
  function parseRecovery(d) {
    const items = Array.isArray(d) ? d : (d?.data || []);
    if (!items.length) return { state: 'pending', stage: 'Recovering…', pct: 30 };
    if (items.every((x) => /success/i.test(x.status || ''))) return { state: 'success', result: items };
    if (items.some((x) => /fail|error/i.test(x.status || ''))) return { state: 'failed', error: items.find((x) => x.error)?.error || 'Recovery failed' };
    return { state: 'pending', stage: 'Recovering…', pct: 50 };
  }

  const waiters = {};
  function waitFor(taskId) { return new Promise((res, rej) => (waiters[taskId] ||= []).push({ res, rej })); }

  function addTask(id, kind, label, meta = {}) {
    if (!id) throw new Error('SunoAPI did not return a task ID.');
    S.tasks = S.tasks.filter((t) => t.id !== id);
    const t = { id, kind, label, meta, state: 'pending', stage: 'Queued', pct: 6, createdAt: Date.now(), errors: 0, fun: pick(FUN) };
    S.tasks.unshift(t);
    save.tasks();
    renderActivity();
    refreshFeeds();
    schedulePoll(2500);
    return t;
  }

  let pollTimer = null;
  let polling = false;
  function schedulePoll(ms = 6000) {
    clearTimeout(pollTimer);
    pollTimer = setTimeout(pollAll, ms);
  }
  const isActive = (t) => t.state === 'pending' || t.state === 'partial';

  async function pollAll() {
    if (polling || !S.key) return;
    polling = true;
    const active = S.tasks.filter(isActive);
    for (const t of active) {
      try {
        await pollTask(t);
      } catch (e) {
        if (e.code === 401) { polling = false; return authFailed(); }
        t.errors = (t.errors || 0) + 1;
        if (t.errors >= 8) finishTask(t, 'failed', null, e.message);
      }
      if (isActive(t) && Date.now() - t.createdAt > 30 * 60 * 1000) finishTask(t, 'failed', null, 'Timed out after 30 minutes. Try importing the task ID later.');
    }
    save.tasks();
    renderActivity();
    refreshFeeds();
    polling = false;
    if (S.tasks.some(isActive)) schedulePoll(active.length > 4 ? 9000 : 6000);
  }

  async function pollTask(t) {
    const k = KINDS[t.kind];
    const data = await k.fetch(t.id);
    const r = k.parse(data, t);
    t.errors = 0;
    if (r.tracks?.length) upsertTracks(r.tracks, t);
    if (r.state === 'success') return finishTask(t, 'success', r.result);
    if (r.state === 'failed') return finishTask(t, 'failed', null, r.error);
    const wasPartial = t.state === 'partial';
    t.state = r.state;
    t.stage = r.stage || t.stage;
    t.pct = r.pct || t.pct;
    t.fun = pick(FUN);
    if (r.state === 'partial' && !wasPartial && t.kind === 'music') toast(`🎧 First take of “${esc(t.label)}” is streaming — hit play!`, 'ok');
  }

  function finishTask(t, state, result, error) {
    t.state = state;
    t.pct = 100;
    t.doneAt = Date.now();
    if (state === 'failed') {
      t.error = error || 'Task failed';
      toast(`${KINDS[t.kind].icon} ${esc(KINDS[t.kind].label)} failed: ${esc(t.error)}`, 'err');
      (waiters[t.id] || []).forEach((w) => w.rej(new Error(t.error)));
    } else {
      t.stage = 'Done';
      try { onSuccess(t, result); } catch (e) { console.error(e); }
      (waiters[t.id] || []).forEach((w) => w.res(result));
    }
    delete waiters[t.id];
    refreshCredits();
  }

  function onSuccess(t, result) {
    const tr = t.meta.trackId && findTrack(t.meta.trackId);
    const assets = tr ? (tr.assets ||= {}) : null;
    switch (t.kind) {
      case 'music': {
        const n = S.tracks.filter((x) => x.taskId === t.id).length;
        toast(`🎉 “${esc(t.label)}” is ready${n > 1 ? ` — ${n} versions` : ''}!`, 'ok', () => go('library'));
        confetti();
        break;
      }
      case 'lyrics':
        t.result = result;
        S.lyrics.unshift({ id: t.id, prompt: t.meta.prompt, items: result, createdAt: Date.now() });
        save.lyrics();
        toast('✍️ Fresh lyrics are ready.', 'ok');
        if (S.view === 'lyrics') renderView();
        break;
      case 'wav':
        if (assets) assets.wav = result.audioWavUrl || result.audio_wav_url;
        toast('💿 WAV export is ready.', 'ok');
        break;
      case 'stems':
        if (assets) {
          assets.stems = (assets.stems || []).filter((s) => s.taskId !== t.id);
          assets.stems.unshift({ taskId: t.id, type: t.meta.type, stemName: t.meta.stemName, result });
        }
        toast('🎛️ Stems separated.', 'ok');
        break;
      case 'midi':
        if (assets) assets.midi = { taskId: t.id, instruments: result.instruments || [] };
        toast('🎹 MIDI transcription is ready.', 'ok');
        break;
      case 'video':
        if (assets) assets.video = result.videoUrl || result.video_url;
        toast('🎬 Your music video is ready.', 'ok');
        break;
      case 'cover':
        S.tracks.filter((x) => x.taskId === t.meta.musicTaskId).forEach((x) => { (x.assets ||= {}).covers = result.images || []; });
        toast('🖼️ Cover art generated.', 'ok');
        break;
      case 'recovery':
        (result || []).forEach((r) => {
          const x = findTrack(r.id);
          if (x && r.audio_url) { x.audioUrl = r.audio_url; x.expired = false; }
        });
        toast('🛟 Audio links recovered.', 'ok');
        break;
    }
    save.tracks();
    if (modalTrackId && t.meta.trackId === modalTrackId) openTrack(modalTrackId);
  }

  // ---------------------------------------------------------------- tracks
  const findTrack = (id) => S.tracks.find((t) => t.id === id);
  function upsertTracks(list, task) {
    let changed = false;
    list.forEach((x) => {
      if (!x?.id) return;
      const n = {
        id: x.id,
        taskId: task.id,
        title: x.title || task.meta.title || task.label || 'Untitled',
        tags: x.tags || '',
        lyrics: x.prompt || x.lyrics || '',
        audioUrl: x.audio_url || x.source_audio_url || '',
        streamUrl: x.stream_audio_url || x.source_stream_audio_url || '',
        imageUrl: x.image_url || x.source_image_url || '',
        duration: Number(x.duration) || 0,
        modelName: x.model_name || '',
        model: task.meta.model || '',
        origin: task.meta.origin || 'Generated',
        kind: task.meta.kind || 'song',
      };
      const ex = findTrack(x.id);
      if (ex) {
        for (const [k, v] of Object.entries(n)) if (v !== '' && v !== 0) ex[k] = v;
      } else {
        S.tracks.unshift({ ...n, createdAt: Date.now(), fav: false, assets: {} });
      }
      changed = true;
    });
    if (changed) { save.tracks(); updateLibCount(); }
  }
  const playable = (t) => t.audioUrl || t.streamUrl;
  function updateLibCount() {
    const n = S.tracks.length;
    $('#lib-count').textContent = n ? n : '';
  }

  // ---------------------------------------------------------------- UI: toasts, modal, confetti
  function toast(html, type = 'info', onClick) {
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<p>${html}</p><button aria-label="Dismiss">✕</button>`;
    el.querySelector('button').onclick = () => el.remove();
    if (onClick) { el.style.cursor = 'pointer'; el.querySelector('p').onclick = () => { onClick(); el.remove(); }; }
    $('#toasts').appendChild(el);
    setTimeout(() => el.remove(), type === 'err' ? 9000 : 5500);
  }

  let modalTrackId = null;
  let lastFocus = null;
  function openModal(title, html, onMount) {
    lastFocus = document.activeElement;
    $('#modal-title').textContent = title;
    $('#modal-body').innerHTML = html;
    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    onMount?.($('#modal-body'));
    const f = $('#modal-body input:not([type=hidden]):not([disabled]), #modal-body textarea, #modal-body button');
    setTimeout(() => (f || $('#modal [data-close]')).focus(), 30);
  }
  function closeModal() {
    $('#modal').hidden = true;
    $('#modal-body').innerHTML = '';
    document.body.style.overflow = '';
    modalTrackId = null;
    lastFocus?.focus?.();
  }

  function confetti() {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const c = $('#confetti');
    const ctx = c.getContext('2d');
    const W = (c.width = innerWidth), H = (c.height = innerHeight);
    const colors = ['#7c3aed', '#ec4899', '#06b6d4', '#f59e0b', '#10b981', '#f43f5e'];
    const ps = Array.from({ length: 140 }, () => ({
      x: W / 2 + (Math.random() - .5) * 200, y: H * .35, vx: (Math.random() - .5) * 14, vy: -Math.random() * 12 - 4,
      s: Math.random() * 6 + 4, r: Math.random() * 6, vr: (Math.random() - .5) * .3, c: pick(colors),
    }));
    let frame = 0;
    (function tick() {
      ctx.clearRect(0, 0, W, H);
      ps.forEach((p) => {
        p.vy += .35; p.vx *= .99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c; ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); ctx.restore();
      });
      if (++frame < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, W, H);
    })();
  }

  // ---------------------------------------------------------------- theme
  function applyTheme() {
    const dark = S.theme === 'dark' || (S.theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.documentElement.dataset.themePref = S.theme;
    $$('[data-theme-set]').forEach((b) => b.setAttribute('aria-checked', String(b.dataset.themeSet === S.theme)));
  }
  matchMedia('(prefers-color-scheme: dark)').addEventListener?.('change', () => S.theme === 'system' && applyTheme());

  // ---------------------------------------------------------------- form building blocks
  const counter = (name, max) => `<span class="counter" data-count-for="${name}" data-max="${max}">0/${max}</span>`;

  function modelPicker(selected = S.prefs.model) {
    const legacySel = LEGACY.some((m) => m.id === selected);
    return `<fieldset class="field"><legend class="label">Model</legend>
      <div class="model-grid">${MODELS.map((m) => `
        <label class="model-card"><input type="radio" name="model" value="${m.id}" ${m.id === selected ? 'checked' : ''}>
          <span class="mc-emoji" aria-hidden="true">${m.emoji}</span><span class="mc-name">${m.name}</span>
          <span class="mc-tag">${m.tag}</span><span class="mc-desc">${m.desc}</span></label>`).join('')}
      </div>
      <details class="legacy" ${legacySel ? 'open' : ''}><summary>Legacy models (discontinued)</summary>
        <p class="hint">Kept for backward compatibility. SunoAPI may reject or reroute these — V6 models are recommended.</p>
        <div class="chip-cloud">${LEGACY.map((m) => `<label class="chip-radio"><input type="radio" name="model" value="${m.id}" ${m.id === selected ? 'checked' : ''}><span>${m.label}</span></label>`).join('')}</div>
      </details></fieldset>`;
  }

  function slider({ name, label, min = 0, max = 1, step = 0.01, value = 0.5, hint = '', optional = true, unit = '' }) {
    const uidSeed = uid();
    return `<div class="field slider-field">
      <div class="label-row"><label class="label" for="f-${name}-${uidSeed}">${label}</label>
        <span class="row">${optional ? `<label class="mini-switch"><input type="checkbox" data-enable="${name}"> custom</label>` : ''}
        <output data-out="${name}" data-unit="${unit}">${optional ? 'Auto' : value + unit}</output></span></div>
      <input id="f-${name}-${uidSeed}" type="range" name="${name}" data-num min="${min}" max="${max}" step="${step}" value="${value}" ${optional ? 'disabled' : ''}>
      ${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  }

  function segmented(name, options, checked, { num = false, full = false } = {}) {
    return `<div class="seg ${full ? 'full' : ''}" role="radiogroup">${options.map(([v, l]) =>
      `<label><input type="radio" name="${name}" value="${v}" ${String(v) === String(checked) ? 'checked' : ''} ${num ? 'data-num' : ''}><span>${l}</span></label>`).join('')}</div>`;
  }

  function sw(name, label, sub = '', checked = false, attrs = '') {
    return `<label class="switch"><input type="checkbox" name="${name}" ${checked ? 'checked' : ''} ${attrs}><span class="track"></span><span>${label}${sub ? `<small>${sub}</small>` : ''}</span></label>`;
  }

  function styleField({ name = 'style', label = 'Style of music', value = '', required = false, max = 1000, boost = true } = {}) {
    return `<div class="field style-field">
      <div class="label-row"><label class="label">${label} ${required ? '<span class="req">*</span>' : '<span class="opt">optional</span>'}</label>${counter(name, max)}</div>
      <textarea name="${name}" rows="2" maxlength="${max}" placeholder="e.g. dreamy synth-pop, airy female vocals, 110 bpm, lush pads" ${required ? 'required' : ''}>${esc(value)}</textarea>
      <div class="chip-cloud" data-chips="${name}">${styleChips(name)}</div>
      ${boost ? `<div class="row" style="margin-top:8px;flex-wrap:wrap"><button type="button" class="btn btn-soft sm" data-action="boost-style" data-target="${name}">✨ Boost style with AI</button><span class="hint" style="margin:0">Expands a few words into a rich style description.</span></div>` : ''}
    </div>`;
  }
  const styleChips = (name) => shuffle(STYLE_POOL).slice(0, 12).map((s) => `<button type="button" class="chip" data-add-style="${esc(s)}" data-target="${name}">+ ${esc(s)}</button>`).join('')
    + `<button type="button" class="chip" data-reshuffle="${name}" title="More ideas">🔀</button>`;

  function lyricsEditor({ name = 'lyrics', value = '', label = 'Lyrics', max = 5000, ai = true, required = false, placeholder } = {}) {
    return `<div class="field lyrics-field">
      <div class="label-row"><label class="label">${label} ${required ? '<span class="req">*</span>' : ''}</label>${counter(name, max)}</div>
      <div class="lyr-toolbar">${SECTIONS.map((s) => `<button type="button" class="tag-btn" data-insert="[${s}]">[${s}]</button>`).join('')}
        <span class="spacer"></span>${ai ? `<button type="button" class="btn btn-soft sm" data-action="ai-lyrics" data-target="${name}">✍️ Write with AI</button>` : ''}</div>
      <textarea name="${name}" class="mono" rows="10" maxlength="${max}" placeholder="${esc(placeholder || '[Verse]\nCity lights are humming low…\n\n[Chorus]\nWe were golden, we were gold…')}">${esc(value)}</textarea>
    </div>`;
  }

  function vocalField(value = '') {
    return `<div class="field"><label class="label">Vocal gender <span class="opt">a nudge, not a guarantee</span></label>
      ${segmented('vocalGender', [['', 'Any'], ['f', 'Female'], ['m', 'Male']], value)}</div>`;
  }

  function personaField() {
    return `<div class="field"><label class="label">Persona / voice <span class="opt">optional</span></label>
      <div class="row"><input type="text" name="personaId" list="persona-list" placeholder="Persona ID or Suno Voice ID" style="flex:1.4">
      <select name="personaModel" style="flex:1"><option value="style_persona">Style persona</option><option value="voice_persona">Voice persona</option></select></div>
      <p class="hint">${S.personas.length ? `You have ${S.personas.length} saved persona${S.personas.length > 1 ? 's' : ''} — start typing to pick one.` : 'Create a persona from any track in your Library to reuse its vibe.'}</p></div>`;
  }

  function durationField() {
    return slider({ name: 'duration', label: 'Target duration', min: 10, max: 360, step: 1, value: 120, unit: 's', hint: 'V6-family models only. Leave on Auto to let the model decide.' });
  }

  function negField(required = false, value = '') {
    return `<div class="field"><label class="label">Exclude styles ${required ? '<span class="req">*</span>' : '<span class="opt">optional</span>'}</label>
      <input type="text" name="negativeTags" maxlength="1000" placeholder="e.g. heavy metal, screaming, autotune" value="${esc(value)}" ${required ? 'required' : ''}></div>`;
  }

  function advancedBlock({ audioWeight = true, variety = true, open = false } = {}) {
    return `<details class="advanced" ${open ? 'open' : ''}><summary>🎛️ Advanced controls</summary>
      <div class="adv-grid">
        ${slider({ name: 'styleWeight', label: 'Style weight', value: 0.65, hint: 'How strictly to follow your style.' })}
        ${slider({ name: 'weirdnessConstraint', label: 'Weirdness', value: 0.5, hint: 'Higher = more experimental.' })}
        ${audioWeight ? slider({ name: 'audioWeight', label: 'Audio weight', value: 0.65, hint: 'Weight of audio features (vocal tracks only).' }) : ''}
        ${variety ? `<div class="field"><label class="label">Variety</label>${segmented('variety', [0, 1, 2, 3, 4].map((v) => [v, v]), 1, { num: true })}
          <p class="variety-desc" data-variety-desc>${VARIETY[1]}</p></div>` : ''}
      </div></details>`;
  }

  function titleField(value = '', required = false, max = 80) {
    return `<div class="field"><div class="label-row"><label class="label">Title ${required ? '<span class="req">*</span>' : '<span class="opt">optional</span>'}</label>${counter('title', max)}</div>
      <input type="text" name="title" maxlength="${max}" placeholder="Name your song" value="${esc(value)}" ${required ? 'required' : ''}></div>`;
  }

  function submitRow(label, note = '') {
    return `<div class="field" style="margin:6px 0 0"><button type="submit" class="btn btn-primary btn-lg btn-block">${label}</button>
      ${note ? `<p class="hint" style="text-align:center">${note}</p>` : ''}</div>`;
  }

  // Collect named, enabled, visible form values.
  function collect(form) {
    const out = {};
    $$('[name]', form).forEach((el) => {
      if (el.disabled || el.closest('[hidden]') || el.name.startsWith('_')) return;
      let v;
      if (el.type === 'checkbox') v = el.checked;
      else if (el.type === 'radio') { if (!el.checked) return; v = el.value; }
      else v = typeof el.value === 'string' ? el.value.trim() : el.value;
      if (v === '') return;
      if (el.hasAttribute('data-num')) v = Number(v);
      out[el.name] = v;
    });
    if (!out.personaId) delete out.personaModel;
    return out;
  }
  function need(cond, msg) { if (!cond) throw new Error(msg); }

  function syncCounters(root) {
    $$('[data-count-for]', root).forEach((c) => {
      const f = c.closest('form') || root;
      const el = $(`[name="${c.dataset.countFor}"]`, f);
      if (!el) return;
      const max = Number(c.dataset.max);
      c.textContent = `${el.value.length}/${max}`;
      c.classList.toggle('over', el.value.length > max);
    });
  }

  function insertAtCursor(ta, text) {
    const s = ta.selectionStart ?? ta.value.length, e = ta.selectionEnd ?? ta.value.length;
    const before = ta.value.slice(0, s);
    const pre = before && !before.endsWith('\n') ? '\n\n' : '';
    ta.value = before + pre + text + '\n' + ta.value.slice(e);
    const pos = (before + pre + text + '\n').length;
    ta.focus();
    ta.setSelectionRange(pos, pos);
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }

  async function withBusy(btn, fn) {
    if (!btn) return fn();
    const html = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = `<span class="spin"></span> Working…`;
    try { return await fn(); } finally { btn.disabled = false; btn.innerHTML = html; }
  }

  // ---------------------------------------------------------------- source pickers (uploads)
  function sourcePicker(name, { label = 'Source audio', accept = 'audio/*' } = {}) {
    const withAudio = S.tracks.filter((t) => t.audioUrl);
    return `<div class="field source" data-source="${name}">
      <label class="label">${label} <span class="req">*</span></label>
      <input type="hidden" name="${name}" value="">
      <div data-src-empty>
        <label class="dropzone" data-drop>
          <div class="big" aria-hidden="true">🎧</div>
          <b>Drop an audio file or click to browse</b>
          <p>MP3, WAV, M4A… up to 8 minutes. Uploads are stored by SunoAPI for 3 days.</p>
          <input type="file" accept="${accept}" data-file hidden>
        </label>
        <div class="progress" data-prog hidden><i></i></div>
        <div class="src-or">or</div>
        <div class="row"><input type="url" placeholder="Paste a public audio URL" data-url><button type="button" class="btn sm" data-use-url>Use</button></div>
        ${withAudio.length ? `<div class="src-or">or pick from your library</div>
          <select data-lib><option value="">Choose a track…</option>${withAudio.map((t) => `<option value="${esc(t.audioUrl)}">${esc(t.title)}${t.tags ? ' — ' + esc(t.tags.slice(0, 40)) : ''}</option>`).join('')}</select>` : ''}
      </div>
      <div class="src-ready" data-src-ready hidden><audio controls preload="none"></audio><button type="button" class="btn btn-ghost sm" data-src-clear>Change</button></div>
    </div>`;
  }
  function setSource(box, url) {
    $('input[type=hidden]', box).value = url;
    $('[data-src-empty]', box).hidden = !!url;
    $('[data-src-ready]', box).hidden = !url;
    $('[data-src-ready] audio', box).src = url || '';
  }
  async function handleUpload(file, box, onDone) {
    const prog = box ? $('[data-prog]', box) : null;
    if (prog) { prog.hidden = false; $('i', prog).style.width = '3%'; }
    try {
      const url = await uploadFile(file, (p) => prog && ($('i', prog).style.width = `${Math.round(p * 100)}%`));
      toast(`⬆️ Uploaded ${esc(file.name)}`, 'ok');
      onDone(url);
    } catch (e) {
      toast(esc(e.message), 'err');
    } finally {
      if (prog) prog.hidden = true;
    }
  }

  // ---------------------------------------------------------------- views
  const VIEWS = { create: viewCreate, lyrics: viewLyrics, remix: viewRemix, sounds: viewSounds, library: viewLibrary };

  function go(v) { location.hash = v; }
  function route() {
    const v = location.hash.replace('#', '') || 'create';
    S.view = VIEWS[v] ? v : 'create';
    $$('#tabs a').forEach((a) => a.classList.toggle('active', a.dataset.view === S.view));
    renderView();
  }
  function renderView() {
    const el = $('#view');
    el.innerHTML = VIEWS[S.view]();
    syncCounters(el);
    mountView(el);
  }
  function mountView(el) {
    if (S.view === 'remix') updateRemixOp(el);
    refreshFeeds();
  }

  // ---- Create
  function viewCreate() {
    const simple = S.prefs.createMode !== 'custom';
    const presetLyrics = S._pendingLyrics || '';
    const presetTitle = S._pendingTitle || '';
    if (presetLyrics) S.prefs.createMode = 'custom';
    S._pendingLyrics = S._pendingTitle = '';
    const isSimple = simple && !presetLyrics;
    return `<div class="view-head"><div><h1>Make a <span class="grad-text">song</span></h1>
        <p>Describe a vibe and let the AI do everything — or switch to Custom for full control over lyrics, style and sound.</p></div></div>
      <div class="split">
        <div>
          <div class="mode-toggle" role="tablist">
            <button type="button" class="${isSimple ? 'on' : ''}" data-mode="simple" role="tab" aria-selected="${isSimple}">✨ Simple<small>Just describe it</small></button>
            <button type="button" class="${!isSimple ? 'on' : ''}" data-mode="custom" role="tab" aria-selected="${!isSimple}">🎛️ Custom<small>Lyrics, style & more</small></button>
          </div>
          ${isSimple ? createSimpleForm() : createCustomForm(presetLyrics, presetTitle)}
        </div>
        <div class="sticky"><div class="panel"><div class="section-title"><h2>Studio session</h2><a href="#library" class="btn btn-ghost sm">Library →</a></div>
          <div class="feed" data-feed="music"></div></div></div>
      </div>`;
  }

  function createSimpleForm() {
    return `<form class="panel" data-form="generate-simple" novalidate>
      <div class="field prompt-box">
        <div class="label-row"><label class="label" for="simple-prompt">Describe your song</label>${counter('prompt', 3000)}</div>
        <textarea id="simple-prompt" name="prompt" maxlength="3000" placeholder="An upbeat summer anthem about road-tripping with friends, windows down, big sing-along chorus…"></textarea>
        <div class="prompt-tools">
          <button type="button" class="btn btn-soft sm" data-action="surprise">🎲 Surprise me</button>
          <span class="hint" style="margin:0">Tip: mention genre, mood, instruments and what it’s about.</span>
        </div>
        <div class="chip-cloud" data-chips="prompt">${styleChips('prompt')}</div>
      </div>
      <div class="field">${sw('instrumental', 'Instrumental only', 'No vocals — just the music')}</div>
      <details class="advanced"><summary>📎 Reference attachments <span class="opt" style="font-weight:400;color:var(--muted)">— inspire the song with images, a video or audio</span></summary>
        <div class="refs">
          ${refRow('imageUrls', 'Images', 'image/jpeg,image/png,image/webp,image/bmp', 'Up to 5 · JPEG/PNG/WEBP/BMP · 10 MB each')}
          ${refRow('videoUrls', 'Video', 'video/mp4,video/quicktime,video/webm', '1 clip · MP4/MOV/WEBM · ≤ 241 s')}
          ${refRow('audioUrls', 'Audio', 'audio/*', '6 s – 30 min')}
        </div></details>
      ${modelPicker()}
      ${submitRow('🎵 Create song', 'Each request returns two unique takes. <kbd>Ctrl</kbd> + <kbd>Enter</kbd> to create.')}
    </form>`;
  }
  function refRow(name, label, accept, hint) {
    return `<div class="ref-row" data-refs="${name}"><b>${label}</b><div>
      <div class="row"><input type="url" placeholder="Paste a URL" data-ref-url><button type="button" class="btn sm" data-ref-add>Add</button>
      <label class="btn sm">Upload<input type="file" accept="${accept}" data-ref-file hidden></label></div>
      <p class="hint">${hint}</p><div class="ref-list"></div></div></div>`;
  }
  const refValues = (form, name) => $$(`[data-refs="${name}"] .ref-item`, form).map((i) => i.dataset.url);

  function createCustomForm(lyrics = '', title = '') {
    return `<form class="panel" data-form="generate-custom" novalidate>
      ${titleField(title)}
      ${styleField()}
      <div class="field">${sw('instrumental', 'Instrumental only', 'Hides lyrics & vocal settings', false, 'data-toggle-vocals')}</div>
      <div data-vocals>
        ${lyricsEditor({ value: lyrics })}
        ${vocalField()}
      </div>
      ${negField()}
      ${modelPicker()}
      ${advancedBlock()}
      <details class="advanced"><summary>🧬 Persona & length</summary>${personaField()}${durationField()}</details>
      ${submitRow('🎵 Create song', 'Provide at least a style, lyrics or excluded styles. Two takes per request.')}
    </form>`;
  }

  // ---- Lyrics
  function viewLyrics() {
    return `<div class="view-head"><div><h1>Lyric <span class="grad-text">notebook</span></h1>
        <p>Brainstorm complete song lyrics from a one-line idea, then send your favorite straight into the Custom creator.</p></div></div>
      <div class="split">
        <div>
          <form class="panel" data-form="lyrics" novalidate>
            <div class="field prompt-box"><div class="label-row"><label class="label" for="lyr-prompt">What should the song be about?</label>${counter('prompt', 200)}</div>
              <textarea id="lyr-prompt" name="prompt" maxlength="200" placeholder="A love song written from the perspective of a robot learning to feel"></textarea>
              <div class="prompt-tools"><button type="button" class="btn btn-soft sm" data-action="surprise-lyrics">🎲 Inspire me</button>
              <span class="hint" style="margin:0">Mention theme, mood, and structure for best results.</span></div></div>
            ${submitRow('✍️ Write lyrics')}
          </form>
          <div class="panel"><div class="section-title"><h2>Writing now</h2></div><div class="feed" data-feed="lyrics"></div></div>
        </div>
        <div>
          <div class="section-title"><h2>Your lyrics</h2>${S.lyrics.length ? '<button class="btn btn-ghost sm" data-action="clear-lyrics">Clear all</button>' : ''}</div>
          ${S.lyrics.length ? S.lyrics.map((l) => l.items.map((it, i) => `
            <article class="lyric-card"><div class="row" style="justify-content:space-between"><h3>${esc(it.title || 'Untitled')}</h3><span class="b">${ago(l.createdAt)}</span></div>
              ${l.prompt ? `<div class="hint">“${esc(l.prompt)}”</div>` : ''}
              <pre>${esc(it.text)}</pre>
              <div class="row"><button class="btn btn-primary sm" data-use-lyrics="${esc(l.id)}:${i}">🎵 Make it a song</button>
              <button class="btn sm" data-copy-lyrics="${esc(l.id)}:${i}">Copy</button></div></article>`).join('')).join('')
            : `<div class="empty"><span class="big">📝</span><h3>Your notebook is empty</h3><p>Write your first set of lyrics — each request returns multiple variations.</p></div>`}
        </div>
      </div>`;
  }

  // ---- Remix
  const REMIX_OPS = [
    { id: 'cover', e: '🎭', t: 'Cover', d: 'Reimagine a track in a new style, keeping its melody.' },
    { id: 'extend', e: '➡️', t: 'Extend', d: 'Continue an uploaded track in its original style.' },
    { id: 'add-instrumental', e: '🥁', t: 'Add band', d: 'Build backing music around a vocal or melody.' },
    { id: 'add-vocals', e: '🎤', t: 'Add vocals', d: 'Layer AI vocals on top of an instrumental.' },
    { id: 'mashup', e: '🧩', t: 'Mashup', d: 'Blend two tracks into something new.' },
    { id: 'replace', e: '✂️', t: 'Replace section', d: 'Rewrite 10+ seconds inside an uploaded song.' },
  ];
  function viewRemix() {
    const op = S.prefs.remixOp || 'cover';
    return `<div class="view-head"><div><h1>Remix <span class="grad-text">anything</span></h1>
        <p>Upload your own audio (or reuse a track from your library) and transform it: new genre, longer, with a band, with vocals, or mashed up.</p></div></div>
      <div class="split"><div>
        <form class="panel" data-form="remix" novalidate>
          <fieldset class="field"><legend class="label">1 · What do you want to do?</legend>
            <div class="op-grid">${REMIX_OPS.map((o) => `<label class="op-card"><input type="radio" name="_op" value="${o.id}" ${o.id === op ? 'checked' : ''}><span class="e" aria-hidden="true">${o.e}</span><b>${o.t}</b><span>${o.d}</span></label>`).join('')}</div>
          </fieldset>
          <div class="label" style="margin-bottom:10px">2 · Source</div>
          ${sourcePicker('uploadUrl')}
          <div data-op-only="mashup">${sourcePicker('uploadUrl2', { label: 'Second track' })}</div>
          <div class="label" style="margin:6px 0 10px">3 · Shape the result</div>
          <div data-remix-fields></div>
          ${submitRow('🎚️ Remix it', 'Results land in your Library and the session feed.')}
        </form>
      </div>
      <div class="sticky"><div class="panel"><div class="section-title"><h2>Studio session</h2><a href="#library" class="btn btn-ghost sm">Library →</a></div><div class="feed" data-feed="music"></div></div></div></div>`;
  }
  function remixFields(op) {
    switch (op) {
      case 'cover':
        return titleField('', false, 80) + styleField() + `<div class="field">${sw('instrumental', 'Instrumental', '', false, 'data-toggle-vocals')}</div>`
          + `<div data-vocals>${lyricsEditor({ label: 'New lyrics (optional)' })}${vocalField()}</div>` + negField() + modelPicker() + advancedBlock()
          + `<details class="advanced"><summary>🧬 Persona & length</summary>${personaField()}${durationField()}</details>`;
      case 'extend':
        return `<div class="field"><label class="label">Continue from (seconds) <span class="opt">optional</span></label><input type="number" name="continueAt" data-num min="1" step="0.1" placeholder="e.g. 60 — defaults to the end"></div>`
          + titleField('', false, 100) + styleField() + `<div class="field">${sw('instrumental', 'Instrumental', '', false, 'data-toggle-vocals')}</div>`
          + `<div data-vocals>${lyricsEditor({ label: 'Lyrics for the continuation' })}${vocalField()}</div>` + negField() + modelPicker() + advancedBlock()
          + `<details class="advanced"><summary>🧬 Persona</summary>${personaField()}</details>`;
      case 'add-instrumental':
        return `<div class="note">Best with an a cappella vocal or a simple melody. Describe the band you want behind it.</div>`
          + titleField('', true) + styleField({ name: 'tags', label: 'Instrumental style', required: true })
          + negField(true) + lyricsEditor({ label: 'Lyrics sung in the source (optional)', ai: false }) + vocalField() + modelPicker() + advancedBlock();
      case 'add-vocals':
        return `<div class="note">Upload an instrumental; describe the singer and give lyrics.</div>`
          + titleField('', true) + styleField({ label: 'Vocal & music style', required: true }) + negField(true)
          + lyricsEditor({ label: 'Lyrics to sing' }) + vocalField() + modelPicker() + advancedBlock();
      case 'mashup':
        return titleField('', false, 80) + styleField() + lyricsEditor({ label: 'Lyrics (optional)' }) + vocalField() + modelPicker() + advancedBlock()
          + `<details class="advanced"><summary>🧬 Persona & length</summary>${personaField()}${durationField()}</details>`;
      case 'replace':
        return `<div class="note">Pick a window of at least 10 s (and no more than half the song) to regenerate.</div>
          <div class="grid-2"><div class="field"><label class="label">Start (s) <span class="req">*</span></label><input type="number" name="infillStartS" data-num min="0" step="0.01" required></div>
          <div class="field"><label class="label">End (s) <span class="req">*</span></label><input type="number" name="infillEndS" data-num min="0" step="0.01" required></div></div>`
          + titleField('', true) + styleField({ name: 'tags', label: 'Style', required: true })
          + lyricsEditor({ name: 'prompt', label: 'Lyrics for the new section', required: true, ai: false, max: 5000 })
          + lyricsEditor({ name: 'fullLyrics', label: 'Full song lyrics after the change', required: true, ai: false, max: 5000 })
          + negField() + vocalField() + modelPicker() + advancedBlock();
    }
    return '';
  }
  function updateRemixOp(root) {
    const form = $('[data-form="remix"]', root);
    if (!form) return;
    const op = $('input[name=_op]:checked', form).value;
    S.prefs.remixOp = op; save.prefs();
    $$('[data-op-only]', form).forEach((el) => (el.hidden = el.dataset.opOnly !== op));
    $('[data-remix-fields]', form).innerHTML = remixFields(op);
    syncCounters(form);
  }

  // ---- Sounds
  function viewSounds() {
    return `<div class="view-head"><div><h1>Sound <span class="grad-text">lab</span></h1>
        <p>Generate ambiences, loops, effects and stingers — with control over tempo, key and seamless looping.</p></div></div>
      <div class="split"><div>
        <form class="panel" data-form="sounds" novalidate>
          <div class="field prompt-box"><div class="label-row"><label class="label" for="snd-prompt">Describe the sound</label>${counter('prompt', 500)}</div>
            <textarea id="snd-prompt" name="prompt" maxlength="500" placeholder="Soft rain on a tin roof with distant thunder"></textarea>
            <div class="chip-cloud">${SOUND_IDEAS.map((s) => `<button type="button" class="chip" data-set-prompt="${esc(s)}">${esc(s)}</button>`).join('')}</div></div>
          <div class="grid-2">
            <div class="field">${sw('soundLoop', 'Seamless loop', 'Great for backgrounds & beats')}</div>
            <div class="field">${sw('grabLyrics', 'Capture lyric subtitles', 'If the sound contains words')}</div>
          </div>
          ${slider({ name: 'soundTempo', label: 'Tempo', min: 40, max: 220, step: 1, value: 120, unit: ' bpm', hint: 'Auto lets the model choose.' })}
          <div class="field"><label class="label" for="snd-key">Key</label><select id="snd-key" name="soundKey">${KEYS.map((k) => `<option ${k === 'Any' ? 'selected' : ''}>${k}</option>`).join('')}</select></div>
          ${modelPicker()}
          ${submitRow('🌊 Generate sound')}
        </form></div>
        <div class="sticky"><div class="panel"><div class="section-title"><h2>Recent sounds</h2></div><div class="feed" data-feed="sound"></div></div></div>
      </div>`;
  }

  // ---- Library
  function libraryItems() {
    const q = S.lib.q.toLowerCase();
    let list = S.tracks.filter((t) => {
      if (S.lib.filter === 'fav' && !t.fav) return false;
      if (S.lib.filter === 'song' && t.kind === 'sound') return false;
      if (S.lib.filter === 'sound' && t.kind !== 'sound') return false;
      return !q || `${t.title} ${t.tags} ${t.lyrics} ${t.origin}`.toLowerCase().includes(q);
    });
    if (S.lib.sort === 'old') list = [...list].reverse();
    if (S.lib.sort === 'title') list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    if (S.lib.sort === 'long') list = [...list].sort((a, b) => b.duration - a.duration);
    return list;
  }
  function viewLibrary() {
    const list = libraryItems();
    return `<div class="view-head"><div><h1>Your <span class="grad-text">library</span></h1>
        <p>Every track you make lives here. Open one to extend it, split stems, export WAV or MIDI, make a video, and more.</p></div>
        <div class="row"><button class="btn sm" data-action="import-task">⬇️ Import task ID</button><button class="btn sm" data-action="personas">🧬 Personas (${S.personas.length})</button></div></div>
      <div class="lib-toolbar">
        <input type="search" placeholder="Search titles, styles, lyrics…" value="${esc(S.lib.q)}" data-lib-search aria-label="Search library">
        ${segmented('_libfilter', [['all', 'All'], ['song', 'Songs'], ['sound', 'Sounds'], ['fav', '♥ Favorites']], S.lib.filter)}
        <select data-lib-sort aria-label="Sort" style="width:auto"><option value="new">Newest</option><option value="old">Oldest</option><option value="title">Title A–Z</option><option value="long">Longest</option></select>
      </div>
      ${list.length ? `<div class="lib-grid">${list.map(trackCard).join('')}</div>`
        : S.tracks.length ? `<div class="empty"><span class="big">🔍</span><h3>No matches</h3><p>Try a different search or filter.</p></div>`
        : `<div class="empty"><span class="big">🎶</span><h3>No tracks yet</h3><p>Your creations will appear here — let’s make the first one.</p><a class="btn btn-primary" href="#create">🎵 Create a song</a></div>`}`;
  }

  function art(t, big = false) {
    const playingNow = S.playing === t.id;
    return `<div class="art ${playingNow ? 'playing' : ''} ${!t.imageUrl && !playable(t) ? 'skeleton' : ''}">
      ${t.imageUrl ? `<img src="${esc(t.imageUrl)}" alt="" loading="lazy">` : ''}
      ${playable(t) ? `<button class="play-over" data-play="${esc(t.id)}" aria-label="${playingNow && !$('#audio').paused ? 'Pause' : 'Play'} ${esc(t.title)}">${playingNow && !$('#audio').paused ? '⏸' : '▶'}</button>` : ''}
      ${big && t.duration ? `<span class="dur">${fmtTime(t.duration)}</span>` : ''}</div>`;
  }
  function trackCard(t) {
    return `<article class="track-card">
      <div style="position:relative">${art(t, true)}<button class="fav" data-fav="${esc(t.id)}" aria-label="Favorite" aria-pressed="${t.fav}">${t.fav ? '♥' : '♡'}</button></div>
      <div class="body"><b title="${esc(t.title)}">${esc(t.title)}</b><div class="tags">${esc(t.tags || t.origin)}</div>
        <div class="foot"><div class="badges"><span class="b ${t.kind === 'sound' ? 'accent' : ''}">${esc(t.origin)}</span>${!t.audioUrl && t.streamUrl ? '<span class="b warn">streaming</span>' : ''}</div>
        <button class="btn btn-ghost sm" data-open="${esc(t.id)}">Open</button></div></div></article>`;
  }
  function trackRow(t) {
    return `<div class="track-row">${art(t)}<div class="track-info"><b>${esc(t.title)}</b><span>${t.duration ? fmtTime(t.duration) + ' · ' : ''}${esc(t.tags || t.origin)}</span></div>
      <div class="track-actions">${!t.audioUrl && t.streamUrl ? '<span class="b warn" title="Final file still rendering">live</span>' : ''}<button class="icon-btn" data-open="${esc(t.id)}" aria-label="Open ${esc(t.title)}">⋯</button></div></div>`;
  }

  // Feeds: live task cards in each studio.
  function refreshFeeds() {
    $$('[data-feed]').forEach((feed) => {
      const kind = feed.dataset.feed;
      let tasks;
      if (kind === 'lyrics') tasks = S.tasks.filter((t) => t.kind === 'lyrics' && isActive(t));
      else tasks = S.tasks.filter((t) => t.kind === 'music' && (kind === 'sound' ? t.meta.kind === 'sound' : t.meta.kind !== 'sound')).slice(0, 8);
      if (!tasks.length) {
        feed.innerHTML = kind === 'lyrics' ? '<p class="hint">Nothing in progress.</p>'
          : `<div class="empty" style="padding:28px 16px"><span class="big">${kind === 'sound' ? '🌊' : '🎧'}</span><p>Your ${kind === 'sound' ? 'sounds' : 'songs'} will show up here as they’re created.</p></div>`;
        return;
      }
      feed.innerHTML = tasks.map(feedTask).join('');
    });
  }
  function feedTask(t) {
    const tracks = S.tracks.filter((x) => x.taskId === t.id);
    const k = KINDS[t.kind];
    const active = isActive(t);
    return `<div class="feed-task">
      <div class="feed-task-head"><div><b>${k.icon} ${esc(t.label)}</b> <span class="muted">· ${esc(t.meta.origin || k.label)} · ${ago(t.createdAt)}</span></div>
        ${active ? '<span class="eqbars" aria-label="In progress"><i></i><i></i><i></i></span>' : t.state === 'failed' ? '<span class="b err">failed</span>' : '<span class="b ok">done</span>'}</div>
      ${active ? `<div class="progress"><i style="width:${t.pct || 10}%"></i></div><div class="stage"><span>${esc(t.stage)}</span><span class="fun-msg">${esc(t.fun)}</span></div>` : ''}
      ${t.state === 'failed' ? `<p class="hint" style="color:var(--err)">${esc(t.error)}</p>` : ''}
      ${tracks.length ? `<div style="margin-top:${active ? 10 : 0}px">${tracks.map(trackRow).join('')}</div>`
        : active && t.kind === 'music' ? `<div class="track-row"><div class="art skeleton"></div><div class="track-info"><div class="skeleton" style="height:12px;width:60%"></div><div class="skeleton" style="height:10px;width:40%;margin-top:6px"></div></div></div>` : ''}
    </div>`;
  }

  // Activity drawer
  function renderActivity() {
    const active = S.tasks.filter(isActive).length;
    const badge = $('#activity-badge');
    badge.hidden = !active;
    badge.textContent = active;
    $('#activity-btn').classList.toggle('busy', active > 0);
    const list = $('#activity-list');
    if (!S.tasks.length) { list.innerHTML = '<div class="empty"><span class="big">🌙</span><p>No activity yet.</p></div>'; return; }
    list.innerHTML = S.tasks.slice(0, 60).map((t) => {
      const k = KINDS[t.kind];
      return `<div class="act-item"><div class="top"><b>${k.icon} ${esc(t.label)}</b>
        ${isActive(t) ? '<span class="b accent">working</span>' : t.state === 'failed' ? '<span class="b err">failed</span>' : '<span class="b ok">done</span>'}</div>
        <div class="meta">${esc(k.label)} · ${ago(t.createdAt)} · <code>${esc(t.id)}</code></div>
        ${isActive(t) ? `<div class="progress"><i style="width:${t.pct || 10}%"></i></div><div class="stage"><span>${esc(t.stage)}</span></div>` : ''}
        ${t.error ? `<div class="err">${esc(t.error)}</div>` : ''}
        <div class="row" style="margin-top:8px">
          ${t.meta.trackId ? `<button class="btn btn-ghost sm" data-open="${esc(t.meta.trackId)}">Open track</button>` : ''}
          ${t.kind === 'lyrics' && t.state === 'success' ? '<a class="btn btn-ghost sm" href="#lyrics" data-close-drawer>View lyrics</a>' : ''}
          ${t.state === 'failed' ? `<button class="btn btn-ghost sm" data-retry-poll="${esc(t.id)}">Check again</button>` : ''}
          <button class="btn btn-ghost sm" data-remove-task="${esc(t.id)}">Remove</button></div></div>`;
    }).join('');
  }
  function toggleDrawer(open) {
    $('#drawer').classList.toggle('open', open);
    $('#drawer').setAttribute('aria-hidden', String(!open));
    $('#scrim').hidden = !open;
    if (open) renderActivity();
  }

  // ---------------------------------------------------------------- track detail modal
  function openTrack(id) {
    const t = findTrack(id);
    if (!t) return toast('Track not found in your library.', 'warn');
    modalTrackId = id;
    const a = t.assets || {};
    const stems = a.stems || [];
    const html = `
      <div class="detail-hero">${art(t)}
        <div><h3>${esc(t.title)}</h3><div class="tags">${esc(t.tags)}</div>
          <div class="badges" style="margin-bottom:10px"><span class="b accent">${esc(t.origin)}</span>${t.model ? `<span class="b">${esc(t.model)}</span>` : ''}${t.duration ? `<span class="b">${fmtTime(t.duration)}</span>` : ''}${t.fav ? '<span class="b">♥ favorite</span>' : ''}</div>
          <div class="row" style="flex-wrap:wrap;margin-bottom:12px">
            ${playable(t) ? `<button class="btn btn-primary sm" data-play="${esc(t.id)}">▶ Play</button>` : ''}
            ${t.audioUrl ? `<a class="btn sm" href="${esc(t.audioUrl)}" target="_blank" rel="noopener" download>⬇️ MP3</a>` : ''}
            <button class="btn sm" data-fav="${esc(t.id)}">${t.fav ? '♥ Unfavorite' : '♡ Favorite'}</button>
            <button class="btn sm" data-copy="${esc(t.audioUrl || t.streamUrl)}">🔗 Copy link</button>
          </div>
          <div class="kv"><span>Task</span><code>${esc(t.taskId)}</code><span>Audio ID</span><code>${esc(t.id)}</code>${t.modelName ? `<span>Engine</span><code>${esc(t.modelName)}</code>` : ''}</div>
        </div></div>
      ${!t.audioUrl && t.streamUrl ? '<p class="note warn">The final high-quality file is still rendering — you can already stream this take. Tools unlock when it’s done.</p>' : ''}
      <h3 style="font-size:15px;margin:4px 0 10px">Do more with this track</h3>
      <div class="action-grid">
        ${act('extend', '➡️', 'Extend', 'Keep the song going')}
        ${act('replace', '✂️', 'Replace section', 'Rewrite part of it')}
        ${act('remix', '🎭', 'Cover / remix', 'Open in Remix')}
        ${act('stems', '🎛️', 'Split stems', 'Vocals, drums, bass…')}
        ${act('midi', '🎹', 'MIDI', stems.length ? 'Transcribe notes' : 'Split stems first')}
        ${act('wav', '💿', 'WAV export', 'Lossless download')}
        ${act('video', '🎬', 'Music video', 'MP4 visualizer')}
        ${act('cover', '🖼️', 'Cover art', 'New artwork')}
        ${act('persona', '🧬', 'Create persona', 'Reuse this voice/vibe')}
        ${act('karaoke', '🎤', 'Synced lyrics', 'Karaoke-style view')}
        ${act('recover', '🛟', 'Recover audio', 'Fix expired links')}
        ${act('delete', '🗑️', 'Remove', 'From this library')}
      </div>
      ${assetsBlock(t)}
      ${t.lyrics ? `<h3 style="font-size:15px;margin:18px 0 8px">Lyrics / prompt</h3><pre class="lyrics-view">${esc(t.lyrics)}</pre>` : ''}`;
    if ($('#modal').hidden) openModal(t.title, html);
    else { $('#modal-title').textContent = t.title; $('#modal-body').innerHTML = html; }
  }
  const act = (id, e, t, d) => `<button class="action" data-track-action="${id}"><span class="e" aria-hidden="true">${e}</span><b>${t}</b><span>${d}</span></button>`;

  const STEM_LABELS = { vocalUrl: 'Vocals', instrumentalUrl: 'Instrumental', backingVocalsUrl: 'Backing vocals', drumsUrl: 'Drums', bassUrl: 'Bass', guitarUrl: 'Guitar', keyboardUrl: 'Keyboard', percussionUrl: 'Percussion', stringsUrl: 'Strings', synthUrl: 'Synth', fxUrl: 'FX', brassUrl: 'Brass', woodwindsUrl: 'Woodwinds' };
  function assetsBlock(t) {
    const a = t.assets || {};
    const pending = S.tasks.filter((x) => x.meta.trackId === t.id && isActive(x));
    const rows = [];
    pending.forEach((x) => rows.push(`<div class="asset"><span>${KINDS[x.kind].icon} ${esc(KINDS[x.kind].label)} — ${esc(x.stage)}</span><span class="eqbars"><i></i><i></i><i></i></span></div>`));
    if (a.wav) rows.push(`<div class="asset"><span>💿 WAV (lossless)</span><div><a class="btn sm" href="${esc(a.wav)}" target="_blank" rel="noopener" download>⬇️ Download</a></div></div>`);
    if (a.video) rows.push(`<div class="asset"><span>🎬 Music video</span><div><a class="btn sm" href="${esc(a.video)}" target="_blank" rel="noopener">▶ Watch / download</a></div></div>`);
    (a.stems || []).forEach((s) => {
      const r = s.result || {};
      const links = Object.entries(STEM_LABELS).filter(([k]) => r[k]).map(([k, l]) => [l, r[k]]);
      (r.originData || []).forEach((o) => o.audio_url && !links.some(([, u]) => u === o.audio_url) && links.push([o.stem_type_group_name || 'Stem', o.audio_url]));
      rows.push(`<div class="asset" style="display:block"><b>🎛️ Stems · ${esc(s.type === 'split_stem_advanced' ? s.stemName : s.type === 'split_stem' ? 'full split' : 'vocals / instrumental')}</b>
        <div style="margin-top:8px;display:grid;gap:6px">${links.map(([l, u]) => `<div class="row" style="justify-content:space-between;flex-wrap:wrap"><span>${esc(l)}</span><div class="row"><audio controls preload="none" src="${esc(u)}"></audio><a class="btn sm" href="${esc(u)}" target="_blank" rel="noopener" download>⬇️</a></div></div>`).join('') || '<span class="hint">No stem files returned.</span>'}</div></div>`);
    });
    if (a.midi) {
      const ins = a.midi.instruments || [];
      rows.push(`<div class="asset" style="display:block"><div class="row" style="justify-content:space-between"><b>🎹 MIDI · ${ins.length} instrument${ins.length === 1 ? '' : 's'}</b>${ins.length ? '<button class="btn sm" data-dl-midi>⬇️ Download .mid</button>' : ''}</div>
        <div class="midi-list" style="margin-top:8px">${ins.map((i) => `<div><span>${esc(i.name)}</span><span>${(i.notes || []).length} notes</span></div>`).join('')}</div></div>`);
    }
    if (a.covers?.length) rows.push(`<div class="asset" style="display:block"><b>🖼️ Cover art</b><div class="cover-grid" style="margin-top:8px">${a.covers.map((u) => `<a href="${esc(u)}" target="_blank" rel="noopener"><img src="${esc(u)}" alt="Generated cover" loading="lazy"></a>`).join('')}</div></div>`);
    if (t.aligned?.length) rows.push(`<div class="asset"><span>🎤 Synced lyrics loaded</span><div><button class="btn sm" data-track-action="karaoke">Open</button></div></div>`);
    return rows.length ? `<h3 style="font-size:15px;margin:18px 0 8px">Exports & extras</h3><div class="assets">${rows.join('')}</div>` : '';
  }

  // ---- action forms
  function trackActionForm(t, action) {
    const needFinal = ['extend', 'replace', 'stems', 'wav', 'video', 'persona', 'karaoke', 'midi'];
    if (needFinal.includes(action) && !t.audioUrl) return toast('Wait until the final audio finishes rendering.', 'warn');
    const back = `<button type="button" class="btn btn-ghost" data-open="${esc(t.id)}">← Back</button>`;
    const dur = t.duration || 0;
    switch (action) {
      case 'extend':
        return openModal(`Extend · ${t.title}`, `<form data-form="extend" novalidate>
          <div class="field"><label class="label">Continue from (seconds)</label><input type="number" name="continueAt" data-num min="1" max="${Math.max(1, dur - 0.1)}" step="0.1" value="${dur ? Math.max(1, Math.floor(dur - 1)) : ''}">
            <p class="hint">Track length is ${fmtTime(dur)}. Pick an earlier point to take the song somewhere new from there.</p></div>
          ${titleField(`${t.title} (Extended)`, false, 100)}${styleField({ value: t.tags })}
          <div class="field">${sw('instrumental', 'Instrumental continuation', '', false, 'data-toggle-vocals')}</div>
          <div data-vocals>${lyricsEditor({ label: 'Lyrics for the new part' })}${vocalField()}</div>
          ${negField()}${modelPicker()}${advancedBlock()}<details class="advanced"><summary>🧬 Persona</summary>${personaField()}</details>
          <div class="modal-foot">${back}<button class="btn btn-primary">➡️ Extend</button></div></form>`, syncCounters);
      case 'replace': {
        const s0 = Math.max(0, Math.floor(dur * 0.3)), e0 = Math.min(dur, s0 + Math.max(10, Math.floor(dur * 0.2)));
        return openModal(`Replace a section · ${t.title}`, `<form data-form="replace" novalidate>
          <div class="note">Choose at least 10 s and at most half of the song (${fmtTime(dur)}). The new part blends into what’s around it.</div>
          <div class="grid-2"><div class="field"><label class="label">Start (s)</label><input type="number" name="infillStartS" data-num min="0" max="${dur}" step="0.01" value="${s0}" data-range-input></div>
          <div class="field"><label class="label">End (s)</label><input type="number" name="infillEndS" data-num min="0" max="${dur}" step="0.01" value="${e0}" data-range-input></div></div>
          <div class="range-viz" data-dur="${dur}"><i></i></div><p class="hint" data-range-msg></p>
          ${titleField(t.title, true, 80)}${styleField({ name: 'tags', label: 'Style', value: t.tags, required: true })}
          ${lyricsEditor({ name: 'prompt', label: 'Lyrics for the replaced section', required: true, ai: false })}
          ${lyricsEditor({ name: 'fullLyrics', label: 'Full lyrics after the change', value: t.lyrics, required: true, ai: false })}
          ${negField()}${vocalField()}${advancedBlock()}<details class="advanced"><summary>🧬 Persona</summary>${personaField()}</details>
          <div class="modal-foot">${back}<button class="btn btn-primary">✂️ Replace section</button></div></form>`, (b) => { syncCounters(b); updateRangeViz(b); });
      }
      case 'stems':
        return openModal(`Split stems · ${t.title}`, `<form data-form="stems" novalidate>
          <fieldset class="field"><legend class="label">Separation type</legend>
            <div class="op-grid" style="grid-template-columns:1fr">
              <label class="op-card"><input type="radio" name="type" value="separate_vocal" checked><b>🎤 Vocals + instrumental</b><span>Two clean tracks — perfect for karaoke or acapellas.</span></label>
              <label class="op-card"><input type="radio" name="type" value="split_stem"><b>🎛️ Full split</b><span>Vocals, backing vocals, drums, bass, guitar, keys, strings, synth, FX and more.</span></label>
              <label class="op-card"><input type="radio" name="type" value="split_stem_advanced"><b>🎯 Single instrument</b><span>Pull out one specific instrument with refined separation.</span></label>
            </div></fieldset>
          <div class="field" data-stem-name hidden><label class="label">Instrument</label><select name="stemName">${STEMS.map((s) => `<option>${esc(s)}</option>`).join('')}</select></div>
          <p class="hint">Stem separation consumes credits; full splits cost more than vocal separation.</p>
          <div class="modal-foot">${back}<button class="btn btn-primary">🎛️ Separate</button></div></form>`);
      case 'midi': {
        const stems = (t.assets?.stems || []);
        if (!stems.length) {
          return openModal(`MIDI · ${t.title}`, `<p class="note">MIDI is transcribed from separated stems. Split this track’s stems first, then come back here.</p>
            <div class="modal-foot">${back}<button class="btn btn-primary" data-track-action="stems">🎛️ Split stems now</button></div>`);
        }
        return openModal(`MIDI · ${t.title}`, `<form data-form="midi" novalidate>
          <div class="field"><label class="label">From separation</label><select name="stemTask">${stems.map((s, i) => `<option value="${i}">${esc(s.type)}${s.stemName ? ' · ' + esc(s.stemName) : ''}</option>`).join('')}</select></div>
          <div class="field"><label class="label">Instrument track <span class="opt">optional</span></label><select name="audioId"><option value="">All detected instruments</option>
            ${stems.flatMap((s) => (s.result?.originData || []).map((o) => `<option value="${esc(o.id)}">${esc(o.stem_type_group_name || o.id)}</option>`)).join('')}</select></div>
          <div class="modal-foot">${back}<button class="btn btn-primary">🎹 Transcribe</button></div></form>`);
      }
      case 'video':
        return openModal(`Music video · ${t.title}`, `<form data-form="video" novalidate>
          <div class="field"><label class="label">Artist name <span class="opt">optional</span></label><input type="text" name="author" maxlength="50" placeholder="Shown at the start of the video"></div>
          <div class="field"><label class="label">Watermark / website <span class="opt">optional</span></label><input type="text" name="domainName" maxlength="50" placeholder="e.g. myband.com"></div>
          <div class="modal-foot">${back}<button class="btn btn-primary">🎬 Create video</button></div></form>`);
      case 'persona':
        return openModal(`Create persona · ${t.title}`, `<form data-form="persona" novalidate>
          <p class="note">A persona captures this track’s vocal character and vibe so you can reuse it in new songs.</p>
          <div class="field"><label class="label">Name <span class="req">*</span></label><input type="text" name="name" required maxlength="80" placeholder="e.g. Midnight Soul Singer"></div>
          <div class="field"><label class="label">Description <span class="req">*</span></label><textarea name="description" rows="3" required placeholder="Warm, breathy female alto with jazzy phrasing over lush neo-soul production"></textarea></div>
          <div class="grid-2"><div class="field"><label class="label">Analyze from (s)</label><input type="number" name="vocalStart" data-num min="0" step="0.1" value="0"></div>
          <div class="field"><label class="label">to (s)</label><input type="number" name="vocalEnd" data-num min="1" step="0.1" value="${Math.min(30, Math.floor(dur) || 30)}"></div></div>
          <div class="field"><label class="label">Style label <span class="opt">optional</span></label><input type="text" name="style" value="${esc((t.tags || '').slice(0, 120))}"></div>
          <div class="modal-foot">${back}<button class="btn btn-primary">🧬 Create persona</button></div></form>`);
      case 'wav': return runTrackTask(t, 'wav', '/api/v1/wav/generate', { taskId: t.taskId, audioId: t.id });
      case 'cover': return runTrackTask(t, 'cover', '/api/v1/suno/cover/generate', { taskId: t.taskId }, { musicTaskId: t.taskId });
      case 'recover': return runTrackTask(t, 'recovery', '/api/v1/suno/recovery', { sunoTaskId: t.taskId });
      case 'karaoke': return loadKaraoke(t);
      case 'remix':
        closeModal();
        S.prefs.remixOp = 'cover'; save.prefs();
        go('remix');
        setTimeout(() => { const box = $('[data-source="uploadUrl"]'); if (box && t.audioUrl) setSource(box, t.audioUrl); }, 50);
        return;
      case 'delete':
        if (!confirm(`Remove “${t.title}” from your library? (The audio stays on SunoAPI until it expires.)`)) return;
        S.tracks = S.tracks.filter((x) => x.id !== t.id);
        save.tracks(); updateLibCount(); closeModal();
        if (S.view === 'library') renderView(); else refreshFeeds();
        return toast('Track removed.', 'info');
    }
  }

  async function runTrackTask(t, kind, path, body, meta = {}) {
    try {
      let data;
      try {
        data = await api(path, { method: 'POST', body: { ...body, callBackUrl: callbackUrl() } });
      } catch (e) {
        // Cover art already generated → API returns the existing taskId.
        if (kind === 'cover' && e.data?.taskId) data = e.data; else throw e;
      }
      addTask(data?.taskId || data?.task_id, kind, t.title, { trackId: t.id, ...meta });
      toast(`${KINDS[kind].icon} ${KINDS[kind].label} started for “${esc(t.title)}”.`, 'info');
      openTrack(t.id);
    } catch (e) { handleErr(e); }
  }

  async function loadKaraoke(t) {
    if (t.aligned?.length) { showKaraoke(t); return; }
    try {
      toast('🎤 Fetching synced lyrics…');
      const d = await api('/api/v1/generate/get-timestamped-lyrics', { method: 'POST', body: { taskId: t.taskId, audioId: t.id } });
      t.aligned = (d?.alignedWords || []).map((w) => ({ w: w.word, s: w.startS, e: w.endS }));
      save.tracks();
      if (!t.aligned.length) return toast('No synced lyrics are available for this track (instrumental?).', 'warn');
      showKaraoke(t);
    } catch (e) { handleErr(e); }
  }
  function showKaraoke(t) {
    closeModal();
    if (S.playing !== t.id) playTrack(t.id);
    $('#karaoke-body').innerHTML = t.aligned.map((w, i) => {
      const txt = esc(w.w).replace(/\[([^\]]+)\]/g, '<span class="sec">[$1]</span>').replace(/\n/g, '<br>');
      return `<span class="w" data-i="${i}" data-s="${w.s}">${txt}</span> `;
    }).join('');
    lastWord = -1;
    $('#karaoke').hidden = false;
  }

  function updateRangeViz(root) {
    const viz = $('.range-viz', root);
    if (!viz) return;
    const dur = Number(viz.dataset.dur) || 0;
    const s = Number($('[name=infillStartS]', root).value), e = Number($('[name=infillEndS]', root).value);
    const i = $('i', viz);
    i.style.left = `${dur ? (s / dur) * 100 : 0}%`;
    i.style.width = `${dur ? Math.max(0, (e - s) / dur) * 100 : 0}%`;
    const msg = $('[data-range-msg]', root);
    const len = e - s;
    msg.textContent = `${fmtTime(s)} → ${fmtTime(e)} · ${len.toFixed(1)} s selected`;
    msg.style.color = len < 10 || (dur && len > dur / 2) || e > dur ? 'var(--err)' : '';
  }

  // MIDI file writer (format 1, one track per instrument)
  function buildMidi(instruments) {
    const PPQ = 480, BPM = 120, tick = (sec) => Math.round(sec * PPQ * BPM / 60);
    const vlq = (n) => { const b = [n & 0x7f]; while ((n >>= 7)) b.unshift((n & 0x7f) | 0x80); return b; };
    const str = (s) => [...s].map((c) => c.charCodeAt(0) & 0x7f);
    const u32 = (n) => [(n >>> 24) & 255, (n >>> 16) & 255, (n >>> 8) & 255, n & 255];
    const chunk = (id, data) => [...str(id), ...u32(data.length), ...data];
    const tempo = [0, 0xff, 0x51, 0x03, 0x07, 0xa1, 0x20, 0, 0xff, 0x2f, 0];
    const tracks = [chunk('MTrk', tempo)];
    instruments.slice(0, 15).forEach((ins, idx) => {
      const ch = /drum/i.test(ins.name) ? 9 : idx >= 9 ? idx + 1 : idx;
      const ev = [];
      (ins.notes || []).forEach((n) => {
        const vel = Math.max(1, Math.min(127, Math.round((n.velocity <= 1 ? n.velocity * 100 : n.velocity) || 90)));
        const p = Math.max(0, Math.min(127, n.pitch | 0));
        ev.push([tick(n.start), 0x90 | ch, p, vel], [tick(n.end), 0x80 | ch, p, 0]);
      });
      ev.sort((a, b) => a[0] - b[0] || (a[1] & 0xf0) - (b[1] & 0xf0));
      const name = str(ins.name || 'Instrument').slice(0, 60);
      const data = [0, 0xff, 0x03, ...vlq(name.length), ...name];
      let last = 0;
      ev.forEach(([t, s, p, v]) => { data.push(...vlq(t - last), s, p, v); last = t; });
      data.push(0, 0xff, 0x2f, 0);
      tracks.push(chunk('MTrk', data));
    });
    const header = chunk('MThd', [0, 1, 0, tracks.length, (PPQ >> 8) & 255, PPQ & 255]);
    return new Blob([new Uint8Array([...header, ...tracks.flat()])], { type: 'audio/midi' });
  }

  // ---------------------------------------------------------------- form handlers
  function handleErr(e) {
    if (e?.code === 401) return authFailed();
    toast(esc(e?.message || 'Something went wrong.'), 'err');
  }
  function numOk(n) { return Number.isFinite(n); }
  function cleanVocals(p) {
    if (p.instrumental) { delete p.lyrics; delete p.prompt; delete p.vocalGender; delete p.audioWeight; }
    return p;
  }
  function rememberModel(p) { if (p.model) { S.prefs.model = p.model; save.prefs(); } }

  async function submitMusic(path, body, label, meta) {
    const data = await api(path, { method: 'POST', body: { ...body, callBackUrl: callbackUrl() } });
    addTask(data?.taskId, 'music', label, { model: body.model, ...meta });
    toast(`🎼 “${esc(label)}” is in the studio. This usually takes 1–3 minutes.`, 'info');
    refreshCredits();
  }

  const HANDLERS = {
    async 'generate-simple'(form) {
      const p = collect(form);
      const refs = { imageUrls: refValues(form, 'imageUrls'), videoUrls: refValues(form, 'videoUrls'), audioUrls: refValues(form, 'audioUrls') };
      need(p.prompt || refs.imageUrls.length || refs.videoUrls.length || refs.audioUrls.length, 'Describe your song (or attach a reference) first.');
      need(refs.imageUrls.length <= 5, 'Up to 5 images.');
      need(refs.videoUrls.length <= 1, 'Only one video reference is allowed.');
      const body = { customMode: false, instrumental: !!p.instrumental, model: p.model || 'V6' };
      if (p.prompt) body.prompt = p.prompt;
      for (const [k, v] of Object.entries(refs)) if (v.length) body[k] = v;
      rememberModel(body);
      const label = (p.prompt || 'Inspired by references').split(/[,.!\n]/)[0].slice(0, 48);
      await submitMusic('/api/v1/generate', body, label, { origin: 'Generated' });
      form.reset();
      $$('.ref-list', form).forEach((l) => (l.innerHTML = ''));
      syncCounters(form);
    },
    async 'generate-custom'(form) {
      const p = cleanVocals(collect(form));
      need(p.style || p.lyrics || p.negativeTags, 'Add a style, lyrics or excluded styles.');
      need(p.instrumental || p.lyrics || p.style, 'Add some lyrics or switch to instrumental.');
      const body = { customMode: true, ...p, instrumental: !!p.instrumental, model: p.model || 'V6' };
      if (body.lyrics) body.prompt = body.lyrics;
      if (body.duration && !DURATION_MODELS.includes(body.model)) delete body.duration;
      rememberModel(body);
      await submitMusic('/api/v1/generate', body, p.title || (p.style || 'Custom song').split(',')[0].slice(0, 48), { origin: 'Custom', title: p.title });
    },
    async lyrics(form) {
      const p = collect(form);
      need(p.prompt, 'Tell the AI what the song should be about.');
      const data = await api('/api/v1/lyrics', { method: 'POST', body: { prompt: p.prompt, callBackUrl: callbackUrl() } });
      addTask(data?.taskId, 'lyrics', p.prompt.slice(0, 48), { prompt: p.prompt });
      toast('✍️ Writing your lyrics…', 'info');
      form.reset(); syncCounters(form);
    },
    async sounds(form) {
      const p = collect(form);
      need(p.prompt, 'Describe the sound you want.');
      const body = { prompt: p.prompt, model: p.model || 'V6', soundLoop: !!p.soundLoop };
      if (p.soundTempo) body.soundTempo = Math.round(p.soundTempo);
      if (p.soundKey && p.soundKey !== 'Any') body.soundKey = p.soundKey;
      if (p.grabLyrics) body.grabLyrics = true;
      rememberModel(body);
      await submitMusic('/api/v1/generate/sounds', body, p.prompt.slice(0, 48), { origin: 'Sound', kind: 'sound' });
    },
    async remix(form) {
      const op = $('input[name=_op]:checked', form).value;
      const p = collect(form);
      need(p.uploadUrl, 'Add a source track first (upload, URL or library).');
      const src = p.uploadUrl; delete p.uploadUrl;
      const src2 = p.uploadUrl2; delete p.uploadUrl2;
      const model = p.model || 'V6';
      let path, body, label = p.title || REMIX_OPS.find((o) => o.id === op).t, origin;
      switch (op) {
        case 'cover':
          cleanVocals(p);
          body = { ...p, uploadUrl: src, model, instrumental: !!p.instrumental };
          if (body.lyrics) body.prompt = body.lyrics;
          need(body.style || body.lyrics || body.instrumental, 'Give the cover a style (or new lyrics).');
          path = '/api/v1/generate/upload-cover'; origin = 'Cover'; break;
        case 'extend':
          cleanVocals(p);
          body = { ...p, uploadUrl: src, model, instrumental: !!p.instrumental };
          if (body.lyrics) body.prompt = body.lyrics;
          path = '/api/v1/generate/upload-extend'; origin = 'Extended'; break;
        case 'add-instrumental':
          need(p.title && p.tags && p.negativeTags, 'Title, instrumental style and excluded styles are required.');
          body = { ...p, uploadUrl: src, model };
          path = '/api/v1/generate/add-instrumental'; origin = 'Band added'; break;
        case 'add-vocals':
          need(p.title && p.style && p.negativeTags, 'Title, style and excluded styles are required.');
          body = { ...p, uploadUrl: src, model };
          if (body.lyrics) body.prompt = body.lyrics;
          path = '/api/v1/generate/add-vocals'; origin = 'Vocals added'; break;
        case 'mashup':
          need(src2, 'Add the second track for your mashup.');
          body = { ...p, uploadUrlList: [src, src2], model };
          if (body.lyrics) body.prompt = body.lyrics;
          path = '/api/v1/generate/mashup'; origin = 'Mashup'; break;
        case 'replace':
          need(p.title && p.tags && p.prompt && p.fullLyrics, 'Title, style, section lyrics and full lyrics are required.');
          need(numOk(p.infillStartS) && numOk(p.infillEndS) && p.infillEndS - p.infillStartS >= 10, 'The replaced section must be at least 10 seconds long.');
          body = { ...p, uploadUrl: src, model, lyrics: p.prompt };
          path = '/api/v1/generate/replace-section'; origin = 'Section replaced'; break;
      }
      if (body.duration && !DURATION_MODELS.includes(model)) delete body.duration;
      rememberModel(body);
      await submitMusic(path, body, label, { origin, title: p.title });
    },
    async extend(form) {
      const t = findTrack(modalTrackId);
      const p = cleanVocals(collect(form));
      if (p.continueAt != null) need(p.continueAt > 0 && (!t.duration || p.continueAt < t.duration), `Continue point must be between 0 and ${t.duration.toFixed(1)} s.`);
      const body = { ...p, audioId: t.id, taskId: t.taskId, model: p.model || 'V6', instrumental: !!p.instrumental };
      if (body.lyrics) body.prompt = body.lyrics;
      rememberModel(body);
      await submitMusic('/api/v1/generate/extend', body, p.title || `${t.title} (Extended)`, { origin: 'Extended', title: p.title, parent: t.id });
      closeModal();
    },
    async replace(form) {
      const t = findTrack(modalTrackId);
      const p = collect(form);
      const len = p.infillEndS - p.infillStartS;
      need(p.title && p.tags && p.prompt && p.fullLyrics, 'Title, style, section lyrics and full lyrics are all required.');
      need(numOk(len) && len >= 10, 'Select at least 10 seconds.');
      need(!t.duration || len <= t.duration / 2, 'The section can be at most half of the song.');
      need(!t.duration || p.infillEndS <= t.duration, 'End time is beyond the end of the track.');
      const body = { ...p, lyrics: p.prompt, taskId: t.taskId, audioId: t.id };
      await submitMusic('/api/v1/generate/replace-section', body, p.title, { origin: 'Section replaced', title: p.title, parent: t.id });
      closeModal();
    },
    async stems(form) {
      const t = findTrack(modalTrackId);
      const p = collect(form);
      const body = { taskId: t.taskId, audioId: t.id, type: p.type, callBackUrl: callbackUrl() };
      if (p.type === 'split_stem_advanced') body.stemName = p.stemName;
      const data = await api('/api/v1/vocal-removal/generate', { method: 'POST', body });
      addTask(data?.taskId, 'stems', t.title, { trackId: t.id, type: p.type, stemName: body.stemName });
      toast('🎛️ Separating stems…', 'info');
      openTrack(t.id);
    },
    async midi(form) {
      const t = findTrack(modalTrackId);
      const p = collect(form);
      const stem = t.assets.stems[Number(p.stemTask) || 0];
      const body = { taskId: stem.taskId, callBackUrl: callbackUrl() };
      if (p.audioId) body.audioId = p.audioId;
      const data = await api('/api/v1/midi/generate', { method: 'POST', body });
      addTask(data?.taskId, 'midi', t.title, { trackId: t.id });
      toast('🎹 Transcribing to MIDI…', 'info');
      openTrack(t.id);
    },
    async video(form) {
      const t = findTrack(modalTrackId);
      const p = collect(form);
      await runTrackTask(t, 'video', '/api/v1/mp4/generate', { taskId: t.taskId, audioId: t.id, ...p });
    },
    async persona(form) {
      const t = findTrack(modalTrackId);
      const p = collect(form);
      need(p.name && p.description, 'Name and description are required.');
      need(!(p.vocalEnd <= p.vocalStart), 'The end time must be after the start time.');
      const d = await api('/api/v1/generate/generate-persona', { method: 'POST', body: { taskId: t.taskId, audioId: t.id, ...p } });
      need(d?.personaId, 'SunoAPI did not return a persona ID.');
      S.personas.unshift({ id: d.personaId, name: d.name || p.name, description: p.description, trackId: t.id, createdAt: Date.now() });
      save.personas(); updatePersonaList();
      toast(`🧬 Persona “${esc(d.name || p.name)}” saved. Use it in Create → Custom → Persona.`, 'ok');
      openTrack(t.id);
    },
    async 'ai-lyrics'(form) {
      const p = collect(form);
      need(p.prompt, 'Describe what the lyrics should be about.');
      const data = await api('/api/v1/lyrics', { method: 'POST', body: { prompt: p.prompt, callBackUrl: callbackUrl() } });
      const task = addTask(data?.taskId, 'lyrics', p.prompt.slice(0, 48), { prompt: p.prompt });
      const target = form.dataset.target;
      $('#modal-body').innerHTML = `<div class="progress indet"><i></i></div><p class="hint" style="text-align:center">✍️ ${esc(pick(FUN))} Lyrics usually take under a minute.</p>`;
      try {
        const items = await waitFor(task.id);
        if ($('#modal').hidden) return;
        $('#modal-body').innerHTML = items.map((it, i) => `<article class="lyric-card"><h3>${esc(it.title || 'Untitled')}</h3><pre>${esc(it.text)}</pre>
          <button class="btn btn-primary sm" data-insert-lyrics="${i}">Use these lyrics</button></article>`).join('') || '<p>No lyrics returned.</p>';
        $$('[data-insert-lyrics]').forEach((b) => (b.onclick = () => {
          const it = items[Number(b.dataset.insertLyrics)];
          const ta = lyricsTarget(target);
          if (ta) { ta.value = it.text; ta.dispatchEvent(new Event('input', { bubbles: true })); }
          const title = ta?.closest('form')?.querySelector('[name=title]');
          if (title && !title.value && it.title) { title.value = it.title; title.dispatchEvent(new Event('input', { bubbles: true })); }
          closeModal();
          toast('Lyrics inserted.', 'ok');
        }));
      } catch (e) {
        if (!$('#modal').hidden) $('#modal-body').innerHTML = `<p class="note warn">${esc(e.message)}</p>`;
      }
    },
    async import(form) {
      const p = collect(form);
      need(p.taskId, 'Paste a task ID.');
      const d = await api('/api/v1/generate/record-info', { query: { taskId: p.taskId } });
      const r = parseMusic(d);
      const label = r.tracks?.[0]?.title || 'Imported task';
      const t = addTask(p.taskId, 'music', label, { origin: 'Imported' });
      if (r.tracks?.length) upsertTracks(r.tracks, t);
      if (r.state === 'success') { t.state = 'success'; t.pct = 100; t.stage = 'Done'; save.tasks(); }
      toast(r.tracks?.length ? `Imported ${r.tracks.length} track(s).` : 'Task added — waiting for results.', 'ok');
      closeModal();
      if (S.view === 'library') renderView();
    },
    async settings(form) {
      const p = collect(form);
      S.settings.connection = p.connection || 'auto';
      S.settings.callbackUrl = p.callbackUrl || '';
      save.settings();
      closeModal();
      toast('Settings saved.', 'ok');
      refreshCredits();
    },
  };
  let lyricsTargetForm = null;
  function lyricsTarget(name) {
    const f = lyricsTargetForm && document.contains(lyricsTargetForm) ? lyricsTargetForm : null;
    return f ? $(`[name="${name}"]`, f) : $(`#view [name="${name}"]`);
  }

  // ---------------------------------------------------------------- player
  const audio = () => $('#audio');
  function queue() { return S.tracks.filter(playable); }
  function playTrack(id) {
    const t = findTrack(id);
    if (!t) return;
    const a = audio();
    if (S.playing === id) { a.paused ? a.play().catch(() => {}) : a.pause(); return; }
    S.playing = id;
    a.src = t.audioUrl || t.streamUrl;
    a.play().catch(() => toast('Couldn’t play this audio. The link may have expired — try “Recover audio”.', 'warn'));
    $('#player').hidden = false;
    document.documentElement.style.setProperty('--player-h', `${$('#player').offsetHeight + 16}px`);
    $('#pl-title').textContent = t.title;
    $('#pl-sub').textContent = t.tags || t.origin;
    $('#pl-art').src = t.imageUrl || 'data:image/gif;base64,R0lGODlhAQABAAAAACw=';
    $('#karaoke').hidden = true;
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({ title: t.title, artist: 'Wavecraft Studio', artwork: t.imageUrl ? [{ src: t.imageUrl }] : [] });
      navigator.mediaSession.setActionHandler('nexttrack', () => step(1));
      navigator.mediaSession.setActionHandler('previoustrack', () => step(-1));
    }
    syncPlayButtons();
  }
  function step(dir) {
    const q = queue();
    if (!q.length) return;
    const i = q.findIndex((t) => t.id === S.playing);
    playTrack(q[(i + dir + q.length) % q.length].id);
  }
  function syncPlayButtons() {
    const paused = audio().paused;
    $('#pl-play').textContent = paused ? '▶' : '⏸';
    $('#pl-play').setAttribute('aria-label', paused ? 'Play' : 'Pause');
    $$('[data-play]').forEach((b) => {
      const on = b.dataset.play === S.playing && !paused;
      if (b.classList.contains('play-over')) b.textContent = on ? '⏸' : '▶';
      b.closest('.art')?.classList.toggle('playing', b.dataset.play === S.playing);
    });
  }
  let lastWord = -1;
  function onTime() {
    const a = audio();
    const d = a.duration || findTrack(S.playing)?.duration || 0;
    $('#pl-cur').textContent = fmtTime(a.currentTime);
    $('#pl-dur').textContent = fmtTime(d);
    if (!seeking && d) $('#pl-range').value = Math.round((a.currentTime / d) * 1000);
    if (!$('#karaoke').hidden) {
      const t = findTrack(S.playing);
      if (!t?.aligned) return;
      let idx = -1;
      for (let i = 0; i < t.aligned.length; i++) if (t.aligned[i].s <= a.currentTime) idx = i; else break;
      if (idx !== lastWord) {
        lastWord = idx;
        $$('#karaoke-body .w').forEach((w) => {
          const i = Number(w.dataset.i);
          w.classList.toggle('now', i === idx);
          w.classList.toggle('past', i < idx);
        });
        $(`#karaoke-body .w[data-i="${idx}"]`)?.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }
    }
  }
  let seeking = false;

  // ---------------------------------------------------------------- misc modals
  function openSettings() {
    const masked = S.key ? `${S.key.slice(0, 4)}••••••••${S.key.slice(-4)}` : '';
    openModal('Settings', `<form data-form="settings" novalidate>
      <div class="field"><label class="label">API key</label><div class="row"><code style="flex:1;font-family:var(--mono)">${esc(masked)}</code>
        <button type="button" class="btn sm" data-action="change-key">Change key</button><button type="button" class="btn sm btn-danger" data-action="sign-out">Sign out</button></div>
        <p class="hint">Stored only in this browser. <a href="https://sunoapi.org/api-key" target="_blank" rel="noopener">Manage keys</a> · <a href="https://docs.sunoapi.org" target="_blank" rel="noopener">API docs</a></p></div>
      <div class="field"><label class="label">Theme</label>${segmented('_theme', [['light', '☀️ Light'], ['dark', '🌙 Dark'], ['system', '💻 System']], S.theme, { full: true })}</div>
      <div class="field"><label class="label">Connection</label>${segmented('connection', [['auto', 'Auto'], ['proxy', 'Netlify proxy'], ['direct', 'Direct']], S.settings.connection, { full: true })}
        <p class="hint">Auto uses the built-in Netlify proxy when hosted (avoids browser CORS limits) and calls SunoAPI directly when opened as a local file.</p></div>
      <div class="field"><label class="label">Callback URL <span class="opt">advanced</span></label><input type="url" name="callbackUrl" value="${esc(S.settings.callbackUrl)}" placeholder="${esc(callbackUrl())}">
        <p class="hint">SunoAPI requires one. The app polls for results itself, so the default acknowledgement endpoint is fine.</p></div>
      <hr class="divider">
      <div class="field"><label class="label">Local data</label><p class="hint" style="margin-top:0">${S.tracks.length} tracks · ${S.tasks.length} tasks · ${S.lyrics.length} lyric sets · ${S.personas.length} personas</p>
        <div class="row" style="flex-wrap:wrap"><button type="button" class="btn sm" data-action="export-data">⬇️ Export library (JSON)</button><button type="button" class="btn sm btn-danger" data-action="wipe-data">Clear library</button></div></div>
      <div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary">Save</button></div></form>`);
  }
  function openPersonas() {
    openModal('Personas', S.personas.length ? `<p class="hint" style="margin-top:0">Personas carry a track’s vocal character into new songs. Pick one in Create → Custom → Persona & length.</p>
      <div class="assets">${S.personas.map((p) => `<div class="asset"><div style="display:block"><b>${esc(p.name)}</b><div class="hint" style="margin:2px 0 0">${esc(p.description || '')}</div><code style="font-size:11px">${esc(p.id)}</code></div>
      <div><button class="btn sm" data-copy="${esc(p.id)}">Copy ID</button><button class="btn sm" data-use-persona="${esc(p.id)}">Use</button><button class="btn sm btn-danger" data-del-persona="${esc(p.id)}">✕</button></div></div>`).join('')}</div>`
      : `<div class="empty"><span class="big">🧬</span><h3>No personas yet</h3><p>Open any finished track in your Library and choose “Create persona”.</p></div>`);
  }
  function updatePersonaList() {
    $('#persona-list').innerHTML = S.personas.map((p) => `<option value="${esc(p.id)}">${esc(p.name)}</option>`).join('');
  }

  // ---------------------------------------------------------------- gate
  function showGate(msg) {
    $('#app').hidden = true;
    $('#gate').hidden = false;
    $('#gate-error').hidden = !msg;
    $('#gate-error').textContent = msg || '';
    setTimeout(() => $('#gate-key').focus(), 50);
  }
  function enterApp() {
    $('#gate').hidden = true;
    $('#app').hidden = false;
    updateLibCount();
    updatePersonaList();
    renderActivity();
    route();
    refreshCredits();
    if (S.tasks.some(isActive)) schedulePoll(1500);
  }
  function signOut() {
    keyStore.clear();
    S.key = null;
    audio().pause();
    closeModal();
    showGate();
  }

  $('#gate-reveal').onclick = () => {
    const i = $('#gate-key');
    i.type = i.type === 'password' ? 'text' : 'password';
    $('#gate-reveal').setAttribute('aria-label', i.type === 'password' ? 'Show key' : 'Hide key');
  };
  $('#gate-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const key = $('#gate-key').value.trim();
    if (!key) return;
    const btn = $('#gate-submit');
    $('#gate-error').hidden = true;
    await withBusy(btn, async () => {
      try {
        const c = await api('/api/v1/generate/credit', { key });
        S.credits = c;
      } catch (err) {
        if (err.code === 401 || err.code === 403) {
          $('#gate-error').textContent = 'That key was rejected by SunoAPI. Double-check it and try again.';
          $('#gate-error').hidden = false;
          return;
        }
        toast(`Couldn’t verify your key right now (${esc(err.message)}). Continuing anyway.`, 'warn');
      }
      S.key = key;
      keyStore.set(key, $('#gate-remember').checked);
      $('#gate-key').value = '';
      enterApp();
      toast('👋 Welcome to the studio! Start by describing a song.', 'ok');
    });
  });

  // ---------------------------------------------------------------- global events
  document.addEventListener('submit', async (e) => {
    const form = e.target.closest('[data-form]');
    if (!form || form.id === 'gate-form') return;
    e.preventDefault();
    const h = HANDLERS[form.dataset.form];
    if (!h) return;
    const btn = e.submitter || $('button[type=submit], button:not([type])', form);
    await withBusy(btn, async () => {
      try { await h(form); } catch (err) { handleErr(err); }
    });
  });

  document.addEventListener('input', (e) => {
    const el = e.target;
    if (el.matches('[name]') && el.closest('form')) syncCounters(el.closest('form'));
    if (el.type === 'range' && el.name) {
      const out = $(`[data-out="${el.name}"]`, el.closest('.field'));
      if (out) out.textContent = el.value + (out.dataset.unit || '');
    }
    if (el.matches('[data-range-input]')) updateRangeViz(el.closest('form'));
    if (el.matches('[data-lib-search]')) {
      S.lib.q = el.value;
      clearTimeout(el._t);
      el._t = setTimeout(() => {
        const pos = el.selectionStart;
        renderView();
        const n = $('[data-lib-search]');
        n.focus(); n.setSelectionRange(pos, pos);
      }, 200);
    }
  });

  document.addEventListener('change', async (e) => {
    const el = e.target;
    if (el.matches('[data-enable]')) {
      const f = el.closest('.field');
      const r = $(`[name="${el.dataset.enable}"]`, f);
      r.disabled = !el.checked;
      const out = $(`[data-out="${el.dataset.enable}"]`, f);
      out.textContent = el.checked ? r.value + (out.dataset.unit || '') : 'Auto';
    }
    if (el.matches('[data-toggle-vocals]')) {
      const box = $('[data-vocals]', el.closest('form'));
      if (box) box.hidden = el.checked;
      const aw = $('[name=audioWeight]', el.closest('form'));
      if (aw) aw.closest('.field').hidden = el.checked;
    }
    if (el.name === 'variety') { const d = $('[data-variety-desc]', el.closest('form')); if (d) d.textContent = VARIETY[Number(el.value)]; }
    if (el.name === '_op') updateRemixOp($('#view'));
    if (el.name === 'type' && el.closest('[data-form="stems"]')) $('[data-stem-name]', el.closest('form')).hidden = el.value !== 'split_stem_advanced';
    if (el.name === '_libfilter') { S.lib.filter = el.value; renderView(); }
    if (el.matches('[data-lib-sort]')) { S.lib.sort = el.value; renderView(); $('[data-lib-sort]').value = S.lib.sort; }
    if (el.name === '_theme') { S.theme = el.value; store.set('theme', S.theme); applyTheme(); }
    if (el.matches('[data-lib]') && el.value) setSource(el.closest('[data-source]'), el.value);
    if (el.matches('[data-file]') && el.files[0]) {
      const box = el.closest('[data-source]');
      await handleUpload(el.files[0], box, (url) => setSource(box, url));
      el.value = '';
    }
    if (el.matches('[data-ref-file]') && el.files[0]) {
      const row = el.closest('[data-refs]');
      await handleUpload(el.files[0], null, (url) => addRef(row, url, el.files[0]?.name));
      el.value = '';
    }
  });

  function addRef(row, url, name) {
    if (!/^https?:\/\//i.test(url)) return toast('Please use a full http(s) URL.', 'warn');
    const item = document.createElement('span');
    item.className = 'ref-item';
    item.dataset.url = url;
    item.innerHTML = `<span title="${esc(url)}">${esc(name || url)}</span><button type="button" aria-label="Remove">✕</button>`;
    item.querySelector('button').onclick = () => item.remove();
    $('.ref-list', row).appendChild(item);
  }

  document.addEventListener('click', async (e) => {
    const t = e.target.closest('button, a, [data-drop]');
    if (!t) return;
    const d = t.dataset;

    if (t.closest('#modal') && (d.close !== undefined) && t.matches('[data-close]')) return closeModal();
    if (d.themeSet) { S.theme = d.themeSet; store.set('theme', S.theme); applyTheme(); return; }
    if (d.mode) { S.prefs.createMode = d.mode; save.prefs(); renderView(); return; }
    if (d.play) { e.preventDefault(); playTrack(d.play); return; }
    if (d.open) { e.preventDefault(); toggleDrawer(false); openTrack(d.open); return; }
    if (d.fav) {
      const tr = findTrack(d.fav); tr.fav = !tr.fav; save.tracks();
      if (!$('#modal').hidden && modalTrackId === tr.id) openTrack(tr.id);
      if (S.view === 'library') renderView();
      return;
    }
    if (d.trackAction) { const tr = findTrack(modalTrackId); if (tr) trackActionForm(tr, d.trackAction); return; }
    if (d.copy !== undefined) { try { await navigator.clipboard.writeText(d.copy); toast('Copied to clipboard.', 'ok'); } catch { toast('Copy failed.', 'warn'); } return; }
    if (d.insert) { const ta = $('textarea', t.closest('.lyrics-field')); insertAtCursor(ta, d.insert); return; }
    if (d.addStyle) {
      const ta = $(`[name="${d.target}"]`, t.closest('form'));
      const cur = ta.value.trim().replace(/,\s*$/, '');
      ta.value = cur ? `${cur}, ${d.addStyle}` : d.addStyle;
      ta.dispatchEvent(new Event('input', { bubbles: true }));
      t.classList.add('on');
      return;
    }
    if (d.reshuffle) { t.parentElement.innerHTML = styleChips(d.reshuffle); return; }
    if (d.setPrompt) { const ta = $('[name=prompt]', t.closest('form')); ta.value = d.setPrompt; ta.dispatchEvent(new Event('input', { bubbles: true })); return; }
    if (d.useUrl !== undefined) {
      const box = t.closest('[data-source]');
      const u = $('[data-url]', box).value.trim();
      if (!/^https?:\/\//i.test(u)) return toast('Please paste a full http(s) URL.', 'warn');
      setSource(box, u); return;
    }
    if (d.srcClear !== undefined) { setSource(t.closest('[data-source]'), ''); return; }
    if (d.refAdd !== undefined) {
      const row = t.closest('[data-refs]');
      const inp = $('[data-ref-url]', row);
      if (inp.value.trim()) { addRef(row, inp.value.trim()); inp.value = ''; }
      return;
    }
    if (d.useLyrics) {
      const [id, i] = d.useLyrics.split(':');
      const it = S.lyrics.find((l) => l.id === id)?.items[Number(i)];
      if (!it) return;
      S._pendingLyrics = it.text; S._pendingTitle = it.title || '';
      S.prefs.createMode = 'custom'; save.prefs();
      if (S.view === 'create') renderView(); else go('create');
      toast('Lyrics loaded into the Custom creator — add a style and hit Create!', 'ok');
      return;
    }
    if (d.copyLyrics) {
      const [id, i] = d.copyLyrics.split(':');
      const it = S.lyrics.find((l) => l.id === id)?.items[Number(i)];
      try { await navigator.clipboard.writeText(it.text); toast('Lyrics copied.', 'ok'); } catch {}
      return;
    }
    if (d.removeTask) { S.tasks = S.tasks.filter((x) => x.id !== d.removeTask); save.tasks(); renderActivity(); refreshFeeds(); return; }
    if (d.retryPoll) { const x = S.tasks.find((y) => y.id === d.retryPoll); if (x) { x.state = 'pending'; x.error = ''; x.errors = 0; x.createdAt = Date.now(); save.tasks(); renderActivity(); schedulePoll(200); } return; }
    if (d.closeDrawer !== undefined) { toggleDrawer(false); return; }
    if (d.usePersona) {
      closeModal(); S.prefs.createMode = 'custom'; save.prefs(); go('create');
      setTimeout(() => {
        const inp = $('#view [name=personaId]');
        if (inp) { inp.value = d.usePersona; inp.closest('details').open = true; inp.scrollIntoView({ block: 'center' }); }
      }, 60);
      return;
    }
    if (d.delPersona) { S.personas = S.personas.filter((p) => p.id !== d.delPersona); save.personas(); updatePersonaList(); openPersonas(); return; }
    if (t.matches('[data-dl-midi]')) {
      const tr = findTrack(modalTrackId);
      const blob = buildMidi(tr.assets.midi.instruments);
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${tr.title.replace(/[^\w\- ]+/g, '').trim() || 'track'}.mid`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
      return;
    }

    switch (d.action) {
      case 'surprise': {
        const ta = $('[name=prompt]', t.closest('form'));
        ta.value = pick(SIMPLE_IDEAS); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); return;
      }
      case 'surprise-lyrics': {
        const ta = $('[name=prompt]', t.closest('form'));
        ta.value = pick(LYRIC_IDEAS); ta.dispatchEvent(new Event('input', { bubbles: true })); ta.focus(); return;
      }
      case 'boost-style': {
        const ta = $(`[name="${d.target}"]`, t.closest('form'));
        if (!ta.value.trim()) return toast('Type a few style words first, e.g. “dreamy pop, mysterious”.', 'warn');
        await withBusy(t, async () => {
          try {
            const r = await api('/api/v1/style/generate', { method: 'POST', body: { content: ta.value.trim() } });
            const out = typeof r === 'string' ? r : r?.result;
            if (!out) throw new Error('No boosted style returned.');
            ta.value = out.slice(0, Number(ta.maxLength) > 0 ? ta.maxLength : 1000);
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            toast('✨ Style boosted.', 'ok');
            refreshCredits();
          } catch (err) { handleErr(err); }
        });
        return;
      }
      case 'ai-lyrics':
        lyricsTargetForm = t.closest('form');
        openModal('Write lyrics with AI', `<form data-form="ai-lyrics" data-target="${esc(d.target)}" novalidate>
          <div class="field"><div class="label-row"><label class="label">What’s the song about?</label>${counter('prompt', 200)}</div>
          <textarea name="prompt" maxlength="200" rows="3" placeholder="${esc(pick(LYRIC_IDEAS))}"></textarea></div>
          <div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary">✍️ Write</button></div></form>`);
        return;
      case 'clear-lyrics':
        if (confirm('Clear all saved lyrics?')) { S.lyrics = []; save.lyrics(); renderView(); }
        return;
      case 'import-task':
        openModal('Import a task', `<form data-form="import" novalidate><p class="hint" style="margin-top:0">Have a task ID from another app or an earlier session? Pull its tracks into your library.</p>
          <div class="field"><label class="label">Task ID</label><input type="text" name="taskId" placeholder="e.g. 5c79…be8e" required></div>
          <div class="modal-foot"><button type="button" class="btn btn-ghost" data-close>Cancel</button><button class="btn btn-primary">Import</button></div></form>`);
        return;
      case 'personas': return openPersonas();
      case 'change-key': signOut(); return;
      case 'sign-out':
        if (confirm('Sign out and forget the API key on this device? Your library stays.')) signOut();
        return;
      case 'export-data': {
        const blob = new Blob([JSON.stringify({ tracks: S.tracks, lyrics: S.lyrics, personas: S.personas }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'wavecraft-library.json'; a.click();
        return;
      }
      case 'wipe-data':
        if (!confirm('Clear all tracks, tasks, lyrics and personas from this browser?')) return;
        S.tracks = []; S.tasks = []; S.lyrics = []; S.personas = [];
        Object.values(save).forEach((f) => f());
        updateLibCount(); updatePersonaList(); renderActivity(); closeModal(); renderView();
        toast('Library cleared.', 'ok');
        return;
    }
  });

  // modal backdrop & keys
  $('#modal').addEventListener('mousedown', (e) => { if (e.target.id === 'modal') closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!$('#modal').hidden) return closeModal();
      if ($('#drawer').classList.contains('open')) return toggleDrawer(false);
      if (!$('#karaoke').hidden) $('#karaoke').hidden = true;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      const f = e.target.closest?.('form[data-form]');
      if (f) { e.preventDefault(); f.requestSubmit(); }
    }
    const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName) || e.target.isContentEditable;
    if (e.code === 'Space' && !typing && S.playing && !e.target.closest('button')) { e.preventDefault(); playTrack(S.playing); }
  });

  // drag & drop uploads
  document.addEventListener('dragover', (e) => { const z = e.target.closest?.('[data-drop]'); if (z) { e.preventDefault(); z.classList.add('drag'); } });
  document.addEventListener('dragleave', (e) => e.target.closest?.('[data-drop]')?.classList.remove('drag'));
  document.addEventListener('drop', async (e) => {
    const z = e.target.closest?.('[data-drop]');
    if (!z) return;
    e.preventDefault();
    z.classList.remove('drag');
    const f = e.dataTransfer.files[0];
    if (!f) return;
    if (!f.type.startsWith('audio/')) return toast('Please drop an audio file.', 'warn');
    const box = z.closest('[data-source]');
    await handleUpload(f, box, (url) => setSource(box, url));
  });

  // chrome
  $('#activity-btn').onclick = () => toggleDrawer(true);
  $('#drawer-close').onclick = () => toggleDrawer(false);
  $('#scrim').onclick = () => toggleDrawer(false);
  $('#clear-done').onclick = () => { S.tasks = S.tasks.filter(isActive); save.tasks(); renderActivity(); refreshFeeds(); };
  $('#credits-btn').onclick = () => { $('#credits-val').textContent = '…'; refreshCredits(); };
  $('#settings-btn').onclick = openSettings;

  // player wiring
  const a = audio();
  a.volume = store.get('volume', 0.9);
  $('#pl-vol').value = a.volume;
  $('#pl-vol').oninput = (e) => { a.volume = Number(e.target.value); store.set('volume', a.volume); };
  $('#pl-play').onclick = () => S.playing && playTrack(S.playing);
  $('#pl-next').onclick = () => step(1);
  $('#pl-prev').onclick = () => (a.currentTime > 3 ? (a.currentTime = 0) : step(-1));
  $('#pl-open').onclick = () => S.playing && openTrack(S.playing);
  $('#pl-lyrics').onclick = () => {
    const t = findTrack(S.playing);
    if (!t) return;
    if (!$('#karaoke').hidden) { $('#karaoke').hidden = true; return; }
    loadKaraoke(t);
  };
  $('#karaoke-close').onclick = () => ($('#karaoke').hidden = true);
  $('#karaoke-body').addEventListener('click', (e) => { const w = e.target.closest('.w'); if (w) a.currentTime = Number(w.dataset.s) || 0; });
  const range = $('#pl-range');
  range.addEventListener('input', () => { seeking = true; const d = a.duration || 0; $('#pl-cur').textContent = fmtTime((range.value / 1000) * d); });
  range.addEventListener('change', () => { if (a.duration) a.currentTime = (range.value / 1000) * a.duration; seeking = false; });
  a.addEventListener('timeupdate', onTime);
  a.addEventListener('loadedmetadata', onTime);
  a.addEventListener('play', syncPlayButtons);
  a.addEventListener('pause', syncPlayButtons);
  a.addEventListener('ended', () => step(1));
  a.addEventListener('error', () => {
    const t = findTrack(S.playing);
    if (t && t.audioUrl && a.src !== t.streamUrl && t.streamUrl) { a.src = t.streamUrl; a.play().catch(() => {}); return; }
    if (t) toast(`Couldn’t load “${esc(t.title)}”. If it’s older than ~15 days, try “Recover audio”.`, 'warn');
  });
  addEventListener('resize', () => { if (!$('#player').hidden) document.documentElement.style.setProperty('--player-h', `${$('#player').offsetHeight + 16}px`); });

  // Re-render relative times in feeds periodically.
  setInterval(() => { if (!document.hidden && S.key) refreshFeeds(); }, 30000);
  document.addEventListener('visibilitychange', () => { if (!document.hidden && S.tasks.some(isActive)) schedulePoll(500); });
  addEventListener('hashchange', route);

  // ---------------------------------------------------------------- boot
  applyTheme();
  S.key = keyStore.get();
  if (S.key) enterApp(); else showGate();
})();
