const Engine = require('./Engine.js');
const {ab2str} = require('../server/utils/utils');

module.exports = class TwoEngine extends Engine {
    constructor(path, roomName, socket) {
        super(path, roomName, socket);
        this.setDepth(5);
    }
    onBestMove(data) {
        var str = ab2str(data);
        if(str.indexOf("bestmove") !== -1) {
            let startIndex = str.indexOf("bestmove");
            let from = str.substring(startIndex + 9, startIndex + 11);
            let to = str.substring(startIndex + 11, startIndex + 13);
            let compMove = {
                to: to,
                from: from,
                promotion: 'q'
            };

            this.socket.emit('action', {
                type: 'server/new-move',
                payload: {
                    thread: this.roomName,
                    move: compMove
                }
            });
        }
    }
    
    setPosition(fen) {
        this.engine.stdin.write(
            "position fen " + fen + "\n"
        );
    }
    
    setTurn(turnColor) {
        console.log("set turn on TwoEngine");
    }
    
    setOut(colorOut) {
        this.engine.stdin.write("stop");
    }
    
    adjustDepth(timeLeft) {
        let depth = this.depth;
		return depth;
    }
}