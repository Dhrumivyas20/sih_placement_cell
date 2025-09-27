// Placement Cell Dashboard Management System

class PlacementDashboard {
    constructor() {
        this.user = null;
        this.jobs = this.loadJobs();
        this.applications = this.loadApplications();
        this.interviews = this.loadInterviews();
        this.students = [];
        this.facultyMembers = [];
        this.chart = null;
    }

    initialize() {
        this.user = authSystem.getCurrentUser();
        if (!this.user || this.user.role !== 'placement_cell') return;
        
        this.students = authSystem.getUsersByRole('student');
        this.facultyMembers = authSystem.getUsersByRole('faculty');
        
        this.updateDashboardStats();
        this.loadRecentJobs();
        this.renderApplicationsChart();
        this.bindEventListeners();
    }

    bindEventListeners() {
        document.getElementById('postJobBtn').addEventListener('click', () => this.showPostJobModal());
        document.getElementById('analyticsBtn').addEventListener('click', () => this.showAnalyticsModal());
    }

    loadJobs() {
        const jobs = localStorage.getItem('jobs');
        return jobs ? JSON.parse(jobs) : [];
    }

    saveJobs() {
        localStorage.setItem('jobs', JSON.stringify(this.jobs));
    }

    loadApplications() {
        const applications = localStorage.getItem('applications');
        return applications ? JSON.parse(applications) : [];
    }

    saveApplications() {
        localStorage.setItem('applications', JSON.stringify(this.applications));
    }

    loadInterviews() {
        const interviews = localStorage.getItem('interviews');
        return interviews ? JSON.parse(interviews) : [];
    }

    saveInterviews() {
        localStorage.setItem('interviews', JSON.stringify(this.interviews));
    }

    updateDashboardStats() {
        const activeJobs = this.jobs.filter(job => job.status === 'active').length;
        const totalStudents = this.students.length;
        const pendingApprovals = this.applications.filter(app => app.status === 'pending').length;
        
        // Calculate placement rate
        const placedStudents = this.applications.filter(app => app.status === 'selected').length;
        const placementRate = totalStudents > 0 ? Math.round((placedStudents / totalStudents) * 100) : 0;

        document.getElementById('totalJobs').textContent = activeJobs;
        document.getElementById('totalStudents').textContent = totalStudents;
        document.getElementById('pendingApprovals').textContent = pendingApprovals;
        document.getElementById('placementRate').textContent = `${placementRate}%`;
    }

