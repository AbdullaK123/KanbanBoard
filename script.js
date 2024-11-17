// Local Storage Manager class
class LocalStorageManager {
    // constructor
    constructor(storageKey) {
        this.storageKey = storageKey;
    }

    // load from local storage
    load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.error('Error loading data from local storage', error);
            return null;
        }
    }

    // save to local storage
    save(data) {
        try {
            const serializedData = JSON.stringify(data);
            localStorage.setItem(this.storageKey, serializedData);
            return true;
        } catch (error) {
            console.error('Error saving data to local storage', error);
            return false;
        }
    }

    // clear local storage
    clear() {
        try {
            localStorage.removeItem(this.storageKey);
            return true;
        } catch (error) {
            console.error('Error clearing data from local storage', error);
            return false;
        }
    }

    // check if local storage is empty
    isEmpty() {
        return !localStorage.getItem(this.storageKey);
    }
}

// Task Manager Class
class TaskManager {
    constructor(tasks) {
        this.tasks = tasks;
        this.initializeTaskLists();
    }

    initializeTaskLists() {
        if (!this.tasks.todo) this.tasks.todo = [];
        if (!this.tasks.inprogress) this.tasks.inprogress = [];
        if (!this.tasks.done) this.tasks.done = [];
    }

    addTask(task, status = 'todo') {
        try {
            if (!this.tasks[status]) {
                this.tasks[status] = [];
            }

            const newTask = {
                id: Date.now(),
                createdAt: new Date().toISOString(),
                status: status,
                ...task
            };

            this.tasks[status].push(newTask);
            console.log('Task added successfully:', newTask);
            return newTask;
        } catch (error) {
            console.error('Error adding task:', error);
            return null;
        }
    }

    removeTask(taskId) {
        try {
            for (const status in this.tasks) {
                this.tasks[status] = this.tasks[status].filter(task => task.id !== taskId);
            }
            return true;
        } catch (error) {
            console.error('Error removing task:', error);
            return false;
        }
    }

    updateTask(taskId, updates) {
        try {
            for (const [status, tasks] of Object.entries(this.tasks)) {
                const task = tasks.find(task => task.id === taskId);
                if (task) {
                    Object.assign(task, updates);
                    return task;
                }
            }
            return null;
        } catch (error) {
            console.error('Error updating task:', error);
            return null;
        }
    }

    getTaskById(taskId) {
        try {
            for (const tasks of Object.values(this.tasks)) {
                const task = tasks.find(task => task.id === taskId);
                if (task) return task;
            }
            return null;
        } catch (error) {
            console.error('Error getting task by id:', error);
            return null;
        }
    }

    getTasksByStatus(status) {
        return this.tasks[status] || [];
    }

    getAllTasks() {
        return this.tasks;
    }

    getTasksCount() {
        return Object.values(this.tasks).reduce((acc, tasks) => acc + tasks.length, 0);
    }
}

// UI Manager Class
class UIManager {
    constructor(dragDropManager) {
        // Initialize drag drop manager
        this.dragDropManager = dragDropManager;

        // Initialize list configurations
        this.lists = {
            todo: {
                containerId: 'todo-list',
                contentSelector: '[data-list="todo"]',
                title: 'To Do'
            },
            inprogress: {
                containerId: 'inprogress-list',
                contentSelector: '[data-list="inprogress"]',
                title: 'In Progress'
            },
            done: {
                containerId: 'done-list',
                contentSelector: '[data-list="done"]',
                title: 'Done'
            }
        };

        // Initialize filter state
        this.filters = {
            search: '',
            priority: 'all',
            label: 'all'
        }

        this.initializeUIElements();
        this.initializeEventListeners();
        this.initializeContainers();
        this.initializeFilterElements();
        this.initalizeFilterListeners();
    }

    getOrCreateListContainer(key, list) {
        let container = document.getElementById(list.containerId);
        
        if (!container) {
            container = document.createElement('div');
            container.id = list.containerId;
            container.className = 'list-container';
            
            const header = document.createElement('div');
            header.className = 'list-header';
            
            const title = document.createElement('h2');
            title.textContent = list.title;
            
            const counter = document.createElement('span');
            counter.className = 'task-count';
            counter.textContent = '0';
            
            header.appendChild(title);
            header.appendChild(counter);
            container.appendChild(header);
            
            document.querySelector('.board-container').appendChild(container);
        }
        
        return container;
    }

    getOrCreateListContent(container, key) {
        let content = container.querySelector(`[data-list="${key}"]`);
        
        if (!content) {
            content = document.createElement('div');
            content.className = 'list-content';
            content.setAttribute('data-list', key);
            container.appendChild(content);
        }
        
        return content;
    }

