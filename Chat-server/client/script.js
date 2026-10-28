const messageEl = document.getElementById("messageInput")
const chatBodyEl = document.getElementById("chatBody")
const butt = document.getElementById("send")
const chatsBody = document.getElementById("chats")
let hasAPI = false
if (messageEl === null || chatBodyEl === null || butt === null || chatsBody === null){
    alert(`messageEl:${messageEl}, chatBodyEl:${chatBodyEl}, butt:${butt}, chatsBody:${chatsBody}`)
    throw new Error(`messageEl:${messageEl}, chatBodyEl:${chatBodyEl}, butt:${butt}, chatsBody:${chatsBody}`);
}
let hasConnected = false
const protocol = "wss://";
let Url = `${URLparser(prompt("Enter Url/URL (Will default to demo if left blank):"))}`
if (Url == "" || Url == null){
    Url = "chat.eragon189.hackclub.app"
}
const websocket = new WebSocket(`${protocol}${Url}`);
let yourNickname = ""
let API = ""
let el;
let curChatName = ""

websocket.addEventListener("open", () => {
    console.log(`Connected to: ${protocol}${Url}`)
    el = document.createElement("div")
    chatsBody.append(el)
    hasConnected = true;
    document.querySelector("title").textContnt = "Chat-Conected"
})
websocket.addEventListener("message", (mess)=> {
    let [head, rawBody] = twoSplit(mess.data,"/|.|\\|")
    let [sender, message] = twoSplit(rawBody,"/|.|\\:")
    if (head === "SYS"){
        if (sender === "NICK"){
        getNick(false)
        return;

        }else if (sender === "NICK_EXISTS"){
            getNick(true)
            return;

        }else if(sender === "CHAT_NAME"){
            curChatName = message
            el.textContent = message
        }else if(sender === "API"){
            let tempbool = hasAPI
            if(String(body).toLowerCase() === "false"){
                tempbool = false
            }else if(String(body).toLowerCase() === "true"){
                tempbool = true
            }
            hasAPI = tempbool
            el = document.createElement("div")
            el.textContent = "AI"
            chatsBody.append(el)
        }
    }else if (head === curChatName){
        displayMessage(sender,message)
    }else if (head === "API"){
        displayMessage(sender,message)
    }else{
        alert('Unknown header. Please try agin later.')
        websocket.close()
    }
})
butt.addEventListener("click", ()=>{
    sendMessage()
})
function URLparser(URL){
    if (URL === null || URL === "" || !(URL.includes("."))){
    alert("Please reload and enter a valid Url/URL.")
    throw new Error(`No nickname`);    
}
    const PREFIXS = ["www.", "https://", "http://", "ws://", "wss://"]
    for(let i = 0; i<PREFIXS.length; i++){
        if (URL.startsWith(PREFIXS[i])) {
            URL = URL.slice(PREFIXS[i].length);
        }
    }
    if(URL.endsWith("/")){
        URL = URL.slice(0, -1); 
    }
    return `${URL}`
}

function getNick(exists){
    let message = "Please enter a nickname:"
    if(exists){  
        message = "Please enter a diffrent nickname. That one is taken:"
    }
    let val = prompt(message)
    if(val === null || val === ""){
        alert("Did not enter a nickname. Reload and try again")
        throw new Error(`Did not enter a nickname`)
    }
    yourNickname = val
    if (websocket.readyState === websocket.OPEN){
        websocket.send(`${val}`)
    }else if (websocket.readyState === websocket.CLOSED) {
        alert("Websocket closed. Please reload.")
        throw new Error(`Connection closed`);
    } else {
        alert("Websocket state error. Please reload.")
        throw new Error(`State:${websocket.readyState}`);
    }
}
    

function twoSplit(mess,split){
    let messages = String(mess).split(split)
    let header = messages[0]
    let body = messages[1]
    if (body === undefined){
        body = ""
    }
    for(let i = 2; i < (messages.length);i++){
        body = `${body}${split}${messages[i]}`
    }
    return [header, body]
}

function displayMessage(sender, message){
    let color = "#606070"
    if(sender === yourNickname){
        sender = "You"
        color = "#2525F0"
    }
    let container = document.createElement("div")
    let messageEle = document.createElement("p")
    let senderEl = document.createElement("p")
    senderEl.style = `font-weight:bold; font-size:20px; width:100%; background-color: ${color};`
    senderEl.textContent = sender
    senderEl.className = "messages"
    messageEle.style = `font-size:25px;`
    messageEle.textContent = message
    messageEle.className = "messages"
    container.style = `width:100; font-size:15px;  display: flex; flex-direction: column;` 
    
    container.append(senderEl)
    container.append(messageEle)
    chatBodyEl.append(container)
}

function sendMessage(isAPI){
    let messa = messageEl.value
    if(isAPI){
        messa = `MESSAGE/|.|\\|API/|.|\\:${messa}`
    }else{
        messa = `${curChatName}/|.|\\|${yourNickname}/|.|\\:${messa}`
    }
    if(messa === "" || messa === null){
        return ;
    }
    if (websocket.readyState === websocket.OPEN){
        websocket.send(messa);
        messageEl.value = ""
    }else if(hasConnected === false){
        alert("Never conected. Please reload and check URI.");
        throw new Error(`Never Conected to websocket`);
    }else if (websocket.readyState === websocket.CLOSED) {
        alert("websocket closed reload.");
        throw new Error(`Connection closed`);
    }else {
        alert("websocket state error. Please reload.");
        throw new Error(`State:${websocket.readyState}`);
    }
}

function displayPopup(type){
    let background = document.createElement("div")
    background.style = "background-color: #40404060"
    document.body.append(background)
    if (type === "sign-in"){
        let popupBody = document.createElement("div")
        popupBody.style = "hi"
    }
     

}