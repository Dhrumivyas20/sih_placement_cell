// Faculty Mentor Dashboard Management System

class FacultyDashboard {
    constructor() {
        this.user = null;
        this.applications = this.loadApplications();
        this.students = [];
        this.jobs = this.loadJobs();
        this.mentorships = this.loadMentorships();
    }

    initialize() {
        this.user = authSystem.getCurrentUser();
        if (!this.user || this.user.role !== 'faculty') return;
        
        this.students = authSystem.getUsersByRole('student').filter(student => 
            student.department === this.user.department
        );
        
        this.updateDashboardStats();
        this.loadPendingApprovals();
        this.loadMentees();
        this.assignMentorships();
    }

    loadApplications() {
        const applications = localStorage.getItem('applications');
        return applications ? JSON.parse(applications) : [];
    }

    saveApplications() {
        localStorage.setItem('applications', JSON.stringify(this.applications));
    }

    loadJobs() {
        const jobs = localStorage.getItem('jobs');
        return jobs ? JSON.parse(jobs) : [];
    }

    loadMentorships() {
        const mentorships = localStorage.getItem('mentorships');
        return mentorships ? JSON.parse(mentorships) : this.initializeMentorships();
    }

    saveMentorships() {
        localStorage.setItem('mentorships', JSON.stringify(this.mentorships));
    }

    initializeMentorships() {
        // Automatically assign students to faculty members based on department
        const facultyMembers = authSystem.getUsersByRole('faculty');
        const allStudents = authSystem.getUsersByRole('student');
        const mentorships = [];

        // Distribute students among faculty members in the same department
        facultyMembers.forEach(faculty => {
            const deptStudents = allStudents.filter(student => student.department === faculty.department);
            const studentsPerFaculty = Math.ceil(deptStudents.length / facultyMembers.filter(f => f.department === faculty.department).length);
            
            // Assign students to this faculty member
            const assignedStudents = deptStudents.slice(0, studentsPerFaculty);
            assignedStudents.forEach(student => {
                mentorships.push({
                    id: 'mentorship_' + Date.now() + '_' + Math.random(),
                    facultyId: faculty.id,
                    studentId: student.id,
                    assignedAt: new Date().toISOString(),
                    status: 'active'
                });
            });
        });

        this.mentorships = mentorships;
        this.saveMentorships();
        return mentorships;
    }

    assignMentorships() {
        // Auto-assign mentor to pending applications from mentees
        const myMentees = this.mentorships
            .filter(m => m.facultyId === this.user.id && m.status === 'active')
            .map(m => m.studentId);

        this.applications.forEach(app => {
            if (myMentees.includes(app.studentId) && !app.mentorId) {
                app.mentorId = this.user.id;
            }
        });

        this.saveApplications();
    }

    updateDashboardStats() {
        const myMentees = this.mentorships
            .filter(m => m.facultyId === this.user.id && m.status === 'active')
            .map(m => m.studentId);

        const pendingApprovals = this.applications.filter(app => 
            app.mentorId === this.user.id && 
            app.mentorApprovalStatus === 'pending'
        ).length;

        const thisWeekStart = new Date();
        thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
        thisWeekStart.setHours(0, 0, 0, 0);

        const approvedThisWeek = this.applications.filter(app => 
            app.mentorId === this.user.id && 
            app.mentorApprovalStatus === 'approved' &&
            new Date(app.mentorApprovedAt) >= thisWeekStart
        ).length;

        document.getElementById('menteeCount').textContent = myMentees.length;
        document.getElementById('pendingApprovalsF').textContent = pendingApprovals;
        document.getElementById('approvedApps').textContent = approvedThisWeek;
    }

