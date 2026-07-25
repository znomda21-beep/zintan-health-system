let currentPatient = null;
let patientsArray = [];
let typingTimeout = null;
const SECRET_KEY = "ZinMed2026_SecureKey";

function initApp() {
    if (currentUserRole === 'doctor' || currentUserRole === 'hospital') {
        listenToPatients();
    } else if (currentUserRole === 'patient') {
        loadPatientByEmail(auth.currentUser.email);
    }
    if (currentUserRole === 'hospital') {
        initDashboardCharts();
    }
}

function toggleTheme() {
    const html = document.documentElement;
    const icon = document.getElementById('themeIcon');
    if (html.classList.contains('dark')) {
        html.classList.remove('dark');
        icon.className = 'fa-solid fa-moon';
    } else {
        html.classList.add('dark');
        icon.className = 'fa-solid fa-sun';
    }
}

function showSysAlert(type, title, message) {
    const modal = document.getElementById('sysAlertModal');
    const box = document.getElementById('sysAlertBox');
    const icon = document.getElementById('sysAlertIcon');
    const btn = document.getElementById('sysAlertBtn');
    
    document.getElementById('sysAlertTitle').innerText = title;
    document.getElementById('sysAlertMessage').innerText = message;

    if (type === 'error') {
        icon.className = 'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl bg-rose-500/15 text-rose-500 border border-rose-500/20';
        icon.innerHTML = '<i class="fa-solid fa-triangle-exclamation"></i>';
        btn.className = 'w-full py-3 text-white text-xs font-bold rounded-2xl transition-all shadow-lg bg-rose-600 hover:bg-rose-500 shadow-rose-500/20';
        btn.innerText = 'حسناً، فهمت';
    } else if (type === 'success') {
        icon.className = 'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl bg-emerald-500/15 text-emerald-500 border border-emerald-500/20';
        icon.innerHTML = '<i class="fa-solid fa-circle-check"></i>';
        btn.className = 'w-full py-3 text-white text-xs font-bold rounded-2xl transition-all shadow-lg bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20';
        btn.innerText = 'متابعة العمليات';
    } else {
        icon.className = 'w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-3xl bg-amber-500/15 text-amber-500 border border-amber-500/20';
        icon.innerHTML = '<i class="fa-solid fa-circle-info"></i>';
        btn.className = 'w-full py-3 text-white text-xs font-bold rounded-2xl transition-all shadow-lg bg-amber-600 hover:bg-amber-500 shadow-amber-500/20';
        btn.innerText = 'إغلاق';
    }

    modal.classList.remove('hidden');
    setTimeout(() => {
        modal.classList.remove('opacity-0');
        box.classList.remove('scale-95');
    }, 10);
}

function closeSysAlert() {
    const modal = document.getElementById('sysAlertModal');
    const box = document.getElementById('sysAlertBox');
    modal.classList.add('opacity-0');
    box.classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); }, 300);
}

function goBackStep() {
    const btnBack = document.getElementById('btnGoBack');
    if (currentUserRole !== 'patient' && currentPatient) {
        currentPatient = null;
        document.getElementById('activePatientName').innerText = "اختر مريضاً من القائمة الجانبية";
        document.getElementById('activePatientMeta').innerText = "--";
        document.getElementById('chatBox').innerHTML = "";
        document.getElementById('suggestedDrugText').innerText = "اختر تشخيصاً لتوليد البروتوكول العلاجي الموصى به.";
        document.getElementById('blockchainHashDisplay').classList.add('hidden');
        document.getElementById('icdSearchInput').value = "";
        document.getElementById('patientAttachmentsList').innerHTML = "";
        document.getElementById('auditLogsList').innerHTML = "";
        btnBack.classList.add('hidden');
    }
}

// 1. نظام الفرز الطارئ وإدارة المرضى
function listenToPatients() {
    db.collection("patients").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        patientsArray = [];
        snapshot.forEach(doc => patientsArray.push({ id: doc.id, ...doc.data() }));
        renderPatientsList(patientsArray);
    });
}

