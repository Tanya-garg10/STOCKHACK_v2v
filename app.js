// ElevateHer AI Platform JS Application Logic

// ================= STATE MANAGEMENT =================
let appState = {
  currentUser: null,
  users: JSON.parse(localStorage.getItem('elevateher_users')) || {},
  activeTab: 'overview-panel',
  certifications: [],
  studyTasks: [],
  transactions: [],
  forumPosts: [],
  interviewState: {
    active: false,
    role: '',
    questionIndex: 0,
    questions: [],
    history: []
  },
  mentorState: {
    activeMentor: 'sophia',
    history: {
      sophia: [],
      elara: [],
      aria: []
    }
  }
};

// Default static databases for search features
const SCHOLARSHIPS = [
  { name: "Women in Tech Empowerment Scholarship", provider: "Google Org", amount: "$10,000", region: "Global" },
  { name: "Grace Hopper Celebration Grant", provider: "AnitaB.org", amount: "Registration & Travel Cover", region: "Global" },
  { name: "Tech Women Fellowship Program", provider: "US Dept of State", amount: "Fully Funded Fellowship", region: "Africa & Middle East" },
  { name: "Ada Lovelace Scholarship for Coding", provider: "Academy Europe", amount: "$5,000", region: "Europe" },
  { name: "First-Gen Female Founders Grant", provider: "SheStarts Incubator", amount: "$15,000 Equity-free", region: "Americas" }
];

const SCHEMES = [
  { name: "Pradhan Mantri Mudra Yojana (PMMY)", category: "Business Loan", benefit: "Collateral-free loans up to 10 Lakhs INR for women entrepreneurs" },
  { name: "Stand-Up India Scheme", category: "Startup Capital", benefit: "Bank loans between 10 Lakhs and 1 Crore for SC/ST and women entrepreneurs" },
  { name: "Women Entrepreneurship Program (WEP)", category: "Govt Incubator", benefit: "Mentoring, credit rating help, networking events, and state grants" },
  { name: "SBA Women-Owned Small Business Federal Contract", category: "Federal Grant", benefit: "Exclusive federal contracting access and business support grants" },
  { name: "European Union Women Innovators Prize", category: "Cash Award", benefit: "€100,000 cash prizes for female founders and scientific innovators" }
];

// ================= INITIALIZATION & AUTHENTICATION =================
document.addEventListener('DOMContentLoaded', () => {
  setupAuthEventListeners();
  setupNavigation();
  restoreSession();
  setupHubEventListeners();
  updateDate();
});

function updateDate() {
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  document.getElementById('today-date').innerText = new Date().toLocaleDateString('en-US', options);
}

function saveUsersToLocalStorage() {
  localStorage.setItem('elevateher_users', JSON.stringify(appState.users));
}

function animateCardSwitch(fromCardId, toCardId) {
  const fromCard = document.getElementById(fromCardId);
  const toCard = document.getElementById(toCardId);
  
  fromCard.style.transform = 'scale(0.95) translateY(15px)';
  fromCard.style.opacity = '0';
  
  setTimeout(() => {
    fromCard.classList.add('hidden');
    fromCard.style.transform = '';
    fromCard.style.opacity = '';
    
    toCard.style.opacity = '0';
    toCard.style.transform = 'scale(0.95) translateY(-15px)';
    toCard.classList.remove('hidden');
    
    // Force reflow
    toCard.offsetHeight;
    
    toCard.style.transform = 'scale(1) translateY(0)';
    toCard.style.opacity = '1';
  }, 350);
}

function setupAuthEventListeners() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const toSignup = document.getElementById('to-signup');
  const toLogin = document.getElementById('to-login');
  const loginCard = document.getElementById('login-card');
  const signupCard = document.getElementById('signup-card');
  const googleBtn = document.getElementById('google-login-btn');
  const logoutBtn = document.getElementById('logout-btn');

  toSignup.addEventListener('click', () => {
    animateCardSwitch('login-card', 'signup-card');
  });

  toLogin.addEventListener('click', () => {
    animateCardSwitch('signup-card', 'login-card');
  });

  signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = document.getElementById('signup-name').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (appState.users[email]) {
      alert("An account with this email already exists!");
      return;
    }

    appState.users[email] = {
      name,
      password,
      level: "Level 1: Explorer",
      points: 0,
      streak: 1,
      certifications: [],
      studyTasks: [],
      transactions: [],
      forumPosts: [
        { id: 1, title: "Welcome to ElevateHer Forums!", body: "Ask questions, network, and grow together.", author: "System", date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
      ]
    };

    saveUsersToLocalStorage();
    alert("Account created successfully! Please log in.");
    signupForm.reset();
    animateCardSwitch('signup-card', 'login-card');
  });

  loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const user = appState.users[email];
    if (user && user.password === password) {
      startSession(email, user);
    } else {
      alert("Invalid email or password!");
    }
  });

  googleBtn.addEventListener('click', () => {
    // Simulated Google Login
    const email = "google_user@gmail.com";
    if (!appState.users[email]) {
      appState.users[email] = {
        name: "Google Member",
        password: "google_login_mock",
        level: "Level 1: Explorer",
        points: 0,
        streak: 1,
        certifications: [],
        studyTasks: [],
        transactions: [],
        forumPosts: [
          { id: 1, title: "Welcome to ElevateHer Forums!", body: "Ask questions, network, and grow together.", author: "System", date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) }
        ]
      };
      saveUsersToLocalStorage();
    }
    startSession(email, appState.users[email]);
  });

  logoutBtn.addEventListener('click', () => {
    appState.currentUser = null;
    localStorage.removeItem('elevateher_active_session');
    document.getElementById('app-view').classList.add('hidden');
    document.getElementById('auth-view').classList.remove('hidden');
  });
}

function restoreSession() {
  const activeSessionEmail = localStorage.getItem('elevateher_active_session');
  if (activeSessionEmail && appState.users[activeSessionEmail]) {
    startSession(activeSessionEmail, appState.users[activeSessionEmail]);
  }
}

function startSession(email, user) {
  appState.currentUser = email;
  localStorage.setItem('elevateher_active_session', email);

  // Sync user properties to local state
  appState.certifications = user.certifications || [];
  appState.studyTasks = user.studyTasks || [];
  appState.transactions = user.transactions || [];
  appState.forumPosts = user.forumPosts || [];

  // Update UI Elements
  const initials = user.name.charAt(0).toUpperCase();
  document.getElementById('profile-avatar').innerText = initials;
  document.getElementById('dropdown-avatar').innerText = initials;
  document.getElementById('dropdown-name').innerText = user.name;
  document.getElementById('dropdown-level').innerText = user.level || "Level 1: Explorer";
  document.getElementById('dropdown-points').innerText = `${user.points || 0} Points`;
  document.getElementById('welcome-title').innerText = `Hello, ${user.name.split(' ')[0]}`;

  // Recalculate Overview metrics
  const activeRoadmaps = appState.certifications.filter(c => c.status === "In Progress").length;
  let savingsBalance = 0;
  appState.transactions.forEach(t => {
    savingsBalance += (t.type === 'income' ? t.amount : -t.amount);
  });

  document.getElementById('overview-level-hero').innerText = user.level || "Level 1: Explorer";
  document.getElementById('overview-points').innerText = `${user.points || 0} Points`;
  document.getElementById('overview-roadmaps').innerText = `${activeRoadmaps} Active`;
  document.getElementById('overview-savings').innerText = `$${savingsBalance.toFixed(2)}`;
  document.getElementById('overview-streak').innerText = `${user.streak || 1} Day (Today)`;

  // Render lists
  renderCertifications();
  renderStudyTasks();
  renderTransactions();
  renderForumPosts();
  renderScholarships(SCHOLARSHIPS);
  renderSchemes(SCHEMES);
  renderSocializePanel();

  // Toggle View
  document.getElementById('auth-view').classList.add('hidden');
  document.getElementById('app-view').classList.remove('hidden');
}

function updateUserDataState() {
  if (appState.currentUser) {
    const user = appState.users[appState.currentUser];
    user.certifications = appState.certifications;
    user.studyTasks = appState.studyTasks;
    user.transactions = appState.transactions;
    user.forumPosts = appState.forumPosts;
    saveUsersToLocalStorage();
  }
}

