// Lấy các phần tử HTML
const soHienThiElement = document.getElementById('soHienThi');
const nutQuayElement = document.getElementById('nutQuay');
const danhSachDaQuayElement = document.getElementById('danhSachDaQuay');
const modeButtons = document.querySelectorAll('.mode-button');
const nutResetElement = document.getElementById('nutReset');
const historyCountElement = document.getElementById('historyCount');
const clockElement = document.getElementById('clock');
const nutUndoElement = document.getElementById('nutUndo');

// Các phần tử của Modal
const openSettingsBtn = document.getElementById('openSettingsBtn');
const settingsModal = document.getElementById('settingsModal');
const closeModalBtn = document.getElementById('closeModalBtn');
const modalOverlay = document.querySelector('.modal-overlay');

// Các phần tử cài đặt bên trong Modal
const startNumInput = document.getElementById('startNumInput');
const endNumInput = document.getElementById('endNumInput');
const setRangeBtn = document.getElementById('setRangeBtn');
const enableRange2Checkbox = document.getElementById('enableRange2Checkbox');
const range2Container = document.getElementById('range2Container');
const startNumInput2 = document.getElementById('startNumInput2');
const endNumInput2 = document.getElementById('endNumInput2');


// Khai báo biến trạng thái
let currentMode = 1, cacSoCoTheQuay = [], lichSuDaQuay = [], turnIndex = 0;
let startNum = 0, endNum = 100;
let startNum2 = 101, endNum2 = 200;
let isSecondRangeEnabled = false;

const turnColorClasses = ['spin-turn-0', 'spin-turn-1', 'spin-turn-2', 'spin-turn-3', 'spin-turn-4', 'spin-turn-5'];
const STORAGE_KEY = 'modernRandomSpinnerState_v4';

// --- LOGIC ĐÓNG/MỞ MODAL ---
function openModal() {
    startNumInput.value = startNum;
    endNumInput.value = endNum;
    startNumInput2.value = startNum2;
    endNumInput2.value = endNum2;
    enableRange2Checkbox.checked = isSecondRangeEnabled;
    updateToggleButton();
    settingsModal.classList.add('active');
}

function closeModal() {
    settingsModal.classList.remove('active');
}

openSettingsBtn.addEventListener('click', openModal);
closeModalBtn.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);


// --- CÁC HÀM TIỆN ÍCH ---

// ===== HÀM MỚI ĐỂ THÊM SỐ 0 =====
/**
 * Định dạng một số bằng cách thêm số 0 vào trước nếu nó nhỏ hơn 10.
 * @param {number | string} num - Số hoặc chuỗi cần định dạng.
 * @returns {string} Chuỗi đã được định dạng.
 */
function formatNumber(num) {
    // Nếu đầu vào không phải là số (ví dụ: chuỗi "Hết số!"), trả về nguyên bản
    if (typeof num !== 'number' || isNaN(num)) {
        return num;
    }
    // Sử dụng padStart để thêm '0' nếu số có 1 chữ số (0-9)
    return String(num).padStart(2, '0');
}
// ===================================


