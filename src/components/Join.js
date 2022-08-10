/* join */
import {React, useState, useEffect} from 'react';
import axios from 'axios';
import {paddr, reqHeaders} from '../proxyAddr';

import 'bootstrap/dist/css/bootstrap.min.css';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';

import style from "../css/Join.module.css"

const Join = () => {
    const [show, setShow] = useState(true);
    const handleClose = () => setShow(false);

    const [id, setId] = useState('');
    const [pass, setPass] = useState('');
    const [passCheck, setPassCheck] = useState('');
    const [nickname, setNickname] = useState('');
    const [email, setEmail] = useState('');

    // for check Validity
    const [cId, setCId] = useState(false);
    const [cPass, setCPass] = useState(false);
    const [cPassCheck, setCPassCheck] = useState(false);
    const [cNickname, setCNickname] = useState(false);
    const [cEmail, setCEmail] = useState(false);

    // for error message
    const [eId, setEId] = useState('')
    const [ePass, setEPass] = useState('')
    const [ePassCheck, setEPassCheck] = useState('')
    const [eNickname, setENickname] = useState('')
    const [eEmail, setEEmail] = useState('')
    
    // submit > post + 중복 검사
    const handleOnSubmit = async () => {
        if (cId && cPass && cPassCheck && cNickname && cEmail){
            try {
                await axios.post(`${paddr}api/auth/user/join`, {
                    id: id,
                    pass: pass,
                    nickname: nickname,
                    email: email
                }, reqHeaders)
                .then((res) => {
                    const data = res.data
                    if (data.result) {
                        alert("가입이 완료되었습니다. 지금 바로 Mafia가 되어 보세요!")
                        handleClose()
                    } else {
                        if (!data.idCheck) { setEId('이미 가입되어 있는 아이디입니다. 다른 아이디를 입력하세요.')}
                        if (!data.nickCheck) {setENickname('이미 사용하고 있는 닉네임입니다. 다른 닉네임을 입력하세요.')}
                        if (!data.emailCheck) {setEEmail('이미 사용하고 있는 이메일 주소입니다. 다른 이메일을 입력하세요.')}
                    }
                })
            } catch (e) {
                console.log(e);
            }
        }
    }

    // 유효성 검사 : id, pass, passcheck(일치), nickname, 
    useEffect (() => {
        const idRegex = /^(?=.*[a-zA-Z0-9-_]).{4,16}$/
        // idRegex.test(id) ? setCId(true) : setCId(false)
        if (!idRegex.test(id)) {
            setEId('4~16 자리의 영문자 또는 숫자를 입력하세요.')
            setCId(false)
        } else {
            setEId('')
            setCId(true)
        }
    }, [id])
    
    useEffect (() => {
        const passwordRegex = /^(?=.*[a-zA-Z0-9]).{3,25}$/
        // const passwordRegex = /^(?=.*[a-zA-Z]*[!@#$%^*+=-]*[0-9]).{8,25}$/
        if (!passwordRegex.test(pass)) {
            setEPass('3자리 이상은 성의')
            // setEPass('숫자와 영문자, 특수문자를 조합해 8자리 이상 입력하세요.')
            setCPass(false)

        } else {
            setCPass(true)
            setEPass('')
        }
    }, [pass])

    useEffect(() => {
        if (!(pass === passCheck)) {
            setEPassCheck('비밀번호가 일치하지 않습니다.')
            setCPassCheck(false)
        } else {
            setEPassCheck('')
            setCPassCheck(true)
        }
    }, [pass, passCheck])

    useEffect (() => {
        const nickRegex = /^(?=.*[가-힣a-zA-z0-9]).{4,8}$/

        if (!nickRegex.test(nickname)) {
            setENickname('4~8자리의 한글이나 영문자, 숫자를 입력하세요.')
            setCNickname(false)
        } else {
            setENickname('')
            setCNickname(true)
        }
    }, [nickname])

    useEffect (() => {
        const emailRegex = /([\w-.]+)@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.)|(([\w-]+\.)+))([a-zA-Z]{2,4}|[0-9]{1,3})(\]?)$/
        
        if (emailRegex.test(email)) {
            setEEmail('')
            setCEmail(true)
        } else {
            setEEmail('이메일 형식이 올바르지 않습니다.')
            setCEmail(false)
        }
    }, [email])


    return (
        <div id={style.Join}>
            <Modal className={style.modal} show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title id={style.modalTitle}>Sign up</Modal.Title>
            </Modal.Header>
            <Modal.Body className={style.modalBody}>
            <Form>
                <Form.Group className={style.mb3} style={{marginTop : 10}}>
                    <Form.Label className={style.label} >아이디</Form.Label>
                    <Form.Control 
                        className={style.joinForm} 
                        placeholder="아이디를 입력하세요" 
                        autoFocus 
                        onChange={(e) => setId(e.target.value)}
                    />
                    { id.length > 0 ? 
                        <span className={style.errMsg}> {eId} </span> : 
                        null }
                </Form.Group>

                <Form.Group className={style.mb3}>
                    <Form.Label className={style.label}>비밀번호</Form.Label>
                    <Form.Control
                        type="password"
                        className={style.joinForm} 
                        placeholder="비밀번호를 입력하세요" 
                        autoFocus 
                        onChange={(e) => setPass(e.target.value)}
                    />
                    <Form.Control 
                        type="password"
                        className={style.joinForm} 
                        placeholder="비밀번호를 한번 더 입력하세요" 
                        autoFocus 
                        onChange={(e) => setPassCheck(e.target.value)}
                        
                    />
                    { pass.length > 0 && !cPass ? 
                        <span className={style.errMsg}> {ePass} </span> : 
                        null }
                    { passCheck.length && cPass ? 
                        <span className={style.errMsg}> {ePassCheck} </span> : 
                        null }
                </Form.Group>

                <Form.Group className={style.mb3}>
                    <Form.Label className={style.label}>닉네임</Form.Label>
                    <Form.Control 
                        className={style.joinForm} 
                        placeholder="닉네임을 입력하세요" 
                        autoFocus 
                        onChange={(e) => {setNickname(e.target.value);}}
                        />
                    { nickname.length > 0 ? 
                        <span className={style.errMsg}> {eNickname} </span> : 
                        null }
                </Form.Group>

                <Form.Group className={style.mb3}>
                    <Form.Label className={style.label}>이메일</Form.Label>
                    <Form.Control 
                        className={style.joinForm} 
                        placeholder="이메일을 입력하세요" 
                        autoFocus 
                        onChange={(e) => {setEmail(e.target.value);}}
                        />
                    { email.length > 0 ? 
                        <span className={style.errMsg}> {eEmail} </span> : 
                        null }
                </Form.Group>

            </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="cancle" onClick={handleClose}> 취소 </Button>
                <Button variant="primary" onClick={handleOnSubmit}> 회원가입 </Button>
            </Modal.Footer>
            </Modal>
        </div>
    );
}


export default Join;