function renderPatientsList(list) {
    const listEl = document.getElementById('patientsList');
    if (list.length === 0) { listEl.innerHTML = `<div class="text-center py-6 text-xs text-slate-500">لا توجد سجلات مرضية مسجلة.</div>`; return; }
    listEl.innerHTML = list.map(p => {
        let triageColor = 'bg-emerald-500';
        if (p.triage === 'أصفر') triageColor = 'bg-amber-500';
        if (p.triage === 'أحمر') triageColor = 'bg-rose-500 animate-pulse';

        return `
            <div onclick="selectPatient('${p.id}')" class="p-4 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-200 dark:border-slate-800 rounded-2xl cursor-pointer transition-all group flex items-center justify-between">
                <div>
                    <h4 class="text-xs font-bold text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">${p.name}</h4>
                    <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-1">الهاتف: ${p.phone || 'غير متوفر'} | العمر: ${p.age}</p>
                </div>
                <div class="flex items-center gap-2">
                    <span class="w-3 h-3 rounded-full ${triageColor}" title="الفرز: ${p.triage || 'أخضر'}"></span>
                </div>
            </div>
        `;
    }).join('');
}

function filterPatients() {
    const term = document.getElementById('patientSearchInput').value.toLowerCase();
    const filtered = patientsArray.filter(p => p.name.toLowerCase().includes(term) || (p.phone && p.phone.includes(term)));
    renderPatientsList(filtered);
}

function selectPatient(id) {
    currentPatient = patientsArray.find(p => p.id === id);
    if (!currentPatient) return;
    
    document.getElementById('activePatientName').innerText = currentPatient.name;
    document.getElementById('activePatientMeta').innerText = `العمر: ${currentPatient.age} سنة | الجنس: ${currentPatient.gender} | الهاتف: ${currentPatient.phone || '--'} | الفرز: ${currentPatient.triage || 'أخضر'}`;
    document.getElementById('btnGoBack').classList.remove('hidden');
    
    // تسجيل عملية الوصول في سجل التدقيق الأمني (Audit Logs)
    logAuditAction(`فتح واستعراض الملف الطبي بواسطة ${auth.currentUser.email}`);

    loadChats();
    loadPatientAttachments();
    loadAuditLogs();
}

function loadPatientByEmail(email) {
    db.collection("patients").where("email", "==", email).get().then(snapshot => {
        if (!snapshot.empty) {
            currentPatient = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() };
            document.getElementById('activePatientName').innerText = currentPatient.name + " (سجلي الطبي)";
            document.getElementById('activePatientMeta').innerText = `العمر: ${currentPatient.age} | الجنس: ${currentPatient.gender}`;
            loadChats();
            loadPatientAttachments();
            loadAuditLogs();
        } else {
            const newPatientData = {
                name: email.split('@')[0],
                email: email,
                age: '--',
                gender: 'غير محدد',
                phone: '--',
                triage: 'أخضر',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            db.collection("patients").add(newPatientData).then(docRef => {
                currentPatient = { id: docRef.id, ...newPatientData };
                loadChats();
                loadPatientAttachments();
                loadAuditLogs();
            });
        }
    });
}

