import React, { useState } from "react";

const AddTask = ({ socket }) => {
  const [task, setTask] = useState("");
  const handleAddTodo = (e) => {
    e.preventDefault();
    socket.emit("createTask", { task });
    setTask("");
  };

  return (
    <form className="form__input" onSubmit={handleAddTodo}>
      <label htmlFor="task">Add Task</label>

      <input
        type="text"
        name="task"
        id="task"
        value={task}
        className="input"
        required
        onChange={(e) => setTask(e.target.value)}
      />

      <button className="addCardBtn">ADD CARD</button>
    </form>
  );
};

export default AddTask;
