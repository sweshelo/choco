import { supabase } from "../client"

export const getAllSeasonRecord = async () => {
  // 最新シーズンを取得
  const { data: seasons, error: seasonError } = await supabase.from('season').select('*').order('id', { ascending: false }).limit(1)
  if (seasonError) {
    console.log('season')
    console.error(seasonError)
    return;
  }

  const [season] = seasons

  // プレイヤー名『プレーヤー』以外の、最新シーズン中の記録を全件取得
  // ※ 最新シーズン中 = season.started_at 以降かつ (season.ended_at が存在すればそれ以前)
  let query = supabase
    .from('record')
    .select('*')
    .neq('player_name', 'プレーヤー')
    .gte('created_at', season.started_at)

  if (season.ended_at) {
    query = query.lte('created_at', season.ended_at)
  }

  const { data: records, error: recordError } = await query;
  if (recordError) {
    console.error(recordError);
    return;
  }

  return records;
}

interface Props {
  name: string;
  average: number | null;
  effective_average: number | null;
  deviation_value: number | null;
}
export const upsertPlayer = async (players: Props[]) => {
  const { error } = await supabase.from('player').upsert(players, { onConflict: 'name' })
  if (error) console.error(error)
}