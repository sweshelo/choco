import ranking from "./modules/ranking";

const fetchRankingWithLogging = () => {
  const start = new Date();

  // 深夜～早朝は実行しない
  const hour = (start.getUTCHours() + 9) % 24
  if (hour >= 1 && hour <= 5) return;

  try {
    console.info('> Session START @ %s', start.toUTCString());
    ranking().then(() => {
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

export default function main() {
  console.log('HELL WORD 👹');
  console.log('CHOCO STARTED');
  fetchRankingWithLogging();
  setInterval(fetchRankingWithLogging, 1000 * 60 * 3);
}

main();
