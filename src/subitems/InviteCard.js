import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import CloseBtn from './CloseBtn';
import style from './css/InviteCard.module.css';
import { useNavigate } from 'react-router-dom';
import {socket} from '../script/socket';

const InviteCard = (props) => {
    const navigate = useNavigate();
    const [show, setShow] = useState(true);
    const handleClose = () => {setShow(false); props.btnClose();};

    const FriendInfo = useSelector((FriendInfo) => FriendInfo.FriendInfo);
    const Friends = Object.keys(FriendInfo);

    // MAKE A GAME 버튼 - 초대 보내는 버튼
    const btnSend = () => {
        var friendLength = document.getElementsByName("friends").length;

        // 초대 userid 리스트
        let listuserid = new Array();

        for (var i=0; i<friendLength; i++){
            if (document.getElementsByName("friends")[i].checked == true){
                listuserid.push(document.getElementsByName("friends")[i].value);
            }
        }
        

        // 초대 인원 제한 (추후 주석 제거 하기)
        if (listuserid.length == 0) {
            alert("최소 1명 이상의 친구를 초대해주세요!");
            return;
        }
        // if (listuserid.length <= 2) {
        //     alert("최소 3명 이상의 친구를 초대해주세요!");
        //     return;
        // } else if (listuserid.length > 7) {
        //     alert("최대 7명 이하의 친구를 초대해주세요!");
        //     return;
        // } 

        socket.emit("listuserinfo", listuserid, (listsocketid) => {
            // console.log(`초대하고 싶은 사람의 socketid 리스트 ${listsocketid}`);

            let roomId = + new Date();

            // 게임 생성
            socket.emit("makeGame", {gameId : roomId, userId : props.sender}, (thisGameId)=> {
                if (!thisGameId) {
                    alert("session이 만료되어 페이지를 새로고침합니다.");
                    window.location.reload();
                } else {
                    console.log("게임 생성 완료");
                }
            });

            // 초대장 전송
            socket.emit("sendinvite", listsocketid, roomId, props.sender,(roomId)=> {
                // HOST가 방으로 이동
                navigate(`/ingame/${roomId}`, {state: {fromLobby: true}});
            });
            
        });
    }

    return (
            <div className={style.InviteCard} show={show} onHide={handleClose}>
                <div className={style.InviteClose} onClick={handleClose}><CloseBtn/></div>
                <div className={style.inviteTitle}>INVITE</div>

                <div className={style.searchBox}>
                    <input className={style.searchInput} placeholder="친구 아이디를 입력하세요"/>
                    <input className={style.submitInput} type="submit"/>
                </div>

                 {/* design : input-label set, set의 요소별 id는 개별 아이디로 일치해야 함 */}
                 <div className={style.myCitizen}>
                     <li className={style.checkList}>
                     {
                        Friends.length > 0 ? 
                        Friends.filter(id => FriendInfo[id][0]).map((friendId, index) => (
                            <>
                                <input className={style.checkInput} type="checkbox" name="friends" id={index} value={friendId} key={friendId}/>
                                <label className={style.checkLabel} for={index}>{friendId}</label>
                            </>))
                        : <h3 style={{color:"white"}}>현재 접속 중인 친구가 없습니다</h3>
                    }
                    </li>
                </div>
                <div className={style.makeGameWith}>
                    {
                        <button className={`${style.GameBtn} ${style.makeBtn}`} onClick={btnSend}><span>MAKE A GAME</span></button>
                    }
                </div>
            </div>
    );
};

export {InviteCard};