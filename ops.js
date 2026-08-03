// ===== State =====
let state = {
  teams: 4,
  names: ['Đội A', 'Đội B', 'Đội C', 'Đội D'],
  date: '',
  venue: '',
  matches: [], // {id, stage, home, away, round, homeScore, awayScore, scorers}
};

const fmtTeam = (i) => `Đội ${String.fromCharCode(65 + i)}`;

// ===== Round-robin (circle method) =====
function roundRobin(indices) {
  // returns array of {home, away} (single round, indices into team list)
  const arr = indices.slice();
  const n = arr.length;
  if (n % 2 !== 0) { arr.push(null); } // bye = null
  const rounds = [];
  const total = arr.length;
  const half = total / 2;
  const list = arr.slice();
  for (let r = 0; r < total - 1; r++) {
    for (let i = 0; i < half; i++) {
      const home = list[i];
      const away = list[total - 1 - i];
      if (home !== null && away !== null) {
        // alternate home/away for fairness
        if (r % 2 === 0) rounds.push({ home, away });
        else rounds.push({ home: away, away: home });
      }
    }
    // rotate (keep first fixed)
    const fixed = list[0];
    const rest = list.slice(1);
    rest.unshift(rest.pop());
    list.splice(0, list.length, fixed, ...rest);
  }
  return rounds;
}

// ===== Build matches =====
function buildMatches() {
  const n = state.teams;
  const matches = [];

  if (n === 8) {
    // 2 bảng Serie A (0-3) & Serie B (4-7), mỗi bảng vòng tròn 1 lượt
    const groupA = [0, 1, 2, 3];
    const groupB = [4, 5, 6, 7];
    const buildGroup = (indices, gname) => {
      const rr = roundRobin(indices);
      rr.forEach((m, i) => {
        matches.push({
          id: gname + i, stage: gname + ' — Vòng tròn', group: gname, round: i + 1,
          home: m.home, away: m.away,
          homeScore: '', awayScore: '', scorers: '',
        });
      });
    };
    buildGroup(groupA, 'Bảng A');
    buildGroup(groupB, 'Bảng B');
    // Serie A (top 2 mỗi bảng): bán kết + CK + hạng 3
    matches.push({ id: 'ASF1', stage: 'Serie A — Bán kết', group: 'SerieA', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '', label: 'Nhất Bảng A vs Nhì Bảng B' });
    matches.push({ id: 'ASF2', stage: 'Serie A — Bán kết', group: 'SerieA', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '', label: 'Nhất Bảng B vs Nhì Bảng A' });
    matches.push({ id: 'AF3', stage: 'Serie A — Tranh hạng 3', group: 'SerieA', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '' });
    matches.push({ id: 'ACK', stage: 'Serie A — Chung kết', group: 'SerieA', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '' });
    // Serie B (hạng 3-4 mỗi bảng): bán kết + CK + hạng 3
    matches.push({ id: 'BSF1', stage: 'Serie B — Bán kết', group: 'SerieB', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '', label: 'Hạng 3 Bảng A vs Hạng 4 Bảng B' });
    matches.push({ id: 'BSF2', stage: 'Serie B — Bán kết', group: 'SerieB', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '', label: 'Hạng 3 Bảng B vs Hạng 4 Bảng A' });
    matches.push({ id: 'BF3', stage: 'Serie B — Tranh hạng 3', group: 'SerieB', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '' });
    matches.push({ id: 'BCK', stage: 'Serie B — Chung kết', group: 'SerieB', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '' });
    return matches;
  }

  // Mặc định: 1 bảng vòng tròn + CK + hạng 3
  const idx = Array.from({ length: n }, (_, i) => i);
  const rr = roundRobin(idx);
  rr.forEach((m, i) => {
    matches.push({
      id: 'RR' + i, stage: 'Vòng tròn', round: i + 1,
      home: m.home, away: m.away,
      homeScore: '', awayScore: '', scorers: '',
    });
  });
  matches.push({ id: 'F3', stage: 'Tranh hạng 3', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '' });
  matches.push({ id: 'CK', stage: 'Chung kết', round: '', home: null, away: null, homeScore: '', awayScore: '', scorers: '' });
  return matches;
}

