// ─── SONG DATA ───────────────────────────────────────────────────
const SONGS = [
  { id: 1,  title: "Midnight Drive",      artist: "Luna Waves",     genre: "Lo-fi",     duration: "3:42", emoji: "🌙", color: ["#1a0533","#0d2153"], src: null },
  { id: 2,  title: "Neon Jungle",         artist: "CityNoise",      genre: "Electronic",duration: "4:10", emoji: "🎛️", color: ["#0d3320","#0a1a3b"], src: null },
  { id: 3,  title: "Golden Hour",         artist: "Amber Fields",   genre: "Indie",     duration: "3:55", emoji: "🌅", color: ["#3b1a00","#2a0d00"], src: null },
  { id: 4,  title: "Pulse",               artist: "BeatForge",      genre: "Electronic",duration: "4:28", emoji: "⚡", color: ["#1f0a2e","#0a1a3b"], src: null },
  { id: 5,  title: "Quiet Storm",         artist: "Rain Society",   genre: "Ambient",   duration: "5:02", emoji: "🌧️", color: ["#0d1a2e","#0a1433"], src: null },
  { id: 6,  title: "Sugar Rush",          artist: "PopStar99",      genre: "Pop",       duration: "3:15", emoji: "🍬", color: ["#2e0a1f","#1a0a33"], src: null },
  { id: 7,  title: "Desert Wind",         artist: "Nomad Sounds",   genre: "World",     duration: "4:44", emoji: "🏜️", color: ["#2e1a00","#1a0d00"], src: null },
  { id: 8,  title: "Late Night Code",     artist: "Syntax Error",   genre: "Lo-fi",     duration: "3:30", emoji: "💻", color: ["#0a1a2e","#061020"], src: null },
  { id: 9,  title: "Euphoria",            artist: "Dream State",    genre: "Pop",       duration: "3:50", emoji: "✨", color: ["#2a0a2e","#1a0533"], src: null },
  { id: 10, title: "Bass Drop",           artist: "BeatForge",      genre: "Electronic",duration: "4:00", emoji: "🔊", color: ["#1a0a33","#0d0d1a"], src: null },
  { id: 11, title: "Morning Mist",        artist: "Ambient Co.",    genre: "Ambient",   duration: "6:12", emoji: "🌫️", color: ["#0a2e2e","#061a1a"], src: null },
  { id: 12, title: "Heartstrings",        artist: "Amber Fields",   genre: "Indie",     duration: "3:58", emoji: "🎸", color: ["#2e0a0a","#1a0606"], src: null },
];

const CATEGORIES = ["All", "Lo-fi", "Electronic", "Indie", "Ambient", "Pop", "World"];

// ─── STATE ───────────────────────────────────────────────────────
let state = {
  currentIdx: -1,
  isPlaying: false,
  isShuffle: false,
  isRepeat: false,
  volume: 70,
  progress: 0,
  likedSongs: new Set(),
  playlists: [
    { id: "fav", name: "Favourites", songs: [] },
    { id: "chill", name: "Chill Mix", songs: [1, 5, 8, 11] },
  ],
  queue: [...SONGS.map(s => s.id)],
  activeCategory: "All",
  contextTargetId: null,
  activeView: "home",
  fakeTimer: null,
  fakeProgress: 0,
  fakeDuration: 220,
};

