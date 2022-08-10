import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import Canvas from './Canvas';
import VideoWindow from './VideoWindow';
import Video from './Video';
import {socket} from '../script/socket';
import Chat from './Chat';
import style from "../css/Ingame.module.css";
import { clickReady, clearReady, clearGameInfo, turnStatusChange, surviveStatusChange, FriendInfoChange, FriendInfoReset, VideoStreamReset, pushExiter, clearChatExiter, clearVideoWindowExiter, pushNewPlayer, clearChatNewPlayer, clearVideoWindowNewPlayer, clearLoad } from '../store';
import { useNavigate, useLocation } from 'react-router-dom';
import EvilLoader from "../subitems/EvilLoader"
import { RoleCardCitizen, RoleCardMafia } from '../subitems/RoleCard';
import { NightEventForCitizen, NightEventForMafia } from '../subitems/NightEvent';
import GameLoader from '../subitems/GameLoader';
import EmojiBox from '../subitems/EmojiBox';

const Ingame = ({roomId}) => {
    const [ roomEntered, setRoomEntered ] = useState(false);            // 게임 방 입장을 위해 필요한 기본적인 socket listener 등록을 선 진행하기 위한 switching state. 기본 세팅 완료 후 true 세팅 시 실제 ingame 요소 렌더링 진행.
    
    const [ isHost, setHost ] = useState(false);                        // 방장인지 확인
    const ingameStates = useSelector(state => state.ingameStates);      // ready상태, myStream load상태
    const [ readyToStart, setReadyToStart ] = useState(false);          // 방장 - 모든 플레이어가 ready 완료시 start 버튼 활성화

    const [ isStarted, setStart ] = useState(0);                        // 0 - 게임 시작 전, 1 - 게임 시작 (게임 로딩화면 표시), 2 - 게임 시작 (턴 시작)
    const [ turnQue, setTurnQue ] = useState(null);                     // 턴 저장 state
    const [ word, setWord ] = useState({category: "", word: ""});       // 제시어 저장 state
    
    const [ showWord, setShowWord ] = useState(false);                  // 제시어 카드 표시
    let [ voteNumber, voteNumberState ] = useState(null);               // 투표 결과 저장
    let [ voteResultModal, voteResultState ] = useState(false);         // 투표 결과 모달 표시
    let [ deadMan, setDeadMan ] = useState(null);                       // 투표로 탈락된 player 세팅
    let [ result, setResult ] = useState(null);                         // 최종 결과 저장
    let [ mafiaIs, setMafia ] = useState("");                           // 게임 종료시 마피아 정체 저장
    let [ resultModal, resultModalState ] = useState(false);            // 최종 결과 모달 표시
    let [ becomeNight, becomeNightState ] = useState(false);            // 밤 Event (투표, 제시어 제출)

    let [ readyAlert, setReadyAlert] = useState(0);                     // 턴 체인지 3초 전 알림
    let [ endGame, setEndGame ] = useState(false);                      // 게임 종료 신호 (종료 : true)

    const myId = useSelector(state => state.user.id);
    const myImg = useSelector(state => state.user.profile_img);
    const gameUserInfo = useSelector(state => state.gameInfo);          // 현재 turn인 user id, 살았는지 여부
    const videoList = useSelector(state => state.videosStore);          // 비디오 영역의 플레이어 배치, stream 등 저장

    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();

    const changeReadyAlert = (value) => {
        setReadyAlert(value);
    };

    useEffect(()=>{
        // 로비를 통해 접근한 경우에만 통과. 주소로 직접 접근한 경우 비정상적 접근으로 판단.
        if (location.state?.fromLobby !== true) {
            alert("비정상적인 접근입니다. 메인페이지로 이동합니다.");
            window.location.replace("/");
        }

        /*** for game : hyeRexx ***/

        // 새로운 유저 입장 알림 => 기존에 welcome에서 방 입장 알려주는거랑 유사
        socket.on("notifyNew", (data) => {
            // data : userId : 입장 유저의 userId
            dispatch(pushNewPlayer({userId: data.userId, userImg: data.userImg, isReady: data.isReady}));
            socket.emit("notifyOld", {userId: myId, userImg: myImg, isReady: ingameStates.isReady}, data.socketId);
        });

        // 입장해있던 유저 알림
        socket.on("notifyOld", (data) => {
            dispatch(pushNewPlayer(data));
        });

        // start 가능 알림 : for host 
        socket.on("readyToStart", (data) => {
            // data : readyToStart : true
            setReadyToStart(data.readyToStart);
        });

        
        // start버튼이 눌린 후부터 영상 연결, 턴 결정 등 게임시작에 필요한 준비가 완료되기 전까지 준비화면 띄울 수 있도록 신호받음
        socket.on("waitStart", () => {
            setEndGame(false);
            setStart(1);
            dispatch(clearReady());
            setReadyToStart(false);
        });

        // game 시작 알림, 첫 번째 턴을 제공받음
        socket.on("gameStarted", (data) => {
            // data : {turnInfo : turn info Array, word : {category, word} Object}
            setWord(data.word);
            setStart(2);
            setTurnQue(data.turnInfo);
            setTimeout(()=>{
                setTurnQue(null);
                setShowWord(true);
                setTimeout(()=>{
                    setShowWord(false);
                }, 6000);
            }, 5000);
        });

        // turn 교체 요청에 대한 응답
        // turn 교체 요청 "openTurn" 콜백으로 넣어도 될듯?
        socket.on("singleTurnInfo", (data) => {
            // data : userId : 진행할 플레이어 userId
            //        isMafia : 진행할 플레이여 mafia binary
            if (!endGame) {
                dispatch(turnStatusChange(data.userId));
            }
        });

        /* 밤이 되었습니다 화면 띄우고 투표 / 정답 입력 띄우기 */
        // 한 사이클이 끝났음에 대한 알림
        // data 없음! : turn info도 전달하지 않음
        socket.on("cycleClosed", (data) => {
            changeReadyAlert(0);
            becomeNightState(true);
        });

        /* nightResult 결과를 받음 */
        // nightEvent 요청에 대한 진행 보고
        socket.on("nightResult", (data) => {
            setTimeout(() => {
                dispatch(VideoStreamReset());
                
                voteNumberState(data.voteData); // 투표 수치
                voteResultState(true); // 투표 결과 모달
    
                let end = 0;
                if (data.win == "mafia") {
                    setMafia(data.mafia);
                    setResult(1);
                    end = 1;
                } else if (data.win == "citizen") {
                    setMafia(data.mafia);
                    setResult(2);
                    end = 1;
                } else if (data.elected) {
                    setDeadMan(data.elected);
                    setResult(3);
                    if (data.elected === myId){ dispatch(surviveStatusChange(0)); } 
                } else {
                    setResult(4);
                }
                setTimeout(()=> {
                    voteResultState(false); // 투표 결과 모달 닫기
                    resultModalState(true); // 최종 결과 모달
                    setTimeout(() => { 
                        resultModalState(false); // 최종 결과 모달 닫기
                        if (end === 1) {
                            setEndGame(true);
                        }
                    }, 7000);
                }, 4000);
            }, 1000);
        });

        // 누군가의 exit에 의해 host가 바뀌었는데 자신일 경우 setHost
        socket.on("hostChange", (newHost) => {
            if (newHost === myId) {
                setHost(true);
            }
        });

        // 누군가의 exit에 의해 비정상적으로 게임이 종료된 경우
        socket.on("abnormalClose", (data) => {
            setEndGame(true);
            if (data.win == "mafia") {
                setResult(1);
            } else if (data.win == "citizen") {
                setResult(2);
            }
            resultModalState(true);
            setTimeout(()=>{
                resultModalState(false);
                setResult(null);
            }, 5000);
        });

        // 방을 나간 사람에 대한 알림
        // 본인 포함 모두에게 전송, 이벤트 로직 분기 필요
        // 게임중, 대기상태 모두 같은 이벤트
        socket.on("someoneExit", (exiterId) => {
            // data : exit user Id
            dispatch(pushExiter(exiterId));
            // setExiter(exiterId);
        });

        /*** for game : hyeRexx : end ***/

        socket.on("friendList", (userid, status) => {
            if (userid === myId) {
                (status === 0) && (()=>{
                    // doUnMount(true);
                    // setTimeout(()=>{
                    dispatch(FriendInfoReset());
                    socket.close();
                    navigate('/');
                    // }, 0);
                })();
            } else {
                dispatch(FriendInfoChange([userid, status]));
            }
        });

        // listner 세팅 완료 후 방에 입장 알림
        socket.emit("enterRoom", {userId: myId, userImg: myImg, socketId: socket.id, isReady: ingameStates.isReady}, Number(roomId), (host)=>{
            (myId === host) && setHost(true);
            setRoomEntered(true);
        });

        // 기존에 등록된 event listner 삭제
        return () => {
            dispatch(clearReady());
            dispatch(clearChatNewPlayer());
            dispatch(clearVideoWindowNewPlayer());
            dispatch(clearChatExiter());
            dispatch(clearVideoWindowExiter());
            dispatch(clearGameInfo());
            socket.off("notifyNew");
            socket.off("notifyOld");
            socket.off("readyToStart");
            socket.off("waitStart");
            socket.off("gameStarted");
            socket.off("singleTurnInfo");
            socket.off("cycleClosed");
            socket.off("nightResult");
            socket.off("hostChange");
            socket.off("abnormalClose");
            socket.off("someoneExit");
            socket.off("friendList");
            dispatch(clearLoad());
        };
    },[]);

    // Jack - 게임 종료시 game 관련 data 초기화
    useEffect(() => {
        endGame && (() => {
            setWord({category: "", word: ""});
            setStart(0);
            setDeadMan(null);
            dispatch(turnStatusChange([null, null]));
            dispatch(surviveStatusChange(1));
            // redux에 저장해둔 video stream array 초기화 필요
        })();
    }, [endGame]);

    // Jack - 뒤로가기 버튼 막음. 
    useEffect(()=>{
        // 뒤로가기 방지
        const preventBack = () => history.pushState(null, "", location.href);
        history.pushState(null, "", location.href);
        window.addEventListener("popstate", preventBack);

        return () => {
            window.removeEventListener("popstate", preventBack);
        }
    }, []);

    const readyBtn = () => {
        dispatch(clickReady());
        socket.emit("singleReady", {gameId: roomId, userId: myId});
    };

    const startBtn = () => {
        socket.emit("startupRequest", {gameId: roomId, userId: myId}, () => {
            // start 신호 수신시의 작업
        });
    }
    
    /* Exit Button */
    const btnExit = (e) => {
        e.preventDefault();
        socket.emit('exit', myId, Number(roomId), () => {
            navigate('/lobby');
        });
    };

    return (
        <>
        {
              roomEntered ? 
              function () { 
                  return (
                      <div>
  
                      {/* vote result */}
                      { voteResultModal ? <VoteResultModal voteNumber={voteNumber}/> : null }
  
                      {/* total result */}
                      { resultModal ? <ResultModal result={result} mafia={mafiaIs} deadMan={deadMan}/> : null }
  
                      <div className={style.outbox}>
                          <div className={style.flexBox}>
                              <div className={style.item1}>
                                    {/* Video 영역 */}
                                  <VideoWindow readyAlert={readyAlert} isStarted={isStarted} endGame={endGame} deadMan={deadMan}/>
                              </div>
  
                              <div className={style.item2}>
                                  <div className={style.item2Flex}>
                                      <div className={style.canvas}>
                                          <Canvas roomId={roomId} endGame={endGame}/>
                                      </div>
  
                                      <div className={style.chat}>
                                          <Chat roomId={roomId} endGame={endGame} />
                                      </div>
                                  </div>       
                                   {
                                      isStarted === 0?
                                          isHost?
                                              /* design : start button */
                                          (
                                              readyToStart?
                                              <button className={style.startBtn} onClick={startBtn}> START! </button>
                                              :
                                              <button className={style.waitBtn}> WAIT </button>
                                          )
                                          :
                                              /* design : ready button */
                                              <button className=
                                                  {ingameStates.isReady ? `${style.holdBtn} ${style.readyBtn}`: style.readyBtn} onClick={readyBtn}> {ingameStates.isReady ? 'READY!' : 'READY?'}
                                              </button>
                                      :
                                      <></>
                                   }
                              </div>
                          </div>
                      </div>
  
                      <div className={style.topSection}>
                          {/* design : utility buttons */}
                          <div className={style.utility}>
                              <button className={`${style.utilityBtn} ${style.exit}`} onClick={btnExit}>EXIT</button>
                          </div>                    
                          {/* design : utility buttons : END */}
  
                          {/* design : word and Timer */}
                          <div className={style.wordTimer}>
                              <div className={style.wordBox}>
                                  <span className={style.wordBoxLabel}>제시어</span>
                                  <span className={style.wordBoxWord}>{gameUserInfo[0]? (word?.word) : null}</span>
                              </div>
                              <div className={style.timer}>
                                  <span className={style.timerIco}></span>
                                  <span className={style.timerText}><Timer changeReadyAlert = {changeReadyAlert} nowplayer = {gameUserInfo[0]} roomId = {roomId} myId = {myId} endGame = {endGame}/></span>
                              </div>
                          </div>
                          {/* design : word and Timer : END */}
                      </div>

                      {/* design : emoji buttons */}
                      <div className={style.emojiBox}>
                          <EmojiBox roomId={roomId}/>
                      </div>
  
                      {/* design : Loader for start */}
                      {
                          [null,
                          <EvilLoader />,
                          null][isStarted]
                      }
                      {/* design : Loader for start : END */}
                          
                      {/* design : turn information */}
                      {turnQue?
                      <div className={style.turnBoard}>
                          <div className={style.turnBoardTitle}> TURN </div>
                          {turnQue.map((userId, idx) => {
                              return (
                                  <div className={style.singleTurnInfo}>
                                      <span className={style.turnNum}>{idx+1}</span>
                                      <span className={style.turnId}>{userId}</span>
                                  </div>
                              );
                          })}
                      </div>
                      :
                      null
                      }
                      {/* design : role card : Mafia */}
                      {!showWord ? null : ((word.word === '?') ? <RoleCardMafia/> : <RoleCardCitizen word={word.word}/>)}
                      {/* night event */}
                      { (!videoList.filter(user => user.userid === myId)[0]?.isDead && becomeNight && !endGame) ? ((word.word === '?') ? <NightEventForMafia roomId={roomId} myId={myId} becomeNightState={becomeNightState} becomeNight={becomeNight} word={word.word}/> : 
                      <NightEventForCitizen roomId={roomId} myId={myId} becomeNightState={becomeNightState} becomeNight={becomeNight} word={word.word}/>) : null }
                      {ingameStates.isLoaded? null: <GameLoader/>}
                  </div>
                  ); 
              }() : null
          }
          </>
      );
  }
  
