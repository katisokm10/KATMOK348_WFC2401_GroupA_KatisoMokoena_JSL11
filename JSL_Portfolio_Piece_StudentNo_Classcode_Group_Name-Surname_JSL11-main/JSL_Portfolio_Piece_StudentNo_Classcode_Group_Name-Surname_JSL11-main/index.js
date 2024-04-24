// Import helper functions from utils
import { createNewTask, deleteTask, getTasks, putTask } from "./utils/taskFunctions.js";
// Import initialData
import { initialData } from "./initialData.js";

// Clear localStorag

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem("tasks")) {
    // If there is no 'tasks' item in local storage, set it with initial data
    localStorage.setItem("tasks", JSON.stringify(initialData));
    
    // Set 'showSideBar' item to 'true'
    localStorage.setItem("showSideBar", "true");
  } else {
    // If 'tasks' item already exists in local storage, log a message
    console.log("Data already exists in localStorage");
  }
}

// Initialize data if needed
initializeData();

// Get elements from the DOM
const elements = {
  editTaskModal: document.querySelector('.edit-task-modal-window'),
  modalWindow: document.querySelector('.modal-window'),
  themeSwitch: document.querySelector('#switch'),
  showSideBarBtn: document.querySelector('#show-side-bar-btn'),
  hideSideBarBtn: document.querySelector('#hide-side-bar-btn'),
  filterDiv: document.getElementById('filterDiv'),
  columnDivs: document.querySelectorAll('.column-div'),
  headerBoardName: document.getElementById('header-board-name'),
  toggleDiv: document.querySelectorAll('.toggle-div'),
  headlineSidePanel: document.getElementById('headline-sidepanel')
};

console.log(elements.editTaskModal); // Example usage

let activeBoard = "";

// Fetches and displays boards and tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    // Set active board to the first board or the one stored in localStorage
    const localStorageBoard =JSON.parse(localStorage.getItem("activeBoard"));
    activeBoard = localStorageBoard ? localStorageBoard : boards[0];

    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }

  // Add event listener for creating a new task
  const createNewTaskBtn = document.getElementById('add-new-task-btn');
  createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block';

    // Ensure activeBoard is correctly set before adding a new task
    activeBoard = elements.headerBoardName.textContent;
  });

  // Other code...

}

// Function to handle adding a new task
function addTask(event) {
  event.preventDefault();

  // Get input values
  const titleInput = document.getElementById('title-input');
  const description = document.getElementById('desc-input');
  const status = document.querySelector('#select-status');

  // Create task object
  const task = {
    title: titleInput.value,
    description: description.value,
    status: status.value,
    board: activeBoard // Assign the active board to the new task
  };

  // Add the task to the UI
  const newTask = createNewTask(task);
  if (newTask) {
    addTaskToUI(newTask);
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
    event.target.reset();
    refreshTasksUI();
  }
}


// Add the new task to the UI
function addTaskToUI(task) {
  const column = document.querySelector(
    `.column-div[data-status="${task.status}"]`
  );
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  // Create task element and append it to the column
  let tasksContainer = column.querySelector('.tasks-container');
  if (!tasksContainer) {
    console.warn(
      `Tasks container not found for status: ${task.status}, creating one.`
    );
    tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-container";
    column.appendChild(tasksContainer);
  }

  const taskElement = document.createElement("div");
  taskElement.className = "task-div";
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute("data-task-id", task.id);

  tasksContainer.appendChild(taskElement);

  // Update initialData and localStorage with the new task
  initialData.push(task);
  localStorage.setItem("tasks", JSON.stringify(initialData));
}

// Function to display boards in the UI
function displayBoards(boards) {
  const sidebar = document.getElementById("boards-nav-links-div"); // Select the correct element
  sidebar.innerHTML = ''; // Clear the sidebar

  // Create board buttons and add event listeners
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", () => {
      elements.headerBoardName.textContent = board; // Update the header with the board name
      filterAndDisplayTasksByBoard(board);
      activeBoard = board;
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    sidebar.appendChild(boardElement); // Append to sidebar
  });
}

// Function to filter and display tasks corresponding to the selected board
function filterAndDisplayTasksByBoard(boardName) {
  const tasks = getTasks();
  const filteredTasks = tasks.filter(task => task.board === boardName);

  // Display tasks in respective columns
  elements.columnDivs.forEach(column => {
    const status = column.dataset.status || '';
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    tasksContainer.className = "tasks-container"; // Add class name to tasks container
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.dataset.taskId = task.id;

      taskElement.addEventListener('click', function () {
        openEditTaskModal(task);
      });

      tasksContainer.appendChild(taskElement);
    });
  });
}