// ─── HELPERS ─────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
function getSong(id) { return SONGS.find(s => s.id === id); }
function getFilteredSongs(cat) {
  return cat === "All" ? SONGS : SONGS.filter(s => s.genre === cat);
}
function fmtTime(secs) {
  const m = Math.floor(secs / 60), s = Math.floor(secs % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function parseDuration(str) {
  const [m, s] = str.split(":").map(Number);
  return m * 60 + s;
}

// ─── RENDER TRACK CARD ────────────────────────────────────────────
function renderCard(song, container) {
  const card = document.createElement("div");
  card.className = "track-card" + (state.currentIdx === song.id ? " playing" : "");
  card.dataset.id = song.id;
  card.innerHTML = `
    <div class="track-art" style="background:linear-gradient(135deg,${song.color[0]},${song.color[1]})">
      <span>${song.emoji}</span>
      <div class="play-overlay">${state.currentIdx === song.id && state.isPlaying ? "⏸" : "▶"}</div>
    </div>
    <div class="track-name">${song.title}</div>
    <div class="track-artist">${song.artist}</div>
    <div style="display:flex;justify-content:space-between;align-items:center">
      <span class="track-genre">${song.genre}</span>
      <span class="track-duration">${song.duration}</span>
    </div>
    <button class="ctx-trigger" data-id="${song.id}">⋯</button>
  `;
  card.addEventListener("click", e => {
    if (e.target.closest(".ctx-trigger")) return;
    playSong(song.id);
  });
  card.querySelector(".ctx-trigger").addEventListener("click", e => {
    e.stopPropagation();
    openContextMenu(song.id, e);
  });
  container.appendChild(card);
}

// ─── RENDER ALL GRIDS ─────────────────────────────────────────────
function renderTrackGrid() {
  const grid = $("trackGrid");
  grid.innerHTML = "";
  SONGS.forEach(s => renderCard(s, grid));
}

function renderLibraryGrid(cat) {
  const grid = $("libraryGrid");
  grid.innerHTML = "";
  getFilteredSongs(cat).forEach(s => renderCard(s, grid));
}

function renderSearchResults(query) {
  const grid = $("searchResults");
  grid.innerHTML = "";
  const q = query.toLowerCase();
  const results = SONGS.filter(s =>
    s.title.toLowerCase().includes(q) ||
    s.artist.toLowerCase().includes(q) ||
    s.genre.toLowerCase().includes(q)
  );
  if (!results.length) {
    grid.innerHTML = `<div class="no-results">No results for "${query}"</div>`;
    return;
  }
  results.forEach(s => renderCard(s, grid));
}

// ─── CATEGORY TAGS ────────────────────────────────────────────────
function renderCategoryTags() {
  const wrap = $("categoryTags");
  wrap.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "cat-tag" + (state.activeCategory === cat ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      state.activeCategory = cat;
      renderCategoryTags();
      renderLibraryGrid(cat);
      renderCategoryFilter();
      switchView("library");
    });
    wrap.appendChild(btn);
  });
}

function renderCategoryFilter() {
  const wrap = $("categoryFilter");
  wrap.innerHTML = "";
  CATEGORIES.forEach(cat => {
    const btn = document.createElement("button");
    btn.className = "cat-filter-btn" + (state.activeCategory === cat ? " active" : "");
    btn.textContent = cat;
    btn.addEventListener("click", () => {
      state.activeCategory = cat;
      renderCategoryFilter();
      renderCategoryTags();
      renderLibraryGrid(cat);
    });
    wrap.appendChild(btn);
  });
}

// ─── PLAYLISTS ────────────────────────────────────────────────────
function renderPlaylistList() {
  const wrap = $("playlistList");
  wrap.innerHTML = "";
  state.playlists.forEach(pl => {
    const item = document.createElement("div");
    item.className = "playlist-item";
    item.innerHTML = `<span>♫ ${pl.name}</span><span style="font-size:.7rem;color:var(--muted)">${pl.songs.length}</span>`;
    item.addEventListener("click", () => {
      // Show playlist songs in library view
      switchView("library");
      const grid = $("libraryGrid");
      grid.innerHTML = "";
      $("categoryFilter").innerHTML = `<div style="color:var(--accent);font-family:Syne,sans-serif;font-weight:700;font-size:0.9rem">♫ ${pl.name}</div>`;
      if (!pl.songs.length) {
        grid.innerHTML = `<div class="no-results">Playlist is empty. Add songs with ⋯</div>`;
        return;
      }
      pl.songs.forEach(sid => {
        const s = getSong(sid);
        if (s) renderCard(s, grid);
      });
    });
    wrap.appendChild(item);
  });
}

