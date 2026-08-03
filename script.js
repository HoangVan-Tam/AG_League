// ===== Config: số trận theo số đội =====
// Số trận: vòng tròn + chung kết (nhất vs nhì) + tranh hạng ba (ba vs tư)
// 4 đội: vòng tròn 1 lượt (6) + CK + hạng 3 = 8
// 5 đội: vòng tròn 1 lượt (10) + CK + hạng 3 = 12
// 6 đội: 2 bảng vòng tròn (6) + CK + hạng 3 = 8
// 8 đội: 2 bảng × 4 vòng tròn (12) + bán kết (2) + CK + hạng 3 = 16
const MATCHES = { 4: 8, 5: 12, 6: 8, 8: 16 };

// Format đầy đủ: 14.000.000 ₫
const fmt = (n) => {
  const sign = n < 0 ? '-' : '';
  return sign + Math.abs(Math.round(n)).toLocaleString('vi-VN') + ' ₫';
};

// Format cho input (chỉ số có dấu chấm): 14.000.000
const fmtInput = (n) => {
  if (n === '' || n == null || isNaN(n)) return '';
  return Math.abs(Math.round(+n)).toLocaleString('vi-VN');
};

// Parse chuỗi có dấu chấm về số: "14.000.000" -> 14000000
const parseInput = (s) => {
  if (s == null) return 0;
  const cleaned = String(s).replace(/\./g, '').replace(/[^\d-]/g, '');
  return cleaned === '' || cleaned === '-' ? 0 : +cleaned;
};

// Áp dụng format cho một input number
function attachMoneyInput(inp) {
  // Lưu giá trị số gốc
  const apply = () => { inp.value = fmtInput(inp.value); };
  const focus = () => { inp.value = parseInput(inp.value); };
  inp.addEventListener('blur', apply);
  inp.addEventListener('focus', focus);
  // Định dạng ban đầu
  apply();
}

// Danh sách giải thưởng và tỷ lệ phân bổ mặc định (% của quỹ thưởng)
const PRIZES = [
  { key: 'champ',  label: 'Vô địch',          note: '+ cúp + huy chương', ratio: 0.46 },
  { key: 'runner', label: 'Á quân',           note: '+ huy chương',       ratio: 0.33 },
  { key: 'third',  label: 'Hạng ba',          note: '+ huy chương',       ratio: 0.21 },
  { key: 'scorer', label: 'Vua phá lưới',     note: '',                   ratio: 0,    fixed: 200000 },
  { key: 'fair',   label: 'Đội Fair-play',    note: '',                   ratio: 0,    fixed: 200000 },
];

// Giá trị mặc định khi khởi tạo (sân 7)
const PRIZE_DEFAULT_7 = { champ: 1500000, runner: 700000, third: 300000, scorer: 200000, fair: 200000 };
const PRIZE_DEFAULT_5 = { champ: 2500000, runner: 1200000, third: 500000, scorer: 300000, fair: 300000 };

function renderPrizeInputs(prefix, defaults) {
  const container = document.getElementById('prizeInputs' + prefix);
  container.innerHTML = '';
  PRIZES.forEach((p) => {
    const div = document.createElement('div');
    div.className = 'prize-input';
    div.innerHTML = `
      <label>
        <span class="prize-input__name">${p.label}</span>
        ${p.note ? `<small>${p.note}</small>` : ''}
      </label>
      <input type="text" inputmode="numeric" id="prize_${prefix}_${p.key}" value="${fmtInput(defaults[p.key])}" data-prefix="${prefix}" data-key="${p.key}" />
    `;
    container.appendChild(div);
  });
  // Bind
  container.querySelectorAll('input').forEach((inp) => {
    inp.addEventListener('input', () => updatePrizeSum(inp.dataset.prefix));
  });
}

function getPrizeValues(prefix) {
  const vals = {};
  PRIZES.forEach((p) => {
    vals[p.key] = parseInput(document.getElementById(`prize_${prefix}_${p.key}`).value) || 0;
  });
  return vals;
}

