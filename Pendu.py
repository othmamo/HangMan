
class Game:
    def __init__(self, word):
        self.wordToGuess = word
        self.wordClear = word.lower()
        self.wordHidden = ["_"] * len(word)
        self.running = True

    def letterinWord(self, l):
        l = l.lower()
        if l not in self.wordClear:
            return False
        for i in range(len(self.wordClear)):
            if (self.wordClear[i] == l):
                self.wordHidden[i] = self.wordToGuess[i]
        return True

    """def guessLetter(self, l):
        if (self.letterinWord(l)):
            return l + " found in word!"
        return l + " not found in word!"

    def readEntry(self):
        read = input("Enter a letter or directly guess the word:")
        if (len(read) == 0):
            return self.readEntry()
        elif (len(read) > 1 and self.scoreWord <= 0):
            print("No guesses available.")
            return self.readEntry()
        return read

    def printState(self):
        print("Word guesses left: " + str(self.scoreWord))
        print("Current state: " + "".join(self.wordHidden))
    """

    def checkWin(self, read):
        if (self.wordHidden.count('_') == 0 or read.lower() == self.wordClear):
            return True
        return False

    def quickGame(self):
        while(self.running):
            read = self.readEntry()
            if (len(read) > 1):
                self.scoreWord -= 1
            elif (len(read) == 1):
                print(self.guessLetter(read))
            if (self.checkWin(read)):
                print("\nCongratulations! You Won!!\nThe word was: " + "".join(self.wordToGuess))
                break
            self.printState()
            print()

import asyncio
import json
import logging
import websockets

logging.basicConfig()

STATE = {"value": 0}

USERS = set()


def state_event():
    return json.dumps({"type": "state", **STATE})


def users_event():
    return json.dumps({"type": "users", "count": len(USERS)})


async def notify_state():
    if USERS:  # asyncio.wait doesn't accept an empty list
        message = state_event()
        await asyncio.wait([user.send(message) for user in USERS])


async def notify_users():
    if USERS:  # asyncio.wait doesn't accept an empty list
        message = users_event()
        await asyncio.wait([user.send(message) for user in USERS])


async def register(websocket):
    USERS.add(websocket)
    await notify_users()


async def unregister(websocket):
    USERS.remove(websocket)
    await notify_users()


async def counter(websocket, path):
    # register(websocket) sends user_event() to websocket
    await register(websocket)
    try:
        await websocket.send(state_event())
        async for message in websocket:
            data = json.loads(message)
            print(data)
            if data["action"] == "minus":
                STATE["value"] -= 1
                await notify_state()
            elif data["action"] == "plus":
                STATE["value"] += 1
                await notify_state()
            else:
                logging.error("unsupported event: %s", data)
    finally:
        await unregister(websocket)


start_server = websockets.serve(counter, "localhost", 2048)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
