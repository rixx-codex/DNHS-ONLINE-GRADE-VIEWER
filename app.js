// ==========================================
// STUDENT VIEW LOGIC (app.js) - FIXED HIGH END
// ==========================================

async function handleSearch() {
    const lrnInput = document.getElementById('lrnInput');
    const lrn = lrnInput.value.trim();
    const btn = document.getElementById('searchBtn');
    
    // I-check kung tama ang LRN length (Standard LRN is 12 digits)
    if (lrn.length < 5) {
        showToast("Please enter a valid LRN.");
        return;
    }

    // High-end loading effect
    btn.disabled = true;
    btn.innerText = "SEARCHING...";

    try {
        // Siguraduhin na ang table name ay 'students' at access_code ang gamit
        const response = await fetch(`${SUPABASE_URL}/rest/v1/students?access_code=eq.${lrn}&select=*`, {
            headers: {
                'apikey': SUPABASE_KEY,
                'Authorization': `Bearer ${SUPABASE_KEY}` 
            }
        });

        if (!response.ok) throw new Error("Database Connection Failed");

        const data = await response.json();

        // Delay ng konti para sa "premium feel" ng loading
        setTimeout(() => {
            btn.disabled = false;
            btn.innerText = "GET GRADES";
            
            if (data && data.length > 0) {
                showGrades(data[0]);
            } else {
                showToast("LRN not found. Please double-check.");
            }
        }, 800);

    } catch (error) {
        console.error("Search Error:", error);
        showToast("Connection Error. Check your internet.");
        btn.disabled = false;
        btn.innerText = "GET GRADES";
    }
}

function showGrades(student) {
    const searchSection = document.getElementById('searchSection');
    const gradeSection = document.getElementById('gradeSection');
    const overlay = document.getElementById('comingSoonOverlay');
    const gradesWrapper = document.getElementById('gradesWrapper');
    const status = document.getElementById('statusBadge');
    const nameEl = document.getElementById('studentName');

    // Transitions
    searchSection.classList.add('hidden');
    gradeSection.classList.remove('hidden');
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Populate Student Info
    nameEl.innerText = student.student_name;
    document.getElementById('studentLrn').innerText = "LRN: " + student.access_code;

    // --- GRADING LOGIC FIX ---
    // Ginagawa nating Number ang grade para sigurado sa math logic
    const finalGrade = parseFloat(student.grade) || 0;
    
    // Check if Pending (Kung ang grade ay 0, null, o empty)
    const isPending = finalGrade === 0;

    if (isPending) {
        if(overlay) overlay.classList.remove('hidden');
        if(gradesWrapper) gradesWrapper.classList.add('blur-content');
        
        safeSetText('g-ave', "--");
        if(status) {
            status.innerText = "PENDING";
            status.style.background = "rgba(255, 255, 255, 0.1)";
            status.style.boxShadow = "none";
        }
        
        // I-clear ang subjects pag pending
        const subjectIds = ['css', 'immersion', 'cpar', 'three_is', 'pr2', 'entrep', 'century21'];
        subjectIds.forEach(id => safeSetText(`g-${id}`, "--"));

    } else {
        // Kapag may Grade na:
        if(overlay) overlay.classList.add('hidden');
        if(gradesWrapper) gradesWrapper.classList.remove('blur-content');

        // IMPORTANT: Dapat tugma ang property names sa Supabase columns mo (Case Sensitive)
        // Gamit ang student['KEY'] para sa mga may dash o start sa number
        safeSetText('g-css', student.CSS);
        safeSetText('g-immersion', student.IMMERSION);
        safeSetText('g-cpar', student.CPAR);
        safeSetText('g-three_is', student['3IS']); 
        safeSetText('g-pr2', student['P.R-2']); 
        safeSetText('g-entrep', student.ENTREP);
        safeSetText('g-century21', student['21ST CENTURY']);
        safeSetText('g-ave', finalGrade);

        // PASSED/FAILED LOGIC
        if(status) {
            const isPassed = finalGrade >= 75;
            status.innerText = isPassed ? "PASSED" : "FAILED";
            status.className = "badge-status " + (isPassed ? "passed" : "failed");
            
            // Dynamic Colors for Name & Status
            status.style.background = isPassed ? "#10b981" : "#ef4444";
            status.style.boxShadow = isPassed ? "0 0 20px rgba(16, 185, 129, 0.4)" : "0 0 20px rgba(239, 68, 68, 0.4)";
            nameEl.style.color = isPassed ? "#00B5FF" : "#ff4d4d";
        }
    }
}

function safeSetText(id, value) {
    const el = document.getElementById(id);
    if (el) {
        // Fix: Kung 0 ang value, ipakita ay "0" hindi "--" (maliban na lang kung overall grade)
        if (value === 0 || value === "0") {
            el.innerText = "0";
        } else {
            el.innerText = (value) ? value : "--";
        }
    }
}