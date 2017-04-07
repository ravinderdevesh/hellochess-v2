import Game from './Game';
const {Chess} = require('chess.js');
import Player from '../players/Player';
import TwoEngine from '../../engine/TwoEngine';

export default class Standard extends Game {
    gameType: string = 'standard';
    gameRulesObj: any = new Chess();
    numPlayers: number = 2;
    io: Object;
    times: Object = {
        w: 0,
        b: 0
    }
    
    constructor(io: Object) {
        super();
        this.io = io;
    }
    
    getGame() {
        return {
            numPlayers: this.numPlayers,
            gameType: this.gameType,
            fen: this.gameRulesObj.fen(),
            pgn: this.gameRulesObj.pgn(),
            white: (this.white) ? this.white.getPlayer():false,
            black: (this.black) ? this.black.getPlayer():false,
        };
    }
    
    move() {
        
    }
    
    removePlayerFromAllSeats(player: Player) {
        if(this.white && this.white.playerId === player.playerId) {
            this.removeColorTime('w');
            this.white = null;
        }
        
        if(this.black && this.black.playerId === player.playerId) {
            this.removeColorTime('b');
            this.black = null;
        }
    }
    
    addPlayer(player: Player, color: string) {
        this.removePlayerFromAllSeats(player);
        switch(color.charAt(0)) {
            case 'w':
                this.white = player;
                break;
            case 'b':
                this.black = player;
                break;
        }
        return false;
    }
    
    removePlayer(color: string) {
        switch(color.charAt(0)) {
            case 'w':
                this.white = null;
                break;
            case 'b':
                this.black = null;
                break;
        }
        return true;
    }

    gameReady(): boolean {
        return (
            this.white !== null &&
            this.black !== null);
    }
    
    outColor(): string { return null; }
    
    newEngineInstance(roomName: string, io: any) {
        this.engineInstance = new TwoEngine(roomName, io, this.timeControl.increment);
    }
    
    startGame() {
        this.gameStarted = true;
        this.white.alive = true;
        this.black.alive = true;
        this.setLastMove();
    }
    
    endAndSaveGame(): boolean {
        this.gameStarted = false;
        return true;
    }
}