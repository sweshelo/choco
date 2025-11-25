import { SupabaseClient } from "@supabase/supabase-js";
import ranking from "./modules/ranking";
import analyze from "./modules/records";
import { schedule } from "./modules/schedule";
import { Env, getSupabaseClient } from "./modules/subabase/client";
import { differenceInDays, differenceInHours } from "date-fns";

const fetchRankingWithLogging = async (supabase: SupabaseClient) => {
  const start = new Date();

  // 深夜～早朝は実行しない
  const hour = (start.getUTCHours() + 9) % 24
  console.info("current time: ", hour)
  if (hour >= 1 && hour <= 5) return;

  try {
    console.info(`> Session START @ ${start.toUTCString()}`);
    await ranking(supabase)
    console.info(`Duration: ${(new Date().getTime() - start.getTime()) / 1000}sec.`)
    console.info('=== Completed ===\n')
  } catch (e) {
    console.error(`❌ Ranking fetch failed at: ${new Date().toISOString()}`);
    console.error('Error details:', e instanceof Error ? e.message : e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
    console.info('\n')
  };
}

const analyzeWithLogging = async (supabase: SupabaseClient) => {
  const start = new Date();

  try {
    console.info(`> Analyze START @ ${start.toUTCString()}`);
    await analyze(supabase)
    console.info(`Duration: ${(new Date().getTime() - start.getTime()) / 1000}sec.`)
    console.info('=== Completed ===\n')
  } catch (e) {
    console.error(`❌ Analyze failed at: ${new Date().toISOString()}`);
    console.error('Error details:', e instanceof Error ? e.message : e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
    console.info('\n')
  };
}

const fetchScheduleWithLogging = async (supabase: SupabaseClient) => {
  const start = new Date();

  try {
    console.info(`> Schedule Fetch START @ ${new Date().toUTCString()}`);
    await schedule(supabase)
    console.info(`Duration: ${(new Date().getTime() - start.getTime()) / 1000}sec.`)
    console.info('=== Completed ===\n')
  } catch (e) {
    console.error(`❌ Schedule fetch failed at: ${new Date().toISOString()}`);
    console.error('Error details:', e instanceof Error ? e.message : e);
    console.error('Stack trace:', e instanceof Error ? e.stack : 'No stack trace available');
    console.info('\n')
  }
}

const main = async (env: Env) => {
  const supabase = getSupabaseClient(env);
  const DEFAULT_DATE = "2000/01/01 00:00:00";

  // 7日おき
  const weekly = await env.CF_KV?.get('lastrun_weekly');
  if (differenceInDays(new Date(), new Date(weekly || DEFAULT_DATE)) >= 7) {
    await fetchScheduleWithLogging(supabase);
    await env.CF_KV?.put('lastrun_weekly', new Date().toISOString())
    return
  }

  // 12時間おき
  const daily = await env.CF_KV?.get('lastrun_daily');
  if (differenceInHours(new Date(), new Date(daily || DEFAULT_DATE)) >= 12) {
    await analyzeWithLogging(supabase);
    await env.CF_KV?.put('lastrun_daily', new Date().toISOString())
    return
  }

  // 3分おき
  await fetchRankingWithLogging(supabase);
}

export default {
   
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(main(env));
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return new Response(`
        Hello, this is choco, worker of Enma-V2!

        LastAnalyzed: ${await env.CF_KV?.get('lastrun_daily')}
        LastScheduleFetched: ${await env.CF_KV?.get('lastrun_weekly')}
    `)
  }
}
