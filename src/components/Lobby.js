import React, { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import Rank from './Rank';
import Citizen from './Citizen';
import Setting from './Setting';
import axios from 'axios';
import { paddr, reqHeaders } from '../proxyAddr';
import { FriendInfoSet, FriendInfoChange, FriendInfoReset } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import connectSocket, {socket} from '../script/socket';
import style from '../css/Lobby.module.css';
import { InvitationCard } from '../subitems/InvitationCard';
import { InviteCard } from '../subitems/InviteCard';

const Lobby = () => {

    const myId = useSelector(state => state.user.id);
    const profile_img = useSelector(state => state.user.profile_img);
    const dispatch = useDispatch();
    const navigate = useNavigate();
    let [choose, choosestate] = useState(false);   // 초대할 사람 고르는 모달 생성
    let [invite, invitestate] = useState(false);   // 초대 알람 모달 생성
    let [newRoomId,roomidstate] = useState(0);
    let [sender, senderstate] = useState("");
    const firstFriends = Object.entries(useSelector((FriendInfo) => FriendInfo.FriendInfo));
    const friends = [];

    // 현재 접속 중인 친구만 friends 리스트에 넣어주기
    for (var i = 0; i < firstFriends.length; i++){
        if (firstFriends[i][1] === 1 && firstFriends[i][0] != myId) {
            friends.push(firstFriends[i][0]);
        }
    }

    // console.log('리덕스 친구리스트', friends);

    // START 버튼 - 랜덤 매칭 
    const btnStart = () => {
        // socket && socket.emit("checkEnterableRoom", (roomNumber)=>{navigate(`/ingame/${roomNumber}`);});
        /*** gamemode hyeRexx ***/
        socket && socket.emit("joinGame", {gameId : 0, userId : myId}, (thisGameId) => {
            // console.log("__debug : get this game id? :", thisGameId);
            if (!thisGameId) {
                window.location.reload();
            }
            navigate(`/ingame/${thisGameId}`, {state: {fromLobby: true}});
        });
    };

    // MAKE A GAME 버튼 - HOST가 되어 게임방 생성
    const btnMake = () => {
    
        // 친구 리스트 상태 변경 -> 필요 없는 듯?
        // console.log(`choosestate 상태 ${choose}`)
        // console.log(`MAKE A GAME 눌렀을 때 친구 리스트 ${friends}`);
        // 초대할 사람 고르기
        choosestate(true);
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

    const btnLogout = ()=>{
        axios.post(`${paddr}api/auth/logout`, null, reqHeaders).finally(()=>{
            socket.emit('loginoutAlert', myId, 0);
            // dispatch(setUserId(""));
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

        // 소켓 연결 및 초기화
        if (!socket || !socket['connected']) {
            connectSocket().then(() => {
                socket.on("friendList", (userid, status) => {
                    // console.log("friend수정확인",userid, status);
                    if (userid === myId) {
                        (status === 0) && (()=>{
                            socket.close();
                            navigate('/');
                        })();
                    } else {
                        dispatch(FriendInfoChange([userid, status]));
                    }
                });

                socket.emit("userinfo", myId);
                socket.emit('loginoutAlert', myId, 1);
                // console.log('login 변경사항 확인');
                // console.log(socket);
                // console.log('connectsocket test: ', socket['connected']);
    
                socket.on("getinvite", (roomId, myId)=> {
                        // console.log('초대장을 받았습니다!');
                        
                        roomidstate(roomId);
                        senderstate(myId);
    
                        // 모달창 띄워주기
                        invitestate(true);
                    });
            });
        } else {
            socket.on("friendList", (userid, status) => {
                // console.log("friend수정확인",userid, status);
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
                // console.log('초대장을 받았습니다!');
                roomidstate(roomId);
                senderstate(myId);

                // 모달창 띄워주기
                invitestate(true);
            });
        }


        axios.post(`${paddr}api/lobby/friendinfo`, {userid: myId}, reqHeaders)
        .then((res) => {
            let friList = res.data[0]; // user의 전체 친구 목록
            let onlineList = res.data[1]; // 현재 접속중인 user 목록
            // console.log(friList);
            // console.log('onlinelist', onlineList);
            for (var i = 0; i < Object.keys(friList).length; i++){
                let key = friList[i].userid;
                if (!onlineList[key]){
                    dispatch(FriendInfoSet([key, 0]));
                } else {
                    dispatch(FriendInfoSet([key, 1]));
                }
            }
        })
        .catch((e) => {
            console.log(e);
        });

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
                            {/* imgURL 갈아야 함 */}
                            {/* <img src={profile_img} className={style.test}/> */}
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

                <div className={style.MainLobbyContent}>
                    
                    <div className={style.MainLobbyTap}>
                    
                        {/* <button id="rank" className={style.TapButton} onClick={() => {tapChange(0)}}>RANKING</button>
                        <button id="citizen" className={style.TapButton} onClick={() => {tapChange(1)}}>CITIZEN</button>
                        <button id="citizen" className={style.TapButton} onClick={() => {tapChange(2)}}>Setting</button> */}
                        <Link to="/lobby/">
                            <button className={style.utilityBtn} id="rank">RANKING</button>
                        </Link>
                        <Link to="/lobby/citizen">
                            <button className={style.utilityBtn} id="citizen">CITIZEN</button>
                        </Link>
                        <Link to="/lobby/setting">
                            <button className={style.utilityBtn} id="setting">SETTING</button>
                        </Link>
                        <button className={style.utilityBtn} id="logout" onClick={btnLogout}>LOGOUT</button>
                    
                    </div>

                    <div className={style.MainLobbyTapContents}>
                        
                        <Routes>
                            <Route path="/" element={<Rank/>}/>
                            <Route path="citizen" element={<Citizen/>}/>
                            <Route path="setting" element={<Setting/>}/>
                        </Routes>
                    </div>
                        
                </div>
                
                {/*side*/}
                {/* <div className={style.rank}></div> */}
            </div>

            {/* 친구 초대 모달 */}
            { choose === true ? <InviteCard sender={sender} friends={friends} choose={choose} 
            className={style.inviteModal} btnClose={btnClose} /> : null }
            {/* 초대 받은 모달 */}
            { invite === true ? <InvitationCard myId={myId} sender={sender} roomId={newRoomId} className={style.inviteModal} 
                btnInviteClose={btnInviteClose} /> : null }
        </div>
        </>
    );
 
}

export default Lobby;
