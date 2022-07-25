import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import Canvas from './Canvas';
import VideoWindow from './VideoWindow';
import connectSocket, {socket} from '../script/socket';
import Chat from './Chat';
import style from "../css/Ingame.module.css";
import Container from 'react-bootstrap/Container';
import Nav from 'react-bootstrap/Nav';
import Navbar from 'react-bootstrap/Navbar';
import NavDropdown from 'react-bootstrap/NavDropdown';
import axios from 'axios';


const Ingame = ({roomId}) => {
    const [ roomEntered, setRoomEntered ] = useState(false);

    let friendlist;

    const myId = useSelector(state => state.user.id);
    
    useEffect(()=>{
    //socket event name 변경 필요
        console.log(roomId);
        console.log(`${myId}, ${socket.id}, ${roomId}, Number(${roomId})`);
        socket.emit("enterRoom", myId, socket.id, Number(roomId), ()=>{
            console.log(roomId);
            setRoomEntered(true);
        });

        /*** for game : hyeRexx ***/

        // 새로운 유저 입장 알림
        socket.on("notifyNew", (data) => {
            // data : userId : 입장 유저의 userId
            console.log("debug : notifyNew :", data);
        });

        // 개별 유저의 ready 알림
        socket.on("notifyReady", (data) => {
            // data : userId : 입장 유저의 userId
            //        isReady : userId의 Ready info (binary)
            console.log("debug : notifyReady :", data);
        });

        // start 가능 알림 : for host 
        socket.on("reayToStart", (data) => {
            // data : readyToStart : true
            console.log("debug : reayToStart :", data);
        });

        // game 시작 알림, 첫 번째 턴을 제공받음
        socket.on("gameStarted", (data) => {
            // data : turn info Array
            console.log("debug : gameStarted :", data);
        })

        // turn 교체 요청에 대한 응답
        // turn 교체 요청 "openTurn" 콜백으로 넣어도 될듯?
        socket.on("singleTurnInfo", (data) => {
            // data : userId : 진행할 플레이어 userId
            //        isMafia : 진행할 플레이여 mafia binary
            console.log("debug : singleTurnInfo :", data);
        });

        // 한 사이클이 끝났음에 대한 알림
        // data 없음! : turn info도 전달하지 않음
        socket.on("cycleClosed", () => {
            console.log("debug : cycleClosed!")
        });

        // nightEvent 요청에 대한 진행 보고
        socket.on("nightResult", (data) => {
            // data : win : mafia or citizen or null
            //        elected : killed of null
            //        voteData : voteData object orray
            console.log("debug : nightResult :", data);
        });

        // 방을 나간 사람에 대한 알림
        // 본인 포함 모두에게 전송, 이벤트 로직 분기 필요
        // 게임중, 대기상태 모두 같은 이벤트
        socket.on("someoneExit", (data) => {
            // data : userId : exit user Id
            console.log("debug : someoneExit :", data);
        });

        /*** for game : hyeRexx : end ***/
    },[]);

    const readyBtn = () => {
        console.log("ready?")
        socket.emit("singleReady", {gameId: roomId, userId: myId});
    }

    const startBtn = () => {
        socket.emit("startupRequest", {gameId: roomId, userId: myId}, () => {
            // start 신호 수신시의 작업
        });
    }

    const openTurnBtn = () => {
        socket.emit("openTurn", {gameId: roomId, userId: myId});
    }

    const nightBtn = () => {
        // submit myId는 임시값!
        socket.emit("nightEvent", {gameId: roomId, userId: myId, gamedata: {submit: myId}});
    }

    const newCycleBtn = () => {
        socket.emit("newCycleRequest", {gameId: roomId, userId: myId});
    }

    return (
    <>
    {
    roomEntered ?
    function () {
    return (
        <>
        <div className={style.ingameBox}>
            <Canvas></Canvas>
            안녕~
        </div>
        </>
    );
    }()
    : null
    }
    </>
);
}

export default Ingame;