import { Component, ViewChild, HostListener, ElementRef, ViewEncapsulation } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { NgbActiveModal, NgbModal, NgbModalRef, ModalDismissReasons } from '@ng-bootstrap/ng-bootstrap';
import { Subscription } from "rxjs";
import { TimerObservable } from "rxjs/observable/TimerObservable";
import { WindowRef } from './windowref.service';
import { FifteenCell, PersistData, PersistDataFifteen, PersistDataStats } from './fifteen.model';
import { FifteenService } from './fifteen.service';

@Component({
  selector: 'fifteen-root',
  templateUrl: './fifteen.component.html',
  styleUrls: ['./fifteen.component.css'],
  providers: [FifteenService],
  encapsulation: ViewEncapsulation.None
})
export class FifteenComponent {

  constructor(private modalService: NgbModal, private _sanitizer: DomSanitizer, private winRef: WindowRef, private fifteenService: FifteenService) { }

  @ViewChild('popupConfirm') private popupConfirm;
  @ViewChild('popupSettings') private popupSettings;
  @ViewChild('popupHighscore') private popupHighscore;
  @ViewChild('popupHelp') private popupHelp;
  @ViewChild('popupTutorial') private popupTutorial;
  @HostListener('window:beforeunload', ['$event'])
  beforeunloadHandler(event) {
    this.savePersistData(true);
  }
  @HostListener('document:keydown', ['$event'])
  moveFifteenKey(event:KeyboardEvent) {
    let cellIndex:number = null;
    let currentRow:number = null;
    let currentColumn:number = null;
    let moveRow:number = null;
    let moveColumn:number = null;

    moveColumn = currentColumn = (this.emptyCell) % this.fifteenSize;
    moveRow = currentRow = Math.floor((this.emptyCell) / this.fifteenSize);

    switch(event.key) {
      case "ArrowUp":
        if((currentRow + 1) < this.fifteenSize) {
          moveRow = moveRow + 1;
        }
        break;
      case "ArrowRight":
        if((currentColumn - 1) > -1) {
          moveColumn = moveColumn - 1;
        }
        break;
      case "ArrowDown":
        if((currentRow - 1) > -1) {
          moveRow = moveRow - 1;
        }
        break;
      case "ArrowLeft":
        if((currentColumn + 1) < this.fifteenSize) {
          moveColumn = moveColumn + 1;
        }
        break;
    }

    cellIndex = (moveRow * this.fifteenSize) + moveColumn;
    this.moveFifteen(cellIndex, true);
  }
  
  private createArray(arrLength) {
    let arrTemp = new Array(arrLength || 0);
    for (let i = 0; i < arrLength; i++) {
      arrTemp[i] = new Array(arrLength || 0);
    }
    return arrTemp;
  }

