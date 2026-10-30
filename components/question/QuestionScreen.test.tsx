import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, it, expect } from "vitest";
import { GameProvider } from "@/context/GameContext";
import { QuestionScreen } from "./QuestionScreen";
import { gameReducer, initialGameState } from "@/lib/gameReducer";
import { Topic } from "@/types";

describe("QuestionScreen multi-media rendering", () => {
  function createMultiMediaQuestionState() {
    const topics: Topic[] = [
      {
        name: "Multimedia Topic",
        questions: [
          {
            topicName: "Multimedia Topic",
            qnNo: 1,
            qnText: "Identify both paintings and both musical excerpts.",
            ansText: "Starry Night & Water Lilies / Symphony No. 5 & Clair de Lune",
            qnImg: ["https://example.com/q-img-1.jpg", "https://example.com/q-img-2.jpg"],
            ansImg: ["https://example.com/ans-img-1.jpg", "https://example.com/ans-img-2.jpg"],
            qnVid: [],
            ansVid: ["https://example.com/ans-vid-1.mp4"],
            qnAud: ["https://example.com/q-aud-1.mp3", "https://example.com/q-aud-2.mp3"],
            ansAud: ["https://example.com/ans-aud-1.mp3"],
          },
        ],
      },
      {
        name: "Topic 2",
        questions: [
          {
            topicName: "Topic 2",
            qnNo: 1,
            qnText: "Q2",
            ansText: "A2",
            qnImg: [],
            ansImg: [],
            qnVid: [],
            ansVid: [],
            qnAud: [],
            ansAud: [],
          },
        ],
      },
      {
        name: "Topic 3",
        questions: [
          {
            topicName: "Topic 3",
            qnNo: 1,
            qnText: "Q3",
            ansText: "A3",
            qnImg: [],
            ansImg: [],
            qnVid: [],
            ansVid: [],
            qnAud: [],
            ansAud: [],
          },
        ],
      },
    ];

    let state = gameReducer(initialGameState, { type: "LOAD_TOPICS", payload: topics });
    state = gameReducer(state, {
      type: "SET_PLAYERS",
      payload: { players: ["Alex", "Blair", "Chris"] },
    });
    state = gameReducer(state, { type: "START_GAME" });
    return gameReducer(state, {
      type: "SELECT_TOPIC_FOR_CHALLENGE",
      payload: { topicId: state.topics[0].id },
    });
  }

  it("renders two <img> and two <audio> elements for the question, and keeps answer media absent until the answer is revealed", () => {
    const unrevealedState = createMultiMediaQuestionState();

    const unrevealedHtml = renderToStaticMarkup(
      <GameProvider initialStateOverride={unrevealedState}>
        <QuestionScreen />
      </GameProvider>
    );

    // Exactly two <img> elements and two <audio> elements are rendered before reveal
    const imgTagsBefore = unrevealedHtml.match(/<img\b[^>]*>/g) ?? [];
    const audioTagsBefore = unrevealedHtml.match(/<audio\b[^>]*>/g) ?? [];
    const videoTagsBefore = unrevealedHtml.match(/<video\b[^>]*>/g) ?? [];

    expect(imgTagsBefore).toHaveLength(2);
    expect(audioTagsBefore).toHaveLength(2);
    expect(videoTagsBefore).toHaveLength(0);

    // Question media links are present in order
    expect(unrevealedHtml).toContain('src="https://example.com/q-img-1.jpg"');
    expect(unrevealedHtml).toContain('src="https://example.com/q-img-2.jpg"');
    expect(unrevealedHtml).toContain('src="https://example.com/q-aud-1.mp3"');
    expect(unrevealedHtml).toContain('src="https://example.com/q-aud-2.mp3"');

    // Answer media elements are completely absent before Reveal Answer is clicked
    expect(unrevealedHtml).not.toContain("https://example.com/ans-img-1.jpg");
    expect(unrevealedHtml).not.toContain("https://example.com/ans-img-2.jpg");
    expect(unrevealedHtml).not.toContain("https://example.com/ans-vid-1.mp4");
    expect(unrevealedHtml).not.toContain("https://example.com/ans-aud-1.mp3");

    // Reveal the answer and verify answer media now renders
    const revealedState = gameReducer(unrevealedState, { type: "REVEAL_ANSWER" });
    const revealedHtml = renderToStaticMarkup(
      <GameProvider initialStateOverride={revealedState}>
        <QuestionScreen />
      </GameProvider>
    );

    const imgTagsAfter = revealedHtml.match(/<img\b[^>]*>/g) ?? [];
    const audioTagsAfter = revealedHtml.match(/<audio\b[^>]*>/g) ?? [];
    const videoTagsAfter = revealedHtml.match(/<video\b[^>]*>/g) ?? [];

    expect(imgTagsAfter).toHaveLength(4); // 2 question images + 2 answer images
    expect(audioTagsAfter).toHaveLength(3); // 2 question audios + 1 answer audio
    expect(videoTagsAfter).toHaveLength(1); // 1 answer video

    expect(revealedHtml).toContain('src="https://example.com/ans-img-1.jpg"');
    expect(revealedHtml).toContain('src="https://example.com/ans-img-2.jpg"');
    expect(revealedHtml).toContain('src="https://example.com/ans-vid-1.mp4"');
    expect(revealedHtml).toContain('src="https://example.com/ans-aud-1.mp3"');
  });
});

