import { supabase } from './client'

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