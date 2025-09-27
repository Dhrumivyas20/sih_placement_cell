// Company/Supervisor Dashboard Management System

class CompanyDashboard {
    constructor() {
        this.user = null;
        this.applications = this.loadApplications();
        this.interviews = this.loadInterviews();
        this.jobs = this.loadJobs();
        this.feedback = this.loadFeedback();
        this.students = [];
    }

    initialize() {
        this.user = authSystem.getCurrentUser();
        if (!this.user || this.user.role !== 'company') return;
        
        this.students = authSystem.getUsersByRole('student');
        
        this.updateDashboardStats();
        this.loadCandidateApplications();
        this.loadInterviewSchedule();
        this.bindEventListeners();
    }

    bindEventListeners() {
        // Any additional event listeners for company dashboard
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

    loadJobs() {
        const jobs = localStorage.getItem('jobs');
        return jobs ? JSON.parse(jobs) : [];
    }

    loadFeedback() {
        const feedback = localStorage.getItem('companyFeedback');
        return feedback ? JSON.parse(feedback) : [];
    }

    saveFeedback() {
        localStorage.setItem('companyFeedback', JSON.stringify(this.feedback));
    }

    updateDashboardStats() {
        // Get jobs posted by company (simulated - in real app would filter by company)
        const companyJobs = this.jobs.filter(job => 
            job.company.toLowerCase().includes(this.user.company?.toLowerCase() || this.user.name.toLowerCase())
        );
        
        const companyJobIds = companyJobs.map(job => job.id);
        const candidates = this.applications.filter(app => companyJobIds.includes(app.jobId));
        
        const scheduledInterviews = this.interviews.filter(interview => 
            companyJobIds.includes(interview.jobId) && 
            interview.status === 'scheduled'
        );
        
        const feedbackGiven = this.feedback.filter(fb => fb.companyId === this.user.id).length;

        document.getElementById('candidatesCount').textContent = candidates.length;
        document.getElementById('interviewsScheduled').textContent = scheduledInterviews.length;
        document.getElementById('feedbackGiven').textContent = feedbackGiven;
    }

    loadCandidateApplications() {
        const container = document.getElementById('candidatesList');
        
        // Get applications for jobs from this company
        const companyJobs = this.jobs.filter(job => 
            job.company.toLowerCase().includes(this.user.company?.toLowerCase() || this.user.name.toLowerCase())
        );
        
        const companyJobIds = companyJobs.map(job => job.id);
        const candidates = this.applications
            .filter(app => companyJobIds.includes(app.jobId) && app.status !== 'pending')
            .sort((a, b) => new Date(b.appliedAt) - new Date(a.appliedAt));

        if (candidates.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No candidates available for review</p>';
            return;
        }

        container.innerHTML = candidates.map(app => {
            const job = this.jobs.find(j => j.id === app.jobId);
            const student = this.students.find(s => s.id === app.studentId);
            const interview = this.interviews.find(i => i.applicationId === app.id);
            
            if (!job || !student) return '';

            const statusColors = {
                approved: 'success',
                interview_scheduled: 'info',
                selected: 'success',
                rejected: 'danger'
            };

            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div class="flex-1">
                            <div class="flex items-center space-x-3 mb-2">
                                <h5 class="font-medium">${app.studentName}</h5>
                                <span class="badge badge-${statusColors[app.status]}">${app.status.replace('_', ' ').toUpperCase()}</span>
                            </div>
                            
                            <div class="text-sm text-gray-600 mb-2">
                                <p><strong>Position:</strong> ${job.title}</p>
                                <p><strong>Department:</strong> ${app.studentDepartment}</p>
                                <p><strong>CGPA:</strong> ${app.studentCGPA}</p>
                                <p><strong>Applied:</strong> ${new Date(app.appliedAt).toLocaleDateString()}</p>
                            </div>

                            ${student.profile?.skills ? `
                                <div class="mb-2">
                                    <p class="text-xs font-medium">Skills:</p>
                                    <div class="flex flex-wrap gap-1 mt-1">
                                        ${student.profile.skills.slice(0, 6).map(skill => `
                                            <span class="skill-tag text-xs ${job.requiredSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                                        `).join('')}
                                        ${student.profile.skills.length > 6 ? `<span class="text-xs text-gray-500">+${student.profile.skills.length - 6} more</span>` : ''}
                                    </div>
                                </div>
                            ` : ''}

                            ${interview ? `
                                <div class="bg-blue-50 p-2 rounded text-xs">
                                    <p><strong>Interview:</strong> ${new Date(interview.datetime).toLocaleString()}</p>
                                    <p><strong>Type:</strong> ${interview.type}</p>
                                    ${interview.meetingLink ? `<a href="${interview.meetingLink}" target="_blank" class="text-blue-600 hover:underline">Join Meeting</a>` : ''}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex flex-col space-y-2 ml-4">
                            <button onclick="companyDashboard.viewCandidateProfile('${app.studentId}', '${app.id}')" class="text-blue-600 text-xs hover:underline">
                                View Profile
                            </button>
                            
                            ${app.status === 'interview_scheduled' && !this.feedback.find(fb => fb.applicationId === app.id) ? `
                                <button onclick="companyDashboard.provideFeedback('${app.id}')" class="btn-primary text-xs px-3 py-1">
                                    Give Feedback
                                </button>
                            ` : ''}
                            
                            ${this.feedback.find(fb => fb.applicationId === app.id) ? `
                                <button onclick="companyDashboard.viewFeedback('${app.id}')" class="text-green-600 text-xs hover:underline">
                                    View Feedback
                                </button>
                            ` : ''}
                            
                            ${app.status === 'approved' && !interview ? `
                                <button onclick="companyDashboard.requestInterview('${app.id}')" class="text-purple-600 text-xs hover:underline">
                                    Request Interview
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    loadInterviewSchedule() {
        const container = document.getElementById('interviewSchedule');
        
        // Get interviews for jobs from this company
        const companyJobs = this.jobs.filter(job => 
            job.company.toLowerCase().includes(this.user.company?.toLowerCase() || this.user.name.toLowerCase())
        );
        
        const companyJobIds = companyJobs.map(job => job.id);
        const upcomingInterviews = this.interviews
            .filter(interview => 
                companyJobIds.includes(interview.jobId) && 
                new Date(interview.datetime) > new Date() &&
                interview.status === 'scheduled'
            )
            .sort((a, b) => new Date(a.datetime) - new Date(b.datetime));

        if (upcomingInterviews.length === 0) {
            container.innerHTML = '<p class="text-gray-500 text-center py-8">No upcoming interviews scheduled</p>';
            return;
        }

        container.innerHTML = upcomingInterviews.map(interview => {
            const job = this.jobs.find(j => j.id === interview.jobId);
            const interviewDate = new Date(interview.datetime);
            
            return `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start">
                        <div>
                            <h5 class="font-medium">${interview.studentName}</h5>
                            <p class="text-sm text-gray-600">${job?.title} Interview</p>
                            <div class="mt-2 text-sm">
                                <p><i class="fas fa-calendar text-blue-500"></i> ${interviewDate.toLocaleDateString()}</p>
                                <p><i class="fas fa-clock text-blue-500"></i> ${interviewDate.toLocaleTimeString()}</p>
                                <p><i class="fas fa-video text-blue-500"></i> ${interview.type}</p>
                                ${interview.interviewers ? `<p><i class="fas fa-user text-blue-500"></i> ${interview.interviewers}</p>` : ''}
                            </div>
                            
                            ${interview.notes ? `
                                <div class="mt-2 bg-yellow-50 p-2 rounded text-xs">
                                    <strong>Notes:</strong> ${interview.notes}
                                </div>
                            ` : ''}
                        </div>
                        
                        <div class="flex flex-col space-y-2">
                            ${interview.meetingLink ? `
                                <a href="${interview.meetingLink}" target="_blank" class="btn-primary text-xs px-3 py-1 text-center">
                                    <i class="fas fa-video"></i> Join
                                </a>
                            ` : ''}
                            
                            <button onclick="companyDashboard.viewCandidateProfile('${interview.studentId}', '${interview.applicationId}')" class="text-blue-600 text-xs hover:underline">
                                View Candidate
                            </button>
                            
                            <button onclick="companyDashboard.rescheduleInterview('${interview.id}')" class="text-yellow-600 text-xs hover:underline">
                                Reschedule
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    viewCandidateProfile(studentId, applicationId) {
        const student = this.students.find(s => s.id === studentId);
        const application = this.applications.find(app => app.id === applicationId);
        
        if (!student || !application) return;

        const job = this.jobs.find(j => j.id === application.jobId);
        const existingFeedback = this.feedback.find(fb => fb.applicationId === applicationId);
        
        // Calculate skill match
        const studentSkills = student.profile?.skills || [];
        const jobSkills = job?.requiredSkills || [];
        const matchingSkills = jobSkills.filter(skill => studentSkills.includes(skill));
        const matchPercentage = jobSkills.length > 0 ? Math.round((matchingSkills.length / jobSkills.length) * 100) : 0;

        const modalContent = `
            <div class="modal-header">
                <div>
                    <h3 class="text-lg font-semibold">${student.name} - Candidate Profile</h3>
                    <p class="text-gray-600">Applied for ${job?.title} at ${job?.company}</p>
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
                            <div><strong>Email:</strong> ${student.email}</div>
                            <div><strong>Roll Number:</strong> ${student.rollNumber || 'N/A'}</div>
                            <div><strong>Department:</strong> ${student.department}</div>
                            <div><strong>Semester:</strong> ${student.semester}${student.semester == 1 ? 'st' : student.semester == 2 ? 'nd' : student.semester == 3 ? 'rd' : 'th'}</div>
                            <div><strong>CGPA:</strong> ${student.cgpa}</div>
                            <div><strong>Applied:</strong> ${new Date(application.appliedAt).toLocaleDateString()}</div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-3">Skill Match Analysis</h4>
                        <div class="mb-3">
                            <div class="flex justify-between items-center mb-2">
                                <span class="text-sm">Match Percentage</span>
                                <span class="text-sm font-medium">${matchPercentage}%</span>
                            </div>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${matchPercentage}%"></div>
                            </div>
                        </div>
                        <div class="text-sm">
                            <p><strong>Matching Skills:</strong> ${matchingSkills.length}/${jobSkills.length}</p>
                            <p><strong>Status:</strong> <span class="badge badge-${application.status === 'selected' ? 'success' : 'info'}">${application.status.replace('_', ' ').toUpperCase()}</span></p>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-2">Student Skills</h4>
                        <div class="flex flex-wrap gap-2">
                            ${studentSkills.map(skill => `
                                <span class="skill-tag ${jobSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                            `).join('')}
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-2">Required Skills</h4>
                        <div class="flex flex-wrap gap-2">
                            ${jobSkills.map(skill => `
                                <span class="skill-tag ${studentSkills.includes(skill) ? 'selected' : ''}">${skill}</span>
                            `).join('')}
                        </div>
                    </div>
                </div>
                
                ${student.profile?.badges?.length > 0 ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-2">Certifications & Badges</h4>
                        <div class="flex flex-wrap gap-2">
                            ${student.profile.badges.map(badge => `<span class="badge badge-info">${badge}</span>`).join('')}
                        </div>
                    </div>
                ` : ''}
                
                ${student.profile?.coverLetter ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-2">Cover Letter</h4>
                        <div class="bg-gray-50 p-4 rounded-lg text-sm">
                            ${student.profile.coverLetter}
                        </div>
                    </div>
                ` : ''}
                
                ${existingFeedback ? `
                    <div class="mb-6">
                        <h4 class="font-semibold mb-2">Previous Feedback</h4>
                        <div class="bg-blue-50 p-4 rounded-lg">
                            <div class="text-sm mb-2">
                                <strong>Overall Rating:</strong> 
                                <span class="ml-2">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star ${i < existingFeedback.overallRating ? 'text-yellow-500' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                </span>
                                (${existingFeedback.overallRating}/5)
                            </div>
                            <p class="text-sm"><strong>Technical Skills:</strong> ${existingFeedback.technicalRating}/5</p>
                            <p class="text-sm"><strong>Communication:</strong> ${existingFeedback.communicationRating}/5</p>
                            <p class="text-sm"><strong>Comments:</strong> ${existingFeedback.comments}</p>
                            <p class="text-xs text-gray-500 mt-2">Feedback given on ${new Date(existingFeedback.createdAt).toLocaleDateString()}</p>
                        </div>
                    </div>
                ` : ''}
                
                <div class="bg-yellow-50 p-4 rounded-lg">
                    <h4 class="font-semibold mb-2">Hiring Recommendation</h4>
                    <div class="text-sm">
                        ${this.generateHiringRecommendation(student, job, matchPercentage)}
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Close</button>
                ${!existingFeedback && application.status === 'interview_scheduled' ? `
                    <button type="button" onclick="companyDashboard.provideFeedback('${applicationId}')" class="btn-primary">
                        Provide Feedback
                    </button>
                ` : ''}
            </div>
        `;

        showModal(modalContent);
    }

    generateHiringRecommendation(student, job, matchPercentage) {
        let recommendation = '';
        let color = '';
        
        if (matchPercentage >= 80) {
            recommendation = '🟢 <strong>Highly Recommended:</strong> Excellent skill match and strong academic performance.';
            color = 'text-green-700';
        } else if (matchPercentage >= 60) {
            recommendation = '🟡 <strong>Recommended:</strong> Good skill match with potential for growth.';
            color = 'text-yellow-700';
        } else if (matchPercentage >= 40) {
            recommendation = '🟠 <strong>Consider with Training:</strong> Moderate match, may need additional training.';
            color = 'text-orange-700';
        } else {
            recommendation = '🔴 <strong>Not Recommended:</strong> Low skill match for this position.';
            color = 'text-red-700';
        }
        
        const cgpaCheck = parseFloat(student.cgpa) >= (job?.minCGPA || 0);
        const cgpaText = cgpaCheck ? 
            '✅ Meets CGPA requirement' : 
            '❌ Does not meet CGPA requirement';
            
        return `
            <p class="${color}">${recommendation}</p>
            <p class="mt-2 text-xs">${cgpaText} (${student.cgpa}/${job?.minCGPA || 'N/A'})</p>
            <p class="text-xs">Skill Match: ${matchPercentage}%</p>
        `;
    }

    provideFeedback(applicationId) {
        const application = this.applications.find(app => app.id === applicationId);
        const student = this.students.find(s => s.id === application?.studentId);
        const job = this.jobs.find(j => j.id === application?.jobId);
        
        if (!application || !student || !job) return;

        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Interview Feedback - ${student.name}</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="mb-4 bg-gray-50 p-3 rounded">
                    <p class="text-sm"><strong>Position:</strong> ${job.title}</p>
                    <p class="text-sm"><strong>Candidate:</strong> ${student.name} (${student.department})</p>
                </div>
                
                <form id="feedbackForm">
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Technical Skills Rating</label>
                            <div class="flex items-center space-x-2">
                                <div class="rating-stars" data-rating="technicalRating">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star cursor-pointer text-gray-300 hover:text-yellow-500" data-value="${i + 1}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-sm text-gray-600" id="technicalRatingText">Rate 1-5</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Communication Skills Rating</label>
                            <div class="flex items-center space-x-2">
                                <div class="rating-stars" data-rating="communicationRating">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star cursor-pointer text-gray-300 hover:text-yellow-500" data-value="${i + 1}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-sm text-gray-600" id="communicationRatingText">Rate 1-5</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div class="form-group">
                            <label class="form-label">Problem Solving Rating</label>
                            <div class="flex items-center space-x-2">
                                <div class="rating-stars" data-rating="problemSolvingRating">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star cursor-pointer text-gray-300 hover:text-yellow-500" data-value="${i + 1}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-sm text-gray-600" id="problemSolvingRatingText">Rate 1-5</span>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Overall Rating</label>
                            <div class="flex items-center space-x-2">
                                <div class="rating-stars" data-rating="overallRating">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star cursor-pointer text-gray-300 hover:text-yellow-500" data-value="${i + 1}"></i>`
                                    ).join('')}
                                </div>
                                <span class="text-sm text-gray-600" id="overallRatingText">Rate 1-5</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Strengths</label>
                        <textarea id="strengths" class="form-textarea" placeholder="What did the candidate do well?"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Areas for Improvement</label>
                        <textarea id="improvements" class="form-textarea" placeholder="What areas could the candidate improve?"></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Overall Comments</label>
                        <textarea id="comments" class="form-textarea" placeholder="Additional comments about the interview..."></textarea>
                    </div>
                    
                    <div class="form-group">
                        <label class="form-label">Hiring Recommendation</label>
                        <select id="recommendation" class="form-select" required>
                            <option value="">Select recommendation</option>
                            <option value="hire">Strongly Recommend - Hire</option>
                            <option value="consider">Consider - Good potential</option>
                            <option value="maybe">Maybe - With reservations</option>
                            <option value="no">Do Not Recommend</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="sendToStudent">
                            <span class="text-sm">Send feedback summary to student</span>
                        </label>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="companyDashboard.submitFeedback('${applicationId}')" class="btn-primary">
                    Submit Feedback
                </button>
            </div>
        `;

        showModal(modalContent);
        this.bindRatingStars();
    }

    bindRatingStars() {
        const ratings = {};
        
        document.querySelectorAll('.rating-stars').forEach(container => {
            const ratingType = container.dataset.rating;
            ratings[ratingType] = 0;
            
            container.querySelectorAll('.fas.fa-star').forEach((star, index) => {
                star.addEventListener('click', () => {
                    ratings[ratingType] = index + 1;
                    this.updateStarDisplay(container, index + 1);
                    document.getElementById(ratingType + 'Text').textContent = `${index + 1}/5`;
                });
                
                star.addEventListener('mouseover', () => {
                    this.updateStarDisplay(container, index + 1, true);
                });
                
                container.addEventListener('mouseleave', () => {
                    this.updateStarDisplay(container, ratings[ratingType]);
                });
            });
        });
        
        this.currentRatings = ratings;
    }

    updateStarDisplay(container, rating, hover = false) {
        container.querySelectorAll('.fas.fa-star').forEach((star, index) => {
            if (index < rating) {
                star.classList.remove('text-gray-300');
                star.classList.add(hover ? 'text-yellow-400' : 'text-yellow-500');
            } else {
                star.classList.remove('text-yellow-400', 'text-yellow-500');
                star.classList.add('text-gray-300');
            }
        });
    }

    submitFeedback(applicationId) {
        const recommendation = document.getElementById('recommendation').value;
        const strengths = document.getElementById('strengths').value.trim();
        const improvements = document.getElementById('improvements').value.trim();
        const comments = document.getElementById('comments').value.trim();
        const sendToStudent = document.getElementById('sendToStudent').checked;

        // Validate ratings
        if (!this.currentRatings.overallRating || !this.currentRatings.technicalRating || 
            !this.currentRatings.communicationRating || !this.currentRatings.problemSolvingRating) {
            showNotification('Please provide all ratings', 'error');
            return;
        }

        if (!recommendation) {
            showNotification('Please select a hiring recommendation', 'error');
            return;
        }

        const feedbackData = {
            id: 'feedback_' + Date.now(),
            applicationId: applicationId,
            companyId: this.user.id,
            companyName: this.user.company || this.user.name,
            technicalRating: this.currentRatings.technicalRating,
            communicationRating: this.currentRatings.communicationRating,
            problemSolvingRating: this.currentRatings.problemSolvingRating,
            overallRating: this.currentRatings.overallRating,
            strengths: strengths,
            improvements: improvements,
            comments: comments,
            recommendation: recommendation,
            sendToStudent: sendToStudent,
            createdAt: new Date().toISOString()
        };

        this.feedback.push(feedbackData);
        this.saveFeedback();

        // Update application status based on recommendation
        const application = this.applications.find(app => app.id === applicationId);
        if (application) {
            if (recommendation === 'hire') {
                application.status = 'selected';
            } else if (recommendation === 'no') {
                application.status = 'rejected';
            }
            // 'consider' and 'maybe' keep current status
            
            this.saveApplications();
        }

        closeModal();
        this.initialize(); // Refresh dashboard
        showNotification('Feedback submitted successfully!', 'success');

        // If sending to student, we would normally send an email/notification
        if (sendToStudent) {
            showNotification('Feedback summary will be sent to the student', 'info');
        }
    }

    viewFeedback(applicationId) {
        const feedback = this.feedback.find(fb => fb.applicationId === applicationId);
        const application = this.applications.find(app => app.id === applicationId);
        
        if (!feedback || !application) return;

        const student = this.students.find(s => s.id === application.studentId);
        const job = this.jobs.find(j => j.id === application.jobId);

        const modalContent = `
            <div class="modal-header">
                <div>
                    <h3 class="text-lg font-semibold">Interview Feedback</h3>
                    <p class="text-gray-600">${student?.name} - ${job?.title}</p>
                </div>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="grid grid-cols-2 gap-6 mb-6">
                    <div>
                        <h4 class="font-semibold mb-3">Ratings</h4>
                        <div class="space-y-2 text-sm">
                            <div class="flex justify-between items-center">
                                <span>Technical Skills:</span>
                                <span class="flex items-center">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star text-xs ${i < feedback.technicalRating ? 'text-yellow-500' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                    <span class="ml-2">${feedback.technicalRating}/5</span>
                                </span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span>Communication:</span>
                                <span class="flex items-center">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star text-xs ${i < feedback.communicationRating ? 'text-yellow-500' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                    <span class="ml-2">${feedback.communicationRating}/5</span>
                                </span>
                            </div>
                            <div class="flex justify-between items-center">
                                <span>Problem Solving:</span>
                                <span class="flex items-center">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star text-xs ${i < feedback.problemSolvingRating ? 'text-yellow-500' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                    <span class="ml-2">${feedback.problemSolvingRating}/5</span>
                                </span>
                            </div>
                            <div class="flex justify-between items-center font-medium">
                                <span>Overall:</span>
                                <span class="flex items-center">
                                    ${Array.from({length: 5}, (_, i) => 
                                        `<i class="fas fa-star text-sm ${i < feedback.overallRating ? 'text-yellow-500' : 'text-gray-300'}"></i>`
                                    ).join('')}
                                    <span class="ml-2">${feedback.overallRating}/5</span>
                                </span>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h4 class="font-semibold mb-3">Recommendation</h4>
                        <div class="text-sm">
                            ${(() => {
                                const recColors = {
                                    hire: 'bg-green-100 text-green-800',
                                    consider: 'bg-blue-100 text-blue-800',
                                    maybe: 'bg-yellow-100 text-yellow-800',
                                    no: 'bg-red-100 text-red-800'
                                };
                                const recTexts = {
                                    hire: 'Strongly Recommend - Hire',
                                    consider: 'Consider - Good potential',
                                    maybe: 'Maybe - With reservations',
                                    no: 'Do Not Recommend'
                                };
                                return `<span class="px-3 py-1 rounded-full ${recColors[feedback.recommendation]}">${recTexts[feedback.recommendation]}</span>`;
                            })()}
                        </div>
                        <div class="mt-4 text-xs text-gray-500">
                            <p>Feedback given on: ${new Date(feedback.createdAt).toLocaleDateString()}</p>
                            <p>By: ${feedback.companyName}</p>
                        </div>
                    </div>
                </div>
                
                ${feedback.strengths ? `
                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Strengths</h4>
                        <div class="bg-green-50 p-3 rounded-lg text-sm">
                            ${feedback.strengths}
                        </div>
                    </div>
                ` : ''}
                
                ${feedback.improvements ? `
                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Areas for Improvement</h4>
                        <div class="bg-yellow-50 p-3 rounded-lg text-sm">
                            ${feedback.improvements}
                        </div>
                    </div>
                ` : ''}
                
                ${feedback.comments ? `
                    <div class="mb-4">
                        <h4 class="font-semibold mb-2">Additional Comments</h4>
                        <div class="bg-gray-50 p-3 rounded-lg text-sm">
                            ${feedback.comments}
                        </div>
                    </div>
                ` : ''}
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Close</button>
                <button type="button" onclick="companyDashboard.editFeedback('${feedback.id}')" class="btn-primary">
                    Edit Feedback
                </button>
            </div>
        `;

        showModal(modalContent);
    }

    requestInterview(applicationId) {
        showNotification('Interview request sent to placement cell', 'info');
        // In a real application, this would send a request to the placement cell
        // to schedule an interview for this candidate
    }

    rescheduleInterview(interviewId) {
        showNotification('Interview reschedule functionality would be implemented here', 'info');
        // In a real application, this would allow the company to request
        // a reschedule of the interview
    }

    editFeedback(feedbackId) {
        showNotification('Edit feedback functionality would open the feedback form with existing data', 'info');
        // In a real application, this would reopen the feedback form
        // with the existing data pre-filled for editing
    }
}

// Initialize company dashboard
let companyDashboard;
document.addEventListener('DOMContentLoaded', () => {
    companyDashboard = new CompanyDashboard();
    window.companyDashboard = companyDashboard;
});