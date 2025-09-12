import { NextRequest, NextResponse } from 'next/server';
import { getGamesByMonth } from '@/lib/redis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');
    const month = searchParams.get('month');

    if (!year || !month) {
      return NextResponse.json(
        { error: 'Year and month parameters are required' },
        { status: 400 }
      );
    }

    const yearNum = parseInt(year);
    const monthNum = parseInt(month);

    if (isNaN(yearNum) || isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
      return NextResponse.json(
        { error: 'Invalid year or month values' },
        { status: 400 }
      );
    }

    const games = await getGamesByMonth(yearNum, monthNum);

    return NextResponse.json({
      success: true,
      games,
      year: yearNum,
      month: monthNum
    });

  } catch (error) {
    console.error('Error fetching games for month:', error);
    return NextResponse.json(
      { error: 'Failed to fetch games' },
      { status: 500 }
    );
  }
}