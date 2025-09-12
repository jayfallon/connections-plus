"use client";

import {
  Card,
  CardBody,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@heroui/react";
import { useState, useEffect } from "react";
import { getPlayerId, canPlayToday, markTodayAsPlayed } from "@/lib/player";
import { format } from "date-fns";
import "./shake-animation.css";

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
  const [accumulatedRedHerrings, setAccumulatedRedHerrings] = useState<
    string[]
  >([]);
  const [allLevelsComplete, setAllLevelsComplete] = useState(false);
  const [gameData, setGameData] = useState<GameData | null>(null);
  const [playerId, setPlayerId] = useState<string>("");
  const [canPlay, setCanPlay] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showIntro, setShowIntro] = useState(true);
  const [shakeWords, setShakeWords] = useState<string[]>([]);
  const [showFeedbackPopover, setShowFeedbackPopover] = useState(false);

  // Initialize player and check if they can play
  useEffect(() => {
    const initializePlayer = () => {
      const id = getPlayerId();
      setPlayerId(id);

      // Check if player can play today (bypass in development)
      const canPlayCheck = process.env.NODE_ENV === "development" ? true : canPlayToday();
      setCanPlay(canPlayCheck);

      setLoading(false);
    };

    initializePlayer();
  }, []);

  // Load game data when user clicks Play
  const loadGameData = async () => {
    setLoading(true);
    try {
      let data;

      // In development, try loading from local JSON file first
      if (process.env.NODE_ENV === "development") {
        try {
          const localResponse = await fetch("/configs/dev-game.json");
          if (localResponse.ok) {
            data = await localResponse.json();

            setGameData(data);
            setShowIntro(false);
            setLoading(false);
            return;
          }
        } catch (devError) {
          console.log("Local dev file not found, trying API...", devError);
        }
      }

      // Fallback to API
      const response = await fetch("/api/game");
      if (response.ok) {
        data = await response.json();
        setGameData(data);
        setShowIntro(false);
      } else {
        setFeedback("No game available for today. Check back later!");
      }
    } catch (error) {
      setFeedback("Failed to load today's game");
    }
    setLoading(false);
  };

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
    const allWords = [
      ...levelWords,
      ...accumulatedRedHerrings,
      currentLevelConfig.redHerring,
    ].filter((word) => word && word.trim() !== "");

    return allWords;
  };

  // Shuffle words on level change or game data load
  useEffect(() => {
    if (!gameData) return; // Don't run until game data is loaded

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
  }, [currentLevel, accumulatedRedHerrings, gameData]);

  const handleWordClick = (word: string) => {
    setSelectedWords((prev) => {
      if (prev.includes(word)) {
        // Deselect word if already selected
        return prev.filter((w) => w !== word);
      } else if (prev.length < 4) {
        // Only allow selection if less than 4 words selected
        return [...prev, word];
      } else {
        // Do nothing if 4 words already selected
        return prev;
      }
    });
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
      setFeedback(`Correct! You found the ${groupData.title} group!`);

      // Save progress
      try {
        await fetch("/api/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            gameId: gameData?.gameId,
            currentLevel,
            completedGroups: [...solvedGroups, selectedWords],
            mistakes: 4 - mistakesRemaining,
          }),
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
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
            await fetch("/api/game", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                playerId,
                gameId: gameData?.gameId,
                currentLevel,
                completedGroups: [...solvedGroups, selectedWords],
                mistakes: 4 - mistakesRemaining,
                completed: true,
                perfect: mistakesRemaining === 4,
              }),
            });
          } catch (error) {
            console.error("Failed to save final progress:", error);
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
      // Incorrect guess - trigger shake animation
      setShakeWords([...selectedWords]);
      setMistakesRemaining((prev) => prev - 1);
      setFeedback("Not quite right. Try again!");
      setShowFeedbackPopover(true);

      // Clear shake animation after it completes
      setTimeout(() => {
        setShakeWords([]);
        setSelectedWords([]);
      }, 1000);

      // Save progress with mistake
      try {
        await fetch("/api/game", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            playerId,
            gameId: gameData?.gameId,
            currentLevel,
            completedGroups: solvedGroups.map((groupId) => {
              const idx = parseInt(groupId);
              return currentLevelConfig.groups[idx]?.words || [];
            }),
            mistakes: 4 - mistakesRemaining + 1,
          }),
        });
      } catch (error) {
        console.error("Failed to save progress:", error);
      }
    }

    // Clear feedback after 2 seconds
    setTimeout(() => {
      setFeedback("");
      setShowFeedbackPopover(false);
    }, 2000);
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

  // Can't play today
  if (!canPlay) {
    return (
      <div className="min-h-screen bg-white p-2 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">
            Come back tomorrow!
          </h1>
          <p className="text-lg text-gray-600">
            You've already completed today's puzzle.
          </p>
          <p className="text-md text-gray-500 mt-2">
            New puzzle available at midnight UTC.
          </p>
        </div>
      </div>
    );
  }

  // Show intro screen first (before loading game data)
  if (showIntro) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#b0c4ef] to-[#88A6E7] flex items-center justify-center p-4">
        <div className="text-center text-slate-800 max-w-md w-full">
          {/* Game Icon */}
          <div className="mb-6">
            <div className="mx-auto w-20 h-20 bg-white bg-opacity-20 rounded-2xl flex items-center justify-center">
              <div className="grid grid-cols-3 gap-1">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-3 rounded-sm ${
                      i === 0 || i === 1 || i === 3 || i === 4
                        ? "bg-purple-300"
                        : i === 2 || i === 5
                        ? "bg-green-300"
                        : "bg-blue-300"
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* Game Title */}
          <h1 className="text-4xl font-bold mb-2">Connections Plus</h1>
          <div className="text-lg font-medium mb-8">
            Find the hidden connections
          </div>

          {/* Play Button */}
          <Button
            className="bg-gray-900 text-white hover:bg-gray-800 px-12 py-3 text-lg font-semibold rounded-full mb-8"
            size="lg"
            onPress={loadGameData}
            isLoading={loading}
          >
            {loading ? "Loading..." : "Play"}
          </Button>

          {/* Date Info */}
          <div className="text-sm opacity-90">
            <div className="font-medium">{format(new Date(), "PPPP")}</div>
            <div className="mt-1">Daily Puzzle</div>
          </div>

          {feedback && (
            <div className="mt-4 text-slate-800 text-sm">{feedback}</div>
          )}
        </div>
      </div>
    );
  }

  // Loading state (after intro is dismissed)
  if (loading) {
    return (
      <div className="min-h-screen bg-white p-2 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-gray-600 mb-4">
            Loading today's puzzle...
          </div>
        </div>
      </div>
    );
  }

  // No game data available (after trying to load)
  if (!gameData) {
    return (
      <div className="min-h-screen bg-white p-2 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4 text-slate-800">
            No puzzle available
          </h1>
          <p className="text-lg text-gray-600">
            {feedback || "Check back later!"}
          </p>
          <Button
            className="mt-4 bg-purple-600 text-white"
            onPress={() => setShowIntro(true)}
          >
            Back to Welcome
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-2">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {gameData?.title && (
            <div className="mb-2">
              <span className="text-lg text-blue-600 font-medium">
                {gameData.title}
              </span>
            </div>
          )}

          <h1 className="text-3xl font-bold mb-4 text-slate-800">
            {currentLevel === 4
              ? "Final Challenge: Find the secret group!"
              : "Create four groups of four!"}
          </h1>
          {/* Level indicator */}
          <div className="mb-4 flex justify-between items-center">
            <span className="text-lg text-gray-600 w-full text-center">
              Level {currentLevel} of 4
            </span>
          </div>
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
                  <div className="font-bold text-xl text-slate-800 uppercase tracking-wide mb-2">
                    {group.title}
                  </div>
                  <div className="font-semibold text-lg text-slate-800 uppercase tracking-wide">
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
              {remainingWords
                .slice(0, Math.min(16, remainingWords.length))
                .map((word, index) => (
                  <Card
                    key={index}
                    isPressable
                    onPress={() => handleWordClick(word)}
                    className={`aspect-[5/4] transition-all cursor-pointer ${
                      selectedWords.includes(word)
                        ? "bg-gray-700 shadow-inner"
                        : "bg-gray-200 hover:bg-gray-300 shadow-sm"
                    } ${shakeWords.includes(word) ? "animate-shake" : ""}`}
                    radius="lg"
                    style={{
                      animation: shakeWords.includes(word)
                        ? "shake 1s cubic-bezier(0.36, 0.07, 0.19, 0.97) both"
                        : undefined,
                    }}
                  >
                    <CardBody className="flex items-center justify-center p-4">
                      <span
                        className={`text-center font-bold text-sm md:text-base lg:text-lg uppercase tracking-wide leading-none ${
                          selectedWords.includes(word)
                            ? "text-white"
                            : "text-slate-800"
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
                    } ${shakeWords.includes(word) ? "animate-shake" : ""}`}
                    radius="lg"
                    style={{
                      animation: shakeWords.includes(word)
                        ? "shake 1s cubic-bezier(0.36, 0.07, 0.19, 0.97) both"
                        : undefined,
                    }}
                  >
                    <CardBody className="flex items-center justify-center p-4">
                      <span
                        className={`text-center font-bold text-sm md:text-base lg:text-lg uppercase tracking-wide leading-none ${
                          selectedWords.includes(word)
                            ? "text-white"
                            : "text-slate-800"
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
            <span className="text-slate-800 font-medium">
              Mistakes remaining:
            </span>
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
                  className="px-8 py-3 border-2 border-black text-slate-800 font-semibold rounded-full bg-white hover:bg-gray-50"
                >
                  Shuffle
                </Button>
                <Button
                  onPress={deselectAll}
                  variant="bordered"
                  className="px-8 py-3 border-2 border-black text-slate-800 font-semibold rounded-full bg-white hover:bg-gray-50"
                >
                  Deselect All
                </Button>
                <div className="relative">
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
                  
                  {/* Popover for feedback - only for wrong guesses */}
                  {showFeedbackPopover && feedback && feedback.includes("Not quite right") && (
                    <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-full mb-2 z-50">
                      <div className="bg-white border border-gray-300 rounded-lg shadow-lg px-3 py-2 relative">
                        <div className="text-sm font-semibold text-slate-800">
                          {feedback}
                        </div>
                        {/* Arrow pointing down */}
                        <div className="absolute top-full left-1/2 transform -translate-x-1/2">
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-300"></div>
                          <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-white absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-px"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
