import React from 'react';

const JoinRoomModal = () => {
  return (
    <div className="bg-white p-6 rounded shadow-lg w-96">
      <h2 className="text-xl font-bold mb-4">Join Room</h2>
      <input className="border w-full p-2 mb-3" placeholder="Enter Room ID" />
      <input className="border w-full p-2 mb-3" placeholder="Enter Username" />
      <button className="bg-blue-500 text-white px-4 py-2 rounded w-full">Join</button>
    </div>
  );
};

export default JoinRoomModal;