// Function to refresh the UI with tasks
function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Function to style the active board
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

// Function to set up event listeners
function setupEventListeners() {
  // Event listeners for various UI interactions

  // Toggle modal window
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', function () {
    toggleModal(false, elements.editTaskModal);
  });

  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });

  elements.filterDiv.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none';
  });

  elements.hideSideBarBtn.addEventListener("click", () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener("click", () => toggleSidebar(true));

  elements.themeSwitch.addEventListener('change', toggleTheme);

  const createNewTaskBtn = document.getElementById('add-new-task-btn');
  createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block';
  });

  elements.modalWindow.addEventListener('submit', (event) => {
    addTask(event);
  });
}

// Function to toggle modal window
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none';
}

// Function to toggle sidebar
function toggleSidebar(show) {
  const sidebar = document.getElementById("side-bar-div");
  if (show) {
    sidebar.style.display = "block";
    elements.showSideBarBtn.style.display = "none";
  } else {
    sidebar.style.display = "none";
    elements.showSideBarBtn.style.display = "block";
  }
}

// Function to toggle theme
function toggleTheme() {
  // Toggle the 'light-theme' class on the body element
  document.body.classList.toggle('light-theme');

  // Save the theme preference to localStorage
  localStorage.setItem('light-theme', document.body.classList.contains('light-theme') ? 'enabled' : 'disabled');

  // Get the image element
  const logo = document.getElementById('logo');

  // Check if the body has the 'light-theme' class
  const isLightTheme = document.body.classList.contains('light-theme');

  // Update the src attribute of the image based on the theme
  if (isLightTheme) {
    logo.src = './assets/logo-light.svg'; // Set the src for light theme
  } else {
    logo.src = './assets/logo-dark.svg'; // Set the src for dark theme
  }
}
// Function to open edit task modal
// Function to open edit task modal
function openEditTaskModal(task) {
  const titleInput = document.getElementById("edit-task-title-input");
  const descInput = document.getElementById("edit-task-desc-input");
  const statusSelect = document.getElementById("edit-select-status");

  // Set task details in modal inputs
  titleInput.value = task.title;
  descInput.value = task.description;
  statusSelect.value = task.status; // Set the current status

  // Get button elements from the task modal
  const saveChangesBtn = document.getElementById("save-task-changes-btn");
  const deleteTaskBtn = document.getElementById("delete-task-btn");

  // Call saveTaskChanges upon click of Save Changes button
  saveChangesBtn.addEventListener("click", function () {
    saveTaskChanges(task.id);
  });

  // Delete task using a helper function and close the task modal
  deleteTaskBtn.addEventListener("click", () => {
    deleteTask(task.id);
    toggleModal(false, elements.editTaskModal);
    refreshTasksUI(); // Refresh the UI after deleting task
  });

  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

// Function to save changes to a task
// Function to save changes to a task
// Function to save changes to a task
// Function to save changes to a task
// Function to save changes to a task
function saveTaskChanges(taskId) {
  // Get new user inputs
  const updatedTitle = document.getElementById("edit-task-title-input").value;
  const updatedDescription = document.getElementById("edit-task-desc-input").value;
  const updatedStatus = document.getElementById("edit-select-status").value;

  // Get the tasks from local storage
  let tasks = getTasks();

  // Check if a task with the same ID already exists
  const existingTaskIndex = tasks.findIndex(task => task.id === taskId);

  if (existingTaskIndex !== -1) {
    // If the task already exists, update its properties
    tasks[existingTaskIndex].title = updatedTitle;
    tasks[existingTaskIndex].description = updatedDescription;
    tasks[existingTaskIndex].status = updatedStatus;
  } else {
    // If the task doesn't exist, create a new task object
    const newTask = {
      id: taskId,
      title: updatedTitle,
      description: updatedDescription,
      status: updatedStatus
    };

    // Add the new task to the tasks array
    tasks.push(newTask);
  }

  // Save the updated tasks array back to local storage
  localStorage.setItem("tasks", JSON.stringify(tasks));

  // Call putTask to update the task in your storage mechanism
  putTask(taskId, tasks[existingTaskIndex]);

  // Refresh the UI to reflect the changes
  refreshTasksUI();

  // Close the modal
  toggleModal(false, elements.editTaskModal);
}



// Call init function after the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function () {
  init();
});

// Function to initialize the application
function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem("showSideBar") === "true";
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem("light-theme") === "enabled";
  document.body.classList.toggle("light-theme", isLightTheme);

  // Fetch tasks from local storage
  const tasks = getTasks();

  // Extract board names from tasks
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];

  // Call functions to fetch and display boards
  fetchAndDisplayBoardsAndTasks(boards);
  displayBoards(boards);
}
