/* =========================================================
   JUVEQUEST
   A Missão dos Direitos da Juventude
   ========================================================= */


/* =========================================================
   MISSÕES
   ========================================================= */

const missions = [

    {
        icon: "🗳️",

        tag: "PARTICIPAÇÃO",

        question:
            "Apenas 15% dos alunos participam do Grêmio Estudantil.",

        choices: [

            [
                "Criar eleições digitais.",
                0,
                15
            ],

            [
                "Realizar palestras motivacionais.",
                0,
                5
            ],

            [
                "Ignorar o problema.",
                0,
                -15
            ]

        ]

    },


    {
        icon: "📚",

        tag: "EDUCAÇÃO",

        question:
            "Os estudantes apresentam baixo desempenho escolar.",

        choices: [

            [
                "Criar programa de monitoria.",
                15,
                0
            ],

            [
                "Criar plataforma de estudos online.",
                10,
                0
            ],

            [
                "Não realizar nenhuma ação.",
                -15,
                0
            ]

        ]

    },


    {
        icon: "🛡️",

        tag: "INFORMAÇÃO",

        question:
            "Uma fake news sobre a escola viralizou.",

        choices: [

            [
                "Criar central de checagem.",
                10,
                10
            ],

            [
                "Compartilhar sem verificar.",
                -10,
                -10
            ]

        ]

    },


    {
        icon: "🏛️",

        tag: "DEMOCRACIA",

        question:
            "Os alunos solicitam assembleias mensais.",

        choices: [

            [
                "Permitir e incentivar.",
                0,
                15
            ],

            [
                "Limitar as reuniões.",
                0,
                -5
            ]

        ]

    },


    {
        icon: "💻",

        tag: "ACESSO",

        question:
            "Muitos estudantes não possuem internet em casa.",

        choices: [

            [
                "Criar laboratório digital.",
                20,
                5
            ],

            [
                "Não investir.",
                -15,
                0
            ]

        ]

    },


    {
        icon: "💰",

        tag: "GESTÃO",

        question:
            "Os alunos querem participar do orçamento escolar.",

        choices: [

            [
                "Criar orçamento participativo.",
                5,
                20
            ],

            [
                "Negar o pedido.",
                0,
                -20
            ]

        ]

    },


    {
        icon: "📖",

        tag: "EDUCAÇÃO",

        question:
            "A biblioteca está desatualizada.",

        choices: [

            [
                "Modernizar biblioteca.",
                20,
                0
            ],

            [
                "Adiar investimento.",
                -10,
                0
            ]

        ]

    },


    {
        icon: "📅",

        tag: "ENGAJAMENTO",

        question:
            "Há baixa participação em eventos educacionais.",

        choices: [

            [
                "Criar aplicativo de eventos.",
                10,
                10
            ],

            [
                "Não mudar nada.",
                -10,
                -10
            ]

        ]

    },


    {
        icon: "🤝",

        tag: "LIDERANÇA",

        question:
            "Os estudantes desejam criar um conselho juvenil.",

        choices: [

            [
                "Autorizar imediatamente.",
                0,
                20
            ],

            [
                "Recusar proposta.",
                0,
                -20
            ]

        ]

    },


    {
        icon: "🎒",

        tag: "PERMANÊNCIA",

        question:
            "A escola precisa de um programa de combate à evasão.",

        choices: [

            [
                "Implantar programa de permanência.",
                20,
                5
            ],

            [
                "Ignorar a situação.",
                -20,
                0
            ]

        ]

    }

];


/* =========================================================
   ESTADO DO JOGO
   ========================================================= */

let state = {

    education: 50,

    participation: 50,

    current: 0,

    score: 0,

    selected: false

};


/* =========================================================
   ATALHO PARA ELEMENTOS
   ========================================================= */

const $ = (id) => {

    return document.getElementById(id);

};


/* =========================================================
   LIMITAR VALORES ENTRE 0 E 100
   ========================================================= */

