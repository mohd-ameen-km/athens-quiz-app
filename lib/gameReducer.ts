import {
  GameState,
  GameAction,
  GameTopic,
  Question,
  Player,
  PlayerId,
  CurrentChallenge,
  GameSnapshot,
} from "@/types";
import { buildGameSchedule } from "@/lib/scheduling";
import { normalizeMediaField } from "@/lib/parseTsv";

export const initialGameState: GameState = {
  phase: "setup",
  players: [],
  schedule: [],
  topics: [],
  currentChallenge: null,
  directSeconds: 25,
  passSeconds: 20,
  timerSeconds: 25,
  timerRunning: false,
  history: [],
};

/**
 * Ensures player numbers (cp, cn, dp, pp, score) are valid defined numbers and never undefined or NaN.
 */
export function sanitizePlayer(p: Partial<Player> | Record<string, unknown>): Player {
  const pRecord = (p || {}) as Record<string, unknown>;
  const cp = typeof pRecord.cp === "number" && !isNaN(pRecord.cp) ? pRecord.cp : 0;
  const cn = typeof pRecord.cn === "number" && !isNaN(pRecord.cn) ? pRecord.cn : 0;
  const dp = typeof pRecord.dp === "number" && !isNaN(pRecord.dp) ? pRecord.dp : 0;
  const pp = typeof pRecord.pp === "number" && !isNaN(pRecord.pp) ? pRecord.pp : 0;
  const score = cp + cn + dp + pp;
  return {
    id: typeof pRecord.id === "string" && pRecord.id ? pRecord.id : "p1",
    name: typeof pRecord.name === "string" && pRecord.name.trim() ? pRecord.name.trim() : "Player",
    cp,
    cn,
    dp,
    pp,
    score,
  };
}

/**
 * Normalizes a Question's media fields into string[] so legacy plain strings or missing fields never break.
 */
export function sanitizeQuestion(q: Partial<Question> | Record<string, unknown>): Question {
  const qRecord = (q || {}) as Record<string, unknown>;
  return {
    topicName: typeof qRecord.topicName === "string" ? qRecord.topicName : "",
    qnNo: typeof qRecord.qnNo === "number" && !isNaN(qRecord.qnNo) ? qRecord.qnNo : 1,
    qnText: typeof qRecord.qnText === "string" ? qRecord.qnText : "",
    ansText: typeof qRecord.ansText === "string" ? qRecord.ansText : "",
    qnImg: normalizeMediaField(qRecord.qnImg),
    ansImg: normalizeMediaField(qRecord.ansImg),
    qnVid: normalizeMediaField(qRecord.qnVid),
    ansVid: normalizeMediaField(qRecord.ansVid),
    qnAud: normalizeMediaField(qRecord.qnAud),
    ansAud: normalizeMediaField(qRecord.ansAud),
  };
}

/**
 * Creates an immutable deep snapshot of the current game state to store on the history stack.
 */
export function createSnapshot(state: GameState): GameSnapshot {
  return {
    phase: state.phase,
    players: state.players.map((p) => sanitizePlayer(p)),
    schedule: state.schedule.map((r) => ({
      ...r,
      order: [...r.order],
      pairings: r.pairings.map((p) => ({ ...p })),
    })),
    topics: state.topics.map((t) => ({
      ...t,
      questions: (t.questions || []).map((q) => sanitizeQuestion(q)),
      takenInChallenge: t.takenInChallenge ? { ...t.takenInChallenge } : null,
    })),
    currentChallenge: state.currentChallenge
      ? {
          ...state.currentChallenge,
          attemptOrder: [...state.currentChallenge.attemptOrder],
        }
      : null,
    directSeconds: state.directSeconds,
    passSeconds: state.passSeconds,
    timerSeconds: state.timerSeconds,
    timerRunning: state.timerRunning,
  };
}

/**
 * Pure helper to advance to the next challenge/pairing/round.
 */
