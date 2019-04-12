
export class FifteenCell {
	constructor (
		public cellValue ?: number
	) {
		this.cellValue = 0;
	}
}

export class PersistData {
	constructor (
		public palette ?: number,
		public difficluty ?: number,
		public twoColor ?: boolean,
		public inProgress ?: PersistDataFifteen,
		public fifteenStats ?: PersistDataStats
	) {
		this.palette = 0;
		this.difficluty = 2;
		this.twoColor = false;
		this.inProgress = new PersistDataFifteen();
		this.fifteenStats = new PersistDataStats();
	}
}

export class PersistDataFifteen {
	constructor (
		public movesDone ?: number,
		public playTime ?: number,
		public fifteenGrid ?: FifteenCell[]
	) {
		this.movesDone = -1;
		this.playTime = 0;
		this.fifteenGrid = null;
	}
}

export class PersistDataStats {
	constructor (
		public gamesPlayed ?: number[],
		public bestMove ?: number[],
		public bestTime ?: number[]
	) {
		this.gamesPlayed = [0, 0, 0, 0, 0];
		this.bestMove = [0, 0, 0, 0, 0];
		this.bestTime = [0, 0, 0, 0, 0];
	}
}
