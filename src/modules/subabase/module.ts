import { supabase } from './client'

interface FetchUsersParams {
  players: string[]
}

export const fetchUserLatestRecords = async({ players }: FetchUsersParams) => {
  const { data, error } = await supabase
    .from('record')
    .select('*')
    .in('player_name', players)  // player_nameでフィルタ
    .order('created_at', { ascending: false }) // 作成日時の降順で並べ替え

  if (error) {
    console.error(error);
    return null;
  }

  // 各player_nameに対して最新のレコード1件を取得する
  const latestRecords = players.map(player =>
    data.find(record => record.player_name === player)
  );

  return latestRecords;
}