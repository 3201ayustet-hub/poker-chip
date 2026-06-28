const $ = (id) => document.getElementById(id);
const phases = ['Preflop','Flop','Turn','River','Showdown'];
let phaseIndex = 0;
let raiseAmount = 100;
let history = [];
let state = {
  currentBet: 0,
  pot: 0,
  mainPot: 0,
  sidePot: 0,
  turn: 0,
  players: [
    {name:'Tetsuya', stack:2000, bet:0, folded:false, allIn:false, role:'D'},
    {name:'Player 2', stack:2000, bet:0, folded:false, allIn:false, role:'SB'},
    {name:'Player 3', stack:2000, bet:0, folded:false, allIn:false, role:'BB'},
    {name:'Player 4', stack:2000, bet:0, folded:false, allIn:false, role:''}
  ]
};
function saveHistory(){ history.push(JSON.stringify(state)); if(history.length>20) history.shift(); }
function showGame(){
  state.players[0].name = $('nameInput').value || 'You';
  const stack = Number($('stackInput').value || 2000);
  state.players.forEach(p => { p.stack = stack; p.bet = 0; });
  $('gameCode').textContent = $('codeInput').value || 'POKER01';
  $('home').classList.remove('active'); $('game').classList.add('active'); $('actionBar').classList.remove('hidden'); render();
}
function nextActive(from=state.turn){
  for(let i=1;i<=state.players.length;i++){
    const idx=(from+i)%state.players.length, p=state.players[idx];
    if(!p.folded && !p.allIn && p.stack>0) return idx;
  }
  return state.turn;
}
function recomputePots(){
  const total = state.players.reduce((s,p)=>s+p.bet,0);
  const bets = state.players.map(p=>p.bet).filter(v=>v>0).sort((a,b)=>a-b);
  const cap = bets[0] || 0;
  state.mainPot = state.players.reduce((s,p)=>s+Math.min(p.bet,cap),0);
  state.sidePot = Math.max(0,total-state.mainPot);
  state.pot = total;
}
function render(){
  const me = state.players[0];
  recomputePots();
  $('phaseText').textContent = phases[phaseIndex];
  $('turnText').textContent = state.turn===0 ? 'あなたの番' : `${state.players[state.turn].name} の番`;
  $('potTotal').textContent = state.pot;
  $('mainPot').textContent = state.mainPot;
  $('sidePot').textContent = state.sidePot;
  $('toCall').textContent = Math.max(0,state.currentBet - me.bet);
  $('myName').textContent = me.name;
  $('myStack').textContent = me.stack;
  $('myBet').textContent = me.bet;
  $('checkCallBtn').textContent = state.currentBet > me.bet ? `Call ${state.currentBet-me.bet}` : 'Check';
  $('statusText').textContent = me.allIn ? 'オールイン済みです' : me.folded ? 'フォールド済みです' : 'アクションを選択してください';
  $('playerList').innerHTML = state.players.map((p,i)=>`<div class="player-row ${i===state.turn?'active':''} ${p.allIn?'allin-row':''}"><div class="badge">${p.role||i+1}</div><div class="player-meta"><b>${p.name}</b><small>${p.folded?'Fold':p.allIn?'All-in':'Bet '+p.bet}</small></div><div class="player-stack">${p.stack}</div></div>`).join('');
  $('raiseAmount').textContent = raiseAmount;
}
function act(type, amount=0){
  const me = state.players[0];
  if(me.folded || me.allIn) return;
  saveHistory();
  if(type==='fold') me.folded = true;
  if(type==='call'){
    const pay = Math.min(me.stack, Math.max(0,state.currentBet-me.bet));
    me.stack -= pay; me.bet += pay; if(me.stack===0) me.allIn = true;
  }
  if(type==='raise'){
    const target = Math.max(state.currentBet + 50, amount);
    const pay = Math.min(me.stack, target - me.bet);
    me.stack -= pay; me.bet += pay; state.currentBet = Math.max(state.currentBet, me.bet); if(me.stack===0) me.allIn=true;
  }
  if(type==='allin'){
    me.bet += me.stack; me.stack = 0; me.allIn = true; state.currentBet = Math.max(state.currentBet, me.bet);
  }
  state.turn = nextActive(0); render();
}
$('createBtn').onclick = showGame; $('joinBtn').onclick = showGame;
$('foldBtn').onclick = () => act('fold');
$('checkCallBtn').onclick = () => act('call');
$('raiseBtn').onclick = () => $('raisePanel').classList.add('open');
$('closeRaise').onclick = () => $('raisePanel').classList.remove('open');
$('allInBtn').onclick = () => { if(confirm('本当にオールインしますか？')) act('allin'); };
document.querySelectorAll('.quick-grid button').forEach(btn=>btn.onclick=()=>{ if(btn.dataset.add) raiseAmount += Number(btn.dataset.add); if(btn.dataset.pot==='half') raiseAmount = Math.max(50, Math.floor(state.pot/2)); if(btn.dataset.pot==='pot') raiseAmount = Math.max(50, state.pot); render(); });
$('confirmRaise').onclick = () => { act('raise', raiseAmount); $('raisePanel').classList.remove('open'); raiseAmount = state.currentBet + 100; };
$('nextPhase').onclick = () => { phaseIndex = (phaseIndex+1)%phases.length; render(); };
$('awardBtn').onclick = () => { saveHistory(); state.players[0].stack += state.pot; state.players.forEach(p=>p.bet=0); state.currentBet=0; render(); alert('ver1では自分を勝者としてPotを付与します'); };
$('undoBtn').onclick = () => { const prev = history.pop(); if(prev){ state = JSON.parse(prev); render(); } };
$('newHandBtn').onclick = () => { saveHistory(); state.players.forEach(p=>{p.bet=0;p.folded=false;p.allIn=false}); state.currentBet=0; state.turn=0; phaseIndex=0; render(); };
$('resetBtn').onclick = () => location.reload();
render();
