"use client";

import { Card, CardBody, Button, Input, Select, SelectItem } from "@heroui/react";
import { useState } from "react";

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
  { key: "yellow", label: "Yellow (Easiest)", color: "bg-yellow-400" },
  { key: "green", label: "Green (Easy)", color: "bg-green-400" },
  { key: "blue", label: "Blue (Medium)", color: "bg-blue-400" },
  { key: "purple", label: "Purple (Hard)", color: "bg-purple-400" },
];

export default function AdminPage() {
  const [currentCategory, setCurrentCategory] = useState("");
  const [currentDifficulty, setCurrentDifficulty] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [levels, setLevels] = useState<Level[]>([]);
  const [currentLevelGroups, setCurrentLevelGroups] = useState<WordGroup[]>([]);
  const [currentLevel, setCurrentLevel] = useState(1);
  const [selectedRedHerrings, setSelectedRedHerrings] = useState<{
    level1: string;
    level2: string;
    level3: string;
    level4: string;
  }>({
    level1: "",
    level2: "",
    level3: "",
    level4: ""
  });
  const [allGeneratedGroups, setAllGeneratedGroups] = useState<WordGroup[]>([]);

  const generateWordGroup = async () => {
    if (!currentCategory || !currentDifficulty) return;

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
          category: currentCategory.toUpperCase(),
          difficulty: difficultyInfo?.label || currentDifficulty,
          color: difficultyInfo?.color || "bg-gray-400",
          words: data.words,
        };

        setCurrentLevelGroups(prev => [...prev, newGroup]);
        setAllGeneratedGroups(prev => [...prev, newGroup]);
        setCurrentCategory("");
        setCurrentDifficulty("");
      }
    } catch (error) {
      console.error('Error generating words:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const completeLevel = () => {
    if (currentLevelGroups.length !== 4) {
      alert("Please create 4 groups before completing the level");
      return;
    }

    const newLevel: Level = {
      id: currentLevel,
      redHerring: "", // Will be set manually or generated
      groups: [...currentLevelGroups],
    };

    setLevels(prev => [...prev, newLevel]);
    setCurrentLevelGroups([]);
    setCurrentLevel(prev => prev + 1);
  };

  const exportConfig = async () => {
    // Create levels 1-3 with manually selected red herrings
    const processedLevels = levels.slice(0, 3).map(level => {
      const levelKey = `level${level.id}` as keyof typeof selectedRedHerrings;
      const selectedRedHerring = selectedRedHerrings[levelKey];
      
      // Filter out the red herring from groups and create clean groups
      const cleanGroups = level.groups.map(group => ({
        ...group,
        words: group.words.filter(word => word !== selectedRedHerring)
      })).filter(group => group.words.length > 0);
      
      return {
        id: level.id,
        redHerring: selectedRedHerring || "PLACEHOLDER",
        groups: cleanGroups.reduce((acc, group, index) => {
          const groupKey = `group${index + 1}`;
          acc[groupKey] = {
            words: group.words,
            color: group.color,
            difficulty: group.difficulty.split(" ")[0],
            category: group.category,
          };
          return acc;
        }, {} as any),
      };
    });

    // Create Level 4 with the red herrings forming their own group
    const collectedRedHerrings = [
      selectedRedHerrings.level1,
      selectedRedHerrings.level2,
      selectedRedHerrings.level3,
      "PLACEHOLDER" // This will be determined by Level 4's actual red herring
    ].filter(herring => herring && herring !== "");

    if (levels.length >= 4) {
      const level4 = levels[3];
      const level4Groups = level4.groups.reduce((acc, group, index) => {
        const groupKey = `group${index + 1}`;
        acc[groupKey] = {
          words: group.words,
          color: group.color,
          difficulty: group.difficulty.split(" ")[0],
          category: group.category,
        };
        return acc;
      }, {} as any);

      // Add the red herring group as the final group
      if (collectedRedHerrings.length >= 3) {
        level4Groups.redHerrings = {
          words: collectedRedHerrings.slice(0, 4), // Take first 4 or pad as needed
          color: "bg-red-500",
          difficulty: "Ultimate",
          category: "DOUBLE MEANINGS",
        };
      }

      processedLevels.push({
        id: 4,
        redHerring: "",
        groups: level4Groups,
      });
    }

    const gameConfig = {
      levels: processedLevels,
    };

    const configString = JSON.stringify(gameConfig, null, 2);
    console.log("Game Config:", configString);

    try {
      // Save to JSON file
      const response = await fetch('/api/save-config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: configString,
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Game config saved successfully as ${result.filename}!\nConfig also copied to clipboard.`);
        
        // Try to copy to clipboard as well
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(configString);
        } else {
          showConfigModal(configString);
        }
      } else {
        throw new Error('Failed to save config file');
      }
    } catch (error) {
      console.error('Error saving config:', error);
      alert('Failed to save config file, but copying to clipboard...');
      
      // Fallback to clipboard/modal
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(configString).then(() => {
          alert("Game config copied to clipboard!");
        }).catch(err => {
          console.error('Failed to copy to clipboard:', err);
          showConfigModal(configString);
        });
      } else {
        showConfigModal(configString);
      }
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
          <h1 className="text-4xl font-bold mb-2 text-black">Connections Plus Admin</h1>
          <p className="text-gray-600">Generate word groups for each level</p>
        </div>

        {/* Current Level Builder */}
        <Card className="mb-6">
          <CardBody className="p-6">
            <h2 className="text-2xl font-bold mb-4">Building Level {currentLevel}</h2>
            
            {/* Form for generating word groups */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Input
                label="Category"
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
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty.key}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </Select>
              
              <Button
                onPress={generateWordGroup}
                isLoading={isGenerating}
                className="bg-blue-600 text-white"
                isDisabled={!currentCategory || !currentDifficulty}
              >
                Generate Group
              </Button>
            </div>

            {/* Current level groups */}
            <div className="space-y-3 mb-6">
              {currentLevelGroups.map((group, index) => (
                <div
                  key={index}
                  className={`${group.color} rounded-lg p-4 text-center`}
                >
                  <div className="font-bold text-lg text-black uppercase tracking-wide mb-2">
                    {group.category}
                  </div>
                  <div className="font-semibold text-black uppercase tracking-wide mb-3">
                    {group.words.join(", ")}
                  </div>
                  {currentLevel <= 3 && (
                    <div className="mt-3 pt-3 border-t border-gray-300">
                      <div className="text-sm text-gray-600 mb-2">Select red herring for Level {currentLevel}:</div>
                      <div className="flex justify-center gap-2 flex-wrap">
                        {group.words.map((word) => (
                          <Button
                            key={word}
                            size="sm"
                            variant={selectedRedHerrings[`level${currentLevel}` as keyof typeof selectedRedHerrings] === word ? "solid" : "bordered"}
                            className={
                              selectedRedHerrings[`level${currentLevel}` as keyof typeof selectedRedHerrings] === word 
                                ? "bg-red-500 text-white" 
                                : "border-gray-400 text-gray-700 hover:bg-gray-100"
                            }
                            onPress={() => {
                              const levelKey = `level${currentLevel}` as keyof typeof selectedRedHerrings;
                              setSelectedRedHerrings(prev => ({
                                ...prev,
                                [levelKey]: prev[levelKey] === word ? "" : word
                              }));
                            }}
                          >
                            {word}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center">
              <div className="text-gray-600">
                <div>Groups completed: {currentLevelGroups.length}/4</div>
                {currentLevel <= 3 && (
                  <div className="text-sm mt-1">
                    Red herring selected: {selectedRedHerrings[`level${currentLevel}` as keyof typeof selectedRedHerrings] || "None"}
                  </div>
                )}
              </div>
              
              <Button
                onPress={completeLevel}
                className="bg-green-600 text-white"
                isDisabled={currentLevelGroups.length !== 4 || (currentLevel <= 3 && !selectedRedHerrings[`level${currentLevel}` as keyof typeof selectedRedHerrings])}
              >
                Complete Level {currentLevel}
              </Button>
            </div>
          </CardBody>
        </Card>

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
                            {selectedRedHerrings[`level${level.id}` as keyof typeof selectedRedHerrings] || "Not selected"}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {level.groups.map((group, index) => {
                        const levelKey = `level${level.id}` as keyof typeof selectedRedHerrings;
                        const selectedRedHerring = selectedRedHerrings[levelKey];
                        const filteredWords = level.id <= 3 ? group.words.filter(word => word !== selectedRedHerring) : group.words;
                        
                        if (level.id <= 3 && filteredWords.length === 0) return null;
                        
                        return (
                          <div key={index} className={`${group.color} rounded p-2 text-center text-sm`}>
                            <div className="font-semibold text-black">{group.category}</div>
                            <div className="text-black">{filteredWords.join(", ")}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              {/* Red Herring Summary */}
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h3 className="font-bold text-red-800 mb-2">Level 4 Mystery Group Preview</h3>
                <div className="text-sm text-red-700">
                  Red herrings collected: {[selectedRedHerrings.level1, selectedRedHerrings.level2, selectedRedHerrings.level3].filter(h => h).join(", ") || "None selected yet"}
                </div>
                {[selectedRedHerrings.level1, selectedRedHerrings.level2, selectedRedHerrings.level3].filter(h => h).length === 3 && (
                  <div className="text-sm text-green-700 mt-1 font-semibold">
                    ✓ Ready for Level 4 mystery group!
                  </div>
                )}
              </div>

              <Button
                onPress={exportConfig}
                className="mt-4 bg-purple-600 text-white"
                isDisabled={levels.length < 4 || [selectedRedHerrings.level1, selectedRedHerrings.level2, selectedRedHerrings.level3].filter(h => h).length < 3}
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