function updatePrizeSum(prefix) {
  const vals = getPrizeValues(prefix);
  const sum = Object.values(vals).reduce((a, b) => a + b, 0);
  document.getElementById('prizeSum' + prefix).textContent = fmt(sum);
  // Quỹ thưởng lấy từ kết quả tính toán (lưu vào data attribute)
  const fund = +(document.getElementById('prizeFund' + prefix).dataset.value || 0);
  document.getElementById('prizeFund' + prefix).textContent = fmt(fund);
  const diffEl = document.getElementById('prizeDiff' + prefix);
  const diff = fund - sum;
  if (sum === 0) {
    diffEl.textContent = '';
  } else if (diff < 0) {
    diffEl.textContent = `⚠ Vượt quỹ ${fmt(-diff)}`;
    diffEl.style.color = '#dc2626';
  } else if (diff > 0) {
    diffEl.textContent = `Dư ${fmt(diff)}`;
    diffEl.style.color = '#16a34a';
  } else {
    diffEl.textContent = '✓ Khớp quỹ';
    diffEl.style.color = '#16a34a';
  }
}

// Buffer giữ lại khi tự phân bổ (0 = chia hết quỹ, không dư)
const PRIZE_BUFFER = 0;
// Bước làm tròn giải thưởng (500k): 2.9tr -> 3tr, 1.2tr -> 1tr
const PRIZE_STEP = 500000;

function autoAllocate(prefix, prize) {
  // Phần thực tế để chia = quỹ - buffer
  const distributable = Math.max(prize - PRIZE_BUFFER, 0);
  const vals = {};

  // Giải phụ cố định: vua phá lưới + fair-play = 200k
  let fixedTotal = 0;
  PRIZES.forEach((p) => {
    if (p.fixed) { vals[p.key] = p.fixed; fixedTotal += p.fixed; }
  });

  // Phần cho 3 giải chính (vô địch/á/hạng ba)
  const mainPool = Math.max(distributable - fixedTotal, 0);
  const mainPrizes = PRIZES.filter((p) => !p.fixed);
  const ratioSum = mainPrizes.reduce((s, p) => s + p.ratio, 0);
  let mainAllocated = 0;

  mainPrizes.forEach((p, i) => {
    if (i === 0) return; // vô địch nhận dư sau
    const v = Math.round((mainPool * (p.ratio / ratioSum)) / PRIZE_STEP) * PRIZE_STEP;
    vals[p.key] = v;
    mainAllocated += v;
  });
  vals[mainPrizes[0].key] = Math.max(mainPool - mainAllocated, 0);

  PRIZES.forEach((p) => {
    const inp = document.getElementById(`prize_${prefix}_${p.key}`);
    if (inp) inp.value = fmtInput(vals[p.key]);
  });
  updatePrizeSum(prefix);
}

// Chi phí cố định (không kể sân & trọng tài) theo số đội & loại sân
function fixedCosts(teams, pitchType) {
  const p5 = pitchType === 5;
  if (teams === 4) {
    return {
      spare: p5 ? 400000  : 500000,
    };
  }
  if (teams === 5) {
    return {
      spare: p5 ? 450000  : 550000,
    };
  }
  // 6 đội
  if (teams === 6) {
    return {
      spare: p5 ? 500000  : 600000,
    };
  }
  // 8 đội
  return {
    spare: p5 ? 700000  : 900000,
  };
}

