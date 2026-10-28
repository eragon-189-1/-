import asyncio
import websockets
from websockets.exceptions import ConnectionClosedError, ConnectionClosedOK
import sys
import datetime
import traceback
import os
from pathlib import Path
from dotenv import load_dotenv
load_dotenv(Path(__file__).resolve().parent / ".env", override=True)
sys.setrecursionlimit(10**5)


chatName = os.getenv("CHAT_NAME", "MAIN")
address = os.getenv("HOST", "0.0.0.0")
port = int(os.getenv("PORT", "8080"))
API_KEY = os.getenv("API", "")
API_PROVIDER = os.getenv("APIPRO", "")
APIprovider =  str(API_PROVIDER).lower()


print(chatName)
print(address)
print(port)


hasApi = False
if not(API_KEY == "" or API_KEY == None):
    hasApi = True
clients = []
nicknames = []

def printLog(client, name, acction):
    date = datetime.datetime.now()
    ms = date.strftime('%f')
    dateWoMs = str(date).removesuffix(f'.{ms}')#remove milliseconds from datetime  
    print(f'{dateWoMs}  {client}:{name} {acction}.')#log 

def removeClient(client):
    if client not in clients:# if client does not exist then return None
        return None
    index = clients.index(client)#if it does the find index
    clients.pop(index)          #and remove client
    return nicknames.pop(index)#and nickname wile returning nickname

async def broadcast(message, sender):
    #run client.send in parrallel to save time
    name=""
    results = await asyncio.gather(*(client.send(f'{chatName}/|.|\\|{sender}/|.|\\:{message}') for client in tuple(clients)),
                                   return_exceptions=True,#return exeptions for prossesing later and dont cancel the rest
                                   )

    for client, result in zip(tuple(clients),results):#deal with errors
        if isinstance(result, (ConnectionClosedOK,ConnectionClosedError)):
                #if disconected remove them and broadcast message
            name = removeClient(client)
            if name is not None:
                await broadcast(f'{name} has left the chat.', name )
                printLog(client, name, f'has disconected from chat')
        elif isinstance(result, BaseException):
                    #if any other error remove them and print error to log
            removeClient(client)
            printLog(client, name, f"has left due to error {result}")
async def handler(websocket):
    try:
        await websocket.send("SYS/|.|\\|NICK")#send /.\NICK to tell cleint to send us the nickname 
        name = await websocket.recv()#recive nickname
        while name not in nicknames:
                try:

                    printLog(websocket, None , f'has tried existing name {name}')
                    name = await websocket.send("SYS/|.|\\|NICK_EXISTS")# if name already exists; try again

                except (ConnectionClosedError,ConnectionClosedOK):
                    printLog(websocket, name, 'has disconected from chat normally')
                    return
                except:
                    printLog(websocket, name, f'disconected from chat with error: {traceback.format_exc()}')
                    return
    
        nicknames.append(name)
        clients.append(websocket)

        await websocket.send(f"SYS/|.|\\|CHAT_NAME/|.|\\:{chatName}")
        await websocket.send(f"SYS/|.|\\|API/|.|\\:{hasApi}")
        printLog(websocket, name, 'has successfully joined chat')

        async for message in websocket: #get message from websocket conection
            header, rawBody = twoSplit(message, "/|.|\\|")
            bodyHeader, body = twoSplit(rawBody, "/|.|\\:")
            if header == None or bodyHeader == None or body == None:
                break
            if header == chatName:
                await broadcast(body, bodyHeader)#broadcast mesage to all
            elif header == "API":
                pass
#               await API_CLIENT(APIprovider,body)
            printLog(websocket, name, f'said {message}')
    except (ConnectionClosedError,ConnectionClosedOK):
        printLog(websocket, name, 'has disconected from chat normally')
    except:
        printLog(websocket, name, f'disconected from chat with error: {traceback.format_exc()}')
    finally:
        if websocket in clients:
            name = removeClient(websocket)   
            if name is not None: 
                await broadcast(f"{name} has left the chat", name)
    
async def main():
    print("starting server.")
    try:
        async with websockets.serve(handler, address, port):
            await asyncio.Future()
    except:
        printLog(None, None, f'Error starting:{traceback.format_exc()}')

def twoSplit(text,split):
    if (split not in text):
        return text
    header, body = text.split(split, 1)
    return [header, body]

async def API_CLIENT(prompt, client):
    if "gemini" in client:
        await geminiAPI(prompt, client)
    elif "grok" in client:
        pass
    elif "openai" in client:
        pass
    elif "deepseek" in client:
        pass
    elif "anthropic" in client:
        pass
    else:
        printLog(None,None,"Unsoported client")

async def geminiAPI(prompt,model):
    from google import genai
    gemini = genai.Client(api_key=API_KEY)
    responce = await asyncio.to_thread(
        gemini.models.genarate_content,
        model=model,
        contents=prompt
                                        )
    return responce.text or ""

if __name__ == "__main__":
    asyncio.run(main())