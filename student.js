// Student Dashboard Management System

class StudentDashboard {
    constructor() {
        this.user = null;
        this.jobs = this.loadJobs();
        this.applications = this.loadApplications();
        this.interviews = this.loadInterviews();
        this.skills = this.getAvailableSkills();
    }

    initialize() {
        this.user = authSystem.getCurrentUser();
        if (!this.user || this.user.role !== 'student') return;
        
        this.updateDashboardStats();
        this.loadRecommendedJobs();
        this.loadRecentApplications();
        this.loadUpcomingInterviews();
        this.updateProfileProgress();
        this.bindEventListeners();
    }

    bindEventListeners() {
        document.getElementById('editProfileBtn').addEventListener('click', () => this.showEditProfileModal());
    }

    loadJobs() {
        const jobs = localStorage.getItem('jobs');
        return jobs ? JSON.parse(jobs) : this.getDefaultJobs();
    }

    getDefaultJobs() {
        const defaultJobs = [
            {
                id: 'job1',
                title: 'Software Developer Intern',
                company: 'TechCorp Solutions',
                type: 'Internship',
                duration: '6 months',
                stipend: '₹25,000/month',
                location: 'Bangalore',
                requiredSkills: ['JavaScript', 'React', 'Node.js', 'Python'],
                description: 'We are looking for passionate software development interns to join our dynamic team.',
                requirements: [
                    'Currently pursuing B.Tech/B.E in Computer Science or related field',
                    'Strong programming fundamentals',
                    'Experience with web technologies',
                    'CGPA above 7.5'
                ],
                responsibilities: [
                    'Develop web applications using modern frameworks',
                    'Collaborate with senior developers',
                    'Write clean, maintainable code',
                    'Participate in code reviews'
                ],
                applicationDeadline: '2024-02-15',
                posted: '2024-01-15',
                postedBy: 'admin1',
                department: ['Computer Science', 'Information Technology'],
                minCGPA: 7.5,
                status: 'active'
            },
            {
                id: 'job2',
                title: 'Data Science Intern',
                company: 'DataTech Analytics',
                type: 'Internship',
                duration: '4 months',
                stipend: '₹20,000/month',
                location: 'Hyderabad',
                requiredSkills: ['Python', 'Machine Learning', 'SQL', 'Statistics'],
                description: 'Join our data science team to work on cutting-edge analytics projects.',
                requirements: [
                    'Background in Computer Science, Mathematics, or Statistics',
                    'Knowledge of Python and data science libraries',
                    'Understanding of machine learning concepts',
                    'CGPA above 7.0'
                ],
                responsibilities: [
                    'Analyze large datasets',
                    'Build predictive models',
                    'Create data visualizations',
                    'Present findings to stakeholders'
                ],
                applicationDeadline: '2024-02-20',
                posted: '2024-01-18',
                postedBy: 'admin1',
                department: ['Computer Science', 'Mathematics'],
                minCGPA: 7.0,
                status: 'active'
            },
            {
                id: 'job3',
                title: 'UI/UX Design Intern',
                company: 'Creative Solutions',
                type: 'Internship',
                duration: '3 months',
                stipend: '₹18,000/month',
                location: 'Mumbai',
                requiredSkills: ['Figma', 'Adobe Creative Suite', 'User Research', 'Prototyping'],
                description: 'Work with our design team to create beautiful and intuitive user experiences.',
                requirements: [
                    'Design background or strong portfolio',
                    'Proficiency in design tools',
                    'Understanding of UX principles',
                    'Creative thinking and problem-solving skills'
                ],
                responsibilities: [
                    'Design user interfaces for web and mobile',
                    'Conduct user research',
                    'Create wireframes and prototypes',
                    'Collaborate with development teams'
                ],
                applicationDeadline: '2024-02-25',
                posted: '2024-01-20',
                postedBy: 'admin1',
                department: ['Computer Science', 'Design'],
                minCGPA: 6.5,
                status: 'active'
            }
        ];
        localStorage.setItem('jobs', JSON.stringify(defaultJobs));
        return defaultJobs;
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

    getAvailableSkills() {
        return [
            'JavaScript', 'Python', 'Java', 'C++', 'React', 'Angular', 'Vue.js',
            'Node.js', 'Express.js', 'Django', 'Flask', 'Spring Boot',
            'HTML/CSS', 'Bootstrap', 'Tailwind CSS', 'SASS/SCSS',
            'MySQL', 'PostgreSQL', 'MongoDB', 'Redis',
            'Git', 'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
            'Machine Learning', 'Data Science', 'AI', 'Deep Learning',
            'Figma', 'Adobe Creative Suite', 'Photoshop', 'Illustrator',
            'Project Management', 'Agile', 'Scrum', 'Leadership',
            'Communication', 'Problem Solving', 'Teamwork'
        ];
    }

    updateDashboardStats() {
        const userApplications = this.applications.filter(app => app.studentId === this.user.id);
        const userInterviews = this.interviews.filter(int => int.studentId === this.user.id);
        const skillBadges = this.user.profile?.badges || [];
        const offers = userApplications.filter(app => app.status === 'selected').length;

        document.getElementById('appliedCount').textContent = userApplications.length;
        document.getElementById('interviewCount').textContent = userInterviews.length;
        document.getElementById('skillBadges').textContent = skillBadges.length;
        document.getElementById('offersCount').textContent = offers;
    }

    loadRecommendedJobs() {
        const container = document.getElementById('recommendedJobs');
        const userSkills = this.user.profile?.skills || [];
        
        // Get jobs that match user's skills and department
        const recommendedJobs = this.jobs
            .filter(job => {
                const skillMatch = job.requiredSkills.some(skill => userSkills.includes(skill));
                const deptMatch = job.department.includes(this.user.department);
                const cgpaMatch = parseFloat(this.user.cgpa) >= job.minCGPA;
                return job.status === 'active' && (skillMatch || deptMatch) && cgpaMatch;
            })
            .slice(0, 3);

        if (recommendedJobs.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">Complete your profile to get personalized job recommendations</p>';
            return;
        }

        container.innerHTML = recommendedJobs.map(job => this.createJobCard(job, true)).join('');
    }

    createJobCard(job, isRecommended = false) {
        const userSkills = this.user.profile?.skills || [];
        const matchingSkills = job.requiredSkills.filter(skill => userSkills.includes(skill));
        const matchPercentage = Math.round((matchingSkills.length / job.requiredSkills.length) * 100);
        
        const hasApplied = this.applications.some(app => 
            app.jobId === job.id && app.studentId === this.user.id
        );

        return `
            <div class="card card-body">
                <div class="flex justify-between items-start mb-3">
                    <div>
                        <h4 class="font-semibold text-lg">${job.title}</h4>
                        <p class="text-gray-600">${job.company}</p>
                        <div class="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                            <span><i class="fas fa-clock"></i> ${job.duration}</span>
                            <span><i class="fas fa-rupee-sign"></i> ${job.stipend}</span>
                        </div>
                    </div>
                    ${isRecommended ? `<div class="badge badge-primary">${matchPercentage}% Match</div>` : ''}
                </div>
                
                <p class="text-gray-700 text-sm mb-3">${job.description}</p>
                
                <div class="flex flex-wrap gap-2 mb-3">
                    ${job.requiredSkills.map(skill => `
                        <span class="skill-tag ${userSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                    `).join('')}
                </div>
                
                <div class="flex justify-between items-center">
                    <span class="text-xs text-gray-500">Deadline: ${new Date(job.applicationDeadline).toLocaleDateString()}</span>
                    <div class="space-x-2">
                        <button onclick="studentDashboard.viewJobDetails('${job.id}')" class="text-blue-600 text-sm hover:underline">
                            View Details
                        </button>
                        ${hasApplied ? 
                            '<span class="badge badge-success">Applied</span>' : 
                            `<button onclick="studentDashboard.applyForJob('${job.id}')" class="btn-primary text-sm px-3 py-1">Apply Now</button>`
                        }
                    </div>
                </div>
            </div>
        `;
    }

    loadRecentApplications() {
        const container = document.getElementById('recentApplications');
        const userApplications = this.applications
            .filter(app => app.studentId === this.user.id)
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt))
            .slice(0, 5);

        if (userApplications.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No applications yet. Start applying to opportunities!</p>';
            return;
        }

        container.innerHTML = userApplications.map(app => {
            const job = this.jobs.find(j => j.id === app.jobId);
            if (!job) return '';

            const statusColors = {
                pending: 'warning',
                approved: 'success',
                rejected: 'danger',
                interview_scheduled: 'info'
            };

            return `
                <div class="flex justify-between items-center p-4 border border-gray-200 rounded-lg">
                    <div>
                        <h5 class="font-medium">${job.title}</h5>
                        <p class="text-sm text-gray-600">${job.company}</p>
                        <p class="text-xs text-gray-500">Applied: ${new Date(app.appliedAt).toLocaleDateString()}</p>
                    </div>
                    <div class="text-right">
                        <span class="badge badge-${statusColors[app.status]}">${app.status.replace('_', ' ').toUpperCase()}</span>
                        ${app.mentorApprovalRequired && app.mentorApprovalStatus === 'pending' ? 
                            '<p class="text-xs text-yellow-600 mt-1">Awaiting mentor approval</p>' : ''
                        }
                    </div>
                </div>
            `;
        }).join('');
    }

    loadUpcomingInterviews() {
        const container = document.getElementById('upcomingInterviews');
        const upcomingInterviews = this.interviews
            .filter(interview => 
                interview.studentId === this.user.id && 
                new Date(interview.datetime) > new Date()
            )
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
            .slice(0, 3);

        if (upcomingInterviews.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center text-sm">No upcoming interviews</p>';
            return;
        }

        container.innerHTML = upcomingInterviews.map(interview => {
            const job = this.jobs.find(j => j.id === interview.jobId);
            const interviewDate = new Date(interview.datetime);
            
            return `
                <div class="p-3 border border-gray-200 rounded-lg">
                    <h6 class="font-medium text-sm">${job?.title || 'Interview'}</h6>
                    <p class="text-xs text-gray-600">${job?.company}</p>
                    <p class="text-xs text-gray-500 mt-1">
                        <i class="fas fa-calendar"></i> ${interviewDate.toLocaleDateString()}
                    </p>
                    <p class="text-xs text-gray-500">
                        <i class="fas fa-clock"></i> ${interviewDate.toLocaleTimeString()}
                    </p>
                    ${interview.meetingLink ? 
                        `<a href="${interview.meetingLink}" target="_blank" class="text-blue-600 text-xs hover:underline mt-1 block">
                            <i class="fas fa-video"></i> Join Meeting
                        </a>` : ''
                    }
                </div>
            `;
        }).join('');
    }

    updateProfileProgress() {
        let completedFields = 0;
        let totalFields = 8;

        // Check basic profile fields
        if (this.user.name) completedFields++;
        if (this.user.email) completedFields++;
        if (this.user.department) completedFields++;
        if (this.user.cgpa) completedFields++;
        
        // Check profile specific fields
        if (this.user.profile?.skills?.length > 0) completedFields++;
        if (this.user.profile?.coverLetter) completedFields++;
        if (this.user.profile?.resume) completedFields++;
        if (this.user.profile?.badges?.length > 0) completedFields++;

        const progress = Math.round((completedFields / totalFields) * 100);
        document.getElementById('profileProgress').textContent = `${progress}%`;
        document.getElementById('progressBar').style.width = `${progress}%`;
    }

    showEditProfileModal() {
        const userSkills = this.user.profile?.skills || [];
        const userBadges = this.user.profile?.badges || [];
        
        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Edit Student Profile</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="editProfileForm">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Full Name</label>
                            <input type="text" id="editName" class="form-input" value="${this.user.name}" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Roll Number</label>
                            <input type="text" id="editRollNumber" class="form-input" value="${this.user.rollNumber || ''}" required>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-3 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Department</label>
                            <select id="editDepartment" class="form-select" required>
                                <option value="Computer Science" ${this.user.department === 'Computer Science' ? 'selected' : ''}>Computer Science</option>
                                <option value="Electronics" ${this.user.department === 'Electronics' ? 'selected' : ''}>Electronics</option>
                                <option value="Mechanical" ${this.user.department === 'Mechanical' ? 'selected' : ''}>Mechanical</option>
                                <option value="Civil" ${this.user.department === 'Civil' ? 'selected' : ''}>Civil</option>
                                <option value="Electrical" ${this.user.department === 'Electrical' ? 'selected' : ''}>Electrical</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Semester</label>
                            <select id="editSemester" class="form-select" required>
                                ${[1,2,3,4,5,6,7,8].map(sem => 
                                    `<option value="${sem}" ${this.user.semester == sem ? 'selected' : ''}>${sem}${sem==1?'st':sem==2?'nd':sem==3?'rd':'th'} Semester</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">CGPA</label>
                            <input type="number" id="editCGPA" class="form-input" value="${this.user.cgpa || ''}" step="0.01" min="0" max="10" required>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Cover Letter</label>
                        <textarea id="editCoverLetter" class="form-textarea" placeholder="Write about yourself, your goals, and aspirations...">${this.user.profile?.coverLetter || ''}</textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Skills</label>
                        <div class="mb-2">
                            <input type="text" id="skillSearch" class="form-input" placeholder="Search and select skills...">
                        </div>
                        <div id="skillsContainer" class="grid grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-gray-200 rounded p-3">
                            ${this.skills.map(skill => `
                                <label class="flex items-center space-x-2 cursor-pointer">
                                    <input type="checkbox" ${userSkills.includes(skill) ? 'checked' : ''} value="${skill}" class="skill-checkbox">
                                    <span class="text-sm">${skill}</span>
                                </label>
                            `).join('')}
                        </div>
                        <div class="mt-2">
                            <p class="text-sm text-gray-600">Selected Skills:</p>
                            <div id="selectedSkills" class="flex flex-wrap gap-2 mt-1">
                                ${userSkills.map(skill => `<span class="skill-tag selected">${skill}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Skill Badges / Certifications</label>
                        <div id="badgesList">
                            ${userBadges.map((badge, index) => `
                                <div class="flex items-center space-x-2 mb-2">
                                    <input type="text" class="form-input flex-1" value="${badge}" placeholder="Badge/Certificate name">
                                    <button type="button" onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            `).join('')}
                        </div>
                        <button type="button" onclick="studentDashboard.addBadgeInput()" class="text-blue-600 text-sm hover:underline">
                            + Add Badge/Certificate
                        </button>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Resume</label>
                        <div class="file-upload-area" onclick="document.getElementById('resumeInput').click()">
                            <input type="file" id="resumeInput" class="hidden" accept=".pdf,.doc,.docx" onchange="studentDashboard.handleResumeUpload(event)">
                            <div class="text-center">
                                <i class="fas fa-file-upload text-2xl text-gray-400 mb-2"></i>
                                <p class="text-sm text-gray-600">Click to upload resume (PDF, DOC, DOCX)</p>
                                ${this.user.profile?.resume ? `<p class="text-xs text-green-600 mt-1">Current: ${this.user.profile.resume}</p>` : ''}
                            </div>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="studentDashboard.saveProfile()" class="btn-primary">Save Changes</button>
            </div>
        `;
        
        showModal(modalContent);
        this.bindSkillsInteractivity();
    }

    bindSkillsInteractivity() {
        // Skill search functionality
        const searchInput = document.getElementById('skillSearch');
        const checkboxes = document.querySelectorAll('.skill-checkbox');
        
        searchInput.addEventListener('input', (e) => {
            const search = e.target.value.toLowerCase();
            checkboxes.forEach(checkbox => {
                const label = checkbox.closest('label');
                const skillName = checkbox.value.toLowerCase();
                if (skillName.includes(search)) {
                    label.style.display = 'flex';
                } else {
                    label.style.display = 'none';
                }
            });
        });
        
        // Update selected skills display
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                this.updateSelectedSkillsDisplay();
            });
        });
    }

    updateSelectedSkillsDisplay() {
        const selectedSkills = Array.from(document.querySelectorAll('.skill-checkbox:checked')).map(cb => cb.value);
        const container = document.getElementById('selectedSkills');
        container.innerHTML = selectedSkills.map(skill => `<span class="skill-tag selected">${skill}</span>`).join('');
    }

    addBadgeInput() {
        const container = document.getElementById('badgesList');
        const div = document.createElement('div');
        div.className = 'flex items-center space-x-2 mb-2';
        div.innerHTML = `
            <input type="text" class="form-input flex-1" placeholder="Badge/Certificate name">
            <button type="button" onclick="this.parentElement.remove()" class="text-red-600 hover:text-red-800">
                <i class="fas fa-trash"></i>
            </button>
        `;
        container.appendChild(div);
    }

    handleResumeUpload(event) {
        const file = event.target.files[0];
        if (file) {
            // Simulate file upload (in real app, this would upload to server)
            showNotification('Resume uploaded successfully!', 'success');
        }
    }

    saveProfile() {
        const formData = {
            name: document.getElementById('editName').value.trim(),
            rollNumber: document.getElementById('editRollNumber').value.trim(),
            department: document.getElementById('editDepartment').value,
            semester: document.getElementById('editSemester').value,
            cgpa: document.getElementById('editCGPA').value
        };

        // Validate required fields
        if (!formData.name || !formData.rollNumber || !formData.department || !formData.semester || !formData.cgpa) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Get skills
        const selectedSkills = Array.from(document.querySelectorAll('.skill-checkbox:checked')).map(cb => cb.value);
        
        // Get badges
        const badgeInputs = document.querySelectorAll('#badgesList input[type="text"]');
        const badges = Array.from(badgeInputs).map(input => input.value.trim()).filter(badge => badge);

        // Update user profile
        const updates = {
            ...formData,
            profile: {
                ...this.user.profile,
                skills: selectedSkills,
                coverLetter: document.getElementById('editCoverLetter').value.trim(),
                badges: badges,
                resume: this.user.profile?.resume // Keep existing resume
            }
        };

        authSystem.updateCurrentUser(updates);
        this.user = authSystem.getCurrentUser();
        
        closeModal();
        this.initialize(); // Refresh dashboard
        showNotification('Profile updated successfully!', 'success');
    }

    viewJobDetails(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        const userSkills = this.user.profile?.skills || [];
        const matchingSkills = job.requiredSkills.filter(skill => userSkills.includes(skill));
        const matchPercentage = Math.round((matchingSkills.length / job.requiredSkills.length) * 100);

        const modalContent = `
            <div class="modal-header">
                <div>
                    <h3 class="text-lg font-semibold">${job.title}</h3>
                    <p class="text-gray-600">${job.company}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-2">Job Details</h4>
                        <div class="space-y-2 text-sm">
                            <div><strong>Type:</strong> ${job.type}</div>
                            <div><strong>Duration:</strong> ${job.duration}</div>
                            <div><strong>Stipend:</strong> ${job.stipend}</div>
                            <div><strong>Location:</strong> ${job.location}</div>
                            <div><strong>Min CGPA:</strong> ${job.minCGPA}</div>
                            <div><strong>Deadline:</strong> ${new Date(job.applicationDeadline).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Skill Match</h4>
                        <div class="mb-3">
                            <div class="flex justify-between items-center mb-1">
                                <span class="text-sm">Match Percentage</span>
                                <span class="text-sm font-medium">${matchPercentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${matchPercentage}%"></div>
                            </div>
                        </div>
                        <div>
                            <p class="text-sm font-medium mb-2">Required Skills:</p>
                            <div class="flex flex-wrap gap-1">
                                ${job.requiredSkills.map(skill => `
                                    <span class="skill-tag ${userSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-4">
                    <h4 class="font-semibold mb-2">Description</h4>
                    <p class="text-sm text-gray-700">${job.description}</p>
                </div>
                
                <div class="grid grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold mb-2">Requirements</h4>
                        <ul class="text-sm text-gray-700 list-disc list-inside space-y-1">
                            ${job.requirements.map(req => `<li>${req}</li>`).join('')}
                        </ul>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Responsibilities</h4>
                        <ul class="text-sm text-gray-700 list-disc list-inside space-y-1">
                            ${job.responsibilities.map(resp => `<li>${resp}</li>`).join('')}
                        </ul>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Close</button>
                ${this.applications.some(app => app.jobId === jobId && app.studentId === this.user.id) ? 
                    '<span class="badge badge-success">Already Applied</span>' : 
                    `<button type="button" onclick="studentDashboard.applyForJob('${jobId}')" class="btn-primary">Apply Now</button>`
                }
            </div>
        `;
        
        showModal(modalContent);
    }

    applyForJob(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

        // Check if already applied
        const hasApplied = this.applications.some(app => 
            app.jobId === jobId && app.studentId === this.user.id
        );

        if (hasApplied) {
            showNotification('You have already applied for this position', 'warning');
            return;
        }

        // Create application
        const application = {
            id: 'app_' + Date.now(),
            jobId: jobId,
            studentId: this.user.id,
            studentName: this.user.name,
            studentEmail: this.user.email,
            studentDepartment: this.user.department,
            studentCGPA: this.user.cgpa,
            appliedAt: new Date().toISOString(),
            status: 'pending',
            mentorApprovalRequired: true,
            mentorApprovalStatus: 'pending',
            mentorId: null, // Will be assigned by placement cell
            coverLetter: this.user.profile?.coverLetter || '',
            resume: this.user.profile?.resume || null
        };

        this.applications.push(application);
        this.saveApplications();

        closeModal();
        this.initialize(); // Refresh dashboard
        showNotification(`Successfully applied for ${job.title}!`, 'success');
    }
}

// Initialize student dashboard
let studentDashboard;
document.addEventListener('DOMContentLoaded', () => {
    studentDashboard = new StudentDashboard();
    window.studentDashboard = studentDashboard;
});