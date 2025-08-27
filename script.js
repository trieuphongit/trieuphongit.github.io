// Lấy các phần tử HTML
var soHienThiElement = document.getElementById('soHienThi');
var nutQuayElement = document.getElementById('nutQuay');
var danhSachDaQuayElement = document.getElementById('danhSachDaQuay');
var modeButtons = document.querySelectorAll('.mode-button');
var nutResetElement = document.getElementById('nutReset');
var historyCountElement = document.getElementById('historyCount');
var clockElement = document.getElementById('clock');
var nutUndoElement = document.getElementById('nutUndo');

// Các phần tử cài đặt
var startNumInput = document.getElementById('startNumInput');
var endNumInput = document.getElementById('endNumInput');
var setRangeBtn = document.getElementById('setRangeBtn');
var enableRange2Checkbox = document.getElementById('enableRange2Checkbox');
var range2Container = document.getElementById('range2Container');
var startNumInput2 = document.getElementById('startNumInput2');
var endNumInput2 = document.getElementById('endNumInput2');
var toggleRange2Btn = document.getElementById('toggleRange2Btn');

// Khai báo biến trạng thái
var currentMode = 1, cacSoCoTheQuay = [], lichSuDaQuay = [], turnIndex = 0;
var startNum = 0, endNum = 100;
var startNum2 = 101, endNum2 = 200;
var isSecondRangeEnabled = false;

var turnColorClasses = ['spin-turn-0', 'spin-turn-1', 'spin-turn-2', 'spin-turn-3', 'spin-turn-4', 'spin-turn-5'];
var STORAGE_KEY = 'modernRandomSpinnerState_v4';

// --- CÁC HÀM TIỆN ÍCH ---

/**
 * Định dạng một số bằng cách thêm số 0 vào trước nếu nó nhỏ hơn 10.
 * Đây là hàm thay thế cho String.prototype.padStart()
 * @param {number | string} num - Số hoặc chuỗi cần định dạng.
 * @returns {string} Chuỗi đã được định dạng.
 */
function formatNumber(num) {
    if (typeof num !== 'number' || isNaN(num)) {
        return num;
    }
    return num < 10 ? '0' + num : String(num);
}

function updateClock() {
    var now = new Date();
    var h = formatNumber(now.getHours());
    var m = formatNumber(now.getMinutes());
    var s = formatNumber(now.getSeconds());
    clockElement.textContent = h + ':' + m + ':' + s;
}

function updateHistoryCount() {
    var totalNumbers = (endNum - startNum) + 1;
    if (isSecondRangeEnabled) {
        totalNumbers += (endNum2 - startNum2) + 1;
    }
    var spunCount = totalNumbers - cacSoCoTheQuay.length;
    historyCountElement.textContent = '(' + spunCount + '/' + totalNumbers + ')';
}

function updateUndoButtonState() {
    nutUndoElement.disabled = lichSuDaQuay.length === 0;
}