function clamp(number) {

    return Math.max(
        0,
        Math.min(
            100,
            number
        )
    );

}


/* =========================================================
   RANKING
   ========================================================= */

function rank() {

    if (state.score >= 180) {

        return "Lenda da Juventude";

    }


    if (state.score >= 120) {

        return "Líder de Impacto";

    }


    if (state.score >= 70) {

        return "Estrategista";

    }


    return "Recruta da Juventude";

}


/* =========================================================
   ATUALIZAR INTERFACE
   ========================================================= */

function updateUI() {

    $("education").textContent =
        state.education;


    $("participation").textContent =
        state.participation;


    $("score").textContent =
        state.score;


    $("rankText").textContent =
        rank();


    $("educationBar").style.width =
        state.education + "%";


    $("participationBar").style.width =
        state.participation + "%";


    const completed =
        Math.min(
            state.current,
            missions.length
        );


    $("progressText").textContent =
        `${completed} / ${missions.length}`;


    const progress =
        (
            completed /
            missions.length
        ) * 100;


    $("progressBar").style.width =
        progress + "%";

}


/* =========================================================
   TEXTO DO IMPACTO
   ========================================================= */

function impactText(
    education,
    participation
) {

    const total =
        education +
        participation;


    if (total > 0) {

        return `+${total} impacto`;

    }


    if (total < 0) {

        return `${total} impacto`;

    }


    return "impacto neutro";

}


/* =========================================================
   CARREGAR MISSÃO
   ========================================================= */

function loadMission() {

    /* FINAL */

    if (
        state.current >=
        missions.length
    ) {

        endGame();

        return;

    }


    const mission =
        missions[state.current];


    state.selected = false;


    /* NÚMERO */

    $("missionNumber").textContent =
        `MISSÃO ${
            String(
                state.current + 1
            ).padStart(2,"0")
        }`;


    /* CATEGORIA */

    $("missionTag").textContent =
        mission.tag;


    /* ÍCONE */

    $("missionIcon").textContent =
        mission.icon;


    /* PERGUNTA */

    $("missionTitle").textContent =
        mission.question;


    $("missionHint").textContent =
        "Escolha a alternativa que você considera mais estratégica.";


    /* MENSAGEM */

    $("message").textContent = "";

    $("message").className =
        "message";


    /* BOTÃO */

    $("nextBtn").disabled =
        true;


    /* OPÇÕES */

    const options =
        $("options");


    options.innerHTML = "";


    mission.choices.forEach(
        (choice,index) => {

            const button =
                document.createElement(
                    "button"
                );


            button.className =
                "option";


            button.type =
                "button";


            const education =
                choice[1];


            const participation =
                choice[2];


            const total =
                education +
                participation;


            const impactClass =
                total >= 0
                    ? "positive"
                    : "negative";


            button.innerHTML = `

                <span class="letter">

                    ${
                        String
                            .fromCharCode(
                                65 + index
                            )
                    }

                </span>


                <span class="choice-text">

                    ${choice[0]}

                </span>


                <span
                    class="impact ${impactClass}">

                    ${
                        impactText(
                            education,
                            participation
                        )
                    }

                </span>

            `;


            button.onclick =
                () => {

                    choose(
                        button,
                        choice
                    );

                };


            options.appendChild(
                button
            );

        }
    );


    updateUI();

}


/* =========================================================
   ESCOLHER ALTERNATIVA
   ========================================================= */

