let authMode = 'login';
let currentUserRole = 'patient';

auth.onAuthStateChanged((user) => {
    const authModal = document.getElementById('authModal');
    const userInfoBox = document.getElementById('userInfoBox');
    
    if (user) {
        // طلب إذن إشعارات المتصفح عند تسجيل الدخول الناجح
        if (window.Notification && Notification.permission !== "granted") {
            Notification.requestPermission();
        }

        db.collection("users").doc(user.uid).get().then((doc) => {
            if (doc.exists) {
                currentUserRole = doc.data().role;
            } else {
                currentUserRole = 'patient';
            }
            
            authModal.classList.add('hidden');
            userInfoBox.classList.remove('hidden');
            userInfoBox.classList.add('flex');
            document.getElementById('userEmailDisplay').innerText = user.email;
            
            applyRoleUI(currentUserRole);
            
            if (typeof initApp === "function") initApp();
        });
    } else {
        authModal.classList.remove('hidden');
        userInfoBox.classList.add('hidden');
        userInfoBox.classList.remove('flex');
    }
});

function setAuthMode(mode) {
    authMode = mode;
    document.getElementById('authAlert').classList.add('hidden');
    
    const roleWrapper = document.getElementById('roleSelectWrapper');
    const hospWrapper = document.getElementById('hospitalTypeWrapper');

    if (mode === 'login') {
        roleWrapper.style.display = 'none';
        hospWrapper.classList.add('hidden');
        document.getElementById('authTabLogin').className = "flex-1 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-cyan-600 to-teal-600 shadow-lg";
        document.getElementById('authTabRegister').className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
        document.getElementById('authSubmitBtn').innerText = "تسجيل الدخول";
    } else {
        roleWrapper.style.display = 'block';
        toggleHospitalTypeField();
        document.getElementById('authTabRegister').className = "flex-1 py-2 text-xs font-bold rounded-xl text-white bg-gradient-to-r from-cyan-600 to-teal-600 shadow-lg";
        document.getElementById('authTabLogin').className = "flex-1 py-2 text-xs font-bold rounded-xl text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white";
        document.getElementById('authSubmitBtn').innerText = "إنشاء حساب جديد";
    }
}

function toggleHospitalTypeField() {
    const role = document.getElementById('userRole').value;
    const hospWrapper = document.getElementById('hospitalTypeWrapper');
    if (role === 'hospital' && authMode === 'register') {
        hospWrapper.classList.remove('hidden');
    } else {
        hospWrapper.classList.add('hidden');
    }
}

window.addEventListener('DOMContentLoaded', () => {
    setAuthMode('login');
});

function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const role = document.getElementById('userRole').value;
    const hospitalType = document.getElementById('hospitalTypeSelect').value;
    const alertBox = document.getElementById('authAlert');

    if (authMode === 'login') {
        auth.signInWithEmailAndPassword(email, password).catch(err => {
            alertBox.classList.remove('hidden');
            alertBox.innerText = "فشل المصادقة: تأكد من صحة البريد الإلكتروني أو كلمة المرور.";
        });
    } else {
        auth.createUserWithEmailAndPassword(email, password).then((userCredential) => {
            return db.collection("users").doc(userCredential.user.uid).set({
                email: email,
                role: role,
                hospitalType: role === 'hospital' ? hospitalType : '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }).catch(err => {
            alertBox.classList.remove('hidden');
            alertBox.innerText = "خطأ في التسجيل: " + err.message;
        });
    }
}

function handleLogout() { 
    auth.signOut().then(() => { window.location.reload(); }); 
}

function applyRoleUI(role) {
    const badge = document.getElementById('roleBadge');
    badge.classList.remove('hidden');
    
    const dashboard = document.getElementById('hospitalDashboard');
    const sidebar = document.getElementById('clinicalSidebar');
    const workspace = document.getElementById('clinicalWorkspace');
    const doctorUpload = document.getElementById('doctorUploadContainer');
    const doctorRxControl = document.getElementById('doctorRxControlSection');
    const blockchainBtnWrapper = document.getElementById('blockchainIssueBtnWrapper');
    const quickSnippetsBar = document.getElementById('quickSnippetsBar');

    dashboard.classList.add('hidden');
    sidebar.classList.add('hidden');
    workspace.classList.add('hidden');

    if (role === 'hospital') {
        badge.innerText = "لوحة إدارة المؤسسة الصحية";
        dashboard.classList.remove('hidden');
        dashboard.classList.add('flex');
        db.collection("users").doc(auth.currentUser.uid).get().then(doc => {
            if (doc.exists && doc.data().hospitalType) {
                document.getElementById('hospitalTypeBadge').innerText = "نوع المؤسسة: " + doc.data().hospitalType;
            }
        });
    } else if (role === 'doctor') {
        badge.innerText = "بوابة الطبيب الاستشاري";
        sidebar.classList.remove('hidden');
        sidebar.classList.add('flex');
        workspace.classList.remove('hidden');
        workspace.classList.add('flex');
        doctorUpload.style.display = 'block';
        doctorRxControl.style.display = 'block';
        blockchainBtnWrapper.style.display = 'block';
        quickSnippetsBar.style.display = 'flex';
    } else {
        badge.innerText = "بوابة ملف المريض الطبي";
        workspace.classList.remove('hidden');
        workspace.classList.add('flex');
        doctorUpload.style.display = 'none';
        doctorRxControl.style.display = 'none';
        blockchainBtnWrapper.style.display = 'none';
        quickSnippetsBar.style.display = 'none';
    }
}
