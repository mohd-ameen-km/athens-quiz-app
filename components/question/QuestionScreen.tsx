"use client";

import React, { useState, useEffect } from "react";
import { useGame } from "@/context/GameContext";
import { Scoreboard } from "@/components/scoreboard/Scoreboard";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RichText } from "@/components/ui/RichText";
import { normalizeMediaField } from "@/lib/parseTsv";
import {
  Clock,
  Play,
  Pause,
  Check,
  X,
  Eye,
  ArrowRight,
  ArrowLeft,
  Shield,
  Swords,
  User,
  Undo2,
  ZoomIn,
} from "lucide-react";

export function QuestionScreen() {
  const { state, markResult, revealAnswer, nextQuestion, undo, dispatch } = useGame();

  const currentChallenge = state.currentChallenge;
  const currentRoundIndex = currentChallenge?.roundIndex ?? 0;
  const currentChallengeIndex = currentChallenge?.challengeIndex ?? 0;
  const questionIndex = currentChallenge?.questionIndex ?? 0;
  const currentAttemptIndex = currentChallenge?.currentAttemptIndex ?? 0;
  const revealed = currentChallenge?.revealed ?? false;
  const resolved = currentChallenge?.resolved ?? false;

  const currentRound = state.schedule[currentRoundIndex];
  const currentPairing = currentRound?.pairings[currentChallengeIndex];

  const currentTopic = state.topics.find((t) => t.id === currentChallenge?.topicId);
  const currentQuestion = currentTopic?.questions[questionIndex];

  // Helper to get player by id
  const getPlayer = (id?: string) => {
    return state.players.find((p) => p.id === id);
  };

  const challenger = getPlayer(currentPairing?.challenger);
  const defender = getPlayer(currentPairing?.defender);
  const third = getPlayer(currentPairing?.third);

  const currentAttemptPlayerId = currentChallenge?.attemptOrder[currentAttemptIndex];
  const currentAttemptPlayer = getPlayer(currentAttemptPlayerId);

  // -------------------------------------------------------------
  // Timer State & Logic
  // -------------------------------------------------------------
  const [timeLeft, setTimeLeft] = useState<number>(state.timerSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(state.timerRunning);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<string>(String(state.timerSeconds));

  // Enlarged image preview state (supports both question and answer images)
  const [enlargedImage, setEnlargedImage] = useState<{ src: string; alt: string } | null>(null);
  const [failedImages, setFailedImages] = useState<Record<string, boolean>>({});

  const qnImages = normalizeMediaField(currentQuestion?.qnImg);
  const qnVideos = normalizeMediaField(currentQuestion?.qnVid);
  const qnAudios = normalizeMediaField(currentQuestion?.qnAud);
  const ansImages = normalizeMediaField(currentQuestion?.ansImg);
  const ansVideos = normalizeMediaField(currentQuestion?.ansVid);
  const ansAudios = normalizeMediaField(currentQuestion?.ansAud);

  const visibleQnImages = qnImages.filter((src, idx) => !failedImages[`qn-${idx}-${src}`]);
  const visibleAnsImages = ansImages.filter((src, idx) => !failedImages[`ans-${idx}-${src}`]);

  useEffect(() => {
    setFailedImages({});
  }, [currentChallenge?.topicId, questionIndex]);

  // Close enlarged image on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setEnlargedImage(null);
      }
    };
    if (enlargedImage) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enlargedImage]);

  // Synchronize timer whenever state.timerSeconds or state.timerRunning changes (e.g. on Undo or attempt advance)
  useEffect(() => {
    setTimeLeft(state.timerSeconds);
    setIsRunning(state.timerRunning);
  }, [state.timerSeconds, state.timerRunning]);

  // Timer countdown effect
  useEffect(() => {
    if (!isRunning) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setIsRunning(false);
          dispatch({
            type: "UPDATE_TIMER",
            payload: { timerSeconds: 0, timerRunning: false },
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRunning, dispatch]);

  // Timer adjust actions
  const adjustTimer = (delta: number) => {
    const newTime = Math.max(0, timeLeft + delta);
    setTimeLeft(newTime);
    dispatch({
      type: "UPDATE_TIMER",
      payload: { timerSeconds: newTime, timerRunning: isRunning },
    });
  };

  const toggleRunning = () => {
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);
    dispatch({
      type: "UPDATE_TIMER",
      payload: { timerSeconds: timeLeft, timerRunning: nextRunning },
    });
  };

  const commitEditValue = () => {
    const parsed = parseInt(editValue, 10);
    if (!isNaN(parsed) && parsed >= 0) {
      setTimeLeft(parsed);
      dispatch({
        type: "UPDATE_TIMER",
        payload: { timerSeconds: parsed, timerRunning: isRunning },
      });
    }
    setIsEditing(false);
  };

  // Button handlers
  const handleCorrect = () => {
    markResult(true, { timerSeconds: timeLeft, timerRunning: isRunning });
  };

  const handleWrong = () => {
    markResult(false, { timerSeconds: timeLeft, timerRunning: isRunning });
  };

  const handleReveal = () => {
    revealAnswer({ timerSeconds: timeLeft, timerRunning: isRunning });
  };

  const handleNextQuestion = () => {
    nextQuestion();
  };

  const roleTitle =
    currentAttemptIndex === 0
      ? "Defender"
      : currentAttemptIndex === 1
        ? "Challenger"
        : "Third Player";

  const roleStyles =
    currentAttemptIndex === 0
      ? {
          cardBorderTop: "border-t-4 border-t-[#2986cc]",
          badgeVariant: "blue" as const,
          headerBg: "bg-[rgb(191_227_255/0.25)] border-b border-[#bfe3ff]/80",
          icon: <Shield className="w-4 h-4 text-[#145388]" />,
          textColor: "text-[#145388]",
        }
      : currentAttemptIndex === 1
        ? {
            cardBorderTop: "border-t-4 border-t-[#d6a500]",
            badgeVariant: "yellow" as const,
            headerBg: "bg-[rgb(255_225_77/0.25)] border-b border-[#ffe14d]/80",
            icon: <Swords className="w-4 h-4 text-[#6b5400]" />,
            textColor: "text-[#6b5400]",
          }
        : {
            cardBorderTop: "border-t-4 border-t-[#e05286]",
            badgeVariant: "pink" as const,
            headerBg: "bg-[rgb(255_158_196/0.2)] border-b border-[#ff9ec4]/80",
            icon: <User className="w-4 h-4 text-[#9e1c4a]" />,
            textColor: "text-[#9e1c4a]",
          };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-ink/10 pb-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-mono text-muted-foreground">
              Question {questionIndex + 1} of {currentTopic?.questions.length || 1}
            </span>
            <span className="text-muted-foreground/40 font-mono text-xs">/</span>
            <span className="text-xs font-mono text-muted-foreground">
              R{(currentRoundIndex || 0) + 1} · Challenge {(currentChallengeIndex || 0) + 1}
            </span>
          </div>
          <div className="border-l-4 border-[#ffe14d] pl-2.5 py-0.5">
            <h2 className="font-heading text-xl sm:text-2xl font-normal text-ink">
              {currentTopic?.name || "Topic"}
            </h2>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() =>
            dispatch({ type: "RESTORE_STATE", payload: { ...state, phase: "topics" } })
          }
          leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
        >
          Topics Board
        </Button>
      </div>

      {/* Two-Column Layout: Sidebar (~20%) & Wider Main Area (~80%) */}
      <div className="flex flex-col lg:flex-row items-start gap-6">
        {/* Left Sidebar for Scoreboard & Pairing (~20%) */}
        <aside className="w-full lg:w-[22%] xl:w-[20%] shrink-0 lg:sticky lg:top-20 space-y-3">
          <Scoreboard compact />

          {/* Active Attempt Meta Box */}
          <div className="p-2.5 sm:p-3 rounded-[4px] surface-glass border border-ink/10 space-y-2">
            <div className="border-l-3 border-[#ffe14d] pl-1.5 py-0.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground font-semibold">
                Pairing
              </span>
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between gap-1 p-1.5 rounded-[2px] bg-[rgb(255_225_77/0.18)] border border-[#ffe14d]/50">
                <span className="text-[#6b5400] font-semibold text-[11px] flex items-center gap-1 shrink-0">
                  <Swords className="w-3 h-3 text-[#d6a500]" /> Challenger
                </span>
                <span
                  className="font-semibold text-ink text-[11px] truncate"
                  title={challenger?.name}
                >
                  {challenger?.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5 rounded-[2px] bg-[rgb(191_227_255/0.22)] border border-[#bfe3ff]/60">
                <span className="text-[#145388] font-semibold text-[11px] flex items-center gap-1 shrink-0">
                  <Shield className="w-3 h-3 text-[#2986cc]" /> Defender
                </span>
                <span
                  className="font-semibold text-ink text-[11px] truncate"
                  title={defender?.name}
                >
                  {defender?.name}
                </span>
              </div>
              <div className="flex items-center justify-between gap-1 p-1.5 rounded-[2px] bg-[rgb(255_158_196/0.12)] border border-[#ff9ec4]/40">
                <span className="text-[#9e1c4a] font-semibold text-[11px] flex items-center gap-1 shrink-0">
                  <User className="w-3 h-3 text-[#e05286]" /> Third Player
                </span>
                <span className="font-semibold text-ink text-[11px] truncate" title={third?.name}>
                  {third?.name}
                </span>
              </div>
            </div>
          </div>
        </aside>

        {/* Wider Main Content Area (~80%) */}
        <main className="w-full lg:w-[78%] xl:w-[80%] space-y-6">
          {/* Question Card with role-accentuated header */}
          <Card variant="glass" className={`overflow-hidden ${roleStyles.cardBorderTop}`}>
            <CardHeader
              className={`p-4 sm:p-5 ${roleStyles.headerBg} transition-colors duration-200`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {/* Active Answering Turn Indicator */}
                <div className="flex items-center gap-2">
                  <Badge variant={roleStyles.badgeVariant} size="md" dot={!resolved}>
                    {resolved
                      ? `Attempt Resolved: ${currentAttemptPlayer?.name}`
                      : `Turn: ${currentAttemptPlayer?.name}`}{" "}
                    ({roleTitle})
                  </Badge>
                  {currentAttemptIndex > 0 && !resolved && (
                    <Badge variant="neutral" size="sm">
                      Pass Attempt #{currentAttemptIndex}
                    </Badge>
                  )}
                </div>

                {/* Integrated Pacing Timer Control */}
                <div className="flex items-center gap-1.5 p-1.5 rounded-[2px] bg-paper border border-ink/15">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground ml-1" />

                  {/* Directly editable numeric display */}
                  {isEditing ? (
                    <input
                      type="number"
                      min="0"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={commitEditValue}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") commitEditValue();
                        if (e.key === "Escape") setIsEditing(false);
                      }}
                      className="w-14 h-7 px-1 text-center font-mono text-base font-bold rounded-[2px] border border-ink bg-white text-ink focus:outline-none"
                      autoFocus
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => {
                        setIsEditing(true);
                        setEditValue(String(timeLeft));
                      }}
                      className="px-1.5 py-0.5 font-mono text-base font-bold text-ink rounded hover:bg-ink/5 transition-colors cursor-text"
                    >
                      {timeLeft}s
                    </button>
                  )}

                  {/* -10 button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustTimer(-10)}
                    className="h-7 px-1.5 text-xs font-mono font-bold"
                  >
                    -10
                  </Button>

                  {/* +10 button */}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => adjustTimer(10)}
                    className="h-7 px-1.5 text-xs font-mono font-bold"
                  >
                    +10
                  </Button>

                  {/* Start / Pause Timer Button */}
                  <Button
                    variant={isRunning ? "secondary" : "primary"}
                    size="sm"
                    onClick={toggleRunning}
                    className="h-7 px-2.5 text-xs font-medium"
                    leftIcon={
                      isRunning ? (
                        <Pause className="w-3 h-3" />
                      ) : (
                        <Play className="w-3 h-3 fill-current" />
                      )
                    }
                  >
                    {isRunning ? "Pause" : "Start Timer"}
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Question Text */}
              <div className="text-left space-y-4">
                <RichText
                  text={currentQuestion?.qnText || "No question text available."}
                  className="text-left text-xl sm:text-2xl font-normal font-sans text-ink leading-relaxed"
                />

                {/* Question Media shown below question text */}
                {visibleQnImages.length > 0 && (
                  <div className="pt-2 flex flex-wrap items-center gap-3">
                    {qnImages.map((src, idx) => {
                      const key = `qn-${idx}-${src}`;
                      if (failedImages[key]) return null;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setEnlargedImage({
                              src,
                              alt: "Question media",
                            })
                          }
                          className={`group relative rounded-[2px] overflow-hidden border border-ink/10 bg-black/5 flex items-center justify-start cursor-zoom-in hover:border-ink/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                            visibleQnImages.length === 1 ? "max-h-80" : "max-h-60 sm:max-h-64"
                          }`}
                          title="Click to enlarge image"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={src}
                            alt="Question media"
                            onError={() =>
                              setFailedImages((prev) => ({
                                ...prev,
                                [key]: true,
                              }))
                            }
                            className={`${
                              visibleQnImages.length === 1 ? "max-h-80" : "max-h-60 sm:max-h-64"
                            } w-auto object-contain rounded-[2px] transition-transform duration-200 group-hover:scale-[1.01]`}
                          />
                          <div className="absolute bottom-2 right-2 p-1.5 rounded-[2px] bg-ink/75 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow-xs">
                            <ZoomIn className="w-3.5 h-3.5" />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {qnVideos.length > 0 && (
                  <div className="pt-2 space-y-3">
                    {qnVideos.map((src, idx) => (
                      <div
                        key={`qn-vid-${idx}-${src}`}
                        className="rounded-[2px] overflow-hidden border border-ink/10 bg-black/5"
                      >
                        <video src={src} controls className="max-h-80 w-full rounded-[2px]" />
                      </div>
                    ))}
                  </div>
                )}

                {qnAudios.length > 0 && (
                  <div className="pt-2 space-y-2">
                    {qnAudios.map((src, idx) => (
                      <audio key={`qn-aud-${idx}-${src}`} src={src} controls className="w-full" />
                    ))}
                  </div>
                )}
              </div>

              {/* Revealed Answer: Centered with celebratory soft blue tint */}
              {revealed && (
                <div className="mt-8 pt-6 text-center flex flex-col items-center justify-center space-y-4 animate-in fade-in duration-200 bg-[rgb(191_227_255/0.25)] p-6 rounded-[3px] border-2 border-[#bfe3ff] shadow-sm">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[#145388]" />
                    <Badge variant="blue" size="sm">
                      Answer
                    </Badge>
                  </div>

                  <RichText
                    text={currentQuestion?.ansText || "No answer text provided."}
                    className="text-center font-heading text-2xl sm:text-3xl font-semibold text-ink leading-snug"
                  />

                  {/* Answer Media shown below answer text */}
                  {visibleAnsImages.length > 0 && (
                    <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
                      {ansImages.map((src, idx) => {
                        const key = `ans-${idx}-${src}`;
                        if (failedImages[key]) return null;
                        return (
                          <button
                            key={key}
                            type="button"
                            onClick={() =>
                              setEnlargedImage({
                                src,
                                alt: "Answer media",
                              })
                            }
                            className={`group relative rounded-[2px] overflow-hidden border border-ink/10 bg-black/5 flex items-center justify-center cursor-zoom-in hover:border-ink/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-ink ${
                              visibleAnsImages.length === 1 ? "max-h-72" : "max-h-56 sm:max-h-60"
                            }`}
                            title="Click to enlarge image"
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={src}
                              alt="Answer media"
                              onError={() =>
                                setFailedImages((prev) => ({
                                  ...prev,
                                  [key]: true,
                                }))
                              }
                              className={`${
                                visibleAnsImages.length === 1 ? "max-h-72" : "max-h-56 sm:max-h-60"
                              } w-auto object-contain rounded-[2px] transition-transform duration-200 group-hover:scale-[1.01]`}
                            />
                            <div className="absolute bottom-2 right-2 p-1.5 rounded-[2px] bg-ink/75 text-white opacity-0 group-hover:opacity-100 transition-opacity backdrop-blur-xs shadow-xs">
                              <ZoomIn className="w-3.5 h-3.5" />
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {ansVideos.length > 0 && (
                    <div className="pt-2 max-w-lg w-full space-y-3">
                      {ansVideos.map((src, idx) => (
                        <div
                          key={`ans-vid-${idx}-${src}`}
                          className="rounded-[2px] overflow-hidden border border-ink/10 bg-black/5"
                        >
                          <video src={src} controls className="max-h-72 w-full rounded-[2px]" />
                        </div>
                      ))}
                    </div>
                  )}

                  {ansAudios.length > 0 && (
                    <div className="pt-2 max-w-md w-full space-y-2">
                      {ansAudios.map((src, idx) => (
                        <audio
                          key={`ans-aud-${idx}-${src}`}
                          src={src}
                          controls
                          className="w-full"
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>

            {/* Action Buttons: Single Row (Correct, Wrong, Reveal Answer, and Next Question) */}
            <CardFooter className="p-6 pt-4 border-t border-ink/10 flex flex-wrap items-center gap-3">
              <Button
                variant="blue"
                size="md"
                onClick={handleCorrect}
                disabled={resolved}
                leftIcon={<Check className="w-4 h-4" />}
                className="shadow-sm"
              >
                Correct
              </Button>

              <Button
                variant="danger"
                size="md"
                onClick={handleWrong}
                disabled={resolved}
                leftIcon={<X className="w-4 h-4" />}
                className="shadow-sm"
              >
                Wrong
              </Button>

              <Button
                variant={revealed ? "outline" : "secondary"}
                size="md"
                onClick={handleReveal}
                disabled={revealed}
                leftIcon={<Eye className="w-4 h-4" />}
              >
                {revealed ? "Answer Revealed" : "Reveal Answer"}
              </Button>

              {/* Single Undo button in the button row */}
              <Button
                variant="outline"
                size="md"
                onClick={undo}
                disabled={state.history.length === 0}
                leftIcon={<Undo2 className="w-4 h-4" />}
              >
                Undo
              </Button>

              {/* Once revealed, Next Question appears in that SAME ROW with solid accent fill */}
              {revealed && (
                <Button
                  variant="primary"
                  size="md"
                  onClick={handleNextQuestion}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="ml-auto sm:ml-0 shadow-sm"
                >
                  {questionIndex + 1 < (currentTopic?.questions.length ?? 0)
                    ? "Next Question"
                    : "Complete Topic"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </main>
      </div>

      {/* Enlarged Image Lightbox Modal */}
      {enlargedImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Enlarged image preview"
          onClick={() => setEnlargedImage(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-8 bg-ink/80 backdrop-blur-md animate-in fade-in duration-150 cursor-zoom-out select-none"
        >
          <div
            className="relative max-w-full max-h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setEnlargedImage(null)}
              className="absolute -top-3.5 -right-3.5 sm:-top-4 sm:-right-4 w-9 h-9 rounded-full bg-paper border border-ink/20 text-ink hover:bg-[#ffe14d] flex items-center justify-center shadow-lg transition-colors z-10 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-ink"
              aria-label="Close enlarged view"
            >
              <X className="w-5 h-5" />
            </button>

            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={enlargedImage.src}
              alt={enlargedImage.alt}
              className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain rounded-[3px] shadow-2xl border border-white/20 bg-black/10 cursor-default"
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default QuestionScreen;
