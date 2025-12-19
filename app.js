// app.js - Complete Supercharged Life Tracker Pro (With Data Import/Export)
const LifeTrackerApp = {
    init() {
        this.currentDate = new Date();
        this.currentViewMonth = new Date();
        this.hygieneViewMonth = new Date();
        
        this.setupEventListeners();
        this.updateCurrentDate();
        this.initializeApp();
    },

    async initializeApp() {
        try {
            await db.open();
            console.log('Database opened successfully');
            
            this.renderAllPages();
        } catch (error) {
            console.error('Failed to initialize app:', error);
        }
    },

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const targetPage = item.getAttribute('data-page');
                this.showPage(targetPage);
            });
        });

        // Settings button (database view)
        document.getElementById('settingsButton').addEventListener('click', () => {
            this.showPage('database');
        });

        // Data backup button
        document.getElementById('dataBackupButton').addEventListener('click', () => {
            this.showBackupModal();
        });

        // Modal handlers
        this.setupModalHandlers();
        
        // Backup modal handlers
        this.setupBackupModalHandlers();
    },

    setupModalHandlers() {
        // Helper function to safely add event listeners
        const safeAddEventListener = (id, event, handler) => {
            const element = document.getElementById(id);
            if (element) {
                element.addEventListener(event, handler);
            }
        };

        // Dopamine modal
        safeAddEventListener('closeDopamineModal', 'click', () => {
            this.hideModal('dopamineModal');
        });
        safeAddEventListener('cancelDopamineLog', 'click', () => {
            this.hideModal('dopamineModal');
        });
        safeAddEventListener('saveDopamineLog', 'click', () => {
            this.saveDopamineEntry();
        });

        // Habit modal
        safeAddEventListener('closeHabitModal', 'click', () => {
            this.hideModal('habitModal');
        });
        safeAddEventListener('cancelHabit', 'click', () => {
            this.hideModal('habitModal');
        });
        safeAddEventListener('saveHabit', 'click', () => {
            this.saveHabit();
        });

        // Mood modal
        safeAddEventListener('closeMoodModal', 'click', () => {
            this.hideModal('moodModal');
        });
        safeAddEventListener('cancelMoodLog', 'click', () => {
            this.hideModal('moodModal');
        });
        safeAddEventListener('saveMoodLog', 'click', () => {
            this.saveMoodEntry();
        });
    },

    setupBackupModalHandlers() {
        // Backup modal
        document.getElementById('closeBackupModal').addEventListener('click', () => {
            this.hideModal('backupModal');
        });
        
        document.getElementById('cancelBackup').addEventListener('click', () => {
            this.hideModal('backupModal');
        });
        
        // Export data button
        document.getElementById('exportDataBtn').addEventListener('click', () => {
            this.exportAllData();
        });
        
        // Import data button
        document.getElementById('importDataBtn').addEventListener('click', () => {
            this.importData();
        });
        
        // Quick fix button
        document.getElementById('quickFixBtn').addEventListener('click', () => {
            this.quickFixMissingEntry();
        });
        
        // File input change
        document.getElementById('backupFile').addEventListener('change', (e) => {
            const file = e.target.files[0];
            const importBtn = document.getElementById('importDataBtn');
            const uploadInfo = document.getElementById('uploadInfo');
            
            if (file) {
                // Check if it's a JSON file
                if (file.name.endsWith('.json') || file.name.endsWith('.txt')) {
                    uploadInfo.innerHTML = `
                        <div class="file-name">${file.name}</div>
                        <div class="file-size">${this.formatFileSize(file.size)}</div>
                    `;
                    uploadInfo.className = 'upload-info info';
                    uploadInfo.style.display = 'block';
                    importBtn.disabled = false;
                } else {
                    uploadInfo.innerHTML = '❌ Please select a JSON or TXT file';
                    uploadInfo.className = 'upload-info error';
                    uploadInfo.style.display = 'block';
                    importBtn.disabled = true;
                }
            } else {
                uploadInfo.style.display = 'none';
                importBtn.disabled = true;
            }
        });
    },

    updateCurrentDate() {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('currentDate').textContent = 
            this.currentDate.toLocaleDateString('en-US', options);
    },

    showPage(pageId) {
        // Update navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.getAttribute('data-page') === pageId) {
                item.classList.add('active');
            }
        });

        // Show selected page
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageId).classList.add('active');

        // Render page content
        switch(pageId) {
            case 'dashboard':
                this.renderDashboard();
                break;
            case 'dopamine':
                this.renderDopaminePage();
                break;
            case 'hygiene':
                this.renderHygienePage();
                break;
            case 'mood':
                this.renderMoodPage();
                break;
            case 'database':
                this.renderDatabasePage();
                break;
        }
    },

    hideModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    },

    showModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('active');
        }
    },

    formatDate(date) {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    },

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    // Show backup modal
    showBackupModal() {
        this.updateBackupModalStats();
        this.showModal('backupModal');
    },

    async updateBackupModalStats() {
        const stats = await this.getDatabaseStats();
        const statsHTML = `
            <div class="data-summary">
                <div class="data-summary-item">
                    <span class="data-summary-label">Dopamine Entries:</span>
                    <span class="data-summary-value">${stats.dopamineEntries}</span>
                </div>
                <div class="data-summary-item">
                    <span class="data-summary-label">Hygiene Habits:</span>
                    <span class="data-summary-value">${stats.hygieneHabits}</span>
                </div>
                <div class="data-summary-item">
                    <span class="data-summary-label">Mood Entries:</span>
                    <span class="data-summary-value">${stats.moodEntries}</span>
                </div>
                <div class="data-summary-item">
                    <span class="data-summary-label">Total Data:</span>
                    <span class="data-summary-value">${stats.totalSize}</span>
                </div>
            </div>
        `;
        
        const backupSection = document.querySelector('.backup-section');
        if (backupSection) {
            backupSection.insertAdjacentHTML('beforeend', statsHTML);
        }
    },

    async getDatabaseStats() {
        const dopamineEntries = await db.dopamineEntries.toArray();
        const hygieneHabits = await db.hygieneHabits.toArray();
        const moodEntries = await db.moodEntries.toArray();
        const hygieneCompletions = await db.hygieneCompletions.toArray();
        
        // Calculate approximate size
        const allData = JSON.stringify({
            dopamineEntries,
            hygieneHabits,
            moodEntries,
            hygieneCompletions
        });
        
        return {
            dopamineEntries: dopamineEntries.length,
            hygieneHabits: hygieneHabits.length,
            moodEntries: moodEntries.length,
            totalSize: this.formatFileSize(new Blob([allData]).size)
        };
    },

    // EXPORT DATA FUNCTION - This saves all your data to a file
    async exportAllData() {
        try {
            const exportBtn = document.getElementById('exportDataBtn');
            const downloadInfo = document.getElementById('downloadInfo');
            
            // Show loading state
            exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Preparing Download...';
            exportBtn.disabled = true;
            
            // Get all data from the database
            const allData = {
                dopamineEntries: await db.dopamineEntries.toArray(),
                hygieneHabits: await db.hygieneHabits.toArray(),
                moodEntries: await db.moodEntries.toArray(),
                hygieneCompletions: await db.hygieneCompletions.toArray(),
                dailyCompletion: await db.dailyCompletion.toArray(),
                exportDate: new Date().toISOString(),
                appVersion: 'Proj24_V1'
            };
            
            // Create a JSON string
            const dataStr = JSON.stringify(allData, null, 2); // The "2" adds nice formatting
            
            // Create a Blob (like a virtual file)
            const dataBlob = new Blob([dataStr], { type: 'application/json' });
            
            // Create a URL for the blob
            const dataUrl = URL.createObjectURL(dataBlob);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = dataUrl;
            
            // Create filename with current date
            const date = new Date();
            const filename = `life_tracker_backup_${date.getFullYear()}-${date.getMonth()+1}-${date.getDate()}.json`;
            link.download = filename;
            
            // Click the link to download the file
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(dataUrl), 100);
            
            // Show success message
            downloadInfo.innerHTML = `
                <div>✅ Backup downloaded successfully!</div>
                <div class="file-name">${filename}</div>
                <div>You can edit this file in any text editor to fix missing entries.</div>
            `;
            downloadInfo.className = 'download-info success';
            downloadInfo.style.display = 'block';
            
            console.log('Data exported successfully:', allData);
            
        } catch (error) {
            console.error('Error exporting data:', error);
            const downloadInfo = document.getElementById('downloadInfo');
            downloadInfo.innerHTML = '❌ Error exporting data. Please try again.';
            downloadInfo.className = 'download-info error';
            downloadInfo.style.display = 'block';
        } finally {
            // Reset button state
            const exportBtn = document.getElementById('exportDataBtn');
            exportBtn.innerHTML = '<i class="fas fa-download"></i> Download Backup';
            exportBtn.disabled = false;
        }
    },

    // IMPORT DATA FUNCTION - This loads data from a file back into the app
    async importData() {
        const fileInput = document.getElementById('backupFile');
        const file = fileInput.files[0];
        const importBtn = document.getElementById('importDataBtn');
        const uploadInfo = document.getElementById('uploadInfo');
        
        if (!file) {
            uploadInfo.innerHTML = '❌ Please select a backup file first';
            uploadInfo.className = 'upload-info error';
            uploadInfo.style.display = 'block';
            return;
        }
        
        // Ask for confirmation (IMPORTANT!)
        if (!confirm('⚠️ WARNING: This will replace ALL your current data with the backup file data. Continue?')) {
            return;
        }
        
        try {
            // Show loading state
            importBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Restoring Data...';
            importBtn.disabled = true;
            
            // Read the file
            const fileContent = await this.readFileAsText(file);
            
            // Parse the JSON data
            const backupData = JSON.parse(fileContent);
            
            // Validate the backup data structure
            if (!this.isValidBackupData(backupData)) {
                throw new Error('Invalid backup file format');
            }
            
            // Clear all existing data first
            await Promise.all([
                db.dopamineEntries.clear(),
                db.hygieneHabits.clear(),
                db.hygieneCompletions.clear(),
                db.moodEntries.clear(),
                db.dailyCompletion.clear()
            ]);
            
            // Import the data in the correct order
            if (backupData.hygieneHabits) {
                await db.hygieneHabits.bulkAdd(backupData.hygieneHabits);
            }
            
            if (backupData.dopamineEntries) {
                await db.dopamineEntries.bulkAdd(backupData.dopamineEntries);
            }
            
            if (backupData.moodEntries) {
                await db.moodEntries.bulkAdd(backupData.moodEntries);
            }
            
            if (backupData.hygieneCompletions) {
                await db.hygieneCompletions.bulkAdd(backupData.hygieneCompletions);
            }
            
            if (backupData.dailyCompletion) {
                await db.dailyCompletion.bulkAdd(backupData.dailyCompletion);
            }
            
            // Show success message
            uploadInfo.innerHTML = `
                <div>✅ Data restored successfully!</div>
                <div>App will now refresh...</div>
            `;
            uploadInfo.className = 'upload-info success';
            
            // Refresh the app after 2 seconds
            setTimeout(() => {
                this.hideModal('backupModal');
                location.reload(); // Reload the page to show updated data
            }, 2000);
            
            console.log('Data imported successfully');
            
        } catch (error) {
            console.error('Error importing data:', error);
            uploadInfo.innerHTML = `❌ Error: ${error.message}`;
            uploadInfo.className = 'upload-info error';
            uploadInfo.style.display = 'block';
            
            // Reset button state
            importBtn.innerHTML = '<i class="fas fa-upload"></i> Upload & Restore';
            importBtn.disabled = false;
        }
    },

    // Helper function to read file as text
    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (event) => resolve(event.target.result);
            reader.onerror = (error) => reject(error);
            reader.readAsText(file);
        });
    },

    // Validate backup data structure
    isValidBackupData(data) {
        // Check if it has at least some expected structure
        return typeof data === 'object' && 
               (Array.isArray(data.dopamineEntries) || 
                Array.isArray(data.hygieneHabits) || 
                Array.isArray(data.moodEntries));
    },

    // Quick fix for missing entries (simple version)
    async quickFixMissingEntry() {
        const dateInput = document.getElementById('quickFixDate');
        const statusSelect = document.getElementById('quickFixStatus');
        
        const date = dateInput.value;
        const status = statusSelect.value;
        
        if (!date) {
            alert('Please select a date');
            return;
        }
        
        if (!status) {
            alert('Please select a dopamine status');
            return;
        }
        
        try {
            // Check if entry already exists
            const existingEntry = await db.dopamineEntries.where('date').equals(date).first();
            
            if (existingEntry) {
                if (!confirm(`An entry already exists for ${date}. Update it?`)) {
                    return;
                }
                await db.dopamineEntries.update(existingEntry.id, {
                    status,
                    createdAt: new Date()
                });
            } else {
                await db.dopamineEntries.add({
                    date,
                    status,
                    notes: 'Added via quick fix',
                    createdAt: new Date()
                });
            }
            
            // Update today's completion
            await this.updateDailyCompletion();
            
            alert(`✅ Entry added/updated for ${date}`);
            
            // Clear inputs
            dateInput.value = '';
            statusSelect.value = '';
            
            // Refresh pages
            this.renderDashboard();
            this.renderDopaminePage();
            
        } catch (error) {
            console.error('Error in quick fix:', error);
            alert('Error adding entry. Please try again.');
        }
    },

    // Enhanced Dashboard with Dark Aesthetic (No Workout or Focus Time)
    async renderDashboard() {
        const today = this.formatDate(new Date());
        const currentStreak = await this.calculateCurrentStreak();
        const completionRate = await this.calculateTodayCompletion(today);
        const todayMood = await this.getTodayMood();

        const dashboardEl = document.getElementById('dashboard');
        dashboardEl.innerHTML = `
            <div class="welcome-card" style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d); border: 1px solid #333;">
                <h2 style="color: #fff;">Welcome to Life Tracker Pro!</h2>
                <p style="color: #ccc;">Your supercharged productivity companion</p>
                <div class="stats-grid">
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="currentStreak" style="color: #4CAF50;">${currentStreak}</div>
                        <div class="stat-label" style="color: #888;">Day Streak</div>
                    </div>
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="todayCompletion" style="color: #2196F3;">${completionRate}%</div>
                        <div class="stat-label" style="color: #888;">Today's Progress</div>
                    </div>
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="moodScore" style="color: #9C27B0;">${todayMood ? `${todayMood.mood}/5` : '-'}</div>
                        <div class="stat-label" style="color: #888;">Today's Mood</div>
                    </div>
                    <div class="stat-card" style="background: rgba(40, 40, 40, 0.8);">
                        <div class="stat-value" id="habitsCount" style="color: #FF9800;">${await this.getTotalHabits()}</div>
                        <div class="stat-label" style="color: #888;">Total Habits</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Quick Actions</div>
                </div>
                <div class="module-card" data-page="dopamine">
                    <div class="module-icon" style="background: #405DE6;">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Dopamine Control</div>
                        <div class="module-desc">Track your daily progress</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
                
                <div class="module-card" data-page="hygiene">
                    <div class="module-icon" style="background: #0095F6;">
                        <i class="fas fa-shower"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Personal Hygiene</div>
                        <div class="module-desc">Daily routine tracker</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>

                <div class="module-card" data-page="mood">
                    <div class="module-icon" style="background: #C13584;">
                        <i class="fas fa-heart"></i>
                    </div>
                    <div class="module-info">
                        <div class="module-title">Mood & Energy</div>
                        <div class="module-desc">Track how you feel</div>
                    </div>
                    <div class="module-arrow">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>

            <!-- Quick Mood Log -->
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Quick Mood Check</div>
                </div>
                <div class="mood-quick-actions">
                    <div class="mood-btn" data-mood="5" data-energy="5" data-numb="1">
                        <div class="mood-emoji">😊</div>
                        <div class="mood-label">Great</div>
                    </div>
                    <div class="mood-btn" data-mood="4" data-energy="4" data-numb="2">
                        <div class="mood-emoji">😄</div>
                        <div class="mood-label">Good</div>
                    </div>
                    <div class="mood-btn" data-mood="3" data-energy="3" data-numb="3">
                        <div class="mood-emoji">😐</div>
                        <div class="mood-label">Okay</div>
                    </div>
                    <div class="mood-btn" data-mood="2" data-energy="2" data-numb="4">
                        <div class="mood-emoji">😔</div>
                        <div class="mood-label">Low</div>
                    </div>
                    <div class="mood-btn" data-mood="1" data-energy="1" data-numb="5">
                        <div class="mood-emoji">😢</div>
                        <div class="mood-label">Poor</div>
                    </div>
                </div>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Monthly Overview</div>
                </div>
                <div class="calendar-container" id="dashboardCalendar">
                    <!-- Calendar will be populated by JavaScript -->
                </div>
            </div>
        `;

        // Add event listeners for dashboard modules
        dashboardEl.querySelectorAll('.module-card').forEach(card => {
            card.addEventListener('click', () => {
                const targetPage = card.getAttribute('data-page');
                this.showPage(targetPage);
            });
        });

        // Add event listeners for quick mood buttons
        dashboardEl.querySelectorAll('.mood-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const mood = parseInt(btn.getAttribute('data-mood'));
                const energy = parseInt(btn.getAttribute('data-energy'));
                const numb = parseInt(btn.getAttribute('data-numb'));
                this.quickLogMood(mood, energy, numb);
            });
        });

        this.renderDashboardCalendar();
    },

    async renderDashboardCalendar() {
        const calendarEl = document.getElementById('dashboardCalendar');
        if (!calendarEl) return;

        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        let calendarHTML = `
            <div class="calendar-header">
                <div class="calendar-month">${now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                <div class="calendar-nav">
                    <div class="calendar-nav-btn" id="prevDashboardMonth">
                        <i class="fas fa-chevron-left"></i>
                    </div>
                    <div class="calendar-nav-btn" id="nextDashboardMonth">
                        <i class="fas fa-chevron-right"></i>
                    </div>
                </div>
            </div>
            <div class="calendar">
        `;
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === now.getDate() && now.getMonth() === new Date().getMonth() && now.getFullYear() === new Date().getFullYear()) {
                dayClass += ' current';
            }
            
            // Calculate completion for this day and color code
            const completion = await this.calculateTodayCompletion(dateKey);
            if (completion >= 75) {
                dayClass += ' passed'; // Green
            } else if (completion >= 50) {
                dayClass += ' warning'; // Orange
            } else if (completion > 0) {
                dayClass += ' failed'; // Red
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}" style="cursor: pointer;" title="${completion}% completion">
                    <div class="day-number">${i}</div>
                    ${completion > 0 ? `<div class="day-completion" style="font-size: 8px; margin-top: 2px;">${completion}%</div>` : ''}
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        calendarEl.innerHTML = calendarHTML;

        // Add event listeners for dashboard calendar navigation
        const prevBtn = document.getElementById('prevDashboardMonth');
        const nextBtn = document.getElementById('nextDashboardMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                now.setMonth(now.getMonth() - 1);
                this.renderDashboardCalendar();
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                now.setMonth(now.getMonth() + 1);
                this.renderDashboardCalendar();
            });
        }

        // Add click handlers for calendar days
        calendarEl.querySelectorAll('.calendar-day[data-date]').forEach(day => {
            day.addEventListener('click', () => {
                const date = day.getAttribute('data-date');
                this.showDayDetails(date);
            });
        });
    },

    async showDayDetails(date) {
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        const hygieneCompletions = await db.hygieneCompletions.where('date').equals(date).toArray();
        const moodEntry = await db.moodEntries.where('date').equals(date).first();
        const habits = await db.hygieneHabits.toArray();
        
        const completedHabits = habits.filter(habit => 
            hygieneCompletions.some(completion => completion.habitId === habit.id && completion.completed)
        );
        const missedHabits = habits.filter(habit => 
            !hygieneCompletions.some(completion => completion.habitId === habit.id && completion.completed)
        );
        
        const completionRate = await this.calculateTodayCompletion(date);
        
        let detailsHTML = `
            <div class="modal active" id="dayDetailsModal">
                <div class="modal-content">
                    <div class="modal-header">
                        <div class="modal-title">Daily Overview - ${new Date(date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
                        <div class="modal-close" id="closeDayDetails">
                            <i class="fas fa-times"></i>
                        </div>
                    </div>
                    <div class="modal-body">
                        <div class="completion-summary" style="text-align: center; margin-bottom: 20px;">
                            <div style="font-size: 24px; font-weight: bold; color: ${completionRate >= 75 ? '#4CAF50' : completionRate >= 50 ? '#FF9800' : '#F44336'};">${completionRate}%</div>
                            <div style="color: #888; font-size: 14px;">Overall Completion</div>
                        </div>
                        
                        <div class="day-section">
                            <h4 style="margin-bottom: 10px;">Dopamine Control</h4>
                            <div class="status-badge ${dopamineEntry ? (dopamineEntry.status === 'passed' ? 'status-passed' : 'status-failed') : 'status-missing'}">
                                ${dopamineEntry ? (dopamineEntry.status === 'passed' ? '✅ Successful Day' : '❌ Challenging Day') : '❓ Not Logged'}
                            </div>
                            ${dopamineEntry && dopamineEntry.notes ? `<div style="margin-top: 5px; color: #888; font-size: 14px;">${dopamineEntry.notes}</div>` : ''}
                        </div>
                        
                        <div class="day-section">
                            <h4 style="margin-bottom: 10px;">Hygiene Habits</h4>
                            <div style="margin-bottom: 10px;">
                                <strong>Completed (${completedHabits.length}/${habits.length}):</strong>
                                ${completedHabits.length > 0 ? completedHabits.map(habit => `<div style="color: #4CAF50; margin: 2px 0;">✓ ${habit.name}</div>`).join('') : '<div style="color: #888;">No habits completed</div>'}
                            </div>
                            <div>
                                <strong>Missed:</strong>
                                ${missedHabits.length > 0 ? missedHabits.map(habit => `<div style="color: #F44336; margin: 2px 0;">✗ ${habit.name}</div>`).join('') : '<div style="color: #4CAF50;">All habits completed!</div>'}
                            </div>
                        </div>
                        
                        ${moodEntry ? `
                        <div class="day-section">
                            <h4 style="margin-bottom: 10px;">Mood & Energy</h4>
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 10px;">
                                <div style="text-align: center;">
                                    <div style="font-size: 20px;">${this.getMoodEmoji(moodEntry.mood)}</div>
                                    <div style="font-size: 12px; color: #888;">Mood: ${moodEntry.mood}/5</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 20px;">⚡</div>
                                    <div style="font-size: 12px; color: #888;">Energy: ${moodEntry.energy}/5</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 20px;">❄️</div>
                                    <div style="font-size: 12px; color: #888;">Numb: ${moodEntry.numb}/5</div>
                                </div>
                            </div>
                            ${moodEntry.notes ? `<div style="margin-top: 10px; color: #888; font-size: 14px;">${moodEntry.notes}</div>` : ''}
                        </div>
                        ` : ''}
                        
                        <div class="form-actions" style="margin-top: 20px;">
                            <button class="btn btn-secondary" id="closeDayDetailsBtn">Close</button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Create modal element
        const modalContainer = document.createElement('div');
        modalContainer.innerHTML = detailsHTML;
        document.body.appendChild(modalContainer);
        
        // Add event listeners
        document.getElementById('closeDayDetails').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
        
        document.getElementById('closeDayDetailsBtn').addEventListener('click', () => {
            document.body.removeChild(modalContainer);
        });
    },

    // Dopamine Page (fully functional)
    async renderDopaminePage() {
        const dopamineEl = document.getElementById('dopamine');
        const currentStreak = await this.calculateCurrentStreak();
        const longestStreak = await this.calculateLongestStreak();
        const recentEntries = await this.getRecentDopamineEntries();

        dopamineEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Dopamine Control</div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.currentViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevDopamineMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextDopamineMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="dopamineCalendar">
                        ${await this.renderDopamineCalendar()}
                    </div>
                </div>
                
                <div class="streak-display">
                    <div class="streak-info">
                        <div class="streak-value">${currentStreak}</div>
                        <div class="streak-label">Current Streak</div>
                    </div>
                    <div class="streak-info">
                        <div class="streak-value">${longestStreak}</div>
                        <div class="streak-label">Longest Streak</div>
                    </div>
                </div>
                
                <button class="btn btn-primary" id="logDopamineStatus">
                    <i class="fas fa-plus"></i> Log Today's Status
                </button>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Recent Entries</div>
                </div>
                <div id="dopamineEntries">
                    ${recentEntries.length > 0 ? recentEntries : `
                        <div class="empty-state">
                            <i class="fas fa-brain"></i>
                            <p>No entries yet</p>
                            <p>Start tracking your progress today!</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        // Add event listeners
        const prevBtn = document.getElementById('prevDopamineMonth');
        const nextBtn = document.getElementById('nextDopamineMonth');
        const logBtn = document.getElementById('logDopamineStatus');

        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() - 1);
                this.renderDopaminePage();
            });
        }

        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentViewMonth.setMonth(this.currentViewMonth.getMonth() + 1);
                this.renderDopaminePage();
            });
        }

        if (logBtn) {
            logBtn.addEventListener('click', () => {
                this.showDopamineModal();
            });
        }

        // Add click handlers for entries
        dopamineEl.querySelectorAll('.edit-dopamine').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const entryId = parseInt(btn.getAttribute('data-id'));
                this.editDopamineEntry(entryId);
            });
        });
    },

    async renderDopamineCalendar() {
        const firstDay = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth(), 1);
        const lastDay = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.currentViewMonth.getFullYear(), this.currentViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.currentViewMonth.getMonth() === today.getMonth() && this.currentViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check dopamine status for this day
            const dopamineEntry = await db.dopamineEntries.where('date').equals(dateKey).first();
            if (dopamineEntry) {
                dayClass += dopamineEntry.status === 'passed' ? ' passed' : ' failed';
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}">
                    <div class="day-number">${i}</div>
                </div>
            `;
        }
        
        return calendarHTML;
    },

    showDopamineModal(entry = null) {
        const today = this.formatDate(new Date());
        const dateInput = document.getElementById('dopamineDate');
        const statusInput = document.getElementById('dopamineStatus');
        const notesInput = document.getElementById('dopamineNotes');
        const saveBtn = document.getElementById('saveDopamineLog');
        const modalTitle = document.querySelector('#dopamineModal .modal-title');

        if (dateInput && statusInput && notesInput && saveBtn && modalTitle) {
            dateInput.value = entry ? entry.date : today;
            statusInput.value = entry ? entry.status : 'passed';
            notesInput.value = entry ? entry.notes : '';
            
            if (entry) {
                modalTitle.textContent = 'Edit Dopamine Entry';
                saveBtn.setAttribute('data-edit-id', entry.id);
            } else {
                modalTitle.textContent = 'Log Dopamine Status';
                saveBtn.removeAttribute('data-edit-id');
            }
            
            this.showModal('dopamineModal');
        }
    },

    async saveDopamineEntry() {
        const dateInput = document.getElementById('dopamineDate');
        const statusInput = document.getElementById('dopamineStatus');
        const notesInput = document.getElementById('dopamineNotes');
        const saveBtn = document.getElementById('saveDopamineLog');

        if (!dateInput || !statusInput || !notesInput || !saveBtn) return;

        const date = dateInput.value;
        const status = statusInput.value;
        const notes = notesInput.value;
        const editId = saveBtn.getAttribute('data-edit-id');

        if (!date) {
            alert('Please select a date');
            return;
        }

        try {
            if (editId) {
                // Update existing entry
                await db.dopamineEntries.update(parseInt(editId), {
                    date,
                    status,
                    notes,
                    createdAt: new Date()
                });
            } else {
                // Create new entry
                await db.dopamineEntries.add({
                    date,
                    status,
                    notes,
                    createdAt: new Date()
                });
            }

            this.hideModal('dopamineModal');
            this.renderDopaminePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error saving dopamine entry:', error);
            alert('Error saving entry. Please try again.');
        }
    },

    async getRecentDopamineEntries() {
        const entries = await db.dopamineEntries.orderBy('date').reverse().limit(5).toArray();
        
        return entries.map(entry => `
            <div class="log-entry">
                <div class="log-date">
                    ${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                    <div class="log-actions">
                        <div class="log-action edit-dopamine" data-id="${entry.id}">
                            <i class="fas fa-edit"></i>
                        </div>
                    </div>
                </div>
                <div class="log-status ${entry.status === 'passed' ? 'status-passed' : 'status-failed'}">
                    ${entry.status === 'passed' ? 'Successful Day' : 'Challenging Day'}
                </div>
                <div class="log-notes">${entry.notes || 'No notes'}</div>
            </div>
        `).join('');
    },

    async editDopamineEntry(entryId) {
        const entry = await db.dopamineEntries.get(entryId);
        if (entry) {
            this.showDopamineModal(entry);
        }
    },

    // Enhanced Hygiene Page with Individual Habit Tracking
    async renderHygienePage() {
        const hygieneEl = document.getElementById('hygiene');
        const habits = await db.hygieneHabits.toArray();
        const today = this.formatDate(new Date());
        const completionRate = await this.calculateHygieneCompletion(today);

        let habitsHTML = '';
        for (const habit of habits) {
            const completed = await this.isHabitCompletedToday(habit.id);
            habitsHTML += `
                <div class="habit-item ${completed ? 'swipe-completed' : ''}" data-habit-id="${habit.id}">
                    <div class="habit-icon">
                        <i class="fas fa-${this.getHabitIcon(habit.name)}"></i>
                    </div>
                    <div class="habit-info">
                        <div class="habit-name">${habit.name}</div>
                        <div class="habit-desc">${habit.description}</div>
                    </div>
                    <div class="habit-check ${completed ? 'completed' : ''}">
                        <i class="fas fa-check"></i>
                    </div>
                </div>
            `;
        }

        hygieneEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Daily Hygiene</div>
                </div>
                
                ${habitsHTML || `
                    <div class="empty-state">
                        <i class="fas fa-shower"></i>
                        <p>No habits added yet</p>
                    </div>
                `}
                
                <div class="completion-card" style="background: linear-gradient(135deg, #1a1a1a, #2d2d2d);">
                    <div class="completion-value">${completionRate}%</div>
                    <div class="completion-label">Today's Completion</div>
                </div>
            </div>
            
            <button class="btn btn-primary" id="addHygieneHabit">
                <i class="fas fa-plus"></i> Add New Habit
            </button>

            <div class="card mt-20">
                <div class="card-header">
                    <div class="card-title">Monthly Hygiene Calendar</div>
                </div>
                
                <div class="calendar-container">
                    <div class="calendar-header">
                        <div class="calendar-month">${this.hygieneViewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</div>
                        <div class="calendar-nav">
                            <div class="calendar-nav-btn" id="prevHygieneMonth">
                                <i class="fas fa-chevron-left"></i>
                            </div>
                            <div class="calendar-nav-btn" id="nextHygieneMonth">
                                <i class="fas fa-chevron-right"></i>
                            </div>
                        </div>
                    </div>
                    
                    <div class="calendar" id="hygieneCalendar">
                        ${await this.renderHygieneCalendar()}
                    </div>
                </div>
            </div>

            <div class="card mt-20">
                <div class="card-header">
                    <div class="card-title">Individual Habit Calendars</div>
                </div>
                <div id="individualHabitCalendars">
                    ${await this.renderIndividualHabitCalendars()}
                </div>
            </div>
        `;

        // Add event listeners
        const addHabitBtn = document.getElementById('addHygieneHabit');
        const prevMonthBtn = document.getElementById('prevHygieneMonth');
        const nextMonthBtn = document.getElementById('nextHygieneMonth');

        if (addHabitBtn) {
            addHabitBtn.addEventListener('click', () => {
                this.showHabitModal();
            });
        }

        if (prevMonthBtn) {
            prevMonthBtn.addEventListener('click', () => {
                this.hygieneViewMonth.setMonth(this.hygieneViewMonth.getMonth() - 1);
                this.renderHygienePage();
            });
        }

        if (nextMonthBtn) {
            nextMonthBtn.addEventListener('click', () => {
                this.hygieneViewMonth.setMonth(this.hygieneViewMonth.getMonth() + 1);
                this.renderHygienePage();
            });
        }

        // Add click handlers for habits
        hygieneEl.querySelectorAll('.habit-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const habitId = parseInt(item.getAttribute('data-habit-id'));
                const completed = item.classList.contains('swipe-completed');
                this.toggleHabitCompletion(habitId, !completed);
            });
        });

        // Add click handlers for habit calendars
        hygieneEl.querySelectorAll('.habit-calendar-day').forEach(day => {
            day.addEventListener('click', (e) => {
                const habitId = parseInt(day.getAttribute('data-habit-id'));
                const date = day.getAttribute('data-date');
                this.toggleHabitCompletionForDate(habitId, date);
            });
        });
    },

    async renderIndividualHabitCalendars() {
        const habits = await db.hygieneHabits.toArray();
        let calendarsHTML = '';
        
        for (const habit of habits) {
            const habitCompletions = await db.hygieneCompletions
                .where('habitId').equals(habit.id)
                .toArray();
                
            calendarsHTML += `
                <div class="habit-calendar">
                    <h4 style="margin: 15px 0 10px 0; color: #fff;">${habit.name}</h4>
                    <div class="mini-calendar">
                        ${await this.renderMiniHabitCalendar(habit.id, habitCompletions)}
                    </div>
                </div>
            `;
        }
        
        return calendarsHTML;
    },

    async renderMiniHabitCalendar(habitId, completions) {
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        
        let calendarHTML = '<div class="mini-calendar-grid">';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="mini-calendar-header">${day}</div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="mini-calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(now.getFullYear(), now.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            
            const completion = completions.find(c => c.date === dateKey);
            const isCompleted = completion && completion.completed;
            const isToday = i === now.getDate() && now.getMonth() === new Date().getMonth();
            
            let dayClass = 'mini-calendar-day';
            if (isToday) dayClass += ' today';
            if (isCompleted) dayClass += ' completed';
            
            calendarHTML += `
                <div class="${dayClass}" data-habit-id="${habitId}" data-date="${dateKey}">
                    ${i}
                </div>
            `;
        }
        
        calendarHTML += '</div>';
        return calendarHTML;
    },

    async toggleHabitCompletionForDate(habitId, date) {
        try {
            // Check if completion record already exists for this date
            const existingCompletion = await db.hygieneCompletions
                .where('habitId').equals(habitId)
                .and(item => item.date === date)
                .first();

            if (existingCompletion) {
                await db.hygieneCompletions.update(existingCompletion.id, { 
                    completed: !existingCompletion.completed,
                    createdAt: new Date()
                });
            } else {
                await db.hygieneCompletions.add({
                    habitId,
                    date: date,
                    completed: true,
                    createdAt: new Date()
                });
            }

            this.renderHygienePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error toggling habit completion for date:', error);
        }
    },

    getHabitIcon(habitName) {
        const icons = {
            'Brush Teeth': 'tooth',
            'Face Wash': 'water',
            'Bath / Shower': 'bath',
            'Hair Care': 'wind',
            'Perfume / Cologne': 'spray-can'
        };
        return icons[habitName] || 'check-circle';
    },

    async toggleHabitCompletion(habitId, completed) {
        const today = this.formatDate(new Date());
        
        try {
            // Check if completion record already exists for today
            const existingCompletion = await db.hygieneCompletions
                .where('habitId').equals(habitId)
                .and(item => item.date === today)
                .first();

            if (existingCompletion) {
                await db.hygieneCompletions.update(existingCompletion.id, { 
                    completed,
                    createdAt: new Date()
                });
            } else {
                await db.hygieneCompletions.add({
                    habitId,
                    date: today,
                    completed,
                    createdAt: new Date()
                });
            }

            await this.updateDailyCompletion();
            this.renderHygienePage();
            this.renderDashboard();
        } catch (error) {
            console.error('Error toggling habit completion:', error);
        }
    },

    async isHabitCompletedToday(habitId) {
        const today = this.formatDate(new Date());
        const completion = await db.hygieneCompletions
            .where('habitId').equals(habitId)
            .and(item => item.date === today)
            .first();
        
        return completion ? completion.completed : false;
    },

    async calculateHygieneCompletion(date) {
        const habits = await db.hygieneHabits.toArray();
        const completions = await db.hygieneCompletions.where('date').equals(date).toArray();
        
        let completedCount = 0;
        habits.forEach(habit => {
            const completion = completions.find(c => c.habitId === habit.id);
            if (completion && completion.completed) {
                completedCount++;
            }
        });
        
        return habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;
    },

    async renderHygieneCalendar() {
        const firstDay = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth(), 1);
        const lastDay = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth() + 1, 0);
        const today = new Date();
        
        let calendarHTML = '';
        
        // Day headers
        const days = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
        days.forEach(day => {
            calendarHTML += `<div class="calendar-day empty"><div class="day-name">${day}</div></div>`;
        });
        
        // Empty days before first day of month
        for (let i = 0; i < firstDay.getDay(); i++) {
            calendarHTML += '<div class="calendar-day empty"></div>';
        }
        
        // Days of the month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const dayDate = new Date(this.hygieneViewMonth.getFullYear(), this.hygieneViewMonth.getMonth(), i);
            const dateKey = this.formatDate(dayDate);
            let dayClass = 'calendar-day future';
            
            // Check if it's today
            if (i === today.getDate() && this.hygieneViewMonth.getMonth() === today.getMonth() && this.hygieneViewMonth.getFullYear() === today.getFullYear()) {
                dayClass += ' current';
            }
            
            // Check hygiene completion for this day
            const completionRate = await this.calculateHygieneCompletion(dateKey);
            if (completionRate >= 80) {
                dayClass += ' passed';
            } else if (completionRate >= 50) {
                dayClass += ' warning';
            } else if (completionRate > 0) {
                dayClass += ' failed';
            }
            
            calendarHTML += `
                <div class="${dayClass}" data-date="${dateKey}" style="cursor: pointer;">
                    <div class="day-number">${i}</div>
                    ${completionRate > 0 ? `<div class="day-completion" style="font-size: 8px; margin-top: 2px;">${completionRate}%</div>` : ''}
                </div>
            `;
        }
        
        return calendarHTML;
    },

    showHabitModal() {
        const habitNameInput = document.getElementById('habitName');
        const habitDescriptionInput = document.getElementById('habitDescription');

        if (habitNameInput && habitDescriptionInput) {
            habitNameInput.value = '';
            habitDescriptionInput.value = '';
            this.showModal('habitModal');
        }
    },

    async saveHabit() {
        const habitNameInput = document.getElementById('habitName');
        const habitDescriptionInput = document.getElementById('habitDescription');

        if (!habitNameInput || !habitDescriptionInput) return;

        const name = habitNameInput.value;
        const description = habitDescriptionInput.value;

        if (!name) {
            alert('Please enter a habit name');
            return;
        }

        try {
            // Get the next order value
            const habits = await db.hygieneHabits.toArray();
            const nextOrder = habits.length > 0 ? Math.max(...habits.map(h => h.order)) + 1 : 1;

            await db.hygieneHabits.add({
                name,
                description,
                order: nextOrder,
                createdAt: new Date()
            });

            this.hideModal('habitModal');
            this.renderHygienePage();
        } catch (error) {
            console.error('Error saving habit:', error);
            alert('Error saving habit. Please try again.');
        }
    },

    // Mood Tracking
    async renderMoodPage() {
        const moodEl = document.getElementById('mood');
        const todayMood = await this.getTodayMood();
        const moodHistory = await this.getMoodHistory();

        moodEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">How are you feeling today?</div>
                </div>
                <div class="mood-current">
                    ${todayMood ? `
                        <div class="mood-summary">
                            <div class="mood-emoji-large">${this.getMoodEmoji(todayMood.mood)}</div>
                            <div class="mood-details">
                                <div class="mood-date">Today's Mood</div>
                                <div class="mood-metrics">
                                    <div class="mood-metric">Mood: <span>${todayMood.mood}/5</span></div>
                                    <div class="mood-metric">Energy: <span>${todayMood.energy}/5</span></div>
                                    <div class="mood-metric">Numbness: <span>${todayMood.numb}/5</span></div>
                                </div>
                            </div>
                        </div>
                    ` : `
                        <div class="empty-state">
                            <i class="fas fa-heart"></i>
                            <p>No mood logged today</p>
                            <p>How are you feeling?</p>
                        </div>
                    `}
                </div>
                <button class="btn btn-primary" id="logMoodButton">
                    <i class="fas fa-plus"></i> ${todayMood ? 'Update' : 'Log'} Today's Mood
                </button>
            </div>

            <div class="card">
                <div class="card-header">
                    <div class="card-title">Mood History</div>
                </div>
                <div class="mood-history">
                    ${moodHistory.length > 0 ? moodHistory.map(entry => `
                        <div class="mood-entry">
                            <div class="mood-emoji-large">${this.getMoodEmoji(entry.mood)}</div>
                            <div class="mood-details">
                                <div class="mood-date">${new Date(entry.date).toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</div>
                                <div class="mood-metrics">
                                    <div class="mood-metric">Mood: <span>${entry.mood}/5</span></div>
                                    <div class="mood-metric">Energy: <span>${entry.energy}/5</span></div>
                                    <div class="mood-metric">Numbness: <span>${entry.numb}/5</span></div>
                                </div>
                                ${entry.notes ? `<div class="mood-notes">${entry.notes}</div>` : ''}
                            </div>
                        </div>
                    `).join('') : `
                        <div class="empty-state">
                            <p>No mood history yet</p>
                        </div>
                    `}
                </div>
            </div>
        `;

        const logMoodBtn = document.getElementById('logMoodButton');
        if (logMoodBtn) {
            logMoodBtn.addEventListener('click', () => {
                this.showMoodModal();
            });
        }
    },

    getMoodEmoji(mood) {
        const emojis = ['😢', '😔', '😐', '😄', '😊'];
        return emojis[mood - 1] || '😐';
    },

    async getTodayMood() {
        const today = this.formatDate(new Date());
        return await db.moodEntries.where('date').equals(today).first();
    },

    async getMoodHistory() {
        return await db.moodEntries.orderBy('date').reverse().limit(10).toArray();
    },

    showMoodModal(entry = null) {
        const today = this.formatDate(new Date());
        const dateInput = document.getElementById('moodDate');
        const moodInput = document.getElementById('moodLevel');
        const energyInput = document.getElementById('energyLevel');
        const numbInput = document.getElementById('numbLevel');
        const notesInput = document.getElementById('moodNotes');

        if (dateInput && moodInput && energyInput && numbInput && notesInput) {
            dateInput.value = entry ? entry.date : today;
            moodInput.value = entry ? entry.mood : 3;
            energyInput.value = entry ? entry.energy : 3;
            numbInput.value = entry ? entry.numb : 3;
            notesInput.value = entry ? entry.notes : '';
            
            this.showModal('moodModal');
        }
    },

    async quickLogMood(mood, energy, numb) {
        const today = this.formatDate(new Date());
        
        try {
            const existingEntry = await db.moodEntries.where('date').equals(today).first();
            
            if (existingEntry) {
                await db.moodEntries.update(existingEntry.id, {
                    mood,
                    energy,
                    numb,
                    createdAt: new Date()
                });
            } else {
                await db.moodEntries.add({
                    date: today,
                    mood,
                    energy,
                    numb,
                    notes: '',
                    createdAt: new Date()
                });
            }
            
            this.renderDashboard();
            this.renderMoodPage();
            alert('Mood logged successfully!');
        } catch (error) {
            console.error('Error logging mood:', error);
            alert('Error logging mood. Please try again.');
        }
    },

    async saveMoodEntry() {
        const dateInput = document.getElementById('moodDate');
        const moodInput = document.getElementById('moodLevel');
        const energyInput = document.getElementById('energyLevel');
        const numbInput = document.getElementById('numbLevel');
        const notesInput = document.getElementById('moodNotes');

        if (!dateInput || !moodInput || !energyInput || !numbInput || !notesInput) return;

        const date = dateInput.value;
        const mood = parseInt(moodInput.value);
        const energy = parseInt(energyInput.value);
        const numb = parseInt(numbInput.value);
        const notes = notesInput.value;

        if (!date) {
            alert('Please select a date');
            return;
        }

        try {
            const existingEntry = await db.moodEntries.where('date').equals(date).first();
            
            if (existingEntry) {
                await db.moodEntries.update(existingEntry.id, {
                    mood,
                    energy,
                    numb,
                    notes,
                    createdAt: new Date()
                });
            } else {
                await db.moodEntries.add({
                    date,
                    mood,
                    energy,
                    numb,
                    notes,
                    createdAt: new Date()
                });
            }

            this.hideModal('moodModal');
            this.renderDashboard();
            this.renderMoodPage();
        } catch (error) {
            console.error('Error saving mood entry:', error);
            alert('Error saving mood entry. Please try again.');
        }
    },

    // Database Page with Delete Functionality (No Workout Section)
    async renderDatabasePage() {
        const databaseEl = document.getElementById('database');
        
        const dopamineEntries = await db.dopamineEntries.toArray();
        const hygieneHabits = await db.hygieneHabits.toArray();
        const moodEntries = await db.moodEntries.toArray();
        const hygieneCompletions = await db.hygieneCompletions.toArray();

        databaseEl.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <div class="card-title">Database Viewer</div>
                    <button class="btn btn-secondary" id="clearAllData">
                        <i class="fas fa-trash"></i> Clear All Data
                    </button>
                </div>
                
                <div class="database-section">
                    <h3>Dopamine Entries (${dopamineEntries.length})</h3>
                    <div class="database-table-container">
                        ${dopamineEntries.length > 0 ? dopamineEntries.map(entry => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-date">${entry.date}</div>
                                    <div class="entry-status ${entry.status === 'passed' ? 'status-passed' : 'status-failed'}">
                                        ${entry.status === 'passed' ? '✅ Successful' : '❌ Challenging'}
                                    </div>
                                </div>
                                <div class="entry-notes">${entry.notes || 'No notes'}</div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-secondary edit-entry" data-type="dopamine" data-id="${entry.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-small btn-danger delete-entry" data-type="dopamine" data-id="${entry.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No dopamine entries</div>'}
                    </div>
                </div>

                <div class="database-section">
                    <h3>Hygiene Habits (${hygieneHabits.length})</h3>
                    <div class="database-table-container">
                        ${hygieneHabits.length > 0 ? hygieneHabits.map(habit => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-name">${habit.name}</div>
                                    <div class="entry-desc">${habit.description}</div>
                                </div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-danger delete-entry" data-type="hygiene" data-id="${habit.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No hygiene habits</div>'}
                    </div>
                </div>

                <div class="database-section">
                    <h3>Hygiene Completions (${hygieneCompletions.length})</h3>
                    <div class="database-table-container">
                        ${hygieneCompletions.length > 0 ? hygieneCompletions.map(completion => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-date">${completion.date}</div>
                                    <div class="entry-status ${completion.completed ? 'status-passed' : 'status-failed'}">
                                        ${completion.completed ? '✅ Completed' : '❌ Missed'}
                                    </div>
                                </div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-danger delete-entry" data-type="hygieneCompletion" data-id="${completion.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No hygiene completions</div>'}
                    </div>
                </div>

                <div class="database-section">
                    <h3>Mood Entries (${moodEntries.length})</h3>
                    <div class="database-table-container">
                        ${moodEntries.length > 0 ? moodEntries.map(entry => `
                            <div class="database-entry">
                                <div class="entry-main">
                                    <div class="entry-date">${entry.date}</div>
                                    <div class="entry-mood">
                                        Mood: ${this.getMoodEmoji(entry.mood)} ${entry.mood}/5 | 
                                        Energy: ${entry.energy}/5 | 
                                        Numb: ${entry.numb}/5
                                    </div>
                                </div>
                                <div class="entry-notes">${entry.notes || 'No notes'}</div>
                                <div class="entry-actions">
                                    <button class="btn btn-small btn-secondary edit-entry" data-type="mood" data-id="${entry.id}">
                                        <i class="fas fa-edit"></i>
                                    </button>
                                    <button class="btn btn-small btn-danger delete-entry" data-type="mood" data-id="${entry.id}">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('') : '<div class="empty-state">No mood entries</div>'}
                    </div>
                </div>
            </div>
        `;

        // Add event listeners for delete buttons
        databaseEl.querySelectorAll('.delete-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.getAttribute('data-type');
                const id = parseInt(btn.getAttribute('data-id'));
                this.deleteDatabaseEntry(type, id);
            });
        });

        // Add event listeners for edit buttons
        databaseEl.querySelectorAll('.edit-entry').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const type = btn.getAttribute('data-type');
                const id = parseInt(btn.getAttribute('data-id'));
                this.editDatabaseEntry(type, id);
            });
        });

        // Clear all data button
        const clearAllBtn = document.getElementById('clearAllData');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', () => {
                this.clearAllData();
            });
        }
    },

    async deleteDatabaseEntry(type, id) {
        if (!confirm('Are you sure you want to delete this entry?')) {
            return;
        }

        try {
            switch (type) {
                case 'dopamine':
                    await db.dopamineEntries.delete(id);
                    break;
                case 'hygiene':
                    await db.hygieneHabits.delete(id);
                    // Also delete related completions
                    await db.hygieneCompletions.where('habitId').equals(id).delete();
                    break;
                case 'hygieneCompletion':
                    await db.hygieneCompletions.delete(id);
                    break;
                case 'mood':
                    await db.moodEntries.delete(id);
                    break;
            }

            // Re-render the database page
            this.renderDatabasePage();
            
            // Also update other pages if needed
            this.renderDashboard();
            if (type === 'dopamine') this.renderDopaminePage();
            if (type === 'hygiene' || type === 'hygieneCompletion') this.renderHygienePage();
            if (type === 'mood') this.renderMoodPage();

            alert('Entry deleted successfully!');
        } catch (error) {
            console.error('Error deleting entry:', error);
            alert('Error deleting entry. Please try again.');
        }
    },

    async editDatabaseEntry(type, id) {
        switch (type) {
            case 'dopamine':
                const dopamineEntry = await db.dopamineEntries.get(id);
                if (dopamineEntry) {
                    this.showDopamineModal(dopamineEntry);
                }
                break;
            case 'mood':
                const moodEntry = await db.moodEntries.get(id);
                if (moodEntry) {
                    this.showMoodModal(moodEntry);
                }
                break;
            default:
                alert('Editing not supported for this entry type');
        }
    },

    async clearAllData() {
        if (!confirm('⚠️ DANGER: This will delete ALL your data permanently! Are you absolutely sure?')) {
            return;
        }

        if (!confirm('❌ This action cannot be undone! All your habits, progress, and history will be lost. Confirm deletion?')) {
            return;
        }

        try {
            // Clear all database tables
            await Promise.all([
                db.dopamineEntries.clear(),
                db.hygieneHabits.clear(),
                db.hygieneCompletions.clear(),
                db.moodEntries.clear(),
                db.dailyCompletion.clear()
            ]);

            // Clear localStorage
            localStorage.clear();

            // Re-render all pages
            this.renderAllPages();

            alert('All data cleared successfully! The app has been reset to default settings.');
        } catch (error) {
            console.error('Error clearing data:', error);
            alert('Error clearing data. Please try again.');
        }
    },

    // Fixed Calculation methods
    async calculateCurrentStreak() {
        const entries = await db.dopamineEntries.orderBy('date').toArray();
        let currentStreak = 0;
        const today = new Date();
        
        for (let i = 0; i < 365; i++) {
            const checkDate = new Date(today);
            checkDate.setDate(today.getDate() - i);
            const dateKey = this.formatDate(checkDate);
            
            const entry = entries.find(e => e.date === dateKey);
            if (entry && entry.status === 'passed') {
                currentStreak++;
            } else {
                break;
            }
        }
        
        return currentStreak;
    },

    async calculateLongestStreak() {
        const entries = await db.dopamineEntries.orderBy('date').toArray();
        let longestStreak = 0;
        let currentStreak = 0;
        
        entries.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        for (const entry of entries) {
            if (entry.status === 'passed') {
                currentStreak++;
                longestStreak = Math.max(longestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        }
        
        return longestStreak;
    },

    // NEW: Calculate today's completion based on dopamine status and completed hygiene habits
    async calculateTodayCompletion(date) {
        const dopamineEntry = await db.dopamineEntries.where('date').equals(date).first();
        const habits = await db.hygieneHabits.toArray();
        const hygieneCompletions = await db.hygieneCompletions.where('date').equals(date).toArray();

        // Dopamine counts as 1 item (passed = 1, failed = 0, not logged = 0)
        const dopamineValue = dopamineEntry ? (dopamineEntry.status === 'passed' ? 1 : 0) : 0;
        
        // Count completed hygiene habits
        let completedHygieneCount = 0;
        habits.forEach(habit => {
            const completion = hygieneCompletions.find(c => c.habitId === habit.id);
            if (completion && completion.completed) {
                completedHygieneCount++;
            }
        });

        // Total possible items: dopamine (1) + number of hygiene habits
        const totalPossibleItems = 1 + habits.length;
        const actualCompletedItems = dopamineValue + completedHygieneCount;

        // Calculate percentage (rounded)
        return totalPossibleItems > 0 ? Math.round((actualCompletedItems / totalPossibleItems) * 100) : 0;
    },

    async updateDailyCompletion() {
        const today = this.formatDate(new Date());
        const dopamineCompleted = await this.isDopamineCompletedToday();
        const hygieneCompleted = await this.calculateHygieneCompletion(today) >= 50;
        const totalCompletion = await this.calculateTodayCompletion(today);
        
        const existing = await db.dailyCompletion.where('date').equals(today).first();
        
        if (existing) {
            await db.dailyCompletion.update(existing.id, {
                dopamineCompleted,
                hygieneCompleted,
                totalCompletion,
                createdAt: new Date()
            });
        } else {
            await db.dailyCompletion.add({
                date: today,
                dopamineCompleted,
                hygieneCompleted,
                totalCompletion,
                createdAt: new Date()
            });
        }
    },

    async isDopamineCompletedToday() {
        const today = this.formatDate(new Date());
        const entry = await db.dopamineEntries.where('date').equals(today).first();
        return entry && entry.status === 'passed';
    },

    async getTotalHabits() {
        const habits = await db.hygieneHabits.toArray();
        return habits.length;
    },

    // Initialize all pages
    renderAllPages() {
        this.renderDashboard();
    }
};

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    LifeTrackerApp.init();
});

// Add CSS for new elements
const additionalStyles = `
    .status-warning {
        background: #FF9800;
        color: black;
    }
    
    .status-missing {
        background: #666;
        color: white;
    }
    
    .day-section {
        margin-bottom: 20px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 10px;
    }
    
    .status-badge {
        padding: 8px 12px;
        border-radius: 20px;
        font-size: 12px;
        font-weight: bold;
        display: inline-block;
    }
    
    .mini-calendar-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 2px;
        font-size: 10px;
    }
    
    .mini-calendar-header {
        text-align: center;
        font-weight: bold;
        color: #888;
        padding: 2px;
    }
    
    .mini-calendar-day {
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 3px;
        background: rgba(255, 255, 255, 0.1);
        cursor: pointer;
        font-size: 9px;
    }
    
    .mini-calendar-day.today {
        border: 1px solid #0095F6;
    }
    
    .mini-calendar-day.completed {
        background: #4CAF50;
        color: white;
    }
    
    .mini-calendar-day.empty {
        background: transparent;
        cursor: default;
    }
    
    .habit-calendar {
        margin-bottom: 15px;
    }
    
    .day-completion {
        font-size: 8px;
        color: rgba(255, 255, 255, 0.7);
    }
    
    /* Data Backup Styles */
    .backup-section {
        margin-bottom: 25px;
        padding: 15px;
        background: rgba(255, 255, 255, 0.05);
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.1);
    }
    
    .backup-section h3 {
        margin-bottom: 10px;
        color: var(--text-primary);
        font-size: 16px;
        font-weight: 700;
    }
    
    .backup-section p {
        margin-bottom: 15px;
        color: var(--text-secondary);
        font-size: 14px;
        line-height: 1.5;
    }
    
    .btn-warning {
        background: linear-gradient(135deg, #ff9800, #ff5722);
        color: white;
        border: none;
        padding: 16px 24px;
        border-radius: 16px;
        font-size: 16px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 10px;
        width: 100%;
        position: relative;
        overflow: hidden;
        box-shadow: var(--shadow);
    }
    
    .btn-warning:active {
        transform: scale(0.95);
        box-shadow: 0 4px 20px rgba(255, 87, 34, 0.6);
    }
    
    .download-info, .upload-info {
        margin-top: 10px;
        padding: 10px;
        border-radius: 8px;
        font-size: 14px;
        text-align: center;
        display: none;
    }
    
    .download-info.success, .upload-info.success {
        background: rgba(0, 200, 81, 0.2);
        color: var(--ig-success);
        border: 1px solid var(--ig-success);
        display: block;
    }
    
    .download-info.error, .upload-info.error {
        background: rgba(225, 48, 108, 0.2);
        color: var(--ig-danger);
        border: 1px solid var(--ig-danger);
        display: block;
    }
    
    .upload-info.info {
        background: rgba(33, 150, 243, 0.2);
        color: var(--ig-blue);
        border: 1px solid var(--ig-blue);
        display: block;
    }
    
    .file-name {
        font-weight: 600;
        color: var(--text-primary);
    }
    
    .file-size {
        color: var(--text-secondary);
        font-size: 12px;
    }
    
    .data-summary {
        background: rgba(255, 255, 255, 0.03);
        border-radius: 10px;
        padding: 15px;
        margin-top: 10px;
        font-size: 13px;
    }
    
    .data-summary-item {
        display: flex;
        justify-content: space-between;
        margin-bottom: 5px;
    }
    
    .data-summary-label {
        color: var(--text-secondary);
    }
    
    .data-summary-value {
        color: var(--text-primary);
        font-weight: 600;
    }
    
    .mt-20 {
        margin-top: 20px;
    }
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);