// ===== Render team name inputs =====
function renderTeamNames() {
  const wrap = document.getElementById('teamNames');
  wrap.innerHTML = '';
  for (let i = 0; i < state.teams; i++) {
    const lbl = document.createElement('label');
    lbl.innerHTML = `Đội ${i + 1}<input type="text" data-idx="${i}" value="${state.names[i] || fmtTeam(i)}" />`;
    const inp = lbl.querySelector('input');
    inp.addEventListener('input', () => {
      state.names[i] = inp.value;
      renderSchedule();
      renderResults();
      renderScorers();
    });
    wrap.appendChild(lbl);
  }
}

// ===== Render schedule =====
function resolveKnockout() {
  const is8 = state.teams === 8;

  if (is8) {
    const { a, b } = computeStandings(); // 2 bảng A/B
    const winKO = (matchId) => {
      const m = state.matches.find((x) => x.id === matchId);
      if (!m || m.homeScore === '' || m.awayScore === '' || m.home == null) return null;
      return m.homeScore > m.awayScore ? m.home : m.away;
    };
    const loseKO = (matchId) => {
      const m = state.matches.find((x) => x.id === matchId);
      if (!m || m.homeScore === '' || m.awayScore === '' || m.home == null) return null;
      return m.homeScore > m.awayScore ? m.away : m.home;
    };
    const setIfOpen = (match, home, away) => {
      if (match && match.homeScore === '' && match.awayScore === '') {
        if (home != null) match.home = home;
        if (away != null) match.away = away;
      }
    };

    // Serie A: top 2 mỗi bảng
    const asf1 = state.matches.find((m) => m.id === 'ASF1');
    const asf2 = state.matches.find((m) => m.id === 'ASF2');
    if (a && b && a.length >= 2 && b.length >= 2) {
      setIfOpen(asf1, a[0].idx, b[1].idx); // 1A vs 2B
      setIfOpen(asf2, b[0].idx, a[1].idx); // 1B vs 2A
    }
    const aw1 = winKO('ASF1'), aw2 = winKO('ASF2'), al1 = loseKO('ASF1'), al2 = loseKO('ASF2');
    setIfOpen(state.matches.find((m) => m.id === 'ACK'), aw1, aw2);
    setIfOpen(state.matches.find((m) => m.id === 'AF3'), al1, al2);

    // Serie B: hạng 3-4 mỗi bảng
    const bsf1 = state.matches.find((m) => m.id === 'BSF1');
    const bsf2 = state.matches.find((m) => m.id === 'BSF2');
    if (a && b && a.length >= 4 && b.length >= 4) {
      setIfOpen(bsf1, a[2].idx, b[3].idx); // 3A vs 4B
      setIfOpen(bsf2, b[2].idx, a[3].idx); // 3B vs 4A
    }
    const bw1 = winKO('BSF1'), bw2 = winKO('BSF2'), bl1 = loseKO('BSF1'), bl2 = loseKO('BSF2');
    setIfOpen(state.matches.find((m) => m.id === 'BCK'), bw1, bw2);
    setIfOpen(state.matches.find((m) => m.id === 'BF3'), bl1, bl2);
    return;
  }

  // 1 bảng: CK = nhất vs nhì, hạng 3 = ba vs tư
  const f3 = state.matches.find((m) => m.id === 'F3');
  const ck = state.matches.find((m) => m.id === 'CK');
  const standings = computeStandings();
  if (standings.length >= 4) {
    if (f3 && f3.homeScore === '' && f3.awayScore === '') {
      f3.home = standings[2].idx; f3.away = standings[3].idx;
    }
    if (ck && ck.homeScore === '' && ck.awayScore === '') {
      ck.home = standings[0].idx; ck.away = standings[1].idx;
    }
  }
}

