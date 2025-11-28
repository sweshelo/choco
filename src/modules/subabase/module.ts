import { Ranking } from '@/types/chase/ranking';
import { format } from 'date-fns';
import { Achievement as DBAchievement, Schedule as DBSchedule } from '@/types/chase';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/schema';

interface FetchUsersParams {
  players: string[]
}

export const fetchUserLatestRecords = async (supabase: SupabaseClient<Database>, { players }: FetchUsersParams) => {
  const { data, error } = await supabase
    .rpc('get_records_by_player_names', { player_names: players });

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export const fetchUsers = async (supabase: SupabaseClient<Database>, { players }: FetchUsersParams) => {
  const { data, error } = await supabase.from('player').select('*').in('name', players)
  if (error) {
    console.error(error)
    return null
  }
  return data;
}

export const fetchAnons = async (supabase: SupabaseClient<Database>) => {
  const { data, error } = await supabase
    .from('record')
    .select('*')
    .eq('player_name', 'プレーヤー')
    .order('recorded_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('匿名プレイヤーデータの取得に失敗しました:', error);
    return [];
  }

  return data;
}

export const insertRecords = async (supabase: SupabaseClient<Database>, _records: Ranking[]) => {
  const records = _records.map(record => ({
    player_name: record.name,
    chara: record.chara,
    point: record.points.current,
    diff: (typeof record.points.diff === 'number' && record.points.diff <= 32767 && record.points.diff >= 50) ? record.points.diff : null,
    ranking: record.rank,
    achievement: record.achievement.title,
    recorded_at: format(record.recordedAt, "yyyy-MM-dd'T'HH:mm:ss.SSS"),
    elapsed: record.elapsed,
  }))

  const { error: insertError } = await supabase.from('record').insert(records.filter(record => record.diff !== 0));
  console.info('=== Updated ===')
  records.filter(record => record.diff !== 0).forEach(record => {
    console.info(`${record.player_name} - ${record.point}P (+${record.diff}P) | ♺ ${record.elapsed}sec.`)
  })

  if (insertError) {
    console.error(insertError);
    return null;
  }

  const { error: updateError } = await supabase.from('player').upsert(records.map(record => ({
    name: record.player_name,
    ranking: record.ranking,
    updated_at: record.recorded_at,
    points: record.point,
  })).filter(player => player.name !== 'プレーヤー'), { onConflict: 'name' })

  if (updateError) {
    console.error(updateError)
    return null;
  }

  return;
}

export type Achievement = Omit<DBAchievement, 'created_at' | 'id'>
export const upsertAchievements = async (supabase: SupabaseClient<Database>, achievements: Achievement[]) => {
  const { error } = await supabase.from('achievement').upsert(achievements, { onConflict: 'title' })
  if (error) console.error(error);

  return;
}

export type Schedule = Omit<DBSchedule, 'id' | 'created_at'>
export const insertSchedules = async (supabase: SupabaseClient<Database>, schedule: Schedule[]) => {
  // 最新の1件のみ取得（データがない場合はnull）
  const { data: latestSchedule, error: selectError } = await supabase
    .from('schedule')
    .select('started_at')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (selectError) {
    console.error(selectError);
    return null;
  }

  console.log(latestSchedule?.started_at);

  // 最新データより新しいもののみフィルタリング
  // Date型に変換して数値比較を行う
  const targets = schedule.filter(s => {
    if (!s.started_at) return false;
    if (!latestSchedule || !latestSchedule.started_at) return true;

    // Date型に変換して数値として比較
    const scrapedDate = new Date(s.started_at);
    const latestDate = new Date(latestSchedule.started_at);
    return scrapedDate.getTime() > latestDate.getTime();
  });

  if (targets.length === 0) {
    console.info('No new schedules to insert');
    return;
  }

  const { error: insertError } = await supabase.from('schedule').insert(targets);
  if (insertError) {
    console.error(insertError);
    return null;
  }

  console.info(`Inserted ${targets.length} new schedule(s)`);
}
