const dbUrl = "https://script.google.com/macros/s/AKfycbwCbTEc9N1OObGxOXsSlh7kttwPZsudswTYMnpH-ofOSwm4v3OdwAKrH_roB7uSjHa6XA/exec";
const vistaUrl = "https://t3sl4co1l.github.io/bingovista/bingovista.html"
var canvasSize = 0;


document.addEventListener("DOMContentLoaded", async function() {
    canvasSize = parseInt(window.getComputedStyle(document.body).getPropertyValue("--canvas-size"));

    var reqUrl = new URL(dbUrl);
    reqUrl.search = "character=Watcher";
    var boardList;
    try {
        boardList = await fetch(reqUrl).then(response => response.json());
    } catch (error) {
        var statusMessage = document.getElementById("status-message");
        statusMessage.classList.remove("ellipsed");
        statusMessage.innerHTML = "error fetching data :<br/>" + error.message + "<br/><br/>Please reload the page or contact Gzethicus.";
        return;
    }

    if (document.getElementById("board-info") !== undefined && document.getElementById("navigation") !== undefined) {
        for (i = 0; i < boardList.length; i++) {
            createBoardInfo(boardList[i].name);
            displayBoardInfo(boardList[i]);
        }
        document.getElementById("status-message").style.display = "none";
    }

    const seePlayed = document.getElementById("see-played");
    if (seePlayed !== undefined) {
        togglePlayedVisibility({"target" : {"checked" : seePlayed.checked}})
    }
});

function createBoardInfo(name) {
    const newDiv = document.createElement("div");
    newDiv.className = "board-info";
    newDiv.id = name;
    document.getElementById("board-list").appendChild(newDiv);

    const link = document.createElement("a");
    link.href = "#" + name;
    link.id = name + "-link";
    link.appendChild(document.createTextNode(name));
    document.getElementById("navigation").appendChild(link);
}

function displayBoardInfo(data) {
    const infoDiv = document.getElementById(data.name);
    const divLink = document.getElementById(data.name + "-link");
    if (data.used) {
        infoDiv.classList.add("played");
        divLink.classList.add("played");
    } else {
        infoDiv.classList.remove("played");
        divLink.classList.remove("played");
    }

    var board = parseBoard(data.string);
    board.comments = data.name;
    board.perks = BingoEnum_EXPFLAGS["LOCKOUT"];
    board.shelter = data.shelter;
    board.toBin = boardToBin(board);

    const infoName = document.createElement("label");
    infoName.className = "board-name";
    infoName.appendChild(document.createTextNode(data.name));
    infoDiv.appendChild(infoName);

    const extraControls = document.createElement("div");
    const infoShelter = document.createElement("label");
    infoShelter.className = "board-shelter";
    infoShelter.appendChild(document.createTextNode(data.shelter));
    extraControls.appendChild(infoShelter);
    infoDiv.appendChild(extraControls);

    const playedContainer = document.createElement("label");
    playedContainer.className = "icon-button";
    playedContainer.title = "Toggle available/played";
    const playedInput = document.createElement("input");
    playedInput.type = "checkbox";
    playedInput.checked = !data.used;
    playedInput.addEventListener("change", setPlayed.bind(this, data.name));
    playedContainer.appendChild(playedInput);
    const playedIcon = document.createElement("span");
    playedContainer.appendChild(playedIcon);
    extraControls.appendChild(playedContainer);

    const vistaLink = document.createElement("a");
    vistaLink.className = "icon-button";
    vistaLink.href = vistaUrl + "?b=" + binToBase64u(board.toBin);
    vistaLink.target = "_blank";
    const vistaIcon = document.createElement("img");
    vistaIcon.src = "graphics\\bingoVista.png";
    vistaLink.title = "View on BingoVista";
    vistaIcon.alt = "View on BingoVista";
    vistaLink.appendChild(vistaIcon);
    extraControls.appendChild(vistaLink);

    const infoCanvas = document.createElement("canvas");
    infoCanvas.id = data.name + "-canvas";
    infoCanvas.width = canvasSize;
    infoCanvas.height = canvasSize;
    infoCanvas.appendChild(document.createTextNode(data.string));
    infoCanvas.addEventListener("click", onCanvasClicked);
    infoDiv.appendChild(infoCanvas);

    redrawBoard(infoCanvas.id, board);
}

async function setPlayed(board, e) {
    var payload = {
        method : "POST",
        redirect: "follow",
        headers : {"Content-Type" : "text/plain"},
        body: JSON.stringify({
            "character" : "Watcher",
            "board" : board,
            "used" : !e.target.checked
        })
    };

    var res;
    try {
        res = await fetch(dbUrl, payload);
    } catch (error) {
        e.target.checked ^= true;
        return;
    }
    if (res.ok && !e.target.checked) {
        document.getElementById(board).classList.add("played");
        document.getElementById(board + "-link").classList.add("played");
    } else if (res.ok) {
        document.getElementById(board).classList.remove("played");
        document.getElementById(board + "-link").classList.remove("played");
    } else {
        e.target.checked ^= true;
    }
}

function onCanvasClicked(e) {
    const callback = confirmCopyToClipboard.bind(this, e);
    navigator.clipboard.writeText(e.target.textContent).then(callback);
}

function confirmCopyToClipboard(e) {
    const confirm = document.getElementById("copy-confirm");
    confirm.style.animation = "none";
    confirm.style.left = e.pageX - confirm.offsetWidth / 2 + "px";
    confirm.style.top = e.pageY - confirm.offsetHeight + "px";
    confirm.style.visibility = "visible";
    confirm.style.animation = null;
}

function togglePlayedVisibility(e) {
    const visible = e.target.checked;
    var styleSheet;
    for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        if (sheet.href.includes("/styles.css")) {
            styleSheet = sheet;
            break;
        }
    }

    for (var i = 0; i < styleSheet.cssRules.length; i++) {
        var rule = styleSheet.cssRules[i];
        if (rule.selectorText === ".played") {
            if (visible)
                rule.style.removeProperty("display");
            else
                rule.style.display = "none"
            break;
        }
    }
}
