"use client";

import { Card, CardBody, Button } from "@heroui/react";
import { useState, useEffect } from "react";

const words = [
  "BASS", "FLOUNDER", "SALMON", "TROUT",
  "APPLE", "BANANA", "CHERRY", "GRAPE", 
  "GUITAR", "PIANO", "VIOLIN", "DRUMS",
  "RED", "BLUE", "GREEN", "YELLOW",
  "ORANGE"
];

const groups = {
  fish: { words: ["BASS", "FLOUNDER", "SALMON", "TROUT"], color: "bg-yellow-400", difficulty: "Easiest", category: "FISH" },
  fruits: { words: ["APPLE", "BANANA", "CHERRY", "GRAPE"], color: "bg-green-400", difficulty: "Easy", category: "FRUITS" },
  instruments: { words: ["GUITAR", "PIANO", "VIOLIN", "DRUMS"], color: "bg-blue-400", difficulty: "Medium", category: "INSTRUMENTS" },
  colors: { words: ["RED", "BLUE", "GREEN", "YELLOW"], color: "bg-purple-400", difficulty: "Hard", category: "COLORS" }
};

export default function Home() {
  const [selectedWords, setSelectedWords] = useState<string[]>([]);
  const [mistakesRemaining, setMistakesRemaining] = useState(4);
  const [solvedGroups, setSolvedGroups] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string>("");
  const [shuffledWords, setShuffledWords] = useState<string[]>([]);
  const [gameComplete, setGameComplete] = useState(false);

  // Shuffle words on initial load
  useEffect(() => {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledWords(shuffled);
  }, []);

  const handleWordClick = (word: string) => {
    setSelectedWords(prev => 
      prev.includes(word) 
        ? prev.filter(w => w !== word)
        : [...prev, word]
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
    setSelectedWords([]);
    setMistakesRemaining(4);
    setSolvedGroups([]);
    setFeedback("");
    setGameComplete(false);
    // Re-shuffle words
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    setShuffledWords(shuffled);
  };

  const submitGuess = () => {
    if (selectedWords.length !== 4) return;

    // Check if selected words form a correct group
    const selectedSet = new Set(selectedWords);
    let correctGroup = null;

    for (const [groupName, groupData] of Object.entries(groups)) {
      const groupSet = new Set(groupData.words);
      if (selectedSet.size === groupSet.size && 
          [...selectedSet].every(word => groupSet.has(word))) {
        correctGroup = groupName;
        break;
      }
    }

    if (correctGroup) {
      // Correct guess
      const newSolvedGroups = [...solvedGroups, correctGroup];
      setSolvedGroups(newSolvedGroups);
      setSelectedWords([]);
      setFeedback(`Correct! You found the ${correctGroup} group!`);
      
      // Check for win condition
      if (newSolvedGroups.length === 4) {
        setGameComplete(true);
        const mistakesMade = 4 - mistakesRemaining;
        let rating = "";
        switch (mistakesMade) {
          case 0: rating = "Perfect!"; break;
          case 1: rating = "Great!"; break;
          case 2: rating = "Okay"; break;
          case 3: rating = "Not bad"; break;
          case 4: rating = "Charity case"; break;
          default: rating = "Complete!"; break;
        }
        setFeedback(`${rating} You solved all groups with ${mistakesMade} mistake${mistakesMade !== 1 ? 's' : ''}!`);
        return; // Don't clear feedback for win condition
      }
    } else {
      // Incorrect guess
      setMistakesRemaining(prev => prev - 1);
      setSelectedWords([]);
      setFeedback("Not quite right. Try again!");
    }

    // Clear feedback after 2 seconds
    setTimeout(() => setFeedback(""), 2000);
  };

  // Filter out words that are already solved
  const solvedWords = new Set();
  solvedGroups.forEach(groupName => {
    groups[groupName as keyof typeof groups].words.forEach(word => solvedWords.add(word));
  });
  const remainingWords = shuffledWords.filter(word => !solvedWords.has(word));

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 text-black">Create four groups of four!</h1>
          {feedback && (
            <div className={`text-lg font-medium ${
              feedback.includes("Correct") ? "text-green-600" : "text-red-600"
            }`}>
              {feedback}
            </div>
          )}
        </div>

        {/* Solved groups */}
        {solvedGroups.length > 0 && (
          <div className="space-y-3 mb-6">
            {solvedGroups.map((groupName) => {
              const group = groups[groupName as keyof typeof groups];
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
              {remainingWords.slice(0, 
                (remainingWords.length > 16 || (remainingWords.length % 4 === 1 && remainingWords.length > 1)) 
                  ? remainingWords.length - 1 
                  : remainingWords.length
              ).map((word, index) => (
                <Card 
                  key={index}
                  isPressable
                  onPress={() => handleWordClick(word)}
                  className={`aspect-[5/4] transition-all cursor-pointer ${
                    selectedWords.includes(word) 
                      ? 'bg-gray-700 shadow-inner' 
                      : 'bg-gray-200 hover:bg-gray-300 shadow-sm'
                  }`}
                  radius="lg"
                >
                  <CardBody className="flex items-center justify-center p-4">
                    <span className={`text-center font-bold text-lg uppercase tracking-wide leading-none ${
                      selectedWords.includes(word) ? 'text-white' : 'text-black'
                    }`}>
                      {word}
                    </span>
                  </CardBody>
                </Card>
              ))}
            </div>
            
            {/* Last word centered at bottom when appropriate */}
            {(remainingWords.length > 16 || (remainingWords.length % 4 === 1 && remainingWords.length > 1)) && (
              <div className="flex justify-center">
                <Card 
                  isPressable
                  onPress={() => handleWordClick(remainingWords[remainingWords.length - 1])}
                  className={`aspect-[5/4] transition-all cursor-pointer w-full max-w-[calc(25%-0.75rem)] ${
                    selectedWords.includes(remainingWords[remainingWords.length - 1]) 
                      ? 'bg-gray-700 shadow-inner' 
                      : 'bg-gray-200 hover:bg-gray-300 shadow-sm'
                  }`}
                  radius="lg"
                >
                  <CardBody className="flex items-center justify-center p-4">
                    <span className={`text-center font-bold text-lg uppercase tracking-wide leading-none ${
                      selectedWords.includes(remainingWords[remainingWords.length - 1]) ? 'text-white' : 'text-black'
                    }`}>
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
                    i < mistakesRemaining ? 'bg-gray-600' : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>
          
          <div className="flex justify-center gap-4">
            {gameComplete ? (
              <Button
                onPress={startNewGame}
                className="px-8 py-3 bg-green-600 text-white font-semibold rounded-full hover:bg-green-700"
              >
                New Game
              </Button>
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
                      ? 'bg-black text-white hover:bg-gray-800'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
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
