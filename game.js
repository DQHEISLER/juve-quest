const missions=[
{icon:"🗳️",tag:"PARTICIPAÇÃO",q:"Apenas 15% dos alunos participam do Grêmio Estudantil.",c:[["Criar eleições digitais.",0,15],["Realizar palestras motivacionais.",0,5],["Ignorar o problema.",0,-15]]},
{icon:"📚",tag:"EDUCAÇÃO",q:"Os estudantes apresentam baixo desempenho escolar.",c:[["Criar programa de monitoria.",15,0],["Criar plataforma de estudos online.",10,0],["Não realizar nenhuma ação.",-15,0]]},
{icon:"🛡️",tag:"INFORMAÇÃO",q:"Uma fake news sobre a escola viralizou.",c:[["Criar central de checagem.",10,10],["Compartilhar sem verificar.",-10,-10]]},
{icon:"🏛️",tag:"DEMOCRACIA",q:"Os alunos solicitam assembleias mensais.",c:[["Permitir e incentivar.",0,15],["Limitar as reuniões.",0,-5]]},
{icon:"💻",tag:"ACESSO",q:"Muitos estudantes não possuem internet em casa.",c:[["Criar laboratório digital.",20,5],["Não investir.",-15,0]]},
{icon:"💰",tag:"GESTÃO",q:"Os alunos querem participar do orçamento escolar.",c:[["Criar orçamento participativo.",5,20],["Negar o pedido.",0,-20]]},
{icon:"📖",tag:"EDUCAÇÃO",q:"A biblioteca está desatualizada.",c:[["Modernizar biblioteca.",20,0],["Adiar investimento.",-10,0]]},
{icon:"📅",tag:"ENGAJAMENTO",q:"Há baixa participação em eventos educacionais.",c:[["Criar aplicativo de eventos.",10,10],["Não mudar nada.",-10,-10]]},
{icon:"🤝",tag:"LIDERANÇA",q:"Os estudantes desejam criar um conselho juvenil.",c:[["Autorizar imediatamente.",0,20],["Recusar proposta.",0,-20]]},
{icon:"🎒",tag:"PERMANÊNCIA",q:"A escola precisa de um programa de combate à evasão.",c:[["Implantar programa de permanência.",20,5],["Ignorar a situação.",-20,0]]}
];

let state={education:50,participation:50,current:0,score:0,answered:false};
const el=id=>document.getElementById(id);
const limit=n=>Math.max(0,Math.min(100,n));

function getRank(){
  if(state.score>=180)return "Lenda da Juventude";
  if(state.score>=120)return "Líder de Impacto";
  if(state.score>=70)return "Estrategista";
  return "Recruta da Juventude";
}

function update(){
  el("education").textContent=state.education;
  el("participation").textContent=state.participation;
  el("score").textContent=state.score;
  el("rank").textContent=getRank();
  el("educationBar").style.width=state.education+"%";
  el("participationBar").style.width=state.participation+"%";
  const done=Math.min(state.current,missions.length);
  el("progressText").textContent=done+" / "+missions.length;
  el("progressBar").style.width=(done/missions.length*100)+"%";
}

function load(){
  if(state.current>=missions.length){finish();return;}
  const m=missions[state.current];
  state.answered=false;
  el("missionNumber").textContent="MISSÃO "+String(state.current+1).padStart(2,"0");
  el("missionTag").textContent=m.tag;
  el("missionIcon").textContent=m.icon;
  el("question").textContent=m.q;
  el("feedback").textContent="";
  el("feedback").className="feedback";
  el("next").disabled=true;
  el("choices").innerHTML="";

  m.c.forEach((choice,i)=>{
    const b=document.createElement("button");
    b.type="button";
    b.className="choice";
    const total=choice[1]+choice[2];
    b.innerHTML='<span class="letter">'+String.fromCharCode(65+i)+'</span><span class="choiceText">'+choice[0]+'</span><span class="impact '+(total>=0?"positive":"negative")+'">'+(total>0?"+":"")+total+" impacto</span>";
    b.addEventListener("click",()=>answer(b,choice));
    el("choices").appendChild(b);
  });
  update();
}

function answer(button,choice){
  if(state.answered)return;
  state.answered=true;
  const edu=choice[1],part=choice[2],total=edu+part;
  state.education=limit(state.education+edu);
  state.participation=limit(state.participation+part);
  if(total>0)state.score+=total;

  document.querySelectorAll(".choice").forEach(b=>b.disabled=true);
  button.classList.add(total>=0?"good":"bad");
  el("feedback").className="feedback "+(total>=0?"good":"bad");
  el("feedback").textContent=total>=0?"✓ Decisão registrada. Impacto positivo!":"⚠ Decisão registrada. Essa escolha trouxe um impacto negativo.";
  el("next").disabled=false;
  update();
}

function finish(){
  const victory=state.education>=80&&state.participation>=80;
  el("missionNumber").textContent="CAMPANHA CONCLUÍDA";
  el("missionTag").textContent="RESULTADO";
  el("missionIcon").textContent=victory?"🏆":"🧭";
  el("question").textContent=victory?"Sua cidade virou referência em direitos da juventude!":"Sua jornada terminou — ainda há desafios pela frente.";
  el("choices").innerHTML='<div class="result"><b>🎓 Educação: '+state.education+'</b><br><b>🗳️ Participação: '+state.participation+'</b><br><b>⭐ Pontos: '+state.score+'</b><br><br>Seu nível: <b>'+getRank()+'</b></div>';
  el("feedback").className="feedback "+(victory?"good":"bad");
  el("feedback").textContent=victory?"Excelente equilíbrio entre educação e participação!":"Tente novamente e busque uma pontuação maior.";
  el("next").style.display="none";

  const badges=[];
  if(state.education>=100)badges.push("🏅 Defensor da Educação");
  if(state.participation>=100)badges.push("🏅 Líder Democrático");
  if(state.score>=120)badges.push("⚡ Estrategista de Impacto");
  if(victory)badges.push("🏆 Herói da Juventude");
  el("badges").innerHTML=badges.map(x=>'<span class="badge">'+x+"</span>").join("");
  update();
}

function restart(){
  state={education:50,participation:50,current:0,score:0,answered:false};
  el("next").style.display="";
  load();
  window.scrollTo({top:0,behavior:"smooth"});
}

el("next").addEventListener("click",()=>{
  if(!state.answered)return;
  state.current++;
  load();
});

el("restart").addEventListener("click",restart);

load();
