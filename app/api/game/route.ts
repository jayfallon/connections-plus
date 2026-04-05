import { NextRequest, NextResponse } from 'next/server';
import { getGameConfig, getTodayGameId, savePlayerProgress, getPlayerProgress, deletePlayerProgress, PlayerProgress } from '@/lib/redis';

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
    const { playerId, gameId, currentLevel, solvedGroups, accumulatedRedHerrings, mistakesRemaining, gameComplete, allLevelsComplete } = await request.json();

    if (!playerId || !gameId) {
      return NextResponse.json(
        { error: 'Player ID and Game ID are required' },
        { status: 400 }
      );
    }

    const existingProgress = await getPlayerProgress(playerId, gameId);

    const progress: PlayerProgress = {
      playerId,
      gameId,
      currentLevel: currentLevel || 1,
      solvedGroups: solvedGroups || [],
      accumulatedRedHerrings: accumulatedRedHerrings || [],
      mistakesRemaining: mistakesRemaining ?? 4,
      gameComplete: gameComplete || false,
      allLevelsComplete: allLevelsComplete || false,
      startTime: existingProgress?.startTime || new Date().toISOString(),
      lastActivity: new Date().toISOString(),
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

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');
    const gameId = searchParams.get('gameId');

    if (!playerId || !gameId) {
      return NextResponse.json(
        { error: 'Player ID and Game ID are required' },
        { status: 400 }
      );
    }

    await deletePlayerProgress(playerId, gameId);

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error deleting player progress:', error);
    return NextResponse.json(
      { error: 'Failed to delete progress' },
      { status: 500 }
    );
  }
}