function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${h}:${m}:${s}`;
}

function updateHistoryCount() {
    let totalNumbers = (endNum - startNum) + 1;
    if (isSecondRangeEnabled) {
        totalNumbers += (endNum2 - startNum2) + 1;
    }
    const spunCount = totalNumbers - cacSoCoTheQuay.length;
    historyCountElement.textContent = `(${spunCount}/${totalNumbers})`;
}

function updateUndoButtonState() {
    nutUndoElement.disabled = lichSuDaQuay.length === 0;
}

// --- CÁC HÀM LƯU/TẢI/RESET ---
function saveState() {
    const state = { 
        cacSoCoTheQuay, lichSuDaQuay, turnIndex, 
        startNum, endNum, startNum2, endNum2, isSecondRangeEnabled
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const savedStateJSON = localStorage.getItem(STORAGE_KEY);
    if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        startNum = savedState.startNum !== undefined ? savedState.startNum : 0;
        endNum = savedState.endNum !== undefined ? savedState.endNum : 100;
        startNum2 = savedState.startNum2 !== undefined ? savedState.startNum2 : 101;
        endNum2 = savedState.endNum2 !== undefined ? savedState.endNum2 : 200;
        isSecondRangeEnabled = savedState.isSecondRangeEnabled || false;

        cacSoCoTheQuay = savedState.cacSoCoTheQuay;
        lichSuDaQuay = savedState.lichSuDaQuay;
        turnIndex = savedState.turnIndex;
        
        if (!cacSoCoTheQuay || cacSoCoTheQuay.length === 0 && lichSuDaQuay.length === 0) {
            initializeNumbers();
        }
        renderHistory();
        if (cacSoCoTheQuay.length === 0 && lichSuDaQuay.length > 0) {
            hienThiKetQua("Hết số!");
            nutQuayElement.disabled = true;
        }
    } else {
        initializeState();
    }
    updateHistoryCount();
    updateUndoButtonState();
}

function resetState() {
     if (confirm('Bạn có chắc chắn muốn làm mới và xóa toàn bộ lịch sử không? Thao tác này sẽ giữ lại các khoảng số bạn đã chọn.')) {
        initializeState();
        renderHistory();
        updateHistoryCount();
        updateUndoButtonState();
        hienThiKetQua("--");
        nutQuayElement.disabled = false;
        saveState();
    }
}

function undoLastSpin() {
    if (lichSuDaQuay.length === 0) return;
    const lastSpin = lichSuDaQuay.pop();
    cacSoCoTheQuay.push(...lastSpin.numbers);
    turnIndex--;
    renderHistory();
    hienThiKetQua('--');
    nutQuayElement.disabled = false;
    updateHistoryCount();
    updateUndoButtonState();
    saveState();
}

function applyRange() {
    const newStart = parseInt(startNumInput.value, 10);
    const newEnd = parseInt(endNumInput.value, 10);
    const useRange2 = enableRange2Checkbox.checked;
    const newStart2 = parseInt(startNumInput2.value, 10);
    const newEnd2 = parseInt(endNumInput2.value, 10);

    if (isNaN(newStart) || isNaN(newEnd)) { alert("Vui lòng nhập số hợp lệ cho khoảng 1."); return false; }
    if (newStart >= newEnd) { alert("Khoảng 1: Số bắt đầu phải nhỏ hơn số kết thúc."); return false; }
    if (useRange2) {
        if (isNaN(newStart2) || isNaN(newEnd2)) { alert("Vui lòng nhập số hợp lệ cho khoảng 2."); return false; }
        if (newStart2 >= newEnd2) { alert("Khoảng 2: Số bắt đầu phải nhỏ hơn số kết thúc."); return false; }
        if (Math.max(newStart, newStart2) <= Math.min(newEnd, newEnd2)) { alert("Hai khoảng số không được chồng chéo lên nhau."); return false; }
    }
    let totalSize = (newEnd - newStart) + 1;
    if (useRange2) totalSize += (newEnd2 - newStart2) + 1;
    if (totalSize > 5000) { alert("Tổng số lượng trong các khoảng quá lớn (tối đa 5000 số)."); return false; }

    if (confirm('Thay đổi cài đặt khoảng số sẽ làm mới vòng quay và xóa lịch sử. Bạn có chắc chắn?')) {
        startNum = newStart;
        endNum = newEnd;
        isSecondRangeEnabled = useRange2;
        if(useRange2) {
            startNum2 = newStart2;
            endNum2 = newEnd2;
        }
        initializeState();
        renderHistory();
        updateHistoryCount();
        updateUndoButtonState();
        hienThiKetQua("--");
        nutQuayElement.disabled = false;
        saveState();
        alert(`Đã áp dụng cài đặt khoảng số mới.`);
        return true;
    }
    return false;
}

function initializeNumbers() {
    const range1 = Array.from({ length: (endNum - startNum) + 1 }, (_, i) => startNum + i);
    cacSoCoTheQuay = isSecondRangeEnabled ? 
        [...range1, ...Array.from({ length: (endNum2 - startNum2) + 1 }, (_, i) => startNum2 + i)] : 
        range1;
}

function initializeState() {
    initializeNumbers();
    lichSuDaQuay = [];
    turnIndex = 0;
}


// ===== HÀM ĐÃ ĐƯỢC CẬP NHẬT =====
function renderHistory() {
    danhSachDaQuayElement.innerHTML = '';
    lichSuDaQuay.forEach(turn => {
        turn.numbers.sort((a, b) => a - b).forEach(so => {
            const phanTuMoi = document.createElement('li');
            // Áp dụng định dạng số ở đây
            phanTuMoi.textContent = formatNumber(so);
            phanTuMoi.classList.add(turn.colorClass);
            danhSachDaQuayElement.appendChild(phanTuMoi);
        });
    });
}

// ===== HÀM ĐÃ ĐƯỢC CẬP NHẬT =====
function hienThiKetQua(ketQua) {
    soHienThiElement.innerHTML = '';
    const displayArray = Array.isArray(ketQua) ? ketQua : [ketQua];
    
    displayArray.forEach((so, index) => {
        if (index > 0) {
            const separator = document.createElement('span');
            separator.className = 'so-separator';
            separator.textContent = ',';
            soHienThiElement.appendChild(separator);
        }

        const span = document.createElement('span');
        span.className = 'so-ket-qua';
        // Áp dụng định dạng số ở đây
        span.textContent = formatNumber(so);
        soHienThiElement.appendChild(span);
    });
}


function thucHienQuaySo() {
    const soLuongQuay = currentMode;
    if (cacSoCoTheQuay.length < soLuongQuay) { alert("Không đủ số để quay."); return; }

    nutQuayElement.disabled = true;
    soHienThiElement.classList.add('spinning');
    let hieuUngQuay = setInterval(() => hienThiKetQua(cacSoCoTheQuay[Math.floor(Math.random() * cacSoCoTheQuay.length)]), 100);

    setTimeout(() => {
        clearInterval(hieuUngQuay);
        soHienThiElement.classList.remove('spinning');
        let chuoiTrungThuong = [];

        if (soLuongQuay === 1) {
            const chiSoNgauNhien = Math.floor(Math.random() * cacSoCoTheQuay.length);
            chuoiTrungThuong.push(cacSoCoTheQuay[chiSoNgauNhien]);
        } else {
            let diemBatDauHopLe = [];
            const findConsecutiveStarts = (numberList, length) => {
                const starts = [];
                const sortedList = [...numberList].sort((a,b) => a - b);
                if (sortedList.length < length) return starts;
                for (let i = 0; i <= sortedList.length - length; i++) {
                    const potentialStart = sortedList[i];
                    let isSequence = true;
                    for (let j = 1; j < length; j++) {
                        if (sortedList[i + j] !== potentialStart + j) { isSequence = false; break; }
                    }
                    if (isSequence) starts.push(potentialStart);
                }
                return starts;
            };
            const availableInRange1 = cacSoCoTheQuay.filter(so => so >= startNum && so <= endNum);
            diemBatDauHopLe.push(...findConsecutiveStarts(availableInRange1, soLuongQuay));
            if (isSecondRangeEnabled) {
                const availableInRange2 = cacSoCoTheQuay.filter(so => so >= startNum2 && so <= endNum2);
                diemBatDauHopLe.push(...findConsecutiveStarts(availableInRange2, soLuongQuay));
            }
            if (diemBatDauHopLe.length === 0) { 
                hienThiKetQua(`Không còn dãy ${soLuongQuay}`); nutQuayElement.disabled = false; return; 
            }
            const diemBatDauNgauNhien = diemBatDauHopLe[Math.floor(Math.random() * diemBatDauHopLe.length)];
            for (let i = 0; i < soLuongQuay; i++) chuoiTrungThuong.push(diemBatDauNgauNhien + i);
        }
        
        const colorClass = turnColorClasses[turnIndex % turnColorClasses.length];
        hienThiKetQua(chuoiTrungThuong);
        lichSuDaQuay.push({ numbers: chuoiTrungThuong, colorClass: colorClass });
        cacSoCoTheQuay = cacSoCoTheQuay.filter(so => !chuoiTrungThuong.includes(so));
        turnIndex++;
        saveState();
        updateHistoryCount();
        updateUndoButtonState();
        renderHistory();

        if (cacSoCoTheQuay.length === 0) {
           hienThiKetQua("Hết số!"); nutQuayElement.disabled = true;
        } else {
           nutQuayElement.disabled = false;
        }
    }, 1000);
}

// --- KHỞI TẠO VÀ GÁN SỰ KIỆN ---
modeButtons.forEach(button => {
    button.addEventListener('click', () => {
        modeButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        currentMode = parseInt(button.dataset.value, 10);
    });
});

nutQuayElement.addEventListener('click', thucHienQuaySo);
nutResetElement.addEventListener('click', resetState);
nutUndoElement.addEventListener('click', undoLastSpin);

setRangeBtn.addEventListener('click', () => {
    if (applyRange()) {
        closeModal();
    }
});

updateClock();
setInterval(updateClock, 1000);
loadState();

const toggleRange2Btn = document.getElementById('toggleRange2Btn');
function updateToggleButton() {
    if (enableRange2Checkbox.checked) {
        range2Container.style.display = 'flex';
        toggleRange2Btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/></svg> <span>Xóa khoảng</span>';
        toggleRange2Btn.title = 'Xóa khoảng số thứ 2';
    } else {
        range2Container.style.display = 'none';
        toggleRange2Btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg> <span>Thêm khoảng</span>';
        toggleRange2Btn.title = 'Thêm khoảng số thứ 2';
    }
}
toggleRange2Btn.addEventListener('click', () => {
    enableRange2Checkbox.checked = !enableRange2Checkbox.checked;
    updateToggleButton();
});
document.addEventListener('DOMContentLoaded', updateToggleButton);