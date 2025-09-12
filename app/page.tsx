"use client";

import { Card, CardBody, Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { getPlayerId, canPlayToday, markTodayAsPlayed } from "@/lib/player";

interface GameData {
  gameId: string;
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

export default function Home() {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [mistakesRemaining, setMistakesRemaining] = useState(4);
  const [solvedGroups, setSolvedGroups] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [gameComplete, setGameComplete] = useState(false);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [accumulatedRedHerrings, setAccumulatedRedHerrings] = useState<string[]>([]);
  const [allLevelsComplete, setAllLevelsComplete] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [canPlay, setCanPlay] = useState(true);
  const [loading, setLoading] = useState(true);

  // Initialize player and check if they can play
  useEffect(() => {
    const initializeGame = async () => {
      const id = getPlayerId();
      setPlayerId(id);

      // Check if player can play today
      const canPlayCheck = canPlayToday();
      
      if (!canPlayCheck) {
        setCanPlay(false);
        setLoading(false);
        return;
      }

      // Fetch today's game
      try {
        const response = await fetch('/api/game');
        if (response.ok) {
          const data = await response.json();
          setGameData(data);
        } else {
          setFeedback("No game available for today. Check back later!");
        }
      } catch (error) {
        setFeedback("Failed to load today's game");
      }
      
      setLoading(false);
    };

    initializeGame();
  }, []);

  // Get current level configuration
  const getCurrentLevel = () =>
    gameData?.levels.find((_, index) => index + 1 === currentLevel);
  const currentLevelConfig = getCurrentLevel();

  // Build current words array (level words + accumulated red herrings + current red herring)
  const getCurrentWords = () => {
    if (!currentLevelConfig) return [];

    const levelWords: string[] = [];
    currentLevelConfig.groups.forEach((group) => {
      levelWords.push(...group.words);
    });

    // For final level, red herrings are part of the groups, not separate
    if (currentLevel === 4) {
      return levelWords;
    }

    // For levels 1-3, add accumulated red herrings + current level's red herring
    return [
      ...levelWords,
      ...accumulatedRedHerrings,
      currentLevelConfig.redHerring,
    ];
  };

  // Shuffle words on level change
  useEffect(() => {
    const currentWords = getCurrentWords();
    const shuffled = [...currentWords];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledWords(shuffled);
    // Reset level-specific state
    setSelectedWords([]);
    setSolvedGroups([]);
    setGameComplete(false);
    setMistakesRemaining(4);
  }, [currentLevel, accumulatedRedHerrings]);

  const handleWordClick = (word: string) => {
    setSelectedWords((prev) =>
      prev.includes(word) ? prev.filter((w) => w !== word) : [...prev, word]
    );
  };

  const shuffleWords = () => {
    const currentWords = [...shuffledWords];
    for (let i = currentWords.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [currentWords[i], currentWords[j]] = [currentWords[j], currentWords[i]];
    }
    setShuffledWords(currentWords);
    setSelectedWords([]); // Clear selection when shuffling
  };

  const deselectAll = () => {
    setSelectedWords([]);
  };

  const startNewGame = () => {
    setCurrentLevel(1);
    setAccumulatedRedHerrings([]);
    setSelectedWords([]);
    setMistakesRemaining(4);
    setSolvedGroups([]);
    setFeedback("");
    setGameComplete(false);
    setAllLevelsComplete(false);
  };

  const advanceToNextLevel = () => {
    if (!currentLevelConfig) return;

    // Add current red herring to accumulated list (except for level 4)
    if (currentLevel < 4) {
      setAccumulatedRedHerrings((prev) => [
        ...prev,
        currentLevelConfig.redHerring,
      ]);
    }

    if (currentLevel < 4) {
      setCurrentLevel((prev) => prev + 1);
      setFeedback(
        `Level ${currentLevel} complete! Advancing to Level ${
          currentLevel + 1
        }...`
      );
    } else {
      setAllLevelsComplete(true);
      setFeedback(
        "🎉 INCREDIBLE! You discovered the secret red herring group!"
      );
    }
  };

  const submitGuess = async () => {
    if (selectedWords.length !== 4 || !currentLevelConfig) return;

    // Check if selected words form a correct group
    const selectedSet = new Set(selectedWords);
    let correctGroupIndex = -1;

    for (let i = 0; i < currentLevelConfig.groups.length; i++) {
      const group = currentLevelConfig.groups[i];
      const groupSet = new Set(group.words);
      if (
        selectedSet.size === groupSet.size &&
        [...selectedSet].every((word) => groupSet.has(word))
      ) {
        correctGroupIndex = i;
        break;
      }
    }

    if (correctGroupIndex !== -1) {
      // Correct guess
      const newSolvedGroups = [...solvedGroups, correctGroupIndex.toString()];
      setSolvedGroups(newSolvedGroups);
      setSelectedWords([]);

      const groupData = currentLevelConfig.groups[correctGroupIndex];
      setFeedback(
        `Correct! You found the ${groupData.title} group!`
      );

      // Save progress
      try {
        await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            gameId: gameData?.gameId,
            currentLevel,
            completedGroups: [...solvedGroups, selectedWords],
            mistakes: 4 - mistakesRemaining
          })
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }

      // Check for level completion
      const totalGroupsInLevel = currentLevelConfig.groups.length;
      if (newSolvedGroups.length === totalGroupsInLevel) {
        setGameComplete(true);

        // Level-specific completion logic
        if (currentLevel === 4) {
          // Final level completed - mark as played and save final progress
          markTodayAsPlayed();
          try {
            await fetch('/api/game', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                playerId,
                gameId: gameData?.gameId,
                currentLevel,
                completedGroups: [...solvedGroups, selectedWords],
                mistakes: 4 - mistakesRemaining,
                completed: true,
                perfect: mistakesRemaining === 4
              })
            });
          } catch (error) {
            console.error('Failed to save final progress:', error);
          }

          setTimeout(() => {
            advanceToNextLevel(); // This will set allLevelsComplete
          }, 1500);
        } else {
          // Regular level completed
          const mistakesMade = 4 - mistakesRemaining;
          let rating = "";
          switch (mistakesMade) {
            case 0:
              rating = "Perfect!";
              break;
            case 1:
              rating = "Great!";
              break;
            case 2:
              rating = "Okay";
              break;
            case 3:
              rating = "Not bad";
              break;
            case 4:
              rating = "Charity case";
              break;
            default:
              rating = "Complete!";
              break;
          }
          setFeedback(
            `${rating} Level ${currentLevel} complete with ${mistakesMade} mistake${
              mistakesMade !== 1 ? "s" : ""
            }!`
          );
        }
        return; // Don't clear feedback for win condition
      }
    } else {
      // Incorrect guess
      setMistakesRemaining((prev) => prev - 1);
      setSelectedWords([]);
      setFeedback("Not quite right. Try again!");

      // Save progress with mistake
      try {
        await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            playerId,
            gameId: gameData?.gameId,
            currentLevel,
            completedGroups: solvedGroups.map(groupId => {
              const idx = parseInt(groupId);
              return currentLevelConfig.groups[idx]?.words || [];
            }),
            mistakes: 4 - mistakesRemaining + 1
          })
        });
      } catch (error) {
        console.error('Failed to save progress:', error);
      }
    }

    // Clear feedback after 2 seconds
    setTimeout(() => setFeedback(""), 2000);
  };

  // Filter out words that are already solved
  const getSolvedWords = () => {
    if (!currentLevelConfig) return new Set();

    const solvedWords = new Set();
    solvedGroups.forEach((groupId) => {
      const groupIndex = parseInt(groupId);
      const group = currentLevelConfig.groups[groupIndex];
      if (group) {
        group.words.forEach((word) => solvedWords.add(word));
      }
    });
    return solvedWords;
  };

  const solvedWords = getSolvedWords();
  const remainingWords = shuffledWords.filter((word) => !solvedWords.has(word));

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-gray-600 mb-4">Loading today's puzzle...</div>
        </div>
      </div>
    );
  }

  // Can't play today
  if (!canPlay) {
    return (
      <div className="min-h-screen bg-white p-2 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-black">Come back tomorrow!</h1>
          <p className="text-lg text-gray-600">You've already completed today's puzzle.</p>
          <p className="text-md text-gray-500 mt-2">New puzzle available at midnight UTC.</p>
        </div>
      </div>
    );
  }

  // No game data
  if (!gameData) {
    return (
      <div className="min-h-screen bg-white p-2 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-black">No puzzle available</h1>
          <p className="text-lg text-gray-600">{feedback || "Check back later!"}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {/* Level indicator */}
          <div className="mb-4 flex justify-between items-center">
            <span className="text-lg text-gray-600">
              Level {currentLevel} of 4
            </span>
            <div className="flex gap-4">
              <a
                href="/calendar"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Calendar
              </a>
              <a
                href="/admin"
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                Admin Panel
              </a>
            </div>
          </div>

          {gameData?.title && (
            <div className="mb-2">
              <span className="text-lg text-blue-600 font-medium">{gameData.title}</span>
            </div>
          )}

          <h1 className="text-3xl font-bold mb-4 text-black">
            {currentLevel === 4
              ? "Final Challenge: Find the secret group!"
              : "Create four groups of four!"}
          </h1>
          {feedback && (
            <div
              className={`text-lg font-medium ${
                feedback.includes("Correct") ||
                feedback.includes("INCREDIBLE") ||
                feedback.includes("Level")
                  ? "text-green-600"
                  : "text-red-600"
              }`}
            >
              {feedback}
            </div>
          )}
        </div>

        {/* Solved groups */}
        {solvedGroups.length > 0 && currentLevelConfig && (
          <div className="space-y-3 mb-6">
            {solvedGroups.map((groupId) => {
              const groupIndex = parseInt(groupId);
              const group = currentLevelConfig.groups[groupIndex];
              if (!group) return null;

              return (
                <div
                  key={groupId}
                  className={`${group.color} rounded-lg p-6 text-center`}
                >
                  <div className="font-bold text-xl text-black uppercase tracking-wide mb-2">
                    {group.title}
                  </div>
                  <div className="font-semibold text-lg text-black uppercase tracking-wide">
                    {group.words.join(", ")}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {!gameComplete && (
          <div className="mb-6">
            {/* Always show 4x4 grid for first 16 words */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              {remainingWords.slice(0, Math.min(16, remainingWords.length)).map((word, index) => (
                <Card
                  key={index}
                  isPressable
                  onPress={() => handleWordClick(word)}
                  className={`aspect-[5/4] transition-all cursor-pointer ${
                    selectedWords.includes(word)
                      ? "bg-gray-700 shadow-inner"
                      : "bg-gray-200 hover:bg-gray-300 shadow-sm"
                  }`}
                  radius="lg"
                >
                  <CardBody className="flex items-center justify-center p-4">
                    <span
                      className={`text-center font-bold text-sm md:text-base lg:text-lg uppercase tracking-wide leading-none ${
                        selectedWords.includes(word)
                          ? "text-white"
                          : "text-black"
                      }`}
                    >
                      {word}
                    </span>
                  </CardBody>
                </Card>
              ))}
            </div>

            {/* Bottom centered row for additional words */}
            {remainingWords.length > 16 && (
              <div className="flex justify-center gap-3">
                {remainingWords.slice(16).map((word, index) => (
                  <Card
                    key={`extra-${index}`}
                    isPressable
                    onPress={() => handleWordClick(word)}
                    className={`aspect-[5/4] transition-all cursor-pointer w-full max-w-[calc(25%-0.75rem)] ${
                      selectedWords.includes(word)
                        ? "bg-gray-700 shadow-inner"
                        : "bg-gray-200 hover:bg-gray-300 shadow-sm"
                    }`}
                    radius="lg"
                  >
                    <CardBody className="flex items-center justify-center p-4">
                      <span
                        className={`text-center font-bold text-sm md:text-base lg:text-lg uppercase tracking-wide leading-none ${
                          selectedWords.includes(word)
                            ? "text-white"
                            : "text-black"
                        }`}
                      >
                        {word}
                      </span>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="text-center space-y-6">
          <div className="flex justify-center items-center gap-2">
            <span className="text-black font-medium">Mistakes remaining:</span>
            <div className="flex gap-1">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className={`w-4 h-4 rounded-full ${
                    i < mistakesRemaining ? "bg-gray-600" : "bg-gray-300"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-center gap-4">
            {allLevelsComplete ? (
              <Button
                onPress={startNewGame}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700"
              >
                Play Again
              </Button>
            ) : gameComplete && currentLevel < 4 ? (
              <Button
                onPress={advanceToNextLevel}
                className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-full hover:bg-blue-700"
              >
                Next Level
              </Button>
            ) : gameComplete && currentLevel === 4 ? (
              <div className="text-center">
                <div className="text-green-600 font-bold mb-4">
                  🎉 All Levels Complete! 🎉
                </div>
                <Button
                  onPress={startNewGame}
                  className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700"
                >
                  Play Again
                </Button>
              </div>
            ) : (
              <>
                <Button
                  onPress={shuffleWords}
                  variant="bordered"
                  className="px-8 py-3 border-2 border-black text-black font-semibold rounded-full bg-white hover:bg-gray-50"
                >
                  Shuffle
                </Button>
                <Button
                  onPress={deselectAll}
                  variant="bordered"
                  className="px-8 py-3 border-2 border-black text-black font-semibold rounded-full bg-white hover:bg-gray-50"
                >
                  Deselect All
                </Button>
                <Button
                  onPress={submitGuess}
                  isDisabled={selectedWords.length !== 4}
                  className={`px-8 py-3 font-semibold rounded-full ${
                    selectedWords.length === 4
                      ? "bg-black text-white hover:bg-gray-800"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  Submit
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
