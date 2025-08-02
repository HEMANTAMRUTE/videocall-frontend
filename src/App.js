

import {Routes,Route} from 'react-router-dom';

import React from 'react';

import LobbyScreen from '../src/screen/Lobby';
import Room from '../src/screen/Room';
function App() {
  
  return (
    <div>
       <Routes>
       
        <Route path="/" element={<LobbyScreen />} />
        <Route path="/room/:roomId" element={<Room/>}/>
      </Routes>
    </div>
    
  );
}

export default App;