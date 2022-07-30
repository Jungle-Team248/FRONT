import { configureStore, createSlice, current } from '@reduxjs/toolkit'

let user = createSlice({
  name : 'user',
  initialState : {id: "", profile_img: ""},
  reducers : {
    setUserId(state, action){
        state.id = action.payload;
        // console.log('redux setUserId: ', current(state));
    },
    setProfileImg(state, action){
        state.profile_img = action.payload;
        // console.log('redux setProfileImg: ', current(state));
    }
}
});

let gameInfo = createSlice({
  name : 'gameInfo',
  initialState : [null, null, 1],
  reducers : {
    turnStatusChange(state, action){
      state[0] = action.payload[0];
      state[1] = action.payload[1];
      // console.log('redux turnStatusChange: ', current(state));
    },
    surviveStatusChange(state, action){
      state[2] = action.payload;
      // console.log('redux surviveStatusChange: ', current(state));
    },
    clearGameInfo(state, action){
      return [null, null, 1];
    }
}
});

let ingameStates = createSlice({
  name : 'ingameStates',
  initialState : {isReady: false, isLoaded: false},
  reducers : {
    clickReady(state, action){
      state.isReady = !state.isReady;
    },
    clearReady(state, action){
      state.isReady = false;
    },
    loadComplete(state, action){
      state.isLoaded = true;
    },
    clearLoad(state, action){
      state.isLoaded = false;
    }
  }
});

let FriendInfo = createSlice({
  name : 'friendInfo',
  initialState: {},
  reducers : {
    FriendInfoSet(state, action){
      state[action.payload[0]] = action.payload[1];
      // console.log('redux FriendInfoSet: ', current(state))
    },
    FriendInfoChange(state, action){
      if (state[action.payload[0]] !== undefined){
        state[action.payload[0]] = action.payload[1];
        // console.log('redux FriendInfoChange: ',current(state));
      }
    },
    FriendInfoReset(state, action){
      // console.log('redux FriendInfoReset');
      return {};
    }
  }
})

let videoInfo = createSlice({
  name : 'videoInfo',
  initialState : {stream: null},
  reducers : {
    VideoStreamChange(state, action){
        state.stream = action.payload;
        console.log("redux VideoStreamChange: ", current(state));
    },
    VideoStreamReset(state, action) {
        return {stream: null};
    }
}
});

let newPlayerBuffer = createSlice({
  name : 'newPlayerBuffer',
  initialState : {Chat: [], VideoWindow: []},
  reducers : {
    pushNewPlayer(state, action) {
      state.Chat.push(action.payload);
      state.VideoWindow.push(action.payload);
    },
    clearChatNewPlayer(state, action) {
      state.Chat = [];
    },
    clearVideoWindowNewPlayer(state, action) {
      state.VideoWindow = [];
    }
  }
})

let exiterBuffer = createSlice({
  name : 'exiterBuffer',
  initialState : {Chat:[], VideoWindow:[]},
  reducers : {
    pushExiter(state, action) {
      state.Chat.push(action.payload);
      state.VideoWindow.push(action.payload);
    },
    clearChatExiter(state, action) {
      state.Chat = [];
    },
    clearVideoWindowExiter(state, action) {
      state.VideoWindow = [];
    }
  }
})

let othersReadyBuffer = createSlice({
  name : 'othersReadyBuffer',
  initialState : [],
  reducers : {
    pushOthersReady(state, action) {
      state.push(action.payload);
    },
    renewOthersReady(state, action) {
      return action.payload;
    },
    clearOthersReady(state, action) {
      return [];
    }
  }
})


const store = configureStore({
  reducer: {
    user : user.reducer,
    FriendInfo : FriendInfo.reducer,
    gameInfo : gameInfo.reducer,
    ingameStates : ingameStates.reducer,
    videoInfo : videoInfo.reducer,
    newPlayerBuffer : newPlayerBuffer.reducer,
    exiterBuffer : exiterBuffer.reducer,
    othersReadyBuffer : othersReadyBuffer.reducer
  },

  middleware: (getDefaultMiddleware) =>
  getDefaultMiddleware({
    serializableCheck: false
  }),
});

export {store};

export let { setUserId, setProfileImg } = user.actions;
export let { FriendInfoSet, FriendInfoChange, FriendInfoReset } = FriendInfo.actions;
export let { turnStatusChange, surviveStatusChange, clearGameInfo } = gameInfo.actions;
export let { clickReady, clearReady, loadComplete, clearLoad } = ingameStates.actions;
export let { VideoStreamChange, VideoStreamReset } = videoInfo.actions;
export let { pushNewPlayer, clearChatNewPlayer, clearVideoWindowNewPlayer } = newPlayerBuffer.actions;
export let { pushExiter, clearChatExiter, clearVideoWindowExiter } = exiterBuffer.actions;
export let { pushOthersReady, renewOthersReady, clearOthersReady } = othersReadyBuffer.actions;