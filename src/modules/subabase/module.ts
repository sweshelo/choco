import { Ranking } from '@/types/chase/ranking';
import { supabase } from './client'
import { format } from 'date-fns-tz';

interface FetchUsersParams {
  players: string[]
}

export const fetchUserLatestRecords = async({ players }: FetchUsersParams) => {
  const { data, error } = await supabase
    .rpc('get_records_by_player_names', { player_names: players });

  if (error) {
    console.error(error);
    return null;
  }

  return data;
}

export const insertRecords = async(records: Ranking[]) => {
  const _record = records.map(record => ({
    player_name: record.name,
    chara: record.chara,
    point: record.points.current,
    diff: record.points.diff,
    ranking: record.rank,
    achievement: record.achivement.title,
    recorded_at: format(record.recordedAt, "yyyy-MM-dd'T'HH:mm:ss.SSSXXX", { timeZone: 'Asia/Tokyo' }),
    elapsed: record.elapsed,
  }))

  const { error } = await supabase.from('record').insert(_record);

  if (error) {
    console.error(error);
    return null;
  }

  return;
}