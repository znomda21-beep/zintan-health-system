let currentPatient = null;
let patientsArray = [];

// حفظ مريض جديد في الفايربيس
function savePatient(e) {
    e.preventDefault();
    const name = document.getElementById('patientName').value.trim();
    const age = document.getElementById('patientAge').value.trim();
    const gender = document.getElementById('patientGender').value;
    const phone = document.getElementById('patientPhone').value.trim();

    if (!name) return;

    const newPatient = {
        name: name,
        age: age,
        gender: gender,
        phone: phone,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    db.collection("patients").add(newPatient).then(() => {
        document.getElementById('addPatientForm').reset();
    }).catch(err => {
        console.error("خطأ في حفظ البيانات:", err);
    });
}

// جلب وتحديث المرضى لحظياً
function listenToPatients() {
    db.collection("patients").orderBy("createdAt", "desc").onSnapshot(snapshot => {
        patientsArray = [];
        snapshot.forEach(doc => {
            patientsArray.push({ id: doc.id, ...doc.data() });
        });
        renderPatientsList(patientsArray);
    });
}

// عرض القائمة في الواجهة
function renderPatientsList(list) {
    const listEl = document.getElementById('patientsList');
    document.getElementById('patientCount').innerText = `${list.length} مريض`;

    if (list.length === 0) {
        listEl.innerHTML = `<div class="text-center py-8 text-slate-500 text-xs">لا يوجد مرضى مسجلون حالياً.</div>`;
        return;
    }

    listEl.innerHTML = list.map(p => `
        <div onclick="selectPatient('${p.id}')" class="p-3 bg-slate-950/60 hover:bg-slate-800/80 border border-slate-800 rounded-xl cursor-pointer transition-all flex justify-between items-center ${currentPatient && currentPatient.id === p.id ? 'border-cyan-500 bg-cyan-950/20' : ''}">
            <div>
                <h4 class="text-xs font-bold text-slate-100">${p.name}</h4>
                <p class="text-[10px] text-slate-400">${p.gender} | ${p.age} سنة</p>
            </div>
            <i class="fa-solid fa-chevron-left text-xs text-slate-600"></i>
        </div>
    `).join('');
}

// تحديد المريض النشط
function selectPatient(id) {
    currentPatient = patientsArray.find(p => p.id === id);
    if (!currentPatient) return;

    document.getElementById('activePatientName').innerText = currentPatient.name;
    document.getElementById('activePatientMeta').innerText = `العمر: ${currentPatient.age} سنة | الجنس: ${currentPatient.gender} | الهاتف: ${currentPatient.phone || 'غير مسجل'}`;
    
    renderPatientsList(patientsArray);
}

// النداء الصوتي
function speakPatientName() {
    if (!currentPatient) {
        alert("يرجى اختيار مريض من القائمة أولاً!");
        return;
    }
    const text = `الرجاء دخول المريض ${currentPatient.name}`;
    const msg = new SpeechSynthesisUtterance(text);
    msg.lang = 'ar-SA';
    window.speechSynthesis.speak(msg);
}

// محرك التشخيص والبروتوكول العلاجي الذكي
function onIcdSelectChange() {
    let inputVal = document.getElementById('icdSearchInput').value;
    let drugText = document.getElementById('suggestedDrugText');

    if (inputVal.includes("E11") || inputVal.includes("E10") || inputVal.includes("السكري")) {
        drugText.innerText = "منظم السكر Metformin 500mg - حبة مرتين يومياً + فحص التراكمي HbA1c.";
    } else if (inputVal.includes("I10") || inputVal.includes("ضغط")) {
        drugText.innerText = "خافض الضغط Amlodipine 5mg - حبة واحدة صباحاً + قياس الضغط اليومي.";
    } else if (inputVal.includes("J45") || inputVal.includes("الربو")) {
        drugText.innerText = "بخاخ الفينتولين Ventolin Inhaler - بخة عند اللزوم + مسكن الباراسيتامول.";
    } else if (inputVal.includes("K21") || inputVal.includes("K29") || inputVal.includes("المعدة")) {
        drugText.innerText = "دواء الحموضة Omeprazole 20mg - حبة قبل الأكل بـ 30 دقيقة.";
    } else if (inputVal.includes("N39") || inputVal.includes("المسالك")) {
        drugText.innerText = "مضاد حيوي Ciprofloxacin 500mg - حبة كل 12 ساعة + فوار يورينكس.";
    } else if (inputVal.includes("M54") || inputVal.includes("الظهر") || inputVal.includes("عظام")) {
        drugText.innerText = "مسكن وباسط عضلات Ibuprofen 400mg - عند الحاجة بعد الأكل.";
    } else if (inputVal.includes("I20") || inputVal.includes("I21") || inputVal.includes("الصدر")) {
        drugText.innerText = "إجراء تخطيط قلب فوراً (ECG) + أسبرين أطفال 81mg تحت إشراف الطوارئ.";
    } else {
        drugText.innerText = "تم تسجيل الكود: (" + inputVal + ") - يرجى كتابة العلاج المخصص في الملاحظات.";
    }
}

// حفظ الوصفة
function savePrescriptionToDatabase() {
    if (!currentPatient) {
        alert("اختر مريضاً أولاً لحفظ الوصفة له!");
        return;
    }
    const icd = document.getElementById('icdSearchInput').value;
    const rx = document.getElementById('suggestedDrugText').innerText;

    db.collection("prescriptions").add({
        patientId: currentPatient.id,
        patientName: currentPatient.name,
        icdCode: icd,
        prescription: rx,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
    }).then(() => {
        alert("تم حفظ الوصفة وتوثيقها في السجل الطبي الموحد بنجاح!");
    });
}

// توليد QR للطباعة
function generateQRPrescription() {
    if (!currentPatient) {
        alert("اختر مريضاً أولاً لتوليد رمز الـ QR!");
        return;
    }

    const icd = document.getElementById('icdSearchInput').value || "غير محدد";
    const rx = document.getElementById('suggestedDrugText').innerText;
    const qrContent = `المريض: ${currentPatient.name}\nالتشخيص: ${icd}\nالوصفة: ${rx}`;

    const qrContainer = document.getElementById('qrcode');
    qrContainer.innerHTML = "";
    new QRCode(qrContainer, {
        text: qrContent,
        width: 140,
        height: 140
    });

    document.getElementById('qrDetailsText').innerText = qrContent;
    document.getElementById('qrModal').classList.remove('hidden');
    document.getElementById('qrModal').classList.add('flex');
}

function closeQrModal() {
    document.getElementById('qrModal').classList.add('hidden');
    document.getElementById('qrModal').classList.remove('flex');
}

// التنقل بين التبويبات
function switchTab(tabIndex) {
    [1, 2, 3].forEach(i => {
        document.getElementById(`tab${i}Content`).classList.add('hidden');
        document.getElementById(`tab${i}Btn`).className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all text-slate-400 hover:text-white";
    });

    document.getElementById(`tab${tabIndex}Content`).classList.remove('hidden');
    document.getElementById(`tab${tabIndex}Btn`).className = "flex-1 py-2 text-xs font-bold rounded-xl transition-all bg-cyan-600 text-white";
}