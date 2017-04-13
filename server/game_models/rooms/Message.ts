import Player from '../players/Player';

export default class Message {
    private _picture: string;
    private _username: string;
    private _playerId: string;
    private _eventType: string = 'chat-message';
    private _time = new Date();
    
    constructor(player: Player, 
                private _message: string,
                private _thread: string) {
        this._picture = player.picture;
        this._username = player.username;
        this._playerId = player.playerId;
    }
    
    getMessage() {
        return {
            user: this._username,
            msg: this._message,
            picture: this._picture,
            event_type: this._eventType,
            time: this._time,
            playerId: this._playerId
        };
    }
    
    setToJoinMessage() {
        let leftMessage = `${this._username} has joined the room.`;
        this._message = leftMessage;
        this._eventType = 'user-joined';
    }
    
    setToLeaveMessage() {
        let leftMessage = `${this._username} has left the room.`;
        this._message = leftMessage;
        this._eventType = 'user-left';
    }
}