const dbUrl = "https://script.google.com/macros/s/AKfycbxDRhfclsaQGBR-xFMQWapvZetM8BlN089vlswhYu1AEFWONGVq53ap-eDehMNvIBKuuw/exec";
var canvasSize = 0;


document.addEventListener("DOMContentLoaded", async function() {
    canvasSize = parseInt(window.getComputedStyle(document.body).getPropertyValue("--canvas-size"));

    var reqUrl = new URL(dbUrl);
    reqUrl.search = "character=Watcher";
    const boardList = await fetch(reqUrl).then(response => response.json());

    if (document.getElementById("board-info") !== undefined && document.getElementById("navigation") !== undefined) {
        for (i = 0; i < boardList.length; i++) {
            createBoardInfo(boardList[i].name);
            displayBoardInfo(boardList[i]);
        }
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
        infoDiv.classList.add("used");
        divLink.classList.add("used");
    } else {
        infoDiv.classList.remove("used");
        divLink.classList.remove("used");
    }

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

    const infoCanvas = document.createElement("canvas");
    infoCanvas.id = data.name + "-canvas";
    infoCanvas.width = canvasSize;
    infoCanvas.height = canvasSize;
    infoCanvas.appendChild(document.createTextNode(data.string));
    infoCanvas.addEventListener("click", onCanvasClicked);
    infoDiv.appendChild(infoCanvas);
    drawBoard(infoCanvas.id, data.string);
}

function drawBoard(canvasId, boardString) {
	document.getElementById("textbox").value = boardString;
    parseText();
    redrawBoard(canvasId);
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

function toggleUsedVisibility(e) {
    const visible = e.target.checked;
    var styleSheet;
    for (var i = 0; i < document.styleSheets.length; i++) {
        var sheet = document.styleSheets[i];
        if (sheet.href.endsWith("/styles.css")) {
            styleSheet = sheet;
            break;
        }
    }

    for (var i = 0; i < styleSheet.cssRules.length; i++) {
        var rule = styleSheet.cssRules[i];
        if (rule.selectorText === ".used") {
            if (visible)
                rule.style.removeProperty("display");
            else
                rule.style.display = "none"
            break;
        }
    }
}
