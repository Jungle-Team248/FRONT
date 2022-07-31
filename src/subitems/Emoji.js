import React, { useEffect, useState } from "react";
import style from "./css/Emoji.module.css";
import emojis from "../script/emojis";
import { useDispatch } from "react-redux";
import { eraseEmoji } from "../store";


const EmojiBig = ({newEmoji, idx}) => {
    const [ emoji, setEmoji ] = useState(null);
    const dispatch = useDispatch();
    useEffect(()=>{
        if (newEmoji) {
            console.log("EmojiBig ::: ", newEmoji, emoji);
            setTimeout(()=>{
                setEmoji(newEmoji);
            }, 30);
        }
        const timer = setTimeout(()=>{
            setEmoji(null);
            dispatch(eraseEmoji(idx));
        }, 2900);
        return () => {
            setEmoji(null);
            clearTimeout(timer);
        }
    }, [newEmoji]);
    
    return (
        <>
            <img className={emoji? style.emojiBig: null} src={emojis[emoji]} />
        </>
    )
}

const EmojiSmall = ({newEmoji, idx}) => {
    const [ emoji, setEmoji ] = useState(null);
    const dispatch = useDispatch();
    useEffect(()=>{
        if (newEmoji) {
            console.log("EmojiSmall ::: ", newEmoji, emoji);
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

export {EmojiBig, EmojiSmall}