function renderSchedule() {
  resolveKnockout();
  const wrap = document.getElementById('scheduleWrap');
  wrap.innerHTML = '';
  // Group by stage
  const stages = {};
  state.matches.forEach((m) => {
    if (!stages[m.stage]) stages[m.stage] = [];
    stages[m.stage].push(m);
  });
  const stageOrder = [
    'Bảng A — Vòng tròn', 'Bảng B — Vòng tròn', 'Vòng tròn',
    'Serie A — Bán kết', 'Serie B — Bán kết',
    'Serie A — Tranh hạng 3', 'Serie B — Tranh hạng 3',
    'Serie A — Chung kết', 'Serie B — Chung kết',
    'Tranh hạng 3', 'Chung kết',
  ];
  stageOrder.forEach((st) => {
    if (!stages[st]) return;
    const group = document.createElement('div');
    group.className = 'ops__stage';
    const head = document.createElement('h3');
    head.className = 'ops__subhead';
    head.textContent = st;
    group.appendChild(head);
    stages[st].forEach((m) => {
      const homeName = m.home == null ? '?' : (state.names[m.home] || fmtTeam(m.home));
      const awayName = m.away == null ? '?' : (state.names[m.away] || fmtTeam(m.away));
      const labelTxt = m.label ? `<div class="ops-match__label">${m.label}</div>` : '';
      const card = document.createElement('div');
      card.className = 'ops-match';
      card.innerHTML = `
        <div class="ops-match__no">${m.round != null && m.round !== '' ? '#' + m.round : (m.label ? '' : '')}</div>
        ${labelTxt}
        <div class="ops-match__teams">
          <span class="ops-match__team ops-match__team--home">${homeName}</span>
          <span class="ops__score">
            <input type="number" min="0" data-id="${m.id}" data-side="home" value="${m.homeScore}" placeholder="0" />
            <span>:</span>
            <input type="number" min="0" data-id="${m.id}" data-side="away" value="${m.awayScore}" placeholder="0" />
          </span>
          <span class="ops-match__team ops-match__team--away">${awayName}</span>
        </div>
        <input class="ops-match__scorers" type="text" data-id="${m.id}" data-side="scorers" value="${m.scorers || ''}" placeholder="Scorer: vd An 2; Bình 1" />
      `;
      group.appendChild(card);
    });
    wrap.appendChild(group);
  });
  // bind inputs
  wrap.querySelectorAll('input[data-id]').forEach((inp) => {
    inp.addEventListener('input', onMatchInput);
  });
}

function onMatchInput(e) {
  const id = e.target.dataset.id;
  const side = e.target.dataset.side;
  const m = state.matches.find((x) => x.id === id);
  if (!m) return;
  if (side === 'home') m.homeScore = e.target.value === '' ? '' : parseInt(e.target.value, 10);
  else if (side === 'away') m.awayScore = e.target.value === '' ? '' : parseInt(e.target.value, 10);
  else if (side === 'scorers') m.scorers = e.target.value;
  renderStandings();
  renderResults();
  renderScorers();
  // If a round-robin match changed, re-resolve knockout teams (but keep KO scores if already filled)
  const m2 = state.matches.find((x) => x.id === id);
  if (m2 && (m2.group === 'Bảng A' || m2.group === 'Bảng B' || m2.group === 'SerieA' || m2.group === 'SerieB' || id.startsWith('RR'))) renderSchedule();
}

