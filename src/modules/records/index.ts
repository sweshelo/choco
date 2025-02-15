import { Record } from "@/types/chase";
import { getAllSeasonRecord, upsertPlayer } from "../subabase/modules/analyze";

type ValidRecord = Omit<Record, 'diff' | 'elapsed'> & {
  diff: number;
  elapsed: number;
}

function isValidRecord(record: Record): record is ValidRecord {
  return record.diff !== null && record.elapsed !== null && record.elapsed < 600;
}

export default async function analyze() {

  const records = await getAllSeasonRecord();
  if (!records) return;

  // プレイヤーごとに記録をグループ化
  const playerRecords: { [playerName: string]: typeof records } = {};
  records?.forEach(record => {
    const name = record.player_name;
    if (!playerRecords[name]) {
      playerRecords[name] = [];
    }
    playerRecords[name].push(record);
  });

  // 各プレイヤーの統計情報を計算する型
  type PlayerStats = {
    average: number;
    effective_average: number | null;
    count: number;
    deviation?: number; // 偏差値
    records: typeof records;
  }

  const playerStats: { [playerName: string]: PlayerStats } = {};

  // 各プレイヤーの average と effective_average を算出
  Object.keys(playerRecords).forEach(playerName => {
    const recs = playerRecords[playerName].filter(isValidRecord).sort((a, b) => {
      return new Date(b.recorded_at ?? '').getTime() - new Date(a.recorded_at ?? '').getTime();
    });

    const [last] = recs;
    const threshould = 1000 * 60 * 60 * 24 * 50; // 50日

    // 記録が5件以下か、最終プレイから50日経過している場合は偏差値算出対象外にする
    if((new Date()).getTime() - (new Date(last.recorded_at ?? '')).getTime() > threshould || recs.length <= 5) return;

    const count = recs.length;
    // 平均点 (diff の平均)
    const total = recs.reduce((sum, rec) => sum + rec.diff!, 0);
    const average = total / count;

    // 110件を超えていれば、有効平均点を計算（上下5件を除外）
    let effective_average: number | null = null;
    if (count > 110) {
      const sortedPoints = recs
        .map(rec => rec.diff)
        .sort((a, b) => a - b);
      // 上下5件を除外
      const effectivePoints = sortedPoints.slice(5, sortedPoints.length - 5);
      const effectiveTotal = effectivePoints.reduce((sum, p) => sum + p, 0);
      effective_average = effectiveTotal / effectivePoints.length;
    }

    playerStats[playerName] = {
      average,
      effective_average,
      count,
      records: recs
    }
  });

  // すべてのプレイヤーの average の平均を算出
  const averages = Object.values(playerStats).map(stat => stat.average).filter(Boolean);
  const overallAverage = averages.reduce((sum, a) => sum + a, 0) / averages.length;

  // 標準偏差を算出
  const variance = averages.reduce((sum, a) => sum + Math.pow(a - overallAverage, 2), 0) / averages.length;
  const stdDeviation = Math.sqrt(variance);

  // 各プレイヤーの average の偏差値を算出
  // （標準的な偏差値の計算式：50 + 10 * (score - mean) / stdDeviation）
  Object.keys(playerStats).forEach(playerName => {
    if (stdDeviation === 0) {
      playerStats[playerName].deviation = 50;
    } else {
      playerStats[playerName].deviation = 50 + 10 * ((playerStats[playerName].average - overallAverage) / stdDeviation);
    }
  });

  const players = Object.entries(playerStats).map(([name, stats]) => ({
    name,
    average: Number.isNaN(stats.average) ? null : stats.average,
    effective_average: stats.effective_average,
    deviation_value: Number.isNaN(stats.deviation) ? null : stats.deviation ?? null,
  }))

  await upsertPlayer(players);
}