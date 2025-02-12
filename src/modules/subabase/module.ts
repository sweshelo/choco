import { Ranking } from '@/types/chase/ranking';
import { supabase } from './client'
import { format } from 'date-fns-tz';

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
  const { data } = await supabase.from('record').select('*').eq('player_name', 'プレーヤー').order('recorded_at', { ascending: false }).limit(50);
  return data ?? [];
}

export const insertRecords = async (_records: Ranking[]) => {
  const records = _records.map(record => ({
    player_name: record.name,
    chara: record.chara,
    point: record.points.current,
    diff: record.points.diff,
    ranking: record.rank,
    achievement: record.achivement.title,
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