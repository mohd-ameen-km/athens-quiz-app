import Papa from "papaparse";
import { Topic, Question, ParseTsvResult } from "@/types";

/**
 * Normalizes a cell string:
 * - Normalizes \r\n and \r to \n
 * - Converts literal two-character \n sequences into real newline characters
 * - Trims only leading and trailing whitespace on the cell, preserving internal whitespace and blank lines
 */
function normalizeCellValue(val: unknown): string {
  if (val === undefined || val === null) return "";
  return String(val).replace(/\r\n/g, "\n").replace(/\r/g, "\n").replace(/\\n/g, "\n").trim();
}

/**
 * Retrieves a column value from a row object in a case-insensitive manner.
 */
function getColumnValue(row: Record<string, unknown>, targetName: string): string {
  if (row[targetName] !== undefined && row[targetName] !== null) {
    return normalizeCellValue(row[targetName]);
  }
  const targetLower = targetName.toLowerCase();
  for (const key of Object.keys(row)) {
    if (key.trim().toLowerCase() === targetLower) {
      return normalizeCellValue(row[key]);
    }
  }
  return "";
}

/**
 * Parses TSV content into Topics and Questions according to the specification.
 *
 * Expected columns:
 * TopicName, QnNo, QnText, AnsText, QnImg, AnsImg, QnVid, AnsVid, QnAud, AnsAud
 *
 * Validation rules:
 * 1. Topic count must be a positive multiple of 3 (e.g. 3, 6, 9, ...).
 * 2. Every topic must have at least one question.
 *
 * Returns { topics, errors }, never throws.
 */
export function parseTsv(tsvContent: string): ParseTsvResult {
  const errors: string[] = [];
  const topicsMap = new Map<string, Topic>();

  try {
    if (typeof tsvContent !== "string") {
      return {
        topics: [],
        errors: ["Invalid input: TSV content must be a string."],
      };
    }

    const normalizedContent = tsvContent.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
    const trimmed = normalizedContent.trim();
    if (!trimmed) {
      return {
        topics: [],
        errors: ["Expected a multiple of 3 topics, got 0"],
      };
    }

    const parseResult = Papa.parse<Record<string, unknown>>(normalizedContent, {
      delimiter: "\t",
      quoteChar: '"',
      escapeChar: '"',
      header: true,
      skipEmptyLines: "greedy",
      transformHeader: (header: string) => header.trim(),
    });

    if (parseResult.errors && parseResult.errors.length > 0) {
      for (const err of parseResult.errors) {
        errors.push(
          `TSV Parse Error: ${err.message}${err.row !== undefined ? ` at row ${err.row + 1}` : ""}`
        );
      }
    }

    const rows = parseResult.data;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const topicName = getColumnValue(row, "TopicName");
      const rawQnNo = getColumnValue(row, "QnNo");
      const qnText = getColumnValue(row, "QnText");
      const ansText = getColumnValue(row, "AnsText");

      // Optional media fields
      const qnImg = getColumnValue(row, "QnImg") || undefined;
      const ansImg = getColumnValue(row, "AnsImg") || undefined;
      const qnVid = getColumnValue(row, "QnVid") || undefined;
      const ansVid = getColumnValue(row, "AnsVid") || undefined;
      const qnAud = getColumnValue(row, "QnAud") || undefined;
      const ansAud = getColumnValue(row, "AnsAud") || undefined;

      // If row has no TopicName
      if (!topicName) {
        if (qnText || ansText) {
          errors.push(`Row ${i + 1}: Question is missing a TopicName.`);
        }
        continue;
      }

      // Initialize topic in insertion order if not seen yet
      if (!topicsMap.has(topicName)) {
        topicsMap.set(topicName, {
          name: topicName,
          questions: [],
        });
      }

      const currentTopic = topicsMap.get(topicName)!;

      // If the row contains question text or answer text, add the question
      if (qnText || ansText) {
        let qnNo = currentTopic.questions.length + 1;
        if (rawQnNo !== "") {
          const parsed = Number(rawQnNo);
          if (!isNaN(parsed)) {
            qnNo = parsed;
          } else {
            errors.push(`Row ${i + 1}: Invalid question number "${rawQnNo}".`);
          }
        }

        const question: Question = {
          topicName,
          qnNo,
          qnText,
          ansText,
          ...(qnImg ? { qnImg } : {}),
          ...(ansImg ? { ansImg } : {}),
          ...(qnVid ? { qnVid } : {}),
          ...(ansVid ? { ansVid } : {}),
          ...(qnAud ? { qnAud } : {}),
          ...(ansAud ? { ansAud } : {}),
        };

        currentTopic.questions.push(question);
      }
    }

    const topics = Array.from(topicsMap.values());
    const topicCount = topics.length;

    // Validation 1: Topic count must be a positive multiple of 3
    if (topicCount === 0 || topicCount % 3 !== 0) {
      errors.push(`Expected a multiple of 3 topics, got ${topicCount}`);
    }

    // Validation 2: Every topic has at least one question
    for (const topic of topics) {
      if (topic.questions.length === 0) {
        errors.push(
          `Topic "${topic.name}" has no questions. Every topic must have at least one question.`
        );
      }
    }

    return { topics, errors };
  } catch (err) {
    errors.push(err instanceof Error ? err.message : String(err));
    return { topics: [], errors };
  }
}

export default parseTsv;