// ===== Standings =====
function computeGroup(indices, matchFilter) {
  const rows = indices.map((i) => ({ idx: i, name: state.names[i] || fmtTeam(i), p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 }));
  state.matches.forEach((m) => {
    if (!matchFilter(m)) return;
    if (m.homeScore === '' || m.awayScore === '' || m.home == null || m.away == null) return;
    const h = rows.find((r) => r.idx === m.home);
    const a = rows.find((r) => r.idx === m.away);
    if (!h || !a) return;
    h.p++; a.p++;
    h.gf += m.homeScore; h.ga += m.awayScore;
    a.gf += m.awayScore; a.ga += m.homeScore;
    if (m.homeScore > m.awayScore) { h.w++; h.pts += 3; a.l++; }
    else if (m.homeScore < m.awayScore) { a.w++; a.pts += 3; h.l++; }
    else { h.d++; a.d++; h.pts++; a.pts++; }
  });
  rows.forEach((r) => r.gd = r.gf - r.ga);
  rows.sort((x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.name.localeCompare(y.name));
  return rows;
}

function computeStandings() {
  if (state.teams === 8) {
    const a = computeGroup([0, 1, 2, 3], (m) => m.group === 'Bảng A');
    const b = computeGroup([4, 5, 6, 7], (m) => m.group === 'Bảng B');
    return { a, b };
  }
  // 1 bảng: RR id cho 4/5/6 đội, hoặc có thể là 'RR' cũ
  return computeGroup(Array.from({ length: state.teams }, (_, i) => i), (m) => m.id.startsWith('RR'));
}

function renderStandings() {
  const stand = computeStandings();
  const standBox = document.getElementById('standingsTable').parentElement;
  const oldWrap = standBox.querySelector('.ops-standings-wrap');
  if (oldWrap) oldWrap.remove();
  const tableEl = document.getElementById('standingsTable');

  const renderRows = (rows) => {
    const tbody = document.createElement('tbody');
    rows.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${r.name}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><strong>${r.pts}</strong></td>`;
      tbody.appendChild(tr);
    });
    return tbody;
  };

  if (state.teams === 8) {
    // Render 2 bảng cạnh nhau
    tableEl.style.display = 'none';
    const wrap = document.createElement('div');
    wrap.className = 'ops-standings-wrap';
    const buildGroup = (title, rows) => {
      const blk = document.createElement('div');
      blk.className = 'ops-standings-group';
      blk.innerHTML = `<h3 class="ops__subhead">${title}</h3>`;
      const tbl = tableEl.cloneNode(true);
      tbl.style.display = '';
      tbl.id = '';
      tbl.querySelector('tbody').remove();
      tbl.appendChild(renderRows(rows));
      blk.appendChild(tbl);
      return blk;
    };
    wrap.appendChild(buildGroup('Bảng A', stand.a));
    wrap.appendChild(buildGroup('Bảng B', stand.b));
    standBox.appendChild(wrap);
  } else {
    tableEl.style.display = '';
    const tbody = tableEl.querySelector('tbody');
    tbody.innerHTML = '';
    stand.forEach((r, i) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `<td>${i + 1}</td><td>${r.name}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><strong>${r.pts}</strong></td>`;
      tbody.appendChild(tr);
    });
  }
}

// ===== Results =====
function renderResults() {
  const wrap = document.getElementById('resultsWrap');
  wrap.innerHTML = '';
  const done = state.matches.filter((m) => m.homeScore !== '' && m.awayScore !== '' && m.home != null && m.away != null);
  if (done.length === 0) {
    wrap.innerHTML = '<p class="card__hint">Chưa có trận nào có tỷ số.</p>';
    return;
  }
  done.forEach((m) => {
    const homeName = state.names[m.home] || fmtTeam(m.home);
    const awayName = state.names[m.away] || fmtTeam(m.away);
    let cls = 'ops__result--draw', label = 'Hòa';
    if (m.homeScore > m.awayScore) { cls = 'ops__result--home'; label = `${homeName} thắng`; }
    else if (m.homeScore < m.awayScore) { cls = 'ops__result--away'; label = `${awayName} thắng`; }
    const div = document.createElement('div');
    div.className = 'ops__result ' + cls;
    div.innerHTML = `
      <span class="ops__result__stage">${m.stage}</span>
      <span class="ops__result__match">${homeName} <strong>${m.homeScore}</strong> : <strong>${m.awayScore}</strong> ${awayName}</span>
      <span class="ops__result__label">${label}</span>
    `;
    wrap.appendChild(div);
  });
}

// ===== Scorers =====
function parseScorers(text, teamIdx) {
  // format: "An 2; Bình 1" -> [{name:'An', goals:2}, ...]
  if (!text) return [];
  return text.split(';').map((s) => s.trim()).filter(Boolean).map((part) => {
    const m = part.match(/^(.*?)\s+(\d+)$/);
    if (m) return { name: m[1].trim(), goals: parseInt(m[2], 10), team: teamIdx };
    return { name: part, goals: 1, team: teamIdx };
  });
}

function renderScorers() {
  const map = {};
  state.matches.forEach((m) => {
    if (m.home == null || m.away == null) return;
    if (m.homeScore === '' || m.awayScore === '') return;
    // home scorers
    parseScorers(m.scorers, m.home).forEach((s) => {
      const key = s.name + '|' + s.team;
      if (!map[key]) map[key] = { name: s.name, team: s.team, goals: 0 };
      map[key].goals += s.goals;
    });
  });
  const arr = Object.values(map).sort((x, y) => y.goals - x.goals || x.name.localeCompare(y.name));
  const tbody = document.querySelector('#scorersTable tbody');
  tbody.innerHTML = '';
  if (arr.length === 0) {
    tbody.innerHTML = '<tr><td colspan="4" class="card__hint">Chưa có bàn thắng nào được nhập.</td></tr>';
    return;
  }
  arr.forEach((s, i) => {
    const teamName = s.team == null ? '?' : (state.names[s.team] || fmtTeam(s.team));
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${s.name}</td><td>${teamName}</td><td><strong>${s.goals}</strong></td>`;
    tbody.appendChild(tr);
  });
}

