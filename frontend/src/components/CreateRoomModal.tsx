import React from 'react';

const CreateRoomModal = () => {
  return (
    <div className="bg-white p-6 rounded shadow-lg w-96">
      <h2 className="text-xl font-bold mb-4">Create Room</h2>
      <input className="border w-full p-2 mb-3" placeholder="Room Name" />
      <select className="border w-full p-2 mb-3">
        <option>JavaScript</option>
        <option>Python</option>
        <option>Java</option>
      </select>
      <button className="bg-green-500 text-white px-4 py-2 rounded w-full">Create</button>
    </div>
  );
};

export default CreateRoomModal;