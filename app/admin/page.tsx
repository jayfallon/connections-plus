"use client";

import { Card, CardBody, Button, Input, Select, SelectItem, DatePicker } from "@heroui/react";
import { useState } from "react";
import { format } from "date-fns";
import { parseDate } from "@internationalized/date";

interface WordGroup {
  category: string;
  difficulty: string;
  color: string;
  words: string[];
}

interface Level {
  id: number;
  redHerring: string;
  groups: WordGroup[];
}

interface GameConfig {
  levels: Level[];
  redHerrings: {
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  };
}

const difficulties = [
  { key: "yellow", label: "Yellow (Easiest)", color: "bg-amber-200" },
  { key: "green", label: "Green (Easy)", color: "bg-[#a0c35a]" },
  { key: "blue", label: "Blue (Medium)", color: "bg-[#b0c4ef]" },
  { key: "purple", label: "Purple (Hard)", color: "bg-[#ba81c5]" },
];

export default function AdminPage() {
  const [selectedDate, setSelectedDate] = useState(parseDate(format(new Date(), 'yyyy-MM-dd')));
  const [puzzleTitle, setPuzzleTitle] = useState("");
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevelGroups, setCurrentLevelGroups] = useState<WordGroup[]>([]);
  const [currentLevel, setCurrentLevel] = useState(0); // Start at 0 for red herring setup
  const [redHerringGroup, setRedHerringGroup] = useState<WordGroup | null>(null);
  const [redHerringWords, setRedHerringWords] = useState({
    word1: "",
    word2: "",
    word3: "",
    word4: ""
  });
  const [redHerringAssignments, setRedHerringAssignments] = useState<{
    level1: string;
    level2: string;
    level3: string;
  }>({
    level1: "",
    level2: "",
    level3: ""
  });

  const generateWordGroup = async () => {
    if (!currentCategory || !currentDifficulty || !currentTitle) return;

    setIsGenerating(true);
    try {
      const response = await fetch('/api/generate-words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category: currentCategory,
          difficulty: currentDifficulty,
        }),
      });

      const data = await response.json();
      
      if (data.words) {
        const difficultyInfo = difficulties.find(d => d.key === currentDifficulty);
        const newGroup: WordGroup = {
          category: currentTitle.toUpperCase(),
          difficulty: difficultyInfo?.label || currentDifficulty,
          color: difficultyInfo?.color || "bg-gray-400",
          words: data.words,
        };

        setCurrentLevelGroups(prev => [...prev, newGroup]);
        setCurrentCategory("");
        setCurrentDifficulty("");
        setCurrentTitle("");
      }
    } catch (error) {
      console.error('Error generating words:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getMaxGroupsForLevel = () => {
    return currentLevel === 4 ? 3 : 4;
  };

  const deleteGroup = (groupIndex: number) => {
    setCurrentLevelGroups(prev => prev.filter((_, index) => index !== groupIndex));
  };

  const createRedHerringGroup = () => {
    const words = [
      redHerringWords.word1,
      redHerringWords.word2,
      redHerringWords.word3,
      redHerringWords.word4
    ].filter(word => word.trim() !== "").map(word => word.trim().toUpperCase());

    if (words.length !== 4) {
      alert("Please enter exactly 4 red herring words");
      return;
    }

    const newRedHerringGroup: WordGroup = {
      category: "DOUBLE MEANINGS",
      difficulty: "Ultimate",
      color: "bg-red-500",
      words: words
    };
    
    setRedHerringGroup(newRedHerringGroup);
    setCurrentLevel(1); // Move to level 1 after creating red herring group
  };

  const assignRedHerring = (word: string, level: 1 | 2 | 3) => {
    setRedHerringAssignments(prev => ({
      ...prev,
      [`level${level}`]: prev[`level${level}` as keyof typeof prev] === word ? "" : word
    }));
  };

  const completeLevel = () => {
    if (currentLevel <= 3) {
      // For levels 1-3, check if red herring is assigned
      const currentRedHerring = redHerringAssignments[`level${currentLevel}` as keyof typeof redHerringAssignments];
      if (!currentRedHerring) {
        alert(`Please assign a red herring word to Level ${currentLevel}`);
        return;
      }
    }

    const maxGroups = getMaxGroupsForLevel();
    if (currentLevelGroups.length !== maxGroups) {
      alert(`Please create ${maxGroups} groups before completing level ${currentLevel}`);
      return;
    }

    const newLevel: Level = {
      id: currentLevel,
      redHerring: currentLevel <= 3 ? redHerringAssignments[`level${currentLevel}` as keyof typeof redHerringAssignments] : "",
      groups: [...currentLevelGroups, ...(currentLevel === 4 && redHerringGroup ? [redHerringGroup] : [])],
    };

    setLevels(prev => [...prev, newLevel]);
    setCurrentLevelGroups([]);
    setCurrentLevel(prev => prev + 1);
  };

  const exportConfig = async () => {
    if (!puzzleTitle.trim()) {
      alert("Please enter a title for your puzzle!");
      return;
    }

    // Create levels 1-4 using the new workflow
    const processedLevels = levels.map(level => {
      return {
        groups: level.groups.map(group => ({
          title: group.category,
          words: group.words,
          color: group.color
        })),
        redHerring: level.redHerring || ""
      };
    });

    const gameConfig = {
      levels: processedLevels,
      title: puzzleTitle.trim(),
      date: selectedDate.toString()
    };

    try {
      const response = await fetch('/api/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(gameConfig),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Puzzle "${puzzleTitle}" saved successfully for ${format(new Date(selectedDate.toString()), 'PPPP')}!`);
      } else {
        throw new Error('Failed to save puzzle');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save puzzle. Please try again.');
    }
  };

  const showConfigModal = (configString: string) => {
    // Create a modal-like display with the config
    const newWindow = window.open('', '_blank', 'width=800,height=600');
    if (newWindow) {
      newWindow.document.write(`
        <html>
          <head><title>Game Configuration</title></head>
          <body>
            <h2>Game Configuration (Copy this text)</h2>
            <textarea style="width: 100%; height: 80%; font-family: monospace;" readonly>${configString}</textarea>
            <br><br>
            <button onclick="navigator.clipboard.writeText(document.querySelector('textarea').value).then(() => alert('Copied!')).catch(() => alert('Manual copy required'))">Copy to Clipboard</button>
          </body>
        </html>
      `);
    } else {
      // Final fallback - just alert with instructions
      alert("Game config is in the console. Open dev tools (F12) and copy from there.");
    }
  };

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <a
              href="/calendar"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              ← Calendar View
            </a>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Play Game →
            </a>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-black">Connections Plus Admin</h1>
          <p className="text-gray-600">
            {currentLevel === 0 ? "First, set date and title, then create your red herring group" : `Generate word groups for Level ${currentLevel}`}
          </p>
        </div>

        {/* Date and Title Selection */}
        {currentLevel === 0 && (
          <Card className="mb-6">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold mb-4">Step 0: Puzzle Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <DatePicker
                    label="Puzzle Date"
                    value={selectedDate}
                    onChange={setSelectedDate}
                    description={format(new Date(selectedDate.toString()), 'PPPP')}
                  />
                </div>
                
                <div>
                  <Input
                    label="Puzzle Title"
                    placeholder="e.g., Monday Madness, Weekend Challenge"
                    value={puzzleTitle}
                    onChange={(e) => setPuzzleTitle(e.target.value)}
                    description="This will be shown to players"
                  />
                </div>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Red Herring Group Creation (Step 1) */}
        {currentLevel === 0 && puzzleTitle.trim() && (
          <Card className="mb-6">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold mb-4">Step 1: Create Red Herring Group</h2>
              <p className="text-gray-600 mb-6">
                Enter the 4 words that will form your "Double Meanings" group. These words will be distributed across levels 1-3.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <Input
                  label="Red Herring Word 1"
                  placeholder="e.g., ORANGE"
                  value={redHerringWords.word1}
                  onChange={(e) => setRedHerringWords(prev => ({...prev, word1: e.target.value}))}
                />
                <Input
                  label="Red Herring Word 2"
                  placeholder="e.g., SPRING"
                  value={redHerringWords.word2}
                  onChange={(e) => setRedHerringWords(prev => ({...prev, word2: e.target.value}))}
                />
                <Input
                  label="Red Herring Word 3"
                  placeholder="e.g., BANK"
                  value={redHerringWords.word3}
                  onChange={(e) => setRedHerringWords(prev => ({...prev, word3: e.target.value}))}
                />
                <Input
                  label="Red Herring Word 4"
                  placeholder="e.g., POUND"
                  value={redHerringWords.word4}
                  onChange={(e) => setRedHerringWords(prev => ({...prev, word4: e.target.value}))}
                />
              </div>

              <div className="text-center">
                <Button
                  onPress={createRedHerringGroup}
                  className="bg-red-600 text-white px-8"
                  isDisabled={!puzzleTitle.trim() || [redHerringWords.word1, redHerringWords.word2, redHerringWords.word3, redHerringWords.word4].filter(w => w.trim() !== "").length !== 4}
                >
                  Create "Double Meanings" Group
                </Button>
              </div>
            </CardBody>
          </Card>
        )}

        {/* Red Herring Assignment */}
        {currentLevel >= 1 && currentLevel <= 3 && redHerringGroup && (
          <Card className="mb-6">
            <CardBody className="p-6">
              <h3 className="text-xl font-bold mb-4">Step 2: Assign Red Herring for Level {currentLevel}</h3>
              <p className="text-gray-600 mb-4">Choose which red herring word appears in Level {currentLevel}:</p>
              
              <div className="flex justify-center gap-3 mb-6">
                {redHerringGroup.words.map((word) => (
                  <Button
                    key={word}
                    variant={redHerringAssignments[`level${currentLevel}` as keyof typeof redHerringAssignments] === word ? "solid" : "bordered"}
                    className={
                      redHerringAssignments[`level${currentLevel}` as keyof typeof redHerringAssignments] === word 
                        ? "bg-red-500 text-white" 
                        : "border-red-400 text-red-700 hover:bg-red-50"
                    }
                    onPress={() => assignRedHerring(word, currentLevel as 1 | 2 | 3)}
                  >
                    {word}
                  </Button>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {/* Current Level Builder */}
        {currentLevel >= 1 && (
          <Card className="mb-6">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {currentLevel === 4 ? "Building Level 4 (Final Level)" : `Building Level ${currentLevel}`}
              </h2>
            
            {/* Form for generating word groups */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <Input
                label="Group Title"
                placeholder="e.g., FISH, TOOLS"
                value={currentTitle}
                onChange={(e) => setCurrentTitle(e.target.value)}
              />
              
              <Input
                label="AI Category"
                placeholder="e.g., Ocean Fish, Kitchen Tools"
                value={currentCategory}
                onChange={(e) => setCurrentCategory(e.target.value)}
              />
              
              <Select
                label="Difficulty"
                placeholder="Choose difficulty"
                selectedKeys={currentDifficulty ? [currentDifficulty] : []}
                onSelectionChange={(keys) => setCurrentDifficulty(Array.from(keys)[0] as string)}
              >
                {difficulties.filter(difficulty => 
                  currentLevel === 4 ? difficulty.key !== "purple" : true
                ).map((difficulty) => (
                  <SelectItem key={difficulty.key}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Button
                onPress={generateWordGroup}
                isLoading={isGenerating}
                className="bg-blue-600 text-white"
                isDisabled={!currentCategory || !currentDifficulty || !currentTitle}
              >
                Generate Group
              </Button>
            </div>

            {/* Current level groups */}
            <div className="space-y-3 mb-6">
              {currentLevelGroups.map((group, index) => (
                <div
                  key={index}
                  className={`${group.color} rounded-lg p-4 text-center relative`}
                >
                  <Button
                    size="sm"
                    variant="light" 
                    className="absolute top-2 right-2 text-red-600 hover:bg-red-100"
                    onPress={() => deleteGroup(index)}
                  >
                    ✕
                  </Button>
                  <div className="font-bold text-lg text-black uppercase tracking-wide mb-2">
                    {group.category}
                  </div>
                  <div className="font-semibold text-black uppercase tracking-wide mb-3">
                    {group.words.join(", ")}
                  </div>
                </div>
              ))}

              {/* Red herring group for level 4 */}
              {currentLevel === 4 && redHerringGroup && (
                <div className={`${redHerringGroup.color} rounded-lg p-4 text-center relative border-2 border-red-600`}>
                  <Button
                    size="sm"
                    variant="light" 
                    className="absolute top-2 right-2 text-red-600 hover:bg-red-100"
                    onPress={() => setRedHerringGroup(null)}
                  >
                    ✕
                  </Button>
                  <div className="font-bold text-lg text-white uppercase tracking-wide mb-2">
                    {redHerringGroup.category}
                  </div>
                  <div className="font-semibold text-lg text-white uppercase tracking-wide">
                    {redHerringGroup.words.join(", ")}
                  </div>
                  <div className="text-sm text-red-100 mt-2">Red Herring Group</div>
                </div>
              )}
            </div>


            <div className="flex justify-between items-center">
              <div className="text-gray-600">
                <div>Groups completed: {currentLevelGroups.length + (currentLevel === 4 && redHerringGroup ? 1 : 0)}/{getMaxGroupsForLevel() + (currentLevel === 4 ? 1 : 0)}</div>
                {currentLevel <= 3 && (
                  <div className="text-sm mt-1">
                    Red herring assigned: {redHerringAssignments[`level${currentLevel}` as keyof typeof redHerringAssignments] || "None"}
                  </div>
                )}
                {currentLevel === 4 && (
                  <div className="text-sm mt-1">
                    Red herring group: {redHerringGroup ? "✓ Created" : "Not created"}
                  </div>
                )}
              </div>
              
              <Button
                onPress={completeLevel}
                className="bg-green-600 text-white"
                isDisabled={
                  currentLevelGroups.length !== getMaxGroupsForLevel() || 
                  (currentLevel <= 3 && !redHerringAssignments[`level${currentLevel}` as keyof typeof redHerringAssignments]) ||
                  (currentLevel === 4 && !redHerringGroup)
                }
              >
                Complete Level {currentLevel}
              </Button>
            </div>
          </CardBody>
        </Card>
        )}

        {/* Completed Levels */}
        {levels.length > 0 && (
          <Card className="mb-6">
            <CardBody className="p-6">
              <h2 className="text-2xl font-bold mb-4">Completed Levels</h2>
              
              <div className="space-y-4">
                {levels.map((level) => (
                  <div key={level.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold">Level {level.id}</h3>
                      {level.id <= 3 && (
                        <div className="text-sm text-gray-600">
                          Red herring: <span className="font-semibold text-red-600">
                            {level.redHerring || "Not assigned"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {level.groups.map((group, index) => {
                        return (
                          <div key={index} className={`${group.color} rounded p-2 text-center text-sm`}>
                            <div className="font-semibold text-black">{group.category}</div>
                            <div className="text-black">{group.words.join(", ")}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Red Herring Summary */}
              {redHerringGroup && (
                <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="font-bold text-red-800 mb-2">Red Herring Group (Level 4)</h3>
                  <div className="bg-red-500 rounded p-3 text-center">
                    <div className="font-bold text-white text-lg uppercase tracking-wide mb-2">
                      DOUBLE MEANINGS
                    </div>
                    <div className="font-semibold text-white uppercase tracking-wide">
                      {redHerringGroup.words.join(", ")}
                    </div>
                  </div>
                  <div className="text-sm text-red-700 mt-2">
                    Assignments: Level 1: {redHerringAssignments.level1 || "?"}, Level 2: {redHerringAssignments.level2 || "?"}, Level 3: {redHerringAssignments.level3 || "?"}
                  </div>
                </div>
              )}

              <Button
                onPress={exportConfig}
                className="mt-4 bg-purple-600 text-white"
                isDisabled={levels.length < 4 || !redHerringGroup}
              >
                Export Game Config
              </Button>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  );
}