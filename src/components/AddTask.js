// ...existing code...
const handleAddTask = () => {
    const newTask = {
        id: Date.now(),
        title: taskTitle,
        description: taskDescription,
        // ...other task details...
    };

    // Add task to list view
    setListTasks([...listTasks, newTask]);

    // Add task to board view
    setBoardTasks([...boardTasks, newTask]);

    // Clear input fields
    setTaskTitle('');
    setTaskDescription('');
    // ...clear other fields...
};
// ...existing code...