function addPoints(amount) {
  if (appState.currentUser) {
    const user = appState.users[appState.currentUser];
    user.points = (user.points || 0) + amount;
    
    // Level Up mechanic
    if (user.points >= 500) user.level = "Level 4: Master Catalyst";
    else if (user.points >= 300) user.level = "Level 3: Trailblazer";
    else if (user.points >= 200) user.level = "Level 2: Rising Leader";
    
    document.getElementById('dropdown-level').innerText = user.level;
    document.getElementById('dropdown-points').innerText = `${user.points} Points`;
    
    // Also update Overview
    if (document.getElementById('overview-points')) {
      document.getElementById('overview-points').innerText = `${user.points} Points`;
      document.getElementById('overview-level-hero').innerText = user.level;
    }
    
    saveUsersToLocalStorage();
  }
}

// ================= NAVIGATION MANAGER =================
function setupNavigation() {
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    item.addEventListener('click', () => {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
      
      const target = item.getAttribute('data-target');
      switchTab(target);
    });
  });
}

function switchTab(targetId) {
  const panels = document.querySelectorAll('.hub-panel');
  panels.forEach(p => p.classList.add('hidden'));
  document.getElementById(targetId).classList.remove('hidden');
  
  // Keep navigation visual state in sync when triggered programmatically
  const menuItems = document.querySelectorAll('.menu-item');
  menuItems.forEach(item => {
    if (item.getAttribute('data-target') === targetId) {
      menuItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    }
  });

  // Re-animate chart on overview show
  if (targetId === 'overview-panel') {
    const bars = document.querySelectorAll('.chart-bar');
    bars.forEach(b => {
      const h = b.style.height;
      b.style.height = '0';
      setTimeout(() => b.style.height = h, 50);
    });
  }

  // Ensure Socialize panel renders checklist and simulator fresh when shown
  if (targetId === 'socialize-panel') {
    renderSocializePanel();
  }
}

// ================= HUB LOGIC ENGINES =================

function setupHubEventListeners() {
  // 1. Education Hub Events
  document.getElementById('generate-roadmap-btn').addEventListener('click', generateAIRoadmap);
  document.getElementById('cert-form').addEventListener('submit', handleAddCertification);
  document.getElementById('study-form').addEventListener('submit', handleAddStudyTask);
  document.getElementById('search-scholarship-btn').addEventListener('click', handleScholarshipSearch);

  // 2. Career Hub Events
  document.getElementById('analyze-resume-btn').addEventListener('click', analyzeResumeATS);
  document.getElementById('start-interview-btn').addEventListener('click', startMockInterview);
  document.getElementById('send-interview-btn').addEventListener('click', processInterviewTurn);
  document.getElementById('interview-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') processInterviewTurn();
  });
  document.getElementById('check-gap-btn').addEventListener('click', checkSkillGap);

  // 3. Finance Hub Events
  document.getElementById('transaction-form').addEventListener('submit', handleAddTransaction);
  document.getElementById('check-loan-btn').addEventListener('click', checkLoanEligibility);
  document.getElementById('search-scheme-btn').addEventListener('click', handleSchemeSearch);

  // 4. Entrepreneurship Hub Events
  document.getElementById('generate-biz-btn').addEventListener('click', generateBusinessModel);
  document.getElementById('generate-marketing-btn').addEventListener('click', generateMarketingAssets);
  document.getElementById('run-growth-btn').addEventListener('click', simulateGrowthMetrics);

  // 5. Mentorship & Community Events
  document.getElementById('mentor-select').addEventListener('change', changeMentorPersona);
  document.getElementById('send-mentor-btn').addEventListener('click', sendMentorMessage);
  document.getElementById('mentor-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMentorMessage();
  });
  document.getElementById('forum-post-form').addEventListener('submit', handleAddForumPost);

  // 6. Floating Global AI Assistant
  const trigger = document.getElementById('floating-chat-trigger');
  const panel = document.getElementById('floating-chat-panel');
  const closeBtn = document.getElementById('close-floating-chat');
  const sendBtn = document.getElementById('send-floating-btn');
  const input = document.getElementById('floating-input');

  trigger.addEventListener('click', () => panel.classList.toggle('hidden'));
  closeBtn.addEventListener('click', () => panel.classList.add('hidden'));
  sendBtn.addEventListener('click', sendFloatingMessage);
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendFloatingMessage();
  });

  // Profile Dropdown Toggle Click Listeners
  const profileAvatar = document.getElementById('profile-avatar');
  const profileDropdown = document.getElementById('profile-dropdown');
  
  profileAvatar.addEventListener('click', (e) => {
    e.stopPropagation();
    profileDropdown.classList.toggle('hidden');
  });

  document.addEventListener('click', (e) => {
    if (!profileDropdown.contains(e.target) && e.target !== profileAvatar) {
      profileDropdown.classList.add('hidden');
    }
  });
}

// ------ A. EDUCATION ENGINE ------
function generateAIRoadmap() {
  const interest = document.getElementById('roadmap-interest').value.trim();
  if (!interest) {
    alert("Please enter a career path or skill!");
    return;
  }

  const output = document.getElementById('roadmap-output');
  output.classList.remove('hidden');
  output.innerHTML = `
    <div style="text-align: center; color: var(--accent-pink); margin-bottom: 20px;">
      <i class="fa-solid fa-gear fa-spin"></i> Generating personalized timeline roadmap...
    </div>
  `;

  // Simulated AI Roadmap database
  setTimeout(() => {
    let steps = [
      { num: 1, title: `Foundations of ${interest}`, desc: "Grasp core definitions, study industry standards, and review terminology." },
      { num: 2, title: `Intermediate Mechanics & Tools`, desc: "Focus on frameworks, standard platforms, and practical hands-on applications." },
      { num: 3, title: `Portfolio Project Implementation`, desc: "Synthesize learning by engineering a real-world case study or functional app." },
      { num: 4, title: `Mentorship Check-in & Review`, desc: "Present your portfolio draft to a mentor in the Community tab for optimization recommendations." }
    ];

    if (interest.toLowerCase().includes('data science') || interest.toLowerCase().includes('python')) {
      steps = [
        { num: 1, title: "Mathematics & Python Foundations", desc: "Learn Pandas, Numpy, and stats probability models." },
        { num: 2, title: "Exploratory Data Analysis & Visualization", desc: "Build scatter/trend representations in Matplotlib and Seaborn." },
        { num: 3, title: "Machine Learning Implementations", desc: "Develop regressions, classifications, and cluster algorithms using Scikit-Learn." },
        { num: 4, title: "Capstone: Predictive Housing Market Analytics", desc: "Clean and model structural data, then export to a GitHub portfolio." }
      ];
    } else if (interest.toLowerCase().includes('ui') || interest.toLowerCase().includes('ux') || interest.toLowerCase().includes('design')) {
      steps = [
        { num: 1, title: "UX Fundamentals & User Research", desc: "Study personas, user flows, and low-fidelity grid wireframes." },
        { num: 2, title: "Figma Mastery & UI Design Rules", desc: "Construct layouts, components, typography hierarchies, and style guide tokens." },
        { num: 3, title: "Interactive Prototyping & Usability Checks", desc: "Hook transitions, test design micro-animations, and log user errors." },
        { num: 4, title: "Case Study: Financial Planner App Redesign", desc: "Present research, visual frames, and prototype mockups in detail." }
      ];
    }

    output.innerHTML = `
      <div style="font-size: 14px; font-weight: 600; color: var(--accent-rose); margin-bottom: 20px;">
        <i class="fa-solid fa-circle-check"></i> Roadmap generated for: "${interest}"
      </div>
    `;

    steps.forEach((step, idx) => {
      const isDone = idx === 0 ? "completed" : "";
      const isDoneIcon = idx === 0 ? '<i class="fa-solid fa-check" style="font-size:8px;"></i>' : "";
      output.innerHTML += `
        <div class="timeline-item">
          <div class="timeline-dot ${isDone}">${isDoneIcon}</div>
          <div class="timeline-content">
            <h4>Step ${step.num}: ${step.title}</h4>
            <p>${step.desc}</p>
          </div>
        </div>
      `;
    });

    addPoints(15);
  }, 1200);
}

function renderCertifications() {
  const container = document.getElementById('cert-list');
  
  // Also update Overview Active roadmaps
  const activeRoadmaps = appState.certifications.filter(c => c.status === "In Progress").length;
  if (document.getElementById('overview-roadmaps')) {
    document.getElementById('overview-roadmaps').innerText = `${activeRoadmaps} Active`;
  }

  if (appState.certifications.length === 0) {
    container.innerHTML = `<div style="font-size: 12px; color: var(--text-muted); text-align:center;">No certifications added yet.</div>`;
    return;
  }
  
  container.innerHTML = '';
  appState.certifications.forEach(cert => {
    container.innerHTML += `
      <div class="card-item" id="cert-item-${cert.id}">
        <div>
          <div class="card-item-title">${cert.name}</div>
          <div class="card-item-subtitle">${cert.org} • ${cert.status}</div>
        </div>
        <div style="display:flex; gap: 8px;">
          ${cert.status === "In Progress" ? 
            `<button class="btn btn-sm" onclick="completeCert(${cert.id})" style="padding: 4px 8px; font-size:11px;">Complete</button>` : 
            `<span class="text-green" style="font-size:12px; font-weight:600;"><i class="fa-solid fa-circle-check"></i> Done</span>`
          }
          <button class="btn btn-secondary btn-sm" onclick="deleteCert(${cert.id})" style="padding: 4px 8px; font-size:11px; color: var(--accent-pink);"><i class="fa-solid fa-trash"></i></button>
        </div>
      </div>
    `;
  });
}

