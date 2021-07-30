const WebSocket = require("ws");
const fs = require('fs')

const wss = new WebSocket.Server({ port: 2048 });

var games = {};

class Player
{
    constructor(name, wordLives)
    {
        this.name = name;
        this.wordLives = wordLives;
        this.attempts = 0;
    }

    toString()
    {
        return `Word guesses left: ${this.wordLives}
You have already commited ${this.attempts} attempts.`
    }
}

class Game
{
    constructor(word)
    {
        this.randomPlayer = 0;
        this.clients = [];
        this.players = [];
        this.wordToGuess = word;
        this.wordClear = word.toLowerCase();
        this.wordHidden = Array(this.wordClear.length).fill('_');
    }

    addPlayer(player)
    {
        if (player == "")
        {
            let generateName = "Player " + this.randomPlayer;
            this.players.push(new Player(generateName, 3));
            this.randomPlayer ++;
            return generateName;
        }
        this.players.push(new Player(player, 3));
        return player;
    }

    addClient(player)
    {
        this.clients.push(player);
    }

    letterinWord(l)
    {
        l = l.toLowerCase()
        if (!this.wordClear.includes(l))
            return false;
        for (let i = 0; i < this.wordClear.length; i++)
            if (this.wordClear[i] == l)
                this.wordHidden[i] = this.wordToGuess[i];
        return true;
    }

    checkWin(read)
    {
        if (countOccurrences(this.wordHidden, '_') === 0 || read.toLowerCase() === this.wordClear)
            return true;
        return false;
    }
}

function createGame(data, ws)
{
    let gameCode = data["GameCode"];
    console.log("New game created, code:", gameCode);
    let newGame = new Game("Test Word");
    newGame.addClient(ws);
    data["Player name"] = newGame.addPlayer(data["Player name"]);
    games[gameCode] = newGame;
    return true;
}

function joinGame(data, ws)
{
    let gameCode = data["GameCode"];
    console.log("Client joined existing game, code:", gameCode);
    games[gameCode].addClient(ws);
    data["Player name"] = games[gameCode].addPlayer(data["Player name"]);
    return true;
}

function addPlayerRequest(name, ws)
{
    res = {};
    res["Request"] = "Add Player";
    res["Player name"] = name;
    console.log(name);
    return res;
}

function readFileContentRequest(path, ws)
{
    try {
        const data = fs.readFileSync(path, 'utf8');
        res = {};
        res["Request"] = "Load page";
        res["Content"] = data;
        return res;
    }
    catch (err) {
        return null;
    }
}

function getGameCode(ws)
{
    for (var elm in games)
    {
        if (games[elm].clients.includes(ws))
        {
            return elm;
        }
    }
    return null;
}

function mergeDict(a, b)
{
    return Object.assign({}, a, b);
}

function sendRequest(dict, ws)
{
    ws.send(JSON.stringify(dict));
}

function addElementHtml(toAdd, line, dst)
{
    let currentLine = 0;
    let whereToAdd = 0;
    for (; whereToAdd < dst.length && currentLine < line; whereToAdd++)
    {
        if (dst[whereToAdd] === '\n')
            currentLine ++;
    }
    var output = [dst.slice(0, whereToAdd), toAdd, dst.slice(whereToAdd)].join('');
    return output;
}
function createRequestHandler(msgJson, ws)
{
    createGame(msgJson, ws);
    let fileReq = readFileContentRequest("www/lobby.html", ws);
    let addPlayerReq = addPlayerRequest(msgJson["Player name"], ws);
    let gameCodePara = "<p id=\"GameCode\">" + msgJson["GameCode"] + "</p>\r\n";
    fileReq["Content"] = addElementHtml(gameCodePara, 1, fileReq["Content"]);
    sendRequest(fileReq, ws);
    sendRequest(addPlayerReq, ws);
}

function joinRequestHandler(msgJson, ws)
{
    joinGame(msgJson, ws);
    let gameCode = msgJson["GameCode"];
    console.log(gameCode);
    if (gameCode == null)
        return;

    let fileReq = readFileContentRequest("www/lobby.html", ws);
    let gameCodePara = "<p id=\"GameCode\">" + gameCode + "</p>\r\n";
    fileReq["Content"] = addElementHtml(gameCodePara, 1, fileReq["Content"]);
    sendRequest(fileReq, ws);

    let addPlayerReq = addPlayerRequest(msgJson["Player name"], ws);
    games[gameCode].players.forEach(e => {
        if (e.name != msgJson["Player name"])
            sendRequest(addPlayerRequest(e.name, ws), ws);
    });
    wss.broadcast(addPlayerReq, gameCode);
}

wss.on("connection", ws => {
    console.log("New Connection!");

    ws.on("close", () => {
        console.log("Client Disconnected!");
    });

    ws.on("message", msg => {
        let msgJson = JSON.parse(msg);
        if (msgJson["Request"] === "Create game")
        {
            createRequestHandler(msgJson, ws);
        }
        else if (msgJson["Request"] === "Join game")
        {
            joinRequestHandler(msgJson, ws);
        }
        else if (msgJson["Request"] === "Simple Message")
        {
            let gameCode = getGameCode(ws);
            if (gameCode != null)
                wss.broadcast(msgJson, gameCode);
        }
    });
});

wss.broadcast = function broadcast(msg, gameCode) {
   games[gameCode].clients.forEach(e => e.send(JSON.stringify(msg)));
};
