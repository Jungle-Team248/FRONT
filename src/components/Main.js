import {React, useEffect, useState} from 'react';
import { Howl } from 'howler';
import Login from './Login';
import Join from './Join';
// import 'bootstrap/dist/css/bootstrap.min.css';
import style from "../css/Main.module.css";
import Birds from "../subitems/Birds";
import BGM from "../bgm/main_culture.mp3";
import CROW from "../bgm/crow_effect.MP3";


const Main = () => {
    const [login, setLogin] = useState(false);
    const [join, setJoin] = useState(false);

    const flipLogin = () => {
        setLogin(!login);
    }
    const flipJoin = () => {
        setJoin(!join);
    }

    const useSound = (src, volume = 1, fadeoutTime = 0) => {
        let sound;
        const soundStop = () => sound.stop();
        const soundPlay = (src) => {
            sound = new Howl({ src });
            sound.volume(volume);
            sound.loop(true);
            sound.play();
        }
    
        useEffect(() => {
            soundPlay(src);
            sound.on('play', () => {
                const fadeouttime = fadeoutTime;
                setTimeout(() => sound.fade(volume, 0, fadeouttime), (sound.duration() - sound.seek()) * 1000 - fadeouttime);
            });
            return soundStop;
        }, []);
    }
    
    const effectSound = (src, volume = 1) => {
        let sound;
        const soundInject = (src) => {
            sound = new Howl({ src });
            sound.volume(volume);
        }
        soundInject(src);
        return sound;
    }

    const crowEffect = effectSound(CROW, 1);
    
    useSound(BGM, 1, 20000);
    
    useEffect(() => {
        const crowS = setInterval(()=>{
            crowEffect.play();
        }, 8000);
        return() => clearInterval(crowS);
    }, []);

    return (
        <>
        <div className={style.Main}>
            <div className={style.mainBtns}> 
                {login ? <></> : <MainBtns flipLogin={flipLogin} flipJoin={flipJoin}/>}
                {login ? <Login/> : null}
                {join ? <Join/> : null}
            </div>
        </div>
        <Birds/>
        <div className={style.windowFrame}></div>
        <div className={style.window1}></div>
        <div className={style.window2}></div>
        </>
    );
}

const MainBtns = (props) => {

    const btnLogin = () => {
        props.flipLogin();
    }

    const btnJoin = () => {
        props.flipJoin();
    }
    
    return (
        <>
            <button className={style.mainBtn} id="join" onClick={btnJoin}>JOIN</button>
            <button className={style.mainBtn} id="login" onClick={btnLogin}>LOGIN</button>
            
        </>
    );
}

export default Main;