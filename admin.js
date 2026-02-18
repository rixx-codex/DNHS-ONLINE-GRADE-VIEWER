let isEditMode = false;
const subjectIds = ['css', 'immersion', 'cpar', 'three_is', 'pr2', 'entrep', 'century21'];

// --- 1. TOGGLE LOADING HELPER (Full Screen Loader) ---
function toggleLoading(show, text = "Processing...") {
    const loader = document.getElementById('loadingOverlay');
    const txtEl = document.querySelector('.loading-text');
    if (!loader) return;

    if (show) {
        if (txtEl) txtEl.innerText = text;
        loader.classList.remove('hidden');
    } else {
        loader.classList.add('hidden');
    }
}

// --- 2. AUTOMATIC COMPUTATION ---
function computeAverage() {
    let total = 0, count = 0;
    subjectIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            const val = parseFloat(el.value);
            if (!isNaN(val) && val > 0) { 
                total += val; 
                count++; 
            }
        }
    });
    
    const avg = count > 0 ? Math.round(total / count) : 0;
    const el = document.getElementById('genAve');
    
    if (el) {
        el.value = avg > 0 ? avg : "";
        el.style.color = avg >= 75 ? "#10b981" : "#ff4b2b";
    }
}

// --- 3. SEARCH FUNCTION ---
async function searchToEdit() {
    const lrnInput = document.getElementById('searchLrn').value.trim();
    if (!lrnInput) return showToast("Please enter LRN", "error");
    
    toggleLoading(true, "Searching database...");
    
    try {
        const { data, error } = await supabase
            .from('students')
            .select('*')
            .eq('access_code', lrnInput)
            .maybeSingle();

        if (error) throw error;

        if (data) {
            // Fill up identity fields
            document.getElementById('name').value = data.student_name || "";
            document.getElementById('lrn').value = data.access_code || "";
            
            // Grades Mapping (Updated to match likely DB column names)
            document.getElementById('css').value = data.css || data.CSS || "";
            document.getElementById('immersion').value = data.immersion || data.IMMERSION || "";
            document.getElementById('cpar').value = data.cpar || data.CPAR || "";
            document.getElementById('three_is').value = data["3is"] || data["3IS"] || "";
            document.getElementById('pr2').value = data.pr2 || data.PR2 || "";
            document.getElementById('entrep').value = data.entrep || data.ENTREP || "";
            document.getElementById('century21').value = data.century21 || data.CENTURY21 || "";
            
            computeAverage();
            
            isEditMode = true;
            document.getElementById('editIndicator').classList.remove('hidden');
            document.getElementById('uploadBtn').innerHTML = '<i class="fa-solid fa-pen-to-square"></i> UPDATE STUDENT RECORD';
            document.getElementById('deleteBtn').classList.remove('hidden');
            
            showToast("Record Found!");
            document.getElementById('name').scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            showToast("No student found with that LRN", "error");
        }
    } catch (e) {
        showToast("Error: " + e.message, "error");
    } finally {
        toggleLoading(false);
    }
}

// --- 4. SAVE OR UPDATE FUNCTION (The Error Fix is Here) ---
async function uploadData() {
    const studentName = document.getElementById('name').value.trim();
    const studentLrn = document.getElementById('lrn').value.trim();
    
    if (!studentName || !studentLrn) {
        return showToast("Name and LRN are required", "error");
    }

    // UPDATED PAYLOAD: Lowercase keys to match standard Supabase column naming
    const payload = {
        student_name: studentName,
        access_code: studentLrn,
        css: parseFloat(document.getElementById('css').value) || 0,
        immersion: parseFloat(document.getElementById('immersion').value) || 0,
        cpar: parseFloat(document.getElementById('cpar').value) || 0,
        "3is": parseFloat(document.getElementById('three_is').value) || 0,
        pr2: parseFloat(document.getElementById('pr2').value) || 0,
        entrep: parseFloat(document.getElementById('entrep').value) || 0,
        century21: parseFloat(document.getElementById('century21').value) || 0,
        average: parseFloat(document.getElementById('genAve').value) || 0
    };

    toggleLoading(true, isEditMode ? "Updating record..." : "Saving new record...");

    try {
        let result;
        if (isEditMode) {
            result = await supabase.from('students').update(payload).eq('access_code', studentLrn);
        } else {
            result = await supabase.from('students').insert([payload]);
        }

        if (result.error) throw result.error;

        showToast(isEditMode ? "Record updated successfully!" : "New record saved!");
        if (!isEditMode) resetForm(); 
        
    } catch (e) {
        // If error persists, it shows the exact column name causing the issue
        showToast("DB Error: " + e.message, "error");
    } finally {
        toggleLoading(false);
    }
}

// --- 5. DELETE FUNCTION ---
async function deleteRecord() {
    const lrn = document.getElementById('lrn').value;
    if (!lrn) return;

    const confirm = await showConfirmModal();
    if (!confirm) return;

    toggleLoading(true, "Deleting record...");
    try {
        const { error } = await supabase.from('students').delete().eq('access_code', lrn);
        if (error) throw error;
        
        showToast("Record deleted successfully");
        resetForm();
    } catch (e) {
        showToast(e.message, "error");
    } finally {
        toggleLoading(false);
    }
}

