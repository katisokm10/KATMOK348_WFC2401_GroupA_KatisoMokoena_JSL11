// TASK: import helper functions from utils
import { getTasks, createNewTask, patchTask, deleteTask, putTask } from './utils/taskFunctions.js';

// TASK: import initialData
import { initialData } from './initialData.js';

/*************************************************************************************************************************************************
 * FIX BUGS!!!
 * **********************************************************************************************************************************************/

// Function checks if local storage already has data, if not it loads initialData to localStorage
function initializeData() {
  if (!localStorage.getItem('tasks')) {
    localStorage.setItem('tasks', JSON.stringify(initialData));
    localStorage.setItem('showSidebar', true); // Corrected key name and set boolean value
  } else {
    console.log('Data already exists in localStorage');
  }
}

initializeData();

// TASK: Get elements from the DOM
const elements = {
  headerBoardName: document.getElementById('header-board-name'),
  hideSideBarBtn: document.getElementById('hide-side-bar-btn'),
  showSideBarBtn: document.getElementById('show-side-bar-btn'),
  themeSwitch: document.getElementById('switch'),
  createNewTaskBtn: document.getElementById('add-new-task-btn'),
  modalWindow: document.getElementById('new-task-modal-window'),
  editTaskModal: document.querySelector('.edit-task-modal-window'),
  cancelEditBtn: document.getElementById('cancel-edit-btn'),
  cancelAddTaskBtn: document.getElementById('cancel-add-task-btn'),
  filterDiv: document.getElementById('filterDiv'),
  createTaskBtn: document.getElementById("create-task-btn"),
  columnDivs: document.querySelectorAll('.column-div')
};

let activeBoard = "";

// Extracts unique board names from tasks
function fetchAndDisplayBoardsAndTasks() {
  const tasks = getTasks();
  const boards = [...new Set(tasks.map(task => task.board).filter(Boolean))];
  displayBoards(boards);
  if (boards.length > 0) {
    activeBoard = JSON.parse(localStorage.getItem("activeBoard")) || boards[0];
    elements.headerBoardName.textContent = activeBoard;
    styleActiveBoard(activeBoard);
    refreshTasksUI();
  }
}

// Creates different boards in the DOM
function displayBoards(boards) {
  const boardsContainer = document.getElementById("boards-nav-links-div");
  boardsContainer.innerHTML = ''; // Clears the container
  boards.forEach(board => {
    const boardElement = document.createElement("button");
    boardElement.textContent = board;
    boardElement.classList.add("board-btn");
    boardElement.addEventListener("click", () => {
      elements.headerBoardName.textContent = board;
      filterAndDisplayTasksByBoard(board);
      activeBoard = board;
      localStorage.setItem("activeBoard", JSON.stringify(activeBoard));
      styleActiveBoard(activeBoard);
    });
    boardsContainer.appendChild(boardElement);
  });
}

//Filters tasks corresponding to the board name and displays them on the DOM.
function filterAndDisplayTasksByBoard(boardName) {
  const filteredTasks = getTasks().filter(task => task.board === boardName);

  elements.columnDivs.forEach(column => {
    const status = column.dataset.status;
    column.innerHTML = `<div class="column-head-div">
                          <span class="dot" id="${status}-dot"></span>
                          <h4 class="columnHeader">${status.toUpperCase()}</h4>
                        </div>`;

    const tasksContainer = document.createElement("div");
    column.appendChild(tasksContainer);

    filteredTasks.filter(task => task.status === status).forEach(task => {
      const taskElement = document.createElement("div");
      taskElement.classList.add("task-div");
      taskElement.textContent = task.title;
      taskElement.dataset.taskId = task.id;
      taskElement.addEventListener("click", () => openEditTaskModal(task));

      tasksContainer.appendChild(taskElement);
    });
  });
}

function refreshTasksUI() {
  filterAndDisplayTasksByBoard(activeBoard);
}

