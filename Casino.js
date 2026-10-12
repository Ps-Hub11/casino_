/* HTML-Elemente und Roulette-Daten */
const submitBtn = document.getElementById("submitBtn");
const rotatingWheel = document.querySelector(".wheel-rotation");
const svg = document.getElementById("rouletteSvg");
const numbersContainer = document.querySelector(".numbers");
const ball = document.getElementById("ball");
const coins = document.querySelectorAll("#Tokens .coins");
const betTargets = document.querySelectorAll("#Zahlen > .Zahlen, .bet-row button");
const thirdColumn =document.getElementById("third-column");
const undoBtn =document.getElementById("undoBtn");
const Geld = document.getElementById("Geld");
const Fehlermeldung = document.getElementById("Fehlermeldung");
const ausgewaehlteElemente = document.querySelectorAll(
    "#Zahlen > .ausgewählt"
);
   const chips = document.querySelectorAll(".bet-chip");
   const Gewinn = document.getElementById("Gewinn");
   const LosingScreen = document.getElementById("LosingScreen");
   const gesamtGewinnAnzeige = document.getElementById("gesamtGewinn");


   let kontostand = 10000;
   let gesamtGewonnen = 0;
   let selectedCoin = null;
let gewinnTimer;
Geld.textContent = `Geld: ${kontostand}€`;
LosingScreen.style.display = "none";





const numbers = [
    0, 32, 15, 19, 4, 21, 2, 25, 17,
    34, 6, 27, 13, 36, 11, 30, 8, 23,
    10, 5, 24, 16, 33, 1, 20, 14, 31,
    9, 22, 18, 29, 7, 28, 12, 35, 3, 26
];

const redNumbers = [
    1, 3, 5, 7, 9, 12, 14, 16, 18,
    19, 21, 23, 25, 27, 30, 32, 34, 36
];

const betNumbers = (() => {
    const allNumbers = Array.from({ length: 36 }, (_, index) => index + 1);

    return {
        red: redNumbers,
        black: allNumbers.filter((number) => !redNumbers.includes(number)),
        even: allNumbers.filter((number) => number % 2 === 0),
        odd: allNumbers.filter((number) => number % 2 !== 0),
        low: allNumbers.slice(0, 18),
        high: allNumbers.slice(18),
        "first-12": allNumbers.slice(0, 12),
        "second-12": allNumbers.slice(12, 24),
        "third-12": allNumbers.slice(24),
        "first-column": allNumbers.filter((number) => number % 3 === 1),
        "second-column": allNumbers.filter((number) => number % 3 === 2),
        "third-column": allNumbers.filter((number) => number % 3 === 0)
    };
})();

document.querySelectorAll(".bet-row button").forEach((button) => {
    button.addEventListener("mouseenter", () => {
        betNumbers[button.id].forEach((number) => {
            document.getElementById(String(number))
                ?.classList.add("wetten-vorschau");
        });
    });

    button.addEventListener("mouseleave", () => {
        betNumbers[button.id].forEach((number) => {
            document.getElementById(String(number))
                ?.classList.remove("wetten-vorschau");
        });
    });
});

const center = 250;
const radiusOuter = 230;
const radiusInner = 100;
const anglePerNumber = 360 / numbers.length;
const svgNamespace = "http://www.w3.org/2000/svg";

/* Wandelt einen Winkel und Radius in SVG-Koordinaten um */
function polarToCartesian(cx, cy, radius, angle) {
    const radians = (angle - 90) * Math.PI / 180;

    return {
        x: cx + radius * Math.cos(radians),
        y: cy + radius * Math.sin(radians)
    };
}