    validateElements() {
        const missingElements = [];
        
        for (const key of Object.keys(this.lists)) {
            if (!this[`${key}Container`]) {
                missingElements.push(`${key} container`);
            }
            if (!this[`${key}Counter`]) {
                missingElements.push(`${key} counter`);
            }
        }
        
        if (missingElements.length > 0) {
            throw new Error(`Missing required elements: ${missingElements.join(', ')}`);
        }
    }

    initializeUIElements() {
        // Modal elements
        this.modalElement = document.getElementById('task-modal');
        this.taskForm = document.getElementById('task-form');
        this.addTaskBtn = document.getElementById('add-task-btn');
        this.closeModalBtn = document.getElementById('close-modal');

        // Status elements
        this.loadingElement = document.getElementById('loading-state');
        this.errorMessageElement = document.getElementById('error-message');

        // Initialize form manager
        this.formManager = new FormManager(this.taskForm);
    }

    initializeEventListeners() {
        // Modal controls
        this.addTaskBtn.addEventListener('click', () => this.showModal());
        this.closeModalBtn.addEventListener('click', () => this.hideModal());
        this.modalElement.addEventListener('click', (e) => {
            if (e.target === this.modalElement) this.hideModal();
        });

        // Form submission
        this.taskForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
    }

    initializeContainers() {
        for (const [key, list] of Object.entries(this.lists)) {
            const container = this.getOrCreateListContainer(key, list);
            const content = this.getOrCreateListContent(container, key);
            
            this[`${key}Container`] = content;
            this[`${key}Counter`] = container.querySelector('.task-count');
        }
        this.validateElements();
    }

    initializeFilterElements() {
         // Get filter elements
         this.searchInput = document.getElementById('search');
         this.labelFilter = document.getElementById('label');
         this.priorityFilter = document.getElementById('priority');
 
         if (!this.searchInput || !this.labelFilter || !this.priorityFilter) {
             console.error('Filter elements not found');
         }
    }

    initalizeFilterListeners() {
       // Add event listeners for filters
        this.searchInput?.addEventListener('input', (e) => {
            this.filters.search = e.target.value.toLowerCase();
            this.emitFilterChange();
        });

        this.labelFilter?.addEventListener('change', (e) => {
            this.filters.label = e.target.value;
            this.emitFilterChange();
        });

        this.priorityFilter?.addEventListener('change', (e) => {
            this.filters.priority = e.target.value;
            this.emitFilterChange();
        });
    }

    emitFilterChange() {
        document.dispatchEvent(new CustomEvent('filter-change', {
            detail: { filters: this.filters }
        }));
    }

     // Method to apply filters to tasks
     filterTasks(tasks) {
        const filteredTasks = {};

        // Clone the tasks object to avoid modifying the original
        for (const [status, statusTasks] of Object.entries(tasks)) {
            filteredTasks[status] = statusTasks.filter(task => {
                // Search filter
                const matchesSearch = this.filters.search === '' ||
                    task.title.toLowerCase().includes(this.filters.search) ||
                    task.description.toLowerCase().includes(this.filters.search);

                // Label filter
                const matchesLabel = this.filters.label === 'all' ||
                    task.label === this.filters.label;

                // Priority filter
                const matchesPriority = this.filters.priority === 'all' ||
                    task.priority.toLowerCase() === this.filters.priority.toLowerCase();

                return matchesSearch && matchesLabel && matchesPriority;
            });
        }

        return filteredTasks;
    }

    updateFilterUI() {
        if (this.searchInput) {
            this.searchInput.value = this.filters.search;
        }
        if (this.labelFilter) {
            this.labelFilter.value = this.filters.label;
        }
        if (this.priorityFilter) {
            this.priorityFilter.value = this.filters.priority;
        }
    }

    resetFilters() {
        this.filters = {
            search: '',
            label: 'all',
            priority: 'all'
        };
        this.updateFilterUI();
        this.emitFilterChange();
    }

    // Add getters for current filter state
    getFilters() {
        return { ...this.filters };
    }

    handleFormSubmit(e) {
        e.preventDefault();
        const formData = this.formManager.getFormData();
        
        if (formData) {
            document.dispatchEvent(new CustomEvent('task-submit', {
                detail: formData
            }));
        } else {
            this.showErrorMessage('Please fill all required fields');
        }
    }

    showModal() {
        this.modalElement.style.display = 'flex';
        this.formManager.resetForm();
        console.log('Modal displayed');
    }