// ─── QUEUE ────────────────────────────────────────────────────────
function renderQueue() {
  const list = $("queueList");
  list.innerHTML = "";
  state.queue.forEach((sid, i) => {
    const s = getSong(sid);
    if (!s) return;
    const item = document.createElement("div");
    item.className = "queue-item" + (state.currentIdx === sid ? " playing" : "");
    item.innerHTML = `
      <span class="queue-item-num">${state.currentIdx === sid ? '<span class="playing-dot"></span>' : i + 1}</span>
      <div class="queue-item-info">
        <div class="queue-item-name">${s.title}</div>
        <div class="queue-item-artist">${s.artist}</div>
      </div>
      <span style="font-size:.72rem;color:var(--muted)">${s.duration}</span>
    `;
    item.addEventListener("click", () => playSong(sid));
    list.appendChild(item);
  });
}

// ─── PLAY SONG ────────────────────────────────────────────────────
function playSong(id) {
  const song = getSong(id);
  if (!song) return;
  state.currentIdx = id;
  state.isPlaying = true;
  state.fakeProgress = 0;
  state.fakeDuration = parseDuration(song.duration);

  // Update player bar
  $("playerTitle").textContent = song.title;
  $("playerArtist").textContent = song.artist;
  $("playerThumb").textContent = song.emoji;
  $("playerThumb").style.background = `linear-gradient(135deg,${song.color[0]},${song.color[1]})`;
  $("playPauseBtn").textContent = "⏸";
  $("totalTime").textContent = song.duration;
  $("currentTime").textContent = "0:00";
  $("progressFill").style.width = "0%";

  // Featured
  $("featuredTitle").textContent = song.title;
  $("featuredArtist").textContent = song.artist;
  $("featuredBg").style.background = `linear-gradient(135deg,${song.color[0]},${song.color[1]})`;

  // Like btn
  $("likeBtn").textContent = state.likedSongs.has(id) ? "♥" : "♡";
  $("likeBtn").className = "like-btn" + (state.likedSongs.has(id) ? " liked" : "");

  startFakeProgress();
  refreshCards();
  renderQueue();
}

// ─── FAKE PROGRESS (no real audio URLs) ──────────────────────────
function startFakeProgress() {
  if (state.fakeTimer) clearInterval(state.fakeTimer);
  state.fakeTimer = setInterval(() => {
    if (!state.isPlaying) return;
    state.fakeProgress += 1;
    if (state.fakeProgress >= state.fakeDuration) {
      state.fakeProgress = 0;
      if (state.isRepeat) {
        // repeat same
      } else {
        nextTrack();
      }
      return;
    }
    const pct = (state.fakeProgress / state.fakeDuration) * 100;
    $("progressFill").style.width = pct + "%";
    $("progressThumb").style.left = pct + "%";
    $("currentTime").textContent = fmtTime(state.fakeProgress);
  }, 1000);
}

function togglePlayPause() {
  if (state.currentIdx === -1) {
    playSong(SONGS[0].id);
    return;
  }
  state.isPlaying = !state.isPlaying;
  $("playPauseBtn").textContent = state.isPlaying ? "⏸" : "▶";
  if (state.isPlaying) startFakeProgress();
}

function nextTrack() {
  const ids = state.isShuffle
    ? [SONGS[Math.floor(Math.random() * SONGS.length)].id]
    : (() => {
        const idx = state.queue.indexOf(state.currentIdx);
        return [state.queue[(idx + 1) % state.queue.length]];
      })();
  playSong(ids[0]);
}

