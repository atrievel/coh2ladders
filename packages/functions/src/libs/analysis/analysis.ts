import { getStatsDocRef, getTopStatsDocRef } from "../../fb-paths";
import { frequencyType, ProcessedMatch } from "../types";
import { analyzeMatches, analyzeTopMatches } from "./match-analysis";
import * as functions from "firebase-functions";
import { globallyAnalyzedMatches, globallyAnalyzedTopMatches } from "../global-stats";
import { getLadderNameIDsForTimestamp } from "../ladders/ladder-data";

// const db = firestore();

/**
 * Save analysis to the FR.
 * @param stats
 * @param timestamp
 * @param statType
 */
const saveAnalysis = async (
  stats: Record<string, any>,
  timestamp: number,
  statType: frequencyType = "daily",
): Promise<void> => {
  const statRef = getStatsDocRef(timestamp, statType);
  try {
    await statRef.set(stats);
    // Disable the update function. This was suppose to run when run
    // await db.runTransaction(async (t) => {
    //   const statDoc = await t.get(statRef);
    //   let data = statDoc.data();
    //   if (data == undefined) {
    //     data = {};
    //   }
    //   data = sumValuesOfObjects(data as StatDict, stats);
    //   t.set(statRef, data);
    // });
  } catch (e) {
    functions.logger.error(
      `Failed to save new analysis stats into ${statRef.path}`,
      timestamp,
      stats,
      e,
    );
  }
};

const saveTopAnalysis = async (
  stats: Record<string, any>,
  timestamp: number | string,
  statType: frequencyType = "daily",
): Promise<void> => {
  const topStatsDocRef = getTopStatsDocRef(timestamp, statType);
  try {
    await topStatsDocRef.set(stats);
  } catch (e) {
    functions.logger.error(
      `Failed to save top Stats analysis stats into ${topStatsDocRef.path}`,
      timestamp,
      stats,
      e,
    );
  }
};

const analyzeAndSaveMatchStats = async (
  matches: Array<ProcessedMatch>,
  dateTimeStamp: number,
): Promise<void> => {
  functions.logger.log(`Stats - analyzing ${matches.length} matches.`);
  const stats = analyzeMatches(matches);
  functions.logger.log(`Stats analyzed, going to save them.`);
  await globallyAnalyzedMatches(matches.length);
  await saveAnalysis(stats, dateTimeStamp);
};

const analyzeAndSaveTopMatchStats = async (
  matches: Array<ProcessedMatch>,
  dateTimeStamp: number,
): Promise<void> => {
  // Top ladder IDS
  const ladderIDs = await getLadderNameIDsForTimestamp(dateTimeStamp);
  functions.logger.log(
    `Stats - analyzing ${matches.length} matches as TOP analysis for timestamp ${dateTimeStamp}.`,
  );

  const stats = analyzeTopMatches(matches, ladderIDs);
  await saveTopAnalysis(stats, dateTimeStamp);
  await globallyAnalyzedTopMatches(
    (stats["1v1"]["matchCount"] || 0) +
      (stats["2v2"]["matchCount"] || 0) +
      (stats["3v3"]["matchCount"] || 0) +
      (stats["4v4"]["matchCount"] || 0),
  );

  functions.logger.log(`Stats analyzed, going to save them.`);
};

export { analyzeAndSaveMatchStats, saveAnalysis, saveTopAnalysis, analyzeAndSaveTopMatchStats };
