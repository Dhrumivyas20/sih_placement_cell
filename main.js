// Main Application Coordinator

class CampusPortalApp {
    constructor() {
        this.currentUser = null;
        this.initialized = false;
    }

    initialize() {
        if (this.initialized) return;
        
        console.log('Campus Placement Portal - Initializing...');
        
        // Wait for all systems to be ready
        this.waitForSystems().then(() => {
            this.bindGlobalEventListeners();
            this.setupRecommendationEngine();
            this.setupNotifications();
            this.initialized = true;
            console.log('Campus Placement Portal - Ready!');
        });
    }

    async waitForSystems() {
        // Wait for DOM to be fully loaded
        if (document.readyState !== 'complete') {
            await new Promise(resolve => {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', resolve);
                } else {
                    resolve();
                }
            });
        }

        // Wait for all dashboard systems to be initialized
        let retries = 0;
        const maxRetries = 20;
        
        while (retries < maxRetries) {
            try {
                if (typeof authSystem !== 'undefined' && 
                    typeof studentDashboard !== 'undefined' && 
                    typeof placementDashboard !== 'undefined' && 
                    typeof facultyDashboard !== 'undefined' && 
                    typeof companyDashboard !== 'undefined') {
                    break;
                }
            } catch (e) {
                // Systems still loading
            }
            await new Promise(resolve => setTimeout(resolve, 200));
            retries++;
        }
        
