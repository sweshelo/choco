import ranking from "./modules/ranking";

const fetchRankingWithLogging = () => {
  try {
    console.log(new Date());
    ranking().then(() => console.log('Completed.'));
  } catch (e) {
    console.log(new Date());
    console.error(e);
  };
}

export default function main() {
  console.log('HELL WORD 👹');
  console.log('CHOCO STARTED');
  fetchRankingWithLogging();
  setInterval(fetchRankingWithLogging, 1000 * 60 * 3);
}

main();
