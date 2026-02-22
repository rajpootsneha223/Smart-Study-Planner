// StudyMate Pro - Personal Study Management System
// Built with passion for academic success! 📚

document.addEventListener('DOMContentLoaded', () => {
    // Core app elements
    const taskForm = document.getElementById('task-form');
    const taskTitle = document.getElementById('task-title');
    const taskDate = document.getElementById('task-date');
    const taskTime = document.getElementById('task-time');
    const taskPriority = document.getElementById('task-priority');
    const taskCategory = document.getElementById('task-category');
    const taskList = document.getElementById('task-list');
    const timeline = document.getElementById('timeline');
    const searchInput = document.getElementById('search-input');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const toastContainer = document.getElementById('toast-container');

    // Stats elements
    const totalTasksEl = document.getElementById('total-tasks');
    const completedTasksEl = document.getElementById('completed-tasks');
    const progressPercentageEl = document.getElementById('progress-percentage');
    const progressBar = document.getElementById('progress-bar');
    const todayTasksEl = document.getElementById('today-tasks');
    const weekTasksEl = document.getElementById('week-tasks');
    const overdueTasksEl = document.getElementById('overdue-tasks');

    let tasks = JSON.parse(localStorage.getItem('studyTasks')) || [];
    let currentFilter = 'all';
    let searchQuery = '';
    let editingTaskId = null;

    // My custom utility functions ✨
    function createUniqueTaskId() {
        // Using timestamp + random string for uniqueness
        const timestamp = Date.now();
        const randomPart = Math.random().toString(36).substring(2, 9);
        return `task_${timestamp}_${randomPart}`;
    }

    function saveTasks() {
        localStorage.setItem('studyTasks', JSON.stringify(tasks));
    }

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `toast ${type}`;

        // Add some personality to notifications
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };

        notification.innerHTML = `${icons[type]} ${message}`;
        toastContainer.appendChild(notification);

        // Smooth fade out after 3.5 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100px)';
            setTimeout(() => notification.remove(), 300);
        }, 3500);
    }

    function isSameDay(date) {
        const now = new Date();
        const checkDate = new Date(date);
        return now.toDateString() === checkDate.toDateString();
    }

    function isWithinWeek(date) {
        const now = new Date();
        const taskDate = new Date(date);
        const msPerDay = 24 * 60 * 60 * 1000;
        const weekStart = new Date(now.getTime() - (7 * msPerDay));
        const weekEnd = new Date(now.getTime() + (7 * msPerDay));
        return taskDate >= weekStart && taskDate <= weekEnd;
    }

    function isOverdue(date, time) {
        const now = new Date();
        const taskDateTime = new Date(date + (time ? 'T' + time : 'T23:59'));
        return taskDateTime < now;
    }

    function filterTasks(tasks) {
        let filtered = tasks;

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(task =>
                task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                task.category.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        switch (currentFilter) {
            case 'pending':
                filtered = filtered.filter(task => !task.completed);
                break;
            case 'completed':
                filtered = filtered.filter(task => task.completed);
                break;
            case 'overdue':
                filtered = filtered.filter(task => !task.completed && isOverdue(task.date, task.time));
                break;
        }

        return filtered;
    }

    function updateStats() {
        const total = tasks.length;
        const completed = tasks.filter(task => task.completed).length;
        const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
        const today = tasks.filter(task => isSameDay(task.date)).length;
        const week = tasks.filter(task => isWithinWeek(task.date)).length;
        const overdue = tasks.filter(task => !task.completed && isOverdue(task.date, task.time)).length;

        totalTasksEl.textContent = total;
        completedTasksEl.textContent = completed;
        progressPercentageEl.textContent = progress + '%';
        progressBar.style.width = progress + '%';
        todayTasksEl.textContent = today;
        weekTasksEl.textContent = week;
        overdueTasksEl.textContent = overdue;
    }

    function renderTasks() {
        const filteredTasks = filterTasks(tasks);
        taskList.innerHTML = '';

        if (filteredTasks.length === 0) {
            taskList.innerHTML = '<div style="text-align: center; color: #666; padding: 2rem;">No tasks found</div>';
            return;
        }

        filteredTasks.forEach((task) => {
            const taskEl = document.createElement('div');
            taskEl.className = `task-item ${task.priority}-priority ${task.completed ? 'completed' : ''}`;

            const overdueClass = !task.completed && isOverdue(task.date, task.time) ? 'overdue' : '';

            taskEl.innerHTML = `
                <div class="task-header">
                    <div>
                        <div class="task-title">${task.title}</div>
                        <div class="task-meta">
                            <span><i class="fas fa-calendar"></i> ${task.date}</span>
                            ${task.time ? `<span><i class="fas fa-clock"></i> ${task.time}</span>` : ''}
                            <span><i class="fas fa-flag"></i> ${task.priority}</span>
                            <span><i class="fas fa-tag"></i> ${task.category}</span>
                            ${overdueClass ? '<span class="overdue"><i class="fas fa-exclamation-triangle"></i> Overdue</span>' : ''}
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-btn edit" onclick="editTask('${task.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="task-btn delete" onclick="deleteTask('${task.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                        <button class="task-btn complete" onclick="toggleComplete('${task.id}')">
                            <i class="fas ${task.completed ? 'fa-undo' : 'fa-check'}"></i> 
                            ${task.completed ? 'Undo' : 'Complete'}
                        </button>
                    </div>
                </div>
            `;

            taskList.appendChild(taskEl);
        });

        updateStats();
    }

    function renderTimeline() {
        timeline.innerHTML = '';
        const sorted = [...tasks].sort((a, b) => {
            const d1 = new Date(a.date + (a.time ? 'T' + a.time : 'T00:00'));
            const d2 = new Date(b.date + (b.time ? 'T' + b.time : 'T00:00'));
            return d1 - d2;
        });

        if (sorted.length === 0) {
            timeline.innerHTML = '<div style="text-align: center; color: #666; padding: 1rem;">No tasks in timeline</div>';
            return;
        }

        sorted.forEach(task => {
            const div = document.createElement('div');
            div.className = 'timeline-item' + (task.completed ? ' completed' : '');
            div.innerHTML = `
                <div style="font-weight: 600; margin-bottom: 0.5rem;">${task.title}</div>
                <div style="color: #666; font-size: 0.9rem;">
                    <i class="fas fa-calendar"></i> ${task.date}
                    ${task.time ? `<i class="fas fa-clock" style="margin-left: 1rem;"></i> ${task.time}` : ''}
                    <span style="margin-left: 1rem; padding: 0.2rem 0.5rem; background: #4f46e5; color: white; border-radius: 10px; font-size: 0.8rem;">
                        ${task.category}
                    </span>
                </div>
            `;
            timeline.appendChild(div);
        });
    }

    // Global functions for button clicks
    window.editTask = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            taskTitle.value = task.title;
            taskDate.value = task.date;
            taskTime.value = task.time || '';
            taskPriority.value = task.priority;
            taskCategory.value = task.category;
            editingTaskId = taskId;

            const submitBtn = taskForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-save"></i> Update Task';

            showNotification('Task ready for editing! ✏️', 'info');
        }
    };

    window.deleteTask = (taskId) => {
        if (confirm('Are you sure you want to delete this task?')) {
            tasks = tasks.filter(task => task.id !== taskId);
            saveTasks();
            renderTasks();
            renderTimeline();
            showNotification('Task removed from your study queue! 🗑️', 'success');
        }
    };

    window.toggleComplete = (taskId) => {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            task.completedAt = task.completed ? new Date().toISOString() : null;
            saveTasks();
            renderTasks();
            renderTimeline();
            showNotification(task.completed ? 'Great job! Task completed! 🎯' : 'Task marked as pending 📋', 'success');
        }
    };

    // Event Listeners
    taskForm.addEventListener('submit', (e) => {
        e.preventDefault();

        if (!taskTitle.value.trim() || !taskDate.value) {
            showNotification('Please fill in all required fields! 📋', 'error');
            return;
        }

        const taskData = {
            id: editingTaskId || createUniqueTaskId(),
            title: taskTitle.value.trim(),
            date: taskDate.value,
            time: taskTime.value,
            priority: taskPriority.value,
            category: taskCategory.value,
            completed: false,
            createdAt: editingTaskId ? tasks.find(t => t.id === editingTaskId).createdAt : new Date().toISOString(),
            // Personal metadata for better tracking
            lastModified: new Date().toISOString(),
            version: "1.0" // Simple versioning for task updates
        };

        if (editingTaskId) {
            const taskIndex = tasks.findIndex(t => t.id === editingTaskId);
            if (taskIndex !== -1) {
                tasks[taskIndex] = { ...tasks[taskIndex], ...taskData };
                showNotification('Task updated successfully! 🎉', 'success');
            }
            editingTaskId = null;
            const submitBtn = taskForm.querySelector('button[type="submit"]');
            submitBtn.innerHTML = '<i class="fas fa-plus"></i> Add Task';
        } else {
            tasks.push(taskData);
            showNotification('New task added to your study queue! 📝', 'success');
        }

        saveTasks();
        renderTasks();
        renderTimeline();
        taskForm.reset();
    });

    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value;
        renderTasks();
    });

    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            renderTasks();
        });
    });

    // Reminder system with better notifications
    function checkReminders() {
        const now = new Date();
        tasks.forEach(task => {
            if (!task.completed && task.date && !task.reminded) {
                const taskDateTime = new Date(task.date + (task.time ? 'T' + task.time : 'T09:00'));
                const timeDiff = taskDateTime - now;

                // Remind 1 hour before
                if (timeDiff > 0 && timeDiff <= 60 * 60 * 1000) {
                    showNotification(`Hey! Don't forget about "${task.title}" - it's due in 1 hour! ⏰`, 'warning');
                    task.reminded = true;
                    saveTasks();
                }
                // Friendly overdue reminder
                else if (timeDiff < 0 && timeDiff >= -60 * 60 * 1000 && !task.overdueReminded) {
                    showNotification(`Oops! "${task.title}" is overdue. Time to catch up! 🏃‍♂️`, 'error');
                    task.overdueReminded = true;
                    saveTasks();
                }
            }
        });
    }

    // Check reminders every 30 seconds
    setInterval(checkReminders, 30000);

    // Set today's date as default
    taskDate.value = new Date().toISOString().split('T')[0];

    // Initial render
    renderTasks();
    renderTimeline();
    checkReminders();
});