// --- CÁC HÀM LƯU/TẢI/RESET ---
function saveState() {
    var state = { 
        cacSoCoTheQuay: cacSoCoTheQuay, 
        lichSuDaQuay: lichSuDaQuay, 
        turnIndex: turnIndex, 
        startNum: startNum, 
        endNum: endNum, 
        startNum2: startNum2, 
        endNum2: endNum2, 
        isSecondRangeEnabled: isSecondRangeEnabled
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState() {
    var savedStateJSON = localStorage.getItem(STORAGE_KEY);
    if (savedStateJSON) {
        var savedState = JSON.parse(savedStateJSON);
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

    startNumInput.value = startNum;
    endNumInput.value = endNum;
    startNumInput2.value = startNum2;
    endNumInput2.value = endNum2;
    enableRange2Checkbox.checked = isSecondRangeEnabled;
    updateToggleButton();

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
    var lastSpin = lichSuDaQuay.pop();
    // Thay thế cho spread syntax (...)
    cacSoCoTheQuay = cacSoCoTheQuay.concat(lastSpin.numbers);
    turnIndex--;
    renderHistory();
    hienThiKetQua('--');
    nutQuayElement.disabled = false;
    updateHistoryCount();
    updateUndoButtonState();
    saveState();
}

function applyRange() {
    var newStart = parseInt(startNumInput.value, 10);
    var newEnd = parseInt(endNumInput.value, 10);
    var useRange2 = enableRange2Checkbox.checked;
    var newStart2 = parseInt(startNumInput2.value, 10);
    var newEnd2 = parseInt(endNumInput2.value, 10);

    if (isNaN(newStart) || isNaN(newEnd)) { alert("Vui lòng nhập số hợp lệ cho khoảng 1."); return; }
    if (newStart >= newEnd) { alert("Khoảng 1: Số bắt đầu phải nhỏ hơn số kết thúc."); return; }
    if (useRange2) {
        if (isNaN(newStart2) || isNaN(newEnd2)) { alert("Vui lòng nhập số hợp lệ cho khoảng 2."); return; }
        if (newStart2 >= newEnd2) { alert("Khoảng 2: Số bắt đầu phải nhỏ hơn số kết thúc."); return; }
        if (Math.max(newStart, newStart2) <= Math.min(newEnd, newEnd2)) { alert("Hai khoảng số không được chồng chéo lên nhau."); return; }
    }
    var totalSize = (newEnd - newStart) + 1;
    if (useRange2) totalSize += (newEnd2 - newStart2) + 1;
    if (totalSize > 5000) { alert("Tổng số lượng trong các khoảng quá lớn (tối đa 5000 số)."); return; }

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
        alert('Đã áp dụng cài đặt khoảng số mới.');
    }
}

function initializeNumbers() {
    // Thay thế cho Array.from
    var range1 = [];
    for (var i = startNum; i <= endNum; i++) {
        range1.push(i);
    }
    
    if (isSecondRangeEnabled) {
        var range2 = [];
        for (var j = startNum2; j <= endNum2; j++) {
            range2.push(j);
        }
        // Thay thế cho spread syntax (...)
        cacSoCoTheQuay = range1.concat(range2);
    } else {
        cacSoCoTheQuay = range1;
    }
}

function initializeState() {
    initializeNumbers();
    lichSuDaQuay = [];
    turnIndex = 0;
}

function renderHistory() {
    danhSachDaQuayElement.innerHTML = '';
    lichSuDaQuay.forEach(function(turn) {
        turn.numbers.sort(function(a, b) { return a - b; }).forEach(function(so) {
            var phanTuMoi = document.createElement('li');
            phanTuMoi.textContent = formatNumber(so);
            phanTuMoi.classList.add(turn.colorClass);
            danhSachDaQuayElement.appendChild(phanTuMoi);
        });
    });
}

function hienThiKetQua(ketQua) {
    soHienThiElement.innerHTML = '';
    var displayArray = Array.isArray(ketQua) ? ketQua : [ketQua];
    
    displayArray.forEach(function(so, index) {
        if (index > 0) {
            var separator = document.createElement('span');
            separator.className = 'so-separator';
            separator.textContent = ',';
            soHienThiElement.appendChild(separator);
        }

        var span = document.createElement('span');
        span.className = 'so-ket-qua';
        span.textContent = formatNumber(so);
        soHienThiElement.appendChild(span);
    });
}

function thucHienQuaySo() {
    var soLuongQuay = currentMode;
    if (cacSoCoTheQuay.length < soLuongQuay) { alert("Không đủ số để quay."); return; }

    nutQuayElement.disabled = true;
    soHienThiElement.classList.add('spinning');
    var hieuUngQuay = setInterval(function() {
        hienThiKetQua(cacSoCoTheQuay[Math.floor(Math.random() * cacSoCoTheQuay.length)])
    }, 100);

    setTimeout(function() {
        clearInterval(hieuUngQuay);
        soHienThiElement.classList.remove('spinning');
        var chuoiTrungThuong = [];

        if (soLuongQuay === 1) {
            var chiSoNgauNhien = Math.floor(Math.random() * cacSoCoTheQuay.length);
            chuoiTrungThuong.push(cacSoCoTheQuay[chiSoNgauNhien]);
        } else {
            var diemBatDauHopLe = [];
            var findConsecutiveStarts = function(numberList, length) {
                var starts = [];
                // Thay thế spread syntax (...)
                var sortedList = numberList.slice().sort(function(a,b) { return a - b; });
                if (sortedList.length < length) return starts;
                for (var i = 0; i <= sortedList.length - length; i++) {
                    var potentialStart = sortedList[i];
                    var isSequence = true;
                    for (var j = 1; j < length; j++) {
                        if (sortedList[i + j] !== potentialStart + j) { isSequence = false; break; }
                    }
                    if (isSequence) starts.push(potentialStart);
                }
                return starts;
            };

            var availableInRange1 = cacSoCoTheQuay.filter(function(so) { return so >= startNum && so <= endNum; });
            diemBatDauHopLe = diemBatDauHopLe.concat(findConsecutiveStarts(availableInRange1, soLuongQuay));
            if (isSecondRangeEnabled) {
                var availableInRange2 = cacSoCoTheQuay.filter(function(so) { return so >= startNum2 && so <= endNum2; });
                diemBatDauHopLe = diemBatDauHopLe.concat(findConsecutiveStarts(availableInRange2, soLuongQuay));
            }
            if (diemBatDauHopLe.length === 0) { 
                hienThiKetQua("Không còn dãy " + soLuongQuay); nutQuayElement.disabled = false; return; 
            }
            var diemBatDauNgauNhien = diemBatDauHopLe[Math.floor(Math.random() * diemBatDauHopLe.length)];
            for (var i = 0; i < soLuongQuay; i++) chuoiTrungThuong.push(diemBatDauNgauNhien + i);
        }
        
        var colorClass = turnColorClasses[turnIndex % turnColorClasses.length];
        hienThiKetQua(chuoiTrungThuong);
        lichSuDaQuay.push({ numbers: chuoiTrungThuong, colorClass: colorClass });
        // Thay thế cho .includes
        cacSoCoTheQuay = cacSoCoTheQuay.filter(function(so) { return chuoiTrungThuong.indexOf(so) === -1; });
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

// --- KHỞI TẠO VÀ GÁN SỰ KIỆN ---
modeButtons.forEach(function(button) {
    button.addEventListener('click', function() {
        modeButtons.forEach(function(btn) { btn.classList.remove('active'); });
        button.classList.add('active');
        currentMode = parseInt(button.dataset.value, 10);
    });
});

nutQuayElement.addEventListener('click', thucHienQuaySo);
nutResetElement.addEventListener('click', resetState);
nutUndoElement.addEventListener('click', undoLastSpin);
setRangeBtn.addEventListener('click', applyRange);
toggleRange2Btn.addEventListener('click', function() {
    enableRange2Checkbox.checked = !enableRange2Checkbox.checked;
    updateToggleButton();
});

// --- Tải trạng thái và khởi chạy ---
updateClock();
setInterval(updateClock, 1000);
loadState();
document.addEventListener('DOMContentLoaded', updateToggleButton);