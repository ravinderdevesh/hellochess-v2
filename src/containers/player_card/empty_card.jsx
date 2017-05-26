import React, {Component} from 'react';
import {connect} from 'react-redux';
import {sitDownBoard, sitDownComputer} from '../../actions/room';

import {Panel, Button, MenuItem, SplitButton, Row} from 'react-bootstrap';

class EmptyCard extends Component {
    constructor(props) {
        super(props);
        this.aiSit = this.aiSit.bind(this);
        this.onSit = this.onSit.bind(this);
        this.difficulties = {
            1: "Very Easy",
            5: "Easy",
            10: "Normal",
            15: "Hard",
            20: "Very Hard"
        };
    }
    
    onSit(event) {
        let obj = {};
        obj.profile = this.props.profile;
        obj.roomName = this.props.activeThread;
        obj.color = this.props.color;
        this.props.sitDownBoard(obj);
    }

    aiSit(event) {
        let level = arguments[0];
        let difficultyText = this.difficulties[level];
        let obj = {};
        obj.roomName = this.props.activeThread;
        let ratings;
        switch (this.props.gameType) {
            case "two-player":
                ratings = "standard_ratings";
                break;
            case 'schess':
                ratings = "schess_ratings";
                break;
            case "four-player":
                ratings = "fourplayer_ratings";
                break;
            case "crazyhouse":
                ratings = "crazyhouse_ratings";
                break;
            case "crazyhouse960":
                ratings = "crazyhouse960_ratings";
                break;
        }
        obj.profile = {
            type: 'computer',
            username: difficultyText + ' AI',
            level: level,
            picture: 'https://openclipart.org/image/75px/svg_to_png/168755/cartoon-robot.png&disposition=attachment',
        };
        obj.profile[ratings] = {
            classical: 1200,
            rapid: 1200,
            blitz: 1200,
            bullet: 1200
        };
        obj.color = this.props.color;
        this.props.sitDownComputer(obj);
    }
    
    renderAIButtons() {
        if (this.props.gameType !== "schess") {
            return (
                <Row>
                    <SplitButton id={"player-button-" + this.props.colorClass} 
                        onClick={this.onSit} title="Play" bsStyle="info">
                        <MenuItem eventKey="1" onClick={this.aiSit.bind(this, 1)} >
                            Very Easy AI
                        </MenuItem>
                        <MenuItem eventKey="2" onClick={this.aiSit.bind(this, 5)} >
                            Easy AI
                        </MenuItem>
                        <MenuItem eventKey="3" onClick={this.aiSit.bind(this, 10)} >
                            Normal AI
                        </MenuItem>
                        <MenuItem eventKey="4" onClick={this.aiSit.bind(this, 15)} >
                            Hard AI
                        </MenuItem>
                        <MenuItem eventKey="5" onClick={this.aiSit.bind(this, 20)} >
                            Very Hard AI
                        </MenuItem>
                    </SplitButton>
                </Row>
            );
        } else {
            return (
                <Row>
                    <Button id={"player-button-" + this.props.colorClass} 
                        onClick={this.onSit} title="Play" bsStyle="info">
                        Play
                    </Button>
                </Row>
            );
        }
    }

    render() {
        const {game} = this.props;
        let time = game.time;
        if(!time) {
            return <div></div>
        }
        

        return (
            <Panel className={"player-card " + this.props.colorClass}>
                {this.renderAIButtons()}
                <h4 className="player-time-info pull-right">{`${time.value}:00`}</h4>
            </Panel>
        );
    }
}

function mapStateToProps(state) {
    return {
        profile: state.auth.profile,
        activeThread: state.activeThread,
        game: state.openThreads[state.activeThread],
        gameType: state.openThreads[state.activeThread].game.gameType
    }
}


export default connect(mapStateToProps,  {sitDownBoard, sitDownComputer}) (EmptyCard)