        if (retries >= maxRetries) {
            console.warn('Some systems may not have loaded properly');
        }
    }

    bindGlobalEventListeners() {
        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Escape key closes modals
            if (e.key === 'Escape') {
                closeModal();
            }
            
            // Ctrl+K for quick search (future feature)
            if (e.ctrlKey && e.key === 'k') {
                e.preventDefault();
                this.openQuickSearch();
            }
        });

        // Global click handler for dynamic content
        document.addEventListener('click', (e) => {
            // Handle dropdown toggles
            if (e.target.matches('.dropdown-toggle')) {
                this.toggleDropdown(e.target);
            }
            
            // Close dropdowns when clicking outside
            if (!e.target.closest('.dropdown')) {
                document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
                    menu.classList.remove('show');
                });
            }
        });

        // Handle learn more button
        document.getElementById('learnMoreBtn').addEventListener('click', () => {
            this.showAboutModal();
        });
    }

    setupRecommendationEngine() {
        // This would be enhanced with more sophisticated algorithms
        this.recommendationEngine = new JobRecommendationEngine();
    }

    setupNotifications() {
        // Set up periodic checks for new notifications
        setInterval(() => {
            this.checkForNotifications();
        }, 30000); // Check every 30 seconds
    }

    checkForNotifications() {
        if (!authSystem?.currentUser) return;

        const user = authSystem.currentUser;
        
        if (user.role === 'student') {
            this.checkStudentNotifications(user);
        } else if (user.role === 'faculty') {
            this.checkFacultyNotifications(user);
        } else if (user.role === 'placement_cell') {
            this.checkPlacementNotifications(user);
        }
    }

    checkStudentNotifications(user) {
        // Check for interview reminders
        const interviews = JSON.parse(localStorage.getItem('interviews') || '[]');
        const upcomingInterviews = interviews.filter(interview => {
            if (interview.studentId !== user.id) return false;
            
            const interviewTime = new Date(interview.datetime);
            const now = new Date();
            const timeDiff = interviewTime.getTime() - now.getTime();
            const hoursDiff = timeDiff / (1000 * 3600);
            
            return hoursDiff > 0 && hoursDiff <= 24; // Within 24 hours
        });

        upcomingInterviews.forEach(interview => {
            const hours = Math.ceil((new Date(interview.datetime).getTime() - new Date().getTime()) / (1000 * 3600));
            if (hours <= 2 && !this.hasNotificationBeenShown(`interview_${interview.id}`)) {
                this.showSystemNotification(
                    `Interview reminder: You have an interview in ${hours} hour(s)`,
                    'warning'
                );
                this.markNotificationAsShown(`interview_${interview.id}`);
            }
        });
    }

    checkFacultyNotifications(user) {
        // Check for pending approvals
        const applications = JSON.parse(localStorage.getItem('applications') || '[]');
        const pendingCount = applications.filter(app => 
            app.mentorId === user.id && 
            app.mentorApprovalStatus === 'pending'
        ).length;

        if (pendingCount > 0 && !this.hasNotificationBeenShown('pending_approvals_' + pendingCount)) {
            this.showSystemNotification(
                `You have ${pendingCount} applications waiting for approval`,
                'info'
            );
            this.markNotificationAsShown('pending_approvals_' + pendingCount);
        }
    }

    checkPlacementNotifications(user) {
        // Check for application deadlines
        const jobs = JSON.parse(localStorage.getItem('jobs') || '[]');
        const upcomingDeadlines = jobs.filter(job => {
            if (job.status !== 'active') return false;
            
            const deadline = new Date(job.applicationDeadline);
            const now = new Date();
            const timeDiff = deadline.getTime() - now.getTime();
            const daysDiff = timeDiff / (1000 * 3600 * 24);
            
            return daysDiff > 0 && daysDiff <= 3; // Within 3 days
        });

        upcomingDeadlines.forEach(job => {
            const days = Math.ceil((new Date(job.applicationDeadline).getTime() - new Date().getTime()) / (1000 * 3600 * 24));
            if (!this.hasNotificationBeenShown(`deadline_${job.id}`)) {
                this.showSystemNotification(
                    `Application deadline approaching: ${job.title} (${days} day(s) left)`,
                    'warning'
                );
                this.markNotificationAsShown(`deadline_${job.id}`);
            }
        });
    }

    hasNotificationBeenShown(notificationId) {
        const shown = JSON.parse(localStorage.getItem('shownNotifications') || '{}');
        const today = new Date().toDateString();
        return shown[notificationId] === today;
    }

    markNotificationAsShown(notificationId) {
        const shown = JSON.parse(localStorage.getItem('shownNotifications') || '{}');
        shown[notificationId] = new Date().toDateString();
        localStorage.setItem('shownNotifications', JSON.stringify(shown));
    }

    showSystemNotification(message, type) {
        showNotification(message, type);
    }

    toggleDropdown(toggle) {
        const dropdown = toggle.closest('.dropdown');
        const menu = dropdown.querySelector('.dropdown-menu');
        
        // Close other dropdowns
        document.querySelectorAll('.dropdown-menu.show').forEach(otherMenu => {
            if (otherMenu !== menu) {
                otherMenu.classList.remove('show');
            }
        });
        
        menu.classList.toggle('show');
    }

    openQuickSearch() {
        // Future feature - global search functionality
        showNotification('Quick search feature coming soon!', 'info');
    }

    showAboutModal() {
        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">About Campus Placement Portal</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <div class="space-y-6">
                    <div>
                        <h4 class="font-semibold mb-3">What is Campus Placement Portal?</h4>
                        <p class="text-gray-700 text-sm leading-relaxed">
                            Campus Placement Portal is a comprehensive digital platform designed to streamline the entire 
                            placement and internship process for educational institutions. It replaces traditional paper-based 
                            systems with a modern, efficient, and transparent digital solution.
                        </p>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-3">Key Features</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h5 class="font-medium mb-2">For Students:</h5>
                                <ul class="space-y-1 text-gray-700">
                                    <li>• Digital profile management</li>
                                    <li>• One-click job applications</li>
                                    <li>• Personalized job recommendations</li>
                                    <li>• Application tracking</li>
                                    <li>• Interview scheduling</li>
                                    <li>• Skill badge system</li>
                                </ul>
                            </div>
                            <div>
                                <h5 class="font-medium mb-2">For Placement Cell:</h5>
                                <ul class="space-y-1 text-gray-700">
                                    <li>• Job posting management</li>
                                    <li>• Application analytics</li>
                                    <li>• Student progress tracking</li>
                                    <li>• Company coordination</li>
                                    <li>• Placement statistics</li>
                                    <li>• Report generation</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-3">For Faculty & Companies</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h5 class="font-medium mb-2">Faculty Mentors:</h5>
                                <ul class="space-y-1 text-gray-700">
                                    <li>• Student mentorship tracking</li>
                                    <li>• Application approvals</li>
                                    <li>• Progress monitoring</li>
                                    <li>• Communication tools</li>
                                </ul>
                            </div>
                            <div>
                                <h5 class="font-medium mb-2">Companies:</h5>
                                <ul class="space-y-1 text-gray-700">
                                    <li>• Candidate evaluation</li>
                                    <li>• Interview feedback</li>
                                    <li>• Skill matching</li>
                                    <li>• Hiring recommendations</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-3">Technology & Security</h4>
                        <div class="bg-gray-50 p-4 rounded-lg text-sm">
                            <p class="text-gray-700 mb-2">
                                <strong>Client-Side Architecture:</strong> Built entirely with HTML5, CSS3, and JavaScript 
                                for maximum compatibility and ease of deployment.
                            </p>
                            <p class="text-gray-700 mb-2">
                                <strong>Data Privacy:</strong> All data is stored locally in your browser's secure storage, 
                                ensuring complete privacy and compliance with institutional policies.
                            </p>
                            <p class="text-gray-700">
                                <strong>No Server Dependencies:</strong> The platform works entirely offline and can be 
                                deployed on any web server without additional infrastructure costs.
                            </p>
                        </div>
                    </div>

                    <div>
                        <h4 class="font-semibold mb-3">Benefits</h4>
                        <div class="grid grid-cols-2 gap-4 text-sm">
                            <div class="space-y-2">
                                <div class="flex items-start space-x-2">
                                    <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
                                    <span class="text-gray-700">Eliminates paperwork and manual processes</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
                                    <span class="text-gray-700">Improves placement success rates</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
                                    <span class="text-gray-700">Provides real-time analytics and insights</span>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <div class="flex items-start space-x-2">
                                    <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
                                    <span class="text-gray-700">Enhances transparency in the process</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
                                    <span class="text-gray-700">Reduces administrative workload</span>
                                </div>
                                <div class="flex items-start space-x-2">
                                    <i class="fas fa-check-circle text-green-500 mt-0.5"></i>
                                    <span class="text-gray-700">Cost-effective solution for institutions</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-primary">Got it!</button>
            </div>
        `;

        showModal(modalContent);
    }

    // Utility function to format dates consistently
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // Utility function to format time consistently
    formatTime(dateString) {
        const date = new Date(dateString);
        return date.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });
    }

    // Utility function to calculate time ago
    timeAgo(dateString) {
        const now = new Date();
        const date = new Date(dateString);
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return 'just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`;
        
        return this.formatDate(dateString);
    }
}

