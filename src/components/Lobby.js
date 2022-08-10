import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { paddr, reqHeaders } from '../proxyAddr';
import { FriendInfoSet, FriendInfoChange, FriendInfoReset } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import connectSocket, {socket} from '../script/socket';
import style from '../css/Lobby.module.css';
import { InvitationCard } from '../subitems/InvitationCard';
import { InviteCard } from '../subitems/InviteCard';
import MyFriend, {FriendAddModal} from '../subitems/MyFriend';
import GameRoom from '../subitems/GameRoom';

const Lobby = () => {
    const myId = useSelector(state => state.user.id);                       
    const profile_img = useSelector(state => state.user.profile_img);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    let [choose, choosestate] = useState(false);                        // Make a Game으로 방 생성 시 초대할 사람 고르는 모달 표시
    let [invite, invitestate] = useState(false);                        // 초대 알람 모달 표시
    const [ friendAddModal, showFriendAddModal ] = useState(false);     // 친구 추가 모달 표시
    let [newRoomId,roomidstate] = useState(0);
    const [ socketConnected, setSocketConnected ] = useState(false);    // 소켓 연결 상태
    let [sender, senderstate] = useState("");                           // 초대를 보낸 사람의 id

    // START 버튼 - 빈 방으로 자동 입장
    const btnStart = () => {
        /*** gamemode hyeRexx ***/
        socket && socket.emit("joinGame", {gameId : 0, userId : myId}, (thisGameId) => {
            if (!thisGameId) {
                window.location.reload();
            }
            navigate(`/ingame/${thisGameId}`, {state: {fromLobby: true}});
        });
    };

    // MAKE A GAME 버튼 - HOST가 되어 게임방 생성
    const btnMake = () => {
        // 초대할 사람 고르는 모달 띄움
        choosestate(true);
        invitestate(false);
        showFriendAddModal(false);
        // 초대자 state 변경
        senderstate(myId);
    };

    // MAKE A GAME 버튼 - Close 클릭 시 상태 변경
    const btnClose = () => {
        choosestate(false); 
    };

    // INVITATION 버튼 - Close 클릭 시 상태 변경
    const btnInviteClose = () => {
        invitestate(false); 
    };

    // 로그아웃 버튼 클릭시 서버로 logout 요청
    const btnLogout = ()=>{
        axios.post(`${paddr}api/auth/logout`, null, reqHeaders).finally(()=>{
            // 로그아웃 성공 시 다른 유저에게 로그아웃 알림 보내고 소켓 연결 중단, 메인으로 이동
            socket.emit('loginoutAlert', myId, 0);
            dispatch(FriendInfoReset());
            socket.close();
            navigate('/');
        });
    };

    useEffect(() => {
        // 뒤로가기 방지
        const preventBack = () => history.pushState(null, "", location.href);
        history.pushState(null, "", location.href);
        window.addEventListener("popstate", preventBack);

        // 소켓 연결이 안되어있을 시 연결 및 초기화
        if (!socket || !socket['connected']) {
            connectSocket().then(() => {
                // 소켓 연결상태를 state에 반영하여 자식 컴포넌트에서 소켓 연결 관련 처리 할 수 있도록 함
                setSocketConnected(true);

                // 친구 목록 변경사항 발생에 관한 event 발생시 redux에 변경사항 반영
                socket.on("friendList", (userid, status) => {
                    if (userid === myId) {
                        (status === 0) && (()=>{
                            socket.close();
                            navigate('/');
                        })();
                    } else {
                        dispatch(FriendInfoChange([userid, status]));
                    }
                });

                // 초대메세지 수신할 수 있도록 세팅
                socket.on("getinvite", (roomId, myId)=> {
                        
                        roomidstate(roomId);
                        senderstate(myId);
    
                        // 모달창 띄워주기
                        invitestate(true);
                        showFriendAddModal(false);
                        choosestate(false);
                });

                // 서버에 접속정보 반영요청, 유저들에게 login 했음을 알림
                socket.emit("userinfo", myId);
                socket.emit('loginoutAlert', myId, 1);

            });
        } else {
            // 소켓이 이미 연결되어있는 경우(인게임에서 로비로 돌아온 경우) 친구 목록 갱신과 초대메세지 수신 가능하도록 처리
            setSocketConnected(true);
            socket.on("friendList", (userid, status) => {
                if (userid === myId) {
                    (status === 0) && (()=>{
                        socket.close();
                        navigate('/');
                    })();
                } else {
                    dispatch(FriendInfoChange([userid, status]));
                }
            });

            socket.on("getinvite", (roomId, myId)=> {
                roomidstate(roomId);
                senderstate(myId);

                // 모달창 띄워주기
                invitestate(true);
                showFriendAddModal(false);
                choosestate(false);
            });
        }

        // 친구 목록을 받아와 redux에 세팅
        axios.post(`${paddr}api/lobby/friendinfo`, {userid: myId}, reqHeaders)
        .then((res) => {
            let friendList = res.data;
            dispatch(FriendInfoSet(friendList));
        })
        .catch((e) => {
            console.log(e);
        });

        // clean up. unmount시 등록했던 eventlistener 초기화
        return () => {
            window.removeEventListener("popstate", preventBack);
            socket.off("friendList");
            socket.off("getinvite");
        }
    }, []);

    return (
        <>
        <div id="lobby" style={{position: 'relative'}}>
            <div className={style.mainLobby}>
                <div className={style.lobbyleft}>
                    <div className={style.profileSection}>
                        <img className={style.lobbyLogo} src='/img/smallLogo.png'></img>
                        <div className={style.prifileImg}>
                            <img src={profile_img} className={style.realProfileImg}/>
                        </div>

                        <div className={style.nickname}>
                            {myId}
                        </div>
                    </div>

                    <div className={style.lobbyGameBtns}>
                        <button className={`${style.GameBtn} ${style.startBtn}`} onClick={btnStart}><span>GAME START</span></button>
                        <button className={`${style.GameBtn} ${style.makeBtn}`} onClick={btnMake}><span>MAKE A GAME</span></button>
                    </div>

                </div>

                <div className={style.lobbyMiddle}> 
                    <MyFriend showFriendAddModal={showFriendAddModal} choosestate={choosestate} invitestate={invitestate}/>
                </div>

                <div className={style.lobbyRight}>
                    <div className={style.MainLobbyTap}>
                        <span className={style.roomTitle}>room list</span>
                        <button className={style.utilityBtn} id="logout" onClick={btnLogout}>LOGOUT</button>
                    </div>
                    <GameRoom socketConnected={socketConnected}/>
                </div>

            </div>

            {/* 친구 초대 모달 */}
            { choose === true ? <InviteCard sender={sender} choose={choose} 
            className={style.inviteModal} btnClose={btnClose} /> : null }
            {/* 초대 받은 모달 */}
            { invite === true ? <InvitationCard myId={myId} sender={sender} roomId={newRoomId} className={style.inviteModal} 
                btnInviteClose={btnInviteClose} /> : null }
            {/* 친구 추가 모달 */}
            { friendAddModal? <FriendAddModal showFriendAddModal={showFriendAddModal}/> : null }
        </div>
        </>
    );
 
}

export default Lobby;
