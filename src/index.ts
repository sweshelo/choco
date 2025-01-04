import ranking from "./modules/ranking";

export default function main() {
  console.log('HELL WORD 👹');
  setInterval(() => {
    ranking();
  }, 1000 * 60 * 3);
}

main();
