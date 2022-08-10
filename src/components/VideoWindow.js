import React from 'react';
import axios from 'axios';
import { paddr, reqHeaders } from '../proxyAddr';
import { useState } from 'react';
import { useEffect } from 'react';
import {socket} from '../script/socket';
import Video from './Video';
import { EmojiBig, EmojiSmall } from '../subitems/emoji'
import { useSelector, useDispatch } from 'react-redux';
import style from '../css/VideoWindow.module.css'
import { clearVideoWindowExiter, clearVideoWindowNewPlayer, pushOthersReady, renewOthersReady, clearOthersReady, loadComplete, clearVideoStore, setVideosStore, videoChangeStore, attributeChangeStore, attributeMultiChangeStore, setAllVideoStore, pushEmoji, clearEmojiBuffer, clearEmoji, setEmoji, changeEmoji } from '../store';
import {ReadyOnVideoBig, ReadyOnVideoSmall} from '../subitems/ReadyOnVideo';
import { constraints, limits } from '../script/constraints';

let myStream;                                                                   // user의 stream 저장
let peerConnections = {};                                                       // 다른 player의 화면 구성 위치 (vedio index) 와 rtc connection 정보를 저장

const VideoWindow = ({readyAlert, isStarted, endGame, deadMan}) => {
    const dispatch = useDispatch();

    const myId = useSelector(state => state.user.id);
    const myImg = useSelector(state => state.user.profile_img);

    const gameUserInfo = useSelector(state => state.gameInfo);                  // 현재 turn인 user id, 살았는지
    const videosStore = useSelector(state => state.videosStore);                // player들의 비디오 영역 위치(video index), stream, ready정보 등
    const [nextTurn, setNextTurn] = useState(null);                             // 다음 turn 알림 관련 state

    const ingameStates = useSelector(state => state.ingameStates);              // user의 ready 정보, myStream 세팅 완료 정보
    const newPlayerBuffer = useSelector(state => state.newPlayerBuffer);        // player 입장시 비디오 등 관련 처리 위한 임시 정보 저장 buffer
    const othersReadyBuffer = useSelector(state => state.othersReadyBuffer);    // other player의 ready정보를 처리하기 위해 임시로 저장해두는 buffer
    const exiterBuffer = useSelector(state => state.exiterBuffer);              // 퇴장한 player의 정리를 위해 임시로 저장해두는 buffer
    const emojiBuffer = useSelector(state => state.emojiBuffer);                // emoji chat 관련 buffer

    // Jack - 죽은 사람 회색으로 만들기
    const setDeadManGray = (userid) => {
        const deadManIdx = peerConnections[userid].vIdx;
        dispatch(attributeChangeStore([deadManIdx, "isDead", true]));
    }

    // 두 개의 video index 로 video 위치 교체
    const changeVideo = (vIdx1, vIdx2) => {
        if (vIdx1 === vIdx2) {
            return true;
        }
        const userid1 = videosStore[vIdx1].userid;
        const userid2 = videosStore[vIdx2].userid;

        userid1 && (peerConnections[userid1].vIdx = vIdx2);
        userid2 && (peerConnections[userid2].vIdx = vIdx1);

        dispatch(videoChangeStore([vIdx1, vIdx2]));

        dispatch(changeEmoji([vIdx1, vIdx2]));
        return true;
    }

    // 게임 시작 시 다음 게임을 위해 player들의 ready 상태 초기화
    const clearReady = () => {
        dispatch(attributeMultiChangeStore(["isReady", false]))
        dispatch(clearOthersReady());
    }

    // 사용자 카메라/마이크 획득 및 stream 생성
    async function getMedia(){
        try {
            myStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    sampleRate: 22050,
                    sampleSize: 8,
                    echoCancellation: true
                },
                video: constraints[1]
            });
            dispatch(setVideosStore([1, "asis", myStream, "asis", ingameStates.isReady]));
            dispatch(loadComplete()); // 카메라/음성 세팅 완료. 로딩화면 해제.
        } catch (e) {
            // 사용자 장비가 준비되지 않은 경우 - 확인 클릭 시 재시도, 취소 클릭 시 로비로 이동
            const userAnswer =  confirm("카메라 또는 마이크를 사용할 수 없습니다.\n사용자 장비를 세팅 후 확인을 누르시거나, 게임에서 나가시려면 취소를 클릭해주세요.");
            if ( userAnswer ) {
                await getMedia();
            } else {
                window.location.replace("/lobby");
            }
        }
    }

    async function initCall() {
        await getMedia();
    }

    // ice가 생기면 이를 해당 사람들에게 전달한다.
    function handleIce(data, myId, othersSocket) {
        socket.emit("ice", data.candidate, myId, othersSocket);
    }

    // stream을 받아오면, 비디오를 새로 생성하고 넣어준다.
    function handleAddStream(data, othersId) {
        const vIdx = peerConnections[othersId].vIdx;
        dispatch(setVideosStore([vIdx, "asis", data.stream, "asis", "asis"]));
    }

    // 게임 시작 시 player간의 rtc connection 생성
    async function makeConnection(othersId, othersSocket, _offer) {
        const myPeerConnection = new RTCPeerConnection({
            iceServers: [
                {
                    urls: [
                        "stun:stun.l.google.com:19302",
                        "stun:stun1.l.google.com:19302",
                        "stun:stun2.l.google.com:19302",
                        "stun:stun3.l.google.com:19302",
                        "stun:stun4.l.google.com:19302",
                        "stun:stun01.sipphone.com",
                        "stun:stun.ekiga.net",
                        "stun:stun.fwdnet.net",
                        "stun:stun.ideasip.com",
                        "stun:stun.iptel.org",
                        "stun:stun.rixtelecom.se",
                        "stun:stun.schlund.de",
                        "stun:stunserver.org",
                        "stun:stun.softjoys.com",
                        "stun:stun.voiparound.com",
                        "stun:stun.voipbuster.com",
                        "stun:stun.voipstunt.com",
                        "stun:stun.voxgratia.org",
                        "stun:stun.xten.com"
                    ]
                }
            ]
        });

        peerConnections[othersId].connection = myPeerConnection;
    
        myPeerConnection.addEventListener("icecandidate", (data) => handleIce(data, myId, othersSocket));
        myPeerConnection.addEventListener("addstream", (data) => handleAddStream(data, othersId));
        myStream.getTracks().forEach(track => myPeerConnection.addTrack(track, myStream));
    
        let offer = _offer;
        let answer;
        if(!offer) {
            offer = await myPeerConnection.createOffer();
            myPeerConnection.setLocalDescription(offer);
        }
        else {
            myPeerConnection.setRemoteDescription(offer);
            answer = await myPeerConnection.createAnswer();
            myPeerConnection.setLocalDescription(answer);
        }

        // 게임 시작시 인원수에 따라 bitrate 유동적 적용
        // const playerCnt = 1;
        const playerCnt = Object.keys(peerConnections).length;
        const videoSender = myPeerConnection.getSenders()[1];
        const videoParameters = videoSender.getParameters();
        videoParameters.encodings[0].maxBitrate = limits[playerCnt].maxBitrate;
        videoParameters.encodings[0].maxFramerate = limits[playerCnt].maxFramerate;
        videoSender.setParameters(videoParameters);

        return answer || offer;
    }
    
    // 비디오 영역 관련 mount시 초기화
    useEffect( ()=> {
        const initialize = async () => {
            // 유저의 자리를 1번으로 먼저 세팅, myStream 초기화
            dispatch(setVideosStore([1, myId, "asis", myImg, "asis"]));
            peerConnections[myId] = {vIdx: 1};
            await initCall();

            // 개별 유저의 ready 알림
            socket.on("notifyReady", (data) => {
                // data : userId : 입장 유저의 userId
                //        isReady : userId의 Ready info (binary)
                dispatch(pushOthersReady({userId: data.userId, isReady: data.isReady}));
            });

            // 게임 시작 시 유저들의 stream 연결 - rtc connection 생성 및 offer 전송
            socket.on("streamStart", async (userId, userSocket) => {
                const offer = await makeConnection(userId, userSocket);
                socket.emit("offer", offer, socket.id, userSocket, myId); // 일단 바로 연결. 추후 게임 start시 (or ready버튼 클릭시) offer주고받도록 바꾸면 좋을듯
            });

            // offer 수신 시 connection 생성 및 answer 전송
            socket.on("offer", async (offer, offersSocket, offersId) => {
                // 뉴비는 현재 방안에 있던 모든사람의 offer를 받아 새로운 커넥션을 만들고, 답장을 만든다.
                const answer = await makeConnection(offersId, offersSocket, offer);
                // 답장을 현재 있는 받은 커넥션들에게 각각 보내준다.
                socket.emit("answer", answer, offersSocket, myId);
            });

            // answer 수신 시 connection에 remote description 등록
            socket.on("answer", async (answer, answersId) => {
                // 방에 있던 사람들은 뉴비를 위해 생성한 커섹션에 answer를 추가한다.
                peerConnections[answersId].connection.setRemoteDescription(answer);
            });

            // ice (Interactive Connectivity Establishment) 수신 시 connection 에 추가
            socket.on("ice", (ice, othersId) => {
                /** 다른 사람에게서 받은 ice candidate를 각 커넥션에 넣는다. */
                peerConnections[othersId].connection.addIceCandidate(ice);
            });

            // emoji chat 수신시 emoji buffer에 push
            socket.on("newEmoji", data => {
                dispatch(pushEmoji(data));
            });
        }
        
        try {
            initialize();
        } catch(e) {
            console.log(JSON.stringify(e));
        }

        // unmount시 비디오 영역 관련 buffer 등의 state와 listener 초기화
        return ()=> {
            Object.keys(peerConnections).forEach((userId) => {
                peerConnections[userId].connection?.close();
                delete peerConnections[userId];
            });
            peerConnections = {};
            myStream?.getTracks()?.forEach((track) => {
                track.stop();
            });
            dispatch(clearOthersReady());
            dispatch(clearEmojiBuffer());
            dispatch(clearEmoji());
            dispatch(clearVideoStore()); // unmount 시 redux의 video 초기화
            socket.off("notifyReady");
            socket.off("streamStart");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice");
            socket.off("newEmoji");
        };
    }, []);

    // Jack - player 입장 시 push 해두었던 player들의 정보를 buffer에서 꺼내 비디오 영역의 가용한 자리에 일괄 배치
    useEffect(()=>{
        if (newPlayerBuffer.VideoWindow.length) { // buffer중 videowindow 영역에 처리 대기 중인 player data가 있는 경우
            let copyVideos = [...videosStore];
            newPlayerBuffer.VideoWindow.forEach(newPlayer => {
                let i = 0;
                for ( ; i < 8 && copyVideos[i].userid; i++) {} // 가용한 자리 탐색
                peerConnections[newPlayer.userId] = {vIdx: i, connection: null};
                copyVideos[i] = {userid: newPlayer.userId, stream: null, image: newPlayer.userImg, isReady: newPlayer.isReady, isDead: false}
            });
            
            // 인원 변동에 따른 해상도/framerate 변경
            const playerCnt = Object.keys(peerConnections).length;
            myStream?.getVideoTracks()[0].applyConstraints(constraints[playerCnt]);
            dispatch(setAllVideoStore(copyVideos)); // 변경사항 일괄 처리 후
            dispatch(clearVideoWindowNewPlayer()); // buffer 비움
        }
    }, [newPlayerBuffer.VideoWindow]);

    // Jack - 다른 player들의 ready 정보가 넘어와 push 해두었던 정보를 일괄적으로 처리 
    useEffect(()=>{
        if (othersReadyBuffer.length) {
            const notSetBuffer = []; // ready 정보는 넘어왔으나 player의 정보가 아직 처리되지 않은 경우 ready 처리가 불가하므로, player 정보 선 처리 후 다시 처리 할 수 있도록 임시 저장해둠
            othersReadyBuffer.forEach(others => {
                if (!peerConnections[others.userId]) { // peerConnections에 세팅되지 않은 경우 notSetBuffer에 임시 보관
                    notSetBuffer.push(others);
                } else {
                    const usersIdx = peerConnections[others.userId].vIdx;
                    dispatch(setVideosStore([usersIdx, "asis", "asis", "asis", others.isReady])); // 해당 유저의 비디오 영역에 ready 상태 반영
                }
            });
            dispatch(renewOthersReady(notSetBuffer)); // 세팅되지 않아 임시 보관해둔 data들을 dispatch하여 이후 재시도 할 수 있도록 함
        }
    }, [othersReadyBuffer]);

    // Jack - 다른 player의 퇴장 정보가 넘어와 push 해둔 정보를 일괄 처리
    useEffect(()=>{
        if (exiterBuffer.VideoWindow.length) {
            exiterBuffer.VideoWindow.forEach(exiterId => {
                const vIdx = peerConnections[exiterId].vIdx;;
                dispatch(setVideosStore([vIdx, null, null, null, false]));      // 배치해둔 비디오 정보 초기화
                peerConnections[exiterId].connection?.close();                  // 게임 중인 경우 connection close
                delete peerConnections[exiterId];                               // peerConnections에서 제거
            });

            // 퇴장한 사람에 의한 인원수 변동에 따라 내 해상도 변경
            const playerCnt = Object.keys(peerConnections).length;
            myStream && myStream.getVideoTracks()[0].applyConstraints(constraints[playerCnt]);
            
            dispatch(clearVideoWindowExiter()); // 처리 완료 후 buffer 비움
        }
    }, [exiterBuffer.VideoWindow]);

    // Jack - 유저(본인)의 ready 상태 반영
    useEffect(()=>{
        const myIdx = peerConnections[myId]?.vIdx? peerConnections[myId].vIdx: 1;
        dispatch(setVideosStore([myIdx, "asis", "asis", "asis", ingameStates.isReady]));
    }, [ingameStates.isReady]);

    // Jack - emoji chat 발생 시 push 해두었던 정보 일괄 처리
    useEffect(()=>{
        if ( emojiBuffer.buffer.length ) {
            emojiBuffer.buffer.forEach(data => {
                const idx = peerConnections[data.userId]?.vIdx;
                if (idx !== undefined) {
                    dispatch(setEmoji({idx: idx, emoji: data.emoji}));
                }
            });
            dispatch(clearEmojiBuffer());
        }
    }, [emojiBuffer.buffer]);
 
    // Jack - 게임이 시작되면 ready상태 초기화
    useEffect(()=>{
        (isStarted === 1) && clearReady();
    }, [isStarted]);

    useEffect(()=>{
        if (deadMan) {
            setDeadManGray(deadMan);
        }
    }, [deadMan]);

    useEffect(() => {
        let turnIdx = ((endGame === false) && (gameUserInfo[0] !== null))? peerConnections[gameUserInfo[0]].vIdx : -1;
        if (turnIdx !== -1){
            changeVideo(turnIdx, 0);
        }
    }, [gameUserInfo[0]]);

    useEffect(() => {
        if ((endGame === false) && (gameUserInfo[0] !== null)){
            myStream.getAudioTracks()?.forEach((track) => (track.enabled = !track.enabled));
        }
    }, [gameUserInfo[2]]);

    useEffect(() => {
        if (!readyAlert) {
            setNextTurn(null);
        }
        if ((gameUserInfo[1] !== null)) {
            // 기존 예외처리로 [gameUserInfo[1]]?.vIdx 처리 해놓았었으나, 정상적인 경우라면 vIdx가 있어야하므로 ? 제거함. 문제발생시 왜 vIdx가 없는지 디버깅하는 방향이 옳을듯.
            let turnIdx = peerConnections[gameUserInfo[1]]?.vIdx; 
            (readyAlert && turnIdx) ? setNextTurn(turnIdx) : setNextTurn(null); // 갑자기 누군가 나갔을 떄 다음 턴 주자인 경우 문제생김. 임시방편으로 막아둠,,, 추후 문제시 수정필요
        }
    }, [readyAlert, videosStore]);

    // Jack - 게임 종료(endGame === true) 시 비디오 영역의 game 관련 data 초기화, stream 종료
    useEffect(()=>{
        endGame && (()=>{
            Object.keys(peerConnections).forEach((userId) => {
                if (userId != myId) {
                    peerConnections[userId].connection?.close();
                    const vIdx = peerConnections[userId].vIdx;
                    dispatch(attributeChangeStore([vIdx, "stream", null]));
                    dispatch(attributeChangeStore([vIdx, "isDead", false]));
                } else {
                    const vIdx = peerConnections[userId].vIdx;
                    dispatch(attributeChangeStore([vIdx, "isDead", false]));
                }
            });
            setNextTurn(null);
            setTimeout(()=>{
                changeVideo(peerConnections[myId].vIdx, 1);
            }, 100);
        })();
    }, [endGame]);

    return (
        <>
        <div className={style.videoSection}>
            <div className={style.videoNow}>
                <div className={style.videoLabel}>
                    {(isStarted===2) && gameUserInfo[0] ? "NOW DRAWING - " + videosStore[0].userid : "USER - " + videosStore[0].userid}
                </div>
                <div className={style.nowFrame} style={{display: (isStarted == 2 ? 'block' : 'none')}}></div>
                <div className={style.videoBig}>
                    {/* READY 표시 확인 필요! */}
                    <EmojiBig newEmoji={emojiBuffer.emoji[0]} idx={0} />
                    {videosStore[0].isReady? <ReadyOnVideoBig/>: null}  
                    {videosStore[0].stream? 
                    <Video stream={videosStore[0].stream} muted={videosStore[0].userid === myId? true: false} width={"540px"} height={"290px"}/>
                    :<img style={{opacity:videosStore[0].userid? "100%": "0%"}} height="100%" src={videosStore[0].image}/>}
                </div>
            </div>
            <div className= {style.videoObserving}>
                <div className={style.videoLabel}>
                    {videosStore[1].userid === myId? "ME": "OBSERVING - " + videosStore[1].userid}  
                </div>
                <div className={style.videoBig}>
                    {/* READY 표시 확인 필요! */}
                    <EmojiBig newEmoji={emojiBuffer.emoji[1]} idx={1} />
                    {videosStore[1].isReady? <ReadyOnVideoBig/>: null} 
                    {videosStore[1].stream?   
                    <Video stream={videosStore[1].stream} muted={videosStore[1].userid === myId? true: false} width={"540px"} height={"290px"} isTurn={nextTurn === 1} isDead={videosStore[1].isDead}/>
                    :<img style={{opacity:videosStore[1].userid? "100%": "0%"}} height="100%" src={videosStore[1].image}/>}
                </div>
            </div>
            
            <div style={{paddingTop: 19, margin: '0 12px', borderBottom: '2px solid #676767'}}></div>
    
            <div className={style.videoOthers}>
                <div className={style.videoMiniRow}>
                    <div className={style.videoMini} onClick={() => (videosStore[2].stream? changeVideo(2, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        <EmojiSmall newEmoji={emojiBuffer.emoji[2]} idx={2} />
                        {videosStore[2].isReady? <ReadyOnVideoSmall/>: null} 
                        {videosStore[2].stream? 
                        <Video stream={videosStore[2].stream} muted={videosStore[2].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 2} isDead={videosStore[2].isDead}/>
                        :<img style={{opacity:videosStore[2].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videosStore[2].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videosStore[3].stream? changeVideo(3, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        <EmojiSmall newEmoji={emojiBuffer.emoji[3]} idx={3} />
                        {videosStore[3].isReady? <ReadyOnVideoSmall/>: null} 
                        {videosStore[3].stream? 
                        <Video stream={videosStore[3].stream} muted={videosStore[3].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 3} isDead={videosStore[3].isDead}/> 
                        :<img style={{opacity:videosStore[3].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videosStore[3].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videosStore[4].stream? changeVideo(4, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        <EmojiSmall newEmoji={emojiBuffer.emoji[4]} idx={4} />
                        {videosStore[4].isReady? <ReadyOnVideoSmall/>: null} 
                        {videosStore[4].stream? 
                        <Video stream={videosStore[4].stream} muted={videosStore[4].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 4} isDead={videosStore[4].isDead}/> 
                        :<img style={{opacity:videosStore[4].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videosStore[4].image}/>}
                    </div>
                </div>
                <div className={style.videoMiniRow} onClick={() => (videosStore[5].stream? changeVideo(5, 1): null)}>
                    <div className={style.videoMini}>
                        {/* READY 표시 확인 필요! */}
                        <EmojiSmall newEmoji={emojiBuffer.emoji[5]} idx={5} />
                        {videosStore[5].isReady? <ReadyOnVideoSmall/>: null} 
                        {videosStore[5].stream? 
                        <Video stream={videosStore[5].stream} muted={videosStore[5].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 5} isDead={videosStore[5].isDead}/>
                        :<img style={{opacity:videosStore[5].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videosStore[5].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videosStore[6].stream? changeVideo(6, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        <EmojiSmall newEmoji={emojiBuffer.emoji[6]} idx={6} />
                        {videosStore[6].isReady? <ReadyOnVideoSmall/>: null} 
                        {videosStore[6].stream? 
                        <Video stream={videosStore[6].stream} muted={videosStore[6].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 6} isDead={videosStore[6].isDead}/> 
                        :<img style={{opacity:videosStore[6].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videosStore[6].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videosStore[7].stream? changeVideo(7, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        <EmojiSmall newEmoji={emojiBuffer.emoji[7]} idx={7} />
                        {videosStore[7].isReady? <ReadyOnVideoSmall/>: null} 
                        {videosStore[7].stream? 
                        <Video stream={videosStore[7].stream} muted={videosStore[7].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 7} isDead={videosStore[7].isDead}/> 
                        :<img style={{opacity:videosStore[7].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videosStore[7].image}/>}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default VideoWindow;
