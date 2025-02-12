import * as cheerio from 'cheerio';
import { format, parse } from 'date-fns';
import { Ranking } from '@/types/chase/ranking';
import { fetchAnons, fetchUsers, insertRecords } from '../subabase/module';
import { toZonedTime } from 'date-fns-tz';

const originalPageURL = (index: number) => {
  const month = format(new Date(), 'yyyyMM');
  return `https://p.eagate.573.jp/game/chase2jokers/ccj/ranking/index.html?page=${index}&rid=${month}`;
};

export default async function ranking() {
  const ranking: Ranking[] = [];

  await Promise.all(
    [0, 1, 2, 3].map(async index => {
      try {
        const html = await (await fetch(originalPageURL(index))).text();
        const $ = cheerio.load(html);
        const recordedAt = toZonedTime(parse($('.hr0').eq(1).next().text().trim().replace('最終更新:', ''), 'yyyy.MM.dd HH:mm', new Date()), 'Asia/Tokyo');

        $('#ranking_data')
          .find('li')
          .each((i, element) => {
            if (i === 0) return;
            const rank = parseInt($(element).find('div').first().text().trim());
            const points = parseInt($(element).find('div').eq(2).text().trim().replace('P', ''));
            const charaMatch = $(element)
              .find('div')
              .eq(1)
              .find('p')
              .eq(0)
              .find('img')
              .attr('src')
              ?.match(/icon_(\d+)/);
            const chara = charaMatch ? charaMatch[1] : '0';
            const name = $(element)
              .find('div')
              .eq(1)
              .find('p')
              .last()
              .contents()
              .filter(function () {
                return this.type === 'text';
              })
              .text()
              .trim();

            const achievementElement = $(element)
              .find('div')
              .eq(1)
              .find('p')
              .eq(1)
              .find('span')
              .first();
            const achievementTitle = achievementElement.text().trim();
            const icon1 = achievementElement
              .find('span')
              .first()
              .attr('class')
              ?.split(' ')
              .find(className => className.startsWith('icon_'))
              ?.replace('icon_', '');
            const icon2 = achievementElement
              .find('span')
              .last()
              .attr('class')
              ?.split(' ')
              .find(className => className.startsWith('icon_'))
              ?.replace('icon_', '');
            achievementElement.find('span.icon').remove();
            const achievementMarkup = achievementElement.html()?.trim();

            ranking.push({
              rank,
              points: {
                current: points,
              },
              chara,
              name,
              achivement: {
                title: achievementTitle, // || achievementMarkup || '', // マークアップの構成が色付き/色無しで変わるため、色無しの場合は空文字列となる。
                markup: achievementMarkup,
                icon: {
                  first: icon1 === '0' ? undefined : icon1,
                  last: icon2 === '0' ? undefined : icon2,
                },
              },
              recordedAt,
            });
          });
      } catch (e) {
        console.error(e);
      }
    })
  );

  const players = ranking.map(({ name }) => name).filter(name => name !== 'プレーヤー');
  const users = await fetchUsers({ players })
  const anons = await fetchAnons();

  ranking.forEach((rank) => {
    const player = users?.find(player => player?.name === rank.name);
    if (player) {
      rank.points.diff = rank.points.current - (player.points ?? 0);
      rank.elapsed = Math.floor((new Date().getTime() - new Date(player.updated_at ?? '').getTime()) / 1000);
    }
  });

  await insertRecords(ranking.filter(record => {
    return !(record.name === 'プレーヤー' && anons.some(anon => anon.point === record.points.current && anon.ranking === record.rank))
  }));

  return;
}