function handleAddCertification(e) {
  e.preventDefault();
  const name = document.getElementById('cert-name').value.trim();
  const org = document.getElementById('cert-org').value.trim();
  if (!name || !org) return;

  const newCert = {
    id: Date.now(),
    name,
    org,
    status: "In Progress"
  };

  appState.certifications.push(newCert);
  updateUserDataState();
  renderCertifications();
  document.getElementById('cert-form').reset();
  addPoints(10);
}

window.completeCert = function(id) {
  const cert = appState.certifications.find(c => c.id === id);
  if (cert) {
    cert.status = "Completed";
    updateUserDataState();
    renderCertifications();
    addPoints(25);
  }
};

window.deleteCert = function(id) {
  appState.certifications = appState.certifications.filter(c => c.id !== id);
  updateUserDataState();
  renderCertifications();
};

function renderStudyTasks() {
  const container = document.getElementById('study-list');
  container.innerHTML = '';
  if (appState.studyTasks.length === 0) {
    container.innerHTML = `<li style="font-size:12px; color:var(--text-muted); text-align:center;">All study goals completed!</li>`;
    return;
  }
  
  appState.studyTasks.forEach(task => {
    container.innerHTML += `
      <li style="display:flex; justify-content:space-between; align-items:center; background:rgba(255,255,255,0.01); padding: 8px 12px; border:1px solid var(--glass-border); border-radius:8px;">
        <span style="font-size:13px; text-decoration: ${task.completed ? 'line-through' : 'none'}; color: ${task.completed ? 'var(--text-muted)' : 'var(--text-main)'}">
          ${task.text}
        </span>
        <div style="display:flex; gap:6px;">
          <input type="checkbox" ${task.completed ? 'checked' : ''} onchange="toggleStudyTask(${task.id})" style="cursor:pointer;">
          <i class="fa-solid fa-xmark" onclick="deleteStudyTask(${task.id})" style="color:var(--accent-pink); cursor:pointer; font-size:14px; margin-left: 10px;"></i>
        </div>
      </li>
    `;
  });
}

function handleAddStudyTask(e) {
  e.preventDefault();
  const text = document.getElementById('study-task').value.trim();
  if (!text) return;
  addStudyTask(text);
  document.getElementById('study-form').reset();
}

window.addStudyTask = function(text) {
  appState.studyTasks.push({
    id: Date.now(),
    text,
    completed: false
  });
  updateUserDataState();
  renderStudyTasks();
};

window.toggleStudyTask = function(id) {
  const task = appState.studyTasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    if (task.completed) addPoints(5);
    updateUserDataState();
    renderStudyTasks();
  }
};

window.deleteStudyTask = function(id) {
  appState.studyTasks = appState.studyTasks.filter(t => t.id !== id);
  updateUserDataState();
  renderStudyTasks();
};

function renderScholarships(list) {
  const container = document.getElementById('scholarship-list');
  container.innerHTML = '';
  list.forEach(sch => {
    container.innerHTML += `
      <div class="card-item">
        <div>
          <div class="card-item-title text-pink">${sch.name}</div>
          <div class="card-item-subtitle">${sch.provider} • Value: ${sch.amount}</div>
          <div style="font-size:11px; color:var(--text-muted); margin-top:4px;"><i class="fa-solid fa-earth-americas"></i> Coverage: ${sch.region}</div>
        </div>
        <button class="btn btn-sm btn-secondary" onclick="alert('Navigating to scholarship portal (Simulated)')">Learn More</button>
      </div>
    `;
  });
}

function handleScholarshipSearch() {
  const val = document.getElementById('scholarship-search').value.toLowerCase().trim();
  const filtered = SCHOLARSHIPS.filter(sch => 
    sch.name.toLowerCase().includes(val) || 
    sch.provider.toLowerCase().includes(val) ||
    sch.region.toLowerCase().includes(val)
  );
  renderScholarships(filtered);
}

// ------ B. CAREER ENGINE ------
function analyzeResumeATS() {
  const text = document.getElementById('resume-text').value.trim();
  if (!text) {
    alert("Please paste your resume content first!");
    return;
  }

  const spinner = document.getElementById('resume-spinner');
  const resultsDiv = document.getElementById('ats-results');
  spinner.classList.remove('hidden');

  setTimeout(() => {
    spinner.classList.add('hidden');
    resultsDiv.classList.remove('hidden');

    // MOCK ATS EVALUATION LOGIC
    let score = 55;
    const recommendations = [];

    // Analyze basic keywords
    if (text.length > 500) score += 15;
    if (text.toLowerCase().includes('responsibilities') || text.toLowerCase().includes('experience')) score += 10;
    if (text.toLowerCase().includes('achieved') || text.toLowerCase().includes('managed')) score += 5;

    // Check formatting
    if (text.includes('-') || text.includes('*')) {
      score += 5;
    } else {
      recommendations.push("Utilize bullet points rather than dense paragraphs to highlight key work experience achievements.");
    }

    if (text.split('\n').length < 15) {
      recommendations.push("Expand on specific achievements and metrics (e.g., 'saved 15% development time').");
      score -= 10;
    }

    // Cap score boundaries
    score = Math.min(Math.max(score, 45), 98);

    // Update Circle UI progress
    const offset = 314 - (314 * score) / 100;
    document.getElementById('ats-progress-circle').style.strokeDashoffset = offset;
    document.getElementById('ats-score-value').innerText = `${score}%`;

    // Recommendations output
    const suggestionsUl = document.getElementById('ats-suggestions');
    suggestionsUl.innerHTML = '';

    if (score >= 80) {
      document.getElementById('ats-review-summary').innerText = "Excellent compatibility! Your resume contains relevant action words, standardized section layouts, and legible syntax patterns.";
      recommendations.push("Ready to apply! Tailor references slightly to highlight specific target job keywords.");
    } else if (score >= 65) {
      document.getElementById('ats-review-summary').innerText = "Good foundation, but lacks industry-specific keywords and achievements metrics.";
      recommendations.push("Include specific technology tools (e.g. Git, Figma, SQL, React) matching standard job descriptions.");
      recommendations.push("Use action verbs (e.g., 'Spearheaded', 'Optimized') at the start of experience bullet points.");
    } else {
      document.getElementById('ats-review-summary').innerText = "Critical issues detected. Layout is too short or lacks proper semantic headings (Experience, Projects, Education).";
      recommendations.push("Identify missing headings and add a dedicated 'Skills' summary section.");
    }

    recommendations.forEach(rec => {
      suggestionsUl.innerHTML += `<li>${rec}</li>`;
    });

    addPoints(20);
  }, 1500);
}

function startMockInterview() {
  const role = document.getElementById('interview-role').value;
  appState.interviewState = {
    active: true,
    role,
    questionIndex: 0,
    history: [],
    questions: getRoleQuestions(role)
  };

  document.getElementById('interview-setup').classList.add('hidden');
  document.getElementById('interview-active').classList.remove('hidden');

  const messagesDiv = document.getElementById('interview-chat-messages');
  messagesDiv.innerHTML = '';
  
  // Intro bot greeting
  addInterviewBubble(`Hello! I am your AI interviewer today for the ${role} position. I will ask you three questions, evaluate your feedback, and provide a grading sheet. Let's begin. Question 1: ${appState.interviewState.questions[0]}`, 'bot');
}

function getRoleQuestions(role) {
  switch (role) {
    case "Software Engineer":
      return [
        "Explain the difference between functional programming and object-oriented programming.",
        "How do you optimize page load performance in a modern single-page React app?",
        "Describe a time you solved a complex debugging challenge. What steps did you take?"
      ];
    case "Product Manager":
      return [
        "How do you prioritize features when multiple critical stakeholders have competing demands?",
        "Explain how you would measure the success of a newly introduced user onboarding feature.",
        "Describe a product launch that failed. What did you learn and how did you adapt?"
      ];
    case "Data Analyst":
      return [
        "What is the difference between an INNER JOIN and a LEFT JOIN in SQL?",
        "How do you verify data cleanliness and handle missing values during exploration?",
        "How would you explain a complex regression model variance analysis to a non-technical stakeholder?"
      ];
    default:
      return [
        "What is the unique value proposition of your startup idea?",
        "How do you plan to acquire your first 100 paying customers?",
        "What are the major cost structures and revenue lines of your business canvas?"
      ];
  }
}

