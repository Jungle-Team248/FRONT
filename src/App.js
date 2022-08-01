/* eslint-disable */

import React from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import {Routes, Route} from "react-router-dom";
import Ingame from './components/Ingame';
import Lobby from './components/Lobby';
import Main from './components/Main';
import './css/App.css'
import {RequireAuth} from './script/auth';

/**
 * Jack
 * Login하지 않은 상태로 lobby, ingame 등으로의 접근을 막기위해
 * RequireAuth 컴포넌트 추가함
 */

function App() {
  return (
    <div style={{margin: "auto"}}>
      <Routes>
        <Route path="/" element={<Main />}/>
        <Route path="lobby/*" element={
          <RequireAuth Component={Lobby} />
        }/>
        <Route path="/ingame/:roomId" element={
          <RequireAuth Component={Ingame} />
        }/>
        <Route path="*" element={
          <main style={{ padding: "1rem"}}>
            <p>FORBIDDEN</p>
          </main>
        }/>
      </Routes>
      
    </div>
  );
}

export default App;