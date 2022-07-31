import React, { useState } from 'react';
import style from './css/EmojiBox.module.css'
import {socket} from '../script/socket';

import lovePng from '../images/love.png';
import loveGif from '../images/love.gif';
import lolPng from '../images/lol.png';
import lolGif from '../images/lol.gif';
import tonguePng from '../images/tongue.png';
import tongueGif from '../images/tongue.gif';
import winkPng from '../images/wink.png';
import winkGif from '../images/wink.gif';
import confusedPng from '../images/confused.png';
import confusedGif from '../images/confused.gif';
import crazyPng from '../images/crazy.png';
import crazyGif from '../images/crazy.gif';
import sleepingPng from '../images/sleeping.png';
import sleepingGif from '../images/sleeping.gif';


const EmojiBox = ({roomId}) => {
    const width = '45px';

    const [ loveHover, setLoveHover ] = useState(false);
    const [ lolHover, setLolHover ] = useState(false);
    const [ tongueHover, setTongueHover ] = useState(false);
    const [ winkHover, setWinkHover ] = useState(false);
    const [ confusedHover, setConfusedHover ] = useState(false);
    const [ crazyHover, setCrazyHover ] = useState(false);
    const [ sleepingHover, setSleepingHover ] = useState(false);

    const sendEmoji = (e) => {
        e.preventDefault();
        socket.emit('emoji', Number(roomId), e.target.id);
    }

    return (
        <div className={style.emojis}>
            <img src={loveHover? loveGif: lovePng} id='love' width={width} onClick={sendEmoji} onMouseOver={()=>setLoveHover(true)} onMouseOut={()=>setLoveHover(false)}/>
            <img src={lolHover? lolGif: lolPng} id='lol' width={width} onClick={sendEmoji} onMouseOver={()=>setLolHover(true)} onMouseOut={()=>setLolHover(false)}/>
            <img src={tongueHover? tongueGif: tonguePng} id='tongue' width={width} onClick={sendEmoji} onMouseOver={()=>setTongueHover(true)} onMouseOut={()=>setTongueHover(false)}/>
            <img src={winkHover? winkGif: winkPng} id='wink' width={width} onClick={sendEmoji} onMouseOver={()=>setWinkHover(true)} onMouseOut={()=>setWinkHover(false)}/>
            <img src={confusedHover? confusedGif: confusedPng} id='confused' width={width} onClick={sendEmoji} onMouseOver={()=>setConfusedHover(true)} onMouseOut={()=>setConfusedHover(false)}/>
            <img src={crazyHover? crazyGif: crazyPng} id='crazy' width={width} onClick={sendEmoji} onMouseOver={()=>setCrazyHover(true)} onMouseOut={()=>setCrazyHover(false)}/>
            <img src={sleepingHover? sleepingGif: sleepingPng} id='sleeping' width={width} onClick={sendEmoji} onMouseOver={()=>setSleepingHover(true)} onMouseOut={()=>setSleepingHover(false)}/>
        </div>
    );
}

export default EmojiBox;