// Styles the active board by adding an active class
function styleActiveBoard(boardName) {
  document.querySelectorAll('.board-btn').forEach(btn => {
    if (btn.textContent === boardName) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function addTaskToUI(task) {
  const column = document.querySelector(`.column-div[data-status="${task.status}"]`);
  if (!column) {
    console.error(`Column not found for status: ${task.status}`);
    return;
  }

  // Create a unique tasks container for each task
  const tasksContainer = document.createElement('div');
  tasksContainer.className = 'tasks-container';
  column.appendChild(tasksContainer);

  // Check if the task already exists in the tasks container
  const existingTaskElement = tasksContainer.querySelector(`.task-div[data-task-id="${task.id}"]`);
  if (existingTaskElement) {
    console.warn(`Task with ID ${task.id} already exists in the tasks container.`);
    return;
  }

  const taskElement = document.createElement('div');
  taskElement.className = 'task-div';
  taskElement.textContent = task.title; // Modify as needed
  taskElement.setAttribute('data-task-id', task.id);
  taskElement.addEventListener('click', () => openEditTaskModal(task));

  tasksContainer.appendChild(taskElement);
}

function setupEventListeners() {
  // Cancel editing task event listener
  const cancelEditBtn = document.getElementById('cancel-edit-btn');
  cancelEditBtn.addEventListener('click', () => toggleModal(false, elements.editTaskModal));

  // Cancel adding new task event listener*
  const cancelAddTaskBtn = document.getElementById('cancel-add-task-btn');
  cancelAddTaskBtn.addEventListener('click', () => {
    toggleModal(false);
    elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
  });

  // Clicking outside the modal to close it*
  elements.filterDiv.addEventListener('click', (event) => {
    if (event.target === elements.filterDiv) {
      toggleModal(false);
      elements.filterDiv.style.display = 'none'; // Also hide the filter overlay
    }
  });

  // Show sidebar event listener
  elements.hideSideBarBtn.addEventListener('click', () => toggleSidebar(false));
  elements.showSideBarBtn.addEventListener('click', () => toggleSidebar(true));

  // Theme switch event listener
  elements.themeSwitch.addEventListener('change', toggleTheme);

  // Show Add New Task Modal event listener
  elements.createNewTaskBtn.addEventListener('click', () => {
    toggleModal(true);
    elements.filterDiv.style.display = 'block'; // Also show the filter overlay
  });

  elements.modalWindow.addEventListener('submit', (event) => {
    addTask(event);
  });
}

// Toggles tasks modal
function toggleModal(show, modal = elements.modalWindow) {
  modal.style.display = show ? 'block' : 'none';
}

/*************************************************************************************************************************************************
 * COMPLETE FUNCTION CODE
 * **********************************************************************************************************************************************/

// Function to add a task
function addTask(event) {
  event.preventDefault();

  // Assign user input to the task object
  const task = {
    title: document.getElementById("title-input").value, // Get the title input value
    description: document.getElementById("desc-input").value, // Get the description input value
    status: document.getElementById("select-status").value, // Get the status input value
    board: activeBoard // Assign the active board to the task
  };

  const newTask = createNewTask(task); // Create a new task object
  if (newTask) {
    addTaskToUI(newTask); // Add the new task to the UI
    toggleModal(false); // Close the modal
    updateLocalStorageTasks(newTask); // Update tasks in local storage
    newTask.board = activeBoard; // Set the board for the new task
    initialData.push(newTask); // Add the new task to initialData
    elements.filterDiv.style.display = "none"; // Hide the filter overlay
    event.target.reset(); // Reset the form
    initialData.push(newTask); // Add the new task to initialData
    initialData.pop(); // Remove the last task from initialData
    localStorage.setItem('tasks', JSON.stringify(initialData)); // Update tasks in local storage
    refreshTasksUI(); // Refresh the UI
  }
}

function updateLocalStorageTasks(newTask) {
  let tasks = getTasks();
  tasks.push(newTask);
  localStorage.setItem('tasks', JSON.stringify(tasks));
}

function toggleSidebar(show) {
  const sidebarElement = document.getElementById('side-bar-div');

  if (show) {
    sidebarElement.style.display = 'block';
    elements.showSideBarBtn.style.display = "none";
    //sidebarElement.appendChild(svgElement);
  } else {
    sidebarElement.style.display = 'none';
    elements.showSideBarBtn.style.display = "block";
    // sidebarElement.removeChild(svgElement);
  }

  localStorage.setItem('showSideBar', show);
}

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

// Function to set the theme based on the preference stored in local storage



function openEditTaskModal(task) {
  // Set task details in modal inputs
  const titleInput = document.getElementById("edit-task-title-input");
  const descInput = document.getElementById("edit-task-desc-input");
  const statusSelect = document.getElementById("edit-select-status");

  // Get button elements from the task modal
  titleInput.value = task.title;
  descInput.value = task.description;
  statusSelect.value = task.status;

  // Call saveTaskChanges upon click of Save Changes button
  const saveTaskChangesBtn = document.getElementById("save-task-changes-btn");
  const deleteTaskBtn = document.getElementById("delete-task-btn");

  saveTaskChangesBtn.addEventListener("click", () => {
    saveTaskChanges(task.id);
    // No need to reload the page, just refresh the UI
    refreshTasksUI();
    toggleModal(false, elements.editTaskModal);
  });

  // Delete task using a helper function and close the task modal
  deleteTaskBtn.addEventListener("click", () => {
    deleteTask(task.id);
    // No need to reload the page, just refresh the UI
    refreshTasksUI();
    toggleModal(false, elements.editTaskModal);
  });

  toggleModal(true, elements.editTaskModal); // Show the edit task modal
}

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

    //upDate tasks using a helper function
    patchTask(taskId, updateTask);

    // Add the new task to the tasks array
    tasks.push(newTask);
  }

  // Save the updated tasks array back to local storage
  localStorage.setItem("tasks", JSON.stringify(tasks));

  // Call putTask to update the task in your storage mechanism
  if (existingTaskIndex !== -1) {
    putTask(taskId, tasks[existingTaskIndex]); // Pass the existing task
  } else {
    putTask(taskId, newTask); // Pass the newly created task
  }

  // Refresh the UI to reflect the changes
  refreshTasksUI();

  // Close the modal
  toggleModal(false, elements.editTaskModal);
  const theme = localStorage.getItem("theme");
  const logo = document.getElementById("logo");

  // Toggle theme based on the value of the 'theme' variable
document.body.classList.toggle(theme === "dark" ? "light-theme" : "dark-theme");
document.body.classList.toggle(theme === "dark" ? "dark-theme" : "light-theme");

// Update the logo source based on the theme
logo.src = theme === "dark" ? "./assets/logo-dark.svg" : "./assets/logo-light.svg";
}

document.addEventListener('DOMContentLoaded', function() {
  init(); // init is called after the DOM is fully loaded
});

//Function to initialize the application
function init() {
  setupEventListeners();
  const showSidebar = localStorage.getItem('showSideBar') === 'true';
  toggleSidebar(showSidebar);
  const isLightTheme = localStorage.getItem('light-theme') === 'enabled';
  document.body.classList.toggle('light-theme', isLightTheme);
  fetchAndDisplayBoardsAndTasks(); // Initial display of boards and tasks
}
