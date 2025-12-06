const dbUrl = "https://script.google.com/macros/s/AKfycbysizVi-cl7ZhZr5p20fRy3aPWfdxwoIuvxfJVfJnTs9TVlboHp39H5mnQ_8Rusl4E/exec";
const vistaUrl = "https://t3sl4co1l.github.io/bingovista/bingovista.html"
var canvasSize = 0;

var preloaded = [];
var tabs = [];
var tabPanels = [];
var tabNavs = [];

document.addEventListener("DOMContentLoaded", function() {
    var searchParams = new URLSearchParams(document.URL.split("?")[1]);

    var reqUrl = new URL(dbUrl);
    var tabMakingPromise;
    try {
        tabMakingPromise = fetch(reqUrl)
            .then(response => response.json())
            .then((tabList) => {
                if (!tabList.includes(searchParams.get("character")))
                    tabList.push(searchParams.get("character"));
                for (var tab of tabList)
                    createTab(tab);
            });
    } catch (error) {
        var statusMessage = document.getElementById("status-message");
        statusMessage.classList.remove("ellipsed");
        statusMessage.innerHTML = "error fetching data :<br/>" + error.message + "<br/><br/>Please reload the page or contact Gzethicus.";
        return;
    }

    canvasSize = parseInt(window.getComputedStyle(document.body).getPropertyValue("--canvas-size"));
    loadTab(searchParams.get("character") || "Watcher", tabMakingPromise);

    const seePlayed = document.getElementById("see-played");
    if (seePlayed !== undefined) {
        togglePlayedVisibility({"target" : {"checked" : seePlayed.checked}});
    }
});

function showTab(targetTab) {
    const tabName = targetTab.getAttribute("aria-controls");
    loadTab(tabName);

    for (const tab of tabs) {
        if (tab === targetTab)
            continue;
        tab.setAttribute("aria-selected", false);
        tab.tabIndex = -1;
    }
    targetTab.setAttribute("aria-selected", true);
    targetTab.tabIndex = 0;

    const targetTabPanel = document.getElementById(tabName);
    for (const panel of tabPanels) {
        if (panel === targetTabPanel)
            continue;
        panel.hidden = true;
    }
    targetTabPanel.hidden = false;
    
    const targetTabNav = document.getElementById(tabName + "-nav");
    for (const nav of tabNavs) {
        if (nav === targetTabNav)
            continue;
        nav.hidden = true;
    }
    targetTabNav.hidden = false;
}

function createTab(tab) {
    const newTab = document.createElement("div");
    newTab.className = "text-button";
    newTab.role = "tab";
    newTab.setAttribute("aria-controls", tab);
    newTab.addEventListener("click", (e) => {
        showTab(e.target);
    })
    document.getElementById("tabs").appendChild(newTab);
    newTab.appendChild(document.createTextNode(tab));
    tabs.push(newTab);

    const newTabPanel = document.createElement("div");
    newTabPanel.id = tab;
    newTabPanel.role = "tabpanel";
    newTabPanel.tabIndex = 0;
    document.getElementById("board-list").appendChild(newTabPanel);
    tabPanels.push(newTabPanel);
    
    const newTabNav = document.createElement("div");
    newTabNav.id = tab + "-nav";
    newTabNav.role = "tabpanel";
    newTabNav.tabIndex = 0;
    document.getElementById("navigation").appendChild(newTabNav);
    tabNavs.push(newTabNav);
}

async function loadTab(tab, tabMakingPromise) {
    if (preloaded.includes(tab))
        return;

    document.getElementById("status-message").style.display = "block";
    preloaded.push(tab);
    boardList = await fetchBoardList(tab);
    if (tabMakingPromise !== undefined)
        await tabMakingPromise;

    if (document.getElementById("board-info") !== undefined && document.getElementById("navigation") !== undefined) {
        for (i = 0; i < boardList.length; i++) {
            createBoardInfo(boardList[i].name, tab);
            displayBoardInfo(boardList[i]);
        }
        document.getElementById("status-message").style.display = "none";
    }
}

async function fetchBoardList(character) {
    var reqUrl = new URL(dbUrl);
    reqUrl.search = "character=" + character;

    var boardList;
    try {
        boardList = await fetch(reqUrl).then(response => response.json());
    } catch (error) {
        var statusMessage = document.getElementById("status-message");
        statusMessage.classList.remove("ellipsed");
        statusMessage.innerHTML = "error fetching data :<br/>" + error.message + "<br/><br/>Please reload the page or contact Gzethicus.";
        return;
    }
    return boardList;
}

function createBoardInfo(name, character) {
    const newDiv = document.createElement("div");
    newDiv.className = "board-info";
    newDiv.id = name;
    document.getElementById(character || "board-list").appendChild(newDiv);

    const link = document.createElement("a");
    link.href = "#" + name;
    link.id = name + "-link";
    link.appendChild(document.createTextNode(name));
    document.getElementById(character + "-nav").appendChild(link);
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

    var board = parseText(data.string);
    board.comments = data.name;
    board.perks = BingoEnum_EXPFLAGS["LOCKOUT"];
    board.toBin = boardToBin(board);

    const infoName = document.createElement("label");
    infoName.className = "board-name";
    infoName.appendChild(document.createTextNode(data.name));
    infoDiv.appendChild(infoName);

    const infoCreator = document.createElement("label");
    infoCreator.className = "board-shelter";
    infoCreator.appendChild(document.createTextNode("by " + data.creator));
    infoDiv.appendChild(infoCreator);

    const extraControls = document.createElement("div");
    const infoShelter = document.createElement("label");
    infoShelter.className = "board-shelter";
    infoShelter.appendChild(document.createTextNode(board.shelter));
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
