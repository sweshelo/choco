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
    diff: (typeof record.points.diff === 'number' && record.points.diff <= 32767 && record.points.diff >= -32768) ? record.points.diff : null,
    ranking: record.rank,
    achievement: record.achievement.title,
    recorded_at: format(record.recordedAt, "yyyy-MM-dd'T'HH:mm:ss.SSS"),
    elapsed: record.elapsed,
    version: record.version,
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

// 特殊処理をスキップする称号名の定数（今後増える可能性を考慮し配列で管理）
const SKIP_MARKUP_UPDATE_TITLES = ['鬼ヶ丘体育高校'];

export type Achievement = Omit<DBAchievement, 'created_at' | 'id'>
export const upsertAchievements = async (supabase: SupabaseClient<Database>, achievements: Achievement[]) => {
  // 1. 既存のachievementsを全て取得（DBの型にはidが含まれる）
  const { data: existingAchievements, error: fetchError } = await supabase
    .from('achievement')
    .select('id, title, markup');
  
  if (fetchError) {
    console.error(fetchError);
    return;
  }

  const achievementsToInsert: Achievement[] = [];
  const achievementsToUpdate: { id: number; markup: string | null }[] = [];

  // 2. 各achievementを処理
  for (const achievement of achievements) {
    // titleをキーに既存レコードを検索
    const existing = existingAchievements?.find(e => e.title === achievement.title);
    
    if (existing) {
      // 既存レコードがある場合
      // 条件: markup === title AND 新markup !== 旧markup AND titleが例外リストに含まれない
      if (
        existing.markup === existing.title &&
        achievement.markup !== existing.markup &&
        !SKIP_MARKUP_UPDATE_TITLES.includes(existing.title)
      ) {
        // markupのみ更新（existingからidを取得）
        achievementsToUpdate.push({
          id: existing.id,
          markup: achievement.markup
        });
      }
      // その他の既存レコードはスキップ（何もしない）
    } else {
      // レコードがない場合はinsert対象に追加
      achievementsToInsert.push(achievement);
    }
  }

  // 3. Insert処理
  if (achievementsToInsert.length > 0) {
    const { error: insertError } = await supabase
      .from('achievement')
      .insert(achievementsToInsert);
    
    if (insertError) {
      console.error('Insert error:', insertError);
    }
  }

  // 4. Update処理
  for (const updateData of achievementsToUpdate) {
    const { error: updateError } = await supabase
      .from('achievement')
      .update({ markup: updateData.markup })
      .eq('id', updateData.id);
    
    if (updateError) {
      console.error('Update error:', updateError);
    }
  }

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
