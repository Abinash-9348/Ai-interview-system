import React from 'react';
import RoomHeader from './RoomHeader';
import ChatBox from './ChatBox';
import ParticipantList from './ParticipantList';

const CodePage = () => {
  return (
    <div className="h-screen flex flex-col">
      <RoomHeader />
      <div className="flex flex-1">
        <div className="w-64">
          <ParticipantList />
        </div>
        <div className="flex-1 bg-gray-100 p-4">
          <textarea
            className="w-full h-full border p-4 rounded"
            placeholder="Write your code here..."
          />
        </div>
        <ChatBox />
      </div>
    </div>
  );
};

export default CodePage;