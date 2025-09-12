import { Redis } from 'redis';

let redis: Redis | null = null;

export async function getRedisClient(): Promise<Redis> {
  if (!redis) {
    redis = new Redis({
      host: process.env.REDIS_HOST!,
      port: parseInt(process.env.REDIS_PORT!),
      password: process.env.REDIS_PASSWORD!,
      retryDelayOnFailover: 100,
      maxRetriesPerRequest: 3,
      lazyConnect: true
    });

    await redis.connect();
  }

  return redis;
}

export async function closeRedisConnection() {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}

export interface GameConfig {
  id: string;
  date: string;
  title: string;
  levels: Array<{
    groups: Array<{
      title: string;
      words: string[];
      color: string;
    }>;
    redHerring: string;
  }>;
}

export interface GameSummary {
  date: string;
  title: string;
  id: string;
}

export interface PlayerProgress {
  playerId: string;
  gameId: string;
  currentLevel: number;
  completedGroups: string[][];
  mistakes: number;
  startTime: string;
  lastActivity: string;
  completed: boolean;
  perfect: boolean;
}

export async function saveGameConfig(gameConfig: GameConfig): Promise<void> {
  const client = await getRedisClient();
  await client.set(`game:${gameConfig.date}`, JSON.stringify(gameConfig));
}

export async function getGameConfig(date: string): Promise<GameConfig | null> {
  const client = await getRedisClient();
  const data = await client.get(`game:${date}`);
  return data ? JSON.parse(data) : null;
}

export async function savePlayerProgress(progress: PlayerProgress): Promise<void> {
  const client = await getRedisClient();
  await client.set(`player:${progress.playerId}:${progress.gameId}`, JSON.stringify(progress));
}

export async function getPlayerProgress(playerId: string, gameId: string): Promise<PlayerProgress | null> {
  const client = await getRedisClient();
  const data = await client.get(`player:${playerId}:${gameId}`);
  return data ? JSON.parse(data) : null;
}

export function getTodayGameId(): string {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  return today.toISOString().split('T')[0];
}

export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

export async function getGamesByMonth(year: number, month: number): Promise<GameSummary[]> {
  const client = await getRedisClient();
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0);
  
  const games: GameSummary[] = [];
  const current = new Date(startDate);
  
  while (current <= endDate) {
    const dateStr = current.toISOString().split('T')[0];
    const gameData = await client.get(`game:${dateStr}`);
    
    if (gameData) {
      const game: GameConfig = JSON.parse(gameData);
      games.push({
        date: game.date,
        title: game.title,
        id: game.id
      });
    }
    
    current.setDate(current.getDate() + 1);
  }
  
  return games;
}

export async function deleteGameConfig(date: string): Promise<void> {
  const client = await getRedisClient();
  await client.del(`game:${date}`);
}

export function formatGameDate(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00Z');
  return date.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
}