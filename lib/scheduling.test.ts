import { describe, it, expect } from "vitest";
import { buildRoundPairings, buildGameSchedule, getPlayerPermutations } from "./scheduling";
import { PlayerId } from "@/types";

describe("scheduling", () => {
  const players: [PlayerId, PlayerId, PlayerId] = ["Alice", "Bob", "Charlie"];

  describe("getPlayerPermutations", () => {
    it("should return exactly 6 unique permutations of 3 players", () => {
      const permutations = getPlayerPermutations(players);

      expect(permutations).toHaveLength(6);

      const serialized = permutations.map((p) => p.join(","));
      const unique = new Set(serialized);
      expect(unique.size).toBe(6);

      expect(permutations).toEqual([
        ["Alice", "Bob", "Charlie"],
        ["Alice", "Charlie", "Bob"],
        ["Bob", "Alice", "Charlie"],
        ["Bob", "Charlie", "Alice"],
        ["Charlie", "Alice", "Bob"],
        ["Charlie", "Bob", "Alice"],
      ]);
    });
  });

  describe("buildRoundPairings", () => {
    it("should return exactly 3 pairings following P1->P2, P2->P3, P3->P1 with third player uninvolved", () => {
      const order: [PlayerId, PlayerId, PlayerId] = ["P1", "P2", "P3"];
      const pairings = buildRoundPairings(order);

      expect(pairings).toHaveLength(3);
      expect(pairings[0]).toEqual({
        challenger: "P1",
        defender: "P2",
        third: "P3",
      });
      expect(pairings[1]).toEqual({
        challenger: "P2",
        defender: "P3",
        third: "P1",
      });
      expect(pairings[2]).toEqual({
        challenger: "P3",
        defender: "P1",
        third: "P2",
      });
    });

    it("should ensure that for ANY permutation, each of the 3 players appears as challenger exactly once, defender exactly once, and third exactly once", () => {
      const allPermutations = getPlayerPermutations(players);

      for (const order of allPermutations) {
        const pairings = buildRoundPairings(order);

        expect(pairings).toHaveLength(3);

        for (const player of players) {
          const asChallenger = pairings.filter((p) => p.challenger === player);
          const asDefender = pairings.filter((p) => p.defender === player);
          const asThird = pairings.filter((p) => p.third === player);

          expect(
            asChallenger,
            `Expected ${player} to be challenger exactly once in order [${order.join(", ")}]`
          ).toHaveLength(1);
          expect(
            asDefender,
            `Expected ${player} to be defender exactly once in order [${order.join(", ")}]`
          ).toHaveLength(1);
          expect(
            asThird,
            `Expected ${player} to be third exactly once in order [${order.join(", ")}]`
          ).toHaveLength(1);
        }

        // Verify that third is never challenger or defender in that pairing
        for (const pairing of pairings) {
          expect(pairing.third).not.toBe(pairing.challenger);
          expect(pairing.third).not.toBe(pairing.defender);
        }
      }
    });
  });

  describe("buildGameSchedule", () => {
    it("should compute roundCount matching topicCount / 3 for several valid topic counts", () => {
      const testCases = [
        { topicCount: 3, expectedRounds: 1 },
        { topicCount: 6, expectedRounds: 2 },
        { topicCount: 9, expectedRounds: 3 },
        { topicCount: 12, expectedRounds: 4 },
        { topicCount: 15, expectedRounds: 5 },
        { topicCount: 30, expectedRounds: 10 },
      ];

      for (const { topicCount, expectedRounds } of testCases) {
        const schedule = buildGameSchedule(players, topicCount);
        expect(schedule).toHaveLength(expectedRounds);

        // Verify structure of each round
        schedule.forEach((round, index) => {
          expect(round.roundNumber).toBe(index + 1);
          expect(round.order).toHaveLength(3);
          expect(round.pairings).toHaveLength(3);
          // Pairings should match the output of buildRoundPairings for that round's order
          expect(round.pairings).toEqual(buildRoundPairings(round.order));
        });
      }
    });

    it("should return empty schedule for topicCount 0", () => {
      const schedule = buildGameSchedule(players, 0);
      expect(schedule).toEqual([]);
    });

    it("should produce varying permutation choices across rounds (not a fixed or hardcoded sequence)", () => {
      // Generate a schedule with 60 rounds to verify non-fixed, varying distribution
      const schedule = buildGameSchedule(players, 180); // 60 rounds
      expect(schedule).toHaveLength(60);

      const chosenOrders = schedule.map((r) => r.order.join(","));
      const uniqueOrders = new Set(chosenOrders);

      // Across 60 independent random draws from 6 permutations, multiple distinct permutations should be chosen
      expect(uniqueOrders.size).toBeGreaterThan(1);
      // With 60 draws, all 6 permutations are almost certainly observed (prob of missing one < (5/6)^60 ≈ 0.000018)
      expect(uniqueOrders.size).toBe(6);

      // Verify that two consecutive repeated calls to buildGameSchedule produce different sequences
      const scheduleA = buildGameSchedule(players, 30);
      const scheduleB = buildGameSchedule(players, 30);

      const seqA = scheduleA.map((r) => r.order.join(",")).join(";");
      const seqB = scheduleB.map((r) => r.order.join(",")).join(";");

      expect(seqA).not.toBe(seqB);
    });

    it("should correctly use a custom random function when provided", () => {
      // Deterministic sequence: 0, 1, 2, 3, 4, 5
      let counter = 0;
      const deterministicRng = () => {
        const val = (counter % 6) / 6;
        counter++;
        return val;
      };

      const permutations = getPlayerPermutations(players);
      const schedule = buildGameSchedule(players, 18, deterministicRng); // 6 rounds

      expect(schedule).toHaveLength(6);
      for (let i = 0; i < 6; i++) {
        expect(schedule[i].order).toEqual(permutations[i]);
      }
    });
  });
});
