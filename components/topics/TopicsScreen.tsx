"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { Scoreboard } from "@/components/scoreboard/Scoreboard";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { GameTopic } from "@/types";
import { Layers, RotateCcw, ArrowRight, Swords, Trophy, Undo2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function TopicsScreen() {
  const { state, selectTopicForChallenge, endGame, resetGame, undo } = useGame();

  const isScheduleFinished = state.currentChallenge === null;

  const currentRoundIndex = state.currentChallenge?.roundIndex ?? 0;
  const currentChallengeIndex = state.currentChallenge?.challengeIndex ?? 0;

  const currentRound = state.schedule[currentRoundIndex];
  const currentPairing = currentRound?.pairings[currentChallengeIndex];

  // Helper to resolve player name
  const getPlayerName = (id?: string) => {
    if (!id) return "";
    return state.players.find((p) => p.id === id)?.name || id;
  };

  const challengerName = getPlayerName(currentPairing?.challenger);
  const defenderName = getPlayerName(currentPairing?.defender);

  // Computes the tag for taken topics, e.g. "R2 · Jim vs Cam"
  const getTakenTag = (topic: GameTopic): string => {
    if (!topic.takenInChallenge) return "Taken";
    const { roundIndex, challengeIndex } = topic.takenInChallenge;
    const round = state.schedule[roundIndex];
    const pairing = round?.pairings[challengeIndex];
    if (!pairing) return `R${roundIndex + 1}`;
    const c = getPlayerName(pairing.challenger);
    const d = getPlayerName(pairing.defender);
    return `R${roundIndex + 1} · ${c} vs ${d}`;
  };

  const handleSelectTopic = (topicId: string) => {
    if (isScheduleFinished) return;
    selectTopicForChallenge(topicId);
  };

  const untakenCount = state.topics.filter((t) => !t.taken).length;

  const [showEndEarlyDialog, setShowEndEarlyDialog] = React.useState(false);

  // Close dialog on Escape key
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setShowEndEarlyDialog(false);
      }
    };
    if (showEndEarlyDialog) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showEndEarlyDialog]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-5 space-y-3.5 sm:space-y-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-ink/10 pb-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            {isScheduleFinished ? (
              <Badge variant="yellow" size="sm" dot>
                All Rounds Complete
              </Badge>
            ) : (
              <>
                <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">
                  Round {(currentRoundIndex || 0) + 1} of {state.schedule.length}
                </span>
                <span className="text-muted-foreground/40 font-mono text-xs">/</span>
                <span className="text-xs font-mono text-muted-foreground">
                  Challenge {(currentChallengeIndex || 0) + 1} of 3
                </span>
                {/* Small badge highlighting whose turn it is to pick a topic */}
                {challengerName && (
                  <Badge variant="yellow" size="sm" dot>
                    {challengerName} to pick
                  </Badge>
                )}
                {defenderName && (
                  <Badge variant="neutral" size="sm">
                    vs {defenderName}
                  </Badge>
                )}
              </>
            )}
          </div>

          <h1 className="font-heading text-2xl sm:text-3xl font-normal text-ink tracking-tight">
            Topics Board
          </h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Surface End Game button: direct when schedule finished, or with confirmation dialog if ending early */}
          {isScheduleFinished ? (
            <Button
              variant="primary"
              size="md"
              onClick={endGame}
              leftIcon={<Trophy className="w-4 h-4" />}
            >
              End Game
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowEndEarlyDialog(true)}
              leftIcon={<Trophy className="w-3.5 h-3.5 text-muted-foreground" />}
            >
              End Game
            </Button>
          )}

          {state.history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={undo}
              leftIcon={<Undo2 className="w-3.5 h-3.5" />}
            >
              Undo
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={resetGame}
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
          >
            Reset Game
          </Button>
        </div>
      </div>

      {/* Confirmation Dialog for Ending Game Early */}
      {showEndEarlyDialog && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="dialog-end-game-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-150"
          onClick={() => setShowEndEarlyDialog(false)}
        >
          <div
            className="surface-glass bg-paper border border-ink/20 rounded-[4px] shadow-xl max-w-md w-full p-6 space-y-5 animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-[2px] bg-[#ffe14d]/30 border border-[#d6a500]/60 flex items-center justify-center shrink-0">
                <Trophy className="w-5 h-5 text-ink" />
              </div>
              <div className="space-y-1.5">
                <h3
                  id="dialog-end-game-title"
                  className="font-heading text-xl font-normal text-ink leading-tight"
                >
                  End Game Early?
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  End match and proceed to results based on current scores?
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-ink/10">
              <Button variant="outline" size="sm" onClick={() => setShowEndEarlyDialog(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setShowEndEarlyDialog(false);
                  endGame();
                }}
                leftIcon={<Trophy className="w-3.5 h-3.5" />}
              >
                End Game
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Surface End Game Banner if schedule is complete */}
      {isScheduleFinished && (
        <Card variant="glass-yellow" className="border-[#ffe14d]/70 shadow-md">
          <CardHeader className="flex flex-row items-center justify-between py-4">
            <div className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-ink" />
              <CardTitle>Schedule Complete</CardTitle>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={endGame}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Results
            </Button>
          </CardHeader>
        </Card>
      )}

      {/* Active Challenge Spotlight Card */}
      {!isScheduleFinished && currentPairing && (
        <div className="px-3.5 py-2.5 rounded-[4px] bg-[rgb(255_225_77/0.16)] backdrop-blur-[22px] border border-[#ffe14d]/70 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-[2px] bg-[#ffe14d] border border-ink/20 flex items-center justify-center shrink-0 shadow-2xs">
              <Swords className="w-4 h-4 text-ink" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-mono uppercase tracking-wider text-[#6b5400] font-semibold">
                  Active Pairing
                </span>
                <Badge variant="yellow" size="sm" dot>
                  {challengerName} to Pick
                </Badge>
              </div>
              <p className="text-xs sm:text-sm font-medium text-ink pt-0.5">
                <span className="font-bold">{challengerName}</span> (Challenger) vs{" "}
                <span className="font-bold text-[#145388]">{defenderName}</span> (Defender)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-muted-foreground bg-paper/90 px-2.5 py-1 rounded-[2px] border border-ink/10 self-start sm:self-auto shadow-2xs">
            <span className="text-ink font-semibold">Round {(currentRoundIndex || 0) + 1}</span>
            <span className="text-muted-foreground/40">/</span>
            <span>Challenge {(currentChallengeIndex || 0) + 1} of 3</span>
          </div>
        </div>
      )}

      {/* Scoreboard Component */}
      <Scoreboard />

      {/* Topics Grid Section */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 border-l-4 border-[#ffe14d] pl-2.5 py-0.5">
            <Layers className="w-3.5 h-3.5 text-ink" />
            <h2 className="font-heading text-lg sm:text-xl font-normal text-ink">Topics</h2>
            <span className="text-xs font-mono text-muted-foreground">
              ({untakenCount} / {state.topics.length})
            </span>
          </div>
        </div>

        {/* Minimal topic cards grid: dense, stripped to essentials, fits within 100vh */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2 sm:gap-2.5">
          {state.topics.map((topic, index) => {
            const isTaken = topic.taken || isScheduleFinished;
            const takenTag = topic.taken ? getTakenTag(topic) : null;

            const accentTopBorder =
              index % 3 === 0 ? "bg-[#bfe3ff]" : index % 3 === 1 ? "bg-[#ffe14d]" : "bg-[#ff9ec4]";

            return (
              <div
                key={topic.id}
                onClick={() => {
                  if (!isTaken) {
                    handleSelectTopic(topic.id);
                  }
                }}
                className={cn(
                  "h-[64px] sm:h-[68px] p-2.5 sm:p-3 rounded-[4px] border flex flex-col justify-between select-none transition-all duration-150 relative overflow-hidden",
                  isTaken
                    ? "opacity-35 grayscale contrast-75 bg-[rgb(250_250_246/0.4)] border-ink/15 pointer-events-none cursor-not-allowed shadow-none"
                    : "cursor-pointer surface-glass bg-[rgb(250_250_246/0.85)] border-ink/20 hover:border-ink/50 hover:shadow-xs active:scale-[0.98]"
                )}
                title={topic.name}
              >
                {/* Subtle top stripe for available cards */}
                {!isTaken && (
                  <div className={`absolute top-0 inset-x-0 h-0.5 ${accentTopBorder}`} />
                )}

                {/* Topic Name */}
                <div className="flex-1 flex items-center min-w-0">
                  <span
                    className={cn(
                      "font-heading text-xs sm:text-sm font-medium leading-snug line-clamp-2",
                      isTaken ? "text-ink/70" : "text-ink"
                    )}
                  >
                    {topic.name}
                  </span>
                </div>

                {/* ONLY if taken: which challenge used it (e.g. 'R2 · Jim vs Cam') */}
                {takenTag && (
                  <div className="pt-0.5 mt-auto border-t border-ink/10 flex items-center min-w-0">
                    <span
                      className="text-[10px] font-mono text-muted-foreground truncate tracking-tight font-medium"
                      title={takenTag}
                    >
                      {takenTag}
                    </span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default TopicsScreen;
