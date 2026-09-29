"use client";

import React from "react";
import { useGame } from "@/context/GameContext";
import { SetupScreen } from "@/components/setup/SetupScreen";
import { TopicsScreen } from "@/components/topics/TopicsScreen";

import { QuestionScreen } from "@/components/question/QuestionScreen";
import { ResultScreen } from "@/components/result/ResultScreen";

import { Logo } from "@/components/ui/Logo";

export default function Home() {
  const { state } = useGame();

  return (
    <main className="min-h-screen bg-background text-ink selection:bg-accent-yellow/40 selection:text-ink pb-20">
      {/* Warm paper subtle grid pattern */}
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,#1d1d1b08_1px,transparent_1px),linear-gradient(to_bottom,#1d1d1b08_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

      {/* Navigation Header */}
      <header className="border-b border-ink/10 sticky top-0 z-50 bg-[rgb(250_250_246/0.88)] backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <Logo showText size={28} />
        </div>
      </header>

      {/* Dynamic Phase Content */}
      <div className="transition-all duration-300">
        {state.phase === "setup" ? (
          <SetupScreen />
        ) : state.phase === "question" ? (
          <QuestionScreen />
        ) : state.phase === "result" ? (
          <ResultScreen />
        ) : (
          <TopicsScreen />
        )}
      </div>
    </main>
  );
}
