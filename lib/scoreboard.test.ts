import { describe, it, expect } from "vitest";
import { calculatePlayerTotal, formatScoreCell } from "./scoreboard";
import { Player } from "@/types";

describe("Scoreboard table logic and scoring formula", () => {
  it("calculates Total = CP + CN + DP + PP correctly", () => {
    const player: Player = {
      id: "p1",
      name: "Jim",
      cp: 4, // 2 successful challenges (+4)
      cn: -2, // 2 failed direct challenges (−2)
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
});