// --- 6. RESET FORM ---
function resetForm() {
    isEditMode = false;
    document.querySelectorAll('.admin-card input').forEach(i => i.value = "");
    document.getElementById('editIndicator').classList.add('hidden');
    document.getElementById('uploadBtn').innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> SAVE STUDENT RECORD';
    document.getElementById('deleteBtn').classList.add('hidden');
    document.getElementById('searchLrn').value = "";
    computeAverage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 7. TOAST SYSTEM ---
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.style.borderLeft = `4px solid ${type === 'success' ? '#10b981' : '#ff4b2b'}`;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 3000);
}

// --- 8. CUSTOM CONFIRMATION MODAL ---
function showConfirmModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('confirmCancel');
        const okBtn = document.getElementById('confirmOk');
        
        if (!modal) { resolve(true); return; } // Fallback if no modal
        
        modal.classList.remove('hidden');
        
        const handleCancel = () => {
            modal.classList.add('hidden');
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
            resolve(false);
        };
        
        const handleOk = () => {
            modal.classList.add('hidden');
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
            resolve(true);
        };
        
        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleOk);
    });
}

// --- 9. INITIALIZE ---
document.addEventListener('DOMContentLoaded', () => {
    subjectIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', computeAverage);
    });
});

// --- 4. SAVE OR UPDATE FUNCTION ---
async function uploadData() {
    const studentName = document.getElementById('name').value.trim();
    const studentLrn = document.getElementById('lrn').value.trim();
    
    if (!studentName || !studentLrn) {
        return showToast("Name and LRN are required", "error");
    }

    const payload = {
        student_name: studentName,
        access_code: studentLrn,
        CSS: parseFloat(document.getElementById('css').value) || 0,
        IMMERSION: parseFloat(document.getElementById('immersion').value) || 0,
        CPAR: parseFloat(document.getElementById('cpar').value) || 0,
        "3IS": parseFloat(document.getElementById('three_is').value) || 0,
        PR2: parseFloat(document.getElementById('pr2').value) || 0,
        ENTREP: parseFloat(document.getElementById('entrep').value) || 0,
        CENTURY21: parseFloat(document.getElementById('century21').value) || 0,
        average: parseFloat(document.getElementById('genAve').value) || 0
    };

    toggleLoading(true, isEditMode ? "Updating record..." : "Saving new record...");

    try {
        let result;
        if (isEditMode) {
            result = await supabase.from('students').update(payload).eq('access_code', studentLrn);
        } else {
            result = await supabase.from('students').insert([payload]);
        }

        if (result.error) throw result.error;

        showToast(isEditMode ? "Record updated successfully!" : "New record saved!");
        if (!isEditMode) resetForm(); 
        
    } catch (e) {
        showToast(e.message, "error");
    } finally {
        toggleLoading(false);
    }
}

// --- 5. DELETE FUNCTION ---
async function deleteRecord() {
    const lrn = document.getElementById('lrn').value;
    if (!lrn) return;

    toggleLoading(true, "Deleting record...");
    try {
        const { error } = await supabase.from('students').delete().eq('access_code', lrn);
        if (error) throw error;
        
        showToast("Record deleted successfully");
        resetForm();
    } catch (e) {
        showToast(e.message, "error");
    } finally {
        toggleLoading(false);
    }
}

// --- 6. RESET FORM ---
function resetForm() {
    isEditMode = false;
    // Clears all inputs inside admin-card
    document.querySelectorAll('.admin-card input').forEach(i => i.value = "");
    document.getElementById('editIndicator').classList.add('hidden');
    document.getElementById('uploadBtn').innerHTML = '<i class="fa-solid fa-cloud-arrow-up"></i> SAVE STUDENT RECORD';
    document.getElementById('deleteBtn').classList.add('hidden');
    document.getElementById('searchLrn').value = "";
    computeAverage();
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// --- 7. TOAST SYSTEM (Success/Error) ---
function showToast(msg, type = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.innerText = msg;
    t.style.borderLeft = `4px solid ${type === 'success' ? '#10b981' : '#ff4b2b'}`;
    t.classList.add('active');
    setTimeout(() => t.classList.remove('active'), 3000);
}

// --- 8. CUSTOM CONFIRMATION MODAL ---
function showConfirmModal() {
    return new Promise((resolve) => {
        const modal = document.getElementById('confirmModal');
        const cancelBtn = document.getElementById('confirmCancel');
        const okBtn = document.getElementById('confirmOk');
        
        if (!modal || !cancelBtn || !okBtn) {
            resolve(false);
            return;
        }
        
        // Show modal
        modal.classList.remove('hidden');
        
        // Reset state
        let resolved = false;
        
        const cleanup = () => {
            if (resolved) return;
            resolved = true;
            modal.classList.add('hidden');
            cancelBtn.removeEventListener('click', handleCancel);
            okBtn.removeEventListener('click', handleOk);
        };
        
        const handleCancel = () => {
            cleanup();
            resolve(false);
        };
        
        const handleOk = () => {
            cleanup();
            resolve(true);
        };
        
        cancelBtn.addEventListener('click', handleCancel);
        okBtn.addEventListener('click', handleOk);
    });
}

// Expose to global scope for auth.js
window.showConfirmModal = showConfirmModal;

// --- 8. INITIALIZE LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    // Add event listeners to all subject inputs for real-time average computation
    subjectIds.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.addEventListener('input', computeAverage);
    });
});