    showModalWithData(task) {
        this.modalElement.style.display = 'flex';
        this.formManager.setFormData(task);
        console.log('Modal displayed with task data:', task);
    }

    hideModal() {
        this.modalElement.style.display = 'none';
        this.formManager.resetForm();
        console.log('Modal hidden');
    }

    renderTasks(tasks) {
        try {
            this.clearTasks();
            
            tasks.todo.forEach(task => this.renderTask(task, this.todoContainer));
            tasks.inprogress.forEach(task => this.renderTask(task, this.inprogressContainer));
            tasks.done.forEach(task => this.renderTask(task, this.doneContainer));
            
            this.updateTaskCounters(tasks);
        } catch (error) {
            console.error('Error rendering tasks:', error);
            this.showErrorMessage('Error rendering tasks');
        }
    }

    renderTask(task, container) {
        const taskElement = document.createElement('div');
        taskElement.className = 'task-card';
        taskElement.draggable = true;
        taskElement.dataset.taskId = task.id;

        taskElement.innerHTML = `
            <div class="task-header">
                <h3 class="task-title">${this.escapeHtml(task.title)}</h3>
                <span class="task-priority priority-${task.priority.toLowerCase()}">${task.priority}</span>
            </div>
            <p class="task-description">${this.escapeHtml(task.description)}</p>
            <div class="task-metadata">
                <span class="task-label">${this.escapeHtml(task.label)}</span>
                ${task.dueDate ? `<span class="task-due-date">${new Date(task.dueDate).toLocaleDateString()}</span>` : ''}
            </div>
            <div class="task-actions">
                <button class="btn btn-icon edit-task" data-task-id="${task.id}">
                    <span class="btn-icon">✏️</span>
                </button>
                <button class="btn btn-icon delete-task" data-task-id="${task.id}">
                    <span class="btn-icon">🗑️</span>
                </button>
            </div>
        `;

        this.attachTaskEventListeners(taskElement);
        this.dragDropManager.attachDragListeners(taskElement, task.id);

        container.appendChild(taskElement);
    }

    attachTaskEventListeners(taskElement) {
        const editBtn = taskElement.querySelector('.edit-task');
        const deleteBtn = taskElement.querySelector('.delete-task');
        
        editBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.dispatchEvent(new CustomEvent('task-edit', { 
                detail: { taskId: parseInt(e.currentTarget.dataset.taskId) }
            }));
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            document.dispatchEvent(new CustomEvent('task-delete', { 
                detail: { taskId: parseInt(e.currentTarget.dataset.taskId) }
            }));
        });
    }

    updateTaskCounters(tasks) {
        this.todoCounter.textContent = tasks.todo.length;
        this.inprogressCounter.textContent = tasks.inprogress.length;
        this.doneCounter.textContent = tasks.done.length;
    }

    clearTasks() {
        this.todoContainer.innerHTML = '';
        this.inprogressContainer.innerHTML = '';
        this.doneContainer.innerHTML = '';
    }

    showLoadingState() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'flex';
        }
    }

    hideLoadingState() {
        if (this.loadingElement) {
            this.loadingElement.style.display = 'none';
        }
    }

    showErrorMessage(message) {
        if (this.errorMessageElement) {
            this.errorMessageElement.textContent = message;
            this.errorMessageElement.style.display = 'block';
            
            setTimeout(() => {
                this.errorMessageElement.style.display = 'none';
            }, 3000);
        }
    }

    escapeHtml(unsafe) {
        return unsafe
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }
}

// Form Manager Class
class FormManager {
    constructor(formElement) {
        this.formElement = formElement;
        this.initializeForm();
    }

    initializeForm() {
        if (!this.formElement) throw new Error('Form element not found');
    }

    getFormData() {
        try {
            const formData = new FormData(this.formElement);
            
            const task = {
                title: formData.get('task-title'),
                description: formData.get('task-description'),
                priority: formData.get('task-priority'),
                label: formData.get('task-label'),
                dueDate: formData.get('task-due-date')
            };

            return this.validateFormData(task) ? task : null;
        } catch (error) {
            console.error('Error getting form data:', error);
            return null;
        }
    }

    validateFormData(task) {
        try {
            const requiredFields = ['title', 'description', 'priority', 'label'];
            
            for (const field of requiredFields) {
                if (!task[field]) {
                    console.error(`Missing required field: ${field}`);
                    return false;
                }
            }

            if (task.dueDate && isNaN(new Date(task.dueDate).getTime())) {
                console.error('Invalid due date');
                return false;
            }

            return true;
        } catch (error) {
            console.error('Error validating form data:', error);
            return false;
        }
    }