  private getRandom(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  private resizeViewport() {
    let cellSize = null;
    let hintSize = null;
    let keySize = null;
    keySize = Math.floor(this.VW2PX(80) / this.fifteenSize) - 2;
    this.display.fifteenCellSize = keySize + "px";
    hintSize = Math.floor((keySize - 2) / 3);
    this.display.fifteenHintSize = hintSize + "px";
    this.display.fifteenKeySize = this.display.fifteenCellSize;
  }

  deepCopy(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  padLeft(text: any, padChar: string, size: number): string {
    return (String(padChar).repeat(size) + String(text)).substr((size * -1), size);
  }

  private VW2PX(VW) {
    let w = window, d = document, e = d.documentElement, g = d.getElementsByTagName('body')[0];
    let x = w.innerWidth || e.clientWidth || g.clientWidth;
    let result = Math.floor((x * VW) / 100);
    return result;
  }

  persistData:PersistData = null;
  fifteenTitle:string = 'Fifteen';
  fifteenVersion:string = "1.0"
  isDebug:boolean = false;
  fifteenSize:number = 4;
  fifteenGridSize = Math.pow(this.fifteenSize, 2) - 1;
  display:any = {
    fifteenViewport: Math.floor(this.VW2PX(100) / this.fifteenSize) + "px",
    fifteenCellSize: null,
    fifteenHintSize: null,
    fifteenKeySize: null
  }
  openPopup:NgbModalRef = null;

  arrGrid:FifteenCell[] = null;
  strGrid:string = "";
  currentDifficulty:number = null;
  fifteenMoves:number = -1;
  emptyCell:number = this.fifteenGridSize;
  shuffledFlag:boolean = false;
  tryShuffle:number = 0;
  shuffleTable:number[] = [];

  selectedDifficulty:number = 2;
  arrDifficulty:any[] = [
    {"index": 1, "difficultyName": "Child's Play (2x2)", "fifteenSize": 2},
    {"index": 2, "difficultyName": "Small (3x3)", "fifteenSize": 3},
    {"index": 3, "difficultyName": "Normal (4x4)", "fifteenSize": 4},
    {"index": 4, "difficultyName": "Large (5x5)", "fifteenSize": 5},
    {"index": 5, "difficultyName": "Insane (6x6)", "fifteenSize": 6}
  ];

  colorPalette:string[] = ["#2095F6", "#FF5353", "#3BB878", "#855FA8"];
  fifteenPalette = [
    {name: "Light", bgcolor: "#DDDDDD", color: "#000000"},
    {name: "Dark", bgcolor: "#333333", color: "#FFFFFF"},
    {name: "Blue", bgcolor: "#2095F6", color: "#000000"},
    {name: "Red", bgcolor: "#FF5353", color: "#FFFFFF"},
    {name: "Orange", bgcolor: "#FAA43A", color: "#000000"},
    {name: "Green", bgcolor: "#3BB878", color: "#000000"},
    {name: "Yellow", bgcolor: "#EEF093", color: "#000000"},
    {name: "Purple", bgcolor: "#855FA8", color: "#FFFFFF"}
  ];
  selectedPalette:number = 0;
  timer:any = null;
  subscription:Subscription = null;
  fifteenTimer:number = null;
  pauseTimer:boolean = false;
  displayTimer:any = {
    displayHours: null,
    displayMinutes: null,
    displaySeconds: null
  }
  isGameInProgress:boolean = false;
  isGameComplete:boolean = false;

  newHighscore:boolean = false;
  highscoreMessage:string = "";
  fifteenMessage:string = "";
  fifteenPopupMessage:string[] = [];
  dummyArray = Array;

  private ngOnInit() {
    this.loadPersistData();
    this.resizeViewport();
    if (this.persistData.inProgress.fifteenGrid === null) {
      this.newFifteen();
    }
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
    this.savePersistData(true);
  }

  loadPersistData() {
    let tempShuffle = [];
    if (this.winRef.nativeWindow.AppInventor) {
      this.persistData = JSON.parse(this.winRef.nativeWindow.AppInventor.getWebViewString());
    } else {
      this.persistData = JSON.parse(localStorage.getItem("fifteenPersist"));
    }

    if(this.persistData === null)
      this.persistData = new PersistData();

    if(this.persistData !== null) {
      this.selectedPalette = this.persistData.palette;
      this.selectedDifficulty = this.persistData.difficluty;
      this.fifteenMoves = this.persistData.inProgress.movesDone;
      this.fifteenTimer = this.persistData.inProgress.playTime;
      this.arrGrid = this.persistData.inProgress.fifteenGrid;
      this.isGameInProgress = false;
      this.pauseTimer = false;
      this.shuffledFlag = true;
      this.showtimer();

      if(this.arrGrid !== null) {
        this.fifteenSize = Math.sqrt(this.arrGrid.length);
        this.fifteenGridSize = Math.pow(this.fifteenSize, 2) - 1;
        this.getCurrentDifficilty();
        this.resizeViewport();

        this.arrGrid.map((value, index) => {
          tempShuffle.push(value.cellValue);
          if(value.cellValue === 0) {
            this.emptyCell = index;
          }
        })
        this.shuffleTable = tempShuffle;
        this.checkBoard();
      }

    }
  }

  savePersistData(saveGrid: boolean = true) {
    this.persistData.palette = this.selectedPalette;
    this.persistData.difficluty = this.selectedDifficulty;
    if(saveGrid) {
      this.persistData.inProgress.movesDone = this.fifteenMoves;
      this.persistData.inProgress.playTime = this.fifteenTimer;
      this.persistData.inProgress.fifteenGrid = this.arrGrid;
    }

    if (this.winRef.nativeWindow.AppInventor) {
      this.winRef.nativeWindow.AppInventor.setWebViewString(JSON.stringify(this.persistData));
    } else {
      localStorage.setItem("fifteenPersist", JSON.stringify(this.persistData));
    }
  }

  newFifteen() {
    this.pauseTimer = true;
    if(this.isGameInProgress) {
      this.fifteenPopupMessage = ["Start new Fifteen ?", "The current game will be lost !"];
      this.modalService.open(this.popupConfirm, {}).result.then (
        (result) => {
          this.persistData.fifteenStats.gamesPlayed[this.currentDifficulty]++;
          this.initFifteen();
          this.initGrid();
          this.shuffleBoard();
          this.stopTimer();
          this.showtimer();
          this.fifteenMoves = 0;
        },
        (reason) => {
          this.pauseTimer = false;
        }
      )
    } else {
      this.initFifteen();
      this.initGrid();
      this.shuffleBoard();
      this.stopTimer();
      this.showtimer();
      this.fifteenMoves = 0;
    }
  }

  initFifteen() {
    this.isGameInProgress = false;
    this.isGameComplete = false;
    this.fifteenMessage = "";
    this.fifteenMoves = 0;
    this.fifteenTimer = 0;
    this.fifteenSize = this.arrDifficulty[this.selectedDifficulty].fifteenSize;
    this.fifteenGridSize = Math.pow(this.fifteenSize, 2) - 1;
    this.currentDifficulty = this.selectedDifficulty;
    this.emptyCell = this.fifteenGridSize;
    this.resizeViewport();
    this.shuffledFlag = false;
    this.tryShuffle = 0;

    this.shuffleTable = new Array(this.fifteenGridSize + 1);
    for(let i = 1; i <= this.fifteenGridSize; i++)
      this.shuffleTable[i - 1] = i;
    this.shuffleTable[this.fifteenGridSize] = 0;
    this.pauseTimer = true;
  }

  initGrid() {
    let gridSize = Math.pow(this.fifteenSize, 2);
    let tempCell:FifteenCell = null;
    this.arrGrid = this.fifteenService.nDArray(gridSize);

    for(let i = 0; i < gridSize - 1; i++) {
      tempCell = new FifteenCell();
      tempCell.cellValue = i + 1;
      this.arrGrid[i] = tempCell;
    }
    tempCell = new FifteenCell();
    this.arrGrid[this.fifteenGridSize] = tempCell;
  }

  getCurrentDifficilty() {
    this.arrDifficulty.map((value, index) => {
      if(value.fifteenSize === this.fifteenSize) {
        this.currentDifficulty = (value.index - 1);
      }
    })
  }

  tryMove(cellIndex) {
    if(((this.emptyCell - 1 === cellIndex) && (this.emptyCell % this.fifteenSize !== 0)) ||
      ((this.emptyCell + 1 === cellIndex) && (this.emptyCell % this.fifteenSize !== this.fifteenSize - 1)) ||
      (this.emptyCell - this.fifteenSize === cellIndex) ||
      (this.emptyCell + this.fifteenSize === cellIndex)) {
      this.cellSwap(this.emptyCell, cellIndex);
      this.emptyCell = cellIndex;
      if(!this.shuffledFlag)
        this.tryShuffle++;
      else
        this.checkBoard();
      return;
    }
    
    if((this.emptyCell % this.fifteenSize === cellIndex % this.fifteenSize) && (this.emptyCell !== cellIndex)) {
      if(this.emptyCell > cellIndex) { // Down
        for(let i = this.emptyCell - this.fifteenSize; i >= cellIndex; i = i - this.fifteenSize) {
          this.tryMove(this.emptyCell - this.fifteenSize);
        }
      } else { // Up
        for(let i = this.emptyCell + this.fifteenSize; i <= cellIndex; i = i + this.fifteenSize) {
          this.tryMove(this.emptyCell + this.fifteenSize);
        }
      }
    } 

    if((Math.floor(this.emptyCell / this.fifteenSize) === Math.floor(cellIndex / this.fifteenSize)) && (this.emptyCell !== cellIndex)) {
      if(this.emptyCell > cellIndex) { // Right
        for(let i = this.emptyCell - 1; i >= cellIndex; i--) {
          this.tryMove(this.emptyCell - 1);
        }
      } else { // Left
        for(let i = this.emptyCell + 1; i <= cellIndex; i++) {
          this.tryMove(this.emptyCell + 1);
        }
      }
    }
  }

  shuffleBoard() {
    this.shuffledFlag = false;
    while(this.tryShuffle < Math.pow(this.fifteenGridSize, 2)) {
      this.tryMove(Math.round((Math.random() * this.fifteenGridSize)));
    }
    this.tryShuffle = 0;
    this.shuffledFlag = true;
  }

  checkBoard() {
    let checkCount = 0;
    if(!this.shuffledFlag) {
      this.tryShuffle++;
      return;
    }
    for(let i = 0; i < this.fifteenGridSize; i++) {
      if(this.shuffleTable[i] === (i + 1)) {
        checkCount++;
      }
    }
    if(checkCount >= this.fifteenGridSize) {
      // Win
      this.fifteenMessage = "You did it :)";
      this.isGameInProgress = false;
      this.isGameComplete = true;
      this.persistData.fifteenStats.gamesPlayed[this.currentDifficulty]++;
      this.stopTimer();
      this.shuffledFlag = false;
      this.checkHighScores();
    }
  }

  moveFifteen(cellIndex:number, moveSingle:boolean = false) {
    if(this.isGameComplete) {
      return;
    }

    if(((this.emptyCell - 1 === cellIndex) && (this.emptyCell % this.fifteenSize !== 0)) ||
      ((this.emptyCell + 1 === cellIndex) && (this.emptyCell % this.fifteenSize !== this.fifteenSize - 1)) ||
      (this.emptyCell - this.fifteenSize === cellIndex) ||
      (this.emptyCell + this.fifteenSize === cellIndex)) {
      this.cellSwap(this.emptyCell, cellIndex);
      this.emptyCell = cellIndex;
      this.checkBoard();
      this.savePersistData();

      if(!this.isGameInProgress && !this.isGameComplete) {
        this.isGameInProgress = true;
        this.pauseTimer = false;
        this.startTimer();
      }
      return;
    }

    if(moveSingle)
      return;
    
    if((this.emptyCell % this.fifteenSize === cellIndex % this.fifteenSize) && (this.emptyCell !== cellIndex)) {
      if(this.emptyCell > cellIndex) { // Down
        for(let i = this.emptyCell - this.fifteenSize; i >= cellIndex; i = i - this.fifteenSize) {
          this.moveFifteen(i);
        }
      } else { // Up
        for(let i = this.emptyCell + this.fifteenSize; i <= cellIndex; i = i + this.fifteenSize) {
          this.moveFifteen(i);
        }
      }
    }

    if((Math.floor(this.emptyCell / this.fifteenSize) === Math.floor(cellIndex / this.fifteenSize)) && (this.emptyCell !== cellIndex)) {
      if(this.emptyCell > cellIndex) { // Right
        for(let i = this.emptyCell - 1; i >= cellIndex; i--) {
          this.moveFifteen(i);
        }
      } else { // Left
        for(let i = this.emptyCell + 1; i <= cellIndex; i++) {
          this.moveFifteen(i);
        }
      }
    }
    return;
  }

  cellSwap(a, b) {
    let X = this.arrGrid[a];
    this.arrGrid[a] = this.arrGrid[b];
    this.arrGrid[b] = X;

    let Y = this.shuffleTable[a];
    this.shuffleTable[a] = this.shuffleTable[b];
    this.shuffleTable[b] = Y;

    this.fifteenMoves++;
  }

  checkHighScores() {
    if(this.persistData.fifteenStats.bestMove[this.currentDifficulty] === 0) {
      this.persistData.fifteenStats.bestMove[this.currentDifficulty] = this.fifteenMoves;
      this.highscoreMessage = "New\nBest\nMoves";
    } else if (this.persistData.fifteenStats.bestMove[this.currentDifficulty] > this.fifteenMoves) {
      this.persistData.fifteenStats.bestMove[this.currentDifficulty] = this.fifteenMoves;
      this.highscoreMessage = "New\nBest\nMoves";
    }
    if(this.persistData.fifteenStats.bestTime[this.currentDifficulty] === 0) {
      this.persistData.fifteenStats.bestTime[this.currentDifficulty] = this.fifteenTimer;
      if (this.highscoreMessage === "")
        this.highscoreMessage = "New\nBest\nTime";
      else
        this.highscoreMessage = "New\nBest\nScore";
    } else if (this.persistData.fifteenStats.bestTime[this.currentDifficulty] > this.fifteenTimer) {
      this.persistData.fifteenStats.bestTime[this.currentDifficulty] = this.fifteenTimer;
      if (this.highscoreMessage === "")
        this.highscoreMessage = "New\nBest\nTime";
      else
        this.highscoreMessage = "New\nBest\nScore";
    }

    if(this.highscoreMessage !== "") {
      this.savePersistData();
      this.highscoreMessage += " !";
      this.newHighscore = true;
      setTimeout(() => {
        this.newHighscore = false;
        this.highscoreMessage = "";
      }, 4000);
    }
  }

  setPalette(paletteIndex) {
    this.selectedPalette = paletteIndex;
    this.savePersistData();
  }

  setDifficulty(difficultyIndex) {
    this.selectedDifficulty = difficultyIndex;
    this.savePersistData(true);
  }

  startTimer() {
    this.timer = TimerObservable.create(0, 1000);
    this.subscription = this.timer.subscribe(t => {
      if(!this.pauseTimer)
        this.fifteenTimer++;
      this.showtimer();
    });
  }

  stopTimer() {
    if(this.subscription !== null) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
  }

  toggleTimer() {
    this.pauseTimer = !this.pauseTimer;
  }

  showtimer() {
    if(this.fifteenTimer !== -1) {
      this.displayTimer.displaySeconds = this.padLeft(this.fifteenTimer % 60, '0', 2);
      this.displayTimer.displayMinutes = (this.fifteenTimer - (this.fifteenTimer % 60)) / 60;
      this.displayTimer.displayHours = this.padLeft((this.displayTimer.displayMinutes - (this.displayTimer.displayMinutes % 60)) / 60, '0', 2);
      this.displayTimer.displayMinutes = this.padLeft(this.displayTimer.displayMinutes % 60, '0', 2);
    } else {
      // this.displayTimer.displayHours = this.displayTimer.displayMinutes = this.displayTimer.displaySeconds = this.padLeft(0, '0', 2);
      this.displayTimer.displayHours = this.displayTimer.displayMinutes = this.displayTimer.displaySeconds = "--";
    }
  }

  convertTime(seconds:number) {
    let displaySeconds = null;
    let displayMinutes = null;
    let displayHours = null;
    displaySeconds = this.padLeft(seconds % 60, '0', 2);
    displayMinutes = (seconds - (seconds % 60)) / 60;
    displayHours = this.padLeft((displayMinutes - (displayMinutes % 60)) / 60, '0', 2);
    displayMinutes = this.padLeft(displayMinutes % 60, '0', 2);
    if(displayHours > 0) {
      return displayHours + ":" + displayMinutes + ":" + displaySeconds
    } else {
      return displayMinutes + ":" + displaySeconds
    }
  }

  getCellStyle(styleType, cellIndex) {
    let twoColorStart = 0;
    if(styleType === "BGCOLOR") {
      if(this.arrGrid[cellIndex].cellValue === 0) {
        return "inherit";
      } else {
        if(this.persistData.twoColor) {
          if(this.selectedPalette % 2 === 1)
            twoColorStart = this.selectedPalette - 1;
          else
            twoColorStart = this.selectedPalette

          if(this.arrGrid[cellIndex].cellValue % 2 === 1)
            return this.fifteenPalette[twoColorStart].bgcolor;
          else
            return this.fifteenPalette[twoColorStart + 1].bgcolor;
        } else {
          return this.fifteenPalette[this.selectedPalette].bgcolor;
        }
      }
    } else if(styleType === "COLOR") {
      if(this.arrGrid[cellIndex].cellValue === 0) {
        return "inherit";
      } else {
        if(this.persistData.twoColor) {
          if(this.selectedPalette % 2 === 1)
            twoColorStart = this.selectedPalette - 1;
          else
            twoColorStart = this.selectedPalette

          if(this.arrGrid[cellIndex].cellValue % 2 === 1)
            return this.fifteenPalette[twoColorStart].color;
          else
            return this.fifteenPalette[twoColorStart + 1].color;
        } else {
          return this.fifteenPalette[this.selectedPalette].color;
        }
      }
    } else if(styleType === "BORDER") {
      if(this.arrGrid[cellIndex].cellValue === 0) {
        return "none";
      } else {
        return "2px outset #A0A0A0";
      }
    }
  }

  showSettings() {
    this.pauseTimer = true;
    this.openPopup = this.modalService.open(this.popupSettings, {});
    this.openPopup.result.then(
      (result) => {
        this.pauseTimer = false;
      },
      (error) => {
        this.pauseTimer = false;
      }
    )
  }

  showHighscore() {
    this.pauseTimer = true;
    this.openPopup = this.modalService.open(this.popupHighscore, {});
    this.openPopup.result.then(
      (result) => {
        this.pauseTimer = false;
      },
      (error) => {
        this.pauseTimer = false;
      }
    )
  }

  showHelp() {
    this.pauseTimer = true;
    this.openPopup = this.modalService.open(this.popupHelp, {});
    this.openPopup.result.then(
      (result) => {
        this.pauseTimer = false;
      },
      (error) => {
        this.pauseTimer = false;
      }
    )
  }

  resetStats() {
    this.persistData.fifteenStats = new PersistDataStats();
    this.savePersistData(true);
  }

}
