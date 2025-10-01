import { useState,useEffect } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [task, setTask] = useState(""); 
  const [tasks, setTasks] = useState([]); 
  const addTask = () => {
    if (task !== "") {       
    setTasks([...tasks, task]);  
    setTask("");           
  }
  };
  return (
    <>
      <div style={{ padding: "20px", maxWidth: "400px", margin: "auto" }}>
      <h1>Simple To-Do App</h1>
      <input
        type="text"
        value={task}
        onChange={(e) => setTask(e.target.value)}
        placeholder="Enter a task"
        style={{ padding: "5px", width: "70%" }}
      />
      <button onClick={addTask} style={{ padding: "5px", marginLeft: "10px" }}>
        Add
      </button>

      <ul>
        {tasks.map((t, index) => (
          <li key={index}>{t}</li>
        ))}
      </ul>
    </div>
    </>
  )
}

export default App