function addInterviewBubble(text, sender) {
  const container = document.getElementById('interview-chat-messages');
  container.innerHTML += `
    <div class="chat-bubble ${sender}">
      ${text}
    </div>
  `;
  container.scrollTop = container.scrollHeight;
}

function processInterviewTurn() {
  const inputEl = document.getElementById('interview-input');
  const answer = inputEl.value.trim();
  if (!answer) return;

  addInterviewBubble(answer, 'user');
  inputEl.value = '';

  const state = appState.interviewState;
  state.history.push({ question: state.questions[state.questionIndex], answer });

  state.questionIndex++;

  if (state.questionIndex < state.questions.length) {
    // Progress to next question
    setTimeout(() => {
      addInterviewBubble(`Good response. Question ${state.questionIndex + 1}: ${state.questions[state.questionIndex]}`, 'bot');
    }, 1000);
  } else {
    // End interview & summarize
    setTimeout(() => {
      let score = 70;
      let totalWords = state.history.reduce((acc, h) => acc + h.answer.split(' ').length, 0);
      
      if (totalWords > 90) score += 15;
      if (totalWords < 30) score -= 15;

      addInterviewBubble(`Thank you for completing the interview. Here is your AI feedback summary. Performance Score: ${score}/100. Recommendations: Your depth of response was ${totalWords > 70 ? 'excellent' : 'a bit brief'}. Keep linking your answers to quantifiable project metrics.`, 'bot');
      
      // Reset after a delay
      setTimeout(() => {
        document.getElementById('interview-setup').classList.remove('hidden');
        document.getElementById('interview-active').classList.add('hidden');
        addPoints(40);
      }, 7000);
    }, 1200);
  }
}

function checkSkillGap() {
  const role = document.getElementById('target-skill-role').value.trim();
  if (!role) {
    alert("Please enter a target role!");
    return;
  }

  const container = document.getElementById('gap-items-container');
  const out = document.getElementById('gap-output');
  out.classList.remove('hidden');

  container.innerHTML = `<div style="text-align:center;"><i class="fa-solid fa-spinner fa-spin"></i> Parsing role requirements...</div>`;

  setTimeout(() => {
    let gaps = [
      { skill: "VCS (Git/GitHub)", missing: true, course: "Git/GitHub Crash Course", link: "education-panel" },
      { skill: "Standard Database Queries (SQL)", missing: true, course: "Relational Databases Basics", link: "education-panel" },
      { skill: "Design Systems Integration", missing: false }
    ];

    if (role.toLowerCase().includes('data')) {
      gaps = [
        { skill: "Python (Pandas/NumPy)", missing: false },
        { skill: "Statistical Modeling (R / Scikit)", missing: true, course: "Python Data Science", link: "education-panel" },
        { skill: "Cloud Data Warehouses (Snowflake)", missing: true, course: "Cloud Data Engineering", link: "education-panel" }
      ];
    }

    container.innerHTML = '';
    gaps.forEach(g => {
      container.innerHTML += `
        <div class="card-item">
          <div>
            <div class="card-item-title">${g.skill}</div>
            <div class="card-item-subtitle">${g.missing ? '⚠️ Missing Skill' : '✅ Met / Profile Verified'}</div>
          </div>
          ${g.missing ? `<button class="btn btn-sm btn-secondary" onclick="switchTab('${g.link}')">Find Course</button>` : ''}
        </div>
      `;
    });
  }, 1000);
}


// ------ C. FINANCE ENGINE ------
function renderTransactions() {
  const history = document.getElementById('transaction-history');
  history.innerHTML = '';

  let balance = 0;
  let totalIncome = 0;
  let totalExpense = 0;

  appState.transactions.forEach(tx => {
    const isIncome = tx.type === 'income';
    const amountVal = isIncome ? tx.amount : -tx.amount;
    balance += amountVal;
    
    if (isIncome) totalIncome += tx.amount;
    else totalExpense += tx.amount;

    history.innerHTML += `
      <tr>
        <td class="font-medium">${tx.desc}</td>
        <td class="${isIncome ? 'text-green' : 'text-pink'} font-semibold">${tx.type.toUpperCase()}</td>
        <td class="${isIncome ? 'text-green' : 'text-pink'} font-semibold">$${tx.amount.toFixed(2)}</td>
        <td>
          <button class="btn btn-secondary btn-sm" onclick="deleteTransaction(${tx.id})" style="padding: 2px 6px;"><i class="fa-solid fa-trash-can" style="color:var(--accent-pink);"></i></button>
        </td>
      </tr>
    `;
  });

  document.getElementById('finance-balance').innerText = `$${balance.toFixed(2)}`;
  
  // Adjust savings indicator values
  const percent = Math.min(Math.max((balance / 2000) * 100, 0), 100);
  document.getElementById('savings-overall-progress').style.width = `${percent}%`;
  document.getElementById('savings-progress-text').innerText = `Saved $${balance.toFixed(2)} of $2,000`;

  // Also update Overview
  if (document.getElementById('overview-savings')) {
    document.getElementById('overview-savings').innerText = `$${balance.toFixed(2)}`;
  }
}

function handleAddTransaction(e) {
  e.preventDefault();
  const desc = document.getElementById('tx-desc').value.trim();
  const amount = parseFloat(document.getElementById('tx-amount').value);
  const type = document.getElementById('tx-type').value;

  if (!desc || isNaN(amount) || amount <= 0) return;

  appState.transactions.push({
    id: Date.now(),
    desc,
    amount,
    type
  });

  updateUserDataState();
  renderTransactions();
  document.getElementById('transaction-form').reset();
  addPoints(5);
}

window.deleteTransaction = function(id) {
  appState.transactions = appState.transactions.filter(t => t.id !== id);
  updateUserDataState();
  renderTransactions();
};

function checkLoanEligibility() {
  const income = parseFloat(document.getElementById('loan-income').value);
  const credit = parseInt(document.getElementById('loan-credit').value);
  const out = document.getElementById('loan-result');

  if (isNaN(income) || isNaN(credit)) {
    alert("Please input monthly income and credit score!");
    return;
  }

  out.classList.remove('hidden');
  
  if (credit >= 700 && income >= 2500) {
    out.className = "text-green";
    out.style.backgroundColor = "rgba(46, 204, 113, 0.1)";
    out.innerHTML = `<strong>Eligible!</strong> Your credit rating (${credit}) and income ($${income}) meet the basic microfinance thresholds. Approved amount: Up to $15,000 at 4.5% interest.`;
    addPoints(10);
  } else {
    out.className = "text-pink";
    out.style.backgroundColor = "rgba(236, 64, 122, 0.1)";
    out.innerHTML = `<strong>Review Required.</strong> Underwriting thresholds require a credit score above 680 and income above $2,000. Try checking out the Government Schemes finder for grant options.`;
  }
}

function renderSchemes(list) {
  const container = document.getElementById('schemes-list');
  container.innerHTML = '';
  list.forEach(sch => {
    container.innerHTML += `
      <tr>
        <td class="font-semibold text-pink">${sch.name}</td>
        <td><span class="btn btn-secondary btn-sm" style="font-size:11px; padding:2px 8px;">${sch.category}</span></td>
        <td style="color:var(--text-muted); font-size:12px;">${sch.benefit}</td>
        <td><button class="btn btn-sm btn-secondary" onclick="alert('Opening official support application page (Simulated)')">Apply</button></td>
      </tr>
    `;
  });
}

function handleSchemeSearch() {
  const val = document.getElementById('scheme-search').value.toLowerCase().trim();
  const filtered = SCHEMES.filter(sc => 
    sc.name.toLowerCase().includes(val) || 
    sc.category.toLowerCase().includes(val) ||
    sc.benefit.toLowerCase().includes(val)
  );
  renderSchemes(filtered);
}