    loadPendingApprovals() {
        const container = document.getElementById('pendingApprovalsList');
        const pendingApprovals = this.applications.filter(app => 
            app.mentorId === this.user.id && 
            app.mentorApprovalStatus === 'pending'
        );

        if (pendingApprovals.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No pending approvals</p>';
            return;
        }

        container.innerHTML = pendingApprovals.map(app => {
            const job = this.jobs.find(j => j.id === app.jobId);
            const student = this.students.find(s => s.id === app.studentId);
            
            if (!job || !student) return '';

            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h5 class="font-medium">${job.title}</h5>
                            <p class="text-sm text-gray-600">${job.company}</p>
                            <div class="mt-2">
                                <p class="text-sm"><strong>Student:</strong> ${app.studentName}</p>
                                <p class="text-sm"><strong>Department:</strong> ${app.studentDepartment}</p>
                                <p class="text-sm"><strong>CGPA:</strong> ${app.studentCGPA}</p>
                                <p class="text-sm text-gray-500">Applied: ${new Date(app.appliedAt).toLocaleDateString()}</p>
                            </div>
                            
                            ${student.profile?.skills ? `
                                <div class="mt-2">
                                    <p class="text-xs font-medium">Student Skills:</p>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        ${student.profile.skills.map(skill => `
                                            <span class="skill-tag ${job.requiredSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                            
                            ${job.requiredSkills ? `
                                <div class="mt-2">
                                    <p class="text-xs font-medium">Required Skills:</p>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        ${job.requiredSkills.map(skill => `
                                            <span class="skill-tag">${skill}</span>
                                        `).join('')}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="facultyDashboard.viewApplicationDetails('${app.id}')" class="text-blue-600 text-sm hover:underline">
                                View Details
                            </button>
                            <button onclick="facultyDashboard.approveApplication('${app.id}')" class="btn-primary text-xs px-3 py-1">
                                Approve
                            </button>
                            <button onclick="facultyDashboard.rejectApplication('${app.id}')" class="btn-secondary text-xs px-3 py-1">
                                Reject
                            </button>
                            <button onclick="facultyDashboard.requestMoreInfo('${app.id}')" class="text-yellow-600 text-xs hover:underline">
                                Request Info
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadMentees() {
        const container = document.getElementById('menteesList');
        const myMenteeIds = this.mentorships
            .filter(m => m.facultyId === this.user.id && m.status === 'active')
            .map(m => m.studentId);

        const mentees = this.students.filter(student => myMenteeIds.includes(student.id));

        if (mentees.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No mentees assigned</p>';
            return;
        }

        container.innerHTML = mentees.map(student => {
            const studentApplications = this.applications.filter(app => app.studentId === student.id);
            const approvedApps = studentApplications.filter(app => app.mentorApprovalStatus === 'approved').length;
            const pendingApps = studentApplications.filter(app => app.mentorApprovalStatus === 'pending').length;
            const placedCount = studentApplications.filter(app => app.status === 'selected').length;

            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <h5 class="font-medium">${student.name}</h5>
                            <p class="text-sm text-gray-600">${student.rollNumber}</p>
                            <div class="mt-1 text-xs text-gray-500">
                                <p>Semester: ${student.semester} | CGPA: ${student.cgpa}</p>
                                <p>Email: ${student.email}</p>
                            </div>
                            
                            <div class="mt-2 text-xs">
                                <span class="text-green-600">✓ ${approvedApps} Approved</span> • 
                                <span class="text-yellow-600">⏳ ${pendingApps} Pending</span> • 
                                <span class="text-purple-600">🎯 ${placedCount} Placed</span>
                            </div>
                            
                            ${student.profile?.skills ? `
                                <div class="mt-2">
                                    <p class="text-xs font-medium">Skills:</p>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        ${student.profile.skills.slice(0, 5).map(skill => `
                                            <span class="skill-tag text-xs">${skill}</span>
                                        `).join('')}
                                        ${student.profile.skills.length > 5 ? `<span class="text-xs text-gray-500">+${student.profile.skills.length - 5} more</span>` : ''}
                                    </div>
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="facultyDashboard.viewStudentProfile('${student.id}')" class="text-blue-600 text-xs hover:underline">
                                View Profile
                            </button>
                            <button onclick="facultyDashboard.viewStudentApplications('${student.id}')" class="text-green-600 text-xs hover:underline">
                                Applications
                            </button>
                            <button onclick="facultyDashboard.sendMessage('${student.id}')" class="text-purple-600 text-xs hover:underline">
                                Send Message
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    viewApplicationDetails(applicationId) {
        const app = this.applications.find(a => a.id === applicationId);
        if (!app) return;

        const job = this.jobs.find(j => j.id === app.jobId);
        const student = this.students.find(s => s.id === app.studentId);

        if (!job || !student) return;

        // Calculate skill match
        const studentSkills = student.profile?.skills || [];
        const matchingSkills = job.requiredSkills.filter(skill => studentSkills.includes(skill));
        const matchPercentage = job.requiredSkills.length > 0 ? Math.round((matchingSkills.length / job.requiredSkills.length) * 100) : 0;

        const modalContent = `
            <div class="modal-header">
                <div>
                    <h3 class="text-lg font-semibold">Application Review</h3>
                    <p class="text-gray-600">${student.name} → ${job.title} at ${job.company}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-3">Student Information</h4>
                        <div class="space-y-2 text-sm">
                            <div><strong>Name:</strong> ${student.name}</div>
                            <div><strong>Roll Number:</strong> ${student.rollNumber}</div>
                            <div><strong>Email:</strong> ${student.email}</div>
                            <div><strong>Department:</strong> ${student.department}</div>
                            <div><strong>Semester:</strong> ${student.semester}</div>
                            <div><strong>CGPA:</strong> ${student.cgpa}</div>
                            <div><strong>Applied On:</strong> ${new Date(app.appliedAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-3">Job Information</h4>
                        <div class="space-y-2 text-sm">
                            <div><strong>Position:</strong> ${job.title}</div>
                            <div><strong>Company:</strong> ${job.company}</div>
                            <div><strong>Type:</strong> ${job.type}</div>
                            <div><strong>Location:</strong> ${job.location}</div>
                            <div><strong>Duration:</strong> ${job.duration}</div>
                            <div><strong>Stipend:</strong> ${job.stipend}</div>
                            <div><strong>Min CGPA:</strong> ${job.minCGPA}</div>
                            <div><strong>Deadline:</strong> ${new Date(job.applicationDeadline).toLocaleDateString()}</div>
                        </div>
                    </div>
                </div>
                
                <div class="mb-6">
                    <h4 class="font-semibold mb-3">Skill Match Analysis</h4>
                    <div class="mb-3">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-sm">Overall Match</span>
                            <span class="text-sm font-medium">${matchPercentage}%</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${matchPercentage}%"></div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <p class="text-sm font-medium mb-2">Required Skills:</p>
                            <div class="flex flex-wrap gap-1">
                                ${job.requiredSkills.map(skill => `
                                    <span class="skill-tag ${studentSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                                `).join('')}
                            </div>
                        </div>
                        <div>
                            <p class="text-sm font-medium mb-2">Student Skills:</p>
                            <div class="flex flex-wrap gap-1">
                                ${studentSkills.map(skill => `
                                    <span class="skill-tag ${job.requiredSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
                
                ${student.profile?.coverLetter ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-2">Cover Letter</h4>
                        <div class="bg-gray-50 p-4 rounded-lg text-sm">
                            ${student.profile.coverLetter}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mb-4">
                    <h4 class="font-semibold mb-2">Eligibility Check</h4>
                    <div class="space-y-2 text-sm">
                        <div class="flex items-center space-x-2">
                            <span class="${student.department && job.department.includes(student.department) ? 'text-green-600' : 'text-red-600'}">
                                ${student.department && job.department.includes(student.department) ? '✓' : '✗'}
                            </span>
                            <span>Department Eligibility: ${student.department} ${job.department.includes(student.department) ? 'is eligible' : 'not in eligible departments'}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="${parseFloat(student.cgpa) >= job.minCGPA ? 'text-green-600' : 'text-red-600'}">
                                ${parseFloat(student.cgpa) >= job.minCGPA ? '✓' : '✗'}
                            </span>
                            <span>CGPA Requirement: ${student.cgpa} ${parseFloat(student.cgpa) >= job.minCGPA ? 'meets' : 'does not meet'} minimum ${job.minCGPA}</span>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span class="${matchPercentage >= 50 ? 'text-green-600' : matchPercentage >= 25 ? 'text-yellow-600' : 'text-red-600'}">
                                ${matchPercentage >= 50 ? '✓' : matchPercentage >= 25 ? '⚠' : '✗'}
                            </span>
                            <span>Skill Match: ${matchPercentage}% (${matchPercentage >= 50 ? 'Good' : matchPercentage >= 25 ? 'Moderate' : 'Low'} match)</span>
                        </div>
                    </div>
                </div>
                
                <div class="form-group">
                    <label class="form-label">Mentor Comments (Optional)</label>
                    <textarea id="mentorComments" class="form-textarea" placeholder="Add your comments, recommendations, or concerns..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="facultyDashboard.requestMoreInfo('${app.id}', true)" class="text-yellow-600 border border-yellow-600 px-4 py-2 rounded hover:bg-yellow-50">
                    Request More Info
                </button>
                <button type="button" onclick="facultyDashboard.rejectApplication('${app.id}', true)" class="text-red-600 border border-red-600 px-4 py-2 rounded hover:bg-red-50">
                    Reject
                </button>
                <button type="button" onclick="facultyDashboard.approveApplication('${app.id}', true)" class="btn-primary">
                    Approve
                </button>
            </div>
        `;

        showModal(modalContent);
    }

    approveApplication(applicationId, fromModal = false) {
        const app = this.applications.find(a => a.id === applicationId);
        if (!app) return;

        const comments = fromModal ? document.getElementById('mentorComments')?.value.trim() : '';

        // Update application
        app.mentorApprovalStatus = 'approved';
        app.mentorApprovedAt = new Date().toISOString();
        app.mentorComments = comments;

        this.saveApplications();

        if (fromModal) closeModal();
        this.initialize(); // Refresh dashboard

        const job = this.jobs.find(j => j.id === app.jobId);
        showNotification(`Application approved for ${job?.title || 'position'}`, 'success');
    }

    rejectApplication(applicationId, fromModal = false) {
        const app = this.applications.find(a => a.id === applicationId);
        if (!app) return;

        const comments = fromModal ? document.getElementById('mentorComments')?.value.trim() : '';

        if (fromModal && !comments) {
            showNotification('Please provide comments when rejecting an application', 'error');
            return;
        }

        // Update application
        app.mentorApprovalStatus = 'rejected';
        app.mentorRejectedAt = new Date().toISOString();
        app.mentorComments = comments || 'Application rejected by mentor';
        app.status = 'rejected'; // Also update the main status

        this.saveApplications();

        if (fromModal) closeModal();
        this.initialize(); // Refresh dashboard

        const job = this.jobs.find(j => j.id === app.jobId);
        showNotification(`Application rejected for ${job?.title || 'position'}`, 'info');
    }

    requestMoreInfo(applicationId, fromModal = false) {
        const app = this.applications.find(a => a.id === applicationId);
        if (!app) return;

        const comments = fromModal ? document.getElementById('mentorComments')?.value.trim() : '';

        if (!comments && fromModal) {
            showNotification('Please provide specific information request in comments', 'error');
            return;
        }

        // Update application
        app.mentorApprovalStatus = 'info_requested';
        app.mentorRequestedAt = new Date().toISOString();
        app.mentorComments = comments || 'More information requested';

        this.saveApplications();

        if (fromModal) closeModal();
        this.initialize(); // Refresh dashboard

        const job = this.jobs.find(j => j.id === app.jobId);
        showNotification(`Information requested for ${job?.title || 'position'}`, 'info');
    }

    viewStudentProfile(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const studentApplications = this.applications.filter(app => app.studentId === studentId);
        const approvedApps = studentApplications.filter(app => app.mentorApprovalStatus === 'approved');
        const rejectedApps = studentApplications.filter(app => app.mentorApprovalStatus === 'rejected');
        const pendingApps = studentApplications.filter(app => app.mentorApprovalStatus === 'pending');

        const modalContent = `
            <div class="modal-header">
                <div>
                    <h3 class="text-lg font-semibold">${student.name} - Complete Profile</h3>
                    <p class="text-gray-600">Mentee Profile & Performance</p>
                </div>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-3">Personal Information</h4>
                        <div class="space-y-2 text-sm">
                            <div><strong>Roll Number:</strong> ${student.rollNumber}</div>
                            <div><strong>Email:</strong> ${student.email}</div>
                            <div><strong>Department:</strong> ${student.department}</div>
                            <div><strong>Semester:</strong> ${student.semester}</div>
                            <div><strong>CGPA:</strong> ${student.cgpa}</div>
                            <div><strong>Joined:</strong> ${new Date(student.created).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-3">Application Statistics</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between">
                                <span>Total Applications:</span>
                                <span class="font-medium">${studentApplications.length}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Pending Approval:</span>
                                <span class="font-medium text-yellow-600">${pendingApps.length}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Approved:</span>
                                <span class="font-medium text-green-600">${approvedApps.length}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Rejected:</span>
                                <span class="font-medium text-red-600">${rejectedApps.length}</span>
                            </div>
                            <div class="flex justify-between">
                                <span>Selected:</span>
                                <span class="font-medium text-purple-600">${studentApplications.filter(app => app.status === 'selected').length}</span>
                            </div>
                        </div>
                    </div>
                </div>
                
                ${student.profile?.skills ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-3">Skills & Competencies</h4>
                        <div class="flex flex-wrap gap-2">
                            ${student.profile.skills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${student.profile?.badges?.length > 0 ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-3">Certifications & Badges</h4>
                        <div class="flex flex-wrap gap-2">
                            ${student.profile.badges.map(badge => `<span class="badge badge-info">${badge}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${student.profile?.coverLetter ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-3">Cover Letter</h4>
                        <div class="bg-gray-50 p-4 rounded-lg text-sm">
                            ${student.profile.coverLetter}
                        </div>
                    </div>
                ` : ''}
                
                <div class="mb-6">
                    <h4 class="font-semibold mb-3">Recent Applications</h4>
                    <div class="space-y-2">
                        ${studentApplications.slice(0, 5).map(app => {
                            const job = this.jobs.find(j => j.id === app.jobId);
                            const statusColors = {
                                pending: 'warning',
                                approved: 'success',
                                rejected: 'danger',
                                info_requested: 'info'
                            };
                            
                            return `
                                <div class="flex justify-between items-center p-3 border border-gray-200 rounded">
                                    <div>
                                        <p class="font-medium text-sm">${job?.title || 'Unknown Position'}</p>
                                        <p class="text-xs text-gray-600">${job?.company}</p>
                                        <p class="text-xs text-gray-500">Applied: ${new Date(app.appliedAt).toLocaleDateString()}</p>
                                    </div>
                                    <div class="text-right">
                                        <span class="badge badge-${statusColors[app.mentorApprovalStatus] || 'warning'}">${app.mentorApprovalStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}</span>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                        ${studentApplications.length > 5 ? `<p class="text-xs text-gray-500 text-center">And ${studentApplications.length - 5} more applications...</p>` : ''}
                    </div>
                </div>
                
                <div>
                    <h4 class="font-semibold mb-3">Mentor Notes</h4>
                    <textarea id="mentorNotes" class="form-textarea" placeholder="Add private notes about this student's progress, strengths, areas for improvement..."></textarea>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Close</button>
                <button type="button" onclick="facultyDashboard.saveMentorNotes('${studentId}')" class="btn-primary">
                    Save Notes
                </button>
            </div>
        `;

        showModal(modalContent);
    }

    viewStudentApplications(studentId) {
        const student = this.students.find(s => s.id === studentId);
        const studentApplications = this.applications.filter(app => app.studentId === studentId);

        if (!student) return;

        const modalContent = `
            <div class="modal-header">
                <div>
                    <h3 class="text-lg font-semibold">${student.name} - All Applications</h3>
                    <p class="text-gray-600">${studentApplications.length} applications</p>
                </div>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${studentApplications.length === 0 ? 
                    '<p class="text-gray-500 text-center py-8">No applications submitted yet</p>' :
                    `
                    <div class="space-y-4">
                        ${studentApplications.map(app => {
                            const job = this.jobs.find(j => j.id === app.jobId);
                            const statusColors = {
                                pending: 'warning',
                                approved: 'success',
                                rejected: 'danger',
                                info_requested: 'info',
                                interview_scheduled: 'info',
                                selected: 'success'
                            };
                            
                            return `
                                <div class="border border-gray-200 rounded-lg p-4">
                                    <div class="flex justify-between items-start">
                                        <div class="flex-1">
                                            <h5 class="font-medium">${job?.title || 'Unknown Position'}</h5>
                                            <p class="text-sm text-gray-600">${job?.company}</p>
                                            <div class="mt-2 text-sm">
                                                <p><strong>Applied:</strong> ${new Date(app.appliedAt).toLocaleDateString()}</p>
                                                <p><strong>Status:</strong> <span class="badge badge-${statusColors[app.status] || 'warning'}">${app.status?.replace('_', ' ').toUpperCase() || 'PENDING'}</span></p>
                                                <p><strong>Mentor Status:</strong> <span class="badge badge-${statusColors[app.mentorApprovalStatus] || 'warning'}">${app.mentorApprovalStatus?.replace('_', ' ').toUpperCase() || 'PENDING'}</span></p>
                                                ${app.mentorComments ? `<p><strong>Mentor Comments:</strong> ${app.mentorComments}</p>` : ''}
                                            </div>
                                        </div>
                                        <div class="flex flex-col space-y-2 ml-4">
                                            ${app.mentorApprovalStatus === 'pending' ? `
                                                <button onclick="facultyDashboard.viewApplicationDetails('${app.id}')" class="btn-primary text-xs px-3 py-1">
                                                    Review
                                                </button>
                                            ` : ''}
                                            <button onclick="facultyDashboard.viewJobDetails('${app.jobId}')" class="text-blue-600 text-xs hover:underline">
                                                View Job
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
            </div>
        `;

        showModal(modalContent);
    }

    viewJobDetails(jobId) {
        const job = this.jobs.find(j => j.id === jobId);
        if (!job) return;

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
                            <div><strong>Location:</strong> ${job.location}</div>
                            <div><strong>Stipend:</strong> ${job.stipend}</div>
                            <div><strong>Min CGPA:</strong> ${job.minCGPA}</div>
                            <div><strong>Deadline:</strong> ${new Date(job.applicationDeadline).toLocaleDateString()}</div>
                            <div><strong>Status:</strong> <span class="badge badge-${job.status === 'active' ? 'success' : 'warning'}">${job.status.toUpperCase()}</span></div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Eligible Departments</h4>
                        <div class="flex flex-wrap gap-2 mb-4">
                            ${job.department.map(dept => `<span class="badge badge-info">${dept}</span>`).join('')}
                        </div>
                        
                        <h4 class="font-semibold mb-2">Required Skills</h4>
                        <div class="flex flex-wrap gap-2">
                            ${job.requiredSkills.map(skill => `<span class="skill-tag">${skill}</span>`).join('')}
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
            </div>
        `;

        showModal(modalContent);
    }

    sendMessage(studentId) {
        const student = this.students.find(s => s.id === studentId);
        if (!student) return;

        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Send Message to ${student.name}</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="messageForm">
                    <div class="form-group">
                        <label class="form-label">Subject</label>
                        <select id="messageSubject" class="form-select" onchange="facultyDashboard.updateMessageTemplate()">
                            <option value="">Select a subject</option>
                            <option value="application_feedback">Application Feedback</option>
                            <option value="career_guidance">Career Guidance</option>
                            <option value="skill_improvement">Skill Improvement Suggestions</option>
                            <option value="interview_preparation">Interview Preparation</option>
                            <option value="general">General Mentorship</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Message</label>
                        <textarea id="messageBody" class="form-textarea" rows="6" placeholder="Type your message here..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="markImportant">
                            <span class="text-sm">Mark as important</span>
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="facultyDashboard.sendMessageToStudent('${studentId}')" class="btn-primary">
                    <i class="fas fa-paper-plane"></i> Send Message
                </button>
            </div>
        `;

        showModal(modalContent);
    }

    updateMessageTemplate() {
        const subject = document.getElementById('messageSubject').value;
        const messageBody = document.getElementById('messageBody');
        
        const templates = {
            application_feedback: `Dear Student,

I have reviewed your recent applications and would like to provide some feedback to help improve your future applications.

[Add your specific feedback here]

Best regards,
${this.user.name}
Faculty Mentor`,
            
            career_guidance: `Dear Student,

I wanted to reach out to provide some career guidance based on your profile and interests.

[Add your career advice here]

Feel free to schedule a meeting if you'd like to discuss this further.

Best regards,
${this.user.name}
Faculty Mentor`,
            
            skill_improvement: `Dear Student,

Based on the current job market trends and your career goals, I recommend focusing on developing the following skills:

[List specific skills and resources here]

Best regards,
${this.user.name}
Faculty Mentor`,
            
            interview_preparation: `Dear Student,

Congratulations on your upcoming interview! Here are some tips to help you prepare:

[Add interview preparation tips here]

Best wishes for your interview!

${this.user.name}
Faculty Mentor`,
            
            general: `Dear Student,

I hope you are doing well in your studies and placement preparations.

[Add your message here]

Best regards,
${this.user.name}
Faculty Mentor`
        };

        if (templates[subject]) {
            messageBody.value = templates[subject];
        }
    }

    sendMessageToStudent(studentId) {
        const subject = document.getElementById('messageSubject').value;
        const message = document.getElementById('messageBody').value.trim();
        const important = document.getElementById('markImportant').checked;

        if (!subject || !message) {
            showNotification('Please fill in both subject and message', 'error');
            return;
        }

        // In a real application, this would send the message to the student
        // For now, we'll just simulate it
        const messageData = {
            id: 'msg_' + Date.now(),
            from: this.user.id,
            to: studentId,
            subject: subject,
            message: message,
            important: important,
            sentAt: new Date().toISOString(),
            read: false
        };

        // Store message (in a real app, this would go to a messages system)
        const messages = JSON.parse(localStorage.getItem('messages') || '[]');
        messages.push(messageData);
        localStorage.setItem('messages', JSON.stringify(messages));

        closeModal();
        showNotification('Message sent successfully!', 'success');
    }

    saveMentorNotes(studentId) {
        const notes = document.getElementById('mentorNotes').value.trim();
        
        // Store mentor notes (in a real app, this would be stored in the database)
        const mentorNotes = JSON.parse(localStorage.getItem('mentorNotes') || '{}');
        mentorNotes[studentId] = {
            notes: notes,
            mentorId: this.user.id,
            updatedAt: new Date().toISOString()
        };
        localStorage.setItem('mentorNotes', JSON.stringify(mentorNotes));

        closeModal();
        showNotification('Mentor notes saved successfully!', 'success');
    }
}

// Initialize faculty dashboard
let facultyDashboard;
document.addEventListener('DOMContentLoaded', () => {
    facultyDashboard = new FacultyDashboard();
    window.facultyDashboard = facultyDashboard;
});