function Timer(props){

    const [timer, setTimer] = useState(0);      // 타이머

    // 턴 정보 넘어오면 타이머 시작
    useEffect(() => {
        if (props.nowplayer != null){
            props.changeReadyAlert(0)
            setTimer(17);
        }
    }, [props.nowplayer]);

    // 비정상적으로 게임이 종료되면 타이머 초기화
    useEffect(() => {
        if (props.endGame) {
            setTimer(0);
        }
    }, [props.endGame]);

    // 타이머 동작
    useEffect (() => {
        if (props.nowplayer !== null){
            if (timer !== 0) {
                if (timer === 3){
                    props.changeReadyAlert(1)
                }
                const tick = setInterval(() => {
                    setTimer(value => value - 1)
                }, 1000);
                return () => clearInterval(tick)
            } else {
                if (!props.endGame && props.myId === props.nowplayer) {
                    socket.emit("openTurn", {gameId: props.roomId, userId: props.myId});
                }
                props.changeReadyAlert(0)
            }
        }
    }, [timer]);

    return (
        <>
        {timer}
        </>
    )
}

// 투표 결과 모달
function VoteResultModal(props) {
    const voteNumber = Object.entries(props.voteNumber);// voteNumber => userid, 득표수
    return (
            <div className={style.turnBoard}>
                <div className={style.turnBoardTitle}> VOTE RESULT </div>
                {voteNumber.map((voteNumber)=> {
                    return (
                        <div className={style.singleTurnInfo}>
                            <span className={style.turnNum}>{voteNumber[0]}</span>
                            <span className={style.turnId}>{voteNumber[1]}</span>
                        </div>
                    );
                })}
            </div>
    )
};
  
