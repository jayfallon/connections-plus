import { NextRequest, NextResponse } from 'next/server';
import { getGameConfig, deleteGameConfig, saveGameConfig, GameConfig } from '@/lib/redis';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    const game = await getGameConfig(date);

    if (!game) {
      return NextResponse.json(
        { error: 'Game not found for this date' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      game
    });

  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;
    const gameData = await request.json();

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    if (!gameData || !gameData.levels || !gameData.title) {
      return NextResponse.json(
        { error: 'Invalid game data - missing required fields' },
        { status: 400 }
      );
    }

    const gameConfig: GameConfig = {
      id: date,
      date: date,
      title: gameData.title,
      levels: gameData.levels
    };

    await saveGameConfig(gameConfig);

    return NextResponse.json({
      success: true,
      game: gameConfig
    });

  } catch (error) {
    console.error('Error updating game:', error);
    return NextResponse.json(
      { error: 'Failed to update game' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ date: string }> }
) {
  try {
    const { date } = await params;

    if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return NextResponse.json(
        { error: 'Invalid date format. Use YYYY-MM-DD' },
        { status: 400 }
      );
    }

    // Check if game exists
    const existingGame = await getGameConfig(date);
    if (!existingGame) {
      return NextResponse.json(
        { error: 'Game not found for this date' },
        { status: 404 }
      );
    }

    await deleteGameConfig(date);

    return NextResponse.json({
      success: true,
      message: 'Game deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting game:', error);
    return NextResponse.json(
      { error: 'Failed to delete game' },
      { status: 500 }
    );
  }
}