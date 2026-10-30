import { describe, it, expect } from "vitest";
import { gameReducer, initialGameState } from "./gameReducer";
import { Topic, Player, GameTopic } from "@/types";

describe("gameReducer", () => {
  const sampleTopics: Topic[] = [
    {
      name: "History",
      questions: [
        {
          topicName: "History",
          qnNo: 1,
          qnText: "Q1",
          ansText: "A1",
          qnImg: [],
          ansImg: [],
          qnVid: [],
          ansVid: [],
          qnAud: [],
          ansAud: [],
        },
      ],
    },
    {
      name: "Science",
      questions: [
        {
          topicName: "Science",
          qnNo: 1,
          qnText: "Q2",
          ansText: "A2",
          qnImg: [],
          ansImg: [],
          qnVid: [],
          ansVid: [],
          qnAud: [],
          ansAud: [],
        },
      ],
    },
    {
      name: "Geography",
      questions: [
        {
          topicName: "Geography",
          qnNo: 1,
          qnText: "Q3",
          ansText: "A3",
          qnImg: [],
          ansImg: [],
          qnVid: [],
          ansVid: [],
          qnAud: [],
          ansAud: [],
        },
      ],
    },
  ];

  it("should have correct initial state", () => {
    expect(initialGameState).toEqual({
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
    });
  });

  it("should handle SET_SETTINGS correctly", () => {
    const nextState = gameReducer(initialGameState, {
      type: "SET_SETTINGS",
      payload: { directSeconds: 30, passSeconds: 15 },
    });
    expect(nextState.directSeconds).toBe(30);
    expect(nextState.passSeconds).toBe(15);
  });

  it("should handle LOAD_TOPICS correctly", () => {
    const nextState = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: sampleTopics,
    });

    expect(nextState.topics).toHaveLength(3);
    expect(nextState.topics[0]).toEqual({
      name: "History",
      id: "History",
      taken: false,
      takenInChallenge: null,
      questions: [
        {
          topicName: "History",
          qnNo: 1,
          qnText: "Q1",
          ansText: "A1",
          qnImg: [],
          ansImg: [],
          qnVid: [],
          ansVid: [],
          qnAud: [],
          ansAud: [],
        },
      ],
    });
  });

  it("should handle SET_PLAYERS with string names or objects", () => {
    const stateWithPlayers = gameReducer(initialGameState, {
      type: "SET_PLAYERS",
      payload: {
        players: ["Alice", "Bob", { id: "p3_custom", name: "Charlie" }],
      },
    });

    expect(stateWithPlayers.players).toEqual([
      { id: "p1", name: "Alice", cp: 0, cn: 0, dp: 0, pp: 0, score: 0 },
      { id: "p2", name: "Bob", cp: 0, cn: 0, dp: 0, pp: 0, score: 0 },
      { id: "p3_custom", name: "Charlie", cp: 0, cn: 0, dp: 0, pp: 0, score: 0 },
    ]);
  });

  it("should handle START_GAME by generating schedule and initializing currentChallenge", () => {
    let state = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: sampleTopics,
    });

    state = gameReducer(state, {
      type: "SET_PLAYERS",
      payload: {
        players: ["Alice", "Bob", "Charlie"],
      },
    });

    const startedState = gameReducer(state, { type: "START_GAME" });

    expect(startedState.phase).toBe("topics");
    expect(startedState.schedule).toHaveLength(1); // 3 topics / 3 = 1 round
    expect(startedState.schedule[0].pairings).toHaveLength(3);

    const firstPairing = startedState.schedule[0].pairings[0];
    expect(startedState.currentChallenge).toEqual({
      roundIndex: 0,
      challengeIndex: 0,
      topicId: null,
      questionIndex: 0,
      attemptOrder: [firstPairing.defender, firstPairing.challenger, firstPairing.third],
      currentAttemptIndex: 0,
      revealed: false,
      resolved: false,
    });
  });

  it("should not start game if players count is not 3", () => {
    const state = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: sampleTopics,
    });

    const attempted = gameReducer(state, { type: "START_GAME" });
    expect(attempted.phase).toBe("setup");
    expect(attempted.schedule).toEqual([]);
  });

  it("should handle RESTORE_STATE and RESET_GAME", () => {
    const restored = gameReducer(initialGameState, {
      type: "RESTORE_STATE",
      payload: {
        ...initialGameState,
        phase: "question",
      },
    });
    expect(restored.phase).toBe("question");

    const reset = gameReducer(restored, { type: "RESET_GAME" });
    expect(reset).toEqual(initialGameState);
  });

  it("should sanitize players on RESTORE_STATE if cp, cn, dp, pp, or score are undefined or NaN", () => {
    const legacyPlayers: Partial<Player>[] = [
      { id: "p1", name: "Jim", score: 0 },
      { id: "p2", name: "Cam", cp: undefined, cn: NaN },
      { id: "p3", name: "Sam" },
    ];

    const restored = gameReducer(initialGameState, {
      type: "RESTORE_STATE",
      payload: {
        ...initialGameState,
        players: legacyPlayers as Player[],
      },
    });

    restored.players.forEach((p) => {
      expect(typeof p.cp).toBe("number");
      expect(typeof p.cn).toBe("number");
      expect(typeof p.dp).toBe("number");
      expect(typeof p.pp).toBe("number");
      expect(typeof p.score).toBe("number");
      expect(isNaN(p.score)).toBe(false);
    });
  });

  it("should normalize legacy plain string media fields into string[] on RESTORE_STATE", () => {
    const legacyTopics = [
      {
        id: "History",
        name: "History",
        taken: false,
        takenInChallenge: null,
        questions: [
          {
            topicName: "History",
            qnNo: 1,
            qnText: "Q1",
            ansText: "A1",
            qnImg: "https://example.com/legacy-q.jpg",
            ansImg: "https://example.com/legacy-a1.jpg, https://example.com/legacy-a2.jpg",
            qnVid: "",
          },
        ],
      },
    ] as unknown as GameTopic[];

    const restored = gameReducer(initialGameState, {
      type: "RESTORE_STATE",
      payload: {
        ...initialGameState,
        topics: legacyTopics,
      },
    });

    expect(restored.topics[0].questions[0]).toEqual({
      topicName: "History",
      qnNo: 1,
      qnText: "Q1",
      ansText: "A1",
      qnImg: ["https://example.com/legacy-q.jpg"],
      ansImg: ["https://example.com/legacy-a1.jpg", "https://example.com/legacy-a2.jpg"],
      qnVid: [],
      ansVid: [],
      qnAud: [],
      ansAud: [],
    });
  });
});