// 최종 결과 모달
function ResultModal(props) {
    const finalResult = props.result;
    const deadMan = props.deadMan;
    const mafia = props.mafia;
    const userStream = useSelector((state) => state.videosStore);
    const mafiaStream = userStream.filter(x => x.userid === mafia);
    const dieStream = userStream.filter(x => x.userid === deadMan);
    const [greyValue, setGreyValue] = useState(false);

    useEffect(() => {
        setTimeout(() => {
            setGreyValue(true);
        }, 2000)
    }, [deadMan])

    return (
        <>
            <div  className={style.totalResult} style={{width: "680px", textAlign: "center"}}>
            <div className={style.turnBoardTitle}> TOTAL RESULT </div>
            { finalResult === 1? 
            <>
                <div>
                    { mafiaStream.length ?  <Video stream={mafiaStream[0].stream} muted={true}/> : null }
                </div>
                <p><span className={style.turnId}>마피아 {mafia}이(가) 승리했습니다!</span></p>
            </>
            : null }
            { finalResult === 2? 
            <>
                <p><span className={style.turnId}>시민이 승리했습니다!</span></p>
                <div>
                    { mafiaStream.length ?  <Video stream={mafiaStream[0].stream} muted={true}/> : null }
                </div>
                <p><span className={style.turnId}>마피아는 {mafia}이었습니다!</span></p>
            </>
            : null }
            { finalResult === 3? 
            <> 
                <p><span className={style.turnId}>무고한 시민 {deadMan}이(가) 죽었습니다...</span></p>
                <div>
                    { dieStream.length ?  <Video isDead={greyValue} stream={dieStream[0].stream} muted={true}/> : null }
                </div>
            </>
            : null }
            { finalResult === 4? <span className={style.turnId}>오늘 밤은 아무도 죽지 않았습니다...</span>: null }
            </div> 
        </>
    )
};

export default Ingame;