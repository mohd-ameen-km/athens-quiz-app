import { describe, it, expect } from "vitest";
import { gameReducer, initialGameState } from "./gameReducer";
import { parseTsv } from "./parseTsv";
import { SAMPLE_TSV_CONTENT } from "./sampleTsv";

describe("Question Page Workflow & Action Handlers (MARK_RESULT, NEXT_QUESTION, NEXT_CHALLENGE)", () => {
  function createQuestionPhaseState() {
    const parseResult = parseTsv(SAMPLE_TSV_CONTENT);
    let state = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: parseResult.topics,
    });
    state = gameReducer(state, {
      type: "SET_PLAYERS",
      payload: { players: ["Alex", "Blair", "Chris"] },
    });
    state = gameReducer(state, { type: "START_GAME" });
    // Select the first topic
    return gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: state.topics[0].id },
    });
  }

  it("should initialize in question phase with unrevealed state, fixed attemptOrder [defender, challenger, third], and defender attempt first", () => {
    const state = createQuestionPhaseState();
    const challenge = state.currentChallenge!;
    const pairing = state.schedule[challenge.roundIndex].pairings[challenge.challengeIndex];

    expect(state.phase).toBe("question");
    expect(challenge.revealed).toBe(false);
    expect(challenge.questionIndex).toBe(0);
    expect(challenge.currentAttemptIndex).toBe(0);

    // attemptOrder is strictly [defender, challenger, third]
    expect(challenge.attemptOrder).toEqual([pairing.defender, pairing.challenger, pairing.third]);
  });

  describe("MARK_RESULT Scoring Table & Running Counters", () => {
    it("Defender answers correct: defender DP +2, challenger CN -1, Total = CP+CN+DP+PP, resolved true, revealed stays false", () => {
      const state = createQuestionPhaseState();
      const defenderId = state.currentChallenge!.attemptOrder[0];
      const challengerId = state.currentChallenge!.attemptOrder[1];
      const thirdId = state.currentChallenge!.attemptOrder[2];

      const nextState = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: true },
      });

      const defender = nextState.players.find((p) => p.id === defenderId)!;
      const challenger = nextState.players.find((p) => p.id === challengerId)!;
      const third = nextState.players.find((p) => p.id === thirdId)!;

      // Counters & Scores
      expect(defender.dp).toBe(2);
      expect(defender.score).toBe(2);

      expect(challenger.cn).toBe(-1);
      expect(challenger.score).toBe(-1);

      expect(third.score).toBe(0);

      // Total = CP + CN + DP + PP
      expect(defender.score).toBe(defender.cp + defender.cn + defender.dp + defender.pp);
      expect(challenger.score).toBe(challenger.cp + challenger.cn + challenger.dp + challenger.pp);

      // Safety requirement: resolved is true, but revealed stays false until explicitly revealed!
      expect(nextState.currentChallenge?.resolved).toBe(true);
      expect(nextState.currentChallenge?.revealed).toBe(false);

      // Explicit Reveal Answer independently sets revealed to true
      const revealedState = gameReducer(nextState, { type: "REVEAL_ANSWER" });
      expect(revealedState.currentChallenge?.revealed).toBe(true);
      expect(revealedState.currentChallenge?.resolved).toBe(true);
    });

    it("Defender wrong; challenger answers correct: challenger CP +2, defender unchanged, revealed stays false", () => {
      let state = createQuestionPhaseState();
      const defenderId = state.currentChallenge!.attemptOrder[0];
      const challengerId = state.currentChallenge!.attemptOrder[1];
      const thirdId = state.currentChallenge!.attemptOrder[2];

      // 1. Defender answers wrong (advance attempt 0 -> 1)
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: false },
      });
      expect(state.currentChallenge?.currentAttemptIndex).toBe(1);
      expect(state.currentChallenge?.resolved).toBe(false);
      expect(state.currentChallenge?.revealed).toBe(false);
      expect(state.players.every((p) => p.score === 0)).toBe(true);

      // 2. Challenger answers correct
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: true },
      });

      const defender = state.players.find((p) => p.id === defenderId)!;
      const challenger = state.players.find((p) => p.id === challengerId)!;
      const third = state.players.find((p) => p.id === thirdId)!;

      // Scores: challenger CP +2, defender unchanged (0), third (0)
      expect(defender.score).toBe(0);
      expect(challenger.cp).toBe(2);
      expect(challenger.score).toBe(2);
      expect(third.score).toBe(0);

      // Safety requirement: resolved is true, revealed stays false
      expect(state.currentChallenge?.resolved).toBe(true);
      expect(state.currentChallenge?.revealed).toBe(false);
    });

    it("Defender wrong; challenger wrong; third player answers correct: third player PP +2, defender and challenger unchanged", () => {
      let state = createQuestionPhaseState();
      const defenderId = state.currentChallenge!.attemptOrder[0];
      const challengerId = state.currentChallenge!.attemptOrder[1];
      const thirdId = state.currentChallenge!.attemptOrder[2];

      // 1. Defender wrong (attempt 0 -> 1)
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: false },
      });
      expect(state.currentChallenge?.currentAttemptIndex).toBe(1);
      expect(state.currentChallenge?.resolved).toBe(false);

      // 2. Challenger wrong (attempt 1 -> 2)
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: false },
      });
      expect(state.currentChallenge?.currentAttemptIndex).toBe(2);
      expect(state.currentChallenge?.resolved).toBe(false);

      // 3. Third player correct
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: true },
      });

      const defender = state.players.find((p) => p.id === defenderId)!;
      const challenger = state.players.find((p) => p.id === challengerId)!;
      const third = state.players.find((p) => p.id === thirdId)!;

      // Scores: third PP +2, defender and challenger unchanged (0)
      expect(defender.score).toBe(0);
      expect(challenger.score).toBe(0);
      expect(third.pp).toBe(2);
      expect(third.score).toBe(2);

      // Safety requirement: resolved is true, revealed stays false
      expect(state.currentChallenge?.resolved).toBe(true);
      expect(state.currentChallenge?.revealed).toBe(false);
    });

    it("All three wrong (attempts exhausted): no score changes, resolved true, revealed stays false", () => {
      let state = createQuestionPhaseState();

      // 1. Defender wrong
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: false },
      });
      // 2. Challenger wrong
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: false },
      });
      // 3. Third wrong (exhausted)
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: false },
      });

      // No score changes
      expect(state.players.every((p) => p.score === 0)).toBe(true);
      expect(state.players.every((p) => p.cp === 0 && p.cn === 0 && p.dp === 0 && p.pp === 0)).toBe(
        true
      );
      // Safety requirement: resolved is true, but revealed remains false!
      expect(state.currentChallenge?.resolved).toBe(true);
      expect(state.currentChallenge?.revealed).toBe(false);

      // Explicit reveal
      const revealedState = gameReducer(state, { type: "REVEAL_ANSWER" });
      expect(revealedState.currentChallenge?.revealed).toBe(true);
      expect(revealedState.currentChallenge?.resolved).toBe(true);
    });
  });

  describe("REVEAL_ANSWER & Safety Requirement", () => {
    it("should reveal answer without altering scores", () => {
      const state = createQuestionPhaseState();
      expect(state.currentChallenge?.revealed).toBe(false);

      const nextState = gameReducer(state, { type: "REVEAL_ANSWER" });
      expect(nextState.currentChallenge?.revealed).toBe(true);
      expect(nextState.players.every((p) => p.score === 0)).toBe(true);
    });

    it("safety requirement: clicking Correct records outcome and sets resolved = true, but does NOT set revealed = true", () => {
      const state = createQuestionPhaseState();
      const defenderId = state.currentChallenge!.attemptOrder[0];

      // Mark defender correct
      const markedState = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: true },
      });

      // Score updated
      const defender = markedState.players.find((p) => p.id === defenderId)!;
      expect(defender.score).toBe(2);

      // Attempt resolved, but answer remains hidden for shared screen safety!
      expect(markedState.currentChallenge?.resolved).toBe(true);
      expect(markedState.currentChallenge?.revealed).toBe(false);

      // Further MARK_RESULT dispatches are ignored once resolved
      const ignoredState = gameReducer(markedState, {
        type: "MARK_RESULT",
        payload: { correct: true },
      });
      expect(ignoredState).toBe(markedState);

      // Reveal Answer is available as an independent action at any point after that
      const revealedState = gameReducer(markedState, { type: "REVEAL_ANSWER" });
      expect(revealedState.currentChallenge?.revealed).toBe(true);
      expect(revealedState.currentChallenge?.resolved).toBe(true);
    });

    it("safety requirement: clicking Wrong for all attempts sets resolved = true, but answer stays hidden until Reveal is clicked", () => {
      let state = createQuestionPhaseState();

      // Attempt 1 (Defender): Wrong -> not resolved, not revealed
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      expect(state.currentChallenge?.resolved).toBe(false);
      expect(state.currentChallenge?.revealed).toBe(false);

      // Attempt 2 (Challenger): Wrong -> not resolved, not revealed
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      expect(state.currentChallenge?.resolved).toBe(false);
      expect(state.currentChallenge?.revealed).toBe(false);

      // Attempt 3 (Third): Wrong -> attempts exhausted, resolved = true, but revealed remains FALSE
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      expect(state.currentChallenge?.resolved).toBe(true);
      expect(state.currentChallenge?.revealed).toBe(false);

      // Host explicitly reveals answer when ready
      const revealedState = gameReducer(state, { type: "REVEAL_ANSWER" });
      expect(revealedState.currentChallenge?.revealed).toBe(true);
      expect(revealedState.currentChallenge?.resolved).toBe(true);
    });

    it("Reveal Answer can be clicked before marking without preventing outcome resolution", () => {
      let state = createQuestionPhaseState();

      // Host reveals answer early
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      expect(state.currentChallenge?.revealed).toBe(true);
      expect(state.currentChallenge?.resolved).toBe(false);

      // Host can still mark outcome
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: true } });
      expect(state.currentChallenge?.resolved).toBe(true);
      expect(state.currentChallenge?.revealed).toBe(true);
    });
  });

  describe("NEXT_QUESTION & NEXT_CHALLENGE Flow", () => {
    it("advances questionIndex, resets currentAttemptIndex to 0 and revealed to false, keeping same attemptOrder", () => {
      let state = createQuestionPhaseState();
      const initialAttemptOrder = [...state.currentChallenge!.attemptOrder];

      // Simulate defender wrong then answer revealed
      state = gameReducer(state, {
        type: "MARK_RESULT",
        payload: { correct: false },
      });
      expect(state.currentChallenge?.currentAttemptIndex).toBe(1);

      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      expect(state.currentChallenge?.revealed).toBe(true);

      // Advance to next question (sample topics have 2 questions)
      state = gameReducer(state, { type: "NEXT_QUESTION" });

      expect(state.phase).toBe("question");
      expect(state.currentChallenge?.questionIndex).toBe(1);
      expect(state.currentChallenge?.currentAttemptIndex).toBe(0);
      expect(state.currentChallenge?.revealed).toBe(false);
      expect(state.currentChallenge?.attemptOrder).toEqual(initialAttemptOrder);
    });

    it("when topic questions are exhausted, dispatches into NEXT_CHALLENGE and returns to topics board", () => {
      let state = createQuestionPhaseState();

      // Q1 done
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" }); // Question 1 -> 2

      // Q2 done (last question for this topic)
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" }); // Exhausted!

      // Transitions to topics phase so challenger can pick topic
      expect(state.phase).toBe("topics");
      expect(state.currentChallenge?.roundIndex).toBe(0);
      expect(state.currentChallenge?.challengeIndex).toBe(1);
      expect(state.currentChallenge?.topicId).toBeNull();
      expect(state.currentChallenge?.questionIndex).toBe(0);
      expect(state.currentChallenge?.currentAttemptIndex).toBe(0);
      expect(state.currentChallenge?.revealed).toBe(false);

      // Verify the new attemptOrder matches the next pairing: [defender, challenger, third]
      const nextPairing = state.schedule[0].pairings[1];
      expect(state.currentChallenge?.attemptOrder).toEqual([
        nextPairing.defender,
        nextPairing.challenger,
        nextPairing.third,
      ]);
    });

    it("advances from round to round, and surfaces End Game when schedule is finished", () => {
      // Create minimal game with 3 topics (1 round of 3 challenges)
      const parseResult = parseTsv(SAMPLE_TSV_CONTENT);
      // Take first 3 topics
      const threeTopics = parseResult.topics.slice(0, 3);
      let state = gameReducer(initialGameState, {
        type: "LOAD_TOPICS",
        payload: threeTopics,
      });
      state = gameReducer(state, {
        type: "SET_PLAYERS",
        payload: { players: ["P1", "P2", "P3"] },
      });
      state = gameReducer(state, { type: "START_GAME" });

      expect(state.schedule).toHaveLength(1); // 1 round of 3 pairings

      // Challenge 0: Select topic 0
      state = gameReducer(state, {
        type: "SELECT_TOPIC_FOR_CHALLENGE",
        payload: { topicId: state.topics[0].id },
      });
      // Complete Q1 and Q2
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" });
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" }); // completes challenge 0

      expect(state.phase).toBe("topics");
      expect(state.currentChallenge?.challengeIndex).toBe(1);

      // Challenge 1: Select topic 1
      state = gameReducer(state, {
        type: "SELECT_TOPIC_FOR_CHALLENGE",
        payload: { topicId: state.topics[1].id },
      });
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" });
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" }); // completes challenge 1

      expect(state.phase).toBe("topics");
      expect(state.currentChallenge?.challengeIndex).toBe(2);

      // Challenge 2: Select topic 2
      state = gameReducer(state, {
        type: "SELECT_TOPIC_FOR_CHALLENGE",
        payload: { topicId: state.topics[2].id },
      });
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" });
      state = gameReducer(state, { type: "REVEAL_ANSWER" });
      state = gameReducer(state, { type: "NEXT_QUESTION" }); // completes challenge 2 (and round 0, which is all rounds!)

      // Entire schedule is finished:
      // phase should be "topics" and currentChallenge should be null (surfacing End Game)
      expect(state.phase).toBe("topics");
      expect(state.currentChallenge).toBeNull();

      // Dispatching END_GAME transitions to "result" phase
      const resultState = gameReducer(state, { type: "END_GAME" });
      expect(resultState.phase).toBe("result");
    });
  });
});
