import { PlayerId, ChallengePairing, Round } from "@/types";

/**
 * Generates all 6 possible permutations of 3 players.
 */
export function getPlayerPermutations<T = PlayerId>(players: [T, T, T]): [T, T, T][] {
  const [p1, p2, p3] = players;
  return [
    [p1, p2, p3],
    [p1, p3, p2],
    [p2, p1, p3],
    [p2, p3, p1],
    [p3, p1, p2],
    [p3, p2, p1],
  ];
}

/**
 * Builds the 3 challenge pairings for a round given a 3-player ordering [P1, P2, P3].
 *
 * Fixed pattern:
 * 1. P1 challenges P2 (third: P3)
 * 2. P2 challenges P3 (third: P1)
 * 3. P3 challenges P1 (third: P2)
 *
 * Returns exactly those 3 objects in that order.
 */
export function buildRoundPairings<T = PlayerId>(order: [T, T, T]): ChallengePairing<T>[] {
  const [p1, p2, p3] = order;

  return [
    { challenger: p1, defender: p2, third: p3 },
    { challenger: p2, defender: p3, third: p1 },
    { challenger: p3, defender: p1, third: p2 },
  ];
}

/**
 * Builds a complete game schedule for 3 players given the total topic count.
 *
 * - Computes roundCount = topicCount / 3.
 * - For each round, independently and uniformly picks one of the 6 permutations
 *   of players at random (no balancing, no constraint against repeats).
 * - All roundCount random choices are made once, upfront.
 * - Builds each round's 3 pairings via buildRoundPairings.
 *
 * @param players The 3 players in the game [P1, P2, P3]
 * @param topicCount Total number of topics (roundCount = topicCount / 3)
 * @param randomFn Optional RNG source (defaults to Math.random)
 */
export function buildGameSchedule<T = PlayerId>(
  players: [T, T, T],
  topicCount: number,
  randomFn: () => number = Math.random
): Round<T>[] {
  const roundCount = Math.floor(Math.max(0, topicCount) / 3);
  const permutations = getPlayerPermutations(players);
  const schedule: Round<T>[] = [];

  for (let i = 0; i < roundCount; i++) {
    const randomIndex = Math.floor(randomFn() * permutations.length);
    const chosenOrder = permutations[randomIndex];
    const pairings = buildRoundPairings(chosenOrder);

    schedule.push({
      roundNumber: i + 1,
      order: chosenOrder,
      pairings,
    });
  }

  return schedule;
}
