"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatScoreCell, calculatePlayerTotal } from "@/lib/scoreboard";
import { cn } from "@/lib/utils";
import { Trophy, Medal, RotateCcw, Sparkles } from "lucide-react";

export function ResultScreen() {
  const { state, resetGame } = useGame();

  // Rank players by total score descending
  const rankedPlayers = [...state.players].sort(
    (a, b) => calculatePlayerTotal(b) - calculatePlayerTotal(a)
  );
  const topScore = calculatePlayerTotal(rankedPlayers[0]);
  const winners = rankedPlayers.filter((p) => calculatePlayerTotal(p) === topScore);
  const isTie = winners.length > 1;

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 space-y-10 animate-in fade-in duration-300">
      {/* Header */}
      <div className="text-center space-y-2 border-b border-ink/10 pb-6">
        <h1 className="font-heading text-4xl sm:text-5xl font-normal text-ink tracking-tight">
          Final Standings
        </h1>
      </div>

      {/* Podium Cards with Distinct Accent Washes */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 items-end">
        {rankedPlayers.map((player, index) => {
          const isWinner = player.score === topScore;

          const podiumStyles = isWinner
            ? {
                cardStyle:
                  "bg-[rgb(255_225_77/0.22)] border-2 border-[#d6a500] ring-2 ring-[#ffe14d]/60 shadow-lg sm:-translate-y-2",
                badgeVariant: "yellow" as const,
                iconContainer: "bg-[#ffe14d] text-ink border border-[#d6a500]",
                icon: <Trophy className="w-6 h-6 text-ink" />,
                badgeLabel: isTie ? "Co-Champion" : "1st Place",
              }
            : index === 1
              ? {
                  cardStyle: "bg-[rgb(191_227_255/0.22)] border-2 border-[#bfe3ff] shadow-sm",
                  badgeVariant: "blue" as const,
                  iconContainer: "bg-[#bfe3ff] text-[#145388] border border-[#2986cc]/60",
                  icon: <Medal className="w-5 h-5 text-[#145388]" />,
                  badgeLabel: "2nd Place",
                }
              : {
                  cardStyle: "bg-[rgb(255_158_196/0.18)] border-2 border-[#ff9ec4] shadow-sm",
                  badgeVariant: "pink" as const,
                  iconContainer: "bg-[#ff9ec4] text-[#780d34] border border-[#ff70a5]",
                  icon: <Medal className="w-5 h-5 text-[#780d34]" />,
                  badgeLabel: "3rd Place",
                };

          return (
            <Card
              key={player.id}
              variant="glass"
              className={`p-6 text-center space-y-4 transition-all duration-200 ${podiumStyles.cardStyle}`}
            >
              <div className="flex flex-col items-center justify-center space-y-1">
                <div
                  className={`w-12 h-12 rounded-[2px] flex items-center justify-center font-heading text-xl font-bold shadow-xs ${podiumStyles.iconContainer}`}
                >
                  {podiumStyles.icon}
                </div>

                <Badge
                  variant={podiumStyles.badgeVariant}
                  size="sm"
                  className="mt-2"
                  dot={isWinner}
                >
                  {podiumStyles.badgeLabel}
                </Badge>
              </div>

              <div>
                <h3 className="font-heading text-2xl font-normal text-ink">{player.name}</h3>
                <p className="text-3xl font-heading font-semibold text-ink mt-1">
                  {player.score}{" "}
                  <span className="text-xs font-mono font-normal text-muted-foreground">pts</span>
                </p>
              </div>

              <div className="text-xs font-mono text-muted-foreground pt-2 border-t border-ink/8">
                CP: {player.cp} · CN: {player.cn} · DP: {player.dp} · PP: {player.pp}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Fixed Tournament Scoreboard Table */}
      <Card variant="glass">
        <CardHeader>
          <div className="flex items-center gap-2.5 border-l-4 border-[#ffe14d] pl-3 py-0.5">
            <Sparkles className="w-5 h-5 text-[#d6a500]" />
            <CardTitle>Final Scoreboard</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-ink/12 text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                  <th className="py-2.5 px-3 font-semibold">Player</th>
                  <th className="py-2.5 px-2 text-center font-semibold">CP</th>
                  <th className="py-2.5 px-2 text-center font-semibold">CN</th>
                  <th className="py-2.5 px-2 text-center font-semibold">DP</th>
                  <th className="py-2.5 px-2 text-center font-semibold">PP</th>
                  <th className="py-2.5 px-3 text-right font-bold text-ink">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/8 text-sm font-mono">
                {rankedPlayers.map((player, pIdx) => {
                  const isWinner = player.score === topScore;
                  return (
                    <tr
                      key={player.id}
                      className={cn(
                        "transition-colors duration-150",
                        isWinner
                          ? "bg-[rgb(255_225_77/0.18)] font-medium"
                          : pIdx === 1
                            ? "bg-[rgb(191_227_255/0.14)]"
                            : "bg-[rgb(255_158_196/0.1)]"
                      )}
                    >
                      <td className="py-3 px-3 font-sans font-medium text-ink flex items-center gap-2">
                        {isWinner && <Trophy className="w-4 h-4 text-[#d6a500]" />}
                        <span>{player.name}</span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={
                            player.cp > 0 ? "text-[#145388] font-bold" : "text-muted-foreground/60"
                          }
                        >
                          {formatScoreCell(player.cp, "cp")}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={
                            player.cn < 0 ? "text-[#a51642] font-bold" : "text-muted-foreground/60"
                          }
                        >
                          {formatScoreCell(player.cn, "cn")}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={
                            player.dp > 0 ? "text-[#145388] font-bold" : "text-muted-foreground/60"
                          }
                        >
                          {formatScoreCell(player.dp, "dp")}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={
                            player.pp > 0 ? "text-[#145388] font-bold" : "text-muted-foreground/60"
                          }
                        >
                          {formatScoreCell(player.pp, "pp")}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-heading text-lg font-semibold text-ink">
                        {calculatePlayerTotal(player)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          <div className="pt-3 mt-2 border-t border-ink/8 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs font-mono text-muted-foreground">
            <span>CP: Challenge (+2)</span>
            <span>CN: Penalty (−1)</span>
            <span>DP: Defense (+2)</span>
            <span>PP: Pass (+2)</span>
            <span className="text-ink font-semibold">Total = CP + CN + DP + PP</span>
          </div>
        </CardContent>
      </Card>

      {/* New Game Button */}
      <div className="flex flex-col items-center justify-center pt-2">
        <Button
          variant="primary"
          size="lg"
          onClick={resetGame}
          leftIcon={<RotateCcw className="w-4 h-4" />}
          className="px-8 shadow-md"
        >
          New Game
        </Button>
      </div>
    </div>
  );
}

export default ResultScreen;
