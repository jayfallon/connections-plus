export function getPlayerId(): string {
  if (typeof window === 'undefined') return '';
  
  let playerId = localStorage.getItem('connections_player_id');
  
  if (!playerId) {
    playerId = `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('connections_player_id', playerId);
    
    document.cookie = `connections_player_id=${playerId}; path=/; max-age=${30 * 24 * 60 * 60}; SameSite=Lax`;
  }
  
  return playerId;
}

export function canPlayToday(): boolean {
  if (typeof window === 'undefined') return false;
  
  const today = new Date().toISOString().split('T')[0];
  const lastPlayDate = localStorage.getItem('connections_last_play_date');
  
  return lastPlayDate !== today;
}

export function markTodayAsPlayed(): void {
  if (typeof window === 'undefined') return;
  
  const today = new Date().toISOString().split('T')[0];
  localStorage.setItem('connections_last_play_date', today);
}