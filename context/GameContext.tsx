"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { GameState, GameAction, Topic } from "@/types";
import { gameReducer, initialGameState } from "@/lib/gameReducer";

export const GAME_STORAGE_KEY = "athens_game_state";

export interface GameContextType {
  state: GameState;
  dispatch: React.Dispatch<GameAction>;
  isHydrated: boolean;
  loadTopics: (topics: Topic[]) => void;
  setPlayers: (players: Array<{ id?: string; name: string } | string>) => void;
  setSettings: (settings: { directSeconds: number; passSeconds: number }) => void;
  startGame: (settings?: { directSeconds?: number; passSeconds?: number }) => void;
  selectTopicForChallenge: (topicId: string) => void;
  markResult: (correct: boolean, timer?: { timerSeconds: number; timerRunning: boolean }) => void;
  revealAnswer: (timer?: { timerSeconds: number; timerRunning: boolean }) => void;
  nextQuestion: () => void;
  nextChallenge: () => void;
  endGame: () => void;
  resetGame: () => void;
  undo: () => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export interface GameProviderProps {
  children: ReactNode;
  initialStateOverride?: GameState;
}

export function GameProvider({ children, initialStateOverride }: GameProviderProps) {
  const [state, dispatch] = useReducer(gameReducer, initialStateOverride || initialGameState);
  const [isHydrated, setIsHydrated] = useState(false);

  // On mount: restore state from localStorage if present
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem(GAME_STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === "object" && parsed.phase) {
            dispatch({ type: "RESTORE_STATE", payload: parsed });
          }
        }
      }
    } catch (err) {
      console.error("Failed to restore game state from localStorage:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // On every state change: serialize the full state and write to localStorage, or remove if initial setup
  useEffect(() => {
    if (!isHydrated) return;
    try {
      if (typeof window !== "undefined") {
        if (state.phase === "setup" && state.players.length === 0 && state.topics.length === 0) {
          localStorage.removeItem(GAME_STORAGE_KEY);
        } else {
          localStorage.setItem(GAME_STORAGE_KEY, JSON.stringify(state));
        }
      }
    } catch (err) {
      console.error("Failed to persist game state to localStorage:", err);
    }
  }, [state, isHydrated]);

  // Convenience helper dispatchers
  const loadTopics = (topics: Topic[]) => {
    dispatch({ type: "LOAD_TOPICS", payload: topics });
  };

  const setPlayers = (players: Array<{ id?: string; name: string } | string>) => {
    dispatch({ type: "SET_PLAYERS", payload: { players } });
  };

  const setSettings = (settings: { directSeconds: number; passSeconds: number }) => {
    dispatch({ type: "SET_SETTINGS", payload: settings });
  };

  const startGame = (settings?: { directSeconds?: number; passSeconds?: number }) => {
    dispatch({ type: "START_GAME", payload: settings });
  };

  const selectTopicForChallenge = (topicId: string) => {
    dispatch({ type: "SELECT_TOPIC_FOR_CHALLENGE", payload: { topicId } });
  };

  const markResult = (
    correct: boolean,
    timer?: { timerSeconds: number; timerRunning: boolean }
  ) => {
    dispatch({
      type: "MARK_RESULT",
      payload: {
        correct,
        timerSeconds: timer?.timerSeconds,
        timerRunning: timer?.timerRunning,
      },
    });
  };

  const revealAnswer = (timer?: { timerSeconds: number; timerRunning: boolean }) => {
    dispatch({
      type: "REVEAL_ANSWER",
      payload: timer
        ? { timerSeconds: timer.timerSeconds, timerRunning: timer.timerRunning }
        : undefined,
    });
  };

  const nextQuestion = () => {
    dispatch({ type: "NEXT_QUESTION" });
  };

  const nextChallenge = () => {
    dispatch({ type: "NEXT_CHALLENGE" });
  };

  const endGame = () => {
    dispatch({ type: "END_GAME" });
  };

  const resetGame = () => {
    try {
      if (typeof window !== "undefined") {
        localStorage.removeItem(GAME_STORAGE_KEY);
      }
    } catch (err) {
      console.error("Failed to remove game state from localStorage:", err);
    }
    dispatch({ type: "RESET_GAME" });
  };

  const undo = () => {
    dispatch({ type: "UNDO" });
  };

  const value: GameContextType = {
    state,
    dispatch,
    isHydrated,
    loadTopics,
    setPlayers,
    setSettings,
    startGame,
    selectTopicForChallenge,
    markResult,
    revealAnswer,
    nextQuestion,
    nextChallenge,
    endGame,
    resetGame,
    undo,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

/**
 * Hook to access the GameContext.
 */
export function useGame(): GameContextType {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame must be used within a <GameProvider>");
  }
  return context;
}

export default GameProvider;