    resetForm() {
        try {
            this.formElement.reset();
        } catch (error) {
            console.error('Error resetting form:', error);
        }
    }

    setFormData(task) {
        try {
            if (!task) return;

            // Create a mapping between task properties and form field names
            const fieldMapping = {
                title: 'task-title',
                description: 'task-description',
                priority: 'task-priority',
                label: 'task-label',
                dueDate: 'task-due-date'
            };

            // Set each form field value using the mapping
            for (const [taskProp, formField] of Object.entries(fieldMapping)) {

                const element = this.formElement.elements[formField];

                if (!element) {
                    console.error(`Form field not found: ${formField}`);
                    continue;
                }

                if (element && task[taskProp] !== undefined) {

                    // Special handling for date fields
                    if (formField === 'task-due-date' && task[taskProp]) {

                        // Ensure the date is in YYYY-MM-DD format for the input
                        const date = new Date(task[taskProp]);
                        element.value = date.toISOString().split('T')[0];

                    } else {
                        
                        element.value = task[taskProp];
                    }
                }
            }
        } catch (error) {
            console.error('Error setting form data:', error);
        }
    }
}

// Drag Drop Manager Class
class DragDropManager {
    // Constructor
    constructor(taskManager) {
        // Initialize the task manager
        this.taskManager = taskManager;

        // track what we are dragging
        this.draggedTask = null;
        this.draggedElement = null;

        // valid drop targets
        this.lists = {
            todo: 'todo',
            inprogress: 'inprogress',
            done: 'done'
        }

    }

    // Method to init drag and drop listeners
    initDragAndDropListeners() {

        // Get all list containers
        const containers = document.querySelectorAll('.list-content');

        // Add drag and drop listeners to each list container
        containers.forEach(container => {
            container.addEventListener('dragover', (e) => this.handleDragOver(e));
            container.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            container.addEventListener('drop', (e) => this.handleDrop(e));
        })

    }

    // Method to attach drag listeners
    attachDragListeners(taskElement, taskId) {
        taskElement.addEventListener('dragstart', (e) => this.handleDragStart(e, taskId));
        taskElement.addEventListener('dragend', (e) => this.handleDragEnd(e));
    }
 
    // Method to handle drag start
    handleDragStart(e, taskId) {
        try {
            // Set the dragged task and element
            this.draggedTask = taskId;
            this.draggedElement = e.target;

            // Add a class to the dragged element
            e.target.classList.add('dragging');

            // Set the drag effect
            e.dataTransfer.effectAllowed = 'move';

            // Set the drag data
            e.dataTransfer.setData('text/plain', taskId);

            // Log the drag event
            console.log('Drag started:', taskId);

        } catch(error) {
            console.error('Error handling drag start:', error);
        }
    }

    // Method to handle drag end
    handleDragEnd(e) {
        try {
            // Remove the dragging class from the dragged element
            if (this.draggedElement) {
                this.draggedElement.classList.remove('dragging');
            }

            // Remove the drag over class from all list containers
            document.querySelectorAll('.list-content').forEach(container => {
                container.classList.remove('drag-over');
            })

            // Reset the dragged task and element
            this.draggedTask = null;
            this.draggedElement = null;

        } catch (error) {
            console.error('Error handling drag end:', error);
        }
    }

    // Method to handle drag over
    handleDragOver(e) {
        try {
            // Prevent default behavior
            e.preventDefault();

            // Get the closest list content element and if it doesn't have the drag over class add it
            const listContent = e.target.closest('.list-content');
            if (listContent && !listContent.classList.contains('drag-over')) {
                listContent.classList.add('drag-over');
            }

            // Set the drop effect
            e.dataTransfer.dropEffect = 'move';

        } catch(error) {
            console.error('Error handling drag over:', error);
        }
    }

    // Method to handle drag leave
    handleDragLeave(e) {
        try {
            // Get the nearest list content element and remove the drag over class if it exists
            const listContent = e.target.closest('.list-content');
            if (listContent) {
                listContent.classList.remove('drag-over');
            }

        } catch (error) {
            console.error('Error handling drag leave:', error);
        }
    }

