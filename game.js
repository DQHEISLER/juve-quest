
let education = 50;
let participation = 50;

let currentMission = 0;

const missions = [

{
question:"Apenas 15% dos alunos participam do Grêmio Estudantil.",

choices:[

{
text:"Criar eleições digitais.",
education:0,
participation:15
},

{
text:"Realizar palestras motivacionais.",
education:0,
participation:5
},

{
text:"Ignorar o problema.",
education:0,
participation:-15
}

]
},

{
question:"Os estudantes apresentam baixo desempenho escolar.",

choices:[

{
text:"Criar programa de monitoria.",
education:15,
participation:0
},

{
text:"Criar plataforma de estudos online.",
education:10,
participation:0
},

{
text:"Não realizar nenhuma ação.",
education:-15,
participation:0
}

]
},

{
question:"Uma fake news sobre a escola viralizou.",

choices:[

{
text:"Criar central de checagem.",
education:10,
participation:10
},

{
text:"Compartilhar sem verificar.",
education:-10,
participation:-10
}

]
},

{
question:"Os alunos solicitam assembleias mensais.",

choices:[

{
text:"Permitir e incentivar.",
education:0,
participation:15
},

{
text:"Limitar as reuniões.",
education:0,
participation:-5
}

]
},

{
question:"Muitos estudantes não possuem internet em casa.",

choices:[

{
text:"Criar laboratório digital.",
education:20,
participation:5
},

{
text:"Não investir.",
education:-15,
participation:0
}

]
},

{
question:"Os alunos querem participar do orçamento escolar.",

choices:[

{
text:"Criar orçamento participativo.",
education:5,
participation:20
},

{
text:"Negar o pedido.",
education:0,
participation:-20
}

]
},

{
question:"A biblioteca está desatualizada.",

choices:[

{
text:"Modernizar biblioteca.",
education:20,
participation:0
},

{
text:"Adiar investimento.",
education:-10,
participation:0
}

]
},

{
question:"Há baixa participação em eventos educacionais.",

choices:[

{
text:"Criar aplicativo de eventos.",
education:10,
participation:10
},

{
text:"Não mudar nada.",
education:-10,
participation:-10
}

]
},

{
question:"Os estudantes desejam criar um conselho juvenil.",

choices:[

{
text:"Autorizar imediatamente.",
education:0,
participation:20
},

{
text:"Recusar proposta.",
education:0,
participation:-20
}

]
},

{
question:"Programa de combate à evasão escolar.",

choices:[

{
text:"Implantar programa de permanência.",
education:20,
participation:5
},

{
text:"Ignorar situação.",
education:-20,
participation:0
}

]
}

];

function updateScore(){

document.getElementById("education").innerText =
education;

document.getElementById("participation").innerText =
participation;

}

function loadMission(){

if(currentMission >= missions.length){

endGame();

return;
}

const mission =
missions[currentMission];

document.getElementById("missionTitle")
.innerText =
mission.question;

const options =
document.getElementById("options");

options.innerHTML = "";

mission.choices.forEach(choice=>{

const button =
document.createElement("button");

button.classList.add("option");

button.innerText =
choice.text;

button.onclick = ()=>{

education += choice.education;

participation += choice.participation;

updateScore();

document.getElementById("message")
.innerHTML =
"✅ Decisão registrada!";

disableOptions();

};

options.appendChild(button);

});

}

function disableOptions(){

const buttons =
document.querySelectorAll(".option");

buttons.forEach(button=>{

button.disabled=true;

button.style.opacity=".5";

});

}

document
.getElementById("nextBtn")
.addEventListener("click",()=>{

currentMission++;

loadMission();

});

function endGame(){

let badges = "";

if(education >= 100){

badges += "🏅 Defensor da Educação<br>";
}

if(participation >= 100){

badges += "🏅 Líder Democrático<br>";
}

if(
education + participation >= 220
){

badges += "🏆 Herói da Juventude";
}

let finalMessage = "";

if(
education >= 80 &&
participation >= 80
){

finalMessage =
"🌟 Sua cidade tornou-se referência nacional em direitos da juventude!";
}
else{

finalMessage =
"⚠️ Ainda existem desafios para garantir todos os direitos da juventude.";
}

document.querySelector(".mission-box")
.innerHTML = `

<h1>Fim do Jogo</h1>

<h2>${finalMessage}</h2>

<h3>Pontuação Final</h3>

<p>🎓 Educação: ${education}</p>

<p>🗳️ Participação: ${participation}</p>

`;

document.getElementById("badges")
.innerHTML = badges;

document.getElementById("nextBtn")
.style.display = "none";

}

updateScore();

loadMission();