// Routine Tracker App - Tab-based Interface with Grid/List Toggle
class RoutineTracker {
    constructor() {
        this.db = null;
        this.dbName = 'RoutineTrackerDB';
        this.dbVersion = 2;
        this.routinesStore = 'routines';
        this.entriesStore = 'entries';
        
        this.currentDate = new Date().toISOString().split('T')[0];
        this.routines = new Map();
        this.currentTab = 'today';
        this.currentView = 'list'; // Changed from 'grid' to 'list' as default
        
        this.init();
    }
    
    async init() {
        await this.initDatabase();
        this.setupEventListeners();
        this.updateCurrentDate();
        await this.loadRoutines(); // Wait for routines to load
        this.showTab('today'); // Start with today view
        this.setMaxDate();
    }
    
    async initDatabase() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            
            request.onerror = () => reject(request.error);
            request.onsuccess = () => {
                this.db = request.result;
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create routines store
                if (!db.objectStoreNames.contains(this.routinesStore)) {
                    const routinesStore = db.createObjectStore(this.routinesStore, { keyPath: 'id', autoIncrement: true });
                    routinesStore.createIndex('name', 'name', { unique: true });
                }
                
                // Create entries store
                if (!db.objectStoreNames.contains(this.entriesStore)) {
                    const entriesStore = db.createObjectStore(this.entriesStore, { keyPath: 'id', autoIncrement: true });
                    entriesStore.createIndex('date', 'date', { unique: false });
                    entriesStore.createIndex('routineId', 'routineId', { unique: false });
                    entriesStore.createIndex('date_routine', ['date', 'routineId'], { unique: false });
                }
            };
        });
    }
    
    setupEventListeners() {
        // Date navigation (for table view)
        document.getElementById('prevDateBtn').addEventListener('click', () => {
            this.navigateDate(-1);
        });
        
        document.getElementById('nextDateBtn').addEventListener('click', () => {
            this.navigateDate(1);
        });
        
        document.getElementById('goToDateBtn').addEventListener('click', () => {
            const date = document.getElementById('datePicker').value;
            if (date) {
                this.currentDate = date;
                this.updateDateDisplay();
                this.renderTable();
            }
        });
        
        // Routine management
        document.getElementById('addRoutineBtn').addEventListener('click', () => {
            this.addRoutine();
        });
        
        // Data import/export
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportData();
        });
        
        document.getElementById('importDataBtn').addEventListener('click', () => {
            this.importData();
        });
        
        document.getElementById('deleteAllRoutinesBtn').addEventListener('click', () => {
            if (confirm('Are you sure you want to delete ALL routines? This will remove all routines but keep your progress data.')) {
                this.deleteAllRoutines();
            }
        });
        
        document.getElementById('restoreDefaultsBtn').addEventListener('click', () => {
            if (confirm('This will add back the default routines (Water, Medicine, etc.). Continue?')) {
                this.restoreDefaultRoutines();
            }
        });
        
        // Touch-friendly interactions
        this.setupTouchInteractions();
    }
    
    setupTouchInteractions() {
        const buttons = document.querySelectorAll('.btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            });
            
            button.addEventListener('touchend', () => {
                button.style.transform = '';
            });
        });
    }
    
    showTab(tabName) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active class from all tabs
        document.querySelectorAll('.nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show selected tab content
        document.getElementById(tabName + 'View').classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
        
        this.currentTab = tabName;
        
        // Load appropriate content
        switch(tabName) {
            case 'today':
                this.renderTodayView();
                break;
            case 'table':
                this.renderTable();
                break;
            case 'routines':
                this.renderRoutinesManagement();
                break;
        }
    }
    
    toggleView(viewType) {
        this.currentView = viewType;
        
        // Update button states
        document.getElementById('gridViewBtn').classList.toggle('active', viewType === 'grid');
        document.getElementById('listViewBtn').classList.toggle('active', viewType === 'list');
        
        // Update container classes
        const container = document.getElementById('todayRoutines');
        container.className = `today-routines ${viewType}-view`;
        
        // Re-render the content with new layout
        this.renderTodayRoutines();
    }
    
    updateCurrentDate() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('currentDate').textContent = today.toLocaleDateString('en-US', options);
        this.updateTodayDateDisplay();
    }
    
    updateTodayDateDisplay() {
        const today = new Date();
        const options = { 
            weekday: 'long', 
            month: 'long', 
            day: 'numeric' 
        };
        document.getElementById('todayDateDisplay').textContent = today.toLocaleDateString('en-US', options);
    }
    
    updateDateDisplay() {
        const date = new Date(this.currentDate);
        const options = { 
            weekday: 'short', 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        };
        document.getElementById('selectedDateDisplay').textContent = date.toLocaleDateString('en-US', options);
        document.getElementById('datePicker').value = this.currentDate;
    }
    
    setMaxDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('datePicker').max = today;
    }
    
    navigateDate(direction) {
        const current = new Date(this.currentDate);
        current.setDate(current.getDate() + direction);
        this.currentDate = current.toISOString().split('T')[0];
        this.updateDateDisplay();
        this.renderTable();
    }
    
    async renderTodayView() {
        this.renderTodayRoutines();
    }
    
    async renderTodayRoutines() {
        const container = document.getElementById('todayRoutines');
        container.innerHTML = '';
        
        // Set the correct view class
        container.className = `today-routines ${this.currentView}-view`;
        
        for (const [routineId, routine] of this.routines) {
            const entry = await this.getEntry(this.currentDate, routineId);
            const isCompleted = routine.type === 'counter' 
                ? (entry ? entry.count >= routine.target : false)
                : (entry ? entry.isDone : false);
            
            const card = document.createElement('div');
            card.className = `routine-card ${isCompleted ? 'completed' : ''}`;
            
            if (routine.type === 'counter') {
                const count = entry ? entry.count : 0;
                card.innerHTML = `
                    <div class="routine-icon">${routine.icon || ''}</div>
                    <div class="routine-title">${routine.name}</div>
                    <div class="routine-progress">${count}/${routine.target}</div>
                    <div class="routine-target">Target: ${routine.target}</div>
                `;
                card.onclick = () => this.updateCounter(this.currentDate, routineId, 1);
            } else {
                const isDone = entry ? entry.isDone : false;
                card.innerHTML = `
                    <div class="routine-icon">${routine.icon || ''}</div>
                    <div class="routine-title">${routine.name}</div>
                    <div class="routine-progress">${isDone ? 'Done' : 'Pending'}</div>
                    <div class="routine-target">Target: ${routine.target}</div>
                `;
                card.onclick = () => this.updateDone(this.currentDate, routineId, !isDone);
            }
            
            container.appendChild(card);
        }
    }
    
    async renderRoutinesManagement() {
        const grid = document.getElementById('routinesGrid');
        grid.innerHTML = '';
        
        for (const [routineId, routine] of this.routines) {
            const card = document.createElement('div');
            card.className = 'routine-card';
            
            card.innerHTML = `
                <div class="routine-card-header">
                    <div class="routine-icon">${routine.icon || ''}</div>
                    <div class="routine-info">
                        <h4>${routine.name}</h4>
                        <div class="routine-type">${routine.type}</div>
                        <div class="routine-target">Target: ${routine.target}</div>
                    </div>
                    <div class="routine-actions">
                        <button class="edit-routine" onclick="app.editRoutine(${routineId})" title="Edit routine">✏️</button>
                        <button class="delete-routine" onclick="app.deleteRoutine(${routineId})" title="Delete routine">×</button>
                    </div>
                </div>
            `;
            
            grid.appendChild(card);
        }
    }
    
    async addRoutine() {
        const name = document.getElementById('newRoutineName').value.trim();
        const type = document.getElementById('newRoutineType').value;
        const target = parseInt(document.getElementById('newRoutineTarget').value);
        const icon = document.getElementById('newRoutineIcon').value.trim(); // Don't set default icon
        
        if (!name) {
            this.showToast('Please enter a routine name', 'error');
            return;
        }
        
        const routine = {
            name: name,
            type: type,
            target: target,
            icon: icon, // Use empty string if no icon provided
            createdAt: new Date().toISOString()
        };
        
        try {
            const id = await this.saveRoutine(routine);
            routine.id = id;
            this.routines.set(id, routine);
            
            this.showToast('Routine added successfully!', 'success');
            
            // Reset form
            document.getElementById('newRoutineName').value = '';
            document.getElementById('newRoutineType').value = 'counter';
            document.getElementById('newRoutineTarget').value = '1';
            document.getElementById('newRoutineIcon').value = ''; // Reset to empty
            
            // Refresh displays without scrolling to top
            if (this.currentTab === 'today') {
                this.renderTodayView();
            } else if (this.currentTab === 'routines') {
                this.renderRoutinesManagement();
            }
            
        } catch (error) {
            console.error('Error adding routine:', error);
            this.showToast('Error adding routine. Please try again.', 'error');
        }
    }
    
    async editRoutine(routineId) {
        const routine = this.routines.get(routineId);
        if (!routine) return;
        
        // Populate form with existing data
        document.getElementById('newRoutineName').value = routine.name;
        document.getElementById('newRoutineType').value = routine.type;
        document.getElementById('newRoutineTarget').value = routine.target;
        document.getElementById('newRoutineIcon').value = routine.icon || '';
        
        // Change button text and functionality
        const addBtn = document.getElementById('addRoutineBtn');
        addBtn.textContent = 'Update Routine';
        addBtn.onclick = () => this.updateRoutine(routineId);
        
        // Scroll to form smoothly
        document.querySelector('.add-routine-section').scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
    }
    
    async updateRoutine(routineId) {
        const name = document.getElementById('newRoutineName').value.trim();
        const type = document.getElementById('newRoutineType').value;
        const target = parseInt(document.getElementById('newRoutineTarget').value);
        const icon = document.getElementById('newRoutineIcon').value.trim();
        
        if (!name) {
            this.showToast('Please enter a routine name', 'error');
            return;
        }
        
        const routine = this.routines.get(routineId);
        if (!routine) return;
        
        // Update routine data
        routine.name = name;
        routine.type = type;
        routine.target = target;
        routine.icon = icon;
        routine.updatedAt = new Date().toISOString();
        
        try {
            await this.updateRoutineInDB(routine);
            this.routines.set(routineId, routine);
            
            this.showToast('Routine updated successfully!', 'success');
            
            // Reset form and button
            this.resetRoutineForm();
            
            // Refresh displays
            if (this.currentTab === 'today') {
                this.renderTodayView();
            } else if (this.currentTab === 'routines') {
                this.renderRoutinesManagement();
            }
            
        } catch (error) {
            console.error('Error updating routine:', error);
            this.showToast('Error updating routine. Please try again.', 'error');
        }
    }
    
    resetRoutineForm() {
        document.getElementById('newRoutineName').value = '';
        document.getElementById('newRoutineType').value = 'counter';
        document.getElementById('newRoutineTarget').value = '1';
        document.getElementById('newRoutineIcon').value = '';
        
        const addBtn = document.getElementById('addRoutineBtn');
        addBtn.textContent = 'Add Routine';
        addBtn.onclick = () => this.addRoutine();
    }
    
    async updateRoutineInDB(routine) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.routinesStore], 'readwrite');
            const store = transaction.objectStore(this.routinesStore);
            const request = store.put(routine);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async deleteRoutine(routineId) {
        if (!confirm('Are you sure you want to delete this routine? This will also delete all associated entries.')) {
            return;
        }
        
        try {
            await this.removeRoutine(routineId);
            this.routines.delete(routineId);
            
            this.showToast('Routine deleted successfully!', 'success');
            
            // Refresh displays
            if (this.currentTab === 'today') {
                this.renderTodayView();
            } else if (this.currentTab === 'routines') {
                this.renderRoutinesManagement();
            } else if (this.currentTab === 'table') {
                this.renderTable();
            }
            
        } catch (error) {
            console.error('Error deleting routine:', error);
            this.showToast('Error deleting routine. Please try again.', 'error');
        }
    }
    
    async saveRoutine(routine) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.routinesStore], 'readwrite');
            const store = transaction.objectStore(this.routinesStore);
            const request = store.add(routine);
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
    
    async removeRoutine(routineId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.routinesStore, this.entriesStore], 'readwrite');
            const routinesStore = transaction.objectStore(this.routinesStore);
            const entriesStore = transaction.objectStore(this.entriesStore);
            
            // Delete routine
            const routineRequest = routinesStore.delete(routineId);
            
            // Delete all entries for this routine
            const entriesIndex = entriesStore.index('routineId');
            const entriesRequest = entriesIndex.getAllKeys(routineId);
            
            entriesRequest.onsuccess = () => {
                entriesRequest.result.forEach(entryId => {
                    entriesStore.delete(entryId);
                });
            };
            
            routineRequest.onsuccess = () => resolve();
            routineRequest.onerror = () => reject(routineRequest.error);
        });
    }
    
    async loadRoutines() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.routinesStore], 'readonly');
            const store = transaction.objectStore(this.routinesStore);
            const request = store.getAll();
            
            request.onsuccess = () => {
                this.routines.clear();
                
                // Remove duplicates by name
                const uniqueRoutines = [];
                const seenNames = new Set();
                
                request.result.forEach(routine => {
                    if (!seenNames.has(routine.name)) {
                        seenNames.add(routine.name);
                        uniqueRoutines.push(routine);
                    }
                });
                
                uniqueRoutines.forEach(routine => {
                    this.routines.set(routine.id, routine);
                });
                
                // Don't automatically add default routines - let user choose
                resolve();
            };
            request.onerror = () => reject(request.error);
        });
    }
    
    async addDefaultRoutines() {
        const defaultRoutines = [
            { name: 'Water', type: 'counter', target: 7, icon: '' },
            { name: 'Medicine', type: 'counter', target: 2, icon: '' },
            { name: 'Sugar Cane Juice', type: 'done', target: 1, icon: '' },
            { name: 'Fruits', type: 'counter', target: 2, icon: '' },
            { name: 'Yoga', type: 'done', target: 1, icon: '' },
            { name: 'Clean Diet', type: 'done', target: 1, icon: '' },
            { name: 'Coconut Water', type: 'done', target: 1, icon: '' }
        ];
        
        for (const routine of defaultRoutines) {
            try {
                // Check if routine already exists
                const existingRoutine = Array.from(this.routines.values()).find(r => r.name === routine.name);
                if (!existingRoutine) {
                    const id = await this.saveRoutine(routine);
                    routine.id = id;
                    this.routines.set(id, routine);
                }
            } catch (error) {
                console.error('Error adding default routine:', error);
            }
        }
    }
    
    async renderTable() {
        const tableHead = document.querySelector('#routineTable thead tr');
        const tableBody = document.getElementById('tableBody');
        
        // Clear existing content
        tableHead.innerHTML = '<th class="date-header">Date</th>';
        tableBody.innerHTML = '';
        
        // Debug: Log routines count
        console.log('Rendering table with', this.routines.size, 'routines');
        
        // Get all routines in a consistent order
        const routineList = Array.from(this.routines.entries());
        console.log('Routine list:', routineList.map(([id, routine]) => routine.name));
        
        // Add routine headers
        routineList.forEach(([routineId, routine]) => {
            const th = document.createElement('th');
            th.innerHTML = `${routine.icon || ''} ${routine.name}`;
            tableHead.appendChild(th);
        });
        
        // Generate table rows for current week (7 days)
        const dates = [];
        const today = new Date(this.currentDate);
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - today.getDay()); // Start from Sunday
        
        for (let i = 0; i < 7; i++) {
            const date = new Date(startOfWeek);
            date.setDate(startOfWeek.getDate() + i);
            dates.push(date.toISOString().split('T')[0]);
        }
        
        console.log('Dates to render:', dates);
        
        // Create ONE row per date
        for (const date of dates) {
            const row = document.createElement('tr');
            
            // Date cell
            const dateCell = document.createElement('td');
            const dateObj = new Date(date);
            const isToday = date === this.currentDate;
            dateCell.innerHTML = `
                <div class="${isToday ? 'today-date' : ''}">
                    ${dateObj.toLocaleDateString('en-US', { 
                        month: 'short', 
                        day: 'numeric',
                        weekday: 'short'
                    })}
                </div>
            `;
            if (isToday) dateCell.style.fontWeight = 'bold';
            row.appendChild(dateCell);
            
            // Add ONE cell per routine for this date
            for (const [routineId, routine] of routineList) {
                const cell = document.createElement('td');
                const entry = await this.getEntry(date, routineId);
                
                if (routine.type === 'counter') {
                    const count = entry ? entry.count : 0;
                    cell.className = 'counter-cell';
                    cell.innerHTML = `
                        <button class="counter-btn" onclick="app.updateCounter('${date}', ${routineId}, -1)">-</button>
                        <span class="counter-value">${count}</span>
                        <button class="counter-btn" onclick="app.updateCounter('${date}', ${routineId}, 1)">+</button>
                    `;
                } else {
                    const isDone = entry ? entry.isDone : false;
                    cell.className = 'done-cell';
                    cell.innerHTML = `
                        <input type="checkbox" class="done-checkbox" 
                               ${isDone ? 'checked' : ''} 
                               onchange="app.updateDone('${date}', ${routineId}, this.checked)">
                    `;
                }
                
                row.appendChild(cell);
            }
            
            tableBody.appendChild(row);
        }
        
        // Debug: Log final table structure
        console.log('Table rendered with', tableBody.children.length, 'rows');
        console.log('Expected rows:', dates.length);
    }
    
    async getEntry(date, routineId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.entriesStore], 'readonly');
            const store = transaction.objectStore(this.entriesStore);
            const index = store.index('date_routine');
            const request = index.get([date, routineId]);
            
            request.onsuccess = () => resolve(request.result || null);
            request.onerror = () => reject(request.error);
        });
    }
    
    async updateCounter(date, routineId, change) {
        const entry = await this.getEntry(date, routineId);
        const routine = this.routines.get(routineId);
        
        if (!routine) return;
        
        const currentCount = entry ? entry.count : 0;
        const newCount = Math.max(0, currentCount + change);
        
        await this.saveEntry(date, routineId, { count: newCount });
        
        // Refresh current view without scrolling to top
        if (this.currentTab === 'today') {
            this.renderTodayView();
        } else if (this.currentTab === 'table') {
            this.renderTable();
        }
    }
    
    async updateDone(date, routineId, isDone) {
        await this.saveEntry(date, routineId, { isDone: isDone });
        
        // Refresh current view without scrolling to top
        if (this.currentTab === 'today') {
            this.renderTodayView();
        } else if (this.currentTab === 'table') {
            this.renderTable();
        }
    }
    
    async saveEntry(date, routineId, updates) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.entriesStore], 'readwrite');
            const store = transaction.objectStore(this.entriesStore);
            
            // Check if entry already exists
            const index = store.index('date_routine');
            const getRequest = index.get([date, routineId]);
            
            getRequest.onsuccess = () => {
                if (getRequest.result) {
                    // Update existing entry
                    const updatedEntry = { ...getRequest.result, ...updates };
                    const updateRequest = store.put(updatedEntry);
                    updateRequest.onsuccess = () => resolve(updatedEntry.id);
                    updateRequest.onerror = () => reject(updateRequest.error);
                } else {
                    // Add new entry
                    const newEntry = { date: date, routineId: routineId, ...updates };
                    const addRequest = store.add(newEntry);
                    addRequest.onsuccess = () => resolve(addRequest.result);
                    addRequest.onerror = () => reject(addRequest.error);
                }
            };
            getRequest.onerror = () => reject(getRequest.error);
        });
    }
    
    async deleteEntry(entryId) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.entriesStore], 'readwrite');
            const store = transaction.objectStore(this.entriesStore);
            const request = store.delete(entryId);
            
            request.onsuccess = () => resolve();
            request.onerror = () => reject(request.error);
        });
    }
    
    async exportData() {
        try {
            // Get all routines
            const routines = Array.from(this.routines.values());
            
            // Get all entries
            const entries = await this.getAllEntries();
            
            const exportData = {
                version: '1.0',
                exportDate: new Date().toISOString(),
                routines: routines,
                entries: entries
            };
            
            // Create and download file
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            const url = URL.createObjectURL(dataBlob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `routine-tracker-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showToast('Data exported successfully!', 'success');
        } catch (error) {
            console.error('Error exporting data:', error);
            this.showToast('Error exporting data. Please try again.', 'error');
        }
    }
    
    async importData() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (event) => {
            const file = event.target.files[0];
            if (!file) return;
            
            try {
                const text = await file.text();
                const importData = JSON.parse(text);
                
                // Validate import data
                if (!importData.routines || !importData.entries) {
                    throw new Error('Invalid backup file format');
                }
                
                // Clear existing data
                await this.clearAllData();
                
                // Import routines
                for (const routine of importData.routines) {
                    const id = await this.saveRoutine(routine);
                    routine.id = id;
                    this.routines.set(id, routine);
                }
                
                // Import entries
                for (const entry of importData.entries) {
                    await this.saveEntry(entry.date, entry.routineId, {
                        count: entry.count || 0,
                        isDone: entry.isDone || false
                    });
                }
                
                this.showToast('Data imported successfully!', 'success');
                
                // Refresh displays
                if (this.currentTab === 'today') {
                    this.renderTodayView();
                } else if (this.currentTab === 'routines') {
                    this.renderRoutinesManagement();
                } else if (this.currentTab === 'table') {
                    this.renderTable();
                }
                
            } catch (error) {
                console.error('Error importing data:', error);
                this.showToast('Error importing data. Please check the file format.', 'error');
            }
        };
        
        input.click();
    }
    
    async getAllEntries() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.entriesStore], 'readonly');
            const store = transaction.objectStore(this.entriesStore);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result || []);
            request.onerror = () => reject(request.error);
        });
    }
    
    async clearAllData() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([this.routinesStore, this.entriesStore], 'readwrite');
            
            // Clear routines
            const routinesStore = transaction.objectStore(this.routinesStore);
            const routinesRequest = routinesStore.clear();
            
            // Clear entries
            const entriesStore = transaction.objectStore(this.entriesStore);
            const entriesRequest = entriesStore.clear();
            
            transaction.oncomplete = () => {
                this.routines.clear();
                resolve();
            };
            
            transaction.onerror = () => reject(transaction.error);
        });
    }
    
    async resetDatabase() {
        try {
            await this.clearAllData();
            this.showToast('Database reset successfully!', 'success');
            
            // Clear the routines map
            this.routines.clear();
            
            // Refresh displays
            if (this.currentTab === 'today') {
                this.renderTodayView();
            } else if (this.currentTab === 'routines') {
                this.renderRoutinesManagement();
            } else if (this.currentTab === 'table') {
                this.renderTable();
            }
        } catch (error) {
            console.error('Error resetting database:', error);
            this.showToast('Error resetting database. Please try again.', 'error');
        }
    }
    
    async restoreDefaultRoutines() {
        try {
            console.log('Restoring default routines...');
            await this.addDefaultRoutines();
            this.showToast('Default routines restored!', 'success');
            
            // Refresh displays
            if (this.currentTab === 'today') {
                this.renderTodayView();
            } else if (this.currentTab === 'routines') {
                this.renderRoutinesManagement();
            } else if (this.currentTab === 'table') {
                this.renderTable();
            }
        } catch (error) {
            console.error('Error restoring default routines:', error);
            this.showToast('Error restoring default routines. Please try again.', 'error');
        }
    }
    
    async forceRefresh() {
        try {
            console.log('Starting force refresh...');
            
            // Clear IndexedDB
            await this.clearAllData();
            console.log('IndexedDB cleared');
            
            // Clear browser cache
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('Found caches:', cacheNames);
                await Promise.all(cacheNames.map(name => {
                    console.log('Deleting cache:', name);
                    return caches.delete(name);
                }));
            }
            
            // Clear localStorage and sessionStorage
            localStorage.clear();
            sessionStorage.clear();
            console.log('Local storage cleared');
            
            // Unregister service worker
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log('Found service workers:', registrations.length);
                await Promise.all(registrations.map(registration => {
                    console.log('Unregistering service worker');
                    return registration.unregister();
                }));
            }
            
            // Clear the routines map
            this.routines.clear();
            console.log('Routines map cleared');
            
            // Force page reload with cache busting
            const timestamp = new Date().getTime();
            window.location.href = window.location.href + '?v=' + timestamp;
        } catch (error) {
            console.error('Error during force refresh:', error);
            // Fallback to simple reload
            window.location.reload(true);
        }
    }
    
    async nuclearReset() {
        try {
            console.log('Starting nuclear reset...');
            
            // Clear IndexedDB
            await this.clearAllData();
            console.log('IndexedDB cleared');
            
            // Clear all browser storage
            localStorage.clear();
            sessionStorage.clear();
            console.log('All storage cleared');
            
            // Clear all caches
            if ('caches' in window) {
                const cacheNames = await caches.keys();
                console.log('Found caches:', cacheNames);
                await Promise.all(cacheNames.map(name => {
                    console.log('Deleting cache:', name);
                    return caches.delete(name);
                }));
            }
            
            // Unregister all service workers
            if ('serviceWorker' in navigator) {
                const registrations = await navigator.serviceWorker.getRegistrations();
                console.log('Found service workers:', registrations.length);
                await Promise.all(registrations.map(registration => {
                    console.log('Unregistering service worker');
                    return registration.unregister();
                }));
            }
            
            // Clear the routines map
            this.routines.clear();
            console.log('Routines map cleared');
            
            // Force a complete page reload
            window.location.replace(window.location.href + '?nuclear=' + Date.now());
        } catch (error) {
            console.error('Error during nuclear reset:', error);
            // Ultimate fallback
            window.location.replace(window.location.href);
        }
    }
    
    async deleteAllRoutines() {
        try {
            console.log('Deleting all routines...');
            
            // Clear only the routines store, keep entries
            const transaction = this.db.transaction([this.routinesStore], 'readwrite');
            const store = transaction.objectStore(this.routinesStore);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log('All routines deleted');
                // Clear the routines map
                this.routines.clear();
                
                this.showToast('All routines deleted!', 'success');
                
                // Refresh displays
                if (this.currentTab === 'today') {
                    this.renderTodayView();
                } else if (this.currentTab === 'routines') {
                    this.renderRoutinesManagement();
                } else if (this.currentTab === 'table') {
                    this.renderTable();
                }
            };
            
            request.onerror = () => {
                console.error('Error deleting routines:', request.error);
                this.showToast('Error deleting routines', 'error');
            };
        } catch (error) {
            console.error('Error deleting routines:', error);
            this.showToast('Error deleting routines', 'error');
        }
    }
    
    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Initialize the app when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RoutineTracker();
});

// Add service worker for offline functionality
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}

