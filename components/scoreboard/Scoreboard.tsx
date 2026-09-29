"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { cn } from "@/lib/utils";
import { formatScoreCell, calculatePlayerTotal } from "@/lib/scoreboard";
import { Trophy } from "lucide-react";

export interface ScoreboardProps {
  className?: string;
  compact?: boolean;
}

export function Scoreboard({ className, compact }: ScoreboardProps) {
  const { state } = useGame();

  const currentChallenge = state.currentChallenge;
  const currentRoundIndex = currentChallenge?.roundIndex ?? 0;
  const currentChallengeIndex = currentChallenge?.challengeIndex ?? 0;

  const currentRound = state.schedule[currentRoundIndex];
  const currentPairing = currentRound?.pairings[currentChallengeIndex];

  const challengerId = currentPairing?.challenger;
  const defenderId = currentPairing?.defender;

  // Active attempt player ID in question phase
  const currentAttemptIndex = currentChallenge?.currentAttemptIndex ?? 0;
  const activeAttemptPlayerId = currentChallenge?.attemptOrder?.[currentAttemptIndex];

  return (
    <div
      className={cn(
        "rounded-[4px] surface-glass border border-ink/10 overflow-hidden shadow-2xs",
        compact ? "p-2.5 sm:p-3 space-y-2" : "p-4 sm:p-5 space-y-3.5",
        className
      )}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between border-b border-ink/8 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Trophy className={cn("text-ink shrink-0", compact ? "w-3.5 h-3.5" : "w-4 h-4")} />
          <h3
            className={cn(
              "font-heading font-normal text-ink",
              compact ? "text-sm" : "text-base sm:text-lg"
            )}
          >
            Scoreboard
          </h3>
        </div>
        {currentChallenge && (
          <span
            className={cn(
              "font-mono text-muted-foreground bg-ink/5 rounded-[2px] border border-ink/10",
              compact ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"
            )}
          >
            R{currentRoundIndex + 1} · C{currentChallengeIndex + 1}
          </span>
        )}
      </div>

      {compact ? (
        /* Compact Mode (Question Page Sidebar): Only shows player name and total score */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse select-none">
            <thead>
              <tr className="border-b border-ink/12 font-mono uppercase tracking-wider text-muted-foreground text-[11px]">
                <th className="py-1.5 px-2 font-semibold">Player</th>
                <th className="py-1.5 px-2 text-right font-bold text-ink">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/8 text-sm font-mono">
              {state.players.map((player) => {
                const isActiveAttempt = Boolean(
                  activeAttemptPlayerId && player.id === activeAttemptPlayerId
                );
                const isDefender = player.id === defenderId;
                const isChallenger = player.id === challengerId;

                const rowHighlight = isActiveAttempt
                  ? isDefender
                    ? "bg-[#bfe3ff]/30 text-ink font-medium"
                    : isChallenger
                      ? "bg-[#ffe14d]/30 text-ink font-medium"
                      : "bg-[#ff9ec4]/25 text-ink font-medium"
                  : isDefender
                    ? "bg-[#bfe3ff]/10 hover:bg-[#bfe3ff]/20"
                    : isChallenger
                      ? "bg-[#ffe14d]/10 hover:bg-[#ffe14d]/20"
                      : "hover:bg-ink/5";

                const score = calculatePlayerTotal(player);

                return (
                  <tr
                    key={player.id}
                    className={cn("transition-colors duration-150", rowHighlight)}
                  >
                    <td className="py-2 px-2 font-sans font-medium text-ink truncate">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {isActiveAttempt && (
                          <span
                            className={cn(
                              "w-2 h-2 rounded-full shrink-0 animate-pulse",
                              isDefender
                                ? "bg-[#2986cc]"
                                : isChallenger
                                  ? "bg-[#d6a500]"
                                  : "bg-[#e05286]"
                            )}
                            title="Active Turn"
                          />
                        )}
                        <span className="truncate" title={player.name}>
                          {player.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 px-2 text-right font-heading text-base font-bold text-ink whitespace-nowrap">
                      {score}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        /* Full Mode (Topics Board Page): Shows full table with CP | CN | DP | PP | Total and Legend */
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-ink/12 font-mono uppercase tracking-wider text-muted-foreground text-[11px]">
                  <th className="py-1.5 px-2 font-semibold">Player</th>
                  <th className="py-1.5 px-1.5 text-center font-semibold">CP</th>
                  <th className="py-1.5 px-1.5 text-center font-semibold">CN</th>
                  <th className="py-1.5 px-1.5 text-center font-semibold">DP</th>
                  <th className="py-1.5 px-1.5 text-center font-semibold">PP</th>
                  <th className="py-1.5 px-2 text-right font-bold text-ink">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8 text-xs sm:text-sm font-mono">
                {state.players.map((player) => {
                  const isActiveAttempt = Boolean(
                    activeAttemptPlayerId && player.id === activeAttemptPlayerId
                  );
                  const isDefender = player.id === defenderId;
                  const isChallenger = player.id === challengerId;

                  const rowHighlight = isActiveAttempt
                    ? isDefender
                      ? "bg-[#bfe3ff]/30 text-ink font-medium"
                      : isChallenger
                        ? "bg-[#ffe14d]/30 text-ink font-medium"
                        : "bg-[#ff9ec4]/25 text-ink font-medium"
                    : isDefender
                      ? "bg-[#bfe3ff]/10 hover:bg-[#bfe3ff]/20"
                      : isChallenger
                        ? "bg-[#ffe14d]/10 hover:bg-[#ffe14d]/20"
                        : "hover:bg-ink/5";

                  const score = calculatePlayerTotal(player);

                  return (
                    <tr
                      key={player.id}
                      className={cn("transition-colors duration-150", rowHighlight)}
                    >
                      {/* Player column */}
                      <td className="py-2 px-2 font-sans font-medium text-ink min-w-[90px] max-w-[140px] truncate">
                        <div className="flex items-center gap-1.5 truncate">
                          {isActiveAttempt && (
                            <span
                              className={cn(
                                "w-2 h-2 rounded-full shrink-0 animate-pulse",
                                isDefender
                                  ? "bg-[#2986cc]"
                                  : isChallenger
                                    ? "bg-[#d6a500]"
                                    : "bg-[#e05286]"
                              )}
                              title="Active Turn"
                            />
                          )}
                          <span className="truncate">{player.name}</span>
                        </div>
                      </td>

                      {/* CP (Challenge Positive) */}
                      <td
                        className={cn(
                          "py-2 px-1.5 text-center font-mono whitespace-nowrap",
                          (player.cp ?? 0) > 0
                            ? "text-[#145388] font-bold"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {formatScoreCell(player.cp, "cp")}
                      </td>

                      {/* CN (Challenge Negative) */}
                      <td
                        className={cn(
                          "py-2 px-1.5 text-center font-mono whitespace-nowrap",
                          (player.cn ?? 0) < 0
                            ? "text-[#a51642] font-bold"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {formatScoreCell(player.cn, "cn")}
                      </td>

                      {/* DP (Defended Points) */}
                      <td
                        className={cn(
                          "py-2 px-1.5 text-center font-mono whitespace-nowrap",
                          (player.dp ?? 0) > 0
                            ? "text-[#145388] font-bold"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {formatScoreCell(player.dp, "dp")}
                      </td>

                      {/* PP (Passed Points) */}
                      <td
                        className={cn(
                          "py-2 px-1.5 text-center font-mono whitespace-nowrap",
                          (player.pp ?? 0) > 0
                            ? "text-[#145388] font-bold"
                            : "text-muted-foreground/60"
                        )}
                      >
                        {formatScoreCell(player.pp, "pp")}
                      </td>

                      {/* Total = CP + CN + DP + PP */}
                      <td className="py-2 px-2 text-right font-heading text-sm sm:text-base font-semibold text-ink whitespace-nowrap">
                        {score}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend / Key Footer */}
          <div className="pt-2 border-t border-ink/8 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-[10px] font-mono text-muted-foreground">
            <span>CP: Challenge (+2)</span>
            <span>CN: Penalty (−1)</span>
            <span>DP: Defense (+2)</span>
            <span>PP: Pass (+2)</span>
            <span className="text-ink font-semibold">Total = CP + CN + DP + PP</span>
          </div>
        </>
      )}
    </div>
  );
}

export default Scoreboard;