/* Erstellt ein farbiges Feld auf dem Roulette-Rad */
function createField(startAngle, endAngle, color) {
    const startOuter = polarToCartesian(center, center, radiusOuter, startAngle);
    const endOuter = polarToCartesian(center, center, radiusOuter, endAngle);
    const startInner = polarToCartesian(center, center, radiusInner, startAngle);
    const endInner = polarToCartesian(center, center, radiusInner, endAngle);

    const path = document.createElementNS(svgNamespace, "path");
    path.setAttribute("d", `
        M ${startInner.x} ${startInner.y}
        L ${startOuter.x} ${startOuter.y}
        A ${radiusOuter} ${radiusOuter} 0 0 1 ${endOuter.x} ${endOuter.y}
        L ${endInner.x} ${endInner.y}
        A ${radiusInner} ${radiusInner} 0 0 0 ${startInner.x} ${startInner.y}
        Z
    `);
    path.setAttribute("fill", color);
    path.setAttribute("stroke", "#d4af37");
    path.setAttribute("stroke-width", "1");

    svg.appendChild(path);
}

/* Platziert eine Zahl mittig in ihrem Rad-Feld */
function createNumber(number, index) {
    const element = document.createElement("div");
    const angle = index * anglePerNumber + anglePerNumber / 2;
    const point = polarToCartesian(center, center, 185, angle);

    element.classList.add("number");
    element.textContent = number;
    element.style.left = `${point.x / 500 * 100}%`;
    element.style.top = `${point.y / 500 * 100}%`;

    numbersContainer.appendChild(element);
}

/* Zeichnet alle 37 Felder und Zahlen */
numbers.forEach((number, index) => {
    const startAngle = index * anglePerNumber;
    const endAngle = (index + 1) * anglePerNumber;
    let color = "#111111";

    if (number === 0) {
        color = "#008000";
    } else if (redNumbers.includes(number)) {
        color = "#c1121f";
    }

    createField(startAngle, endAngle, color);
    createNumber(number, index);
});

/* Dreht das Rad und lässt die Kugel in der Mitte eines Feldes stoppen */
function berechneAuszahlung(winningNumber) {
    let gesamtAuszahlung = 0;

    // Alle Felder durchgehen, auf denen Jetons liegen
    document.querySelectorAll(".drop-target").forEach((feld) => {
        const chips = feld.querySelectorAll(".bet-chip");

        if (chips.length === 0) {
            return;
        }

        // Zahlen ermitteln, auf die dieses Feld setzt
        const direkteZahl = Number(feld.id);

        const gesetzteZahlen = betNumbers[feld.id] ?? (
            Number.isInteger(direkteZahl) &&
            direkteZahl >= 0 &&
            direkteZahl <= 36
                ? [direkteZahl]
                : []
        );

        // Prüfen, ob die Gewinnzahl zu dieser Wette gehört
        if (!gesetzteZahlen.includes(winningNumber)) {
            return;
        }

        // Auszahlungsfaktor festlegen
        let faktor;

        if (
            Number.isInteger(direkteZahl) &&
            direkteZahl >= 0 &&
            direkteZahl <= 36
        ) {
            faktor = 36;
        } else if (
            ["first-12", "second-12", "third-12",
             "first-column", "second-column", "third-column"]
                .includes(feld.id)
        ) {
            faktor = 3;
        } else {
            faktor = 2;
        }

        // Alle Jetons dieser gewonnenen Wette auszahlen
        chips.forEach((chip) => {
            const einsatz = Number(chip.textContent);
            gesamtAuszahlung += einsatz * faktor;
        });
    });

    // Auszahlung dem Kontostand hinzufügen
    kontostand += gesamtAuszahlung;
    Geld.textContent = `Geld: ${kontostand}€`;

    console.log("Gewinnzahl:", winningNumber);
    console.log("Gesamte Auszahlung:", gesamtAuszahlung);
    return gesamtAuszahlung;
}

