export interface Ranking {
  rank: number;
  points: number;
  chara: string;
  name: string;
  achivement: {
    title: string;
    markup?: string;
    icon: {
      first?: string;
      last?: string;
    };
  };
}
