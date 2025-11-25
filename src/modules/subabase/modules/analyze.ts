import { Record } from "@/types/chase"
import { Database } from "@/types/schema"
import { SupabaseClient } from "@supabase/supabase-js"

export const getAllSeasonRecord = async (supabase: SupabaseClient<Database>) => {
  // 最新シーズンを取得
  const { data: seasons, error: seasonError } = await supabase
    .from('season')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
  if (seasonError) {
    console.log('season')
    console.error(seasonError)
    return;
  }

  const [season] = seasons;

  // 全員をNullに戻す
  const { error: nullFillError } = await supabase.from('player').update({
    'average': null,
    'deviation_value': null,
    'effective_average': null,
  }).not('average', 'is', null)

  if(nullFillError){
    console.error('プレイヤーの初期化に失敗: ', nullFillError)
  }

  // 1ページあたりのレコード数
  const pageSize = 1000;
  let offset = 0;
  let allRecords: Record[] = [];

  while (true) {
    // 最新シーズン中の記録をページごとに取得
    let query = supabase
      .from('record')
      .select('*')
      .neq('player_name', 'プレーヤー')
      .gte('recorded_at', season?.started_at)
      .lt('elapsed', 600)
      .lt('diff', 500)
      .range(offset, offset + pageSize - 1); // オフセットと上限を指定

    if (season?.ended_at) {
      query = query.lte('recorded_at', season.ended_at);
    }

    const { data, error } = await query;
    if (error) {
      console.error(error);
      break;
    }

    // 取得したデータがなければループ終了
    if (!data || data.length === 0) {
      break;
    }

    allRecords = allRecords.concat(data);

    // 取得件数がページサイズ未満なら、最後のページなのでループ終了
    if (data.length < pageSize) {
      break;
    }

    // 次のページへ
    offset += pageSize;
  }

  console.log(`Target: ${allRecords.length} records.`);
  return allRecords;
}

interface Props {
  name: string;
  average: number | null;
  effective_average: number | null;
  deviation_value: number | null;
}
export const upsertPlayer = async (supabase: SupabaseClient<Database>, players: Props[]) => {
  const { error } = await supabase.from('player').upsert(players, { onConflict: 'name' })
  if (error) console.error(error)
}