"use client";

import { Card, CardBody, Button, Input, Select, SelectItem, DatePicker } from "@heroui/react";
import { useState, useEffect, Suspense } from "react";
import { format } from "date-fns";
import { parseDate } from "@internationalized/date";
import { useSearchParams } from "next/navigation";
import { Pencil, X, Save, XCircle } from "lucide-react";

interface WordGroup {
  category: string;
  difficulty: string;
  color: string;
  words: string[];
}

interface EditableGroup {
  groupIndex: number;
  editedWords: string[];
}

interface EditableCompletedGroup {
  levelId: number;
  groupIndex: number;
  editedWords: string[];
}

interface Level {
  id: number;
  redHerring: string;
  groups: WordGroup[];
}


const difficulties = [
  { key: "yellow", label: "Yellow (Easiest)", color: "bg-amber-200" },
  { key: "green", label: "Green (Easy)", color: "bg-[#a0c35a]" },
  { key: "blue", label: "Blue (Medium)", color: "bg-[#b0c4ef]" },
  { key: "purple", label: "Purple (Hard)", color: "bg-[#ba81c5]" },
];

function AdminPageContent() {
  const searchParams = useSearchParams();
  const dateParam = searchParams.get('date');

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
  const [redHerringGroupName, setRedHerringGroupName] = useState("");
  const [redHerringAssignments, setRedHerringAssignments] = useState<{
    level1: string;
    level2: string;
    level3: string;
  }>({
    level1: "",
    level2: "",
    level3: ""
  });
  const [editingGroup, setEditingGroup] = useState<EditableGroup | null>(null);
  const [editingCompletedGroup, setEditingCompletedGroup] = useState<EditableCompletedGroup | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Load game data if date parameter is present
  useEffect(() => {
    if (dateParam) {
      loadGameForEditing(dateParam);
    }
  }, [dateParam]);

  const loadGameForEditing = async (date: string) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/games/${date}`);
      if (response.ok) {
        const data = await response.json();
        const game = data.game;

        // Set date and title
        setSelectedDate(parseDate(game.date));
        setPuzzleTitle(game.title);

        // Extract red herring group (Final Group from level 4)
        const level4 = game.levels[3];
        const finalGroup = level4.groups.find((g: any) =>
          g.title === "FINAL GROUP" || g.title === "DOUBLE MEANINGS" || g.color === "bg-red-500"
        );

        if (finalGroup) {
          // Set red herring words
          const words = finalGroup.words;
          setRedHerringWords({
            word1: words[0] || "",
            word2: words[1] || "",
            word3: words[2] || "",
            word4: words[3] || ""
          });

          // Set red herring group name
          setRedHerringGroupName(finalGroup.title);

          // Create red herring group
          setRedHerringGroup({
            category: finalGroup.title,
            difficulty: "Ultimate",
            color: "bg-red-500",
            words: finalGroup.words
          });

          // Set red herring assignments from levels 1-3
          setRedHerringAssignments({
            level1: game.levels[0].redHerring || "",
            level2: game.levels[1].redHerring || "",
            level3: game.levels[2].redHerring || ""
          });
        }

        // Load all 4 levels
        const loadedLevels: Level[] = [];
        game.levels.forEach((level: any, index: number) => {
          const levelGroups = level.groups
            .filter((g: any) => g.title !== "FINAL GROUP" && g.title !== "DOUBLE MEANINGS" && g.color !== "bg-red-500")
            .map((g: any) => {
              // Map color back to difficulty
              const difficultyMap: { [key: string]: string } = {
                "bg-amber-200": "Yellow (Easiest)",
                "bg-[#a0c35a]": "Green (Easy)",
                "bg-[#b0c4ef]": "Blue (Medium)",
                "bg-[#ba81c5]": "Purple (Hard)"
              };

              return {
                category: g.title,
                difficulty: difficultyMap[g.color] || g.color,
                color: g.color,
                words: g.words
              };
            });

          loadedLevels.push({
            id: index + 1,
            redHerring: level.redHerring || "",
            groups: levelGroups
          });
        });

        setLevels(loadedLevels);
        // Don't set currentLevel beyond 4 - when all levels are loaded, just don't show the builder
      } else {
        alert("Failed to load puzzle for editing");
      }
    } catch (error) {
      console.error("Error loading game:", error);
      alert("Failed to load puzzle for editing");
    } finally {
      setIsLoading(false);
    }
  };

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

  const startEditingGroup = (groupIndex: number) => {
    const group = currentLevelGroups[groupIndex];
    setEditingGroup({
      groupIndex,
      editedWords: [...group.words]
    });
  };

  const cancelEditingGroup = () => {
    setEditingGroup(null);
  };

  const saveEditedGroup = () => {
    if (!editingGroup) return;

    const trimmedWords = editingGroup.editedWords.map(word => word.trim().toUpperCase());

    // Validate all words are non-empty
    if (trimmedWords.some(word => word === "")) {
      alert("All words must be filled in");
      return;
    }

    // Update the group
    setCurrentLevelGroups(prev => {
      const newGroups = [...prev];
      newGroups[editingGroup.groupIndex] = {
        ...newGroups[editingGroup.groupIndex],
        words: trimmedWords
      };
      return newGroups;
    });

    setEditingGroup(null);
  };

  const updateEditedWord = (wordIndex: number, value: string) => {
    if (!editingGroup) return;

    setEditingGroup(prev => {
      if (!prev) return null;
      const newWords = [...prev.editedWords];
      newWords[wordIndex] = value;
      return {
        ...prev,
        editedWords: newWords
      };
    });
  };

  // Functions for editing completed levels
  const startEditingCompletedGroup = (levelId: number, groupIndex: number) => {
    const level = levels.find(l => l.id === levelId);
    if (!level) return;

    const group = level.groups[groupIndex];
    setEditingCompletedGroup({
      levelId,
      groupIndex,
      editedWords: [...group.words]
    });
  };

  const cancelEditingCompletedGroup = () => {
    setEditingCompletedGroup(null);
  };

  const saveEditedCompletedGroup = () => {
    if (!editingCompletedGroup) return;

    const trimmedWords = editingCompletedGroup.editedWords.map(word => word.trim().toUpperCase());

    // Validate all words are non-empty
    if (trimmedWords.some(word => word === "")) {
      alert("All words must be filled in");
      return;
    }

    // Update the level's group
    setLevels(prev => {
      const newLevels = [...prev];
      const levelIndex = newLevels.findIndex(l => l.id === editingCompletedGroup.levelId);
      if (levelIndex !== -1) {
        newLevels[levelIndex].groups[editingCompletedGroup.groupIndex] = {
          ...newLevels[levelIndex].groups[editingCompletedGroup.groupIndex],
          words: trimmedWords
        };
      }
      return newLevels;
    });

    setEditingCompletedGroup(null);
  };

  const updateEditedCompletedWord = (wordIndex: number, value: string) => {
    if (!editingCompletedGroup) return;

    setEditingCompletedGroup(prev => {
      if (!prev) return null;
      const newWords = [...prev.editedWords];
      newWords[wordIndex] = value;
      return {
        ...prev,
        editedWords: newWords
      };
    });
  };

  const deleteCompletedGroup = (levelId: number, groupIndex: number) => {
    setLevels(prev => {
      const newLevels = [...prev];
      const levelIndex = newLevels.findIndex(l => l.id === levelId);
      if (levelIndex !== -1) {
        newLevels[levelIndex].groups = newLevels[levelIndex].groups.filter((_, index) => index !== groupIndex);
      }
      return newLevels;
    });
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
      category: redHerringGroupName.trim().toUpperCase() || "FINAL GROUP",
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

    // Only advance to next level if we're not at level 4
    if (currentLevel < 4) {
      setCurrentLevel(prev => prev + 1);
    }
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
        await response.json();
        alert(`Puzzle "${puzzleTitle}" saved successfully for ${format(new Date(selectedDate.toString()), 'PPPP')}!`);
      } else {
        throw new Error('Failed to save puzzle');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save puzzle. Please try again.');
    }
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-gray-600 mb-4">Loading puzzle...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-4xl mx-auto">
        {dateParam && levels.length === 4 && (
          <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-blue-800 font-medium">
              Editing existing puzzle for {format(new Date(dateParam + 'T00:00:00'), 'PPPP')}
            </div>
            <div className="text-sm text-blue-600 mt-1">
              You can modify the puzzle details below and save changes.
            </div>
          </div>
        )}
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
                    onChange={(value) => value && setSelectedDate(value)}
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
              <h2 className="text-2xl font-bold mb-4">Step 1: Create Final Group</h2>
              <p className="text-gray-600 mb-6">
                Enter the 4 words that will form your final group. These words will be distributed across levels 1-3 as red herrings.
              </p>

              <div className="mb-4">
                <Input
                  label="Group Name"
                  placeholder="e.g., THINGS WITH MULTIPLE MEANINGS, HOMOPHONES, etc."
                  value={redHerringGroupName}
                  onChange={(e) => setRedHerringGroupName(e.target.value)}
                  description="This will be the title shown for the final group in Level 4"
                />
              </div>

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
                  isDisabled={!puzzleTitle.trim() || !redHerringGroupName.trim() || [redHerringWords.word1, redHerringWords.word2, redHerringWords.word3, redHerringWords.word4].filter(w => w.trim() !== "").length !== 4}
                >
                  Create Final Group
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
        {currentLevel >= 1 && currentLevel <= 4 && (
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
              {currentLevelGroups.map((group, index) => {
                const isEditing = editingGroup?.groupIndex === index;

                return (
                  <div
                    key={index}
                    className={`${group.color} rounded-lg p-4 text-center relative`}
                  >
                    <div className="absolute top-2 right-2 flex gap-2">
                      {!isEditing && (
                        <Button
                          size="sm"
                          variant="light"
                          className="text-blue-600 hover:bg-blue-100"
                          onPress={() => startEditingGroup(index)}
                          isIconOnly
                        >
                          <Pencil size={16} />
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="light"
                        className="text-red-600 hover:bg-red-100"
                        onPress={() => deleteGroup(index)}
                        isIconOnly
                      >
                        <X size={16} />
                      </Button>
                    </div>

                    <div className="font-bold text-lg text-black uppercase tracking-wide mb-2">
                      {group.category}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          {editingGroup.editedWords.map((word, wordIndex) => (
                            <Input
                              key={wordIndex}
                              value={word}
                              onChange={(e) => updateEditedWord(wordIndex, e.target.value)}
                              size="sm"
                              placeholder={`Word ${wordIndex + 1}`}
                              className="bg-white/90"
                            />
                          ))}
                        </div>
                        <div className="flex justify-center gap-2 mt-3">
                          <Button
                            size="sm"
                            className="bg-green-600 text-white"
                            onPress={saveEditedGroup}
                            startContent={<Save size={14} />}
                          >
                            Save
                          </Button>
                          <Button
                            size="sm"
                            variant="bordered"
                            onPress={cancelEditingGroup}
                            startContent={<XCircle size={14} />}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="font-semibold text-black uppercase tracking-wide mb-3">
                        {group.words.join(", ")}
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Red herring group for level 4 */}
              {currentLevel === 4 && redHerringGroup && (
                <div className={`${redHerringGroup.color} rounded-lg p-4 text-center relative border-2 border-red-600`}>
                  <Button
                    size="sm"
                    variant="light"
                    className="absolute top-2 right-2 text-red-600 hover:bg-red-100"
                    onPress={() => setRedHerringGroup(null)}
                    isIconOnly
                  >
                    <X size={16} />
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
                      {level.groups.map((group, groupIndex) => {
                        const isEditing = editingCompletedGroup?.levelId === level.id &&
                                         editingCompletedGroup?.groupIndex === groupIndex;

                        return (
                          <div key={groupIndex} className={`${group.color} rounded p-2 text-sm relative`}>
                            <div className="absolute top-1 right-1 flex gap-1">
                              {!isEditing && (
                                <Button
                                  size="sm"
                                  variant="light"
                                  className="text-blue-600 hover:bg-blue-100"
                                  onPress={() => startEditingCompletedGroup(level.id, groupIndex)}
                                  isIconOnly
                                >
                                  <Pencil size={14} />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="light"
                                className="text-red-600 hover:bg-red-100"
                                onPress={() => deleteCompletedGroup(level.id, groupIndex)}
                                isIconOnly
                              >
                                <X size={14} />
                              </Button>
                            </div>

                            <div className="font-semibold text-black text-center pr-12">{group.category}</div>

                            {isEditing ? (
                              <div className="mt-2">
                                <div className="grid grid-cols-2 gap-1">
                                  {editingCompletedGroup.editedWords.map((word, wordIndex) => (
                                    <Input
                                      key={wordIndex}
                                      value={word}
                                      onChange={(e) => updateEditedCompletedWord(wordIndex, e.target.value)}
                                      size="sm"
                                      placeholder={`Word ${wordIndex + 1}`}
                                      className="bg-white/90"
                                    />
                                  ))}
                                </div>
                                <div className="flex justify-center gap-1 mt-2">
                                  <Button
                                    size="sm"
                                    className="bg-green-600 text-white"
                                    onPress={saveEditedCompletedGroup}
                                    startContent={<Save size={12} />}
                                  >
                                    Save
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="bordered"
                                    onPress={cancelEditingCompletedGroup}
                                    startContent={<XCircle size={12} />}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="text-black text-center">{group.words.join(", ")}</div>
                            )}
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
                  <h3 className="font-bold text-red-800 mb-2">Final Group (Level 4)</h3>
                  <div className="bg-red-500 rounded p-3 text-center">
                    <div className="font-bold text-white text-lg uppercase tracking-wide mb-2">
                      {redHerringGroup.category}
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

export default function AdminPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-medium text-gray-600 mb-4">Loading...</div>
        </div>
      </div>
    }>
      <AdminPageContent />
    </Suspense>
  );
}