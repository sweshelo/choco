export interface Ranking {
  rank: number;
  points: {
    current: number;
    diff?: number;
  },
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
  recordedAt?: Date;
  elapsed?: number;
}
