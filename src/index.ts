import { SupabaseClient } from "@supabase/supabase-js";
import ranking from "./modules/ranking";
import analyze from "./modules/records";
import { schedule } from "./modules/schedule";
import { Env, getSupabaseClient } from "./modules/subabase/client";
import { differenceInDays, differenceInHours } from "date-fns";

const DEFAULT_DATE = "2000-01-01T00:00:00Z";

const fetchRankingWithLogging = async (supabase: SupabaseClient, version: string | null = null) => {
  const start = new Date();

  // 深夜～早朝は実行しない
  const hour = (start.getUTCHours() + 9) % 24
  console.info("current time: ", hour)
  if (hour >= 1 && hour <= 7) return;

  try {
    console.info(`> Session START @ ${start.toUTCString()}`);
    await ranking(supabase, version)
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

  if (!env.CF_KV) {
    console.warn('CF_KV not found!')
    await fetchRankingWithLogging(supabase);
    return
  }

  // 7日おき
  const weekly = await env.CF_KV.get('lastrun_weekly');
  if (differenceInDays(new Date(), new Date(weekly || DEFAULT_DATE)) >= 7) {
    await fetchScheduleWithLogging(supabase);
    await env.CF_KV.put('lastrun_weekly', new Date().toISOString())
    return
  }

  // 24時間おき
  const daily = await env.CF_KV.get('lastrun_daily');
  if (differenceInHours(new Date(), new Date(daily || DEFAULT_DATE)) >= 24) {
    await analyzeWithLogging(supabase);
    await env.CF_KV.put('lastrun_daily', new Date().toISOString())
    return
  }

  // デフォルト3分おき (Wranglerのcron設定に依存)
  // version は 空文字列の場合は null にする
  const version = await env.CF_KV.get('version')
  console.info(version)
  await fetchRankingWithLogging(supabase, version || null);
}

export default {

  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(main(env).catch(err => {
      console.error('`scheduled() failed: ', err);
      console.error((err instanceof Error ? err.stack : undefined) ?? 'No stack trace available')
    }));
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return new Response(`
        Hello, this is choco, worker of Enma-V2!

        LastAnalyzed: ${await env.CF_KV?.get('lastrun_daily') ?? 'N/A'}
        LastScheduleFetched: ${await env.CF_KV?.get('lastrun_weekly') ?? 'N/A'}
    `)
  }
}
