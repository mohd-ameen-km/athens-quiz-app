import { describe, it, expect } from "vitest";
import { gameReducer, initialGameState } from "./gameReducer";
import { parseTsv } from "./parseTsv";
import { SAMPLE_TSV_CONTENT } from "./sampleTsv";

describe("Global History Stack & UNDO Workflow", () => {
  function createReadyGameState() {
    const parseResult = parseTsv(SAMPLE_TSV_CONTENT);
    let state = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: parseResult.topics,
    });
    state = gameReducer(state, {
      type: "SET_PLAYERS",
      payload: { players: ["Alex", "Blair", "Chris"] },
    });
    return gameReducer(state, { type: "START_GAME" });
  }

  it("should initialize with an empty history stack", () => {
    const state = createReadyGameState();
    expect(state.history).toEqual([]);
  });

  it("should do nothing on UNDO when history stack is empty", () => {
    const state = createReadyGameState();
    const undid = gameReducer(state, { type: "UNDO" });
    expect(undid).toEqual(state);
    expect(undid.history).toHaveLength(0);
  });

  it("snapshots state before SELECT_TOPIC_FOR_CHALLENGE and restores topics board on UNDO", () => {
    let state = createReadyGameState();
    const firstTopicId = state.topics[0].id;

    // Mutating dispatch
    state = gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: firstTopicId },
    });

    expect(state.phase).toBe("question");
    expect(state.topics[0].taken).toBe(true);
    expect(state.history).toHaveLength(1);
    expect(state.history[0].phase).toBe("topics");
    expect(state.history[0].topics[0].taken).toBe(false);

    // UNDO: Should pop snapshot and restore topics phase with topic untaken
    state = gameReducer(state, { type: "UNDO" });

    expect(state.phase).toBe("topics");
    expect(state.topics[0].taken).toBe(false);
    expect(state.topics[0].takenInChallenge).toBeNull();
    expect(state.history).toHaveLength(0);
  });

  it("snapshots before MARK_RESULT and restores previous attempt and reverts score and counters on UNDO", () => {
    let state = createReadyGameState();
    state = gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: state.topics[0].id },
    });

    const defenderId = state.currentChallenge!.attemptOrder[0];
    const challengerId = state.currentChallenge!.attemptOrder[1];

    // 1. Defender correct: defender DP +2, challenger CN -1
    state = gameReducer(state, {
      type: "MARK_RESULT",
      payload: { correct: true },
    });

    const defender = state.players.find((p) => p.id === defenderId)!;
    const challenger = state.players.find((p) => p.id === challengerId)!;

    expect(defender.dp).toBe(2);
    expect(defender.score).toBe(2);
    expect(challenger.cn).toBe(-1);
    expect(challenger.score).toBe(-1);
    expect(state.currentChallenge?.resolved).toBe(true);
    expect(state.currentChallenge?.revealed).toBe(false);
    // History should now have 2 snapshots: [topics board, pre-answer question]
    expect(state.history).toHaveLength(2);

    // 2. UNDO: Should revert score and counters, and restore unrevealed attempt 0
    state = gameReducer(state, { type: "UNDO" });

    const undidDefender = state.players.find((p) => p.id === defenderId)!;
    const undidChallenger = state.players.find((p) => p.id === challengerId)!;

    expect(undidDefender.dp).toBe(0);
    expect(undidDefender.score).toBe(0);
    expect(undidChallenger.cn).toBe(0);
    expect(undidChallenger.score).toBe(0);
    expect(state.currentChallenge?.resolved).toBe(false);
    expect(state.currentChallenge?.revealed).toBe(false);
    expect(state.currentChallenge?.currentAttemptIndex).toBe(0);
    expect(state.history).toHaveLength(1);
  });

  it("correctly restores the timer's prior state (seconds and running status) when undoing MARK_RESULT", () => {
    let state = createReadyGameState();
    state = gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: state.topics[0].id },
    });

    // Defender begins with direct timer (25s) stopped
    expect(state.timerSeconds).toBe(25);
    expect(state.timerRunning).toBe(false);

    // Defender's timer runs down to 13 seconds, and defender is marked wrong
    state = gameReducer(state, {
      type: "MARK_RESULT",
      payload: { correct: false, timerSeconds: 13, timerRunning: true },
    });

    // Challenger turn: passSeconds (20s) and timer starts automatically
    expect(state.currentChallenge?.currentAttemptIndex).toBe(1);
    expect(state.timerSeconds).toBe(20);
    expect(state.timerRunning).toBe(true);

    // UNDO: Should restore Defender's attempt and exact prior timer state (13s, running)
    state = gameReducer(state, { type: "UNDO" });
    expect(state.currentChallenge?.currentAttemptIndex).toBe(0);
    expect(state.timerSeconds).toBe(13);
    expect(state.timerRunning).toBe(true);

    // Now Defender gets marked correct with 9 seconds remaining
    state = gameReducer(state, {
      type: "MARK_RESULT",
      payload: { correct: true, timerSeconds: 9, timerRunning: true },
    });

    const defenderId = state.currentChallenge!.attemptOrder[0];
    const defender = state.players.find((p) => p.id === defenderId)!;
    expect(defender.score).toBe(2);
    expect(state.timerRunning).toBe(false); // Stopped on reveal

    // UNDO: Should revert score and counters back to 0, and restore 9s and running status
    state = gameReducer(state, { type: "UNDO" });
    const undidDefender = state.players.find((p) => p.id === defenderId)!;
    expect(undidDefender.dp).toBe(0);
    expect(undidDefender.score).toBe(0);
    expect(state.currentChallenge?.revealed).toBe(false);
    expect(state.timerSeconds).toBe(9);
    expect(state.timerRunning).toBe(true);
  });

  it("snapshots before REVEAL_ANSWER and restores unrevealed state on UNDO", () => {
    let state = createReadyGameState();
    state = gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: state.topics[0].id },
    });

    expect(state.currentChallenge?.revealed).toBe(false);

    // Mutating dispatch: REVEAL_ANSWER
    state = gameReducer(state, { type: "REVEAL_ANSWER" });
    expect(state.currentChallenge?.revealed).toBe(true);
    expect(state.history).toHaveLength(2);

    // UNDO: Restores unrevealed state
    state = gameReducer(state, { type: "UNDO" });
    expect(state.currentChallenge?.revealed).toBe(false);
    expect(state.history).toHaveLength(1);
  });

  it("walks back through sequential actions, earlier questions, and previous challenges on repeated UNDO clicks", () => {
    let state = createReadyGameState();

    // 1. Select topic 0 (Challenge 0)
    state = gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: state.topics[0].id },
    });
    expect(state.phase).toBe("question");
    expect(state.currentChallenge?.questionIndex).toBe(0);

    // 2. Defender wrong (attempt 0 -> 1)
    state = gameReducer(state, {
      type: "MARK_RESULT",
      payload: { correct: false },
    });
    expect(state.currentChallenge?.currentAttemptIndex).toBe(1);

    // 3. Challenger correct (challenger +2, resolved true, revealed remains false)
    state = gameReducer(state, {
      type: "MARK_RESULT",
      payload: { correct: true },
    });
    expect(state.currentChallenge?.resolved).toBe(true);
    expect(state.currentChallenge?.revealed).toBe(false);

    // 4. Reveal answer explicitly
    state = gameReducer(state, { type: "REVEAL_ANSWER" });
    expect(state.currentChallenge?.revealed).toBe(true);
    expect(state.currentChallenge?.resolved).toBe(true);

    // 5. Advance to Next Question (questionIndex 0 -> 1)
    state = gameReducer(state, { type: "NEXT_QUESTION" });
    expect(state.currentChallenge?.questionIndex).toBe(1);
    expect(state.currentChallenge?.currentAttemptIndex).toBe(0);

    // Now test repeated UNDO clicks walking back:

    // Click 1: Undoes NEXT_QUESTION -> returns to Question 0 with revealed answer & challenger points
    state = gameReducer(state, { type: "UNDO" });
    expect(state.currentChallenge?.questionIndex).toBe(0);
    expect(state.currentChallenge?.revealed).toBe(true);
    expect(state.currentChallenge?.resolved).toBe(true);
    expect(state.players.some((p) => p.score === 2)).toBe(true);

    // Click 2: Undoes REVEAL_ANSWER -> returns to Question 0 with resolved true but revealed false
    state = gameReducer(state, { type: "UNDO" });
    expect(state.currentChallenge?.questionIndex).toBe(0);
    expect(state.currentChallenge?.revealed).toBe(false);
    expect(state.currentChallenge?.resolved).toBe(true);
    expect(state.players.some((p) => p.score === 2)).toBe(true);

    // Click 3: Undoes Challenger's MARK_RESULT -> returns to Question 0 during Challenger's turn (scores 0, resolved false)
    state = gameReducer(state, { type: "UNDO" });
    expect(state.currentChallenge?.questionIndex).toBe(0);
    expect(state.currentChallenge?.currentAttemptIndex).toBe(1);
    expect(state.currentChallenge?.resolved).toBe(false);
    expect(state.currentChallenge?.revealed).toBe(false);
    expect(state.players.every((p) => p.score === 0)).toBe(true);

    // Click 4: Undoes Defender's wrong MARK_RESULT -> returns to Question 0 during Defender's turn
    state = gameReducer(state, { type: "UNDO" });
    expect(state.currentChallenge?.questionIndex).toBe(0);
    expect(state.currentChallenge?.currentAttemptIndex).toBe(0);
    expect(state.currentChallenge?.resolved).toBe(false);
    expect(state.currentChallenge?.revealed).toBe(false);

    // Click 5: Undoes SELECT_TOPIC_FOR_CHALLENGE -> returns to Topics Board with topic untaken!
    state = gameReducer(state, { type: "UNDO" });
    expect(state.phase).toBe("topics");
    expect(state.topics[0].taken).toBe(false);
    expect(state.history).toHaveLength(0);

    // Click 6: History empty -> remains in topics phase unchanged
    state = gameReducer(state, { type: "UNDO" });
    expect(state.phase).toBe("topics");
    expect(state.history).toHaveLength(0);
  });
});