    // Method to handle drop
    handleDrop(e) {
        try {
            // Prevent default behavoir
            e.preventDefault();

            // Get the drop target
            const dropTarget = e.target.closest('.list-content');
            if (!dropTarget) return;

            // Get new status
            const newStatus = dropTarget.getAttribute('data-list');

            // Get the dragged task id
            const taskId = parseInt(e.dataTransfer.getData('text/plain'));

            // if both the task id and new status exist dispatch the task move event
            if (taskId && newStatus) {
                document.dispatchEvent(new CustomEvent('task-move', {
                    detail: {
                        taskId,
                        newStatus
                    }
                }));
            }

            // log the change
            console.log('Task dropped:', taskId, newStatus);

        } catch (error) {
            console.error('Error handling drop:', error);
        }
    }
}

// Kanban Board App Class
class KanbanBoardApp {
    constructor() {
        // Initialize state
        this.editingTaskId = null;

        // Initialize managers
        this.localStorageManager = new LocalStorageManager('kanban-board');
        this.tasks = this.loadTasksFromStorage();
        this.taskManager = new TaskManager(this.tasks);
        this.dragDropManager = new DragDropManager(this.taskManager);
        this.uiManager = new UIManager(this.dragDropManager);

        // Initialize event listeners
        this.initEventListeners();
        this.initializeFilterHandlers();
        this.dragDropManager.initDragAndDropListeners();
    }

    loadTasksFromStorage() {
        return this.localStorageManager.load() || {
            todo: [],
            inprogress: [],
            done: []
        };
    }

    initEventListeners() {
        // Listen for UI events
        document.addEventListener('task-submit', (e) => this.handleTaskSubmit(e.detail));
        document.addEventListener('task-edit', (e) => this.handleTaskEdit(e.detail));
        document.addEventListener('task-delete', (e) => this.handleTaskDelete(e.detail));

        // Filter handlers
        this.initializeFilterHandlers();

        // Task move listener
        document.addEventListener('task-move', (e) => this.handleTaskMove(e.detail));

        // Initial render
        this.uiManager.renderTasks(this.tasks);
        console.log('Event listeners initialized');
    }

    handleTaskSubmit(formData) {
        console.log('Processing task submission:', formData);

        if (formData) {
            let updatedTask;
            
            if (this.editingTaskId) {
                updatedTask = this.taskManager.updateTask(this.editingTaskId, formData);
                this.editingTaskId = null;
                console.log('Task updated:', updatedTask);
            } else {
                updatedTask = this.taskManager.addTask(formData);
                console.log('New task created:', updatedTask);
            }

            if (updatedTask) {
                this.localStorageManager.save(this.tasks);
                this.uiManager.renderTasks(this.tasks);
                this.uiManager.hideModal();
                console.log('Task saved and UI updated');
            }
        }
    }

    handleTaskEdit({taskId}) {
        const task = this.taskManager.getTaskById(taskId);
        
        if (task) {
            this.editingTaskId = taskId;
            this.uiManager.showModalWithData(task);
            console.log('Editing task:', task);
        }
    }

    handleTaskDelete({ taskId }) {
        if (confirm('Are you sure you want to delete this task?')) {
            this.taskManager.removeTask(taskId);
            this.localStorageManager.save(this.tasks);
            this.uiManager.renderTasks(this.tasks);
            console.log('Task deleted:', taskId);
        }
    }

    handleFilterChange({ filters }) {
        console.log('Filters changed:', filters);
        // Re-render tasks with current filters
        const filteredTasks = this.uiManager.filterTasks(this.tasks);
        this.uiManager.renderTasks(filteredTasks);
    }

    handleTaskMove({ taskId, newStatus }) {
        try {
            // Get the task by its id
            const task = this.taskManager.getTaskById(taskId);

            // remove the task from its current status
            if (task && task.status !== newStatus) {
                this.taskManager.removeTask(taskId);
                this.tasks[task.status] = this.tasks[task.status].filter(t => t.id !== taskId);
        
                // add the task to the new status
                const updatedTask = this.taskManager.addTask(
                    { ...task, status: newStatus },
                    newStatus
                )

                // if the updated task exists, save the changes
                if (updatedTask) {

                    // Save the updated tasks to local storage
                    this.localStorageManager.save(this.tasks);

                    // Re-render the tasks
                    const filteredTasks = this.uiManager.filterTasks(this.tasks);
                    this.uiManager.renderTasks(filteredTasks);

                    // Log the task move
                    console.log(`Task ${taskId} moved to ${newStatus}`);
                }
            }

        } catch (error) {
            console.error('Error moving task:', error);
        }
    }

    initializeFilterHandlers() {
        document.addEventListener('filter-change', (e) => this.handleFilterChange(e.detail));
    }

}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    const app = new KanbanBoardApp();
    console.log('Kanban Board App initialized');
});