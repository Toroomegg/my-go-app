import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, AssessmentResult, GameRecord, TsumegoProblem } from '../types/go';

const LOCAL_STORAGE_KEY = 'yidao_go_users_data_v1';
const ACTIVE_USER_KEY = 'yidao_go_active_user_id';

const DEFAULT_USERS: UserProfile[] = [
  {
    id: 'user-default-1',
    name: '棋道研習生',
    avatar: '🥋',
    createdAt: new Date().toISOString(),
    currentRank: '10級 (10k)',
    eloRating: 900,
    solvedProblemIds: [],
    failedProblemIds: [],
    starredProblemIds: [],
    assessmentHistory: [],
    savedGames: [],
    customProblems: []
  },
  {
    id: 'user-default-2',
    name: '弈林雅士',
    avatar: '🎋',
    createdAt: new Date().toISOString(),
    currentRank: '1段 (1D)',
    eloRating: 1800,
    solvedProblemIds: [],
    failedProblemIds: [],
    starredProblemIds: [],
    assessmentHistory: [],
    savedGames: [],
    customProblems: []
  }
];

interface UserContextType {
  users: UserProfile[];
  activeUser: UserProfile;
  switchUser: (userId: string) => void;
  createUser: (name: string, startingRank?: string, avatar?: string) => string;
  deleteUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<UserProfile>) => void;
  recordAssessmentResult: (result: AssessmentResult) => void;
  recordTsumegoAttempt: (problemId: string, success: boolean, ratingDelta: number) => void;
  toggleStarProblem: (problemId: string) => void;
  saveGameRecord: (record: GameRecord) => void;
  deleteGameRecord: (gameId: string) => void;
  addCustomProblem: (problem: TsumegoProblem) => void;
  deleteCustomProblem: (problemId: string) => void;
  exportData: () => string;
  importData: (jsonStr: string) => boolean;
}

const UserContext = createContext<UserContextType | null>(null);

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [users, setUsers] = useState<UserProfile[]>(() => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return DEFAULT_USERS;
  });

  const [activeUserId, setActiveUserId] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(ACTIVE_USER_KEY);
      if (saved && users.some((u) => u.id === saved)) {
        return saved;
      }
    } catch {
      // fallback
    }
    return users[0]?.id || DEFAULT_USERS[0].id;
  });

  // Save changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(users));
    } catch (e) {
      console.error('Failed to save users to localStorage', e);
    }
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_USER_KEY, activeUserId);
    } catch (e) {
      console.error('Failed to save active user to localStorage', e);
    }
  }, [activeUserId]);

  const activeUser = users.find((u) => u.id === activeUserId) || users[0] || DEFAULT_USERS[0];

  const switchUser = (userId: string) => {
    if (users.some((u) => u.id === userId)) {
      setActiveUserId(userId);
    }
  };

  const createUser = (name: string, startingRank: string = '12級 (12k)', avatar: string = '🪨') => {
    let initialElo = 800;
    if (startingRank.includes('段')) {
      const dan = parseInt(startingRank.replace(/[^0-9]/g, '') || '1', 10);
      initialElo = 1700 + dan * 100;
    } else if (startingRank.includes('級')) {
      const kyu = parseInt(startingRank.replace(/[^0-9]/g, '') || '10', 10);
      initialElo = Math.max(400, 1600 - kyu * 80);
    }

    const newUser: UserProfile = {
      id: `user-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || '新棋手',
      avatar,
      createdAt: new Date().toISOString(),
      currentRank: startingRank,
      eloRating: initialElo,
      solvedProblemIds: [],
      failedProblemIds: [],
      starredProblemIds: [],
      assessmentHistory: [],
      savedGames: [],
      customProblems: []
    };

    setUsers((prev) => [...prev, newUser]);
    setActiveUserId(newUser.id);
    return newUser.id;
  };

  const deleteUser = (userId: string) => {
    if (users.length <= 1) return; // Keep at least one user
    setUsers((prev) => {
      const remaining = prev.filter((u) => u.id !== userId);
      if (activeUserId === userId) {
        setActiveUserId(remaining[0].id);
      }
      return remaining;
    });
  };

  const updateUser = (userId: string, updates: Partial<UserProfile>) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, ...updates } : u))
    );
  };

  const recordAssessmentResult = (result: AssessmentResult) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeUserId) return u;
        return {
          ...u,
          currentRank: result.rank,
          eloRating: result.eloRating,
          assessmentHistory: [result, ...u.assessmentHistory],
        };
      })
    );
  };

  const recordTsumegoAttempt = (problemId: string, success: boolean, ratingDelta: number) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeUserId) return u;
        const solved = new Set(u.solvedProblemIds);
        const failed = new Set(u.failedProblemIds);

        if (success) {
          solved.add(problemId);
        } else {
          failed.add(problemId);
        }

        const newElo = Math.max(300, Math.min(3000, u.eloRating + ratingDelta));
        return {
          ...u,
          solvedProblemIds: Array.from(solved),
          failedProblemIds: Array.from(failed),
          eloRating: newElo,
        };
      })
    );
  };

  const toggleStarProblem = (problemId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeUserId) return u;
        const set = new Set(u.starredProblemIds);
        if (set.has(problemId)) {
          set.delete(problemId);
        } else {
          set.add(problemId);
        }
        return {
          ...u,
          starredProblemIds: Array.from(set),
        };
      })
    );
  };

  const saveGameRecord = (record: GameRecord) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeUserId) return u;
        return {
          ...u,
          savedGames: [record, ...u.savedGames],
        };
      })
    );
  };

  const deleteGameRecord = (gameId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeUserId) return u;
        return {
          ...u,
          savedGames: u.savedGames.filter((g) => g.id !== gameId),
        };
      })
    );
  };

  const addCustomProblem = (problem: TsumegoProblem) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeUserId) return u;
        return {
          ...u,
          customProblems: [problem, ...u.customProblems],
        };
      })
    );
  };

  const deleteCustomProblem = (problemId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id !== activeUserId) return u;
        return {
          ...u,
          customProblems: u.customProblems.filter((p) => p.id !== problemId),
        };
      })
    );
  };

  const exportData = (): string => {
    return JSON.stringify(users, null, 2);
  };

  const importData = (jsonStr: string): boolean => {
    try {
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].id) {
        setUsers(parsed);
        setActiveUserId(parsed[0].id);
        return true;
      }
    } catch (e) {
      console.error('Failed to import user data', e);
    }
    return false;
  };

  return (
    <UserContext.Provider
      value={{
        users,
        activeUser,
        switchUser,
        createUser,
        deleteUser,
        updateUser,
        recordAssessmentResult,
        recordTsumegoAttempt,
        toggleStarProblem,
        saveGameRecord,
        deleteGameRecord,
        addCustomProblem,
        deleteCustomProblem,
        exportData,
        importData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
