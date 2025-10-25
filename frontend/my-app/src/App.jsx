import React from 'react'
import { RoomProvider } from "./contexts/roomcontext.jsx";
import Homepage from "./pages/homepage.jsx"
import  RoomPage  from "./pages/roompage.jsx"

const App = () => {
  return (
    <RoomProvider>
      {/* <Homepage /> */}
      <RoomPage />
    </RoomProvider>

  )
}

export default App