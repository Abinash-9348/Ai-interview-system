import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Editor from '../components/Editor';

const lessons = {
  'JavaScript': [
    {
      title: 'Variables and Data Types',
      content: `// JavaScript Variables and Data Types

// 1. Declaring variables
let name = "John";
const age = 25;
var city = "New York";

// 2. Different data types
let string = "Hello";    // String
let number = 42;         // Number
let boolean = true;      // Boolean
let array = [1, 2, 3];   // Array
let object = {          // Object
  key: "value"
};

// Try modifying these variables and see what happens!
`
    }
  ],
  'Python': [
    {
      title: 'Python Basics',
      content: `# Python Variables and Data Types

# 1. Variables in Python
name = "Alice"
age = 30
city = "London"

# 2. Different data types
text = "Hello World"    # String
number = 42            # Integer
decimal = 3.14         # Float
is_valid = True        # Boolean
my_list = [1, 2, 3]    # List
my_dict = {            # Dictionary
    "key": "value"
}

# Try creating your own variables!
`
    }
  ]
};

export default function LessonPage() {
  const [currentLesson, setCurrentLesson] = useState(lessons.JavaScript[0]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  return (
    <div className="pt-16">
      <Sidebar 
        onLanguageSelect={(content) => setCurrentLesson({ title: 'Custom', content })}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
      />
      
      <main className={`transition-all duration-300 ${isSidebarOpen ? 'pl-64' : 'pl-0'}`}>
        <div className="max-w-7xl mx-auto py-12 px-8">
          <div className="space-y-8">
            <div className="bg-black/30 backdrop-blur-sm rounded-lg p-6 border border-[#00ff88]/20">
              <h2 className="text-2xl font-bold text-[#00ff88] mb-4">{currentLesson.title}</h2>
              <p className="text-white/70 mb-6">
                Follow along with the lesson and experiment with the code in the editor below.
              </p>
            </div>
            
            <Editor 
              value={currentLesson.content}
              onChange={() => {}}
            />
          </div>
        </div>
      </main>
    </div>
  );
}