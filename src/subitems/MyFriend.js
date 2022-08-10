import axios from 'axios';
import { paddr, reqHeaders } from '../proxyAddr';
import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import style from './css/MyFriend.module.css';
import CloseBtn from './CloseBtn';
import { FriendInfoDelete } from '../store';

const MyFriend = ({showFriendAddModal, choosestate, invitestate}) => {
    const dispatch = useDispatch();
    const myId = useSelector(state => state.user.id);
    const FriendInfo = useSelector((FriendInfo) => FriendInfo.FriendInfo);
    const Friends = Object.keys(FriendInfo);
    
    const handleAddButton = (e) => {
        e.preventDefault();
        showFriendAddModal(true);
        choosestate(false);
        invitestate(false);
    }

    const FriendDelete = (id) => {
        axios.post(`${paddr}api/lobby/friendDel`, {delid: id, userid: myId}, reqHeaders)
        .then((res) => {
            if (res.data == "SUCCESS"){
                dispatch(FriendInfoDelete(id));
            }
        })
        .catch((e) => {
            console.log(e);
        });
    }

    return (
        <div className={style.friendBox}>
            <div className={style.friendTitle}> my friend </div>

            <div className={style.searchBox}>
                <input className={style.searchInput} placeholder="아이디를 입력하세요"/>
                <input className={style.submitInput} type="submit"/>
            </div>

            <div className={style.friendList}>
                <div className={style.singleFriendBox}>
                    {Friends.length ? <> {Friends.map((id)=> {
                        return (
                            <div className={style.singleFriend}>
                                <div className={`${FriendInfo[id][0] ? style.friendOn: style.friendOff}`}></div>
                                {/* for jinho : img src에 profile img 넣어 주세요 */}
                                <img src={`/img/${FriendInfo[id][1]}`} className={style.friendProfile}></img>
                                <div className={style.friendId}>{id}</div>
                                <div className={style.deleteFriend} style={{color : "white"}} onClick={() => {FriendDelete(id)}}></div>
                            </div>
                        );
                    })} </> : <h2 style={{color : "white"}}> 친구를 추가해주세요. </h2>}

                    {/* for jinho : sigleFriend 블럭이 하나의 리스트가 됨 */}

                </div>
            </div>

            <div className={style.addNewFriend}>
                <button className={style.friendAddBtn} onClick={handleAddButton}>
                    <span className={style.addText}>ADD</span>    
                    <span className={style.addIco}></span>
                </button>
            </div>
        </div>
    )
}

const FriendAddModal = ({showFriendAddModal}) => {
    const [ show, setShow ] = useState(true);
    const [ inputText, setInputText ] = useState("");
    const handleClose = (e) => {
        e?.preventDefault();
        setShow(false);
        showFriendAddModal(false);
    };

    // MAKE A GAME 버튼 - 초대 보내는 버튼
    const handleAddBtn = (e) => {
        e.preventDefault();
        if (inputText !== "" && inputText.length >= 4) {
            axios.post(`${paddr}api/lobby/addfriend`, {userid: inputText}, reqHeaders).then(res => {
                if (res.data === "SUCCESS") {
                    alert(`${inputText} 님이 친구로 추가되었습니다`);
                    window.location.reload();
                } else if (res.data === "INVALID_USER") {
                    alert(`존재하지 않는 유저입니다.`);
                } else if (res.data === "ALREADY_EXIST") {
                    alert(`${inputText} 님은 이미 친구로 등록되어있습니다`);
                }
            }).catch(err => console.log(err));
        }
    };

    return (
            <div className={style.FriendAddModal} show={show} onHide={handleClose}>
                <div className={style.FriendAddModalClose} onClick={handleClose}><CloseBtn/></div>
                <div className={style.FriendAddModalTitle}>ADD FRIEND</div>

                <div className={style.inputBox}>
                    <input className={style.input} onChange={(e)=>{setInputText(e.target.value)}} placeholder="친구 아이디를 입력하세요"/>
                </div>
                <div className={style.addNewFriend} style={{position: "absolute", right: "20px", top: "100px"}}>
                    <button className={style.friendAddBtn} onClick={handleAddBtn}>
                    <span className={style.addText}>ADD</span>    
                    <span className={style.addIco}></span>
                </button>
            </div>
            </div>
    );
};

export default MyFriend
export {FriendAddModal};