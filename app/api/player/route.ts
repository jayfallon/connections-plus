import { NextRequest, NextResponse } from 'next/server';
import { getPlayerProgress } from '@/lib/redis';

export async function GET(request: NextRequest) {
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

    const progress = await getPlayerProgress(playerId, gameId);

    return NextResponse.json({
      progress: progress || null
    });

  } catch (error) {
    console.error('Error fetching player status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player status' },
      { status: 500 }
    );
  }
}