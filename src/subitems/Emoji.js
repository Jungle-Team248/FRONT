import React, { useEffect, useState } from "react";
import style from "./css/Emoji.module.css";
import emojis from "../script/emojis";
import { useDispatch } from "react-redux";
import { eraseEmoji } from "../store";

// Jack - 큰 비디오에 표시할 emoji component
const EmojiBig = ({newEmoji, idx}) => {
    const [ emoji, setEmoji ] = useState(null);
    const dispatch = useDispatch();
    useEffect(()=>{
        if (newEmoji) {
            setTimeout(()=>{
                setEmoji(newEmoji);
            }, 30); // null로 바뀐 뒤 바로 emoji 가 세팅되면, 최종적으로 변경된 state만 반영되어 null적용이 소용없어짐. 의도적으로 30ms를 지연시킴.
        }
        const timer = setTimeout(()=>{
            setEmoji(null);
            dispatch(eraseEmoji(idx));
        }, 2900);
        return () => {
            setEmoji(null); // 이모지가 바뀔 때 애니메이션이 새로 적용되기 위해서 class가 null로 바뀌었다가 다시 세팅되어야 하기 때문에 임시로 null로 바꿈
            clearTimeout(timer);
        }
    }, [newEmoji]);

    return (
        <>
            <img className={emoji? style.emojiBig: null} src={emojis[emoji]} />
        </>
    )
}

// Jack - 작은 비디오에 표시할 emoji component
const EmojiSmall = ({newEmoji, idx}) => {
    const [ emoji, setEmoji ] = useState(null);
    const dispatch = useDispatch();
    useEffect(()=>{
        if (newEmoji) {
            setTimeout(()=>{
                setEmoji(newEmoji);
            }, 10);
        }
        const timer = setTimeout(()=>{
            setEmoji(null);
            dispatch(eraseEmoji(idx));
        }, 2900);
        return () => {
            clearTimeout(timer);
            setEmoji(null);
        }
    }, [newEmoji]);

    return (
        <>
            <img className={emoji? style.emojiSmall: null} src={emojis[emoji]} />
        </>
    )
}

export {EmojiBig, EmojiSmall} ;