import * as cheerio from 'cheerio';
import { Schedule } from '../subabase/module';
import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/schema';

const parseDateString = (str: string) => {
  // 「(火)」など括弧内の曜日を削除
  const cleaned = str.replace(/\(.*?\)/, '');
  // 「7/11 10:00」などの形に
  const [datePart, timePart] = cleaned.trim().split(' ');
  const [month, day] = datePart?.split('/').map(Number) ?? [0, 0];
  const [hour, minute] = timePart?.split(':').map(Number) ?? [0, 0];
  return { month: month ?? 0, day: day ?? 0, hour: hour ?? 0, minute: minute ?? 0 };
}

// スケジュール配列を処理する関数
// events: [{ start: "7/11(火) 10:00", end: "7/18(火) 9:59" }, ...]
// initialYear: 最初の開始日時の年（例：2023）
const processEvents = (events: Schedule[], initialYear = 2023) => {
  let currentYear = initialYear;
  let lastStartMonth: number | null = null;

  return events.map(event => {
    // 開始日時を解析
    const startData = parseDateString(event.started_at!);
    // 並び順が昇順なので、前のイベントより月が小さい場合は年がロールオーバーしているとみなす
    if (lastStartMonth !== null && startData.month < lastStartMonth) {
      currentYear++;
    }
    lastStartMonth = startData.month;
    const startDate = new Date(
      currentYear,
      startData.month - 1,
      startData.day,
      startData.hour,
      startData.minute
    );

    // 終了日時を解析
    const endData = parseDateString(event.ended_at!);
    // 同一イベント内で、終了の月が開始より小さい場合は翌年とする
    let endYear = currentYear;
    if (endData.month < startData.month) {
      endYear++;
    }
    const endDate = new Date(
      endYear,
      endData.month - 1,
      endData.day,
      endData.hour,
      endData.minute,
      59,
      999,
    );

    return { ...event, started_at: startDate.toLocaleString('sv-SE'), ended_at: endDate.toLocaleString('sv-SE') };
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const schedule = async (supabase: SupabaseClient<Database>): Promise<Schedule[]> => {
  const response = await fetch('https://p.eagate.573.jp/game/chase2jokers/ccj/news/index.html');
  const html = await response.text();
  const $ = cheerio.load(html);

  // 対象となる<li>を抽出
  const events = $('.list > li')
    .filter((_, el) => $(el).text().includes('スケジュール') && $(el).find('table').length > 0)
    .map((_, li) => {
      const table = $(li).find('table').first();
      const rows = table.find('tr').toArray();
      // 1行目はヘッダーとするので除外
      const dataRows = rows.slice(1);
      // 各行の<td>からイベント情報を取得し、テーブル内は逆順に
      return dataRows.map(row => {
        const cells = $(row).find('td').toArray();
        const [date, even_time, odd_time] = cells.map(cell => $(cell).text().trim());
        const [started_at, ended_at] = date?.split(' - ') ?? [];
        return { started_at: started_at ?? null, ended_at: ended_at ?? null, even_time: even_time ?? null, odd_time: odd_time ?? null };
      }).reverse();
    })
    .get()  // Cheerioオブジェクトから通常の配列に変換
    .flat() // 配列の配列をフラット化
    .reverse(); // 全体を逆順に

  return processEvents(events);
};
