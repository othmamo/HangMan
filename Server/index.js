const WebSocket = require("ws");

const wss = new WebSocket.Server({ port: 2048 });

var games = {};
var clients = {};

class Game
{
    constructor(word)
    {
        this.wordToGuess = word;
        this.wordClear = word.toLowerCase();
        this.wordHidden = Array(this.wordClear.length).fill('_');
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
    console.log("New game created, code:", data["GameCode"]);
    games[data["GameCode"]] = new Game("Test Word");
    clients[data["GameCode"]] = [ws];
    return true;
}

function joinGame(data, ws)
{
    console.log("Client joined existing game, code:", data["GameCode"]);
    clients[data["GameCode"]].push(ws);
    return true;
}

function getGameCode(ws)
{
    for (var elm in clients)
    {
        if (clients[elm].includes(ws))
        {
            return elm;
        }
    }
    return null;
}

wss.on("connection", ws => {
    console.log("New Connection!");

    ws.on("close", () => {
        console.log("Client Disconnected!");
    });

    ws.on("message", msg => {
        let msgJson = JSON.parse(msg);
        if (msgJson["request"] === "Create game")
            createGame(msgJson, ws);
        else if (msgJson["request"] === "Join game")
            joinGame(msgJson, ws);
        else if (msgJson["request"] === "Simple Message")
        {
            let gameCode = getGameCode(ws);
            if (gameCode != null)
                wss.broadcast(msgJson, gameCode);
        }
    });
});

wss.broadcast = function broadcast(msg, gameCode) {
   clients[gameCode].forEach(e => e.send(JSON.stringify(msg)));
};
