import { describe, it, expect } from "vitest";
import { calculatePlayerTotal, formatScoreCell } from "./scoreboard";
import { gameReducer, initialGameState } from "./gameReducer";
import { parseTsv } from "./parseTsv";
import { SAMPLE_TSV_CONTENT } from "./sampleTsv";
import { Player } from "@/types";

describe("Scoreboard table logic and scoring formula", () => {
  function createQuestionState() {
    const parseResult = parseTsv(SAMPLE_TSV_CONTENT);
    let state = gameReducer(initialGameState, {
      type: "LOAD_TOPICS",
      payload: parseResult.topics,
    });
    state = gameReducer(state, {
      type: "SET_PLAYERS",
      payload: { players: ["Jim", "Cam", "Alex"] },
    });
    state = gameReducer(state, { type: "START_GAME" });
    return gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: state.topics[0].id },
    });
  }

  it("calculates Total = CP + CN + DP + PP correctly", () => {
    const player: Player = {
      id: "p1",
      name: "Jim",
      cp: 4, // 2 successful challenges (+4)
      cn: -2, // 2 challenger penalties (−2)
      dp: 6, // 3 successful defenses (+6)
      pp: 2, // 1 successful pass as third (+2)
      score: 10,
    };

    const total = calculatePlayerTotal(player);
    expect(total).toBe(10);
    expect(player.cp + player.cn + player.dp + player.pp).toBe(10);
  });

  it("handles negative total score if penalties exceed points", () => {
    const player: Player = {
      id: "p2",
      name: "Cam",
      cp: 0,
      cn: -3,
      dp: 0,
      pp: 0,
      score: -3,
    };

    expect(calculatePlayerTotal(player)).toBe(-3);
  });

  it("formats score cells properly for CP, CN, DP, PP, and Total", () => {
    expect(formatScoreCell(2, "cp")).toBe("+2");
    expect(formatScoreCell(0, "cp")).toBe("0");
    expect(formatScoreCell(-1, "cn")).toBe("-1");
    expect(formatScoreCell(0, "cn")).toBe("0");
    expect(formatScoreCell(4, "dp")).toBe("+4");
    expect(formatScoreCell(2, "pp")).toBe("+2");
    expect(formatScoreCell(7, "total")).toBe("7");
    expect(formatScoreCell(-2, "total")).toBe("-2");
  });

  it("never produces undefined or NaN when fields are missing, undefined, or NaN", () => {
    const corruptPlayer: Partial<Player> = {
      id: "p3",
      name: "Alex",
      cp: undefined,
      cn: NaN,
      dp: undefined,
      pp: undefined,
    };

    expect(calculatePlayerTotal(corruptPlayer)).toBe(0);
    expect(formatScoreCell(corruptPlayer.cp, "cp")).toBe("0");
    expect(formatScoreCell(corruptPlayer.cn, "cn")).toBe("0");
    expect(formatScoreCell(corruptPlayer.dp, "dp")).toBe("0");
    expect(formatScoreCell(corruptPlayer.pp, "pp")).toBe("0");
    expect(formatScoreCell(corruptPlayer.score, "total")).toBe("0");
  });

  describe("MARK_RESULT scoring table paths and invariants", () => {
    it("Defender Correct: defender +2 (dp), challenger -1 (cn), question ends", () => {
      const state = createQuestionState();
      const [defenderId, challengerId, thirdId] = state.currentChallenge!.attemptOrder;

      const next = gameReducer(state, { type: "MARK_RESULT", payload: { correct: true } });
      const defender = next.players.find((p) => p.id === defenderId)!;
      const challenger = next.players.find((p) => p.id === challengerId)!;
      const third = next.players.find((p) => p.id === thirdId)!;

      expect(defender).toMatchObject({ cp: 0, cn: 0, dp: 2, pp: 0, score: 2 });
      expect(challenger).toMatchObject({ cp: 0, cn: -1, dp: 0, pp: 0, score: -1 });
      expect(third).toMatchObject({ cp: 0, cn: 0, dp: 0, pp: 0, score: 0 });
      expect(calculatePlayerTotal(defender)).toBe(2);
      expect(calculatePlayerTotal(challenger)).toBe(-1);
      expect(next.currentChallenge?.resolved).toBe(true);
    });

    it("Defender Wrong -> Challenger Correct: challenger +2 (cp), question ends", () => {
      let state = createQuestionState();
      const [defenderId, challengerId, thirdId] = state.currentChallenge!.attemptOrder;

      // Defender Wrong: no score change; moves to challenger
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      expect(state.currentChallenge?.currentAttemptIndex).toBe(1);
      expect(state.currentChallenge?.resolved).toBe(false);
      expect(state.players.every((p) => calculatePlayerTotal(p) === 0)).toBe(true);

      // Challenger Correct: challenger +2 (cp); question ends
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: true } });
      const defender = state.players.find((p) => p.id === defenderId)!;
      const challenger = state.players.find((p) => p.id === challengerId)!;
      const third = state.players.find((p) => p.id === thirdId)!;

      expect(defender).toMatchObject({ cp: 0, cn: 0, dp: 0, pp: 0, score: 0 });
      expect(challenger).toMatchObject({ cp: 2, cn: 0, dp: 0, pp: 0, score: 2 });
      expect(third).toMatchObject({ cp: 0, cn: 0, dp: 0, pp: 0, score: 0 });
      expect(calculatePlayerTotal(challenger)).toBe(2);
      expect(state.currentChallenge?.resolved).toBe(true);
    });

    it("Defender Wrong -> Challenger Wrong -> Third player Correct: challenger -1 (cn), third +2 (pp), question ends", () => {
      let state = createQuestionState();
      const [defenderId, challengerId, thirdId] = state.currentChallenge!.attemptOrder;

      // Defender Wrong: no score change
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      // Challenger Wrong: challenger -1 (cn); moves to third player
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      expect(state.currentChallenge?.currentAttemptIndex).toBe(2);
      expect(state.currentChallenge?.resolved).toBe(false);
      expect(state.players.find((p) => p.id === challengerId)?.cn).toBe(-1);

      // Third player Correct: third +2 (pp)
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: true } });
      const defender = state.players.find((p) => p.id === defenderId)!;
      const challenger = state.players.find((p) => p.id === challengerId)!;
      const third = state.players.find((p) => p.id === thirdId)!;

      expect(defender).toMatchObject({ cp: 0, cn: 0, dp: 0, pp: 0, score: 0 });
      expect(challenger).toMatchObject({ cp: 0, cn: -1, dp: 0, pp: 0, score: -1 });
      expect(third).toMatchObject({ cp: 0, cn: 0, dp: 0, pp: 2, score: 2 });
      expect(calculatePlayerTotal(third)).toBe(2);
      expect(state.currentChallenge?.resolved).toBe(true);
    });

    it("Defender Wrong -> Challenger Wrong -> Third player Wrong: challenger -1 (cn), third no score change, question ends", () => {
      let state = createQuestionState();
      const [defenderId, challengerId, thirdId] = state.currentChallenge!.attemptOrder;

      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });
      state = gameReducer(state, { type: "MARK_RESULT", payload: { correct: false } });

      const defender = state.players.find((p) => p.id === defenderId)!;
      const challenger = state.players.find((p) => p.id === challengerId)!;
      const third = state.players.find((p) => p.id === thirdId)!;

      expect(defender).toMatchObject({ cp: 0, cn: 0, dp: 0, pp: 0, score: 0 });
      expect(challenger).toMatchObject({ cp: 0, cn: -1, dp: 0, pp: 0, score: -1 });
      expect(third).toMatchObject({ cp: 0, cn: 0, dp: 0, pp: 0, score: 0 });
      expect(state.currentChallenge?.resolved).toBe(true);
    });

    it("challenger never loses more than 1 point on a single question and defender never loses any", () => {
      const paths: boolean[][] = [
        [true],
        [false, true],
        [false, false, true],
        [false, false, false],
      ];

      for (const path of paths) {
        let state = createQuestionState();
        const [defenderId, challengerId] = state.currentChallenge!.attemptOrder;

        for (const correct of path) {
          state = gameReducer(state, { type: "MARK_RESULT", payload: { correct } });
          const defender = state.players.find((p) => p.id === defenderId)!;
          const challenger = state.players.find((p) => p.id === challengerId)!;

          expect(challenger.cn).toBeGreaterThanOrEqual(-1);
          expect(calculatePlayerTotal(challenger)).toBeGreaterThanOrEqual(-1);
          expect(defender.cn).toBe(0);
          expect(calculatePlayerTotal(defender)).toBeGreaterThanOrEqual(0);
        }
      }
    });
  });
});
