const ws = new WebSocket("ws://localhost:2048");

ws.addEventListener("open", () => console.log("Connected to server!"));
ws.addEventListener("message", msg =>
{
    let data = msg["data"];
    let msgJson = JSON.parse(data);
    console.log(msgJson);
    if (msgJson["Request"] ===  "Load page")
    {
        reloadPage(msgJson["Content"]);
    }
    if (msgJson["Request"] === "Add Player")
    {
        addPlayerLobby(msgJson["Player name"]);
    }

});

function addPlayerLobby(name)
{
    var ul = document.getElementById("QueueList");
    var li = document.createElement("li");
    li.setAttribute('id', name);
    li.appendChild(document.createTextNode(name));
    ul.appendChild(li);
}

function removePlayerLobby(name)
{
    var ul = document.getElementById("QueueList");
    var li = document.getElementById("test1");
    ul.removeChild(li);
}


function countOccurrences(list, elm)
{
    let res = 0;
    for (const e of list)
    {
        if (e == elm)
            res ++;
    };
    return res;
}

function reloadPage(content)
{
    document.body.innerHTML = content;
}

function formToJson(data)
{
    let res = {};
    data.forEach(e => res[e["name"]] = e["value"]);
    return res;
}

function sendData()
{
    let data = $('form').serializeArray();
    ws.send(JSON.stringify(formToJson(data)));
}

function sendCreate()
{
    let random = '_' + Math.random().toString(36).substr(2, 9);
    document.getElementById("GameCode").value = random;
    let data = $('#CodeForm').serializeArray();
    let jsonData = formToJson(data);
    jsonData["Request"] = "Create game";
    ws.send(JSON.stringify(jsonData));
}

function sendJoin()
{
    let data = $('#CodeForm').serializeArray();
    let jsonData = formToJson(data);
    jsonData["Request"] = "Join game";
    ws.send(JSON.stringify(jsonData));
}

function sendSimpleMessage()
{
    let data = $('#MessageForm').serializeArray();
    let jsonData = formToJson(data);
    jsonData["Request"] = "Simple Message";
    ws.send(JSON.stringify(jsonData));
}

function alerter()
{
    //action="/my-handling-form-page" method="post"
    /*let a = new Player(5);
    let g = new Game("MoT");

    console.log(a.toString());
    console.log(g.wordToGuess);
    console.log(g.wordClear);
    console.log(g.wordHidden);
    console.log(g.checkWin(""));
    console.log(g.letterinWord('m'));
    console.log(g.letterinWord('T'));
    //console.log(g.letterinWord('O'));
    console.log(g.letterinWord('p'));
    console.log(g.wordHidden);
    console.log(g.checkWin("mot"));*/

}
