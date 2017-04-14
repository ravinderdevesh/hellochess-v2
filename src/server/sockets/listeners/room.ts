const Notifications = require('react-notification-system-redux');

import Player from '../../../models/players/Player';
import AI from '../../../models/players/AI';
import Room from '../../../models/rooms/Room';
import Game from '../../../models/games/Game';
import Message from '../../../models/rooms/Message';

//Game Rules
import FourGame from '../../../models/games/FourGame';
import Standard from '../../../models/games/Standard';
import CrazyHouse from '../../../models/games/CrazyHouse';

//server environment
const dotenv = require('dotenv').load();

const env = process.env.NODE_ENV || "development";

module.exports = function(io, socket, connection) {
    
    socket.on('new-message', data => {
        let roomName: string = data.thread;
        let player: Player = connection.getPlayerBySocket(socket);
        let room: Room = connection.getRoomByName(roomName);
        if(!room) return;
        
        //add the message to the room
        room.addMessage(new Message(player, data.msg, roomName));
        
        // tell everyone there is a new message
        io.to(room.name).emit('update-room', room.getRoom())
    });
    
    socket.on('sit-down-board', data => {
        let roomName: string = data.roomName;
        let room: Room = connection.getRoomByName(roomName);
        if(!room) return;
        
        let player: Player;
        if(!data.profile) {
            return;
        }
        let playerType = data.profile.type;
        let playerLevel = data.profile.level;
        if (typeof playerType !== "undefined" && playerType === "computer" && typeof playerLevel === "number") {
            player = new AI(io, data.profile.username, playerLevel);
            player.type = 'computer';
        } else {
            player = connection.getPlayerBySocket(socket);
        }
        let color: string = data.color;
        room.game.addPlayer(player, color);
        let timeValue = room.time.value * 60 * 1000;
        room.game.setColorTime(color, timeValue);

        if (room.gameReady()) {
            // start the game if all players are seated
            room.startGame(connection);
        }
        io.to(roomName).emit('update-room', room.getRoom());
    });
    
    socket.on('leave-room', data => {
        let roomName: string = data;
        
        //retrieve the user and room which are being updated
        let room: Room = connection.getRoomByName(roomName);
        let player: Player = connection.getPlayerBySocket(socket);
        
        if(!room || !player || !room.removePlayer(player)) {
            //TODO error
            return;
        }
        
        if (room.empty()) { //there are no users in the room
            if(connection.removeRoomByName(roomName)) {
                //TODO not sure if anything else is needed here
            } else {
                console.log("could not delete room " + roomName);
            }
        } else {
            if(room.game && room.game.gameStarted == false) {
                room.game.removePlayerFromAllSeats(player);
            }
            io.to(room.name).emit('update-room', room.getRoom());
        }
        
        connection.emitAllRooms();
    });
    
    socket.on('join-room', data => {
        if(!data || !data.room || !data.room.name) {
            return;
        }
        
        let roomName = data.room.name;
        let room: Room = connection.getRoomByName(roomName);
        
        if(!room) { //the room did not previously exist
        
            if(!data.gameType) {
                //TODO error
                return;
            }
            
            switch(data.gameType) {
                case 'standard':
                    room = new Room(io, new Standard(io, roomName, data.time, connection));
                    break;
                case 'four-player':
                    room = new Room(io, new FourGame(io, roomName, data.time, connection));
                    break;
                case 'crazyhouse':
                    room = new Room(io, new CrazyHouse(io, roomName, data.time, false, connection));
                    break;
                case 'crazyhouse960':
                    room = new Room(io, new CrazyHouse(io, roomName, data.time, true, connection));
                    break;
            }
            
            if(!room.setRoomAttributes(data.room)) {
                //TODO error
                return;
            }
            
            if(data.time) { //user has specified a time control
                room.time = data.time;
            }
            
            connection.addRoom(room);
        }
        let player: Player = connection.getPlayerBySocket(socket);
        if(!player) {
            return;
        }
        
        if(room.isPlayerInRoom(player) == true) {
            return;
        }
        
        if(!player) {
            //TODO error
            return;
        }
        //remove previous instances of this player
        room.removePlayer(player)
        
        room.addPlayer(player);
        connection.emitAllRooms();
    });
    
    socket.on('kill-ais', data => {
        let roomName: string = data;
        let room: Room = connection.getRoomByName(roomName);
        if(!room) return;
        if(room.game) {
            room.game.endAndSaveGame(false);
            io.to(roomName).emit('update-room', room.getRoom());
        }
    });
    
    socket.on('four-new-move', data => {
        let roomName = data.thread;
        let room: Room = connection.getRoomByName(roomName);
        if(!room) return;
        let game: Game = room.game;
        let move = data.move;
        room.makeMove(move);
    });
    
    socket.on('remove-ai-player', data => {
        let roomName = data.thread;
        let player = data.player;
        
        let room: Room = connection.getRoomByName(roomName);
        if(!room || !room.game) {
            return;
        }
        
        room.game.removePlayerByPlayerId(player.playerId);
        io.to(room.name).emit('update-room', room.getRoom());
    });
    
    socket.on('resign', data => {
        let roomName = data.roomName;
        let room: Room = connection.getRoomByName(roomName);
        if(!room) {
            return;
        }
        
        let player: Player = connection.getPlayerBySocket(socket);
        
        if(!room.game || !player) {
            return;
        }
        
        room.game.setPlayerResignByPlayerObj(player);
        room.clearTimer();
        room.game.endAndSaveGame(false);
        
        //Notify all players that a player has resigned
        let notificationOpts = {
            title: `${player.username} has resigned!`,
            position: 'tr',
            autoDismiss: 5,
        };
        
        io.to(room.name).emit('action', Notifications.info(notificationOpts));
        
        io.to(room.name).emit('update-room', room.getRoom());
    });
    
    socket.on('four-resign', data => {
        let roomName = data.roomName;
        let room: Room = connection.getRoomByName(roomName);
        if(!room) {
            return;
        }
        
        let player: Player = connection.getPlayerBySocket(socket);
        
        if(!room.game || !player) {
            return;
        }
        
        room.clearTimer();
        room.game.setPlayerResignByPlayerObj(player);
        
        
        if(room.game.gameStarted == true) {
            room.startTimer();
            if(room.game.currentTurnPlayer() instanceof AI) {
                room.game.engineGo();
            }
        }
        
        
        //Notify all players that a player has resigned
        let notificationOpts = {
            title: `${player.username} has resigned!`,
            position: 'tr',
            autoDismiss: 5,
        };
        
        io.to(room.name).emit('action', Notifications.info(notificationOpts));
        
        io.to(room.name).emit('update-room', room.getRoom());
    });
    
    socket.on('draw', data => {
        let roomName = data.roomName;
        let room: Room = connection.getRoomByName(roomName);
        if(!room) {
            return;
        }
        
        let player: Player = connection.getPlayerBySocket(socket);
        
        if(!room.game || !player) {
            return;
        }
        
        let color = null;
        
        if(room.game.white.playerId == player.playerId) {
            color = 'black';
        } else {
            color = 'white';
        }
        
        if(room.game[color].socket) {
            room.game[color].socket.emit('draw-request', {
                thread: roomName
            });
        }
        
        
        
        let notif = {
            title: `Draw request sent by ${player.username}!`,
            position: 'tr',
            autoDismiss: 2,
        };
        io.to(roomName).emit('action', Notifications.info(notif));
    });
    
    socket.on('accept-draw', data => {
        let roomName = data.roomName;
        let room: Room = connection.getRoomByName(roomName);
        if(!room) {
            return;
        }
        
        let player: Player = connection.getPlayerBySocket(socket);
        
        if(!room.game || !player) {
            return;
        }
        
        //Notify all players that the game has ended in a draw
        let notificationOpts = {
            title: 'Game Over',
            message: 'The game ended in a draw!',
            position: 'tr',
            autoDismiss: 5,
        };
        
        io.to(roomName).emit('action', Notifications.warning(notificationOpts));
        
        room.game.endAndSaveGame(true);
        io.to(room.name).emit('update-room', room.getRoom());
    });
};