// ===== Export / Import =====
function exportJSON() {
  const data = JSON.stringify(state, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'ag-league-data.json';
  a.click();
  URL.revokeObjectURL(url);
}

function importJSON(file) {
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const data = JSON.parse(e.target.result);
      state = Object.assign({ teams: 4, names: [], date: '', venue: '', matches: [] }, data);
      // sync UI controls
      document.getElementById('opsTeams').value = state.teams;
      document.getElementById('opsDate').value = state.date || '';
      document.getElementById('opsVenue').value = state.venue || '';
      renderTeamNames();
      renderSchedule();
      renderStandings();
      renderResults();
      renderScorers();
    } catch (err) {
      alert('File JSON không hợp lệ.');
    }
  };
  reader.readAsText(file);
}

// ===== Init & events =====
function regen() {
  state.matches = buildMatches();
  renderSchedule();
  renderStandings();
  renderResults();
  renderScorers();
}

document.getElementById('opsTeams').addEventListener('change', (e) => {
  const n = parseInt(e.target.value, 10);
  state.teams = n;
  // adjust names
  const newNames = [];
  for (let i = 0; i < n; i++) newNames.push(state.names[i] || fmtTeam(i));
  state.names = newNames;
  renderTeamNames();
  regen();
});

document.getElementById('opsDate').addEventListener('input', (e) => { state.date = e.target.value; });
document.getElementById('opsVenue').addEventListener('input', (e) => { state.venue = e.target.value; });

document.getElementById('btnGenerate').addEventListener('click', regen);
document.getElementById('btnExport').addEventListener('click', exportJSON);
document.getElementById('btnImport').addEventListener('click', () => document.getElementById('fileInput').click());
document.getElementById('fileInput').addEventListener('change', (e) => {
  if (e.target.files[0]) importJSON(e.target.files[0]);
  e.target.value = '';
});

// Initial render
renderTeamNames();
regen();