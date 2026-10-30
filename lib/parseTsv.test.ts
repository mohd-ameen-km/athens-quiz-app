import { describe, it, expect } from "vitest";
import { parseTsv } from "./parseTsv";

describe("parseTsv", () => {
  const headers = [
    "TopicName",
    "QnNo",
    "QnText",
    "AnsText",
    "QnImg",
    "AnsImg",
    "QnVid",
    "AnsVid",
    "QnAud",
    "AnsAud",
  ].join("\t");

  describe("Valid TSV parsing", () => {
    it("should successfully parse a valid TSV with 3 topics (positive multiple of 3)", () => {
      const tsvContent = [
        headers,
        "History\t1\tWho was the first president of the United States?\tGeorge Washington\thttps://example.com/wash.jpg\thttps://example.com/ans.jpg\t\t\t\t",
        "History\t2\tIn what year did World War II end?\t1945\t\t\t\t\t\t",
        "Science\t1\tWhat is the chemical symbol for gold?\tAu\t\t\t\thttps://example.com/vid.mp4\t\t",
        "Literature\t1\tWho wrote 'Pride and Prejudice'?\tJane Austen\t\t\t\t\t\thttps://example.com/aud.mp3",
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toEqual([]);
      expect(result.topics).toHaveLength(3);

      // Verify Topic 1: History
      expect(result.topics[0].name).toBe("History");
      expect(result.topics[0].questions).toHaveLength(2);
      expect(result.topics[0].questions[0]).toEqual({
        topicName: "History",
        qnNo: 1,
        qnText: "Who was the first president of the United States?",
        ansText: "George Washington",
        qnImg: ["https://example.com/wash.jpg"],
        ansImg: ["https://example.com/ans.jpg"],
        qnVid: [],
        ansVid: [],
        qnAud: [],
        ansAud: [],
      });
      expect(result.topics[0].questions[1]).toEqual({
        topicName: "History",
        qnNo: 2,
        qnText: "In what year did World War II end?",
        ansText: "1945",
        qnImg: [],
        ansImg: [],
        qnVid: [],
        ansVid: [],
        qnAud: [],
        ansAud: [],
      });

      // Verify Topic 2: Science with video
      expect(result.topics[1].name).toBe("Science");
      expect(result.topics[1].questions).toHaveLength(1);
      expect(result.topics[1].questions[0].ansVid).toEqual(["https://example.com/vid.mp4"]);

      // Verify Topic 3: Literature with audio
      expect(result.topics[2].name).toBe("Literature");
      expect(result.topics[2].questions).toHaveLength(1);
      expect(result.topics[2].questions[0].ansAud).toEqual(["https://example.com/aud.mp3"]);
    });

    it("should successfully parse a TSV with 6 topics (multiple of 3)", () => {
      const topicRows = ["T1", "T2", "T3", "T4", "T5", "T6"].map(
        (name) => `${name}\t1\tQuestion for ${name}\tAnswer for ${name}\t\t\t\t\t\t`
      );
      const tsvContent = [headers, ...topicRows].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toEqual([]);
      expect(result.topics).toHaveLength(6);
    });

    it("should handle Windows-style CRLF line breaks and whitespace around values", () => {
      const tsvContent = [
        headers,
        "Art \t 1 \t Who painted Starry Night? \t Vincent van Gogh \t\t\t\t\t\t",
        "Cinema \t 1 \t Who directed Inception? \t Christopher Nolan \t\t\t\t\t\t",
        "Music \t 1 \t Who composed the Moonlight Sonata? \t Beethoven \t\t\t\t\t\t",
      ].join("\r\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toEqual([]);
      expect(result.topics).toHaveLength(3);
      expect(result.topics[0].name).toBe("Art");
      expect(result.topics[0].questions[0].qnText).toBe("Who painted Starry Night?");
      expect(result.topics[0].questions[0].ansText).toBe("Vincent van Gogh");
    });

    it("should preserve multi-line quoted cells and blank lines between paragraphs", () => {
      const twoParagraphQuestion =
        "Object to Be Destroyed is an artwork originally created in 1923. [...] Which American artist's work is this?\n\nBy historical performance, which is the third best club in the Community of Madrid after Real Madrid and Atletico Madrid?";
      const multiLineAnswer = "Line 1: Man Ray\nLine 2: Getafe CF";

      const tsvContent = [
        headers,
        `Art & Sports\t1\t"  ${twoParagraphQuestion}  "\t"${multiLineAnswer}"\t\t\t\t\t\t`,
        "Science\t1\tWhat is H2O?\tWater\t\t\t\t\t\t",
        "History\t1\tWhen did WWI begin?\t1914\t\t\t\t\t\t",
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toEqual([]);
      expect(result.topics).toHaveLength(3);
      expect(result.topics[0].questions[0].qnText).toBe(twoParagraphQuestion);
      expect(result.topics[0].questions[0].qnText).toContain("\n\n");
      expect(result.topics[0].questions[0].ansText).toBe(multiLineAnswer);
    });

    it("should normalize \\r\\n and \\r inside cells to \\n and convert literal \\\\n sequences to real newlines", () => {
      const literalNewlineQuestion =
        "First paragraph typed with literal backslash-n.\\n\\nSecond paragraph on a new line.\\nSecond line of second paragraph.";
      const crlfQuotedQuestion =
        '"Paragraph A with CRLF.\r\n\r\nParagraph B with CR.\rLine 2 of B."';

      const tsvContent = [
        headers,
        `Topic1\t1\t${literalNewlineQuestion}\tAnswer 1\\nSub-answer 1\t\t\t\t\t\t`,
        `Topic2\t1\t${crlfQuotedQuestion}\tAnswer 2\t\t\t\t\t\t`,
        `Topic3\t1\tPlain question\tPlain answer\t\t\t\t\t\t`,
      ].join("\r\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toEqual([]);
      expect(result.topics[0].questions[0].qnText).toBe(
        "First paragraph typed with literal backslash-n.\n\nSecond paragraph on a new line.\nSecond line of second paragraph."
      );
      expect(result.topics[0].questions[0].ansText).toBe("Answer 1\nSub-answer 1");
      expect(result.topics[1].questions[0].qnText).toBe(
        "Paragraph A with CRLF.\n\nParagraph B with CR.\nLine 2 of B."
      );
    });

    it("should parse media cells: blank cell, single link, two links separated by ',' and ', ', trailing/doubled commas, and data: URL left intact", () => {
      const dataUrl =
        "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==";

      const tsvContent = [
        headers,
        // Row 1: blank cell (QnImg), single link (AnsImg), two links separated by ',' (QnVid), two links separated by ', ' (AnsVid), trailing & doubled commas (QnAud), data: URL (AnsAud)
        [
          "MediaTopic1",
          "1",
          "Q1",
          "A1",
          "",
          "https://example.com/single.jpg",
          "https://example.com/v1.mp4,https://example.com/v2.mp4",
          "https://example.com/av1.mp4, https://example.com/av2.mp4",
          " , https://example.com/a1.mp3,, https://example.com/a2.mp3, , ",
          dataUrl,
        ].join("\t"),
        // Row 2: data: URL in QnImg
        ["MediaTopic2", "1", "Q2", "A2", dataUrl, "", "", "", "", ""].join("\t"),
        // Row 3: all blank media cells
        ["MediaTopic3", "1", "Q3", "A3", "   ", "", "", "", "", ""].join("\t"),
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toEqual([]);
      expect(result.topics).toHaveLength(3);

      const q1 = result.topics[0].questions[0];
      expect(q1.qnImg).toEqual([]); // blank cell
      expect(q1.ansImg).toEqual(["https://example.com/single.jpg"]); // single link
      expect(q1.qnVid).toEqual(["https://example.com/v1.mp4", "https://example.com/v2.mp4"]); // separated by ,
      expect(q1.ansVid).toEqual(["https://example.com/av1.mp4", "https://example.com/av2.mp4"]); // separated by ,
      expect(q1.qnAud).toEqual(["https://example.com/a1.mp3", "https://example.com/a2.mp3"]); // trailing and doubled commas
      expect(q1.ansAud).toEqual([dataUrl]); // data: URL left intact

      const q2 = result.topics[1].questions[0];
      expect(q2.qnImg).toEqual([dataUrl]);

      const q3 = result.topics[2].questions[0];
      expect(q3.qnImg).toEqual([]);
      expect(q3.ansImg).toEqual([]);
      expect(q3.qnVid).toEqual([]);
      expect(q3.ansVid).toEqual([]);
      expect(q3.qnAud).toEqual([]);
      expect(q3.ansAud).toEqual([]);
    });
  });

  describe("Validation Failures: Topic count multiple of 3", () => {
    it("should report error when topic count is 14 (user's specific example)", () => {
      const topicRows = Array.from({ length: 14 }, (_, i) => `Topic${i + 1}\t1\tQ\tA\t\t\t\t\t\t`);
      const tsvContent = [headers, ...topicRows].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toContain("Expected a multiple of 3 topics, got 14");
      expect(result.topics).toHaveLength(14);
    });

    it("should report error when topic count is 1", () => {
      const tsvContent = [headers, "SoloTopic\t1\tQuestion\tAnswer\t\t\t\t\t\t"].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toContain("Expected a multiple of 3 topics, got 1");
    });

    it("should report error when topic count is 2", () => {
      const tsvContent = [
        headers,
        "TopicA\t1\tQuestion A\tAnswer A\t\t\t\t\t\t",
        "TopicB\t1\tQuestion B\tAnswer B\t\t\t\t\t\t",
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toContain("Expected a multiple of 3 topics, got 2");
    });

    it("should report error when topic count is 4", () => {
      const tsvContent = [
        headers,
        "T1\t1\tQ1\tA1\t\t\t\t\t\t",
        "T2\t1\tQ2\tA2\t\t\t\t\t\t",
        "T3\t1\tQ3\tA3\t\t\t\t\t\t",
        "T4\t1\tQ4\tA4\t\t\t\t\t\t",
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toContain("Expected a multiple of 3 topics, got 4");
    });

    it("should report error when topic count is 0 for empty or whitespace content", () => {
      const resultEmpty = parseTsv("");
      expect(resultEmpty.errors).toContain("Expected a multiple of 3 topics, got 0");
      expect(resultEmpty.topics).toEqual([]);

      const resultWhitespace = parseTsv("   \n\t  \n");
      expect(resultWhitespace.errors).toContain("Expected a multiple of 3 topics, got 0");
      expect(resultWhitespace.topics).toEqual([]);
    });

    it("should report error when topic count is 0 for header-only TSV", () => {
      const result = parseTsv(headers);
      expect(result.errors).toContain("Expected a multiple of 3 topics, got 0");
      expect(result.topics).toEqual([]);
    });
  });

  describe("Validation Failures: Every topic must have at least one question", () => {
    it("should report error when a topic row exists but has no question content", () => {
      const tsvContent = [
        headers,
        "Astronomy\t1\tWhat is the nearest star to Earth?\tThe Sun\t\t\t\t\t\t",
        "Geography\t\t\t\t\t\t\t\t\t", // Topic with no QnText / AnsText
        "Biology\t1\tWhat is the powerhouse of the cell?\tMitochondria\t\t\t\t\t\t",
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.topics).toHaveLength(3);
      expect(result.errors).toContain(
        'Topic "Geography" has no questions. Every topic must have at least one question.'
      );
    });

    it("should report multiple errors when both topic count and empty questions fail", () => {
      const tsvContent = [headers, "SoloTopicWithNoQuestions\t\t\t\t\t\t\t\t\t"].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.errors).toContain("Expected a multiple of 3 topics, got 1");
      expect(result.errors).toContain(
        'Topic "SoloTopicWithNoQuestions" has no questions. Every topic must have at least one question.'
      );
    });
  });

  describe("Resilience: Never throws", () => {
    it("should handle null and undefined input gracefully without throwing", () => {
      // @ts-expect-error testing invalid input at runtime
      const resultNull = parseTsv(null);
      expect(resultNull.topics).toEqual([]);
      expect(resultNull.errors).toContain("Invalid input: TSV content must be a string.");

      // @ts-expect-error testing invalid input at runtime
      const resultUndefined = parseTsv(undefined);
      expect(resultUndefined.topics).toEqual([]);
      expect(resultUndefined.errors).toContain("Invalid input: TSV content must be a string.");
    });

    it("should handle questions with missing TopicName gracefully", () => {
      const tsvContent = [
        headers,
        "\t1\tOrphan Question\tOrphan Answer\t\t\t\t\t\t",
        "TopicA\t1\tQA\tAA\t\t\t\t\t\t",
        "TopicB\t1\tQB\tAB\t\t\t\t\t\t",
        "TopicC\t1\tQC\tAC\t\t\t\t\t\t",
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.topics).toHaveLength(3);
      expect(result.errors).toContain("Row 1: Question is missing a TopicName.");
    });

    it("should handle invalid question number gracefully", () => {
      const tsvContent = [
        headers,
        "TopicA\tnot-a-number\tQA\tAA\t\t\t\t\t\t",
        "TopicB\t1\tQB\tAB\t\t\t\t\t\t",
        "TopicC\t1\tQC\tAC\t\t\t\t\t\t",
      ].join("\n");

      const result = parseTsv(tsvContent);

      expect(result.topics).toHaveLength(3);
      expect(result.errors).toContain('Row 1: Invalid question number "not-a-number".');
      // Should fallback gracefully to index
      expect(result.topics[0].questions[0].qnNo).toBe(1);
    });
  });
});
