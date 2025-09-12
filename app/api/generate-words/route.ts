import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { category, difficulty } = await request.json();

    if (!category || !difficulty) {
      return NextResponse.json(
        { error: 'Category and difficulty are required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.CLAUDE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'CLAUDE_API_KEY not configured' },
        { status: 500 }
      );
    }

    // Map difficulty levels to descriptions
    const difficultyMap = {
      yellow: "very straightforward and obvious",
      green: "moderately clear but requires some thought", 
      blue: "challenging and requires deeper knowledge",
      purple: "very difficult with subtle connections or wordplay"
    };

    const difficultyDescription = difficultyMap[difficulty as keyof typeof difficultyMap] || "moderate";

    const prompt = `You are helping create a word puzzle game similar to Connections. I need exactly 4 words that belong to the category "${category}".

Requirements:
- Exactly 4 words, no more, no less
- All words should be single words (no phrases or compound words with spaces)
- Words should be ${difficultyDescription} examples of the category
- Words should be UPPERCASE
- Return ONLY the 4 words separated by commas, nothing else

Category: ${category}
Difficulty level: ${difficulty} (${difficultyDescription})

Example response format: WORD1, WORD2, WORD3, WORD4`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 100,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Claude API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to generate words from Claude API' },
        { status: response.status }
      );
    }

    const data = await response.json();
    const generatedText = data.content[0]?.text || '';
    
    // Parse the response to extract words
    const words = generatedText
      .split(',')
      .map((word: string) => word.trim().toUpperCase())
      .filter((word: string) => word.length > 0)
      .slice(0, 4); // Ensure exactly 4 words

    if (words.length !== 4) {
      return NextResponse.json(
        { error: 'Failed to generate exactly 4 words' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      words,
      category,
      difficulty
    });

  } catch (error) {
    console.error('Error in generate-words API:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}