function choose(
    button,
    choice
) {

    if (
        state.selected
    ) {

        return;

    }


    state.selected =
        true;


    const education =
        choice[1];


    const participation =
        choice[2];


    /* ATUALIZA INDICADORES */

    state.education =
        clamp(
            state.education +
            education
        );


    state.participation =
        clamp(
            state.participation +
            participation
        );


    /* PONTUAÇÃO */

    const impact =
        education +
        participation;


    if (
        impact > 0
    ) {

        state.score +=
            impact;

    }


    /* DESABILITA OPÇÕES */

    document
        .querySelectorAll(
            ".option"
        )
        .forEach(
            button => {

                button.disabled =
                    true;

            }
        );


    /* ESTILO DA RESPOSTA */

    if (
        impact >= 0
    ) {

        button.classList.add(
            "correct"
        );

    }

    else {

        button.classList.add(
            "wrong"
        );

    }


    /* MENSAGEM */

    $("message").className =
        `message ${
            impact >= 0
                ? "success"
                : "warn"
        }`;


    if (
        impact >= 0
    ) {

        $("message").textContent =
            "✓ Decisão registrada. O impacto foi positivo!";

    }

    else {

        $("message").textContent =
            "⚠ Decisão registrada. Essa escolha trouxe desafios para a cidade.";

    }


    /* LIBERA PRÓXIMA */

    $("nextBtn").disabled =
        false;


    updateUI();

}


/* =========================================================
   FINAL DO JOGO
   ========================================================= */

function endGame() {

    $("progressText").textContent =
        `${missions.length} / ${missions.length}`;


    $("progressBar").style.width =
        "100%";


    $("missionNumber").textContent =
        "CAMPANHA CONCLUÍDA";


    $("missionTag").textContent =
        "RESULTADO";


    const victory =
        state.education >= 80 &&
        state.participation >= 80;


    $("missionIcon").textContent =
        victory
            ? "🏆"
            : "🧭";


    if (victory) {

        $("missionTitle").textContent =
            "Sua cidade virou referência em direitos da juventude!";

    }

    else {

        $("missionTitle").textContent =
            "Sua jornada terminou — ainda há desafios pela frente.";

    }


    $("missionHint").textContent =
        `Você tomou ${
            missions.length
        } decisões e acumulou ${
            state.score
        } pontos de impacto.`;


    /* RESULTADO */

    $("options").innerHTML = `

        <div class="result-box">

            <strong>
                🎓 Educação:
                ${state.education}
            </strong>

            <br>

            <strong>
                🗳️ Participação:
                ${state.participation}
            </strong>

            <br><br>

            Seu nível:

            <strong>
                ${rank()}
            </strong>

        </div>

    `;


    /* MENSAGEM FINAL */

    $("message").className =
        "message success";


    if (victory) {

        $("message").textContent =
            "Excelente equilíbrio entre educação e participação!";

    }

    else {

        $("message").textContent =
            "Cada decisão ensina algo. Tente novamente para buscar uma pontuação maior.";

    }


    /* ESCONDE BOTÃO */

    $("nextBtn").style.display =
        "none";


    /* CONQUISTAS */

    const badges = [];


    if (
        state.education >= 100
    ) {

        badges.push(
            "🏅 Defensor da Educação"
        );

    }


    if (
        state.participation >= 100
    ) {

        badges.push(
            "🏅 Líder Democrático"
        );

    }


    if (
        state.score >= 120
    ) {

        badges.push(
            "⚡ Estrategista de Impacto"
        );

    }


    if (
        victory
    ) {

        badges.push(
            "🏆 Herói da Juventude"
        );

    }


    $("badges").innerHTML =
        badges
            .map(
                badge => {

                    return `

                        <span class="badge">

                            ${badge}

                        </span>

                    `;

                }
            )
            .join("");


    updateUI();

}


/* =========================================================
   REINICIAR
   ========================================================= */

function restart() {

    state = {

        education: 50,

        participation: 50,

        current: 0,

        score: 0,

        selected: false

    };


    $("nextBtn").style.display =
        "";


    loadMission();


    window.scrollTo({

        top: 0,

        behavior: "smooth"

    });

}


/* =========================================================
   PRÓXIMA MISSÃO
   ========================================================= */

$("nextBtn").onclick =
    () => {

        if (
            !state.selected
        ) {

            return;

        }


        state.current++;


        loadMission();

    };


/* =========================================================
   BOTÃO REINICIAR
   ========================================================= */

$("restartBtn").onclick =
    restart;


/* =========================================================
   INICIAR JOGO
   ========================================================= */

updateUI();

loadMission();