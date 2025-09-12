import { NextRequest, NextResponse } from 'next/server';
import { getGameConfig, getTodayGameId, savePlayerProgress, getPlayerProgress, PlayerProgress } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const gameId = getTodayGameId();
    const gameConfig = await getGameConfig(gameId);
    
    if (!gameConfig) {
      return NextResponse.json(
        { error: 'No game available for today' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      gameId: gameConfig.id,
      date: gameConfig.date,
      title: gameConfig.title || "Daily Puzzle",
      levels: gameConfig.levels
    });

  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { playerId, gameId, currentLevel, completedGroups, mistakes, completed, perfect } = await request.json();

    if (!playerId || !gameId) {
      return NextResponse.json(
        { error: 'Player ID and Game ID are required' },
        { status: 400 }
      );
    }

    const existingProgress = await getPlayerProgress(playerId, gameId);
    
    if (existingProgress?.completed) {
      return NextResponse.json(
        { error: 'Game already completed for today' },
        { status: 400 }
      );
    }

    const progress: PlayerProgress = {
      playerId,
      gameId,
      currentLevel: currentLevel || 1,
      completedGroups: completedGroups || [],
      mistakes: mistakes || 0,
      startTime: existingProgress?.startTime || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      completed: completed || false,
      perfect: perfect || false
    };

    await savePlayerProgress(progress);

    return NextResponse.json({
      success: true,
      progress
    });

  } catch (error) {
    console.error('Error saving player progress:', error);
    return NextResponse.json(
      { error: 'Failed to save progress' },
      { status: 500 }
    );
  }
}