function zeigeSpielergebnis(winningNumber, auszahlung) {
    Gewinn.textContent = auszahlung > 0
        ? `Gewinnzahl: ${winningNumber} – Auszahlung: ${auszahlung}€`
        : `Gewinnzahl: ${winningNumber} – kein Gewinn`;
    Gewinn.classList.add("sichtbar");

    clearTimeout(gewinnTimer);
    gewinnTimer = setTimeout(() => {
        Gewinn.classList.remove("sichtbar");
        Gewinn.textContent = "";
    }, 8000);
}
let wheelAngle = 0;
let ballAngle = 0;
const ballRadius = 165;

ball.style.left = `${center / 500 * 100}%`;
ball.style.top = `${(center - ballRadius) / 500 * 100}%`;

function spin() {
    if (submitBtn.disabled) {
        return;
    }

    clearTimeout(gewinnTimer);
    Gewinn.classList.remove("sichtbar");
    Gewinn.textContent = "";
    submitBtn.disabled = true;
    undoBtn.disabled = true;
    coins.forEach((coin) => {
    coin.draggable = false;
});
  

    const winningIndex = Math.floor(Math.random() * numbers.length);
    const winningNumber = numbers[winningIndex];
    const startWheelAngle = wheelAngle;
    const startBallAngle = ballAngle;
    const endWheelAngle = startWheelAngle + 360 * 6 + Math.random() * 360;
    const winningPocketAngle =
        winningIndex * anglePerNumber + anglePerNumber / 2;
    const endBallAngle =
        winningPocketAngle + endWheelAngle -
        360 * Math.ceil(
            (winningPocketAngle + endWheelAngle - startBallAngle) / 360
        ) -
        360 * 5;
    const duration = 7000;
    let startTime;

    function animateSpin(timestamp) {
        if (startTime === undefined) {
            startTime = timestamp;
        }

        submitBtn.disabled = true;
        undoBtn.disabled = true;

        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easedProgress = 1 - (1 - progress) ** 4;

        wheelAngle =
            startWheelAngle + (endWheelAngle - startWheelAngle) * easedProgress;
        ballAngle =
            startBallAngle + (endBallAngle - startBallAngle) * easedProgress;

        rotatingWheel.style.transform = `rotate(${wheelAngle}deg)`;

        const radians = (ballAngle - 90) * Math.PI / 180;
        ball.style.left =
            `${(center + ballRadius * Math.cos(radians)) / 500 * 100}%`;
        ball.style.top =
            `${(center + ballRadius * Math.sin(radians)) / 500 * 100}%`;

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
            return;
        }

        document.querySelectorAll("#Zahlen > .ausgewählt").forEach((number) => {
            number.classList.remove("ausgewählt");
        });
        const auszahlung = berechneAuszahlung(winningNumber);
        gesamtGewonnen += auszahlung;
        zeigeSpielergebnis(winningNumber, auszahlung);
        if (auszahlung === 0 && kontostand === 0) {
            gesamtGewinnAnzeige.textContent =
                `Gesamte Auszahlung: ${gesamtGewonnen}€`;
            LosingScreen.style.display = "flex";
        }

        wheelAngle = endWheelAngle;
        ballAngle = endBallAngle;
        rotatingWheel.style.transform = `rotate(${wheelAngle}deg)`;
        document.querySelectorAll(".bet-chips").forEach((chips) => chips.remove());
        submitBtn.disabled = false;
        undoBtn.disabled = false;
      coins.forEach((coin) => {
    coin.draggable = true;
});
    }

    requestAnimationFrame(animateSpin);
}


submitBtn.addEventListener("click", spin);


/* Drag and Drop von Tokens*/
coins.forEach((coin) => {
    coin.addEventListener("click", () => selectCoin(coin));
    coin.addEventListener("dragstart", dragStart);
    coin.addEventListener("dragend", dragEnd);
});

betTargets.forEach((target) => {
    target.classList.add("drop-target");
    target.addEventListener("click", () => {
        if (selectedCoin) {
            placeBet(target, selectedCoin);
        }
    });
    target.addEventListener("dragover", dragOver);
    target.addEventListener("dragenter", dragEnter);
    target.addEventListener("dragleave", dragLeave);
    target.addEventListener("drop", dragDrop);
});

