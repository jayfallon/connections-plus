import { NextRequest, NextResponse } from 'next/server';
import { getPlayerProgress, getTodayGameId } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const playerId = searchParams.get('playerId');

    if (!playerId) {
      return NextResponse.json(
        { error: 'Player ID is required' },
        { status: 400 }
      );
    }

    const gameId = getTodayGameId();
    const progress = await getPlayerProgress(playerId, gameId);

    if (!progress) {
      return NextResponse.json({
        canPlay: true,
        progress: null
      });
    }

    return NextResponse.json({
      canPlay: !progress.completed,
      progress
    });

  } catch (error) {
    console.error('Error fetching player status:', error);
    return NextResponse.json(
      { error: 'Failed to fetch player status' },
      { status: 500 }
    );
  }
}