// Job Recommendation Engine
class JobRecommendationEngine {
    constructor() {
        this.weights = {
            skillMatch: 0.4,
            cgpaMatch: 0.2,
            departmentMatch: 0.2,
            deadlineProximity: 0.1,
            companyPreference: 0.1
        };
    }

    getRecommendations(student, jobs, maxResults = 5) {
        return jobs
            .filter(job => job.status === 'active')
            .map(job => ({
                job,
                score: this.calculateJobScore(student, job)
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .map(item => item.job);
    }

    calculateJobScore(student, job) {
        let score = 0;

        // Skill match score
        const studentSkills = student.profile?.skills || [];
        const matchingSkills = job.requiredSkills.filter(skill => 
            studentSkills.includes(skill)
        );
        const skillMatchScore = job.requiredSkills.length > 0 ? 
            matchingSkills.length / job.requiredSkills.length : 0;
        score += skillMatchScore * this.weights.skillMatch;

        // CGPA match score
        const cgpaScore = parseFloat(student.cgpa) >= job.minCGPA ? 1 : 0.5;
        score += cgpaScore * this.weights.cgpaMatch;

        // Department match score
        const deptScore = job.department.includes(student.department) ? 1 : 0;
        score += deptScore * this.weights.departmentMatch;

        // Deadline proximity score (closer deadlines get higher scores)
        const daysUntilDeadline = (new Date(job.applicationDeadline) - new Date()) / (1000 * 60 * 60 * 24);
        const deadlineScore = Math.max(0, Math.min(1, (30 - daysUntilDeadline) / 30));
        score += deadlineScore * this.weights.deadlineProximity;

        // Company preference (could be enhanced with student preferences)
        const companyScore = 0.5; // Default neutral score
        score += companyScore * this.weights.companyPreference;

        return Math.min(1, score); // Cap at 1.0
    }
}

// Certificate Generator
class CertificateGenerator {
    generateCertificate(student, internship, feedback) {
        const certificate = {
            id: 'cert_' + Date.now(),
            studentId: student.id,
            studentName: student.name,
            internshipTitle: internship.title,
            company: internship.company,
            duration: internship.duration,
            completedOn: new Date().toISOString(),
            overallRating: feedback?.overallRating || 'N/A',
            skills: feedback?.strengths || 'Various technical and soft skills',
            certificateNumber: this.generateCertificateNumber()
        };

        // Store certificate
        const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        certificates.push(certificate);
        localStorage.setItem('certificates', JSON.stringify(certificates));

        return certificate;
    }

    generateCertificateNumber() {
        const year = new Date().getFullYear();
        const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
        return `CPP${year}${random}`;
    }

    downloadCertificate(certificateId) {
        const certificates = JSON.parse(localStorage.getItem('certificates') || '[]');
        const certificate = certificates.find(cert => cert.id === certificateId);
        
        if (!certificate) return;

        // Generate certificate HTML
        const certificateHTML = this.generateCertificateHTML(certificate);
        
        // Create and download
        const blob = new Blob([certificateHTML], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `certificate_${certificate.certificateNumber}.html`;
        a.click();
        URL.revokeObjectURL(url);
    }

    generateCertificateHTML(certificate) {
        return `
<!DOCTYPE html>
<html>
<head>
    <title>Internship Completion Certificate</title>
    <style>
        body { font-family: 'Times New Roman', serif; margin: 0; padding: 40px; }
        .certificate { border: 10px solid #1f2937; padding: 40px; text-align: center; }
        .header { font-size: 36px; font-weight: bold; margin-bottom: 20px; }
        .subheader { font-size: 24px; margin-bottom: 30px; }
        .content { font-size: 18px; line-height: 1.6; margin-bottom: 30px; }
        .signature { margin-top: 50px; }
        .cert-number { font-size: 14px; color: #666; margin-top: 30px; }
    </style>
</head>
<body>
    <div class="certificate">
        <div class="header">CERTIFICATE OF COMPLETION</div>
        <div class="subheader">Campus Placement Portal</div>
        
        <div class="content">
            <p>This is to certify that</p>
            <h2 style="margin: 20px 0; color: #1f2937;">${certificate.studentName}</h2>
            <p>has successfully completed the internship program</p>
            <h3 style="margin: 20px 0;">${certificate.internshipTitle}</h3>
            <p>at <strong>${certificate.company}</strong></p>
            <p>Duration: ${certificate.duration}</p>
            <p>Overall Performance Rating: ${certificate.overallRating}/5</p>
        </div>
        
        <div class="signature">
            <p>Issued on: ${new Date(certificate.completedOn).toLocaleDateString()}</p>
            <br><br>
            <div style="display: inline-block; text-align: center;">
                <div style="border-top: 2px solid #000; width: 200px; margin-bottom: 10px;"></div>
                <p>Authorized Signature</p>
            </div>
        </div>
        
        <div class="cert-number">
            Certificate Number: ${certificate.certificateNumber}
        </div>
    </div>
</body>
</html>
        `;
    }
}

// Global utility functions
window.campusPortalApp = new CampusPortalApp();
window.certificateGenerator = new CertificateGenerator();

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.campusPortalApp.initialize();
});

// Global helper functions
window.formatDate = (dateString) => window.campusPortalApp.formatDate(dateString);
window.formatTime = (dateString) => window.campusPortalApp.formatTime(dateString);
window.timeAgo = (dateString) => window.campusPortalApp.timeAgo(dateString);