"use client";

import { Card, CardBody, Button } from "@heroui/react";
import { useState, useEffect } from "react";

const gameConfig = {
  levels: [
    {
      id: 1,
      redHerring: "PARKER",
      groups: {
        group1: {
          words: ["PETER", "JOHN", "MATTHEW", "ANDREW"],
          color: "bg-yellow-400",
          difficulty: "Yellow",
          category: "APOSTLES",
        },
        group2: {
          words: ["HEART", "STAR", "CIRCLE", "SQUARE"],
          color: "bg-green-400",
          difficulty: "Green",
          category: "SYMBOLS NOT CROSS",
        },
        group3: {
          words: ["PERIWINKLE", "MAIZE", "CERULEAN", "THISTLE"],
          color: "bg-blue-400",
          difficulty: "Blue",
          category: "CRAYONS",
        },
        group4: {
          words: ["VIZSLA", "KOMONDOR", "XOLO", "KUVASZ"],
          color: "bg-purple-400",
          difficulty: "Purple",
          category: "DOG BREEDS",
        },
      },
    },
    {
      id: 2,
      redHerring: "MONTBLANC",
      groups: {
        group1: {
          words: ["EVEREST", "DENALI", "KILIMANJARO", "FUJI"],
          color: "bg-yellow-400",
          difficulty: "Yellow",
          category: "MOUNTAIN NAMES",
        },
        group2: {
          words: ["NILE", "THAMES", "DANUBE", "VOLGA"],
          color: "bg-green-400",
          difficulty: "Green",
          category: "RIVER NAMES",
        },
        group3: {
          words: ["DUNGENESS", "HERMIT", "FIDDLER", "HORSESHOE"],
          color: "bg-blue-400",
          difficulty: "Blue",
          category: "CRAB TYPES",
        },
        group4: {
          words: ["HONSHU", "KYUSHU", "SHIKOKU", "HOKKAIDO"],
          color: "bg-purple-400",
          difficulty: "Purple",
          category: "JAPANESE ISLANDS",
        },
      },
    },
    {
      id: 3,
      redHerring: "PARKER",
      groups: {
        group1: {
          words: ["BELLHOP", "CONCIERGE", "DOORMAN", "HOUSEKEEPER"],
          color: "bg-yellow-400",
          difficulty: "Yellow",
          category: "HOSPITALITY JOBS",
        },
        group2: {
          words: ["MIDWIFE", "MATRON", "PEDIATRIC", "HOSPICE"],
          color: "bg-green-400",
          difficulty: "Green",
          category: "NURSING JOBS",
        },
        group3: {
          words: ["KARATE", "JUDO", "SUMO", "KENDO"],
          color: "bg-blue-400",
          difficulty: "Blue",
          category: "COMBAT SPORTS",
        },
        group4: {
          words: ["PIERCE", "GRANT", "BUSH", "POLK"],
          color: "bg-purple-400",
          difficulty: "Purple",
          category: "PRESIDENT'S LAST NAMES",
        },
      },
    },
    {
      id: 4,
      redHerring: "",
      groups: {
        group1: {
          words: ["OGUNQUIT", "WELLS", "POPHAM", "HIGGINS"],
          color: "bg-yellow-400",
          difficulty: "Yellow",
          category: "MAINE BEACHES",
        },
        group2: {
          words: ["KORMA", "VINDALOO", "TIKKA", "MADRAS"],
          color: "bg-green-400",
          difficulty: "Green",
          category: "CURRY NAMES",
        },
        group3: {
          words: ["RATATOUILLE", "CASSOULET", "BOUILLABAISSE", "QUICHE"],
          color: "bg-blue-400",
          difficulty: "Blue",
          category: "FRENCH DISHES",
        },
        group4: {
          words: ["MONTBLANC", "CARAN D'ACHE", "PARKER", "CROSS"],
          color: "bg-red-500",
          difficulty: "Ultimate",
          category: "DOUBLE MEANINGS",
        },
      },
    },
  ],
};

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

  // Get current level configuration
  const getCurrentLevel = () =>
    gameConfig.levels.find((level) => level.id === currentLevel);
  const currentLevelConfig = getCurrentLevel();

  // Build current words array (level words + accumulated red herrings + current red herring)
  const getCurrentWords = () => {
    if (!currentLevelConfig) return [];

    const levelWords: string[] = [];
    Object.values(currentLevelConfig.groups).forEach((group) => {
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

  const submitGuess = () => {
    if (selectedWords.length !== 4 || !currentLevelConfig) return;

    // Check if selected words form a correct group
    const selectedSet = new Set(selectedWords);
    let correctGroup = null;

    for (const [groupName, groupData] of Object.entries(
      currentLevelConfig.groups
    )) {
      const groupSet = new Set(groupData.words);
      if (
        selectedSet.size === groupSet.size &&
        [...selectedSet].every((word) => groupSet.has(word))
      ) {
        correctGroup = groupName;
        break;
      }
    }

    if (correctGroup) {
      // Correct guess
      const newSolvedGroups = [...solvedGroups, correctGroup];
      setSolvedGroups(newSolvedGroups);
      setSelectedWords([]);

      const groupData =
        currentLevelConfig.groups[
          correctGroup as keyof typeof currentLevelConfig.groups
        ];
      setFeedback(
        `Correct! You found the ${groupData?.category || correctGroup} group!`
      );

      // Check for level completion
      const totalGroupsInLevel = Object.keys(currentLevelConfig.groups).length;
      if (newSolvedGroups.length === totalGroupsInLevel) {
        setGameComplete(true);

        // Level-specific completion logic
        if (currentLevel === 4) {
          // Final level completed
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
    }

    // Clear feedback after 2 seconds
    setTimeout(() => setFeedback(""), 2000);
  };

  // Filter out words that are already solved
  const getSolvedWords = () => {
    if (!currentLevelConfig) return new Set();

    const solvedWords = new Set();
    solvedGroups.forEach((groupName) => {
      const group =
        currentLevelConfig.groups[
          groupName as keyof typeof currentLevelConfig.groups
        ];
      if (group) {
        group.words.forEach((word) => solvedWords.add(word));
      }
    });
    return solvedWords;
  };

  const solvedWords = getSolvedWords();
  const remainingWords = shuffledWords.filter((word) => !solvedWords.has(word));

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          {/* Level indicator */}
          <div className="mb-4 flex justify-between items-center">
            <span className="text-lg text-gray-600">
              Level {currentLevel} of 4
            </span>
            <a
              href="/admin"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Admin Panel
            </a>
          </div>

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
            {solvedGroups.map((groupName) => {
              const group =
                currentLevelConfig.groups[
                  groupName as keyof typeof currentLevelConfig.groups
                ];
              if (!group) return null;

              return (
                <div
                  key={groupName}
                  className={`${group.color} rounded-lg p-6 text-center`}
                >
                  <div className="font-bold text-xl text-black uppercase tracking-wide mb-2">
                    {group.category}
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
            {/* Words in 4x4 grid, excluding the last word if it should be centered */}
            <div className="grid grid-cols-4 gap-3 mb-3">
              {remainingWords
                .slice(
                  0,
                  remainingWords.length > 16 ||
                    (remainingWords.length % 4 === 1 &&
                      remainingWords.length > 1)
                    ? remainingWords.length - 1
                    : remainingWords.length
                )
                .map((word, index) => (
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

            {/* Last word centered at bottom when appropriate */}
            {(remainingWords.length > 16 ||
              (remainingWords.length % 4 === 1 &&
                remainingWords.length > 1)) && (
              <div className="flex justify-center">
                <Card
                  isPressable
                  onPress={() =>
                    handleWordClick(remainingWords[remainingWords.length - 1])
                  }
                  className={`aspect-[5/4] transition-all cursor-pointer w-full max-w-[calc(25%-0.75rem)] ${
                    selectedWords.includes(
                      remainingWords[remainingWords.length - 1]
                    )
                      ? "bg-gray-700 shadow-inner"
                      : "bg-gray-200 hover:bg-gray-300 shadow-sm"
                  }`}
                  radius="lg"
                >
                  <CardBody className="flex items-center justify-center p-4">
                    <span
                      className={`text-center font-bold text-sm md:text-base lg:text-lg uppercase tracking-wide leading-none ${
                        selectedWords.includes(
                          remainingWords[remainingWords.length - 1]
                        )
                          ? "text-white"
                          : "text-black"
                      }`}
                    >
                      {remainingWords[remainingWords.length - 1]}
                    </span>
                  </CardBody>
                </Card>
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
