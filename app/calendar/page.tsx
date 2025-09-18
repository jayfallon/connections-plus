"use client";

import { Card, CardBody, Button } from "@heroui/react";
import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from "date-fns";

interface GameSummary {
  date: string;
  title: string;
  id: string;
}

export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [games, setGames] = useState<GameSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGame, setSelectedGame] = useState<GameSummary | null>(null);

  useEffect(() => {
    loadGamesForMonth();
  }, [currentMonth]);

  const loadGamesForMonth = async () => {
    setLoading(true);
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      
      const response = await fetch(`/api/games/list?year=${year}&month=${month}`);
      if (response.ok) {
        const data = await response.json();
        setGames(data.games || []);
      }
    } catch (error) {
      console.error('Error loading games:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteGame = async (date: string) => {
    if (!confirm('Are you sure you want to delete this puzzle?')) return;
    
    try {
      const response = await fetch(`/api/games/${date}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setGames(prev => prev.filter(game => game.date !== date));
        setSelectedGame(null);
        alert('Puzzle deleted successfully');
      } else {
        alert('Failed to delete puzzle');
      }
    } catch (error) {
      console.error('Error deleting game:', error);
      alert('Failed to delete puzzle');
    }
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const monthDays = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Create a calendar grid including leading/trailing days
  const calendarStart = new Date(monthStart);
  calendarStart.setDate(calendarStart.getDate() - monthStart.getDay());
  
  const calendarEnd = new Date(monthEnd);
  calendarEnd.setDate(calendarEnd.getDate() + (6 - monthEnd.getDay()));
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getGameForDate = (date: Date): GameSummary | undefined => {
    const dateStr = format(date, 'yyyy-MM-dd');
    return games.find(game => game.date === dateStr);
  };

  const today = new Date();

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-between items-center mb-4">
            <a
              href="/admin"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              ← Create Puzzle
            </a>
            <a
              href="/"
              className="text-sm text-blue-600 hover:text-blue-800 underline"
            >
              Play Game →
            </a>
          </div>
          <h1 className="text-4xl font-bold mb-2 text-black">Puzzle Calendar</h1>
          <p className="text-gray-600">View and manage your daily puzzles</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <Card>
              <CardBody className="p-6">
                {/* Month Navigation */}
                <div className="flex justify-between items-center mb-6">
                  <Button
                    variant="bordered"
                    onPress={() => setCurrentMonth(prev => subMonths(prev, 1))}
                  >
                    ← Previous
                  </Button>
                  <h2 className="text-2xl font-bold text-black">
                    {format(currentMonth, 'MMMM yyyy')}
                  </h2>
                  <Button
                    variant="bordered"
                    onPress={() => setCurrentMonth(prev => addMonths(prev, 1))}
                  >
                    Next →
                  </Button>
                </div>

                {loading ? (
                  <div className="text-center py-8">
                    <div className="text-lg text-gray-600">Loading puzzles...</div>
                  </div>
                ) : (
                  <>
                    {/* Calendar Grid */}
                    <div className="grid grid-cols-7 gap-1 mb-4">
                      {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                        <div key={day} className="p-2 text-center text-sm font-medium text-gray-600 border-b">
                          {day}
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {calendarDays.map(date => {
                        const game = getGameForDate(date);
                        const isCurrentMonth = isSameMonth(date, currentMonth);
                        const isToday = isSameDay(date, today);
                        const isPast = date < today && !isSameDay(date, today);

                        return (
                          <div
                            key={date.toISOString()}
                            className={`
                              min-h-[80px] p-2 border cursor-pointer transition-all hover:bg-gray-50
                              ${!isCurrentMonth ? 'text-gray-300 bg-gray-50' : ''}
                              ${isToday ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                              ${game ? 'bg-green-100 border-green-300' : ''}
                              ${selectedGame?.date === format(date, 'yyyy-MM-dd') ? 'ring-2 ring-blue-500' : ''}
                            `}
                            onClick={() => {
                              if (game) {
                                setSelectedGame(game);
                              } else {
                                setSelectedGame(null);
                              }
                            }}
                          >
                            <div className={`text-sm font-medium mb-1 ${isToday ? 'text-blue-700' : ''}`}>
                              {format(date, 'd')}
                            </div>
                            {game && isCurrentMonth && (
                              <div className="text-xs text-green-800 font-medium truncate">
                                {game.title}
                              </div>
                            )}
                            {isToday && (
                              <div className="text-xs text-blue-600 font-bold">Today</div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Selected Game Details */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-xl font-bold mb-4">
                  {selectedGame ? 'Puzzle Details' : 'Select a Date'}
                </h3>
                
                {selectedGame ? (
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm text-gray-600">Date</div>
                      <div className="font-medium">
                        {format(new Date(selectedGame.date + 'T00:00:00'), 'PPPP')}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600">Title</div>
                      <div className="font-medium">{selectedGame.title}</div>
                    </div>
                    
                    <div className="pt-4 space-y-2">
                      <Button
                        className="w-full bg-blue-600 text-white"
                        onPress={() => {
                          // Redirect to admin page with the date to load
                          window.location.href = `/admin?date=${selectedGame.date}`;
                        }}
                      >
                        Edit Puzzle
                      </Button>
                      <Button
                        className="w-full bg-red-600 text-white"
                        onPress={() => deleteGame(selectedGame.date)}
                      >
                        Delete Puzzle
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-600">
                    <p className="mb-4">Click on a calendar date to view puzzle details.</p>
                    <p className="text-sm">Green dates have puzzles created.</p>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
                <div className="space-y-2">
                  <Button
                    className="w-full bg-blue-600 text-white"
                    onPress={() => window.location.href = '/admin'}
                  >
                    Create New Puzzle
                  </Button>
                  <Button
                    variant="bordered"
                    className="w-full"
                    onPress={() => setCurrentMonth(new Date())}
                  >
                    Go to Today
                  </Button>
                </div>
              </CardBody>
            </Card>

            {/* Statistics */}
            <Card>
              <CardBody className="p-6">
                <h3 className="text-xl font-bold mb-4">This Month</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Puzzles Created</span>
                    <span className="font-medium">{games.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Days Remaining</span>
                    <span className="font-medium">
                      {monthDays.length - games.length}
                    </span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}