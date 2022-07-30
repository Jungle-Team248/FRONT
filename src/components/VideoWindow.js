import React from 'react';
import axios from 'axios';
import { paddr, reqHeaders } from '../proxyAddr';
import { useState } from 'react';
import { useEffect } from 'react';
import {socket} from '../script/socket';
import Video from './Video';
import { useSelector, useDispatch } from 'react-redux';
import style from '../css/VideoWindow.module.css'
import { VideoStreamChange, clearVideoWindowExiter, clearVideoWindowNewPlayer, pushOthersReady, renewOthersReady, clearOthersReady, loadComplete } from '../store';
import {ReadyOnVideoBig, ReadyOnVideoSmall} from '../subitems/ReadyOnVideo';
import { ASSERT } from '../script/debug';

let myStream;
let peerConnections = {};

const VideoWindow = ({readyAlert, isStarted, endGame, needVideos, deadMan}) => {
    // const [ othersReady, setOthersReady ] = useState(null);
    const dispatch = useDispatch();
    const myId = useSelector(state => state.user.id);
    const myImg = useSelector(state => state.user.profile_img);
    const gameUserInfo = useSelector(state => state.gameInfo); // 현재 turn인 user id, 살았는지
    const [nextTurn, setNextTurn] = useState(null);
    const [videos , setVideos] = useState([                         // refactoring - redux로 전환 필요
        {userid: null, stream: null, image: null, isReady: false, isDead: false},
        {userid: myId, stream: null, image: myImg, isReady: false, isDead: false},
        {userid: null, stream: null, image: null, isReady: false, isDead: false},
        {userid: null, stream: null, image: null, isReady: false, isDead: false},
        {userid: null, stream: null, image: null, isReady: false, isDead: false},
        {userid: null, stream: null, image: null, isReady: false, isDead: false},
        {userid: null, stream: null, image: null, isReady: false, isDead: false},
        {userid: null, stream: null, image: null, isReady: false, isDead: false}
    ]);

    const ingameStates = useSelector(state => state.ingameStates);
    const newPlayerBuffer = useSelector(state => state.newPlayerBuffer);
    const othersReadyBuffer = useSelector(state => state.othersReadyBuffer);
    const exiterBuffer = useSelector(state => state.exiterBuffer);
    
    const setVideo = (index , userid, stream, image, isReady) => {
        ASSERT(`(0 <= ${index}) && (${index} < 8)`);
        let copyVideos = [...videos];
        copyVideos[index].userid = userid==="asis"? copyVideos[index].userid: userid;
        copyVideos[index].stream = stream==="asis"? copyVideos[index].stream: stream;
        copyVideos[index].image = image==="asis"? copyVideos[index].image: image;
        copyVideos[index].isReady = isReady==="asis"? copyVideos[index].isReady: isReady;
        setVideos(copyVideos);
    }

    const setDeadManGray = (userid) => {
        const deadManIdx = peerConnections[userid].vIdx;
        const copyVideos = [...videos];
        copyVideos[deadManIdx].isDead = true;
        setVideos(copyVideos);
    }

    const changeVideo = (vIdx1, vIdx2) => {
        ASSERT(`(0 <= ${vIdx1}) && (${vIdx1} < 8)`);
        ASSERT(`(0 <= ${vIdx2}) && (${vIdx2} < 8)`);
        if (vIdx1 === vIdx2) {
            return null;
        }
        const copyVideos = [...videos];
        const userid1 = copyVideos[vIdx1].userid;
        const userid2 = copyVideos[vIdx2].userid;

        userid1 && (peerConnections[userid1].vIdx = vIdx2);
        userid2 && (peerConnections[userid2].vIdx = vIdx1);

        const tempVideoIdx1 = copyVideos[vIdx1];
        copyVideos[vIdx1] = copyVideos[vIdx2];
        copyVideos[vIdx2] = tempVideoIdx1;

        setVideos(copyVideos);
    }

    const clearReady = () => {
        const copyVideos = [...videos];
        const videosCleared = copyVideos.map((video)=>{
            video.isReady = false;
            return video;
        });
        setVideos(videosCleared);
        dispatch(clearOthersReady());
    }
    
    async function getCameras() {
        const cameras = []
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            const currentCamera = myStream.getVideoTracks()[0];
            cameras.push(currentCamera.deviceId) // 현재 카메라를 맨 첫번째에 배치
            videoDevices.forEach(camera => {
                if(currentCamera.deviceId !== camera.deviceId) cameras.push(camera.deviceId); // 현재 카메라 빼고 나머지 뒤로 추가
            });
        }
        catch(e) {
            console.log(e);
        }
        return cameras;
    }

    async function getMedia(deviceId){
        try {
            myStream = await navigator.mediaDevices.getUserMedia({
                audio: true,
                video: deviceId ? { deviceId } : true
            });
            setVideo(1, "asis", myStream, "asis", ingameStates.isReady);
            dispatch(loadComplete());
        } catch (e) {
            alert(e);
            console.log(e);
        }
    }

    async function initCall() {
        await getMedia();
    }

    function handleIce(data, myId, othersSocket) {
        // ice breack가 생기면? 이를 해당 사람들에게 전달한다.
        // console.log("got ice candidate");
        // console.log(`sendersId : ${myId}`);
        socket.emit("ice", data.candidate, myId, othersSocket);
        // console.log("send ice candidate");
    }

    function handleAddStream(data, othersId) {
        // console.log("got an stream from my peer");
        // stream을 받아오면, 비디오를 새로 생성하고 넣어준다.
        // console.log("got others video: ", data.stream);
        const vIdx = peerConnections[othersId].vIdx;
        setVideo(vIdx, "asis", data.stream, "asis", "asis");
        // console.log(videos);
    }

    async function makeConnection(othersId, othersSocket, _offer) {
        // ASSERT(`${othersId} !== null`);
        // ASSERT(`${othersSocket} !== null`);
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

        return answer || offer;
    }
    
    useEffect( ()=> {
        const initialize = async () => {
            peerConnections[myId] = {vIdx: 1};
            await initCall();
            // console.log(`socket id is ${socket.id}`);

            // 개별 유저의 ready 알림
            socket.on("notifyReady", (data) => {
                // data : userId : 입장 유저의 userId
                //        isReady : userId의 Ready info (binary)
                console.log("debug : notifyReady :", data);
                dispatch(pushOthersReady({userId: data.userId, isReady: data.isReady}));

                // if (othersReadyStatus[data.userId]) {
                //     othersReadyStatus[data.userId].isReady = data.isReady;
                //     othersReadyStatus[data.userId].isSet = false;
                // } else {
                //     othersReadyStatus[data.userId] = {isReady: data.isReady, isSet: false}
                // }
                // setOthersReady({...othersReadyStatus});
            });

            socket.on("streamStart", async (userId, userSocket) => {
                // const timer = (timeDelay) => new Promise((resolve) => setTimeout(resolve, timeDelay)); // debugging - 지금은 
                // await timer(300);
                const offer = await makeConnection(userId, userSocket);
                socket.emit("offer", offer, socket.id, userSocket, myId); // 일단 바로 연결. 추후 게임 start시 (or ready버튼 클릭시) offer주고받도록 바꾸면 좋을듯
                // addMessage(`${user} arrived!`);
            });

            socket.on("offer", async (offer, offersSocket, offersId) => {
                // console.log("receive the offer");
                // console.log(offer);
                // 뉴비는 현재 방안에 있던 모든사람의 offer를 받아 새로운 커넥션을 만들고, 답장을 만든다.
                const answer = await makeConnection(offersId, offersSocket, offer);
                // 답장을 현재 있는 받은 커넥션들에게 각각 보내준다.
                socket.emit("answer", answer, offersSocket, myId);
                // console.log("send the answer");
            });

            socket.on("answer", async (answer, answersId) => {
                // console.log("receive the answer", newbieID);
                // 방에 있던 사람들은 뉴비를 위해 생성한 커섹션에 answer를 추가한다.
                peerConnections[answersId].connection.setRemoteDescription(answer);
            });

            socket.on("ice", (ice, othersId) => {
                // console.log("receive candidate");
                /** 다른 사람에게서 받은 ice candidate를 각 커넥션에 넣는다. */
                // console.log(myId, othersId, videos);
                peerConnections[othersId].connection.addIceCandidate(ice);
            });
        }
        
        try {
            initialize();
        } catch(e) {
            console.log(JSON.stringify(e));
        }

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
            socket.off("notifyReady");
            socket.off("streamStart");
            socket.off("offer");
            socket.off("answer");
            socket.off("ice");
        };
    }, []);

    useEffect(()=>{
        console.log("newPlayer -> peerConnection set : ", JSON.stringify(newPlayerBuffer));
        if (newPlayerBuffer.VideoWindow.length) {
            newPlayerBuffer.VideoWindow.forEach(newPlayer => {
                let i = 0;
                for ( ; i < 8 && videos[i].userid; i++) {}
                peerConnections[newPlayer.userId] = {vIdx: i, connection: null};
                console.log(`peerConnections[${newPlayer.userId}] = `, peerConnections[newPlayer.userId]);
                setVideo(i, newPlayer.userId, "asis", newPlayer.userImg, newPlayer.isReady);
            });
            dispatch(clearVideoWindowNewPlayer());
        }
    }, [newPlayerBuffer.VideoWindow]);

    useEffect(()=>{
        if (othersReadyBuffer.length) {
            const notSetBuffer = [];
            othersReadyBuffer.forEach(others => {
                if (!peerConnections[others.userId]) {
                    notSetBuffer.push(others);
                } else {
                    console.log("vIdx error관련 peerConnections 확인 : ", peerConnections[others.userId]);
                    const usersIdx = peerConnections[others.userId].vIdx;
                    setVideo(usersIdx, "asis", "asis", "asis", others.isReady);
                }
            });
            dispatch(renewOthersReady(notSetBuffer));
        }
    }, [othersReadyBuffer]);

    useEffect(()=>{
        if (exiterBuffer.VideoWindow.length) {
            console.log("exiterBuffer", exiterBuffer);
            exiterBuffer.VideoWindow.forEach(exiterId => {
                const vIdx = peerConnections[exiterId].vIdx;;
                setVideo(vIdx, null, null, null, false);
                peerConnections[exiterId].connection?.close();
                delete peerConnections[exiterId];
            });
            dispatch(clearVideoWindowExiter());
        }
    }, [exiterBuffer.VideoWindow]);

    useEffect(()=>{
        const myIdx = peerConnections[myId]?.vIdx? peerConnections[myId].vIdx: 1;
        setVideo(myIdx, "asis", "asis", "asis", ingameStates.isReady);
    }, [ingameStates.isReady]);

    // console.log('VideoWindow Before useEffect[isStarted]');
    useEffect(()=>{
        // console.log("VideoWindow : useEffect - isStarted? ", isStarted);
        (isStarted === 1) && clearReady();
    }, [isStarted]);

    useEffect(()=>{
        if (deadMan) {
            setDeadManGray(deadMan);
        }
    }, [deadMan]);

    // console.log('VideoWindow Before useEffect[gameUserInfo[0]]');
    useEffect(() => {
        console.log('VideoWindow useEffect - gameUserInfo? ', gameUserInfo);
        let turnIdx = ((endGame === false) && (gameUserInfo[0] !== null))? peerConnections[gameUserInfo[0]].vIdx : -1;
        if (turnIdx !== -1){
            changeVideo(turnIdx, 0);
        }
    }, [gameUserInfo[0]]);

    // console.log('VideoWindow Before useEffect[gameUserInfo[1]]');
    useEffect(() => {
        // console.log('VideoWindow useEffect - gameUserInfo[2]? ', gameUserInfo[2]);
        if ((endGame === false) && (gameUserInfo[0] !== null)){
            myStream.getAudioTracks()?.forEach((track) => (track.enabled = !track.enabled));
        }
    }, [gameUserInfo[2]]);

    useEffect(() => {
        // if ((endGame === false) && (gameUserInfo[1] !== null)){
        if ((gameUserInfo[1] !== null)){
            // 기존 예외처리로 [gameUserInfo[1]]?.vIdx 처리 해놓았었으나, 정상적인 경우라면 vIdx가 있어야하므로 ? 제거함. 문제발생시 왜 vIdx가 없는지 디버깅하는 방향이 옳을듯.
            let turnIdx = peerConnections[gameUserInfo[1]]?.vIdx; 
            // console.log("turnIdx: ", turnIdx);
            (readyAlert && turnIdx) ? setNextTurn(turnIdx) : setNextTurn(null); // 갑자기 누군가 나갔을 떄 다음 턴 주자인 경우 문제생김. 임시방편으로 막아둠,,, 추후 문제시 수정필요
            // console.log("nextTurn: ", nextTurn);
        }
    }, [readyAlert, videos]);

    // 투표 시 비디오 전송
    // const videoList = useSelector((state) => state.videoInfo);
    useEffect(()=> {
        // stream array
        if ( needVideos ) {
            let streamArray = new Array();
            for (let i = 0; i < 8; i++) {
                if (videos[i].userid != null) {
                    streamArray.push({userId: videos[i].userid, stream: videos[i].stream});
                }
            }
            console.log('streamArray', streamArray);
            dispatch(VideoStreamChange(streamArray));
        };
    }, [needVideos]);

    // console.log('VideoWindow Before useEffect[endGame]');
    useEffect(()=>{
        // console.log("VideoWindow : useEffect - endGame? ", endGame);
        endGame && (()=>{
            const copyVideos = [...videos];
            console.log(JSON.stringify(copyVideos));
            Object.keys(peerConnections).forEach((userId) => {
                if (userId != myId) {
                    peerConnections[userId].connection?.close();
                    const vIdx = peerConnections[userId].vIdx;
                    copyVideos[vIdx].stream = null;
                    copyVideos[vIdx].isDead = false;
                } else {
                    const vIdx = peerConnections[userId].vIdx;
                    copyVideos[vIdx].isDead = false;
                }
            });
            setNextTurn(null);
            console.log(JSON.stringify(copyVideos));
            setVideos(copyVideos);
            console.log(copyVideos);
            setTimeout(()=>{
                changeVideo(peerConnections[myId].vIdx, 1);
                console.log(videos);
                console.log(JSON.stringify(videos));
            }, 100);
            console.log(videos);
        })();
    }, [endGame]);

    // 디버깅용 임시. videos 변경 확인
    useEffect(()=>{
        console.log("videos 변경시 mount 후");
        console.log(JSON.stringify(peerConnections));
        console.log(JSON.stringify(videos));
        return () => {
            console.log("videos 변경시 cleanup 시");
            console.log(JSON.stringify(peerConnections));
            console.log(JSON.stringify(videos));
        }
    }, [videos]); 
    
    // {style.videoNow}
    // {nextTurn === 1 ? `${style.gradientborder} ${style.videoObserving}` : style.videoObserving}
    return (
        <>
        <div className={style.videoSection}>
            <div className={style.videoNow}>
                <div className={style.videoLabel}>
                    {(isStarted===2) && gameUserInfo[0] ? "NOW DRAWING - " + videos[0].userid : "USER - " + videos[0].userid}
                </div>
                <div className={style.videoBig}>
                    {/* READY 표시 확인 필요! */}
                    {videos[0].isReady? <ReadyOnVideoBig/>: null}  
                    {videos[0].stream? 
                    <Video stream={videos[0].stream} muted={videos[0].userid === myId? true: false} width={"540px"} height={"290px"}/>
                    :<img style={{opacity:videos[0].userid? "100%": "0%"}} height="100%" src={videos[0].image}/>}
                </div>
            </div>
            <div className= {style.videoObserving}>
                <div className={style.videoLabel}>
                    {videos[1].userid === myId? "ME": "OBSERVING - " + videos[1].userid}  
                </div>
                <div className={style.videoBig}>
                    {/* READY 표시 확인 필요! */}
                    {videos[1].isReady? <ReadyOnVideoBig/>: null} 
                    {videos[1].stream?   
                    <Video stream={videos[1].stream} muted={videos[1].userid === myId? true: false} width={"540px"} height={"290px"} isTurn={nextTurn === 1} isDead={videos[1].isDead}/>
                    :<img style={{opacity:videos[1].userid? "100%": "0%"}} height="100%" src={videos[1].image}/>}
                </div>
            </div>
            
            <div style={{paddingTop: 19, margin: '0 12px', borderBottom: '2px solid #676767'}}></div>
    
            <div className={style.videoOthers}>
                <div className={style.videoMiniRow}>
                    <div className={style.videoMini} onClick={() => (videos[2].stream? changeVideo(2, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        {videos[2].isReady? <ReadyOnVideoSmall/>: null} 
                        {videos[2].stream? 
                        <Video stream={videos[2].stream} muted={videos[2].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 2} isDead={videos[2].isDead}/>
                        :<img style={{opacity:videos[2].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videos[2].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videos[3].stream? changeVideo(3, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        {videos[3].isReady? <ReadyOnVideoSmall/>: null} 
                        {videos[3].stream? 
                        <Video stream={videos[3].stream} muted={videos[3].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 3} isDead={videos[3].isDead}/> 
                        :<img style={{opacity:videos[3].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videos[3].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videos[4].stream? changeVideo(4, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        {videos[4].isReady? <ReadyOnVideoSmall/>: null} 
                        {videos[4].stream? 
                        <Video stream={videos[4].stream} muted={videos[4].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 4} isDead={videos[4].isDead}/> 
                        :<img style={{opacity:videos[4].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videos[4].image}/>}
                    </div>
                </div>
                <div className={style.videoMiniRow} onClick={() => (videos[5].stream? changeVideo(5, 1): null)}>
                    <div className={style.videoMini}>
                        {/* READY 표시 확인 필요! */}
                        {videos[5].isReady? <ReadyOnVideoSmall/>: null} 
                        {videos[5].stream? 
                        <Video stream={videos[5].stream} muted={videos[5].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 5} isDead={videos[5].isDead}/>
                        :<img style={{opacity:videos[5].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videos[5].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videos[6].stream? changeVideo(6, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        {videos[6].isReady? <ReadyOnVideoSmall/>: null} 
                        {videos[6].stream? 
                        <Video stream={videos[6].stream} muted={videos[6].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 6} isDead={videos[6].isDead}/> 
                        :<img style={{opacity:videos[6].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videos[6].image}/>}
                    </div>
                    <div className={style.videoMini} onClick={() => (videos[7].stream? changeVideo(7, 1): null)}>
                        {/* READY 표시 확인 필요! */}
                        {videos[7].isReady? <ReadyOnVideoSmall/>: null} 
                        {videos[7].stream? 
                        <Video stream={videos[7].stream} muted={videos[7].userid === myId? true: false} width={"100%"} height={"120px"} isTurn={nextTurn === 7} isDead={videos[7].isDead}/> 
                        :<img style={{opacity:videos[7].userid? "100%": "0%", position: 'absolute'}} height="100%" src={videos[7].image}/>}
                    </div>
                </div>
            </div>
        </div>
        </>
    );
}

export default VideoWindow;
