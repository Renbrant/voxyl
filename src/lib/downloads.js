// Manages downloaded episodes in localStorage
const KEY = 'voxyl_downloads';

export function getDownloads() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveDownload(episode) {
  const downloads = getDownloads();
  if (downloads.some(d => d.audioUrl === episode.audioUrl)) return;
  downloads.unshift(episode);
  localStorage.setItem(KEY, JSON.stringify(downloads));
}

export function removeDownload(audioUrl) {
  const downloads = getDownloads().filter(d => d.audioUrl !== audioUrl);
  localStorage.setItem(KEY, JSON.stringify(downloads));
}

export function isDownloaded(audioUrl) {
  return getDownloads().some(d => d.audioUrl === audioUrl);
}