function advanceChallenge(state: GameState, history: GameSnapshot[]): GameState {
  if (!state.currentChallenge) return state;

  const { roundIndex, challengeIndex } = state.currentChallenge;
  const currentRound = state.schedule[roundIndex];

  // Advance to next pairing in current round if available
  if (challengeIndex + 1 < (currentRound?.pairings.length ?? 0)) {
    const nextChallengeIndex = challengeIndex + 1;
    const nextPairing = currentRound.pairings[nextChallengeIndex];

    return {
      ...state,
      phase: "topics",
      currentChallenge: {
        roundIndex,
        challengeIndex: nextChallengeIndex,
        topicId: null,
        questionIndex: 0,
        attemptOrder: [nextPairing.defender, nextPairing.challenger, nextPairing.third],
        currentAttemptIndex: 0,
        revealed: false,
        resolved: false,
      },
      timerSeconds: state.directSeconds,
      timerRunning: false,
      history,
    };
  }

  // Round completed: advance to next round if available
  if (roundIndex + 1 < state.schedule.length) {
    const nextRoundIndex = roundIndex + 1;
    const nextPairing = state.schedule[nextRoundIndex].pairings[0];

    return {
      ...state,
      phase: "topics",
      currentChallenge: {
        roundIndex: nextRoundIndex,
        challengeIndex: 0,
        topicId: null,
        questionIndex: 0,
        attemptOrder: [nextPairing.defender, nextPairing.challenger, nextPairing.third],
        currentAttemptIndex: 0,
        revealed: false,
        resolved: false,
      },
      timerSeconds: state.directSeconds,
      timerRunning: false,
      history,
    };
  }

  // Entire schedule (all rounds) finished: transition to state that surfaces "End Game"
  return {
    ...state,
    phase: "topics",
    currentChallenge: null,
    timerSeconds: 0,
    timerRunning: false,
    history,
  };
}

/**
 * Pure reducer handling game state transitions and history stack.
 */
