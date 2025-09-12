import { NextRequest, NextResponse } from 'next/server';
import { saveGameConfig, getTodayGameId, GameConfig } from '@/lib/redis';

export async function POST(request: NextRequest) {
  try {
    const gameData = await request.json();

    if (!gameData || !gameData.levels || !gameData.title || !gameData.date) {
      return NextResponse.json(
        { error: 'Invalid game config format - missing required fields' },
        { status: 400 }
      );
    }

    const gameConfig: GameConfig = {
      id: gameData.date,
      date: gameData.date,
      title: gameData.title,
      levels: gameData.levels
    };

    await saveGameConfig(gameConfig);

    return NextResponse.json({
      success: true,
      gameId: gameData.date,
      date: gameData.date,
      title: gameData.title
    });

  } catch (error) {
    console.error('Error saving game config:', error);
    return NextResponse.json(
      { error: 'Failed to save game config' },
      { status: 500 }
    );
  }
}