function selectCoin(coin) {
    selectedCoin = coin;
    coins.forEach((currentCoin) => {
        const isSelected = currentCoin === coin;
        currentCoin.classList.toggle("selected", isSelected);
        currentCoin.setAttribute("aria-pressed", String(isSelected));
    });
}

function dragStart(e){
    e.dataTransfer.setData("text/plain", this.id);
    e.dataTransfer.effectAllowed = "copy";
}

function dragEnd(){
    betTargets.forEach((target) => target.classList.remove("over"));
}

function dragOver(e){
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
}

function dragEnter(e){
    e.preventDefault();
    this.classList.add("over");
}

function dragDrop(e){
    e.preventDefault();
    const coinId = e.dataTransfer.getData("text/plain");
    const coin = document.getElementById(coinId);

    if (coin && coin.classList.contains("coins")) {
        placeBet(this, coin);
    }
    this.classList.remove("over");
}

function placeBet(target, coin) {
    const betValue = Number(coin.textContent);
    if (submitBtn.disabled) {
        return;
    }

    if (betValue > kontostand) {
        Fehlermeldung.textContent = "Du hast nicht genug Geld :(";
        Fehlermeldung.hidden = false;
        return;
    }

    kontostand -= betValue;
    Geld.textContent = `Geld: ${kontostand}€`;

    let placedChips = target.querySelector(".bet-chips");
    if (!placedChips) {
        placedChips = document.createElement("span");
        placedChips.className = "bet-chips";
        target.appendChild(placedChips);
    }

    const placedChip = document.createElement("span");
    placedChip.className = "bet-chip";
    placedChip.textContent = coin.textContent;
    placedChip.setAttribute("aria-label", `${coin.textContent} Jeton`);
    placedChips.appendChild(placedChip);

    const directNumber = Number(target.id);
    const selectedNumbers = betNumbers[target.id] ?? (
        Number.isInteger(directNumber) &&
        directNumber >= 0 &&
        directNumber <= 36
            ? [directNumber]
            : []
    );

    selectedNumbers.forEach((number) => {
        document.getElementById(String(number))
            ?.classList.add("ausgewählt");
    });
}
function dragLeave(e){
    if (!this.contains(e.relatedTarget)) {
        this.classList.remove("over");
    }
}

undoBtn.addEventListener("click", () => {
    document.querySelectorAll(".bet-chip").forEach((chip) => {
        kontostand += Number(chip.textContent);
    });
    document.querySelectorAll(".bet-chips").forEach((chips) => chips.remove());
    document.querySelectorAll("#Zahlen > .ausgewählt").forEach((number) => {
        number.classList.remove("ausgewählt");
    });
    Geld.textContent = `Geld: ${kontostand}€`;
});
Fehlermeldung.addEventListener("click", () => {
    Fehlermeldung.hidden = true;
})

document.getElementById("closeLosingScreen").addEventListener("click", () => {
    LosingScreen.style.display = "none";
});

document.getElementById("resetBtn").addEventListener("click", () => {
    kontostand = 10000;
    gesamtGewonnen = 0;
    gesamtGewinnAnzeige.textContent = "Gesamte Auszahlung: 0€";
    Geld.textContent = `Geld: ${kontostand}€`;
    selectedCoin = null;
    coins.forEach((coin) => {
        coin.classList.remove("selected");
        coin.setAttribute("aria-pressed", "false");
        coin.draggable = true;
    });
    document.querySelectorAll("#Zahlen > .ausgewählt").forEach((number) => {
        number.classList.remove("ausgewählt");
    });
    document.querySelectorAll(".bet-chips").forEach((chips) => chips.remove());
    LosingScreen.style.display = "none";
});
