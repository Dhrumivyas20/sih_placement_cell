// Authentication and User Management System

class AuthSystem {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.initializeAuth();
    }

    initializeAuth() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.showDashboard();
        }

        // Bind event listeners
        this.bindEventListeners();
    }

    bindEventListeners() {
        document.getElementById('loginBtn').addEventListener('click', () => this.showLoginModal());
        document.getElementById('registerBtn').addEventListener('click', () => this.showRegisterModal());
        document.getElementById('logoutBtn').addEventListener('click', () => this.logout());
        document.getElementById('getStartedBtn').addEventListener('click', () => this.showRegisterModal());
    }

    loadUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : this.getDefaultUsers();
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    getDefaultUsers() {
        // Create some default demo users for testing
        const defaultUsers = [
            {
                id: 'admin1',
                email: 'admin@college.edu',
                password: 'admin123',
                role: 'placement_cell',
                name: 'Placement Officer',
                department: 'Career Services',
                created: new Date().toISOString()
            },
            {
                id: 'student1',
                email: 'john@student.edu',
                password: 'student123',
                role: 'student',
                name: 'John Doe',
                rollNumber: 'CS2021001',
                department: 'Computer Science',
                semester: '7',
                cgpa: '8.5',
                created: new Date().toISOString(),
                profile: {
                    skills: ['JavaScript', 'Python', 'React', 'Node.js'],
                    resume: null,
                    coverLetter: 'Passionate computer science student...',
                    badges: ['Web Development', 'Problem Solving'],
                    applications: [],
                    interviews: []
                }
            },
            {
                id: 'faculty1',
                email: 'prof@college.edu',
                password: 'faculty123',
                role: 'faculty',
                name: 'Prof. Smith',
                department: 'Computer Science',
                designation: 'Associate Professor',
                created: new Date().toISOString()
            },
            {
                id: 'company1',
                email: 'hr@techcorp.com',
                password: 'company123',
                role: 'company',
                name: 'TechCorp HR',
                company: 'TechCorp Solutions',
                industry: 'Information Technology',
                created: new Date().toISOString()
            }
        ];
        this.users = defaultUsers;
        this.saveUsers();
        return defaultUsers;
    }

    showLoginModal() {
        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Login to Campus Portal</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="loginForm">
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" id="loginEmail" class="form-input" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" id="loginPassword" class="form-input" placeholder="Enter your password" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <select id="loginRole" class="form-select" required>
                            <option value="">Select your role</option>
                            <option value="student">Student</option>
                            <option value="placement_cell">Placement Cell</option>
                            <option value="faculty">Faculty Mentor</option>
                            <option value="company">Company/Supervisor</option>
                        </select>
                    </div>
                </form>
                
                <div class="mt-4 p-4 bg-blue-50 rounded-lg">
                    <h4 class="font-semibold text-sm mb-2">Demo Accounts:</h4>
                    <div class="text-xs space-y-1 text-gray-600">
                        <div><strong>Student:</strong> john@student.edu / student123</div>
                        <div><strong>Placement Cell:</strong> admin@college.edu / admin123</div>
                        <div><strong>Faculty:</strong> prof@college.edu / faculty123</div>
                        <div><strong>Company:</strong> hr@techcorp.com / company123</div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="authSystem.login()" class="btn-primary">Login</button>
            </div>
        `;
        showModal(modalContent);
    }

    showRegisterModal() {
        const modalContent = `
            <div class="modal-header">
                <h3 class="text-lg font-semibold">Register for Campus Portal</h3>
                <button onclick="closeModal()" class="text-gray-500 hover:text-gray-700">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                <form id="registerForm">
                    <div class="form-group">
                        <label class="form-label">Full Name</label>
                        <input type="text" id="regName" class="form-input" placeholder="Enter your full name" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Email Address</label>
                        <input type="email" id="regEmail" class="form-input" placeholder="Enter your email" required>
                    </div>
                    <div class="form-group">
                        <label class="form-label">Password</label>
                        <input type="password" id="regPassword" class="form-input" placeholder="Create a password" required minlength="6">
                    </div>
                    <div class="form-group">
                        <label class="form-label">Role</label>
                        <select id="regRole" class="form-select" required onchange="authSystem.toggleRoleFields(this.value)">
                            <option value="">Select your role</option>
                            <option value="student">Student</option>
                            <option value="placement_cell">Placement Cell</option>
                            <option value="faculty">Faculty Mentor</option>
                            <option value="company">Company/Supervisor</option>
                        </select>
                    </div>
                    
                    <!-- Student Fields -->
                    <div id="studentFields" class="hidden">
                        <div class="grid grid-cols-2 gap-4">
                            <div class="form-group">
                                <label class="form-label">Roll Number</label>
                                <input type="text" id="regRollNumber" class="form-input" placeholder="Enter roll number">
                            </div>
                            <div class="form-group">
                                <label class="form-label">Semester</label>
                                <select id="regSemester" class="form-select">
                                    <option value="">Select semester</option>
                                    <option value="1">1st Semester</option>
                                    <option value="2">2nd Semester</option>
                                    <option value="3">3rd Semester</option>
                                    <option value="4">4th Semester</option>
                                    <option value="5">5th Semester</option>
                                    <option value="6">6th Semester</option>
                                    <option value="7">7th Semester</option>
                                    <option value="8">8th Semester</option>
                                </select>
                            </div>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Department</label>
                            <select id="regDepartment" class="form-select">
                                <option value="">Select department</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Electrical">Electrical</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">CGPA</label>
                            <input type="number" id="regCGPA" class="form-input" placeholder="Enter CGPA" step="0.1" min="0" max="10">
                        </div>
                    </div>
                    
                    <!-- Faculty Fields -->
                    <div id="facultyFields" class="hidden">
                        <div class="form-group">
                            <label class="form-label">Department</label>
                            <select id="regFacultyDept" class="form-select">
                                <option value="">Select department</option>
                                <option value="Computer Science">Computer Science</option>
                                <option value="Electronics">Electronics</option>
                                <option value="Mechanical">Mechanical</option>
                                <option value="Civil">Civil</option>
                                <option value="Electrical">Electrical</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Designation</label>
                            <input type="text" id="regDesignation" class="form-input" placeholder="e.g., Assistant Professor">
                        </div>
                    </div>
                    
                    <!-- Company Fields -->
                    <div id="companyFields" class="hidden">
                        <div class="form-group">
                            <label class="form-label">Company Name</label>
                            <input type="text" id="regCompany" class="form-input" placeholder="Enter company name">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Industry</label>
                            <select id="regIndustry" class="form-select">
                                <option value="">Select industry</option>
                                <option value="Information Technology">Information Technology</option>
                                <option value="Finance">Finance</option>
                                <option value="Manufacturing">Manufacturing</option>
                                <option value="Healthcare">Healthcare</option>
                                <option value="Consulting">Consulting</option>
                                <option value="Other">Other</option>
                            </select>
                        </div>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" onclick="closeModal()" class="btn-secondary">Cancel</button>
                <button type="button" onclick="authSystem.register()" class="btn-primary">Register</button>
            </div>
        `;
        showModal(modalContent);
    }

    toggleRoleFields(role) {
        // Hide all role-specific fields
        document.getElementById('studentFields').classList.add('hidden');
        document.getElementById('facultyFields').classList.add('hidden');
        document.getElementById('companyFields').classList.add('hidden');

        // Show relevant fields based on role
        if (role === 'student') {
            document.getElementById('studentFields').classList.remove('hidden');
        } else if (role === 'faculty') {
            document.getElementById('facultyFields').classList.remove('hidden');
        } else if (role === 'company') {
            document.getElementById('companyFields').classList.remove('hidden');
        }
    }

    async login() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        const role = document.getElementById('loginRole').value;

        if (!email || !password || !role) {
            showNotification('Please fill in all fields', 'error');
            return;
        }

        // Find user
        const user = this.users.find(u => 
            u.email === email && 
            u.password === password && 
            u.role === role
        );

        if (user) {
            this.currentUser = user;
            localStorage.setItem('currentUser', JSON.stringify(user));
            closeModal();
            this.showDashboard();
            showNotification(`Welcome back, ${user.name}!`, 'success');
        } else {
            showNotification('Invalid credentials or role mismatch', 'error');
        }
    }

    async register() {
        const formData = {
            name: document.getElementById('regName').value.trim(),
            email: document.getElementById('regEmail').value.trim(),
            password: document.getElementById('regPassword').value.trim(),
            role: document.getElementById('regRole').value
        };

        if (!formData.name || !formData.email || !formData.password || !formData.role) {
            showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Check if user already exists
        if (this.users.find(u => u.email === formData.email)) {
            showNotification('User with this email already exists', 'error');
            return;
        }

        // Create new user object
        const newUser = {
            id: 'user_' + Date.now(),
            ...formData,
            created: new Date().toISOString()
        };

        // Add role-specific data
        if (formData.role === 'student') {
            newUser.rollNumber = document.getElementById('regRollNumber').value.trim();
            newUser.department = document.getElementById('regDepartment').value;
            newUser.semester = document.getElementById('regSemester').value;
            newUser.cgpa = document.getElementById('regCGPA').value;
            newUser.profile = {
                skills: [],
                resume: null,
                coverLetter: '',
                badges: [],
                applications: [],
                interviews: []
            };
        } else if (formData.role === 'faculty') {
            newUser.department = document.getElementById('regFacultyDept').value;
            newUser.designation = document.getElementById('regDesignation').value.trim();
        } else if (formData.role === 'company') {
            newUser.company = document.getElementById('regCompany').value.trim();
            newUser.industry = document.getElementById('regIndustry').value;
        } else if (formData.role === 'placement_cell') {
            newUser.department = 'Career Services';
        }

        // Save user
        this.users.push(newUser);
        this.saveUsers();

        // Auto login
        this.currentUser = newUser;
        localStorage.setItem('currentUser', JSON.stringify(newUser));

        closeModal();
        this.showDashboard();
        showNotification(`Registration successful! Welcome, ${newUser.name}!`, 'success');
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.showWelcomePage();
        showNotification('You have been logged out', 'info');
    }

    showWelcomePage() {
        // Hide dashboard content
        document.getElementById('dashboardContent').classList.add('hidden');
        document.getElementById('welcomePage').classList.remove('hidden');
        
        // Update header
        document.getElementById('userInfo').classList.add('hidden');
        document.getElementById('loginSection').classList.remove('hidden');
        
        // Hide all dashboard sections
        this.hideAllDashboards();
    }

    showDashboard() {
        if (!this.currentUser) return;

        // Hide welcome page
        document.getElementById('welcomePage').classList.add('hidden');
        document.getElementById('dashboardContent').classList.remove('hidden');
        
        // Update header
        document.getElementById('userInfo').classList.remove('hidden');
        document.getElementById('loginSection').classList.add('hidden');
        document.getElementById('userName').textContent = this.currentUser.name;
        document.getElementById('userRole').textContent = this.getRoleDisplayName(this.currentUser.role);
        
        // Generate avatar
        this.updateUserAvatar();
        
        // Show appropriate dashboard
        this.hideAllDashboards();
        this.showRoleDashboard();
    }

    hideAllDashboards() {
        document.getElementById('studentDashboard').classList.add('hidden');
        document.getElementById('placementDashboard').classList.add('hidden');
        document.getElementById('facultyDashboard').classList.add('hidden');
        document.getElementById('companyDashboard').classList.add('hidden');
    }

    showRoleDashboard() {
        switch (this.currentUser.role) {
            case 'student':
                document.getElementById('studentDashboard').classList.remove('hidden');
                if (window.studentDashboard) {
                    window.studentDashboard.initialize();
                }
                break;
            case 'placement_cell':
                document.getElementById('placementDashboard').classList.remove('hidden');
                if (window.placementDashboard) {
                    window.placementDashboard.initialize();
                }
                break;
            case 'faculty':
                document.getElementById('facultyDashboard').classList.remove('hidden');
                if (window.facultyDashboard) {
                    window.facultyDashboard.initialize();
                }
                break;
            case 'company':
                document.getElementById('companyDashboard').classList.remove('hidden');
                if (window.companyDashboard) {
                    window.companyDashboard.initialize();
                }
                break;
        }
    }

    updateUserAvatar() {
        const avatar = document.getElementById('userAvatar');
        const initials = this.currentUser.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
        
        // Create a simple avatar with initials
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        
        // Background color based on role
        const colors = {
            student: '#3b82f6',
            placement_cell: '#059669',
            faculty: '#7c3aed',
            company: '#ea580c'
        };
        
        ctx.fillStyle = colors[this.currentUser.role] || '#6b7280';
        ctx.fillRect(0, 0, 32, 32);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(initials, 16, 16);
        
        avatar.src = canvas.toDataURL();
    }

    getRoleDisplayName(role) {
        const roleNames = {
            student: 'Student',
            placement_cell: 'Placement Cell',
            faculty: 'Faculty Mentor',
            company: 'Company Representative'
        };
        return roleNames[role] || role;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    updateCurrentUser(updates) {
        if (!this.currentUser) return;
        
        Object.assign(this.currentUser, updates);
        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        
        // Update in users array
        const userIndex = this.users.findIndex(u => u.id === this.currentUser.id);
        if (userIndex !== -1) {
            this.users[userIndex] = { ...this.currentUser };
            this.saveUsers();
        }
    }

    getUsersByRole(role) {
        return this.users.filter(user => user.role === role);
    }

    getAllUsers() {
        return this.users;
    }
}

// Initialize auth system when DOM is loaded
let authSystem;
document.addEventListener('DOMContentLoaded', () => {
    authSystem = new AuthSystem();
});

// Global modal functions
function showModal(content) {
    document.getElementById('modalContent').innerHTML = content;
    document.getElementById('modalOverlay').classList.remove('hidden');
}

function closeModal() {
    document.getElementById('modalOverlay').classList.add('hidden');
}

// Close modal when clicking outside
document.addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') {
        closeModal();
    }
});

// Global notification function
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <div class="flex-shrink-0">
                ${getNotificationIcon(type)}
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium">${message}</p>
            </div>
            <button onclick="this.parentElement.parentElement.remove()" class="text-gray-400 hover:text-gray-600">
                <i class="fas fa-times"></i>
            </button>
        </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.remove();
        }
    }, 5000);
}

function getNotificationIcon(type) {
    const icons = {
        success: '<i class="fas fa-check-circle text-green-600"></i>',
        error: '<i class="fas fa-exclamation-circle text-red-600"></i>',
        warning: '<i class="fas fa-exclamation-triangle text-yellow-600"></i>',
        info: '<i class="fas fa-info-circle text-blue-600"></i>'
    };
    return icons[type] || icons.info;
}