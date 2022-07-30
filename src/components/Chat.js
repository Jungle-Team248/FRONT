import React, { useState, useEffect, useRef } from 'react';
import style from "../css/Chat.module.css"
import {socket} from '../script/socket';
import { useSelector, useDispatch } from 'react-redux';
import { clearChatExiter, clearChatNewPlayer } from '../store';
import { ASSERT } from '../script/debug';

const Chat = ({roomId, endGame}) => {
    const [ newMsg, setNewMsg ] = useState(null);
    const [ chatWindow, setChatWindow ] = useState([`${roomId} 방에 입장하셨습니다.`]);
    const [ input, setInput ] = useState("");
    const inputBox = useRef();
    const chatBox = useRef();
    const isAlive = useSelector(state=>state.gameInfo[1]);
    const myId = useSelector(state=>state.user.id);

    const newPlayerBuffer = useSelector(state => state.newPlayerBuffer);
    const exiterBuffer = useSelector(state => state.exiterBuffer);

    const dispatch = useDispatch();
    
    function handleMessageInput(event) {
        event.preventDefault();
        setInput(event.target.value);
    }

    function addMessage(message) {
        let newChat = [...chatWindow];
        newChat.push(message);
        setChatWindow(newChat);
    }

    function handleMessageSubmit(event) {
        event.preventDefault();

        if (input == "" || input == null || input == undefined){
            // alert("채팅을 입력해주세요!");
            return;
        }

        var YokList = new Array('개새끼','개색기','개색끼','개자식','씨발','씨팔','씨부랄','씨바랄','씹창','씹탱','씨방세',
                                '씨방새','씨펄','시펄','십탱','씨박','썅','싸가지','쓰벌','씁얼','상넘이','상놈의','상놈이','상놈을','좆','좃','존나게',
                                '존만한','호로','후레아들','호로새끼','후레자식','후래자식','병신');
        var Tmp;
        for(let i=0 ; i<YokList.length ; i++){
            Tmp = input.toLowerCase().indexOf(YokList[i]);
            if(Tmp >= 0){
                alert('바른말 고운말을 사용해주세요!');
                inputBox.current.value = "";
                setInput("");
                return;
            }
        }

        // props로 넘어온 roomId는 String 타입이므로 int 타입으로 변환해줘야
        const newMsg = `${myId} : ${input}`;
        socket.emit("new_message", newMsg, Number(roomId), () => {
            setNewMsg(`You : ${input}`);
        });
        inputBox.current.value = "";
        setInput("");
    }

    useEffect(()=> {
        socket.on("new_message", setNewMsg);
        return ()=>{
            socket.off("new_message");
        }
    },[]);

    useEffect(()=>{
        console.log("여기는 들어오나?");
        console.log(`newPlayerBuffer.Chat.length : ${newPlayerBuffer.Chat.length}`);
        if (newPlayerBuffer.Chat.length) {
            newPlayerBuffer.Chat.forEach(newPlayer => {
                console.log("여기 들어오나?");
                addMessage(`${newPlayer.userId} 님이 입장하셨습니다.`);
            })
            dispatch(clearChatNewPlayer());
        }
    },[newPlayerBuffer.Chat]);

    useEffect(()=>{
        if (exiterBuffer.Chat.length) {
            exiterBuffer.Chat.forEach(exiterId => {
                addMessage(`${exiterId} 님이 퇴장하셨습니다.`);
            });
            dispatch(clearChatExiter());
        }
    },[exiterBuffer.Chat]);

    useEffect(()=>{
        endGame && addMessage("게임이 종료되었습니다.");
    },[endGame]);

    useEffect(()=>{
        newMsg && addMessage(newMsg);
    },[newMsg]);

    useEffect(()=>{
        if (isAlive === 0) {
            inputBox.current.disabled = true;
        }
    },[isAlive]);

    useEffect(()=>{
        chatWindow && chatBox.current?.scrollIntoView(false ,{behavior: 'smooth'});
    },[chatWindow]);

    return (
        <>
        <div id="room" style={{height: '100%', padding: "0px 50px 0px 0px"}}>
            <div className={style.chatBox}>
                <div className={style.chatLog}>
                    <ul ref={chatBox} style={{ color: "black", paddingLeft: 10}}>
                        {chatWindow.map((message, idx) => {
                            return <h5 key={idx}>{message}</h5>
                        })}
                    </ul>
                </div>
                <div className={style.inputBox}>
                    <form id="msg">
                        <input ref={inputBox} className={style.inputForm} placeholder="메세지를 입력하세요" onChange={handleMessageInput} required type="text"/>
                        <button className={style.sendBtn} onClick={handleMessageSubmit}>SEND</button>
                    </form>
                </div>
            </div>
        </div>
        </>
    );
};

export default Chat;