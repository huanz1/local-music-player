// ===== Mini Player Window Script =====

// Bind mini player controls with main window data

const miniPlayBtn = document.getElementById('mini-play');
const miniPrevBtn = document.getElementById('mini-prev');
const miniNextBtn = document.getElementById('mini-next');
const miniCloseBtn = document.getElementById('mini-close');
const miniTitle = document.getElementById('mini-title');
const miniArtist = document.getElementById('mini-artist');
const miniCover = document.getElementById('mini-cover');

miniPlayBtn.addEventListener('click', () => {
  window.electronAPI.storeSet('_mini_action', 'play-pause');
});

miniPrevBtn.addEventListener('click', () => {
  window.electronAPI.storeSet('_mini_action', 'previous');
});

miniNextBtn.addEventListener('click', () => {
  window.electronAPI.storeSet('_mini_action', 'next');
});

miniCloseBtn.addEventListener('click', () => {
  window.electronAPI.closeMiniPlayer();
});

// Receive state updates from main window
window.electronAPI.onStateUpdate((data) => {
  if (data.title) miniTitle.textContent = data.title;
  if (data.artist) miniArtist.textContent = data.artist;
  if (data.isPlaying !== undefined) {
    miniPlayBtn.textContent = data.isPlaying ? '⏸️' : '▶️';
  }
  if (data.cover) {
    miniCover.textContent = '🖼️';
  } else {
    miniCover.textContent = '🎵';
  }
});

// Poll for actions from main window
setInterval(async () => {
  const action = await window.electronAPI.storeGet('_mini_action');
  if (action) {
    await window.electronAPI.storeSet('_mini_action', null);
    // The main window actually handles the playback
    // We just clear the flag
  }
}, 500);