    loadRecentJobs() {
        const container = document.getElementById('recentJobs');
        const recentJobs = this.jobs
            .sort((a, b) => new Date(b.posted) - new Date(a.posted))
            .slice(0, 5);

        if (recentJobs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No jobs posted yet. Create your first job posting!</p>';
            return;
        }

        container.innerHTML = recentJobs.map(job => {
            const applicationsCount = this.applications.filter(app => app.jobId === job.id).length;
            const statusColor = job.status === 'active' ? 'success' : 'warning';

            return `
                <div class="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div>
                        <h5 class="font-medium">${job.title}</h5>
                        <p class="text-sm text-gray-600">${job.company}</p>
                        <div class="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                            <span><i class="fas fa-clock"></i> ${job.duration}</span>
                            <span><i class="fas fa-users"></i> ${applicationsCount} applications</span>
                        </div>
                    </div>
                    <div class="text-right">
                        <span class="badge badge-${statusColor}">${job.status.toUpperCase()}</span>
                        <div class="mt-2 space-x-2">
                            <button onclick="placementDashboard.viewJobApplications('${job.id}')" class="text-blue-600 text-xs hover:underline">
                                View Applications
                            </button>
                            <button onclick="placementDashboard.editJob('${job.id}')" class="text-green-600 text-xs hover:underline">
                                Edit
                            </button>
                            ${job.status === 'active' ? 
                                `<button onclick="placementDashboard.closeJob('${job.id}')" class="text-red-600 text-xs hover:underline">Close</button>` :
                                `<button onclick="placementDashboard.reopenJob('${job.id}')" class="text-green-600 text-xs hover:underline">Reopen</button>`
                            }
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderApplicationsChart() {
        const ctx = document.getElementById('applicationsChart');
        if (!ctx) return;

        // Prepare data for the last 7 days
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }));
        }

        const applicationsData = last7Days.map(dateStr => {
            const date = new Date(dateStr + ', 2024');
            return this.applications.filter(app => {
                const appDate = new Date(app.appliedAt);
                return appDate.toDateString() === date.toDateString();
            }).length;
        });

        if (this.chart) {
            this.chart.destroy();
        }

        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: last7Days,
                datasets: [{
                    label: 'Applications Received',
                    data: applicationsData,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            stepSize: 1
                        }
                    }
                }
            }
        });
    }

    showPostJobModal() {
        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Post New Job/Internship</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="postJobForm">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Job Title *</label>
                            <input type="text" id="jobTitle" class="form-input" placeholder="e.g., Software Developer Intern" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Company Name *</label>
                            <input type="text" id="jobCompany" class="form-input" placeholder="e.g., TechCorp Solutions" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Job Type *</label>
                            <select id="jobType" class="form-select" required>
                                <option value="">Select type</option>
                                <option value="Internship">Internship</option>
                                <option value="Full-time">Full-time Position</option>
                                <option value="Part-time">Part-time</option>
                                <option value="Contract">Contract</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Duration</label>
                            <input type="text" id="jobDuration" class="form-input" placeholder="e.g., 6 months">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Location *</label>
                            <input type="text" id="jobLocation" class="form-input" placeholder="e.g., Bangalore" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Stipend/Salary *</label>
                            <input type="text" id="jobStipend" class="form-input" placeholder="e.g., ₹25,000/month" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Minimum CGPA</label>
                            <input type="number" id="jobMinCGPA" class="form-input" placeholder="e.g., 7.5" step="0.1" min="0" max="10">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Application Deadline *</label>
                            <input type="date" id="jobDeadline" class="form-input" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Eligible Departments *</label>
                        <div class="grid grid-cols-3 gap-2">
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" value="Computer Science" class="department-checkbox">
                                <span class="text-sm">Computer Science</span>
                            </label>
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" value="Electronics" class="department-checkbox">
                                <span class="text-sm">Electronics</span>
                            </label>
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" value="Mechanical" class="department-checkbox">
                                <span class="text-sm">Mechanical</span>
                            </label>
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" value="Civil" class="department-checkbox">
                                <span class="text-sm">Civil</span>
                            </label>
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" value="Electrical" class="department-checkbox">
                                <span class="text-sm">Electrical</span>
                            </label>
                            <label class="flex items-center space-x-2">
                                <input type="checkbox" value="All Departments" class="department-checkbox" onchange="placementDashboard.toggleAllDepartments(this)">
                                <span class="text-sm"><strong>All Departments</strong></span>
                            </label>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Required Skills *</label>
                        <div class="mb-2">
                            <input type="text" id="skillInput" class="form-input" placeholder="Type a skill and press Enter">
                        </div>
                        <div id="selectedSkillsList" class="flex flex-wrap gap-2 mb-2">
                            <!-- Selected skills will appear here -->
                        </div>
                        <div id="skillSuggestions" class="grid grid-cols-4 gap-2 text-xs">
                            ${this.getSkillSuggestions().map(skill => `
                                <button type="button" onclick="placementDashboard.addSkill('${skill}')" class="text-left p-1 hover:bg-gray-100 rounded">
                                    ${skill}
                                </button>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Job Description *</label>
                        <textarea id="jobDescription" class="form-textarea" placeholder="Describe the role, company, and what makes this opportunity exciting..." required></textarea>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div class="form-group">
                            <label class="form-label">Requirements</label>
                            <textarea id="jobRequirements" class="form-textarea" placeholder="List the requirements (one per line)"></textarea>
                            <p class="text-xs text-gray-500 mt-1">Enter each requirement on a new line</p>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Responsibilities</label>
                            <textarea id="jobResponsibilities" class="form-textarea" placeholder="List the key responsibilities (one per line)"></textarea>
                            <p class="text-xs text-gray-500 mt-1">Enter each responsibility on a new line</p>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="placementDashboard.saveJob()" class="btn-primary">Post Job</button>
            </div>
        `;
        
        showModal(modalContent);
        this.bindJobFormEvents();
    }

    bindJobFormEvents() {
        const skillInput = document.getElementById('skillInput');
        let selectedSkills = [];

        skillInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                const skill = skillInput.value.trim();
                if (skill && !selectedSkills.includes(skill)) {
                    selectedSkills.push(skill);
                    this.updateSelectedSkills(selectedSkills);
                    skillInput.value = '';
                }
            }
        });

        // Store selectedSkills for later use
        this.currentSelectedSkills = selectedSkills;
    }

    addSkill(skill) {
        if (!this.currentSelectedSkills.includes(skill)) {
            this.currentSelectedSkills.push(skill);
            this.updateSelectedSkills(this.currentSelectedSkills);
        }
    }

    updateSelectedSkills(skills) {
        const container = document.getElementById('selectedSkillsList');
        container.innerHTML = skills.map(skill => `
            <span class="skill-tag selected flex items-center space-x-1">
                <span>${skill}</span>
                <button type="button" onclick="placementDashboard.removeSkill('${skill}')" class="text-red-600 hover:text-red-800">
                    <i class="fas fa-times text-xs"></i>
                </button>
            </span>
        `).join('');
    }

    removeSkill(skill) {
        this.currentSelectedSkills = this.currentSelectedSkills.filter(s => s !== skill);
        this.updateSelectedSkills(this.currentSelectedSkills);
    }

    toggleAllDepartments(checkbox) {
        const otherCheckboxes = document.querySelectorAll('.department-checkbox:not([value="All Departments"])');
        if (checkbox.checked) {
            otherCheckboxes.forEach(cb => cb.checked = true);
        } else {
            otherCheckboxes.forEach(cb => cb.checked = false);
        }
    }

    getSkillSuggestions() {
        return [
            'JavaScript', 'Python', 'Java', 'C++', 'React', 'Angular', 'Vue.js',
            'Node.js', 'Django', 'Flask', 'Spring Boot', 'HTML/CSS', 'SQL',
            'MongoDB', 'AWS', 'Docker', 'Git', 'Machine Learning', 'Data Science'
        ];
    }

    saveJob() {
        const formData = {
            title: document.getElementById('jobTitle').value.trim(),
            company: document.getElementById('jobCompany').value.trim(),
            type: document.getElementById('jobType').value,
            duration: document.getElementById('jobDuration').value.trim(),
            location: document.getElementById('jobLocation').value.trim(),
            stipend: document.getElementById('jobStipend').value.trim(),
            minCGPA: parseFloat(document.getElementById('jobMinCGPA').value) || 0,
            applicationDeadline: document.getElementById('jobDeadline').value,
            description: document.getElementById('jobDescription').value.trim()
        };

        // Validate required fields
        if (!formData.title || !formData.company || !formData.type || !formData.location || 
            !formData.stipend || !formData.applicationDeadline || !formData.description) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Get selected departments
        const selectedDepartments = Array.from(document.querySelectorAll('.department-checkbox:checked:not([value="All Departments"])'))
            .map(cb => cb.value);
        
        if (selectedDepartments.length === 0) {
            showNotification('Please select at least one eligible department', 'error');
            return;
        }

        // Get requirements and responsibilities
        const requirements = document.getElementById('jobRequirements').value.trim()
            .split('\n').filter(req => req.trim());
        const responsibilities = document.getElementById('jobResponsibilities').value.trim()
            .split('\n').filter(resp => resp.trim());

        if (!this.currentSelectedSkills || this.currentSelectedSkills.length === 0) {
            showNotification('Please add at least one required skill', 'error');
            return;
        }

        // Create job object
        const newJob = {
            id: 'job_' + Date.now(),
            ...formData,
            requiredSkills: this.currentSelectedSkills,
            department: selectedDepartments,
            requirements: requirements.length > 0 ? requirements : [
                'Currently pursuing relevant degree',
                'Strong academic performance',
                'Good communication skills'
            ],
            responsibilities: responsibilities.length > 0 ? responsibilities : [
                'Work on assigned projects',
                'Collaborate with team members',
                'Learn new technologies and skills'
            ],
            posted: new Date().toISOString(),
            postedBy: this.user.id,
            status: 'active'
        };

        this.jobs.push(newJob);
        this.saveJobs();

        closeModal();
        this.initialize(); // Refresh dashboard
        showNotification(`Job "${newJob.title}" posted successfully!`, 'success');
    }

    viewJobApplications(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        const applications = this.applications.filter(app => app.jobId === jobId);

        if (!job) return;

        const modalContent = `
            <div class="modal-header">
                <div>
                    <h3 class="text-lg font-semibold">Applications for ${job.title}</h3>
                    <p class="text-gray-600">${job.company} • ${applications.length} applications</p>
                </div>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${applications.length === 0 ? 
                    '<p class="text-gray-500 text-center py-8">No applications received yet</p>' :
                    `
                    <div class="space-y-4">
                        ${applications.map(app => {
                            const student = this.students.find(s => s.id === app.studentId);
                            const statusColors = {
                                pending: 'warning',
                                approved: 'success',
                                rejected: 'danger',
                                interview_scheduled: 'info',
                                selected: 'success'
                            };
                            
                            return `
                                <div class="border border-gray-200 rounded-lg p-4">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <div class="flex items-center space-x-3 mb-2">
                                                <h4 class="font-medium">${app.studentName}</h4>
                                                <span class="badge badge-${statusColors[app.status]}">${app.status.replace('_', ' ').toUpperCase()}</span>
                                            </div>
                                            <div class="grid grid-cols-2 gap-4 text-sm text-gray-600">
                                                <div>
                                                    <p><strong>Email:</strong> ${app.studentEmail}</p>
                                                    <p><strong>Department:</strong> ${app.studentDepartment}</p>
                                                    <p><strong>CGPA:</strong> ${app.studentCGPA}</p>
                                                </div>
                                                <div>
                                                    <p><strong>Applied:</strong> ${new Date(app.appliedAt).toLocaleDateString()}</p>
                                                    ${app.mentorApprovalRequired ? 
                                                        `<p><strong>Mentor Approval:</strong> ${app.mentorApprovalStatus}</p>` : ''
                                                    }
                                                </div>
                                            </div>
                                            ${student?.profile?.skills ? 
                                                `<div class="mt-2">
                                                    <p class="text-sm font-medium">Skills:</p>
                                                    <div class="flex flex-wrap gap-1 mt-1">
                                                        ${student.profile.skills.map(skill => `
                                                            <span class="skill-tag ${job.requiredSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                                                        `).join('')}
                                                    </div>
                                                </div>` : ''
                                            }
                                        </div>
                                        <div class="flex flex-col space-y-2 ml-4">
                                            ${app.status === 'pending' ? `
                                                <button onclick="placementDashboard.updateApplicationStatus('${app.id}', 'approved')" class="btn-primary text-xs px-3 py-1">
                                                    Approve
                                                </button>
                                                <button onclick="placementDashboard.updateApplicationStatus('${app.id}', 'rejected')" class="btn-secondary text-xs px-3 py-1">
                                                    Reject
                                                </button>
                                            ` : ''}
                                            ${app.status === 'approved' ? `
                                                <button onclick="placementDashboard.scheduleInterview('${app.id}')" class="btn-primary text-xs px-3 py-1">
                                                    Schedule Interview
                                                </button>
                                            ` : ''}
                                            ${app.status === 'interview_scheduled' ? `
                                                <button onclick="placementDashboard.updateApplicationStatus('${app.id}', 'selected')" class="btn-primary text-xs px-3 py-1">
                                                    Select
                                                </button>
                                                <button onclick="placementDashboard.updateApplicationStatus('${app.id}', 'rejected')" class="btn-secondary text-xs px-3 py-1">
                                                    Reject
                                                </button>
                                            ` : ''}
                                            <button onclick="placementDashboard.viewStudentProfile('${app.studentId}')" class="text-blue-600 text-xs hover:underline">
                                                View Profile
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                    `
                }
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Close</button>
                <button type="button" onclick="placementDashboard.exportApplications('${jobId}')" class="btn-primary">
                    <i class="fas fa-download"></i> Export Applications
                </button>
            </div>
        `;

        showModal(modalContent);
    }

    updateApplicationStatus(applicationId, newStatus) {
        const appIndex = this.applications.findIndex(app => app.id === applicationId);
        if (appIndex === -1) return;

        this.applications[appIndex].status = newStatus;
        this.applications[appIndex].updatedAt = new Date().toISOString();
        
        this.saveApplications();
        
        // Refresh the modal content
        const app = this.applications[appIndex];
        this.viewJobApplications(app.jobId);
        
        showNotification(`Application status updated to ${newStatus}`, 'success');
    }

    scheduleInterview(applicationId) {
        const app = this.applications.find(a => a.id === applicationId);
        if (!app) return;

        const job = this.jobs.find(j => j.id === app.jobId);
        
        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Schedule Interview</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="mb-4">
                    <h4 class="font-medium">${app.studentName}</h4>
                    <p class="text-gray-600">${job?.title} at ${job?.company}</p>
                </div>
                
                <form id="scheduleInterviewForm">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Interview Date</label>
                            <input type="date" id="interviewDate" class="form-input" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Interview Time</label>
                            <input type="time" id="interviewTime" class="form-input" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Interview Type</label>
                        <select id="interviewType" class="form-select" required>
                            <option value="">Select interview type</option>
                            <option value="online">Online (Video Call)</option>
                            <option value="offline">Offline (In-person)</option>
                            <option value="phone">Phone Interview</option>
                        </select>
                    </div>
                    
                    <div class="form-group" id="meetingLinkGroup" style="display: none;">
                        <label class="form-label">Meeting Link</label>
                        <input type="url" id="meetingLink" class="form-input" placeholder="https://meet.google.com/...">
                    </div>
                    
                    <div class="form-group" id="locationGroup" style="display: none;">
                        <label class="form-label">Location</label>
                        <input type="text" id="interviewLocation" class="form-input" placeholder="Room number, building, etc.">
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Interviewer(s)</label>
                        <input type="text" id="interviewers" class="form-input" placeholder="Name(s) of interviewer(s)" required>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Additional Notes</label>
                        <textarea id="interviewNotes" class="form-textarea" placeholder="Any special instructions or requirements..."></textarea>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="placementDashboard.saveInterview('${applicationId}')" class="btn-primary">Schedule Interview</button>
            </div>
        `;

        showModal(modalContent);
        
        // Bind interview type change event
        document.getElementById('interviewType').addEventListener('change', (e) => {
            const meetingLinkGroup = document.getElementById('meetingLinkGroup');
            const locationGroup = document.getElementById('locationGroup');
            
            if (e.target.value === 'online') {
                meetingLinkGroup.style.display = 'block';
                locationGroup.style.display = 'none';
            } else if (e.target.value === 'offline') {
                meetingLinkGroup.style.display = 'none';
                locationGroup.style.display = 'block';
            } else {
                meetingLinkGroup.style.display = 'none';
                locationGroup.style.display = 'none';
            }
        });
    }

    saveInterview(applicationId) {
        const date = document.getElementById('interviewDate').value;
        const time = document.getElementById('interviewTime').value;
        const type = document.getElementById('interviewType').value;
        const interviewers = document.getElementById('interviewers').value.trim();

        if (!date || !time || !type || !interviewers) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        const app = this.applications.find(a => a.id === applicationId);
        if (!app) return;

        const datetime = new Date(`${date}T${time}`);
        
        const interview = {
            id: 'int_' + Date.now(),
            applicationId: applicationId,
            jobId: app.jobId,
            studentId: app.studentId,
            studentName: app.studentName,
            datetime: datetime.toISOString(),
            type: type,
            interviewers: interviewers,
            notes: document.getElementById('interviewNotes').value.trim(),
            status: 'scheduled',
            createdAt: new Date().toISOString()
        };

        if (type === 'online') {
            interview.meetingLink = document.getElementById('meetingLink').value.trim();
        } else if (type === 'offline') {
            interview.location = document.getElementById('interviewLocation').value.trim();
        }

        this.interviews.push(interview);
        this.saveInterviews();

        // Update application status
        this.updateApplicationStatus(applicationId, 'interview_scheduled');

        closeModal();
        showNotification('Interview scheduled successfully!', 'success');
    }

    showAnalyticsModal() {
        const totalApplications = this.applications.length;
        const approvedApplications = this.applications.filter(app => app.status === 'approved').length;
        const rejectedApplications = this.applications.filter(app => app.status === 'rejected').length;
        const interviewsScheduled = this.applications.filter(app => app.status === 'interview_scheduled').length;
        const selectedStudents = this.applications.filter(app => app.status === 'selected').length;

        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Placement Analytics</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div class="space-y-4">
                        <h4 class="font-semibold">Application Statistics</h4>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span>Total Applications:</span>
                                <span class="font-medium">${totalApplications}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Approved:</span>
                                <span class="font-medium text-green-600">${approvedApplications}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Rejected:</span>
                                <span class="font-medium text-red-600">${rejectedApplications}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Interviews Scheduled:</span>
                                <span class="font-medium text-blue-600">${interviewsScheduled}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Selected:</span>
                                <span class="font-medium text-purple-600">${selectedStudents}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="space-y-4">
                        <h4 class="font-semibold">Department-wise Applications</h4>
                        <div class="space-y-2">
                            ${this.getDepartmentWiseStats().map(stat => `
                                <div class="flex justify-between">
                                    <span>${stat.department}:</span>
                                    <span class="font-medium">${stat.count}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold mb-2">Top Skills in Demand</h4>
                        <div class="space-y-1">
                            ${this.getTopSkills().slice(0, 5).map(skill => `
                                <div class="flex justify-between text-sm">
                                    <span>${skill.name}:</span>
                                    <span class="font-medium">${skill.count} jobs</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold mb-2">Recent Activity</h4>
                        <div class="space-y-2 text-sm">
                            ${this.getRecentActivity().slice(0, 5).map(activity => `
                                <div class="text-gray-600">${activity}</div>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Close</button>
                <button type="button" onclick="placementDashboard.exportReport()" class="btn-primary">
                    <i class="fas fa-download"></i> Export Report
                </button>
            </div>
        `;

        showModal(modalContent);
    }

    getDepartmentWiseStats() {
        const stats = {};
        this.applications.forEach(app => {
            stats[app.studentDepartment] = (stats[app.studentDepartment] || 0) + 1;
        });
        return Object.entries(stats).map(([department, count]) => ({ department, count }));
    }

    getTopSkills() {
        const skillCounts = {};
        this.jobs.forEach(job => {
            job.requiredSkills.forEach(skill => {
                skillCounts[skill] = (skillCounts[skill] || 0) + 1;
            });
        });
        return Object.entries(skillCounts)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);
    }

    getRecentActivity() {
        const activities = [];
        
        // Recent job postings
        const recentJobs = this.jobs
            .sort((a, b) => new Date(b.posted) - new Date(a.posted))
            .slice(0, 3);
        
        recentJobs.forEach(job => {
            activities.push(`Posted job: ${job.title} at ${job.company}`);
        });
        
        // Recent applications
        const recentApps = this.applications
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
            .slice(0, 3);
        
        recentApps.forEach(app => {
            const job = this.jobs.find(j => j.id === app.jobId);
            activities.push(`New application from ${app.studentName} for ${job?.title || 'a position'}`);
        });
        
        return activities;
    }

    exportReport() {
        // Create a simple text report
        const report = this.generateReport();
        const blob = new Blob([report], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `placement_report_${new Date().toISOString().split('T')[0]}.txt`;
        a.click();
        URL.revokeObjectURL(url);
        
        showNotification('Report exported successfully!', 'success');
    }

    generateReport() {
        const date = new Date().toLocaleDateString();
        return `
CAMPUS PLACEMENT REPORT
Generated on: ${date}

OVERVIEW
========
Total Active Jobs: ${this.jobs.filter(j => j.status === 'active').length}
Total Students: ${this.students.length}
Total Applications: ${this.applications.length}
Placement Rate: ${this.calculatePlacementRate()}%

APPLICATIONS BREAKDOWN
=====================
Pending: ${this.applications.filter(app => app.status === 'pending').length}
Approved: ${this.applications.filter(app => app.status === 'approved').length}
Interview Scheduled: ${this.applications.filter(app => app.status === 'interview_scheduled').length}
Selected: ${this.applications.filter(app => app.status === 'selected').length}
Rejected: ${this.applications.filter(app => app.status === 'rejected').length}

DEPARTMENT-WISE STATISTICS
=========================
${this.getDepartmentWiseStats().map(stat => `${stat.department}: ${stat.count} applications`).join('\n')}

TOP SKILLS IN DEMAND
===================
${this.getTopSkills().slice(0, 10).map(skill => `${skill.name}: ${skill.count} jobs`).join('\n')}
        `.trim();
    }

    calculatePlacementRate() {
        const placedStudents = this.applications.filter(app => app.status === 'selected').length;
        return this.students.length > 0 ? Math.round((placedStudents / this.students.length) * 100) : 0;
    }

    editJob(jobId) {
        // Implementation for editing existing jobs
        showNotification('Edit job functionality coming soon!', 'info');
    }

    closeJob(jobId) {
        const jobIndex = this.jobs.findIndex(j => j.id === jobId);
        if (jobIndex !== -1) {
            this.jobs[jobIndex].status = 'closed';
            this.saveJobs();
            this.initialize();
            showNotification('Job closed successfully', 'success');
        }
    }

    reopenJob(jobId) {
        const jobIndex = this.jobs.findIndex(j => j.id === jobId);
        if (jobIndex !== -1) {
            this.jobs[jobIndex].status = 'active';
            this.saveJobs();
            this.initialize();
            showNotification('Job reopened successfully', 'success');
        }
    }

    viewStudentProfile(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">${student.name} - Student Profile</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-2">Personal Information</h4>
                        <div class="space-y-2 text-sm">
                            <div><strong>Email:</strong> ${student.email}</div>
                            <div><strong>Roll Number:</strong> ${student.rollNumber || 'N/A'}</div>
                            <div><strong>Department:</strong> ${student.department}</div>
                            <div><strong>Semester:</strong> ${student.semester}${student.semester == 1 ? 'st' : student.semester == 2 ? 'nd' : student.semester == 3 ? 'rd' : 'th'}</div>
                            <div><strong>CGPA:</strong> ${student.cgpa}</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Application Status</h4>
                        <div class="space-y-2 text-sm">
                            ${(() => {
                                const studentApps = this.applications.filter(app => app.studentId === studentId);
                                const stats = {
                                    total: studentApps.length,
                                    pending: studentApps.filter(app => app.status === 'pending').length,
                                    approved: studentApps.filter(app => app.status === 'approved').length,
                                    selected: studentApps.filter(app => app.status === 'selected').length,
                                    rejected: studentApps.filter(app => app.status === 'rejected').length
                                };
                                return `
                                    <div><strong>Total Applications:</strong> ${stats.total}</div>
                                    <div><strong>Pending:</strong> ${stats.pending}</div>
                                    <div><strong>Approved:</strong> ${stats.approved}</div>
                                    <div><strong>Selected:</strong> ${stats.selected}</div>
                                    <div><strong>Rejected:</strong> ${stats.rejected}</div>
                                `;
                            })()}
                        </div>
                    </div>
                </div>
                
                ${student.profile?.skills ? `
                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Skills</h4>
                        <div class="flex flex-wrap gap-2">
                            ${student.profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${student.profile?.badges?.length > 0 ? `
                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Badges & Certifications</h4>
                        <div class="flex flex-wrap gap-2">
                            ${student.profile.badges.map(badge => `<span class="badge badge-info">${badge}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${student.profile?.coverLetter ? `
                    <div>
                        <h4 class="font-semibold mb-2">Cover Letter</h4>
                        <p class="text-sm text-gray-700 bg-gray-50 p-3 rounded">${student.profile.coverLetter}</p>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Close</button>
            </div>
        `;

        showModal(modalContent);
    }
}

// Initialize placement dashboard
let placementDashboard;
document.addEventListener('DOMContentLoaded', () => {
    placementDashboard = new PlacementDashboard();
    window.placementDashboard = placementDashboard;
});