// ------ D. ENTREPRENEURSHIP ENGINE ------
function generateBusinessModel() {
  const name = document.getElementById('biz-name').value.trim();
  const industry = document.getElementById('biz-industry').value.trim();
  const problem = document.getElementById('biz-problem').value.trim();

  if (!name || !industry) {
    alert("Please enter company name and industry!");
    return;
  }

  // Populate Business Model Canvas boxes with relevant mock templates
  document.getElementById('canvas-partners').innerHTML = `
    <li>${industry} suppliers & farmers</li>
    <li>Local distribution networks</li>
  `;
  document.getElementById('canvas-activities').innerHTML = `
    <li>Research & Development on packaging</li>
    <li>Social media marketing content execution</li>
  `;
  document.getElementById('canvas-propositions').innerHTML = `
    <li>Optimized D2C experience for ${name} items</li>
    <li>High-quality solutions targeting ${problem ? problem.substring(0,25) + '...' : 'market inefficiencies'}</li>
  `;
  document.getElementById('canvas-relations').innerHTML = `
    <li>Dynamic community-driven discussion support forums</li>
    <li>Personalized discount newsletters</li>
  `;
  document.getElementById('canvas-segments').innerHTML = `
    <li>Eco-conscious & values-first customers</li>
    <li>Target niche matching: "${industry}" enthusiasts</li>
  `;
  document.getElementById('canvas-resources').innerHTML = `
    <li>Patented formulation assets</li>
    <li>Platform logistics servers</li>
  `;
  document.getElementById('canvas-channels').innerHTML = `
    <li>Direct online storefront (${name.toLowerCase().replace(/\s+/g, '')}.com)</li>
    <li>Mobile app store downloads</li>
  `;

  alert("Business Model Canvas updated successfully! See the visual breakdown on the right.");
  addPoints(30);
}

function generateMarketingAssets() {
  const keywords = document.getElementById('marketing-keywords').value.trim();
  if (!keywords) {
    alert("Please enter branding keywords!");
    return;
  }

  const out = document.getElementById('marketing-output');
  out.classList.remove('hidden');

  const slogans = [
    `Embrace natural purity. Empower your values.`,
    `Handcrafted excellence, designed for modern lives.`,
    `A new standard of transparency in everyday routines.`
  ];

  const list = document.getElementById('marketing-slogan-list');
  list.innerHTML = '';
  slogans.forEach(sl => {
    list.innerHTML += `<li>"${sl}"</li>`;
  });

  document.getElementById('marketing-archetype').innerText = `Your brand aligns with "The Caregiver" archetype: comforting, protective, nurturing, and built on trust and environmental care. Color scheme recommendation: Sage green, soft blush pink, and warm gold accents.`;

  addPoints(15);
}

function simulateGrowthMetrics() {
  const budget = parseFloat(document.getElementById('startup-marketing-budget').value);
  const conversion = parseFloat(document.getElementById('startup-conversion').value);
  const out = document.getElementById('growth-output');

  if (isNaN(budget) || isNaN(conversion)) {
    alert("Please enter budget and conversion rate numbers!");
    return;
  }

  out.classList.remove('hidden');
  
  // Simple growth projection model
  const cac = 15; // Cost to Acquire Customer
  const arpu = 45; // Average Revenue Per User
  const customers = Math.round((budget / cac) * 12);
  const revenue = customers * arpu;
  const net = revenue - (budget * 12);

  out.innerHTML = `
    <h5 style="color:var(--accent-teal); font-size:13px; margin-bottom:8px;">Growth Projections (Year 1 Outline)</h5>
    <ul style="list-style:none; display:flex; flex-direction:column; gap:6px;">
      <li>Estimated CAC: <strong>$${cac}</strong></li>
      <li>New Customer Acquisitions: <strong>${customers} accounts</strong></li>
      <li>Gross Projected Revenue: <strong>$${revenue.toLocaleString()}</strong></li>
      <li>Net Margin Surplus/Deficit: <strong style="color:${net >= 0 ? 'var(--accent-green)' : 'var(--accent-pink)'}">$${net.toLocaleString()}</strong></li>
    </ul>
  `;

  addPoints(10);
}


// ------ E. MENTORSHIP & FORUM BOARD ------
const MENTORS = {
  sophia: {
    name: "Sophia",
    role: "VP of Product & Engineering",
    intro: "Hi, I am Sophia. I've spent 15 years scaling software projects and teams. Ask me about system designs, product roads, or tech leadership challenges!"
  },
  elara: {
    name: "Elara",
    role: "Venture Capital Partner",
    intro: "Greetings. I invest in early-stage SaaS, fintech, and social startups. Ask me about slide structures, pitch checks, market sizing, or raising capital!"
  },
  aria: {
    name: "Aria",
    role: "Certified Financial Planner",
    intro: "Hello! I help women create sustainable wealth and organize budgeting habits. Let's talk about savings strategy, loan terms, and investment guides!"
  }
};

function changeMentorPersona() {
  const val = document.getElementById('mentor-select').value;
  const m = MENTORS[val];
  appState.mentorState.activeMentor = val;

  document.getElementById('mentor-chat-name').innerText = m.name;
  document.getElementById('mentor-chat-role').innerText = m.role;

  const messagesDiv = document.getElementById('mentor-chat-messages');
  messagesDiv.innerHTML = '';

  // Render previous history or initial intro
  const history = appState.mentorState.history[val];
  if (history.length === 0) {
    addMentorBubble(m.intro, 'bot');
  } else {
    history.forEach(msg => {
      addMentorBubble(msg.text, msg.sender);
    });
  }
}

function addMentorBubble(text, sender) {
  const container = document.getElementById('mentor-chat-messages');
  container.innerHTML += `
    <div class="chat-bubble ${sender}">
      ${text}
    </div>
  `;
  container.scrollTop = container.scrollHeight;
}

function sendMentorMessage() {
  const inputEl = document.getElementById('mentor-input');
  const text = inputEl.value.trim();
  if (!text) return;

  const activeMentor = appState.mentorState.activeMentor;
  
  // Append user bubble
  addMentorBubble(text, 'user');
  appState.mentorState.history[activeMentor].push({ text, sender: 'user' });
  inputEl.value = '';

  // Mock Mentor Responses based on personality
  setTimeout(() => {
    let reply = "That's an interesting question. Let's break down the next steps together and analyze what resource fits best.";
    
    if (activeMentor === 'sophia') {
      if (text.toLowerCase().includes('code') || text.toLowerCase().includes('architecture') || text.toLowerCase().includes('engineer')) {
        reply = "When designing scalable systems, focus on decoupled services. Start small (monolith with clean domain modules) and only move to microservices when network latency overhead makes operational sense.";
      } else {
        reply = "For product roadmaps, prioritize impact versus engineering effort. Use frameworks like RICE (Reach, Impact, Confidence, Effort) to back decisions with clear values.";
      }
    } else if (activeMentor === 'elara') {
      if (text.toLowerCase().includes('pitch') || text.toLowerCase().includes('invest') || text.toLowerCase().includes('money')) {
        reply = "VCs look for clear metrics: market sizing (TAM/SAM/SOM), current traction trends, and team chemistry. Ensure your slide deck opens with a massive problem statements slide.";
      } else {
        reply = "Scaling requires a repeatable sales playbook. Define your target ICP (Ideal Customer Profile) and focus efforts purely on that segment before branching.";
      }
    } else if (activeMentor === 'aria') {
      if (text.toLowerCase().includes('saving') || text.toLowerCase().includes('budget') || text.toLowerCase().includes('debt')) {
        reply = "I recommend the 50/30/20 budget framework. 50% for Needs, 30% for Wants, and 20% dedicated strictly to savings or clearing debts. Keep a three-month buffer in an emergency cash account.";
      } else {
        reply = "Investments should match your risk timeline. For short-term needs, look at safe instruments like high-yield saving index accounts. For decade-long horizons, low-cost index ETFs are highly optimized.";
      }
    }

    addMentorBubble(reply, 'bot');
    appState.mentorState.history[activeMentor].push({ text: reply, sender: 'bot' });
    addPoints(10);
  }, 1200);
}

function renderForumPosts() {
  const container = document.getElementById('forum-posts');
  container.innerHTML = '';
  if (appState.forumPosts.length === 0) {
    container.innerHTML = `<div style="text-align:center; font-size:12px; color:var(--text-muted);">No forum posts yet. Start the conversation!</div>`;
    return;
  }

  appState.forumPosts.forEach(post => {
    container.innerHTML += `
      <div class="card-item" style="flex-direction:column; align-items:stretch; gap:8px;">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <span class="card-item-title text-pink">${post.title}</span>
          <span style="font-size:11px; color:var(--text-muted);">${post.date}</span>
        </div>
        <p style="font-size:12px; color:var(--text-main); line-height:1.4;">${post.body}</p>
        <div style="display:flex; justify-content:space-between; align-items:center; font-size:11px; color:var(--text-muted); border-top: 1px solid var(--glass-border); padding-top:6px; margin-top:4px;">
          <span>Posted by: <strong>${post.author}</strong></span>
          <span style="cursor:pointer; color:var(--accent-teal);" onclick="alert('Topic details (Simulated Thread)')"><i class="fa-regular fa-comment"></i> Reply (0)</span>
        </div>
      </div>
    `;
  });
}

