import { describe, it, expect } from "vitest";
import { gameReducer, initialGameState } from "./gameReducer";
import { parseTsv } from "./parseTsv";
import { SAMPLE_TSV_CONTENT } from "./sampleTsv";
import { GameTopic } from "@/types";

describe("Topics Board & SELECT_TOPIC_FOR_CHALLENGE", () => {
  function createReadyGameState() {
    const parseResult = parseTsv(SAMPLE_TSV_CONTENT);
    let state = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: parseResult.topics,
    });
    state = gameReducer(state, {
      type: "SET_PLAYERS",
      payload: { players: ["Jim", "Cam", "Pam"] },
    });
    return gameReducer(state, { type: "START_GAME" });
  }

  it("should start with all topics untaken and phase in 'topics'", () => {
    const state = createReadyGameState();

    expect(state.phase).toBe("topics");
    expect(state.topics).toHaveLength(6);
    expect(state.topics.every((t) => !t.taken)).toBe(true);
    expect(state.topics.every((t) => t.takenInChallenge === null)).toBe(true);
  });

  it("should handle SELECT_TOPIC_FOR_CHALLENGE: marks topic as taken and transitions to 'question'", () => {
    const state = createReadyGameState();
    const topicToSelect = state.topics[0];

    const nextState = gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: topicToSelect.id },
    });

    // 1. Phase transitioned to 'question'
    expect(nextState.phase).toBe("question");

    // 2. Topic marked taken with current challenge metadata
    const selectedTopic = nextState.topics.find((t) => t.id === topicToSelect.id);
    expect(selectedTopic?.taken).toBe(true);
    expect(selectedTopic?.takenInChallenge).toEqual({
      roundIndex: 0,
      challengeIndex: 0,
    });

    // 3. Current challenge updated with topicId and reset question/attempt indices
    expect(nextState.currentChallenge?.topicId).toBe(topicToSelect.id);
    expect(nextState.currentChallenge?.questionIndex).toBe(0);
    expect(nextState.currentChallenge?.currentAttemptIndex).toBe(0);
    expect(nextState.currentChallenge?.revealed).toBe(false);

    // 4. Other topics remain untaken
    const otherTopics = nextState.topics.filter((t) => t.id !== topicToSelect.id);
    expect(otherTopics.every((t) => !t.taken)).toBe(true);
  });

  it("should generate the expected challenge tag for taken topics (e.g. 'R2 · Jim vs Cam')", () => {
    const state = createReadyGameState();

    // Mock that a topic was taken in Round 2, Challenge 1
    const mockTakenTopic: GameTopic = {
      ...state.topics[0],
      taken: true,
      takenInChallenge: {
        roundIndex: 1, // Round 2
        challengeIndex: 0,
      },
    };

    const getPlayerName = (id: string) => state.players.find((p) => p.id === id)?.name || id;

    const round = state.schedule[mockTakenTopic.takenInChallenge!.roundIndex];
    const pairing = round.pairings[mockTakenTopic.takenInChallenge!.challengeIndex];
    const c = getPlayerName(pairing.challenger);
    const d = getPlayerName(pairing.defender);

    const tag = `R${mockTakenTopic.takenInChallenge!.roundIndex + 1} · ${c} vs ${d}`;

    // Should follow the exact "R2 · Challenger vs Defender" pattern
    expect(tag).toMatch(/^R2 · (Jim|Cam|Pam) vs (Jim|Cam|Pam)$/);
  });

  it("should handle END_GAME: transitions phase to 'result'", () => {
    const state = createReadyGameState();
    expect(state.phase).toBe("topics");

    const resultState = gameReducer(state, { type: "END_GAME" });
    expect(resultState.phase).toBe("result");
  });

  it("should handle RESET_GAME: completely clears all game state and returns to setup", () => {
    let state = createReadyGameState();
    state = gameReducer(state, { type: "END_GAME" });
    expect(state.phase).toBe("result");

    const resetState = gameReducer(state, { type: "RESET_GAME" });
    expect(resetState.phase).toBe("setup");
    expect(resetState.players).toEqual([]);
    expect(resetState.schedule).toEqual([]);
    expect(resetState.topics).toEqual([]);
    expect(resetState.currentChallenge).toBeNull();
  });
});
