import React from 'react';
import { Routes, Route, Link, useNavigate, useInRouterContext } from 'react-router-dom';
import styled from 'styled-components';
import Rank from './Rank';
import Citizen from './Citizen';
import Setting from './Setting';
import axios from 'axios';
import { setUserId } from '../store';
import { useDispatch } from 'react-redux';

const Lobby = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const btnStart = () => {
        navigate("/ingame");
        console.log("start button");
    };
    const btnMake = () => {
        console.log("make button");
    };
    const btnLogout = ()=>{
        axios.post('/api/auth/logout').finally(()=>{
            dispatch(setUserId(""));
            sessionStorage.removeItem('userid');
            navigate('/');
        });
    };
    return (
        <div id="lobby" style={{padding:"2em"}}>
            여기는 로비
            <Left>
                <BigButton id="start" onClick={btnStart}>START</BigButton>
                <BigButton id="make" onClick={btnMake}>MAKE A GAME</BigButton>
            </Left>
            <Right>
                <div className='rightup'>
                    <Link to="/lobby/">
                        <SmallButton id="rank">RANKING</SmallButton>
                    </Link>
                    <Link to="/lobby/citizen">
                        <SmallButton id="citizen">CITIZEN</SmallButton>
                    </Link>
                    <Link to="/lobby/setting">
                        <SmallButton id="setting">SETTING</SmallButton>
                    </Link>
                    <SmallButton id="logout" onClick={btnLogout}>LOGOUT</SmallButton>
                </div>
                <div className='rightdn'>
                    <Routes>
                        <Route path="/" element={<Rank/>}/>
                        <Route path="citizen" element={<Citizen/>}/>
                        <Route path="setting" element={<Setting/>}/>
                    </Routes>
                </div>
            </Right>
        </div>
    );
}

const Left = styled.div`
    position: fixed;
    width: 30%;

`

const Right = styled.div`
    position: fixed;
    left: 250px;
`

const BigButton = styled.button`
    padding: 1rem;
    color: black;
    border: 1px solid black;
`

const SmallButton = styled.button`
    padding: 1rem;
    color: black;
    border: 1px solid black;
`

export default Lobby;