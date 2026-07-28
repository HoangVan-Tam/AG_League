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
  const idx = Array.from({ length: n }, (_, i) => i);
  const rr = roundRobin(idx);
  const matches = [];
  rr.forEach((m, i) => {
    matches.push({
      id: 'RR' + i, stage: 'Vòng tròn', round: i + 1,
      home: m.home, away: m.away,
      homeScore: '', awayScore: '', scorers: '',
    });
  });
  // Knockout placeholders (resolved after round-robin)
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
  // Determine standings to set CK + H3 pairs
  const standings = computeStandings();
  const f3 = state.matches.find((m) => m.id === 'F3');
  const ck = state.matches.find((m) => m.id === 'CK');
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
  const stageOrder = ['Vòng tròn', 'Tranh hạng 3', 'Chung kết'];
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
      const card = document.createElement('div');
      card.className = 'ops-match';
      card.innerHTML = `
        <div class="ops-match__no">${m.round != null ? '#' + m.round : ''}</div>
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
  // If round-robin changed, re-resolve knockout teams (but keep KO scores if already filled)
  if (id.startsWith('RR')) renderSchedule();
}

// ===== Standings =====
function computeStandings() {
  const rows = [];
  for (let i = 0; i < state.teams; i++) {
    rows.push({ idx: i, name: state.names[i] || fmtTeam(i), p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
  }
  state.matches.forEach((m) => {
    if (!m.id.startsWith('RR')) return;
    if (m.homeScore === '' || m.awayScore === '' || m.home == null || m.away == null) return;
    const h = rows[m.home], a = rows[m.away];
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

function renderStandings() {
  const rows = computeStandings();
  const tbody = document.querySelector('#standingsTable tbody');
  tbody.innerHTML = '';
  rows.forEach((r, i) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${i + 1}</td><td>${r.name}</td><td>${r.p}</td><td>${r.w}</td><td>${r.d}</td><td>${r.l}</td><td>${r.gd > 0 ? '+' : ''}${r.gd}</td><td><strong>${r.pts}</strong></td>`;
    tbody.appendChild(tr);
  });
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
    if (m.homeScore === '' || m.awayScore === '') {
      // still allow scorers even if score not set? require score
    }
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