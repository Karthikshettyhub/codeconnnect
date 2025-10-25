import React, { useContext } from "react";
import { RoomContext } from "../contexts/roomcontext";
import "./CodeEditor.css";

export default function CodeEditor() {
  const { roomData, updateCode } = useContext(RoomContext);

  const handleChange = (e) => {
    updateCode(e.target.value);
  };

  return (
    <div className="code-editor">
      <textarea
        value={roomData.codeContent}
        onChange={handleChange}
        spellCheck="false"
      />
    </div>
  );
}