function handleAddForumPost(e) {
  e.preventDefault();
  const title = document.getElementById('forum-title').value.trim();
  const body = document.getElementById('forum-body').value.trim();

  if (!title || !body) return;

  const authorName = appState.currentUser ? appState.users[appState.currentUser].name : "Anonymous";
  const dateOptions = { month: 'long', day: 'numeric', year: 'numeric' };
  const dateStr = new Date().toLocaleDateString('en-US', dateOptions);

  appState.forumPosts.unshift({
    id: Date.now(),
    title,
    body,
    author: authorName,
    date: dateStr
  });

  updateUserDataState();
  renderForumPosts();
  document.getElementById('forum-post-form').reset();
  addPoints(15);
}

// ------ F. GLOBAL FLOATING AI ASSISTANT ------
function sendFloatingMessage() {
  const inputEl = document.getElementById('floating-input');
  const text = inputEl.value.trim();
  if (!text) return;

  const container = document.getElementById('floating-messages');
  container.innerHTML += `
    <div class="chat-bubble user">
      ${text}
    </div>
  `;
  inputEl.value = '';
  container.scrollTop = container.scrollHeight;

  // Global chatbot basic responses
  setTimeout(() => {
    let reply = "I can guide you on that! Select one of the hubs (Education, Career, Finance, Entrepreneurship, Mentorship) on the sidebar menu to launch full tools for interactive plans, calculations, and evaluations.";
    
    const query = text.toLowerCase();
    if (query.includes('resume') || query.includes('interview')) {
      reply = "To run mock interviews or check resume ATS compatibility, click the 'Career Hub' on the left menu.";
    } else if (query.includes('money') || query.includes('saving') || query.includes('budget') || query.includes('loan')) {
      reply = "Track your budget, test loan eligibility, and query government support options inside the 'Finance Hub'.";
    } else if (query.includes('business') || query.includes('startup') || query.includes('marketing') || query.includes('brand')) {
      reply = "Draft custom business model canvas assets, check year 1 growth charts, and write branding pitches inside the 'Entrepreneurship' tab.";
    } else if (query.includes('course') || query.includes('school') || query.includes('learn') || query.includes('roadmap')) {
      reply = "Generate personalized step-by-step career path roadmaps, search scholarships, and track certifications inside the 'Education Hub'.";
    }

    container.innerHTML += `
      <div class="chat-bubble bot">
        ${reply}
      </div>
    `;
    container.scrollTop = container.scrollHeight;
    addPoints(5);
  }, 1000);
}

// ================= G. SOCIALIZE & CONNECT ENGINE =================
const INSTAGRAM_FEATURES = {
  "1. Account Features": [
    "Sign Up / Log In", "Personal Account", "Professional Account", "Creator Account", "Business Account", 
    "Switch Account Type", "Multiple Account Login", "Profile Picture", "Username", "Bio", 
    "Website Link", "Pronouns", "Threads Badge", "Profile Categories", "Contact Information", 
    "Action Buttons", "Verification Badge", "Private Account", "Public Account", "Two-Factor Authentication (2FA)", 
    "Login Activity", "Password Management"
  ],
  "2. Home Feed": [
    "Personalized Feed", "Following Feed", "Favorites Feed", "Suggested Posts", "Sponsored Posts (Ads)", 
    "Infinite Scrolling", "Refresh Feed", "Like Posts", "Comment on Posts", "Share Posts", 
    "Save Posts", "Hide Like Counts", "Report Posts", "Mute Accounts", "Block Accounts", "Restrict Accounts"
  ],
  "3. Posts": [
    "Photo Posts", "Video Posts", "Carousel Posts", "Collaborative Posts (Collab)", "Scheduled Posts (Professional)", 
    "Edit Caption", "Edit Location", "Tag People", "Product Tags", "Alt Text", "Archive Posts", 
    "Delete Posts", "Pin Posts", "Cross-post to Facebook", "Share to Story"
  ],
  "4. Reels": [
    "Record Reels", "Upload Reels", "Remix Reels", "Templates", "Speed Controls", "Timer", 
    "Green Screen", "Filters", "Effects", "Voice Effects", "Voiceover", "Audio Library", 
    "Original Audio", "Captions", "Hashtags", "Reel Insights", "Download Own Reels", "Save Reels", 
    "Like Reels", "Comment", "Share", "Send via DM"
  ],
  "5. Stories": [
    "Photo Stories", "Video Stories", "Boomerang", "Layout", "Hands-Free Mode", "Story Filters", 
    "Stickers", "GIF Stickers", "Emoji Stickers", "Music Sticker", "Poll Sticker", "Quiz Sticker", 
    "Question Sticker", "Countdown Sticker", "Link Sticker", "Mention Sticker", "Location Sticker", 
    "Hashtag Sticker", "Donation Sticker", "Product Sticker", "Story Drawing Tools", "Story Text", 
    "Story Archive", "Story Highlights", "Close Friends Stories", "Story Likes", "Story Replies", 
    "Story Views", "Story Sharing"
  ],
  "6. Messaging (Instagram Direct)": [
    "One-to-One Chat", "Group Chat", "Vanish Mode", "Voice Messages", "Video Messages", "Photo Messages", 
    "Video Calls", "Audio Calls", "Group Calls", "Stickers", "GIFs", "Emoji Reactions", "Message Replies", 
    "Message Forwarding", "Message Translation", "Silent Messages", "Scheduled Messages", "Pin Chats", 
    "Search Chats", "Unsend Messages", "Delete Chat", "Block Users", "Report Users"
  ],
  "7. Search & Explore": [
    "Search Users", "Search Hashtags", "Search Audio", "Search Places", "Explore Feed", "Trending Reels", 
    "Suggested Accounts", "Trending Topics", "Search Filters"
  ],
  "8. Content Creation": [
    "Camera Filters", "AR Effects", "Beauty Filters", "Green Screen", "Background Replacement", 
    "Text Animation", "Music Integration", "Stickers", "Templates", "AI Editing Tools", "Auto Captions"
  ],
  "9. Engagement": [
    "Likes", "Comments", "Replies", "Mentions", "Tags", "Shares", "Saves", "Story Reactions", 
    "Notes Reactions", "Follow Requests", "Notifications"
  ],
  "10. Notifications": [
    "Likes", "Comments", "Mentions", "Tags", "Story Mentions", "Follow Requests", "Live Notifications", 
    "Message Notifications", "Broadcast Channel Notifications", "Shopping Notifications"
  ],
  "11. Live Streaming": [
    "Go Live", "Invite Guest", "Multiple Guests", "Live Chat", "Live Reactions", "Live Badges", 
    "Live Moderation", "Pin Comments", "Live Replay", "Schedule Live"
  ],
  "12. Shopping": [
    "Instagram Shop", "Product Catalog", "Product Tags", "Creator Recommendations", "Saved Products", 
    "Wishlist", "Checkout"
  ],
  "13. Creator Tools": [
    "Professional Dashboard", "Content Insights", "Audience Insights", "Engagement Analytics", 
    "Reach Analytics", "Follower Growth", "Monetization Dashboard", "Bonus Programs", 
    "Brand Collaborations", "Partnership Labels"
  ],
  "14. Business Features": [
    "Business Dashboard", "Contact Buttons", "Appointment Booking", "WhatsApp Integration", 
    "Facebook Integration", "Professional Email Button", "Promotions", "Ads Manager", "Lead Forms"
  ],
  "15. Monetization": [
    "Gifts on Reels", "Subscriptions", "Badges during Live", "Brand Partnerships", "Affiliate Marketing", 
    "Creator Marketplace"
  ],
  "16. Privacy & Security": [
    "Private Account", "Close Friends", "Hidden Words", "Restrict Users", "Block Users", "Mute Users", 
    "Hide Story From", "Comment Controls", "Message Controls", "Sensitive Content Control", 
    "Two-Factor Authentication", "Login Alerts", "Download Your Data", "Activity Log"
  ],
  "17. Profile Customization": [
    "Profile Picture", "Bio", "Website Links", "Multiple Links", "Music on Profile", "Pronouns", 
    "Category", "Highlights", "Highlight Covers", "Pinned Posts", "Profile Theme"
  ],
  "18. AI Features": [
    "AI Chat Assistant", "AI Stickers", "AI Image Generation", "AI Background Editing", 
    "AI Caption Suggestions", "AI Search", "AI Recommendations"
  ],
  "19. Broadcast Channels": [
    "Create Broadcast Channel", "Voice Updates", "Images", "Polls", "Reactions", "Channel Invites", 
    "Channel Analytics"
  ],
  "20. Instagram Notes": [
    "Text Notes", "Music Notes", "Prompt Notes", "Notes in DMs", "Notes Replies"
  ],
  "21. Collaboration": [
    "Collab Posts", "Invite Collaborators", "Shared Reels", "Shared Stories", "Tag Brands", 
    "Creator Marketplace"
  ],
  "22. Ads & Promotions": [
    "Feed Ads", "Story Ads", "Reel Ads", "Explore Ads", "Carousel Ads", "Video Ads", "Boost Posts", 
    "Audience Targeting", "Ad Insights"
  ],
  "23. Accessibility": [
    "Alt Text", "Automatic Captions", "Screen Reader Support", "High Contrast Support", "Text Scaling"
  ],
  "24. Settings": [
    "Account Center", "Privacy Settings", "Security Settings", "Notification Settings", "Language", 
    "Theme", "Data Saver", "Storage Management", "Connected Apps", "Blocked Accounts", 
    "Restricted Accounts", "Hidden Words", "Activity Status", "Download Data", "Delete Account", 
    "Deactivate Account"
  ],
  "25. Additional Features": [
    "Hashtags", "Geotags", "QR Code Profile", "Name Tags", "Link in Bio", "Saved Collections", 
    "Archive", "Recently Deleted", "Favorites", "Close Friends List", "Meta Account Center", 
    "Cross-App Messaging", "Suggested Friends", "Invite Friends", "Report Bugs", "Help Center", 
    "Community Guidelines"
  ]
};

