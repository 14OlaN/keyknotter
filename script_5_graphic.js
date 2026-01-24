const canvas = document.getElementById('myCanvas');
const ctx = canvas.getContext('2d');
const questionElement = document.getElementById('question');

function resizeCanvas() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener("resize", resizeCanvas);


const bgColors = {
    base: "#001E3D",
    light: "#003366",
    dark: "#00060B"
};

const keyboardLayout = {
    // numbers
    "1": [0, 0], "2": [1, 0], "3": [2, 0], "4": [3, 0], "5": [4, 0],
    "6": [5, 0], "7": [6, 0], "8": [7, 0], "9": [8, 0], "0": [9, 0],

    // top row
    q: [0, 1], w: [1, 1], e: [2, 1], r: [3, 1], t: [4, 1],
    y: [5, 1], u: [6, 1], i: [7, 1], o: [8, 1], p: [9, 1],

    // middle row
    a: [0.5, 2], s: [1.5, 2], d: [2.5, 2], f: [3.5, 2], g: [4.5, 2],
    h: [5.5, 2], j: [6.5, 2], k: [7.5, 2], l: [8.5, 2],

    // bottom row
    z: [1, 3], x: [2, 3], c: [3, 3], v: [4, 3],
    b: [5, 3], n: [6, 3], m: [7, 3],

    // spacebar
    " ": [4.5, 4]
};

// BACKGROUND COLOR CHANGE

let bgPhase = 0;
// 0 = base
// 1 = glow lighter
// 2 = back to base
// 3 = glow darker
// 4 = back to base

const PHASE_DURATION = 20000; // 20 seconds
let phaseStartTime = performance.now();

function lerp(a, b, t) {
    return a + (b - a) * t;
}

function hexToRgb(hex) {
    const n = hex.replace("#", "");
    return {
        r: parseInt(n.slice(0, 2), 16),
        g: parseInt(n.slice(2, 4), 16),
        b: parseInt(n.slice(4, 6), 16)
    };
}

function interpolateColor(c1, c2, t) {
    const a = hexToRgb(c1);
    const b = hexToRgb(c2);

    return `rgb(
        ${lerp(a.r, b.r, t)},
        ${lerp(a.g, b.g, t)},
        ${lerp(a.b, b.b, t)}
    )`;
}

function drawBackground() {
    const now = performance.now();
    let t = (now - phaseStartTime) / PHASE_DURATION;

    if (t >= 1) {
        bgPhase = (bgPhase + 1) % 5;
        phaseStartTime = now;
        t = 0;
    }

    let innerColor = bgColors.base;
    let outerColor = bgColors.base;

    if (bgPhase === 1) {
        innerColor = interpolateColor(bgColors.base, bgColors.light, t);
    } else if (bgPhase === 2) {
        innerColor = interpolateColor(bgColors.light, bgColors.base, t);
    } else if (bgPhase === 3) {
        innerColor = interpolateColor(bgColors.base, bgColors.dark, t);
    } else if (bgPhase === 4) {
        innerColor = interpolateColor(bgColors.dark, bgColors.base, t);
    }

    const gradient = ctx.createRadialGradient(
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.1,
        canvas.width / 2,
        canvas.height / 2,
        canvas.width * 0.7
    );

    gradient.addColorStop(0, innerColor);
    gradient.addColorStop(1, outerColor);

    ctx.globalAlpha = 0.06; // controls fade speed
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
}

// TEXT - QUESTIONS, DATE, TIME

const questions = [
    "What is your name?",
    "How old are you?",
    "What is your first ever memory?",
    "How petty are you with coworkers/peers you don't like?",
    "Did you ever wish you had someone else's parents?",
    "How close does someone have to be for you to tell them their hair looks bad?",
    "What should your grandkids call you?",
    "Is who you are today disappointing someone you know?",
    "How do you escape a bad date?",
    "What are you taking to your grave, literally or metaphorically?",
    "What was your first 'favorite thing'?",
    "Are you often the villain in a story?",
    "How good of a parent will you be compared to your parents?",
    "Would 8yo you be excited for your current career?",
    "Fuck marry kill: first kiss, first love, most recent ex?",
    "How do you think you will die?",
    "How often do you think you're someone's subway crush?"
];

const dateElement = document.querySelector('.date');
const timeElement = document.querySelector('.time');

function updateDateTime() {
    const now = new Date();

    // ---- DATE ----
    const day = now.getDate();
    const monthNames = [
        "jan", "feb", "mar", "apr", "may", "jun",
        "jul", "aug", "sep", "oct", "nov", "dec"
    ];
    const month = monthNames[now.getMonth()];
    const year = now.getFullYear();

    dateElement.textContent = `${day} ${month} ${year}`;

    // ---- TIME (24h) ----
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    timeElement.textContent = `${hours}:${minutes}`;
}
updateDateTime();
setInterval(updateDateTime, 1000);

let currentQuestionIndex = 0;
let answerString = '';
let stringy = [];
let displayText = '';
let lastX = 0;
let lastY = canvas.height / 2;
let directionX = 1; // 1 for right, -1 for left

function displayQuestion() {
    displayText = '';
    for (let i = 0; i < stringy.length; i ++) {
        displayText += stringy[i] + ' ';
    }
    displayText += questions[currentQuestionIndex];
    questionElement.textContent = displayText;
}


// DRAW STAR FOR KEY

function drawStarForKey(key) {
    const k = key.toLowerCase();

    // fallback: center-ish
    let xNorm = 4.5;
    let yNorm = 2;

    if (keyboardLayout[k]) {
        [xNorm, yNorm] = keyboardLayout[k];
    }

    const maxCols = 9;
    const maxRows = 4;

    const paddingX = canvas.width * 0.05;
    const paddingY = canvas.height * 0.05;

    const spreadX = canvas.width * 0.25;
    const spreadY = canvas.height * 0.25;

    const x =
        paddingX +
        (xNorm / maxCols) * (canvas.width - paddingX * 2) +
        (Math.random() - 0.5) * spreadX;

    const y =
        paddingY +
        (yNorm / maxRows) * (canvas.height - paddingY * 2) +
        (Math.random() - 0.5) * spreadY;

    ctx.font = "100 20px 'IBM Plex Mono', monospace";
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    ctx.fillText("*", x, y);
}


// UPDATE ANSWER STRING

function updateAnswerString(event) {
    const key = event.key;
    drawStarForKey(event.key);
    if (key === 'Enter') {
        if (currentQuestionIndex < questions.length-1) { // if there are still questions left
            // Store the current question and answer
            stringy.push(questions[currentQuestionIndex] + ' ' + answerString + '.');
            answerString = ''; // Reset answerString for the new question
            currentQuestionIndex++;
            displayQuestion();
        }
        else {
            stringy.push(questions[currentQuestionIndex] + ' ' + answerString);
            currentQuestionIndex++;
            questionElement.textContent += ". I hope you live a long long life."
        }
    } else {
        
        if (currentQuestionIndex > 0) {
            displayText = '';
            for (let i = 0; i < stringy.length; i++) {
                displayText += stringy[i] + ' ';
            }
            answerString += key;
            displayText += questions[currentQuestionIndex] + ' ' + answerString;
            questionElement.textContent = displayText;
        } else if (currentQuestionIndex < questions.length){
            answerString += key;
            questionElement.textContent = questions[currentQuestionIndex] + ' ' + answerString;
        }
    }
}




// Display the first question
displayQuestion();

// Listen for keypress events on the document
document.addEventListener('keypress', updateAnswerString);

function animate() {
    drawBackground();
    requestAnimationFrame(animate);
}

animate();
