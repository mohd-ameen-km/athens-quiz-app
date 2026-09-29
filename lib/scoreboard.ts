import { Player } from "@/types";

/**
 * Calculates a player's total score as the sum of CP, CN, DP, and PP:
 * CP (Challenge Positive) = +2 each
 * CN (Challenge Negative) = −1 each
 * DP (Defended Points) = +2 each
 * PP (Passed Points) = +2 each
 * Total = CP + CN + DP + PP
 */
export function calculatePlayerTotal(player: Partial<Player>): number {
  const cp = typeof player?.cp === "number" && !isNaN(player.cp) ? player.cp : 0;
  const cn = typeof player?.cn === "number" && !isNaN(player.cn) ? player.cn : 0;
  const dp = typeof player?.dp === "number" && !isNaN(player.dp) ? player.dp : 0;
  const pp = typeof player?.pp === "number" && !isNaN(player.pp) ? player.pp : 0;
  return cp + cn + dp + pp;
}

/**
 * Formats a score cell for display in the fixed scoreboard table:
 * CP / DP / PP: e.g. "+2", "+4", "0"
 * CN: e.g. "-1", "-2", "0"
 * Total: e.g. "2", "-1", "0"
 */
export function formatScoreCell(
  value: number | undefined | null,
  type: "cp" | "cn" | "dp" | "pp" | "total"
): string {
  const num = typeof value === "number" && !isNaN(value) ? value : 0;
  if (type === "cn" || type === "total") {
    return String(num);
  }
  if (num > 0) {
    return `+${num}`;
  }
  return String(num);
}
