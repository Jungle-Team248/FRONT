import React, { useState } from 'react';
import style from './css/InvitationCard.module.css';
import { useNavigate } from 'react-router-dom';
import {socket} from '../script/socket';

const InvitationCard = (props) => {
    const navigate = useNavigate();
    const [show, setShow] = useState(true);
    const handleClose = () => {setShow(false); props.btnInviteClose();};

    const inviteMove = () => {
        // 게임 조인
        socket.emit("joinGame", {gameId : props.roomId, userId : props.myId}, (thisGameId) => {
            // join 성공한 경우 넘겨준 gameId가 돌아옴. 실패한 경우 false가 돌아옴
            if (thisGameId) {
                navigate(`/ingame/${thisGameId}`, {state: {fromLobby: true}});
            } else {
                alert('게임에 입장이 불가합니다. 다른 방으로 참여해주세요!');
            }
        });
    }
    return (
            <div className={style.invitationBox}>
                <div className={style.rollLine}>
                    <span className={style.line1}>CONFIDENTIAL</span>
                    <span className={style.line2}>MAFIARTE</span>
                    <span className={style.line3}>CONFIDENTIAL</span>
                </div>
                <div className={style.invitationInfo}>
                    {props.sender}에게 초대받았습니다<br/>
                    게임에 참가하시겠습니까?
                </div>
                <div className={style.invitationBtnBox}>
                    <button className={`${style.invitationBtn} ${style.reject}`} onClick={handleClose}>거절하기</button>
                    <button className={style.invitationBtn} onClick={inviteMove}>참가하기</button>
                </div>
            </div>
    );
};

export {InvitationCard};