// Phone simulator state
let phoneState = {
  feedLiked: false,
  feedLikes: 98,
  comments: [
    { user: "aria_wealth", text: "Brilliant visual! 📈" },
    { user: "elara_biz", text: "Consistency is key. Love the brand setup." }
  ],
  dmHistory: [
    { sender: "bot", text: "Hello! I am your Instagram Strategy Coach. Ask me how to leverage Reels, Stories, or Subscriptions for your profile!" }
  ]
};

function renderSocializePanel() {
  const accordion = document.getElementById('features-accordion');
  if (!accordion) return;

  accordion.innerHTML = '';
  
  // Load checked features
  const user = appState.currentUser ? appState.users[appState.currentUser] : null;
  const checked = user ? (user.checkedFeatures || []) : [];

  let index = 0;
  for (const [category, list] of Object.entries(INSTAGRAM_FEATURES)) {
    let itemsHTML = '';
    list.forEach(feature => {
      const isChecked = checked.includes(feature) ? 'checked' : '';
      itemsHTML += `
        <label class="feature-checkbox-label">
          <input type="checkbox" onchange="toggleFeature(this, '${feature.replace(/'/g, "\\'")}')" ${isChecked}>
          <span>${feature}</span>
        </label>
      `;
    });

    accordion.innerHTML += `
      <div class="accordion-item" id="accordion-item-${index}">
        <div class="accordion-trigger" onclick="toggleAccordion(${index})">
          <span>${category}</span>
          <i class="fa-solid fa-chevron-down"></i>
        </div>
        <div class="accordion-content">
          ${itemsHTML}
        </div>
      </div>
    `;
    index++;
  }

  updateMasteryProgressBar();
  setPhoneTab('feed');
}

window.toggleAccordion = function(index) {
  const item = document.getElementById(`accordion-item-${index}`);
  if (item) {
    const isActive = item.classList.contains('active');
    // Close other items
    document.querySelectorAll('.accordion-item').forEach(i => i.classList.remove('active'));
    if (!isActive) {
      item.classList.add('active');
    }
  }
};

window.toggleFeature = function(checkbox, featureName) {
  if (!appState.currentUser) return;
  const user = appState.users[appState.currentUser];
  if (!user.checkedFeatures) user.checkedFeatures = [];

  if (checkbox.checked) {
    if (!user.checkedFeatures.includes(featureName)) {
      user.checkedFeatures.push(featureName);
      addPoints(2);
    }
  } else {
    user.checkedFeatures = user.checkedFeatures.filter(f => f !== featureName);
    addPoints(-2);
  }

  saveUsersToLocalStorage();
  updateMasteryProgressBar();
};

function updateMasteryProgressBar() {
  const user = appState.currentUser ? appState.users[appState.currentUser] : null;
  const checked = user ? (user.checkedFeatures || []) : [];
  
  // Total features count
  let totalFeatures = 0;
  for (const list of Object.values(INSTAGRAM_FEATURES)) {
    totalFeatures += list.length;
  }

  const count = checked.length;
  const percent = totalFeatures > 0 ? Math.round((count / totalFeatures) * 100) : 0;

  const textEl = document.getElementById('mastery-percent');
  const barEl = document.getElementById('mastery-progress-bar');
  
  if (textEl) textEl.innerText = `${percent}% (${count} / ${totalFeatures} Features)`;
  if (barEl) barEl.style.width = `${percent}%`;
}

