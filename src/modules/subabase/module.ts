import { Ranking } from '@/types/chase/ranking';
import { supabase } from './client'
import { format } from 'date-fns-tz';
import { Achievement as DBAchievement, Schedule as DBSchedule } from '@/types/chase';

interface FetchUsersParams {
  players: string[]
}

export const fetchUserLatestRecords = async ({ players }: FetchUsersParams) => {
  const { data, error } = await supabase
    .rpc('get_records_by_player_names', { player_names: players });

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export const fetchUsers = async ({ players }: FetchUsersParams) => {
  const { data, error } = await supabase.from('player').select('*').in('name', players)
  if (error) {
    console.error(error)
    return null
  }
  return data;
}

export const fetchAnons = async () => {
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

export const insertRecords = async (_records: Ranking[]) => {
  const records = _records.map(record => ({
    player_name: record.name,
    chara: record.chara,
    point: record.points.current,
    diff: record.points.diff,
    ranking: record.rank,
    achievement: record.achievement.title,
    recorded_at: format(record.recordedAt, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone: 'Asia/Tokyo' }),
    elapsed: record.elapsed,
  }))

  const { error: insertError } = await supabase.from('record').insert(records.filter(record => record.diff !== 0));
  console.info('=== Updated ===')
  records.filter(record => record.diff !== 0).forEach(record => {
    console.info("%s - %dP (+%dP) | ♺ %dsec.", record.player_name, record.point, record.diff, record.elapsed)
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
export const upsertAchievements = async (achievements: Achievement[]) => {
  const { error } = await supabase.from('achievement').upsert(achievements, { onConflict: 'title' })
  if (error) console.error(error);

  return;
}

export type Schedule = Omit<DBSchedule, 'id' | 'created_at'>
export const insertSchedules = async (schedule: Schedule[]) => {
  const { data: scheduleData, error: selectError } = await supabase.from('schedule').select('*').order('started_at');
  if (selectError) {
    console.error(selectError);
    return null;
  }

  const targets = schedule.filter(s => !scheduleData.some(d => d.started_at === s.started_at!.replace(' ', 'T') && d.ended_at! === s.ended_at!.replace(' ', 'T')))

  const { error: insertError } = await supabase.from('schedule').insert(targets);
  if (insertError) {
    console.error(insertError);
    return null;
  }
}