function prevTrack() {
  if (state.fakeProgress > 5) {
    state.fakeProgress = 0;
    $("progressFill").style.width = "0%";
    $("currentTime").textContent = "0:00";
    return;
  }
  const idx = state.queue.indexOf(state.currentIdx);
  const prevId = state.queue[(idx - 1 + state.queue.length) % state.queue.length];
  playSong(prevId);
}

// ─── PROGRESS CLICK ───────────────────────────────────────────────
$("progressBar").addEventListener("click", e => {
  if (state.currentIdx === -1) return;
  const rect = e.currentTarget.getBoundingClientRect();
  const pct = (e.clientX - rect.left) / rect.width;
  state.fakeProgress = Math.floor(pct * state.fakeDuration);
  $("progressFill").style.width = (pct * 100) + "%";
  $("currentTime").textContent = fmtTime(state.fakeProgress);
});

// ─── VOLUME ───────────────────────────────────────────────────────
$("volumeSlider").addEventListener("input", e => {
  state.volume = +e.target.value;
  const icon = e.target.closest(".player-right").querySelector(".vol-icon");
  icon.textContent = state.volume === 0 ? "🔇" : state.volume < 50 ? "🔉" : "🔊";
});

// ─── SHUFFLE & REPEAT ─────────────────────────────────────────────
$("shuffleBtn").addEventListener("click", () => {
  state.isShuffle = !state.isShuffle;
  $("shuffleBtn").classList.toggle("active", state.isShuffle);
});
$("repeatBtn").addEventListener("click", () => {
  state.isRepeat = !state.isRepeat;
  $("repeatBtn").classList.toggle("active", state.isRepeat);
});

// ─── LIKE ─────────────────────────────────────────────────────────
$("likeBtn").addEventListener("click", () => {
  if (state.currentIdx === -1) return;
  if (state.likedSongs.has(state.currentIdx)) {
    state.likedSongs.delete(state.currentIdx);
    $("likeBtn").textContent = "♡";
    $("likeBtn").className = "like-btn";
    const pl = state.playlists.find(p => p.id === "fav");
    pl.songs = pl.songs.filter(s => s !== state.currentIdx);
  } else {
    state.likedSongs.add(state.currentIdx);
    $("likeBtn").textContent = "♥";
    $("likeBtn").className = "like-btn liked";
    const pl = state.playlists.find(p => p.id === "fav");
    if (!pl.songs.includes(state.currentIdx)) pl.songs.push(state.currentIdx);
  }
  renderPlaylistList();
});

// ─── PLAY / NEXT / PREV buttons ───────────────────────────────────
$("playPauseBtn").addEventListener("click", togglePlayPause);
$("nextBtn").addEventListener("click", nextTrack);
$("prevBtn").addEventListener("click", prevTrack);

// ─── QUEUE PANEL ──────────────────────────────────────────────────
$("queueBtn").addEventListener("click", () => {
  renderQueue();
  $("queuePanel").classList.toggle("open");
});
$("closeQueue").addEventListener("click", () => $("queuePanel").classList.remove("open"));

// ─── CONTEXT MENU ─────────────────────────────────────────────────
function openContextMenu(songId, e) {
  state.contextTargetId = songId;
  const menu = $("contextMenu");
  const items = $("ctxPlaylistItems");
  items.innerHTML = "";
  state.playlists.forEach(pl => {
    const has = pl.songs.includes(songId);
    const item = document.createElement("div");
    item.className = "ctx-item";
    item.textContent = (has ? "✓ " : "") + pl.name;
    item.style.color = has ? "var(--accent2)" : "";
    item.addEventListener("click", () => {
      if (has) pl.songs = pl.songs.filter(s => s !== songId);
      else pl.songs.push(songId);
      renderPlaylistList();
      closeContextMenu();
    });
    items.appendChild(item);
  });
  // Option to create new playlist inline
  const create = document.createElement("div");
  create.className = "ctx-item create-new";
  create.textContent = "+ New Playlist…";
  create.addEventListener("click", () => { closeContextMenu(); openModal(); });
  items.appendChild(create);

  menu.style.left = Math.min(e.clientX, window.innerWidth - 200) + "px";
  menu.style.top = Math.min(e.clientY, window.innerHeight - 200) + "px";
  menu.classList.add("open");
}
function closeContextMenu() { $("contextMenu").classList.remove("open"); }
document.addEventListener("click", e => {
  if (!e.target.closest(".context-menu") && !e.target.closest(".ctx-trigger")) closeContextMenu();
});

