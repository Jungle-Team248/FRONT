import React, { useState, useEffect } from 'react';
import style from './css/NightEvent.module.css';
import {socket} from '../script/socket';
import { useSelector, useDispatch } from 'react-redux';
import Video from '../components/Video';

const NightEventForCitizen = (props) => {
    const videoList = useSelector((state) => state.videoInfo);
    const [ submitVote, submitVoteState ] = useState(null); // 투표 제출 @ 타이머
    const len = videoList.stream.length;

    return(
        <div className={style.nightEvent}>
            <div className={style.backgroundObj}>
                <div className={style.stars}></div>
                <div className={style.twinkling}></div>
            </div>
            <div className={style.nightEventObj}>
                <div className={style.nightEventTitle}></div>
            </div>
            <div className={style.nightEventObj}>
                { len <= 4 ? <VoteVideoFor4 videoList={videoList} ripList={props.ripList} submitVoteState={submitVoteState}/>
                 : <VoteVideoFor8 videoList={videoList} ripList={props.ripList} submitVoteState={submitVoteState}/> }
            </div>
            <div className={style.nightEventObj}>
                <div className={style.nightEventInfo}>
                    밤이 되었습니다.<span id={style.empty}/>마피아를 추측해 투표하세요.
                </div>
            </div>
            <div className={style.nightEventObj}>
                <VoteTimer becomeNightState={props.becomeNightState} becomeNight={props.becomeNight} submitVote={submitVote} roomId={props.roomId} myId={props.myId} word={props.word}/> 
            </div>

        </div>
    )
};

function VoteTimer(props){
    const [voteTimer, setVoteTimer] = useState(1);
    useEffect(() => {
        if (props.becomeNight) {
            setVoteTimer(15);
        }
    }, [props.becomeNight])

    useEffect (() => {
            console.log("timer 값 얼마니? ", voteTimer);
            if (voteTimer !== 0) {
                const tick = setInterval(() => {
                    setVoteTimer(value => value -1)
                }, 1000);
                return () => {
                    clearInterval(tick);
                }
            } 
            else if (voteTimer === 0) {
                console.log('찍히나', props.word);
                if (props.word != '?'){
                    socket.emit("nightEvent", {gameId: props.roomId, userId: props.myId, gamedata: {submit: props.submitVote}});
                } else {
                    socket.emit("nightEvent", {gameId: props.roomId, userId: props.myId, gamedata: {submit: props.submitWord}});
                }
                props.becomeNightState(false); // 투표 창이 사라짐 setTimeout?
            }
        }, [voteTimer]);

    return (
        <>
        <div className={style.nightTimer}> {voteTimer} </div>
        </>
    )
}


const NightEventForMafia = (props) => {
      let [inputValue, setInputValue] = useState(""); // 마피아의 제시어 제출
      const [ submitWord, submitWordState ] = useState(null); // 제시어 제출 @ 타이머

      const submitTmp = () => {
        //   props.becomeNightState();
          console.log(`마피아 정답 : ${inputValue}`);
          submitWordState(inputValue);
        socket.emit("nightEvent", {gameId: props.roomId, userId: props.myId, gamedata: {submit: inputValue}});
      }
  
      const onKeyPress = (e) => {
          if(e.key == 'Enter') {
              submitTmp();
          }
      }

    return(
        <div className={style.nightEvent}>
            <div className={style.backgroundObj}>
                <div className={style.stars}></div>
                <div className={style.twinkling}></div>
            </div>
            <div className={style.nightEventObj}>
                <div className={style.nightEventTitle} style={{marginTop: 260, height: 240}}></div>
            </div>
            <div className={style.nightEventObj}>
                <dic className={style.nightMafiaForm}>
                    <input className={style.nightInputForm} autoFocus placeholder=" "
                    onChange={(event) => setInputValue(event.target.value)} onKeyPress={onKeyPress}/>
                    <span className={style.formFocusBorder}></span>
                </dic>
            </div>
            <div className={style.nightEventObj}>
                <div className={style.nightEventInfo} style={{marginBottom: 10}}>
                    밤이 되었습니다.<span id={style.empty}/>추측한 제시어를 입력하세요.
                </div>
            </div>
            <div className={style.nightEventObj}>
                <VoteTimer becomeNightState={props.becomeNightState} becomeNight={props.becomeNight} submitWord={submitWord} roomId={props.roomId} myId={props.myId} word={props.word}/> 
            </div>
        </div>
    )
}

// VoteVideo는 div class singleVideo에 각 stream이 들어가면 됨
// 아랫줄 윗줄 기준 맞춰 넣어야 함

// player : 4  ~한 줄로 들어감. 정렬 자동으로 맞춰져 있음
const VoteVideoFor4 = ({videoList, ripList, roomId, myId, submitVoteState}) => {

    const submitAnswer = (answer) => {
        console.log(`투표 결과 ${answer}`);
        submitVoteState(answer);
        // socket.emit("nightEvent", {gameId: roomId, userId: myId, gamedata: {submit: answer}});
    }

    return (
        <div className={style.nightVideo4}>
            <div className={style.voteVideoRow}>
                {
                    videoList && videoList.stream.filter(streamId => !ripList.includes(streamId.userId)).map((streamId) => (
                        <div id={streamId.userId} onClick={() => { submitAnswer(streamId.userId) }} className={style.singleVideo}>
                            <Video stream={streamId.stream} width={"330px"} height={"210px"} />
                        </div>))
                }
            </div>
        </div>
    )
}

// player : 5 ~ 8  ~두 줄로 들어감(2:3, 3:3, 3:4, 4:4 비율). 정렬 자동으로 맞춰져 있음 
const VoteVideoFor8 = ({videoList, ripList, roomId, myId, submitVoteState}) => {
    
    const submitAnswer = (answer) => {
        console.log(`투표 결과 ${answer}`);
        submitVoteState(answer);
        // socket.emit("nightEvent", {gameId: roomId, userId: myId, gamedata: {submit: answer}});
    }

    return (
        <div className={style.nightVideo8}>
             <div className={style.voteVideoRow}>
                {
                    videoList && videoList.stream.filter(streamId => !ripList.includes(streamId.userId)).map((streamId) => (
                        <div id={streamId.userId} onClick={() => { submitAnswer(streamId.userId) }} className={style.singleVideo}>
                            <Video stream={streamId.stream} width={"330px"} height={"210px"} />
                        </div>))
                }
            </div>
            {/* <div className={style.voteVideoRow}>
                <div className={style.singleVideo}>
                    
                </div>
                <div className={style.singleVideo}>
                    
                </div>
                <div className={style.singleVideo}>
                    
                </div>
                <div className={style.singleVideo}>
                    
                </div>
            </div> */}
        </div>
    )
}




export {NightEventForCitizen, NightEventForMafia}