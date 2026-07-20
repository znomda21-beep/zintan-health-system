let authMode = 'login'; // 'login' or 'register'

// مراقب حالة جلسة الدخول
auth.onAuthStateChanged((user) => {
    const authModal = document.getElementById('authModal');
    const userInfoBox = document.getElementById('userInfoBox');
    const userEmailDisplay = document.getElementById('userEmailDisplay');

    if (user) {
        authModal.classList.add('hidden');
        userInfoBox.classList.remove('hidden');
        userInfoBox.classList.add('flex');
        userEmailDisplay.innerText = user.email;
        
        if (typeof listenToPatients === "function") {
            listenToPatients();
        }
    } else {
        authModal.classList.remove('hidden');
        userInfoBox.classList.add('hidden');
        userInfoBox.classList.remove('flex');
    }
});

// تبديل الوضع بين تسجيل الدخول وإنشاء حساب
function setAuthMode(mode) {
    authMode = mode;
    const btnLogin = document.getElementById('authTabLogin');
    const btnRegister = document.getElementById('authTabRegister');
    const submitBtn = document.getElementById('authSubmitBtn');
    const alertBox = document.getElementById('authAlert');

    alertBox.classList.add('hidden');

    if (mode === 'login') {
        btnLogin.className = "flex-1 py-1.5 text-xs font-bold rounded-lg text-white bg-cyan-600 transition-all";
        btnRegister.className = "flex-1 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all";
        submitBtn.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> دخول المنظومة`;
    } else {
        btnRegister.className = "flex-1 py-1.5 text-xs font-bold rounded-lg text-white bg-cyan-600 transition-all";
        btnLogin.className = "flex-1 py-1.5 text-xs font-bold rounded-lg text-slate-400 hover:text-white transition-all";
        submitBtn.innerHTML = `<i class="fa-solid fa-user-plus"></i> إنتاج حساب طبيب جديد`;
    }
}

// تنفيذ عملية المصادقة
function handleAuthSubmit(e) {
    e.preventDefault();
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value.trim();
    const alertBox = document.getElementById('authAlert');

    alertBox.classList.add('hidden');

    if (authMode === 'login') {
        auth.signInWithEmailAndPassword(email, password)
            .catch(err => {
                alertBox.classList.remove('hidden');
                alertBox.innerText = "خطأ في تسجيل الدخول: " + translateAuthError(err.code);
            });
    } else {
        auth.createUserWithEmailAndPassword(email, password)
            .catch(err => {
                alertBox.classList.remove('hidden');
                alertBox.innerText = "خطأ في إنشاء الحساب: " + translateAuthError(err.code);
            });
    }
}

// ترجمة أخطاء الـ Auth
function translateAuthError(code) {
    switch(code) {
        case 'auth/invalid-email': return 'عنوان البريد الإلكتروني غير صحيح.';
        case 'auth/user-not-found': return 'لا يوجد حساب بهذا البريد الإلكتروني.';
        case 'auth/wrong-password': return 'كلمة المرور غير صحيحة.';
        case 'auth/email-already-in-use': return 'هذا البريد الإلكتروني مستخدم بالفعل.';
        case 'auth/weak-password': return 'كلمة المرور ضعيفة (يجب أن تكون 6 أحرف على الأقل).';
        default: return 'تحقق من بيانات الدخول وحاول مجدداً.';
    }
}

// دالة تسجيل الخروج
function handleLogout() {
    auth.signOut();
}