import { SupabaseClient } from "@supabase/supabase-js";
import ranking from "./modules/ranking";
import analyze from "./modules/records";
import { schedule } from "./modules/schedule";
import { Env, getSupabaseClient } from "./modules/subabase/client";
import { differenceInDays, differenceInHours } from "date-fns";

const fetchRankingWithLogging = (supabase: SupabaseClient) => {
  const start = new Date();

  // 深夜～早朝は実行しない
  const hour = (start.getUTCHours() + 9) % 24
  if (hour >= 1 && hour <= 5) return;

  try {
    console.info('> Session START @ %s', start.toUTCString());
    return ranking(supabase).then(() => {
      console.info('Duration: %dsec.', (new Date().getTime() - start.getTime()) / 1000)
      console.info('=== Completed ===\n')
    });
  } catch (e) {
    console.error('❌ Ranking fetch failed at: %s', new Date().toISOString());
    console.error('Error details:', e instanceof Error ? e.message : e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
    console.info('\n')
  };
}

const analyzeWithLogging = (supabase: SupabaseClient) => {
  const start = new Date();

  try {
    console.info('> Analyze START @ %s', start.toUTCString());
    return analyze(supabase).then(() => {
      console.info('Duration: %dsec.', (new Date().getTime() - start.getTime()) / 1000)
      console.info('=== Completed ===\n')
    });
  } catch (e) {
    console.error('❌ Analyze failed at: %s', new Date().toISOString());
    console.error('Error details:', e instanceof Error ? e.message : e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
    console.info('\n')
  };
}

const fetchScheduleWithLogging = (supabase: SupabaseClient) => {
  const start = new Date();

  try {
    console.info('> Schedule Fetch START @ %s', new Date().toUTCString());
    return schedule(supabase).then(() => {
      console.info('Duration: %dsec.', (new Date().getTime() - start.getTime()) / 1000)
      console.info('=== Completed ===\n')
    })
  } catch (e) {
    console.error('❌ Schedule fetch failed at: %s', new Date().toISOString());
    console.error('Error details:', e instanceof Error ? e.message : e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
    console.info('\n')
  }
}

export default {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const supabase = getSupabaseClient(env);
    const DEFAULT_DATE = "2000/01/01 00:00:00";
    const daily = new Date(await env.CF_KV?.get('lastrun_daily') || DEFAULT_DATE);
    const weekly = new Date(await env.CF_KV?.get('lastrun_weekly') || DEFAULT_DATE);

    // 3分おき
    await fetchRankingWithLogging(supabase);

    // 12時間おき
    if (differenceInHours(new Date(), daily) >= 12) {
      await analyzeWithLogging(supabase);
      await env.CF_KV?.put('lastrun_daily', new Date().toISOString())
    }

    // 7日おき
    if (differenceInDays(new Date(), weekly) >= 7) {
      await fetchScheduleWithLogging(supabase);
      await env.CF_KV?.put('lastrun_weekly', new Date().toISOString())
    }
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return new Response("Hello, this is choco, worker of Enma-V2!")
  }
}