window.setPhoneTab = function(tabName, element) {
  // Toggle bottom tab bar icon highlight
  const tabbar = document.querySelector('.phone-tabbar');
  if (tabbar) {
    tabbar.querySelectorAll('i').forEach(icon => icon.classList.remove('active'));
  }
  if (element) {
    element.classList.add('active');
  } else {
    // Select by matching icon type if triggered programmatically
    const icons = document.querySelectorAll('.phone-tabbar i');
    icons.forEach(icon => {
      if (tabName === 'feed' && icon.classList.contains('fa-house')) icon.classList.add('active');
      if (tabName === 'explore' && icon.classList.contains('fa-magnifying-glass')) icon.classList.add('active');
      if (tabName === 'reels' && icon.classList.contains('fa-clapperboard')) icon.classList.add('active');
      if (tabName === 'dm' && icon.classList.contains('fa-comment-dots')) icon.classList.add('active');
      if (tabName === 'profile' && icon.classList.contains('fa-circle-user')) icon.classList.add('active');
    });
  }

  const body = document.getElementById('phone-body-content');
  if (!body) return;

  if (tabName === 'feed') {
    let commentListHTML = '';
    phoneState.comments.forEach(c => {
      commentListHTML += `
        <div class="insta-comment-item">
          <strong>${c.user}</strong> ${c.text}
        </div>
      `;
    });

    body.innerHTML = `
      <!-- Stories Ring -->
      <div class="insta-stories">
        <div class="insta-story-item" onclick="alert('Viewing your story')">
          <div class="insta-story-avatar-ring"><div class="insta-story-avatar">Y</div></div>
          <span class="insta-story-name">Your Story</span>
        </div>
        <div class="insta-story-item" onclick="alert('Viewing sophia_ai story')">
          <div class="insta-story-avatar-ring"><div class="insta-story-avatar" style="background:#8e44ad;">S</div></div>
          <span class="insta-story-name">sophia_ai</span>
        </div>
        <div class="insta-story-item" onclick="alert('Viewing elara_biz story')">
          <div class="insta-story-avatar-ring"><div class="insta-story-avatar" style="background:#27ae60;">E</div></div>
          <span class="insta-story-name">elara_biz</span>
        </div>
        <div class="insta-story-item" onclick="alert('Viewing aria_wealth story')">
          <div class="insta-story-avatar-ring"><div class="insta-story-avatar" style="background:#d35400;">A</div></div>
          <span class="insta-story-name">aria_wealth</span>
        </div>
      </div>

      <!-- Feed Post -->
      <div class="insta-post">
        <div class="insta-post-header">
          <div class="insta-post-avatar">E</div>
          <span class="insta-post-username">elevateher_global</span>
        </div>
        <div class="insta-post-media">
          ElevateHer Global 🚀<br>
          Building tools for women in leadership, tech, & entrepreneurship.
        </div>
        <div class="insta-post-actions">
          <i class="${phoneState.feedLiked ? 'fa-solid fa-heart text-pink' : 'fa-regular fa-heart'}" onclick="togglePhoneLike(this)"></i>
          <i class="fa-regular fa-comment" onclick="document.getElementById('phone-comment-input').focus()"></i>
          <i class="fa-regular fa-paper-plane" onclick="setPhoneTab('dm')"></i>
        </div>
        <div class="insta-post-likes">
          <span id="phone-likes-count">${phoneState.feedLikes}</span> likes
        </div>
        <div class="insta-post-caption">
          <strong>elevateher_global</strong> What is your biggest milestone for Q3? Let us know below! 👇 #FemaleFounders #Leadership
        </div>
        
        <!-- Comments -->
        <div class="insta-post-comments" id="phone-comments-list">
          ${commentListHTML}
        </div>

        <div class="insta-comment-row">
          <input type="text" id="phone-comment-input" placeholder="Add a comment..." onkeypress="handlePhoneCommentKey(event)">
          <button onclick="addPhoneComment()">Post</button>
        </div>
      </div>
    `;
  } else if (tabName === 'explore') {
    body.innerHTML = `
      <div style="padding: 10px 15px;">
        <input type="text" class="form-control form-control-sm" placeholder="Search accounts, tags..." style="background:rgba(255,255,255,0.06); border:none; border-radius:8px; font-size:11px; height:28px;">
      </div>
      <div class="explore-grid">
        <div class="explore-tile" onclick="alert('Viewing AI Roadmaps Explore Post')">🚀<br>Roadmaps</div>
        <div class="explore-tile" onclick="alert('Viewing ATS Checker Post')">📄<br>ATS Score</div>
        <div class="explore-tile" onclick="alert('Viewing Financial Markets Post')">📈<br>Markets</div>
        <div class="explore-tile" onclick="alert('Viewing VC Pitch Post')">💡<br>Pitching</div>
        <div class="explore-tile" onclick="alert('Viewing Female Founders Post')">👑<br>Leadership</div>
        <div class="explore-tile" onclick="alert('Viewing Budget Guide Post')">💰<br>Savings</div>
        <div class="explore-tile" onclick="alert('Viewing Mentorship Post')">💬<br>AI Mentors</div>
        <div class="explore-tile" onclick="alert('Viewing Loan Planner Post')">🏦<br>Loans</div>
        <div class="explore-tile" onclick="alert('Viewing Brand Generator Post')">🔮<br>Branding</div>
      </div>
    `;
  } else if (tabName === 'reels') {
    body.innerHTML = `
      <div class="reels-container">
        <div class="reels-screen">
          <i class="fa-solid fa-clapperboard fa-2x" style="color:var(--accent-pink); margin-bottom:15px;"></i>
          <h4 style="font-family:var(--font-family-title); font-size:15px; margin-bottom:8px;">ElevateHer Simulated Reel</h4>
          <p class="text-muted" style="font-size:11px; line-height:1.4;">"Building a glassmorphic dashboard outline using raw CSS and JavaScript for female founders worldwide."</p>
        </div>
        <div class="reels-actions">
          <div class="reels-action-btn"><i class="fa-solid fa-heart" style="color:#fff;" onclick="alert('Liked Reel')"></i><span>2.4k</span></div>
          <div class="reels-action-btn"><i class="fa-solid fa-comment"></i><span>184</span></div>
          <div class="reels-action-btn"><i class="fa-solid fa-paper-plane"></i><span></span></div>
        </div>
      </div>
    `;
  } else if (tabName === 'dm') {
    let dmMessagesHTML = '';
    phoneState.dmHistory.forEach(msg => {
      dmMessagesHTML += `
        <div class="dm-bubble ${msg.sender}">
          ${msg.text}
        </div>
      `;
    });

    body.innerHTML = `
      <div class="dm-container">
        <div class="dm-header">
          <i class="fa-solid fa-chevron-left" style="margin-right:10px; cursor:pointer;" onclick="setPhoneTab('feed')"></i>
          <span>Instagram Coach AI</span>
        </div>
        <div class="dm-messages" id="phone-dm-messages">
          ${dmMessagesHTML}
        </div>
        <div class="dm-input-row">
          <input type="text" id="phone-dm-input" placeholder="Message..." onkeypress="handlePhoneDMKey(event)">
          <button onclick="sendPhoneDM()"><i class="fa-solid fa-arrow-up"></i></button>
        </div>
      </div>
    `;
    setTimeout(() => {
      const container = document.getElementById('phone-dm-messages');
      if (container) container.scrollTop = container.scrollHeight;
    }, 50);
  } else if (tabName === 'profile') {
    const user = appState.currentUser ? appState.users[appState.currentUser] : { name: "Guest User", level: "Level 1: Explorer" };
    const initials = user.name.charAt(0).toUpperCase();
    body.innerHTML = `
      <div class="profile-container">
        <div class="profile-header-info">
          <div class="insta-post-avatar" style="width:48px; height:48px; font-size:18px;">${initials}</div>
          <div class="profile-stats">
            <div class="profile-stat-box"><div class="profile-stat-val">3</div><div class="profile-stat-lbl">posts</div></div>
            <div class="profile-stat-box"><div class="profile-stat-val">120</div><div class="profile-stat-lbl">followers</div></div>
            <div class="profile-stat-box"><div class="profile-stat-val">84</div><div class="profile-stat-lbl">following</div></div>
          </div>
        </div>
        <div class="profile-details">
          <div class="profile-name">${user.name}</div>
          <div class="profile-bio">
            Explorer • ${user.level || "Level 1: Explorer"}<br>
            Scaling startups using ElevateHer AI tools. 🏆<br>
            <a href="#" class="profile-bio-link">linktr.ee/elevateher</a>
          </div>
        </div>

        <div class="profile-highlights-row">
          <div class="profile-highlight-item">
            <div class="profile-highlight-circle">📄</div>
            <span class="profile-highlight-lbl">ATS</span>
          </div>
          <div class="profile-highlight-item">
            <div class="profile-highlight-circle">📈</div>
            <span class="profile-highlight-lbl">Markets</span>
          </div>
          <div class="profile-highlight-item">
            <div class="profile-highlight-circle">💡</div>
            <span class="profile-highlight-lbl">Pitch</span>
          </div>
        </div>

        <div class="profile-posts-grid">
          <div class="profile-grid-tile">ElevateHer<br>Level Up!</div>
          <div class="profile-grid-tile">Financial<br>Freedom</div>
          <div class="profile-grid-tile">AI Mentorship<br>Sophia</div>
        </div>
      </div>
    `;
  }
};

window.togglePhoneLike = function(heartIcon) {
  phoneState.feedLiked = !phoneState.feedLiked;
  if (phoneState.feedLiked) {
    phoneState.feedLikes++;
    heartIcon.className = "fa-solid fa-heart text-pink";
  } else {
    phoneState.feedLikes--;
    heartIcon.className = "fa-regular fa-heart";
  }
  document.getElementById('phone-likes-count').innerText = phoneState.feedLikes;
  addPoints(1);
};

window.handlePhoneCommentKey = function(e) {
  if (e.key === 'Enter') addPhoneComment();
};

window.addPhoneComment = function() {
  const input = document.getElementById('phone-comment-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const author = appState.currentUser ? appState.users[appState.currentUser].name.toLowerCase().replace(/\s+/g, '') : "guest";
  phoneState.comments.push({ user: author, text });
  
  const list = document.getElementById('phone-comments-list');
  if (list) {
    list.innerHTML += `
      <div class="insta-comment-item">
        <strong>${author}</strong> ${text}
      </div>
    `;
    list.scrollTop = list.scrollHeight;
  }
  input.value = '';
  addPoints(3);
};

window.handlePhoneDMKey = function(e) {
  if (e.key === 'Enter') sendPhoneDM();
};

window.sendPhoneDM = function() {
  const input = document.getElementById('phone-dm-input');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  phoneState.dmHistory.push({ sender: "user", text });
  const container = document.getElementById('phone-dm-messages');
  if (container) {
    container.innerHTML += `
      <div class="dm-bubble user">
        ${text}
      </div>
    `;
    container.scrollTop = container.scrollHeight;
  }
  input.value = '';

  // Return simulated bot response
  setTimeout(() => {
    let coachReply = "That sounds like a smart strategy! Focus on integrating Instagram Reels Templates (Feature 4.4) to increase viral branding reach.";
    const query = text.toLowerCase();
    if (query.includes('reels') || query.includes('video')) {
      coachReply = "Yes! Record Reels (Feature 4.1) using original audio tracks and captions. This triples search discoverability under Instagram SEO guidelines.";
    } else if (query.includes('monetize') || query.includes('money') || query.includes('sub')) {
      coachReply = "Build an audience first using Stories and Reels, then activate Subscriptions (Feature 15.2) and Brand Partnerships (Feature 15.4) to start earning revenue.";
    } else if (query.includes('sell') || query.includes('shop')) {
      coachReply = "Configure Product Tags (Feature 12.3) inside your business feed. In-app checkout helps converts followers into buyers directly.";
    }

    phoneState.dmHistory.push({ sender: "bot", text: coachReply });
    if (container) {
      container.innerHTML += `
        <div class="dm-bubble bot">
          ${coachReply}
        </div>
      `;
      container.scrollTop = container.scrollHeight;
    }
    addPoints(4);
  }, 1000);
};
