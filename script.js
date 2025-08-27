// Lấy các phần tử HTML
const soHienThiElement = document.getElementById('soHienThi');
const nutQuayElement = document.getElementById('nutQuay');
const danhSachDaQuayElement = document.getElementById('danhSachDaQuay');
const modeButtons = document.querySelectorAll('.mode-button');
const nutResetElement = document.getElementById('nutReset');
const historyCountElement = document.getElementById('historyCount');
const clockElement = document.getElementById('clock');
const nutUndoElement = document.getElementById('nutUndo');

// **MỚI**: Lấy các phần tử cài đặt khoảng số
const startNumInput = document.getElementById('startNumInput');
const endNumInput = document.getElementById('endNumInput');
const setRangeBtn = document.getElementById('setRangeBtn');


// Khai báo biến trạng thái
let currentMode = 1, cacSoCoTheQuay = [], lichSuDaQuay = [], turnIndex = 0;
let startNum = 0, endNum = 100; // **MỚI**: Biến cho khoảng số
const turnColorClasses = ['spin-turn-0', 'spin-turn-1', 'spin-turn-2', 'spin-turn-3', 'spin-turn-4', 'spin-turn-5'];
const STORAGE_KEY = 'modernRandomSpinnerState';

// --- CÁC HÀM TIỆN ÍCH ---
function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    clockElement.textContent = `${h}:${m}:${s}`;
}

// **CẬP NHẬT**: Hàm này giờ sẽ dựa vào startNum và endNum
function updateHistoryCount() {
    const totalNumbers = (endNum - startNum) + 1;
    const spunCount = totalNumbers - cacSoCoTheQuay.length;
    historyCountElement.textContent = `(${spunCount}/${totalNumbers})`;
}

function updateUndoButtonState() {
    nutUndoElement.disabled = lichSuDaQuay.length === 0;
}

// --- CÁC HÀM LƯU/TẢI/RESET ---
// **CẬP NHẬT**: Lưu cả khoảng số
function saveState() {
    const state = { cacSoCoTheQuay, lichSuDaQuay, turnIndex, startNum, endNum };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// **CẬP NHẬT**: Tải cả khoảng số và cập nhật ô input
function loadState() {
    const savedStateJSON = localStorage.getItem(STORAGE_KEY);
    if (savedStateJSON) {
        const savedState = JSON.parse(savedStateJSON);
        // Tải khoảng số trước, nếu không có thì dùng mặc định
        startNum = savedState.startNum !== undefined ? savedState.startNum : 0;
        endNum = savedState.endNum !== undefined ? savedState.endNum : 100;

        cacSoCoTheQuay = savedState.cacSoCoTheQuay;
        lichSuDaQuay = savedState.lichSuDaQuay;
        turnIndex = savedState.turnIndex;
        
        // Nếu không có mảng số nào được lưu, khởi tạo lại từ khoảng số
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
    // Cập nhật giá trị cho ô input
    startNumInput.value = startNum;
    endNumInput.value = endNum;

    updateHistoryCount();
    updateUndoButtonState();
}

function resetState() {
     if (confirm('Bạn có chắc chắn muốn làm mới và xóa toàn bộ lịch sử không? Thao tác này sẽ giữ lại khoảng số bạn đã chọn.')) {
        initializeState(); // Khởi tạo lại trạng thái thay vì reload
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

// **MỚI**: Hàm áp dụng khoảng số
function applyRange() {
    const newStart = parseInt(startNumInput.value, 10);
    const newEnd = parseInt(endNumInput.value, 10);

    // Xác thực đầu vào
    if (isNaN(newStart) || isNaN(newEnd)) {
        alert("Vui lòng nhập số hợp lệ.");
        return;
    }
    if (newStart >= newEnd) {
        alert("Số bắt đầu phải nhỏ hơn số kết thúc.");
        return;
    }
    if ((newEnd - newStart) > 2000) { // Giới hạn để tránh treo trình duyệt
        alert("Khoảng số quá lớn (tối đa 2000 số).");
        return;
    }

    if (confirm('Thay đổi khoảng số sẽ làm mới vòng quay và xóa lịch sử. Bạn có chắc chắn?')) {
        startNum = newStart;
        endNum = newEnd;
        initializeState(); // Reset mọi thứ với khoảng số mới
        renderHistory();
        updateHistoryCount();
        updateUndoButtonState();
        hienThiKetQua("--");
        nutQuayElement.disabled = false;
        saveState();
        alert(`Đã áp dụng khoảng số mới từ ${startNum} đến ${endNum}.`);
    }
}


// --- CÁC HÀM TIỆN ÍCH KHÁC ---
// **MỚI**: Tách phần tạo mảng số ra hàm riêng
function initializeNumbers() {
    cacSoCoTheQuay = Array.from({ length: (endNum - startNum) + 1 }, (_, i) => startNum + i);
}

// **CẬP NHẬT**: initializeState giờ sẽ reset mọi thứ
function initializeState() {
    initializeNumbers();
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

    displayArray.forEach((so, index) => {
        const span = document.createElement('span');
        span.className = 'so-ket-qua';
        // Thêm số 0 trước nếu < 10
        span.textContent = so < 10 ? `0${so}` : so;
        soHienThiElement.appendChild(span);

        // Thêm dấu phẩy nếu không phải là phần tử cuối
        if (index < displayArray.length - 1) {
            const comma = document.createTextNode(', ');
            soHienThiElement.appendChild(comma);
        }
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
// **CẬP NHẬT**: Sửa lại logic kiểm tra chuỗi liên tiếp
function thucHienQuaySo() {
    const soLuongQuay = currentMode;
    if (cacSoCoTheQuay.length < soLuongQuay) {
        alert("Không đủ số để quay.");
        return;
    }

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
            const diemBatDauHopLe = cacSoCoTheQuay.filter(start => {
                // Điều kiện mới: điểm bắt đầu không được quá gần cuối mảng
                if (start > endNum - soLuongQuay + 1) return false;
                for (let j = 1; j < soLuongQuay; j++) {
                    if (!cacSoCoTheQuay.includes(start + j)) return false;
                }
                return true;
            });

            if (diemBatDauHopLe.length === 0) { 
                hienThiKetQua(`Hết chuỗi ${soLuongQuay} số!`); 
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
           hienThiKetQua("Hết số!");
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
setRangeBtn.addEventListener('click', applyRange); // **MỚI**

// Khởi chạy đồng hồ và tải trạng thái
updateClock();
setInterval(updateClock, 1000);
loadState();