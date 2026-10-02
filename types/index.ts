import { ReactNode } from "react";

// Accent colors strictly used for badges and tags
export type AccentColor = "yellow" | "pink" | "blue" | "red" | "neutral";

export type BadgeVariant = AccentColor | "outline";
export type BadgeStyle = "soft" | "solid" | "outline";
export type BadgeSize = "sm" | "md";

export type ButtonVariant =
  "primary" | "secondary" | "outline" | "ghost" | "danger" | "yellow" | "blue" | "pink" | "ink";
export type ButtonSize = "sm" | "md" | "lg" | "icon";

export type CardVariant =
  "glass" | "solid" | "outline" | "glass-yellow" | "glass-blue" | "glass-pink";

export interface BaseComponentProps {
  className?: string;
  children?: ReactNode;
}

// Media fields for questions and answers
export interface QuestionMedia {
  qnImg?: string;
  ansImg?: string;
  qnVid?: string;
  ansVid?: string;
  qnAud?: string;
  ansAud?: string;
}

// Core Question model
export interface Question extends QuestionMedia {
  topicName: string;
  qnNo: number;
  qnText: string;
  ansText: string;
}

// Topic model containing name and questions array
export interface Topic {
  name: string;
  questions: Question[];
}

// Result of parsing TSV content
export interface ParseTsvResult {
  topics: Topic[];
  errors: string[];
}

// Game Scheduling types
export type PlayerId = string;

export interface ChallengePairing<T = PlayerId> {
  challenger: T;
  defender: T;
  third: T;
}

export interface Round<T = PlayerId> {
  roundNumber: number;
  order: [T, T, T];
  pairings: ChallengePairing<T>[];
}

// -------------------------------------------------------------
// Game State Types
// -------------------------------------------------------------

export type GamePhase = "setup" | "topics" | "question" | "result";

export interface PointLogEntry {
  amount: number;
  topicName: string;
  role: "defender" | "challenger" | "third";
}

export interface Player {
  id: PlayerId;
  name: string;
  cp: number; // Challenge Positive: total points earned while challenging and succeeding after defender failed (+2 each)
  cn: number; // Challenge Negative: total points lost while challenging when challenger failed to answer correctly (−1 each)
  dp: number; // Defended Points: total points earned while successfully defending (+2 each)
  pp: number; // Passed Points: total points earned as third player when both defender and challenger failed (+2 each)
  score: number; // Total: CP + CN + DP + PP
}

export interface ChallengeLocation {
  roundIndex: number;
  challengeIndex: number;
}

export interface GameTopic extends Topic {
  id: string;
  taken: boolean;
  takenInChallenge: ChallengeLocation | null;
}

export interface CurrentChallenge {
  roundIndex: number;
  challengeIndex: number;
  topicId: string | null;
  questionIndex: number;
  attemptOrder: [PlayerId, PlayerId, PlayerId];
  currentAttemptIndex: number;
  revealed: boolean;
  resolved: boolean;
}

export interface GameSnapshot {
  phase: GamePhase;
  players: Player[];
  schedule: Round[];
  topics: GameTopic[];
  currentChallenge: CurrentChallenge | null;
  directSeconds: number;
  passSeconds: number;
  timerSeconds: number;
  timerRunning: boolean;
}

export interface GameState {
  phase: GamePhase;
  players: Player[];
  schedule: Round[];
  topics: GameTopic[];
  currentChallenge: CurrentChallenge | null;
  directSeconds: number;
  passSeconds: number;
  timerSeconds: number;
  timerRunning: boolean;
  history: GameSnapshot[];
}

// Action types
export type GameAction =
  | { type: "LOAD_TOPICS"; payload: { topics: Topic[] } | Topic[] }
  | { type: "SET_PLAYERS"; payload: { players: Array<{ id?: string; name: string } | string> } }
  | { type: "SET_SETTINGS"; payload: { directSeconds: number; passSeconds: number } }
  | { type: "START_GAME"; payload?: { directSeconds?: number; passSeconds?: number } }
  | { type: "SELECT_TOPIC_FOR_CHALLENGE"; payload: { topicId: string } }
  | {
      type: "MARK_RESULT";
      payload: { correct: boolean; timerSeconds?: number; timerRunning?: boolean };
    }
  | { type: "REVEAL_ANSWER"; payload?: { timerSeconds?: number; timerRunning?: boolean } }
  | { type: "UPDATE_TIMER"; payload: { timerSeconds: number; timerRunning: boolean } }
  | { type: "NEXT_QUESTION" }
  | { type: "NEXT_CHALLENGE" }
  | { type: "UNDO" }
  | { type: "END_GAME" }
  | { type: "RESTORE_STATE"; payload: GameState }
  | { type: "RESET_GAME" };