export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "LOAD_TOPICS": {
      const rawTopics = Array.isArray(action.payload) ? action.payload : action.payload.topics;

      const topics: GameTopic[] = rawTopics.map((topic, index) => ({
        ...topic,
        id: topic.name || `topic-${index + 1}`,
        taken: false,
        takenInChallenge: null,
        questions: (topic.questions || []).map((q) => sanitizeQuestion(q)),
      }));

      return {
        ...state,
        topics,
      };
    }

    case "SET_PLAYERS": {
      const players: Player[] = action.payload.players.map((player, index) => {
        if (typeof player === "string") {
          return {
            id: `p${index + 1}`,
            name: player.trim() || `Player ${index + 1}`,
            cp: 0,
            cn: 0,
            dp: 0,
            pp: 0,
            score: 0,
          };
        }
        return {
          id: player.id || `p${index + 1}`,
          name: player.name.trim() || `Player ${index + 1}`,
          cp: 0,
          cn: 0,
          dp: 0,
          pp: 0,
          score: 0,
        };
      });

      return {
        ...state,
        players,
      };
    }

    case "SET_SETTINGS": {
      return {
        ...state,
        directSeconds: action.payload.directSeconds,
        passSeconds: action.payload.passSeconds,
        timerSeconds: action.payload.directSeconds,
      };
    }

    case "START_GAME": {
      if (state.players.length !== 3) {
        console.warn("Cannot start game: Exactly 3 players are required.");
        return state;
      }

      if (state.topics.length === 0) {
        console.warn("Cannot start game: At least 3 topics are required.");
        return state;
      }

      const playerIds: [PlayerId, PlayerId, PlayerId] = [
        state.players[0].id,
        state.players[1].id,
        state.players[2].id,
      ];

      const schedule = buildGameSchedule(playerIds, state.topics.length);

      const firstRound = schedule[0];
      const firstPairing = firstRound?.pairings[0];

      const currentChallenge: CurrentChallenge | null = firstPairing
        ? {
            roundIndex: 0,
            challengeIndex: 0,
            topicId: null,
            questionIndex: 0,
            attemptOrder: [firstPairing.defender, firstPairing.challenger, firstPairing.third],
            currentAttemptIndex: 0,
            revealed: false,
            resolved: false,
          }
        : null;

      const direct = action.payload?.directSeconds ?? state.directSeconds;
      const pass = action.payload?.passSeconds ?? state.passSeconds;

      const players = state.players.map((p) => sanitizePlayer(p));

      return {
        ...state,
        phase: "topics",
        players,
        schedule,
        currentChallenge,
        directSeconds: direct,
        passSeconds: pass,
        timerSeconds: direct,
        timerRunning: false,
        history: [],
      };
    }

    case "SELECT_TOPIC_FOR_CHALLENGE": {
      const { topicId } = action.payload;

      if (!state.currentChallenge) {
        console.warn("Cannot select topic: No active challenge found.");
        return state;
      }

      // Snapshot state before mutating
      const history = [...state.history, createSnapshot(state)];
      const { roundIndex, challengeIndex } = state.currentChallenge;

      // Mark topic as taken and record which challenge used it
      const updatedTopics = state.topics.map((t) => {
        if (t.id === topicId) {
          return {
            ...t,
            taken: true,
            takenInChallenge: {
              roundIndex,
              challengeIndex,
            },
          };
        }
        return t;
      });

      const updatedChallenge: CurrentChallenge = {
        ...state.currentChallenge,
        topicId,
        questionIndex: 0,
        currentAttemptIndex: 0,
        revealed: false,
        resolved: false,
      };

      return {
        ...state,
        phase: "question",
        topics: updatedTopics,
        currentChallenge: updatedChallenge,
        timerSeconds: state.directSeconds,
        timerRunning: false,
        history,
      };
    }

    case "MARK_RESULT": {
      if (!state.currentChallenge || state.currentChallenge.resolved) return state;

      const currentTimerSeconds = action.payload.timerSeconds ?? state.timerSeconds;
      const currentTimerRunning = action.payload.timerRunning ?? state.timerRunning;

      // Snapshot state before mutating, capturing the exact timer state at the moment of answer
      const stateToSnapshot: GameState = {
        ...state,
        timerSeconds: currentTimerSeconds,
        timerRunning: currentTimerRunning,
      };
      const history = [...state.history, createSnapshot(stateToSnapshot)];

      const { correct } = action.payload;
      const { attemptOrder, currentAttemptIndex } = state.currentChallenge;

      const defenderId = attemptOrder[0];
      const challengerId = attemptOrder[1];
      const thirdId = attemptOrder[2];

      if (correct) {
        let updatedPlayers = state.players;

        if (currentAttemptIndex === 0) {
          // Defender answers correct: Defender DP +2, Challenger CN -1
          updatedPlayers = state.players.map((p) => {
            const clean = sanitizePlayer(p);
            if (clean.id === defenderId) {
              const dp = clean.dp + 2;
              return {
                ...clean,
                dp,
                score: clean.cp + clean.cn + dp + clean.pp,
              };
            }
            if (clean.id === challengerId) {
              const cn = clean.cn - 1;
              return {
                ...clean,
                cn,
                score: clean.cp + cn + clean.dp + clean.pp,
              };
            }
            return clean;
          });
        } else if (currentAttemptIndex === 1) {
          // Defender wrong; challenger answers correct: Challenger CP +2, defender unchanged
          updatedPlayers = state.players.map((p) => {
            const clean = sanitizePlayer(p);
            if (clean.id === challengerId) {
              const cp = clean.cp + 2;
              return {
                ...clean,
                cp,
                score: cp + clean.cn + clean.dp + clean.pp,
              };
            }
            return clean;
          });
        } else if (currentAttemptIndex === 2) {
          // Defender wrong; challenger wrong; third player answers correct: Third player PP +2
          updatedPlayers = state.players.map((p) => {
            const clean = sanitizePlayer(p);
            if (clean.id === thirdId) {
              const pp = clean.pp + 2;
              return {
                ...clean,
                pp,
                score: clean.cp + clean.cn + clean.dp + pp,
              };
            }
            return clean;
          });
        }

        // Marking correct records outcome and marks attempt sequence resolved, but does NOT reveal answer
        return {
          ...state,
          players: updatedPlayers,
          currentChallenge: {
            ...state.currentChallenge,
            resolved: true,
          },
          timerSeconds: currentTimerSeconds,
          timerRunning: false,
          history,
        };
      } else {
        // Wrong answer
        let updatedPlayers = state.players;

        if (currentAttemptIndex === 1) {
          // Defender wrong; challenger also wrong: Challenger CN -1
          updatedPlayers = state.players.map((p) => {
            const clean = sanitizePlayer(p);
            if (clean.id === challengerId) {
              const cn = clean.cn - 1;
              return {
                ...clean,
                cn,
                score: clean.cp + cn + clean.dp + clean.pp,
              };
            }
            return clean;
          });
        }

        if (currentAttemptIndex < attemptOrder.length - 1) {
          // Advance to next attempt in attemptOrder: reset to passSeconds and run automatically!
          return {
            ...state,
            players: updatedPlayers,
            currentChallenge: {
              ...state.currentChallenge,
              currentAttemptIndex: currentAttemptIndex + 1,
              resolved: false,
            },
            timerSeconds: state.passSeconds,
            timerRunning: true,
            history,
          };
        } else {
          // All three wrong (or attempts exhausted): no further score changes, mark resolved, do NOT reveal answer, stop timer
          return {
            ...state,
            players: updatedPlayers,
            currentChallenge: {
              ...state.currentChallenge,
              resolved: true,
            },
            timerSeconds: 0,
            timerRunning: false,
            history,
          };
        }
      }
    }

    case "REVEAL_ANSWER": {
      if (!state.currentChallenge || state.currentChallenge.revealed) return state;

      const currentTimerSeconds = action.payload?.timerSeconds ?? state.timerSeconds;
      const currentTimerRunning = action.payload?.timerRunning ?? state.timerRunning;

      // Snapshot state before mutating
      const stateToSnapshot: GameState = {
        ...state,
        timerSeconds: currentTimerSeconds,
        timerRunning: currentTimerRunning,
      };
      const history = [...state.history, createSnapshot(stateToSnapshot)];

      return {
        ...state,
        currentChallenge: {
          ...state.currentChallenge,
          revealed: true,
        },
        timerSeconds: currentTimerSeconds,
        timerRunning: false,
        history,
      };
    }

    case "UPDATE_TIMER": {
      return {
        ...state,
        timerSeconds: action.payload.timerSeconds,
        timerRunning: action.payload.timerRunning,
      };
    }

    case "NEXT_QUESTION": {
      if (!state.currentChallenge) return state;

      // Snapshot state before advancing
      const history = [...state.history, createSnapshot(state)];
      const { topicId, questionIndex } = state.currentChallenge;
      const topic = state.topics.find((t) => t.id === topicId);
      const totalQuestions = topic?.questions.length ?? 0;

      // If the current topic has further questions:
      if (questionIndex + 1 < totalQuestions) {
        return {
          ...state,
          currentChallenge: {
            ...state.currentChallenge,
            questionIndex: questionIndex + 1,
            currentAttemptIndex: 0,
            revealed: false,
            resolved: false,
          },
          timerSeconds: state.directSeconds,
          timerRunning: false,
          history,
        };
      }

      // If topic's questions are exhausted, advance to next challenge
      return advanceChallenge(state, history);
    }

    case "NEXT_CHALLENGE": {
      if (!state.currentChallenge) return state;

      // Snapshot state before advancing
      const history = [...state.history, createSnapshot(state)];
      return advanceChallenge(state, history);
    }

    case "UNDO": {
      if (state.history.length === 0) return state;

      // Pop the most recent snapshot
      const previousSnapshot = state.history[state.history.length - 1];
      const newHistory = state.history.slice(0, -1);

      return {
        ...state,
        ...previousSnapshot,
        history: newHistory,
      };
    }

    case "END_GAME": {
      return {
        ...state,
        phase: "result",
      };
    }

    case "RESTORE_STATE": {
      const sanitizedPlayers = (action.payload.players || []).map((p: Partial<Player>) =>
        sanitizePlayer(p)
      );

      const sanitizedTopics: GameTopic[] = (action.payload.topics || []).map((t, index) => ({
        ...t,
        id: t.id || t.name || `topic-${index + 1}`,
        taken: Boolean(t.taken),
        takenInChallenge: t.takenInChallenge ? { ...t.takenInChallenge } : null,
        questions: (t.questions || []).map((q) => sanitizeQuestion(q)),
      }));

      const sanitizedHistory: GameSnapshot[] = (action.payload.history || []).map((snap) => ({
        ...snap,
        players: (snap.players || []).map((p) => sanitizePlayer(p)),
        topics: (snap.topics || []).map((t, index) => ({
          ...t,
          id: t.id || t.name || `topic-${index + 1}`,
          taken: Boolean(t.taken),
          takenInChallenge: t.takenInChallenge ? { ...t.takenInChallenge } : null,
          questions: (t.questions || []).map((q) => sanitizeQuestion(q)),
        })),
      }));

      return {
        ...action.payload,
        players: sanitizedPlayers,
        topics: sanitizedTopics,
        timerSeconds: action.payload.timerSeconds ?? action.payload.directSeconds ?? 25,
        timerRunning: action.payload.timerRunning ?? false,
        history: sanitizedHistory,
      };
    }

    case "RESET_GAME": {
      return initialGameState;
    }

    default:
      return state;
  }
}