// ─── PLAYLIST MODAL ───────────────────────────────────────────────
function openModal() { $("modalOverlay").classList.add("open"); $("playlistNameInput").value = ""; $("playlistNameInput").focus(); }
function closeModal() { $("modalOverlay").classList.remove("open"); }
$("newPlaylistBtn").addEventListener("click", openModal);
$("cancelPlaylist").addEventListener("click", closeModal);
$("createPlaylist").addEventListener("click", () => {
  const name = $("playlistNameInput").value.trim();
  if (!name) return;
  const pl = { id: "pl_" + Date.now(), name, songs: state.contextTargetId ? [state.contextTargetId] : [] };
  state.playlists.push(pl);
  state.contextTargetId = null;
  renderPlaylistList();
  closeModal();
});
$("modalOverlay").addEventListener("click", e => { if (e.target === $("modalOverlay")) closeModal(); });
$("playlistNameInput").addEventListener("keydown", e => { if (e.key === "Enter") $("createPlaylist").click(); });

// ─── SEARCH ───────────────────────────────────────────────────────
$("homeSearch").addEventListener("input", e => {
  const q = e.target.value.trim();
  if (!q) { renderTrackGrid(); return; }
  const grid = $("trackGrid");
  grid.innerHTML = "";
  const results = SONGS.filter(s =>
    s.title.toLowerCase().includes(q.toLowerCase()) ||
    s.artist.toLowerCase().includes(q.toLowerCase()) ||
    s.genre.toLowerCase().includes(q.toLowerCase())
  );
  if (!results.length) { grid.innerHTML = `<div class="no-results">No results for "${q}"</div>`; return; }
  results.forEach(s => renderCard(s, grid));
});

$("searchInput").addEventListener("input", e => {
  const q = e.target.value.trim();
  if (q.length < 1) { $("searchResults").innerHTML = ""; return; }
  renderSearchResults(q);
});

// ─── VIEW SWITCHING ───────────────────────────────────────────────
function switchView(viewName) {
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
  $("view-" + viewName)?.classList.add("active");
  document.querySelector(`[data-view="${viewName}"]`)?.classList.add("active");
  state.activeView = viewName;
  if (viewName === "library") {
    renderCategoryFilter();
    renderLibraryGrid(state.activeCategory);
  }
}
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => switchView(btn.dataset.view));
});

// ─── REFRESH CARDS ────────────────────────────────────────────────
function refreshCards() {
  document.querySelectorAll(".track-card").forEach(card => {
    const id = +card.dataset.id;
    const isActive = id === state.currentIdx;
    card.classList.toggle("playing", isActive);
    const overlay = card.querySelector(".play-overlay");
    if (overlay) overlay.textContent = isActive && state.isPlaying ? "⏸" : "▶";
  });
}

// ─── KEYBOARD SHORTCUTS ───────────────────────────────────────────
document.addEventListener("keydown", e => {
  if (e.target.tagName === "INPUT") return;
  if (e.code === "Space") { e.preventDefault(); togglePlayPause(); }
  if (e.code === "ArrowRight") nextTrack();
  if (e.code === "ArrowLeft") prevTrack();
});

// ─── INIT ─────────────────────────────────────────────────────────
function init() {
  renderTrackGrid();
  renderCategoryTags();
  renderCategoryFilter();
  renderPlaylistList();
  renderQueue();
  $("volumeSlider").value = state.volume;
}
init();
