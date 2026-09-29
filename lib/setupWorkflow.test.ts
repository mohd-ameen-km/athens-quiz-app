import { describe, it, expect } from "vitest";
import { gameReducer, initialGameState } from "./gameReducer";
import { parseTsv } from "./parseTsv";
import { SAMPLE_TSV_CONTENT } from "./sampleTsv";

describe("Home / Setup Workflow", () => {
  it("should process valid TSV file contents and update topics in state", () => {
    const parseResult = parseTsv(SAMPLE_TSV_CONTENT);
    expect(parseResult.errors).toEqual([]);
    expect(parseResult.topics).toHaveLength(6);

    const stateWithTopics = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: parseResult.topics,
    });

    expect(stateWithTopics.topics).toHaveLength(6);
    expect(stateWithTopics.topics.every((t) => !t.taken)).toBe(true);
  });

  it("should catch validation errors from invalid TSV contents", () => {
    // 4 topics (not a multiple of 3)
    const invalidTsv = [
      "TopicName\tQnNo\tQnText\tAnsText\tQnImg\tAnsImg\tQnVid\tAnsVid\tQnAud\tAnsAud",
      "T1\t1\tQ1\tA1\t\t\t\t\t\t",
      "T2\t1\tQ2\tA2\t\t\t\t\t\t",
      "T3\t1\tQ3\tA3\t\t\t\t\t\t",
      "T4\t1\tQ4\tA4\t\t\t\t\t\t",
    ].join("\n");

    const parseResult = parseTsv(invalidTsv);
    expect(parseResult.errors).toContain("Expected a multiple of 3 topics, got 4");
  });

  it("should execute full setup-to-start flow: TSV -> players -> settings -> START_GAME", () => {
    // 1. Initial State
    let state = initialGameState;
    expect(state.phase).toBe("setup");
    expect(state.directSeconds).toBe(25);
    expect(state.passSeconds).toBe(20);

    // 2. Load Topics
    const parseResult = parseTsv(SAMPLE_TSV_CONTENT);
    state = gameReducer(state, {
      type: "LOAD_TOPICS",
      payload: parseResult.topics,
    });
    expect(state.topics).toHaveLength(6);

    // 3. Set Players in entered order
    const enteredPlayers = ["Alex", "Blair", "Chris"];
    state = gameReducer(state, {
      type: "SET_PLAYERS",
      payload: { players: enteredPlayers },
    });
    expect(state.players.map((p) => p.name)).toEqual(["Alex", "Blair", "Chris"]);

    // 4. Set Settings
    state = gameReducer(state, {
      type: "SET_SETTINGS",
      payload: { directSeconds: 30, passSeconds: 15 },
    });
    expect(state.directSeconds).toBe(30);
    expect(state.passSeconds).toBe(15);

    // 5. Start Game
    state = gameReducer(state, { type: "START_GAME" });

    // Verifications after Start Game:
    // Transition to topics phase
    expect(state.phase).toBe("topics");

    // Schedule computed (6 topics / 3 = 2 rounds)
    expect(state.schedule).toHaveLength(2);
    expect(state.schedule[0].pairings).toHaveLength(3);
    expect(state.schedule[1].pairings).toHaveLength(3);

    // Current challenge initialized
    expect(state.currentChallenge).not.toBeNull();
    expect(state.currentChallenge?.roundIndex).toBe(0);
    expect(state.currentChallenge?.challengeIndex).toBe(0);
    expect(state.currentChallenge?.topicId).toBeNull();
    expect(state.currentChallenge?.revealed).toBe(false);

    // Attempt order: [defender, challenger, third] for the first pairing
    const firstPairing = state.schedule[0].pairings[0];
    expect(state.currentChallenge?.attemptOrder).toEqual([
      firstPairing.defender,
      firstPairing.challenger,
      firstPairing.third,
    ]);
  });
});