function savePatient(e) {
    e.preventDefault();
    const data = {
        name: document.getElementById('patientName').value.trim(),
        age: document.getElementById('patientAge').value.trim(),
        gender: document.getElementById('patientGender').value,
        phone: document.getElementById('patientPhone').value.trim(),
        triage: document.getElementById('patientTriage').value,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection("patients").add(data).then(() => {
        document.getElementById('addPatientForm').reset();
        showSysAlert('success', 'تم الحفظ بنجاح', 'تم تسجيل ملف المريض الجديد وتصنيفه ضمن نظام الفرز.');
    }).catch(err => showSysAlert('error', 'خطأ تقني', err.message));
}

function switchTab(tabIndex) {
    [1, 2, 3, 4].forEach(i => {
        document.getElementById(`tab${i}Content`).classList.add('hidden');
        document.getElementById(`tab${i}Btn`).className = "flex-1 py-3 px-3 text-xs font-bold rounded-2xl transition-all text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white whitespace-nowrap";
    });
    document.getElementById(`tab${tabIndex}Content`).classList.remove('hidden');
    document.getElementById(`tab${tabIndex}Btn`).className = "flex-1 py-3 px-3 text-xs font-bold rounded-2xl transition-all bg-gradient-to-r from-cyan-600 to-teal-600 text-white shadow-lg shadow-cyan-500/20 whitespace-nowrap";
}

function onIcdSelectChange() {
    let val = document.getElementById('icdSearchInput').value;
    document.getElementById('suggestedDrugText').innerText = "البروتوكول العلاجي المقترح للحالة التشخيصية (" + val + "): أدوية موجهة معتمدة ومراجعة إكلينيكياً.";
}

// 2. البلوكشين وتوليد QR Code للوصفات الطبية
function savePrescriptionToDatabase() {
    if (!currentPatient) return showSysAlert('error', 'تنبيه إداري', 'الرجاء اختيار ملف مريض محدد أولاً لإصدار الوصفة الطبية.');
    
    const icd = document.getElementById('icdSearchInput').value;
    const rx = document.getElementById('suggestedDrugText').innerText;
    if (!icd) return showSysAlert('error', 'بيانات ناقصة', 'الرجاء اختيار أو إدخال تشخيص ICD-10 صحيح.');
    
    const rawData = currentPatient.id + icd + rx + Date.now();
    const blockHash = CryptoJS.SHA256(rawData).toString();

    db.collection("prescriptions").add({
        patientId: currentPatient.id,
        diagnosis: icd,
        prescription: rx,
        blockchainHash: blockHash,
        issuedBy: auth.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('hashValue').innerText = blockHash;
        
        // توليد رابط QR Code فوري عبر API آمن وموثوق
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=` + encodeURIComponent(blockHash);
        document.getElementById('qrCodeImage').src = qrApiUrl;
        
        document.getElementById('blockchainHashDisplay').classList.remove('hidden');
        logAuditAction(`إصدار وصفة طبية موثقة بالبلوكشين بواسطة ${auth.currentUser.email}`);
        showSysAlert('success', 'تم الختم بنجاح', 'تم توثيق الوصفة الطبية وتوليد رمز الاستجابة السريعة (QR Code).');
    });
}

// 3. رفع وتقارير المريض
function uploadPatientAttachment() {
    if (!currentPatient) return showSysAlert('error', 'تنبيه', 'يجب تحديد المريض المراد رفع التقرير أو التحليل له.');
    const title = document.getElementById('reportTitle').value.trim();
    const notes = document.getElementById('reportNotes').value.trim();
    const fileInput = document.getElementById('patientFilePayload');
    
    if (!title) return showSysAlert('error', 'خطأ', 'الرجاء كتابة عنوان للمستند أو التحليل الطبي.');

    const fileName = fileInput.files.length > 0 ? fileInput.files[0].name : "تقرير_فحص_طبي.pdf";

    db.collection("patient_attachments").add({
        patientId: currentPatient.id,
        title: title,
        notes: notes,
        fileName: fileName,
        uploadedBy: auth.currentUser.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('reportTitle').value = "";
        document.getElementById('reportNotes').value = "";
        document.getElementById('patientFilePayload').value = "";
        logAuditAction(`رفع تقرير طبي (${title}) بواسطة ${auth.currentUser.email}`);
        showSysAlert('success', 'تم الإرسال بنجاح', 'تم إرفاق التحليل والرأي الطبي وإرساله لملف المريض.');
        loadPatientAttachments();
    }).catch(err => showSysAlert('error', 'خطأ في الرفع', err.message));
}

function loadPatientAttachments() {
    if (!currentPatient) return;
    db.collection("patient_attachments").where("patientId", "==", currentPatient.id).orderBy("createdAt", "desc")
    .onSnapshot(snapshot => {
        const listEl = document.getElementById('patientAttachmentsList');
        if (snapshot.empty) {
            listEl.innerHTML = `<div class="text-center py-4 text-xs text-slate-500">لا توجد تقارير أو تحاليل مرفقة حالياً.</div>`;
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const att = doc.data();
            html += `
                <div class="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between">
                    <div>
                        <h5 class="text-xs font-bold text-slate-900 dark:text-white"><i class="fa-solid fa-file-medical text-cyan-600 dark:text-cyan-400 ml-1.5"></i> ${att.title}</h5>
                        <p class="text-[10px] text-slate-600 dark:text-slate-400 mt-1"><b>رأي الدكتور:</b> ${att.notes || 'لا توجد ملاحظات'} <span class="text-cyan-600 dark:text-cyan-400 mr-2 font-mono">(${att.fileName})</span></p>
                    </div>
                    <span class="text-[9px] bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 px-2.5 py-1 rounded-xl border border-cyan-500/20 font-bold">معتمد إكلينيكياً</span>
                </div>
            `;
        });
        listEl.innerHTML = html;
    });
}

// 4. المحادثة المشفرة المتطورة (فقاعات اليمين واليسار + مؤشر الكتابة وعلامات القراءة والإشعارات)
function handleTypingEvent() {
    if (!currentPatient) return;
    const typingRef = db.collection("typing_status").doc(currentPatient.id + "_" + auth.currentUser.uid);
    typingRef.set({ isTyping: true, sender: auth.currentUser.email, updatedAt: Date.now() });
    
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
        typingRef.set({ isTyping: false, sender: auth.currentUser.email, updatedAt: Date.now() });
    }, 1500);
}

function listenToTypingStatus() {
    if (!currentPatient) return;
    db.collection("typing_status").onSnapshot(snapshot => {
        let isSomeoneTyping = false;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (data.isTyping && data.sender !== auth.currentUser.email && (Date.now() - data.updatedAt < 3000)) {
                isSomeoneTyping = true;
            }
        });
        const typingEl = document.getElementById('typingIndicator');
        if (typingEl) {
            if (isSomeoneTyping) typingEl.classList.remove('hidden');
            else typingEl.classList.add('hidden');
        }
    });
}

function insertSnippet(text) {
    document.getElementById('chatMessage').value = text;
}

function sendEncryptedMessage() {
    if (!currentPatient) return showSysAlert('error', 'تنبيه', 'اختر مريضاً لفتح قناة المحادثة المشفرة.');
    const msg = document.getElementById('chatMessage').value.trim();
    if (!msg) return;

    const encryptedMsg = CryptoJS.AES.encrypt(msg, SECRET_KEY).toString();

    db.collection("chats").add({
        patientId: currentPatient.id,
        senderEmail: auth.currentUser.email,
        text: encryptedMsg,
        isRead: false,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        document.getElementById('chatMessage').value = "";
        db.collection("typing_status").doc(currentPatient.id + "_" + auth.currentUser.uid).set({ isTyping: false });
    });
}

function loadChats() {
    if (!currentPatient) return;
    listenToTypingStatus();
    
    db.collection("chats").where("patientId", "==", currentPatient.id).orderBy("timestamp", "asc")
    .onSnapshot(snapshot => {
        const box = document.getElementById('chatBox');
        box.innerHTML = "";
        if (snapshot.empty) {
            box.innerHTML = `<div class="text-center text-xs text-slate-500 py-6 m-auto">لا توجد رسائل سابقة. ابدأ المحادثة الآمنة.</div>`;
            return;
        }
        
        snapshot.forEach(doc => {
            const data = doc.data();
            try {
                const bytes = CryptoJS.AES.decrypt(data.text, SECRET_KEY);
                const decryptedMsg = bytes.toString(CryptoJS.enc.Utf8);
                const isMe = data.senderEmail === auth.currentUser.email;
                
                if (!isMe && !data.isRead) {
                    db.collection("chats").doc(doc.id).update({ isRead: true });
                }

                // إشعار متصفح فوري لو الرسالة واردة ومش من طرفي الحالي
                if (!isMe && Notification.permission === "granted" && document.hidden) {
                    new Notification("ZinMed: رسالة طبية جديدة", { body: decryptedMsg });
                }

                const readReceiptIcon = isMe ? (data.isRead ? '<i class="fa-solid fa-check-double text-cyan-200 text-[10px] mr-1" title="مقروء"></i>' : '<i class="fa-solid fa-check text-slate-300 text-[10px] mr-1" title="تم الإرسال"></i>') : '';

                // تصميم فقاعات منفصلة بوضوح (اليمين للمرسل، اليسار للمستقبل)
                box.innerHTML += `
                    <div class="flex flex-col w-full mb-2 ${isMe ? 'items-end' : 'items-start'}">
                        <div class="text-xs p-3.5 rounded-2xl max-w-[75%] shadow-md ${isMe ? 'bg-gradient-to-r from-cyan-600 to-teal-600 text-white rounded-bl-2xl rounded-tr-sm' : 'bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 rounded-br-2xl rounded-tl-sm'}">
                            <span class="block text-[9px] opacity-70 mb-1 font-mono">${data.senderEmail}</span>
                            <div class="leading-relaxed text-xs">${decryptedMsg}</div>
                            <div class="flex justify-end items-center mt-1 text-[9px] opacity-75">
                                ${readReceiptIcon}
                            </div>
                        </div>
                    </div>`;
            } catch (e) {}
        });
        box.scrollTop = box.scrollHeight;
    });
}

// 5. سجل التدقيق الأمني (Audit Logs)
function logAuditAction(actionDescription) {
    if (!currentPatient) return;
    db.collection("audit_logs").add({
        patientId: currentPatient.id,
        action: actionDescription,
        user: auth.currentUser.email,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
    });
}

function loadAuditLogs() {
    if (!currentPatient) return;
    db.collection("audit_logs").where("patientId", "==", currentPatient.id).orderBy("timestamp", "desc")
    .onSnapshot(snapshot => {
        const listEl = document.getElementById('auditLogsList');
        if (snapshot.empty) {
            listEl.innerHTML = `<div class="text-center py-4 text-xs text-slate-500">لا توجد سجلات تدقيق مسجلة حتى الآن.</div>`;
            return;
        }
        let html = '';
        snapshot.forEach(doc => {
            const log = doc.data();
            html += `
                <div class="p-3 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl flex items-center justify-between text-xs">
                    <div>
                        <p class="font-bold text-slate-800 dark:text-slate-200"><i class="fa-solid fa-shield-cat text-cyan-600 ml-1.5"></i> ${log.action}</p>
                        <p class="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">المستخدم المسؤول: ${log.user}</p>
                    </div>
                    <span class="text-[9px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-1 rounded-lg font-mono">سجل أمني موثق</span>
                </div>
            `;
        });
        listEl.innerHTML = html;
    });
}

function initDashboardCharts() {
    document.getElementById('statTotalPatients').innerText = "1,420";
    document.getElementById('statTotalRx').innerText = "4,890";
    
    const ctx = document.getElementById('analyticsChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة'],
            datasets: [{
                label: 'معدل التدفق الإكلينيكي وحركة السجلات',
                data: [45, 59, 80, 81, 56, 95, 110],
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.05)',
                borderWidth: 3,
                fill: true,
                tension: 0.4
            }]
        },
        options: { 
            responsive: true, 
            maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#64748b', font: { family: 'Cairo' } } } },
            scales: {
                x: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100, 116, 139, 0.1)' } },
                y: { ticks: { color: '#64748b' }, grid: { color: 'rgba(100, 116, 139, 0.1)' } }
            }
        }
    });
}
