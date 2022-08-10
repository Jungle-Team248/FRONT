import React, { useDeferredValue } from 'react';
import { useState } from 'react';
import { Button, Form, FloatingLabel } from 'react-bootstrap';
// import styled from 'styled-components';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { paddr, reqHeaders } from '../proxyAddr';
import { setUserId } from '../store';
import { useDispatch, useSelector } from 'react-redux';
import { NotRequireAuth } from '../script/auth';

// Login 컴포넌트 - Jack
const Login = () => {
    const [id, setId] = useState("");                       // id 입력 저장
    const [lableId, setLableId] = useState("ID");           // id 입력칸 lable 저장
    const [pw, setPw] = useState("");                       // pw 입력 저장
    const [lablePw, setLablePw] = useState("PASSWORD");     // pw 입력칸 lable 저장
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const location = useLocation();
    
    // Login Submit
    const onSubmit = (e) => {
        e.preventDefault();
        axios.post(`${paddr}api/auth/login`, {userid: id, password: pw}, reqHeaders)
            .then( (res)=>{
                if (res.data === 'success') {
                    // dispatch(setUserId(userId));          // login 정보 redux에 저장
                    navigate("/lobby");      // 접근했던 페이지 또는 로비로 이동
                } else if (res.data === 'INVALID_ID') {
                    setLableId('ID : 유효하지 않은 ID 입니다');
                } else if (res.data === 'INVALID_PW') {
                    setLableId('ID');
                    setLablePw('PASSWORD : 유효하지 않은 PASSWORD 입니다');
                }
            });
    };

    // NotRequireAuth - 서버에 로그인이 되어있는지 확인 후 로그인 되어있으면 lobby로 이동, 안되어있는 경우에만 로그인 화면 띄움
    return (
        <NotRequireAuth>
            <Form onSubmit={onSubmit}>
                <FloatingLabel
                    controlId="floatingInput"
                    label={lableId}
                    className="mb-3"
                    style={{width: "500px", margin: "auto"}}
                >
                    <Form.Control type="userid" placeholder="ID" onChange={(e) => setId(e.target.value)} required autoFocus/>
                </FloatingLabel>

                <FloatingLabel
                    controlId="floatingPassword"
                    label={lablePw}
                    className="mb-3"
                    style={{width: "500px", margin: "auto"}}
                >
                    <Form.Control type="password" placeholder="PW" onChange={(e) => setPw(e.target.value)} required/>
                </FloatingLabel>
                <Button variant="light" type="submit" style={{display:'none'}} />
            </Form>
        </NotRequireAuth>
    );
}

export default Login;