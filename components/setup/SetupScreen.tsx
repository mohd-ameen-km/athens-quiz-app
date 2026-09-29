"use client";

import React, { useState, ChangeEvent, DragEvent } from "react";
import { useGame } from "@/context/GameContext";
import { parseTsv } from "@/lib/parseTsv";
import { SAMPLE_TSV_CONTENT } from "@/lib/sampleTsv";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  UploadCloud,
  FileText,
  AlertCircle,
  CheckCircle2,
  Users,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export function SetupScreen() {
  const { state, loadTopics, setPlayers, setSettings, startGame } = useGame();

  // Local state for player names
  const [player1, setPlayer1] = useState(state.players[0]?.name || "");
  const [player2, setPlayer2] = useState(state.players[1]?.name || "");
  const [player3, setPlayer3] = useState(state.players[2]?.name || "");

  // Local state for timing settings
  const [directSeconds, setDirectSeconds] = useState<number>(state.directSeconds || 25);
  const [passSeconds, setPassSeconds] = useState<number>(state.passSeconds || 20);

  // File upload state & errors
  const [fileName, setFileName] = useState<string | null>(null);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  // Process TSV text contents
  const processTsvText = (content: string, name: string) => {
    setFileName(name);
    const result = parseTsv(content);

    if (result.errors.length > 0) {
      setParseErrors(result.errors);
      loadTopics([]);
    } else {
      setParseErrors([]);
      loadTopics(result.topics);
    }
  };

  // Handle file input selection
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      processTsvText(text, file.name);
    } catch (err) {
      setParseErrors([
        err instanceof Error ? err.message : "Failed to read the uploaded TSV file.",
      ]);
    }
  };

  // Handle drag and drop
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      processTsvText(text, file.name);
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : "Failed to read the dropped TSV file."]);
    }
  };

  // Load sample TSV
  const handleLoadSample = () => {
    processTsvText(SAMPLE_TSV_CONTENT, "sample_tournament.tsv");
  };

  // Validation checks for enabling "Start Game"
  const hasValidTopics =
    state.topics.length > 0 && state.topics.length % 3 === 0 && parseErrors.length === 0;
  const hasValidPlayers = player1.trim() !== "" && player2.trim() !== "" && player3.trim() !== "";
  const hasValidTiming = directSeconds > 0 && passSeconds > 0;
  const canStartGame = hasValidTopics && hasValidPlayers && hasValidTiming;

  // On Start Game click
  const handleStartGame = () => {
    if (!canStartGame) return;

    // 1. Store timing settings in state
    setSettings({ directSeconds, passSeconds });

    // 2. Dispatch SET_PLAYERS with the three names in the order entered
    setPlayers([player1.trim(), player2.trim(), player3.trim()]);

    // 3. Dispatch START_GAME (builds schedule and transitions to topics phase)
    startGame({ directSeconds, passSeconds });
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10 space-y-8">
      {/* Page Title */}
      <div className="border-b border-ink/10 pb-4">
        <h1 className="font-heading text-3xl sm:text-4xl font-normal text-ink tracking-tight">
          Game Setup
        </h1>
      </div>

      {/* Section 1: TSV Dataset Import */}
      <Card variant="glass-blue">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 border-l-4 border-[#2986cc] pl-2.5 py-0.5">
              <FileText className="w-5 h-5 text-[#145388]" />
              <CardTitle>Questions (TSV)</CardTitle>
            </div>
            <Button variant="blue" size="sm" onClick={handleLoadSample}>
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              Load Sample TSV
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag & Drop Zone */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-[4px] p-8 text-center transition-colors duration-150 ${
              isDragging
                ? "border-ink bg-ink/5"
                : "border-ink/20 hover:border-ink/40 bg-[rgb(250_250_246/0.4)]"
            }`}
          >
            <input
              type="file"
              id="tsv-upload"
              accept=".tsv,.txt,.csv"
              onChange={handleFileChange}
              className="sr-only"
            />
            <label
              htmlFor="tsv-upload"
              className="cursor-pointer flex flex-col items-center justify-center space-y-3"
            >
              <div className="w-10 h-10 rounded-[2px] bg-ink/5 flex items-center justify-center text-ink">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-ink">Choose TSV file or drag and drop</p>
              {fileName && (
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[2px] bg-ink/8 text-ink text-xs font-mono">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{fileName}</span>
                </div>
              )}
            </label>
          </div>

          {/* Validation Errors Display */}
          {parseErrors.length > 0 && (
            <div className="p-4 rounded-[4px] bg-[#fde8ef]/70 border border-[#e0245e]/40 text-[#a51642] space-y-2">
              <div className="flex items-center gap-2 font-medium text-sm">
                <AlertCircle className="w-4 h-4 text-[#e0245e] shrink-0" />
                <span>Dataset Errors ({parseErrors.length})</span>
              </div>
              <ul className="list-disc list-inside text-xs space-y-1 pl-1 font-mono">
                {parseErrors.map((err, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Success Summary Display */}
          {hasValidTopics && (
            <div className="p-3.5 rounded-[4px] bg-[#bfe3ff]/30 border border-[#bfe3ff]/70 text-[#145388] flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold">
                <CheckCircle2 className="w-4 h-4 text-[#145388]" />
                <span>
                  {state.topics.length} topics ({state.topics.length / 3} rounds) ·{" "}
                  {state.topics.reduce((acc, t) => acc + t.questions.length, 0)} questions
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Section 2: Three Player Name Inputs */}
      <Card variant="glass-yellow">
        <CardHeader>
          <div className="flex items-center gap-2 border-l-4 border-[#d6a500] pl-2.5 py-0.5">
            <Users className="w-5 h-5 text-[#6b5400]" />
            <CardTitle>Players</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Player 1 */}
            <div className="space-y-1.5">
              <label
                htmlFor="player-1"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground block"
              >
                Player 1 (P1)
              </label>
              <input
                id="player-1"
                type="text"
                value={player1}
                onChange={(e) => setPlayer1(e.target.value)}
                placeholder="Name"
                className="w-full h-10 px-3 rounded-[2px] border border-ink/20 bg-[rgb(250_250_246/0.8)] text-ink placeholder:text-muted-foreground/60 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm transition-colors"
              />
            </div>

            {/* Player 2 */}
            <div className="space-y-1.5">
              <label
                htmlFor="player-2"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground block"
              >
                Player 2 (P2)
              </label>
              <input
                id="player-2"
                type="text"
                value={player2}
                onChange={(e) => setPlayer2(e.target.value)}
                placeholder="Name"
                className="w-full h-10 px-3 rounded-[2px] border border-ink/20 bg-[rgb(250_250_246/0.8)] text-ink placeholder:text-muted-foreground/60 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm transition-colors"
              />
            </div>

            {/* Player 3 */}
            <div className="space-y-1.5">
              <label
                htmlFor="player-3"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground block"
              >
                Player 3 (P3)
              </label>
              <input
                id="player-3"
                type="text"
                value={player3}
                onChange={(e) => setPlayer3(e.target.value)}
                placeholder="Name"
                className="w-full h-10 px-3 rounded-[2px] border border-ink/20 bg-[rgb(250_250_246/0.8)] text-ink placeholder:text-muted-foreground/60 focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm transition-colors"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Section 3: Timer Settings */}
      <Card variant="glass-pink">
        <CardHeader>
          <div className="flex items-center gap-2 border-l-4 border-[#e05286] pl-2.5 py-0.5">
            <Clock className="w-5 h-5 text-[#9e1c4a]" />
            <CardTitle>Timers</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Seconds on Direct */}
            <div className="space-y-1.5">
              <label
                htmlFor="direct-seconds"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground block"
              >
                Seconds on Direct
              </label>
              <div className="relative">
                <input
                  id="direct-seconds"
                  type="number"
                  min="1"
                  max="300"
                  value={directSeconds}
                  onChange={(e) => setDirectSeconds(Number(e.target.value))}
                  className="w-full h-10 px-3 pr-12 rounded-[2px] border border-ink/20 bg-[rgb(250_250_246/0.8)] text-ink placeholder:text-muted-foreground focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                  sec
                </span>
              </div>
            </div>

            {/* Seconds on Pass */}
            <div className="space-y-1.5">
              <label
                htmlFor="pass-seconds"
                className="text-xs font-mono uppercase tracking-wider text-muted-foreground block"
              >
                Seconds on Pass
              </label>
              <div className="relative">
                <input
                  id="pass-seconds"
                  type="number"
                  min="1"
                  max="300"
                  value={passSeconds}
                  onChange={(e) => setPassSeconds(Number(e.target.value))}
                  className="w-full h-10 px-3 pr-12 rounded-[2px] border border-ink/20 bg-[rgb(250_250_246/0.8)] text-ink placeholder:text-muted-foreground focus:outline-none focus:border-ink focus:ring-1 focus:ring-ink text-sm"
                  required
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-mono text-muted-foreground pointer-events-none">
                  sec
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action / Start Game Button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        {!canStartGame ? (
          <p className="text-xs text-muted-foreground font-mono">
            {!hasValidTopics
              ? "Dataset with a multiple of 3 topics required"
              : !hasValidPlayers
                ? "Enter names for all 3 players"
                : "Enter positive timer values"}
          </p>
        ) : (
          <div />
        )}

        <Button
          variant="primary"
          size="lg"
          disabled={!canStartGame}
          onClick={handleStartGame}
          rightIcon={<ArrowRight className="w-4 h-4" />}
          className="w-full sm:w-auto px-8 shadow-sm"
        >
          Start Game
        </Button>
      </div>
    </div>
  );
}

export default SetupScreen;
