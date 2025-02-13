import { Database } from "../schema";

type Achievement = Database['public']['Tables']['achievement']['Row'];
type Record = Database['public']['Tables']['record']['Row'];
type Player = Database['public']['Tables']['player']['Row'];
type Season = Database['public']['Tables']['season']['Row'];
type Schedule = Database['public']['Tables']['schedule']['Row'];

export { Achievement, Record, Player, Season, Schedule };