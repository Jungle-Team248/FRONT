import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { socket } from '../script/socket';
import style from './css/GameRoom.module.css';
import { useNavigate } from 'react-router-dom';

const GameRoom = ({socketConnected}) => {
    const [ rooms, setRooms ] = useState(null);     // 게임 방들의 배열
    const [ joinFail, setJoinFail ] = useState(0);  // 입장 실패시 값을 +1, 변경 발생시 게임 방 목록을 reload 함

    // 소켓 연결되면 roomList 받아오서 세팅
    useEffect(() => {
        if (socketConnected) {
            socket.emit('roomList', (games) => {
                if (games.length) {
                    setRooms(games);
                }
            });
        }
    }, [socketConnected]);
    
    // 입장 실패하면 서버로부터 새로 리스트 받아오기
    useEffect(() => {
        if ( joinFail ) {
            socket.emit('roomList', (games) => {
                if (games.length) {
                    setRooms(games);
                }
            });
        }
    }, [ joinFail ]);

    return (
        <div className={style.gameRoomBox}>
            <div className={style.gameRoomList}>

                {
                    rooms?
                    rooms.map((room) => {
                        return <SingleGameRoom status={room.joinable} hostId={room.host} count={room.playerCnt} roomId={room.gameId}  joinFail={{state: joinFail, set: setJoinFail}}/>
                    })
                    :
                    <h3 style={{color: "#ffffff", fontSize: "35px", fontWeight: "550"}}>현재 생성된 방이 없습니다.</h3>
                }

            </div>
        </div>
    );
}

const SingleGameRoom = ({status, hostId, count, roomId, joinFail}) => {
    const myId = useSelector(state => state.user.id);
    const navigate = useNavigate();

    // 방 클릭 시 join 시도. 실패시 reload 위해 joinFail의 값 변경
    const joinRoom = (roomId) => {
        socket.emit("joinGame", {gameId : roomId, userId : myId}, (thisGameId) => {
            // join 성공한 경우 넘겨준 gameId가 돌아옴. 실패한 경우 false가 돌아옴
            if (thisGameId) {
                navigate(`/ingame/${thisGameId}`, {state: {fromLobby: true}});
            } else {
                joinFail.set(joinFail.state + 1);
                alert('게임에 입장이 불가합니다. 다른 방으로 참여해주세요!');
                // 입장에 실패한 경우 부모컴포넌트의 joinFail을 +1된 값으로 변경, list를 다시 불러옴
            }
        });
    };

    return (
        <div className={style.singleGameRoom} onClick={(e)=>{e.preventDefault();joinRoom(roomId);}}>
            {/* room status */}
            <div className={style.gameRoomStatus}> {status? "wait": "full"} </div>
            {/* room Name */}
            <div className={style.gameRoomName}> {hostId}의 마피아르떼 </div>
            {/* curr player / max player */}
            <div className={style.gamePlayerCnt}> {count}/6 </div>
        </div>
    );
}

export default GameRoom;