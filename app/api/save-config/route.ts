import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';

export async function POST(request: NextRequest) {
  try {
    const gameConfig = await request.json();

    if (!gameConfig || !gameConfig.levels) {
      return NextResponse.json(
        { error: 'Invalid game config format' },
        { status: 400 }
      );
    }

    // Generate filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `game-config-${timestamp}.json`;
    const filepath = join(process.cwd(), 'public', 'configs', filename);

    // Save the config file
    await writeFile(filepath, JSON.stringify(gameConfig, null, 2), 'utf8');

    return NextResponse.json({
      success: true,
      filename,
      path: `/configs/${filename}`
    });

  } catch (error) {
    console.error('Error saving game config:', error);
    return NextResponse.json(
      { error: 'Failed to save game config' },
      { status: 500 }
    );
  }
}