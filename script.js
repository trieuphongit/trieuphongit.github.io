// Lấy các phần tử HTML
const soHienThiElement = document.getElementById('soHienThi');
const nutQuayElement = document.getElementById('nutQuay');
const danhSachDaQuayElement = document.getElementById('danhSachDaQuay');
const modeButtons = document.querySelectorAll('.mode-button');
const nutResetElement = document.getElementById('nutReset');
const historyCountElement = document.getElementById('historyCount');
const clockElement = document.getElementById('clock');
const nutUndoElement = document.getElementById('nutUndo');

// Khai báo biến trạng thái
let currentMode = 1, cacSoCoTheQuay = [], lichSuDaQuay = [], turnIndex = 0;
const turnColorClasses = ['spin-turn-0', 'spin-turn-1', 'spin-turn-2', 'spin-turn-3', 'spin-turn-4', 'spin-turn-5'];
const STORAGE_KEY = 'modernRandomSpinnerState';

// --- CÁC HÀM TIỆN ÍCH MỚI ---
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${h}:${m}:${s}`;
}

function updateHistoryCount() {
    const spunCount = 101 - cacSoCoTheQuay.length;
    historyCountElement.textContent = `(${spunCount}/100)`;
}

function updateUndoButtonState() {
    nutUndoElement.disabled = lichSuDaQuay.length === 0;
}

// --- CÁC HÀM LƯU/TẢI/RESET ---
function saveState() {
    const state = { cacSoCoTheQuay, lichSuDaQuay, turnIndex };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    const savedStateJSON = localStorage.getItem(STORAGE_KEY);
    if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        cacSoCoTheQuay = savedState.cacSoCoTheQuay;
        lichSuDaQuay = savedState.lichSuDaQuay;
        turnIndex = savedState.turnIndex;
        renderHistory();
        if (cacSoCoTheQuay.length === 0) {
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
     if (confirm('Bạn có chắc chắn muốn làm mới và xóa toàn bộ lịch sử không?')) {
        localStorage.removeItem(STORAGE_KEY);
        location.reload();
    }
}

function undoLastSpin() {
    if (lichSuDaQuay.length === 0) return;

    const lastSpin = lichSuDaQuay.pop();
    const numbersToRestore = lastSpin.numbers;

    cacSoCoTheQuay.push(...numbersToRestore);
    
    turnIndex--;
    
    renderHistory();
    hienThiKetQua('--');
    nutQuayElement.disabled = false;
    updateHistoryCount();
    updateUndoButtonState();
    saveState();
}

// --- CÁC HÀM TIỆN ÍCH KHÁC ---
function initializeState() {
    cacSoCoTheQuay = Array.from({ length: 101 }, (_, i) => i);
    lichSuDaQuay = [];
    turnIndex = 0;
}

function renderHistory() {
    danhSachDaQuayElement.innerHTML = '';
    lichSuDaQuay.forEach(turn => {
        turn.numbers.sort((a, b) => a - b).forEach(so => {
            const phanTuMoi = document.createElement('li');
            phanTuMoi.textContent = so;
            phanTuMoi.classList.add(turn.colorClass);
            danhSachDaQuayElement.appendChild(phanTuMoi);
        });
    });
}

function hienThiKetQua(ketQua) {
    soHienThiElement.innerHTML = '';
    const displayArray = Array.isArray(ketQua) ? ketQua : [ketQua];
    displayArray.forEach(so => {
        const span = document.createElement('span');
        span.className = 'so-ket-qua';
        span.textContent = so;
        soHienThiElement.appendChild(span);
    });
}

function capNhatDanhSachDaQuayUI(cacSoMoi, turnClass) {
    cacSoMoi.sort((a, b) => a - b).forEach(so => {
         const phanTuMoi = document.createElement('li');
         phanTuMoi.textContent = so;
         if (turnClass) phanTuMoi.classList.add(turnClass);
         danhSachDaQuayElement.appendChild(phanTuMoi);
    });
}

// --- HÀM QUAY SỐ CHÍNH ---
function thucHienQuaySo() {
    const soLuongQuay = currentMode;
    if (cacSoCoTheQuay.length < soLuongQuay) { return; }

    nutQuayElement.disabled = true;
    soHienThiElement.classList.add('spinning');

    let hieuUngQuay = setInterval(() => {
        const soNgauNhienTamThoi = cacSoCoTheQuay[Math.floor(Math.random() * cacSoCoTheQuay.length)];
        hienThiKetQua(soNgauNhienTamThoi);
    }, 100);

    setTimeout(() => {
        clearInterval(hieuUngQuay);
        soHienThiElement.classList.remove('spinning');
        let chuoiTrungThuong = [];

        if (soLuongQuay === 1) {
            const chiSoNgauNhien = Math.floor(Math.random() * cacSoCoTheQuay.length);
            chuoiTrungThuong.push(cacSoCoTheQuay[chiSoNgauNhien]);
        } else {
            const diemBatDauHopLe = cacSoCoTheQuay.filter(startNum => {
                if (startNum > 101 - soLuongQuay) return false;
                for (let j = 1; j < soLuongQuay; j++) {
                    if (!cacSoCoTheQuay.includes(startNum + j)) return false;
                }
                return true;
            });

            if (diemBatDauHopLe.length === 0) { 
                hienThiKetQua(`Out of ${soLuongQuay} number!`); 
                nutQuayElement.disabled = false; return; 
            }
            const diemBatDauNgauNhien = diemBatDauHopLe[Math.floor(Math.random() * diemBatDauHopLe.length)];
            for (let i = 0; i < soLuongQuay; i++) chuoiTrungThuong.push(diemBatDauNgauNhien + i);
        }
        
        const colorClass = turnColorClasses[turnIndex % turnColorClasses.length];
        hienThiKetQua(chuoiTrungThuong);
        capNhatDanhSachDaQuayUI(chuoiTrungThuong, colorClass);
        
        lichSuDaQuay.push({ numbers: chuoiTrungThuong, colorClass: colorClass });
        cacSoCoTheQuay = cacSoCoTheQuay.filter(so => !chuoiTrungThuong.includes(so));
        turnIndex++;
        saveState();
        updateHistoryCount();
        updateUndoButtonState();

        if (cacSoCoTheQuay.length === 0) {
           hienThiKetQua("Out of number!");
           nutQuayElement.disabled = true;
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

// Khởi chạy đồng hồ và tải trạng thái
updateClock();
setInterval(updateClock, 1000);
loadState();