function computePanel(prefix, pitchType) {
  const teams = parseInt(document.getElementById('teams' + prefix).value, 10);
  const fee = parseInput(document.getElementById('fee' + prefix).value) || 0;
  const sponsor = parseInput(document.getElementById('sponsor' + prefix).value) || 0;
  const pitchPrice = parseInput(document.getElementById('pitch' + prefix).value) || 0;
  const refPrice = parseInput(document.getElementById('ref' + prefix).value) || 0;
  const trophyPrice = parseInput(document.getElementById('trophy' + prefix).value) || 0;

  const matches = MATCHES[teams] || 10;
  const fc = fixedCosts(teams, pitchType);

  // Dòng chi phí: (label, số lượng, đơn giá, thành tiền)
  const rows = [
    ['Thuê sân', `${matches} trận`, pitchPrice, pitchPrice * matches],
    ['Trọng tài', `${matches} trận`, refPrice, refPrice * matches],
    ['Lưu niệm (banner, cúp, cờ, huy chương)', '1 bộ', trophyPrice, trophyPrice],
    ['Dự phòng phát sinh', '', '', fc.spare],
  ];

  const totalCost = rows.reduce((s, r) => s + r[3], 0);
  const fund = teams * fee + sponsor;
  const prize = fund - totalCost;

  // Render results
  document.getElementById('rFund' + prefix).textContent = fmt(fund);
  document.getElementById('rCost' + prefix).textContent = fmt(totalCost);
  const rPrize = document.getElementById('rPrize' + prefix);
  rPrize.textContent = fmt(prize);
  rPrize.title = fmt(prize);
  rPrize.style.color = prize < 0 ? '#fca5a5' : '#f5b400';

  // Warning
  const warn = document.getElementById('warn' + prefix);
  if (prize < 0) {
    warn.hidden = false;
    warn.textContent = '⚠ Quỹ âm! Giá sân quá cao — giảm số trận, thuê block, hoặc tìm thêm tài trợ.';
  } else {
    warn.hidden = true;
  }

  // Render budget table
  const body = document.getElementById('body' + prefix);
  body.innerHTML = '';
  rows.forEach((r) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${r[0]}</td><td>${r[1]}</td><td>${r[2] !== '' ? fmt(r[2]) : '—'}</td><td>${fmt(r[3])}</td>`;
    body.appendChild(tr);
  });
  document.getElementById('tCost' + prefix).textContent = fmt(totalCost);
  document.getElementById('tPrize' + prefix).textContent = fmt(prize);

  // Lưu quỹ thưởng cho phần giải thưởng và cập nhật
  const pf = document.getElementById('prizeFund' + prefix);
  const prevPrize = +(pf.dataset.value || 0);
  pf.dataset.value = prize;
  // Nếu quỹ thưởng thay đổi do đổi chi phí/số đội → tự phân bổ lại (không cần bấm nút)
  if (prevPrize !== prize) {
    autoAllocate(prefix, Math.max(prize, 0));
  } else {
    updatePrizeSum(prefix);
  }
}

// Workaround: panel prefix không cho biết pitchType trực tiếp, dùng lookup
function compute7() { computePanel('7', 7); }
function compute5() { computePanel('5', 5); }

// Bind events
['teams7', 'fee7', 'sponsor7', 'pitch7', 'ref7', 'trophy7'].forEach((id) => {
  document.getElementById(id).addEventListener('input', compute7);
  document.getElementById(id).addEventListener('change', compute7);
});
['teams5', 'fee5', 'sponsor5', 'pitch5', 'ref5', 'trophy5'].forEach((id) => {
  document.getElementById(id).addEventListener('input', compute5);
  document.getElementById(id).addEventListener('change', compute5);
});

// Tabs
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('tab--active'));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('tab-panel--active'));
    btn.classList.add('tab--active');
    document.getElementById(btn.dataset.tab).classList.add('tab-panel--active');
  });
});

// Auto-allocate buttons
document.querySelectorAll('.auto-btn').forEach((btn) => {
  btn.addEventListener('click', () => {
    const prefix = btn.dataset.auto;
    const fund = +(document.getElementById('prizeFund' + prefix).dataset.value || 0);
    autoAllocate(prefix, Math.max(fund, 0));
  });
});

// Init prize inputs
renderPrizeInputs('7', PRIZE_DEFAULT_7);
renderPrizeInputs('5', PRIZE_DEFAULT_5);

// Áp dụng format tiền tệ cho tất cả input tiền (sau khi đã render)
['fee7', 'sponsor7', 'pitch7', 'ref7', 'trophy7', 'fee5', 'sponsor5', 'pitch5', 'ref5', 'trophy5'].forEach((id) => {
  const el = document.getElementById(id);
  if (el) attachMoneyInput(el);
});
document.querySelectorAll('.prize-inputs input').forEach((inp) => attachMoneyInput(inp));

compute7();
compute5();