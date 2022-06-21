let sidebar = document.getElementById("sidebar")
let sideBarButton = document.getElementById("sidebarButton")
let moreInfo = document.getElementById("moreInfo")
sideBarButton.onclick = toggleSideBar
let sideBarIsOpen = false
let moreInfoIsOpen = false
let searchText = ""
let searchingDescriptsions = true
let exactSearch = false
let showingToDo = false
let totalEvents = []
let generalSettings = JSON.parse(localStorage.generalSettings || "{}") || {}

function saveSettings(){
	localStorage.generalSettings = JSON.stringify(generalSettings)
}

function settingsChanged(){
	generalSettings = JSON.parse(localStorage.generalSettings || "{}") || {}
	
	if(document.getElementById("switchperiodnextbutton")) document.getElementById("switchperiodnextbutton").innerHTML = generalSettings.ShowTimeTillNextPeriodAlways?"Always":"Only when selected"
	if(document.getElementById("selectedPeriodHide")) document.getElementById("selectedPeriodHide").style.display = generalSettings.ShowTimeTillNextPeriodAlways?"":"none"
	if(document.getElementById("selectedPeriodSetting")) document.getElementById("selectedPeriodSetting").value = generalSettings.SelectedPeriodSetting
	updateSidebarText()
}

function toggleSideBar() {
    if (sideBarIsOpen) {
        if (moreInfoIsOpen) {
            closeElementInfo()
        } else {
            closeSideBar()
        }
    } else {
        openSideBar()
    }
}

async function openSideBar() {
    if (events.length === 0) {
        loadCalender()
    }

    sideBarIsOpen = true
    sidebar.style.right = "0"
    sidebarButton.style.right = "42vw"
    sidebarButton.style.transform = "rotate(180deg)"
}

async function closeSideBar() {

    sidebar.style.right = ""
    sidebarButton.style.right = ""
    sidebarButton.style.transform = "rotate(0deg)"

    sideBarIsOpen = false
}


async function updateSidebarText() {
    let tagSearching = false
    let locationSearching = false
    Object.keys(tagSearch).forEach(a => {
        if (tagSearch[a]) {
            tagSearching = true
        }
    })
    Object.keys(locationSearch).forEach(a => {
        if (locationSearch[a]) {
            locationSearching = true
        }
    })
    if (!showingToDo) {
        allEvents = allEvents.filter((a) => { return !(a.timestamp === undefined || new Date().getTime() - a.timestamp > 0) })
    }
    if (exactSearch) {
        allEvents = allEvents.filter((a) => { return a.name.toLowerCase().includes(searchText.toLowerCase()) || (searchingDescriptsions && (a.info || "").toLowerCase().includes(searchText.toLowerCase())) })
        if (tagSearching) {
            allEvents = allEvents.filter((e) => {
                let ret = false
                Object.keys(tagSearch).forEach(a => {
                    if (tagSearch[a]) {
                        if ((e.tags || []).includes(a)) {
                            ret = true
                        }
                    }
                })
                return ret;
            })
        }
        if (locationSearching) {
            allEvents = allEvents.filter((e) => {
                let ret = false
                Object.keys(locationSearch).forEach(a => {
                    if (locationSearch[a]) {
                        if (e.location === a) {
                            ret = true
                        }
                    }
                })
                return ret;
            })
        }
    }
    allEvents = allEvents.sort((a, b) => {
        return a.timestamp - b.timestamp
    })
    if (!exactSearch && (searchText.replace(/     /g, "") !== "" || tagSearching || locationSearching)) {
        let eventsScore = {}
        allEvents.forEach((e) => {
            eventsScore[e.eventId + ": " + e.name] = 0
            if (searchText.replace(/     /g, "") !== "") {
                if (e.name.toLowerCase().includes(searchText.toLowerCase())) {
                    eventsScore[e.eventId + ": " + e.name] += 1000
                }
                if (e.info) {
                    if (e.info.toLowerCase().includes(searchText.toLowerCase())) {
                        eventsScore[e.eventId + ": " + e.name] += searchingDescriptsions ? 500 : 100
                    }
                }
                searchText.toLowerCase().split(" ").forEach((text) => {
                    if (e.name.toLowerCase().includes(text)) {
                        eventsScore[e.eventId + ": " + e.name] += 100
                    }
                    if (e.info) {
                        if (e.info.toLowerCase().includes(text)) {
                            eventsScore[e.eventId + ": " + e.name] += searchingDescriptsions ? 50 : 10
                        }
                    }
                })
            }
            if (tagSearching) {
                Object.keys(tagSearch).forEach(a => {
                    if (tagSearch[a]) {
                        if ((e.tags || []).includes(a)) {
                            eventsScore[e.eventId + ": " + e.name] += 1000
                        }
                    }
                })
            }
            if (locationSearching) {
                Object.keys(locationSearch).forEach(a => {
                    if (locationSearch[a]) {
                        if (e.location === a) {
                            eventsScore[e.eventId + ": " + e.name] += 1000
                        }
                    }
                })
            }
        })
        allEvents = allEvents.filter((a) => {
            return eventsScore[a.eventId + ": " + a.name] !== 0
        })
        allEvents = allEvents.sort((b, a) => {
            return eventsScore[a.eventId + ": " + a.name] - eventsScore[b.eventId + ": " + b.name]
        })
    }


    let html = "<h1 style='text-align: center;font-size: 5vw;' id='eventsText'>" + (showingToDo ? "TO&nbsp;DO'S" : "EVENTS") + " <button id='openSettingsButton'>Settings</button><button id='openSearchButton'>Search</button><button id='openNoticesButton'>Daily Notices</button></h1>"

    if (!tagSearching && !locationSearching && searchText === "") {
        html += "<table style='width: 100%;'><tr>"
        html += "<th style='width: 45%;'>"
        html += "<div id='addCGroup' class='eventInfo' style='width: 85%;'>"
        html += "<h2 style='text-align: center;'>Add " + (showingToDo ? "new TO&nbsp;DO" : "custom event") + "</h2>"
        html += "</div>"
        html += "</th>"
        html += "<th style='width: 45%;'>"
        html += "<div id='switchButton' class='eventInfo' style='width: 85%;float: right;'>"
        html += "<h2 style='text-align: center;'>" + (showingToDo ? "EVENTS" : "TO&nbsp;DO'S") + "</h2>"
        html += "</div>"
        html += "</th>"
        html += "</tr></table>"
    }
    let now = Date.now()-(new Date().getHours()+1)*1000*60*60
    if (!tagSearching && !locationSearching && !showingToDo && !generalSettings.ShowTimeTillNextPeriodAlways) {
        Object.keys(schoolEndsGroups).forEach((key) => {
            let groupName = key.replace(/_/g, " ")
            if (exactSearch) {
                if (groupName.toLowerCase().includes(searchText.toLowerCase())) {
                    html += "<div id='selectGroup_" + key + "' class='eventInfo'>"
                    html += "<h2 style='width: 75%;text-align: center;'>" + groupName + "</h2>"
                    html += "</div>"
                }
            } else {
                if (searchText !== "") {
                    let done = false
                    searchText.split(" ").forEach((str) => {
                        if (!done && groupName.toLowerCase().includes(str.toLowerCase())) {
                            done = true
                            html += "<div id='selectGroup_" + key + "' class='eventInfo'>"
                            html += "<h2 style='width: 75%;text-align: center;'>" + groupName + "</h2>"
                            html += "</div>"
                        }
                    })
                } else {
                    html += "<div id='selectGroup_" + key + "' class='eventInfo'>"
                    html += "<h2 style='width: 75%;text-align: center;'>" + groupName + "</h2>"
                    html += "</div>"
                }
            }
        })
    }
    allEvents.forEach((event, i) => {
        let timestamp2 = new Date(event.timestamp)
        timestamp2.setMinutes(0, 0, 1)
        let timesince = timestamp2 - now

        html += "<div class='eventInfo' id='openElementInfo_" + i + "'>"
        let timeTill = Math.floor((timesince) / (1000 * 60 * 60 * 24))
        let timeTillStr = timeTill + "&nbsp;days"
        if (timeTill === 0) {
            timeTillStr = "Today"
        }
        if (timeTill === 1) {
            timeTillStr = "Tommorow"
        }
        html += "<table style='width: 100%;'><tr>"
        html += "<td style='border: none;'><h2 style='text-align: center;'>" + event.name + "</h2></td>"
        html += "<td style='border: none;'><h2 style='text-align: right;'>" + timeTillStr + "</h2></td>"
        html += "</table></tr>"
        // html += "<button id='selectEvent_" + i + "'>Select</button>"
        // if (event.eventId) {
        //     html += "<button id='openElement_" + i + "'>Open in school website</button>"
        // } else if (event.tags.includes("Custom event")) {
        //     html += "<button id='editElement_" + i + "'>Edit</button>"
        // }
        // html += "<button id='openElementInfo_" + i + "'>More info</button>"
        html += "</div>"
    })

    sidebar.innerHTML = html

    await wait(0)

    let elm = document.getElementById("openSettingsButton")
    if (elm !== null) {
        elm.onclick = () => { openSettings() }
    }
    elm = document.getElementById("openSearchButton")
    if (elm !== null) {
        elm.onclick = () => { openSearchButton() }
    }
    elm = document.getElementById("openNoticesButton")
    if (elm !== null) {
        elm.onclick = () => { openDailyNotices() }
    }

    allEvents.forEach((event, i) => {
        let elm = document.getElementById("selectEvent_" + i)
        if (elm !== null) {
            elm.onclick = () => { selectEvent(i) }
            elm.onmousemove = (a) => {
                showMoreInfoHover(a)
            }
            elm.onmouseleave = () => {
                document.getElementById("moreInfoButtonHover").style.left = -10000 + "px";
            }
            elm.onmouseenter = () => {
                let timeTillS = getTimeTill2sig(event.timestamp)
                showMoreInfoHoverLoad("<h3 style='text-align: center;vertical-align: center;font-size: 30px;'>" + timeTillS + "</h3>", 20 * timeTillS.length + 17 + 17 + 17 + "px", 33 + "px")
            }
        }
        elm = document.getElementById("openElement_" + i)
        if (elm !== null) {
            elm.onclick = () => { window.open("https://swanviewshs.schoolzineplus.com/event/" + event.eventId, '_blank'); }

        }
        elm = document.getElementById("openElementInfo_" + i)
        if (elm !== null) {
            elm.onclick = () => {
                openElementInfo(i)
            }
            elm.onmousemove = (a) => {
                showMoreInfoHover(a)
            }
            elm.onmouseleave = () => {
                document.getElementById("moreInfoButtonHover").style.left = -10000 + "px";
            }
            elm.onmouseenter = () => {
                showMoreInfoHoverLoad(i, 40 + "vh", Math.min(60, 25 + event.tags.length + (event.info.length - (event.tags.includes("Custom event") ? 59 : 160)) / 5) + "vh")
            }
        }
        elm = document.getElementById("editElement_" + i)
        if (elm !== null) {
            elm.onclick = () => {
                edit(i)
            }
        }
    })
    Object.keys(schoolEndsGroups).forEach((key) => {
        let elm = document.getElementById("selectGroup_" + key)
        if (elm !== null) {
            elm.onclick = () => { selectGroup(key) }
            elm.onmousemove = (a) => {
                showMoreInfoHover(a)
            }
            elm.onmouseleave = () => {
                document.getElementById("moreInfoButtonHover").style.left = -10000 + "px";
            }
            elm.onmouseenter = () => {
                showMoreInfoHoverLoad("<h3 style='text-align: center;vertical-align: center;font-size: 30px;'>Click to select the " + (key.replace(/_/g, " ")) + " group</h3>", 40 + "vh", 15 + "vh")
            }
        }
    })
    elm = document.getElementById("addCGroup")
    if (elm !== null) {
        elm.onclick = () => { addCGroup() }
        elm.onmousemove = (a) => {
            showMoreInfoHover(a)
        }
        elm.onmouseleave = () => {
            document.getElementById("moreInfoButtonHover").style.left = -10000 + "px";
        }
        elm.onmouseenter = () => {
            showMoreInfoHoverLoad("<h3 style='text-align: center;vertical-align: center;font-size: 30px;'>Click to create a " + (showingToDo ? "new TO&nbsp;DO" : "custom event") + "</h3>", 40 + "vh", 15 + "vh")
        }
    }
    elm = document.getElementById("switchButton")
    if (elm !== null) {
        elm.onclick = () => { openToDo() }
        elm.onmousemove = (a) => {
            showMoreInfoHover(a)
        }
        elm.onmouseleave = () => {
            document.getElementById("moreInfoButtonHover").style.left = -10000 + "px";
        }
        elm.onmouseenter = () => {
            showMoreInfoHoverLoad("<h3 style='text-align: center;vertical-align: center;font-size: 30px;'>Click to open the " + (showingToDo ? "events" : "TO&nbsp;DO's") + " list</h3>", 40 + "vh", 15 + "vh")
        }
    }


}

let dailyNoticesHtml
let newsHtml
async function openDailyNotices(){
        
    if(!dailyNoticesHtml){
        dailyNoticesHtml = "loading"
        fetch('https://swanviewshs.schoolzineplus.com/newsletter/search/3.shtml').then(data=>data.text()).then(data=>dailyNoticesHtml = data.replace(/<a href=/g,"<a target=\"_blank\" href="))
    }
    if(!newsHtml){
        
        //TODO: Make a custom api to load the news id because it redirects to a http site D:
        newsHtml = "loading";
                fetch("https://soopymc.my.to/latestNewsLetter").then(data=>data.text()).then(data=>newsHtml = data.replace(/<a href=/g,"<a target=\"_blank\" href="))
    }

    moreInfo.innerHTML = "<button style='width: 50%;height: 10%;margin: 25%;' id='dailyButton'>Daily Notices</button><br><button style='width: 50%;height: 10%;margin: 25%;' id='newsButton'>News</button>"

    moreInfo.style.right = "0px"

    sidebar.style.right = "40vw"

    sidebarButton.style.right = "82vw"
    
    moreInfoIsOpen = true
    
    await wait(0)
    
    
    let elm = document.getElementById("dailyButton")
    if (elm !== null) {
        elm.onclick = () => { openNews(false) }
    }
    elm = document.getElementById("newsButton")
    if (elm !== null) {
        elm.onclick = () => { openNews(true) }
    }
}

async function openNews(isNews){
    moreInfo.innerHTML = "<h1 class='event-calendar-title sub-txt' style='text-align: center;'>" + (isNews?"News":"Daily Notices") + "</h1><div style='padding: 10px;'>Loading...</div>"

    while(!(isNews?newsHtml:dailyNoticesHtml) || (isNews?newsHtml:dailyNoticesHtml)==="loading"){
        await wait(100)
    }
    
    moreInfo.innerHTML = "<h1 class='event-calendar-title sub-txt' style='text-align: center;'>" + (isNews?"News":"Daily Notices") + "</h1><div style='padding: 10px;'>" + (isNews?newsHtml:dailyNoticesHtml) + "</div>"
}

let elm = document.getElementById("openSettingsButton")
if (elm !== null) {
    elm.onclick = () => { openSettings() }
}
elm = document.getElementById("openSearchButton")
if (elm !== null) {
    elm.onclick = () => { openSearchButton() }
}

async function openToDo() {
    showingToDo = !showingToDo

    genAllEvents()
    closeElementInfo()
}

function updateToDoContents() {
    let elm = document.getElementById("toDoContents")
    if (!elm) return;

    let html = ""
    toDo.forEach((todo, i) => {
        html += `<div>${todo.name}</div>`
    })

    elm.innerHTML = html
}

function saveToDo() {
    localStorage.toDo = JSON.stringify(toDo)
}

function showMoreInfoHoverLoad(i, width, height) {
    document.getElementById("moreInfoButtonHover").style.width = width
    document.getElementById("moreInfoButtonHover").style.height = height
    let html = ""

    if (typeof (i) === "number") {

        let timeTillS = getTimeTill2sig(allEvents[i].timestamp)
        html = "<h3 style='text-align: center;vertical-align: center;font-size: 30px;'>" + timeTillS + "</h3>"
        if (allEvents[i].location) {
            html += "<h2 class='event-calendar-title sub-txt' style='text-align: center;'><strong>Location: </strong>" + allEvents[i].location + "</h2>"
        }
        html += "<br><h3 class='event-calendar-title sub-txt' style='text-align: center;'>Tags: " + allEvents[i].tags.join(", ") + "</h3><br>" + allEvents[i].info
    } else {
        html = i
    }
    document.getElementById("moreInfoButtonHover").innerHTML = html
}

function showMoreInfoHover(pos) {
    let boxWidth = parseInt(document.getElementById("moreInfoButtonHover").style.width.includes("px") ? document.getElementById("moreInfoButtonHover").style.width.replace("px", "") : (pos.view.innerHeight / 100 * document.getElementById("moreInfoButtonHover").style.width.replace("vh", "")))
    let boxHeight = parseInt(document.getElementById("moreInfoButtonHover").style.height.includes("px") ? document.getElementById("moreInfoButtonHover").style.height.replace("px", "") : (pos.view.innerHeight / 100 * document.getElementById("moreInfoButtonHover").style.height.replace("vh", "")))
    let rhB = pos.x + boxWidth + 15 > pos.view.innerWidth - 5
    document.getElementById("moreInfoButtonHover").style.left = ((rhB ? pos.x - boxWidth - 15 : pos.x + 15)) + "px";
    document.getElementById("moreInfoButtonHover").style.top = (Math.min(pos.y - 15, pos.view.innerHeight - boxHeight) - 15) + "px";
}
const RGB_HEX = /^#?(?:([\da-f]{3})[\da-f]?|([\da-f]{6})(?:[\da-f]{2})?)$/i;

const hex2RGB = str => {
    const [, short, long] = String(str).match(RGB_HEX) || [];

    if (long) {
        const value = Number.parseInt(long, 16);
        return [value >> 16, value >> 8 & 0xFF, value & 0xFF];
    } else if (short) {
        return Array.from(short, s => Number.parseInt(s, 16)).map(n => (n << 4) | n);
    }
};

async function edit(index) {
    let isTodo = showingToDo
    let html = "<h1 class='event-calendar-title sub-txt' style='text-align: center;'>EDIT " + (isTodo ? "TO&nbsp;DO" : "CUSTOM EVENT") + "</h1><div id='settings'>"

    let event = {}
    let a = allEvents[index]
    let arr = (isTodo ? toDo : customEvents)
    arr.forEach((e, o) => {
        if (a.name === e.name) {
            event = e
        }
    })
    const offset = new Date().getTimezoneOffset() * 1000 * 60
    const getLocalDate = value => {
        const offsetDate = new Date(value).valueOf() - offset
        const date = new Date(offsetDate).toISOString()
        return date.substring(0, 16)
    }
    html += `<h2>Editing <small>"${event.name}"</small></h2><br>`

    html += `<br><br><h2>${isTodo ? "TO&nbsp;DO" : "Event"} time</h2>`
    html += `<input id='time' type='datetime-local'${event.timestamp?` value='${getLocalDate(event.timestamp)}'`:""}></input>`

    html += `<br><br><h2>${isTodo ? "TO&nbsp;DO" : "Event"} Description</h2>`
    html += `<textarea style="width: 90%;height: 400px;" id="newDesc">${event.info.replace(/<br>/g, "\n")}</textarea>`

    html += `<br><br>`
    html += `<div style="text-align: center;"><button id='saveButton'>Save</button><br><br><button id='deleteButton'>Delete</button></div>`

    moreInfo.innerHTML = html + '</div>'

    moreInfo.style.right = "0px"

    sidebar.style.right = "40vw"

    sidebarButton.style.right = "82vw"
    moreInfoIsOpen = true


    await wait(0)

    let elm = document.getElementById("deleteButton")
    if (elm !== null) {
        elm.onclick = () => {
            deleteAreYouSure(index)
        }
    }
    elm = document.getElementById("saveButton")
    if (elm !== null) {
        elm.onclick = () => {
            let desc = document.getElementById("newDesc").value.replace(/\n/g, "<br>")

            arr.forEach((e, o) => {
                if (event.name === e.name) {
                    if (isTodo) {
                        toDo[o].info = desc;
                        toDo[o].timestamp = new Date(document.getElementById("time").value).getTime();
                        toDo[o].dateString = document.getElementById("time").value
                    } else {
                        customEvents[o].info = desc;
                        customEvents[o].timestamp = new Date(document.getElementById("time").value).getTime();
                        customEvents[o].dateString = document.getElementById("time").value
                    }
                }
            })
            if (isTodo) {
                saveToDo()
            } else {
                saveCustomEvents()
            }
            e = allEvents[index]
            if (e.tags.includes("Custom event") || isTodo) {
                if (e.name === event.name) {
                    allEvents[index].info = "<div style=\"padding: 10px;padding-left: 20px;\"><span class=\"event-summary user-content\"><p>" + desc + "</p></span></div>"
                    allEvents[index].timestamp = new Date(document.getElementById("time").value).getTime()
                    allEvents[index].dateString = document.getElementById("time").value
                }
            }
            openElementInfo(index)
            genAllEvents()
        }
    }
}

async function deleteAreYouSure(index) {

    let html = "<br><br><br><br><br><h1 class='event-calendar-title sub-txt' style='text-align: center;'>ARE YOU SURE?</h1><div id='settings' style='text-align: center;'>"

    let eName = ""
    allEvents.forEach((a, i) => {
        if (i == index) {
            eName = a.name
        }
    })

    html += `<h2>Delete <small>"${eName}"</small>?</h2><br>`
    html += `<h3 style="color: red;">WARNING THIS CANNOT BE UNDONE!</h3><br><br>`
    html += `<button id='deleteButton'>Delete</button>`

    moreInfo.innerHTML = html + '</div>'

    await wait(0)

    let elm = document.getElementById("deleteButton")
    if (elm !== null) {
        elm.onclick = () => {
            deleteElement(index)
            closeElementInfo()
        }
    }

}

function deleteElement(index) {

    let isTodo = showingToDo

    let newAllEvents = []
    allEvents.forEach((a, i) => {
        if (i !== index) {
            newAllEvents.push(a)
        } else {
            if (isTodo) {
                toDo = toDo.filter(b => a.name != b.name)
            } else {
                customEvents = customEvents.filter(b => a.name != b.name)
            }
        }
    })
    allEvents = newAllEvents
    if (isTodo) {
        saveToDo()
    } else {
        saveCustomEvents()
    }
    genAllEvents()
}

function componentToHex(c) {
    let hex = c.toString(16);
    return hex.length == 1 ? "0" + hex : hex;
}

function rgbToHex(r, g, b) {
    if (r === "N") { return "#FFFFFF" }
    return "#" + componentToHex(r) + componentToHex(g) + componentToHex(b);
}
async function openSettings() {

    moreInfo.style.right = "0px"

    sidebar.style.right = "40vw"

    sidebarButton.style.right = "82vw"
    moreInfoIsOpen = true

    let html = "<h1 class='event-calendar-title sub-txt' style='text-align: center;'>Settings</h1><div id='settings'>"

    html += `<h2>Dark/light theme</h2>`
    html += `<button id='themeChange'>Switch to ${darktheme ? "Light" : "Dark"} theme</button>`

    html += `<br><br><h2>Color scheme</h2>`

    new Array(1, 2, 3, 4, 5).forEach((num, i) => {
        html += `Color ${num} <input value="${rgbToHex(...colorSchemeTemplate[i])}" id="pickColor_${num}" type="color" /> <input id="randomColor_${num}" type="checkbox" name="randomColor"${colorSchemeTemplate[i] === "N" ? " checked" : ""}> Random<br>`
    })

    html += `<br><br><h2>Other settings</h2>`
	html += `Show time till next period always: <button id="switchperiodnextbutton">${generalSettings.ShowTimeTillNextPeriodAlways?"Always":"Only when selected"}</button><br>`
	html += `<span id="selectedPeriodHide"${generalSettings.ShowTimeTillNextPeriodAlways?"":" style='display: none;'"}>The selected period group: <select id="selectedPeriodSetting">`
	
	Object.keys(schoolEndsGroups).forEach((key) => {
		let groupName = key.replace(/_/g, " ")
		html += `<option${key===generalSettings.SelectedPeriodSetting?" selected='selected'":""} value="${key}">${groupName}</option>`
	})
	html += "</select></span><br>"
	
	html += `<button id="reloadEvents">Reload events list</button><br>`

    moreInfo.innerHTML = html + '</div>'

    await wait(0)

    let elm = document.getElementById("themeChange")
    if (elm !== null) {
        elm.onclick = () => {
            localStorage.darktheme = !darktheme
        }
    }
    let elm2 = document.getElementById("switchperiodnextbutton")
    if (elm2 !== null) {
        elm2.onclick = () => {
            generalSettings.ShowTimeTillNextPeriodAlways = !generalSettings.ShowTimeTillNextPeriodAlways
			saveSettings()
        }
    }
	let elm3 = document.getElementById("selectedPeriodSetting")
	if(elm3 !== null){
		elm3.onchange = ()=>{
			generalSettings.SelectedPeriodSetting = elm3.value
			saveSettings()
		}
	}
	let elm4 = document.getElementById("reloadEvents")
	if(elm4 !== null){
		elm4.onclick = ()=>{
			downLoadCalender()
		}
	}
}
let tagSearch = {}
let locationSearch = {}
async function openSearchButton() {


    moreInfo.style.right = "0px"

    sidebar.style.right = "40vw"

    sidebarButton.style.right = "82vw"
    moreInfoIsOpen = true

    let html = "<h1 class='event-calendar-title sub-txt' style='text-align: center;'>Search</h1><div id='search'>"

    html += `<h2>Normal search</h2>`

    html += `<input type="text" id="searchHere" value="${searchText}"> <input id="searchingDesc" type="checkbox" name="searchingDesc"${searchingDescriptsions ? " checked" : ""}> Search description <input id="exactSearch" type="checkbox" name="exactSearch"> Exact search<br><br>`

    html += `<h2>Search Tags</h2>`

    html += "<div style='height: 100px;overflow-y: auto;'>"
    Object.keys(allTags).sort((a, b) => { return allTags[b] - allTags[a] }).forEach((tag, i) => {
        html += `<input id="tag_${i}" type="checkbox" name="tag_${i}"${tagSearch[tag] ? " checked" : ""}> ${tag}<br>`
    })
    html += "</div>"

    html += `<h2>Search Locations</h2>`

    html += "<div style='height: 100px;overflow-y: auto;'>"
    Object.keys(allLocations).sort((a, b) => { return allLocations[b] - allLocations[a] }).forEach((location, i) => {
        html += `<input id="location_${i}" type="checkbox" name="location_${i}"${locationSearch[location] ? " checked" : ""}> ${location}<br>`
    })
    html += "</div>"

    html += `<h2>Advanced search</h2>`


    moreInfo.innerHTML = html + '</div>'

    await wait(0)

    let elm = document.getElementById("searchingDesc")
    if (elm !== null) {
        elm.onchange = () => {
            searchingDescriptsions = elm.checked
            genAllEvents()
        }
    }
    let elm2 = document.getElementById("searchHere")
    if (elm2 !== null) {
        elm2.oninput = () => {
            searchText = elm2.value
            genAllEvents()
        }
    }
    let elm3 = document.getElementById("exactSearch")
    if (elm3 !== null) {
        elm3.onchange = () => {
            exactSearch = elm3.checked
            genAllEvents()
        }
    }
    Object.keys(allTags).sort((a, b) => { return allTags[b] - allTags[a] }).forEach((tag, i) => {
        let elm4 = document.getElementById("tag_" + i)
        if (elm4 !== null) {
            elm4.onchange = () => {
                tagSearch[tag] = elm4.checked
                genAllEvents()
            }
        }
    })
    Object.keys(allLocations).sort((a, b) => { return allLocations[b] - allLocations[a] }).forEach((location, i) => {
        let elm4 = document.getElementById("location_" + i)
        if (elm4 !== null) {
            elm4.onchange = () => {
                locationSearch[location] = elm4.checked
                genAllEvents()
            }
        }
    })
}
async function addCGroup() {
    let isTodo = showingToDo
    moreInfo.style.right = "0px"

    sidebar.style.right = "40vw"

    sidebarButton.style.right = "82vw"
    moreInfoIsOpen = true


    let html = "<h1 class='event-calendar-title sub-txt' style='text-align: center;'>Add " + (isTodo ? "new TO&nbsp;DO" : "custom event") + "</h1><div id='settings'>"

    html += `<h2>${isTodo ? "TO&nbsp;DO" : "Event"} name</h2>`
    html += `<input id='eventName'></input>`

    html += `<br><br><h2>${isTodo ? "TO&nbsp;DO" : "Event"} time</h2>`
    html += `<input id='time' type='datetime-local'></input>`

    html += `<br><br><h2>${isTodo ? "TO&nbsp;DO" : "Event"} Description</h2>`
    html += `<textarea style="width: 90%;height: 400px;" id='description'></textarea>`

    html += `<br><br><button id='addButton'>Add ${isTodo ? "TO&nbsp;DO" : "event"}</button>`


    moreInfo.innerHTML = html + '</div>'

    await wait(0)

    let elm = document.getElementById("addButton")
    if (elm !== null) {
        elm.onclick = () => {
            addCustomEvent(isTodo)
        }
    }
}

async function addCustomEvent(isTodo) {
    if (!isTodo) {
        let cont = true
        allEvents.forEach((a) => {
            if (a.name === document.getElementById("eventName").value && cont) {
                cont = false
                alert("There is allready an event with that name")
            }
        })
        if (!cont) return
        customEvents.push({
            dateString: document.getElementById("time").value,
            info: document.getElementById("description").value.replace(/\n/g, "<br>"),
            name: document.getElementById("eventName").value,
            timestamp: new Date(document.getElementById("time").value).getTime()
        })
        saveCustomEvents()
    } else {
        toDo.push({
            dateString: document.getElementById("time").value,
            info: document.getElementById("description").value.replace(/\n/g, "<br>"),
            name: document.getElementById("eventName").value,
            timestamp: new Date(document.getElementById("time").value).getTime()
        })
        saveToDo()
    }

    closeElementInfo()
    genAllEvents()
}

function saveCustomEvents() {
    localStorage.customEvents = JSON.stringify(customEvents)
}

let allTags = {}
let allLocations = {}

function genAllEvents() {
    allTags = {}
    allLocations = {}
    allEvents = []
    if (showingToDo) {
        allEvents.push(...toDo.map((e) => {
            return {
                dateString: e.dateString,
                eventId: undefined,
                info: "<div style=\"padding: 10px;padding-left: 20px;\"><span class=\"event-summary user-content\"><p>" + e.info + "</p></span></div>",
                name: e.name,
                tags: ["TO&nbsp;DO"],
                timestamp: e.timestamp
            }
        }))
    } else {
        allEvents.push(...events)
        allEvents.push(...customEvents.map((e) => {
            return {
                dateString: e.dateString,
                eventId: undefined,
                info: "<div style=\"padding: 10px;padding-left: 20px;\"><span class=\"event-summary user-content\"><p>" + e.info + "</p></span></div>",
                name: e.name,
                tags: ["Custom event"],
                timestamp: e.timestamp
            }
        }))
    }
    totalEvents = allEvents

    allEvents.forEach((e) => {
        if (Date.now() - e.timestamp > 0) return;
        e.tags.forEach((t) => {
            allTags[t] = (allTags[t] || 0) + 1
        })
        if (e.location) {
            if (!allLocations[e.location]) {
                allLocations[e.location] = 0
            }
            allLocations[e.location]++
        }
    })

    updateSidebarText()

}
let lastVal = localStorage.colorSchemeTemplate
async function updateColorsArray() {
    if (lastVal !== localStorage.colorSchemeTemplate) {
        colorSchemeTemplate = JSON.parse(localStorage.colorSchemeTemplate)
        randomColorScheme(colorSchemeTemplate)
        lastVal = localStorage.colorSchemeTemplate
        new Array(1, 2, 3, 4, 5).forEach((num, i) => {
            document.getElementById("randomColor_" + num).checked = colorSchemeTemplate[i] === "N"

            document.getElementById("pickColor_" + num).value = rgbToHex(...colorSchemeTemplate[i])
        })
        return;
    }
    new Array(1, 2, 3, 4, 5).forEach((num, i) => {
        let elm = document.getElementById("randomColor_" + num)
        if (!elm) return;
        if (elm.checked) {
            colorSchemeTemplate[i] = "N"
        } else {
            colorSchemeTemplate[i] = hex2RGB(document.getElementById("pickColor_" + num).value)
        }
    })

    localStorage.colorSchemeTemplate = JSON.stringify(colorSchemeTemplate)
    if (lastVal !== localStorage.colorSchemeTemplate) {
        randomColorScheme(colorSchemeTemplate)
        lastVal = localStorage.colorSchemeTemplate
    }
}
setInterval(updateColorsArray, 500)

async function openElementInfo(index) {
    let event = allEvents[index]


    moreInfo.style.right = "0px"

    sidebar.style.right = "40vw"

    sidebarButton.style.right = "82vw"
    moreInfoIsOpen = true

    let html = "<h1 class='event-calendar-title sub-txt' style='text-align: center;'>" + event.name + "</h1>"

    if (event.location) {
        html += "<h2 class='event-calendar-title sub-txt' style='text-align: center;'><strong>Location: </strong>" + event.location + "</h2>"
    }
    html += "<h3 class='event-calendar-title sub-txt' style='text-align: center;'>" + event.tags.join(" | ") + "</h3>"
    html += "<div style='text-align: center;margin-top: 5px;'><button id='selectEvent'>Select</button>"
    if (event.eventId) {
        html += "<button id='openElement'>Open in school website</button>"
    } else if (event.tags.includes("Custom event") || showingToDo) {
        html += "<button id='editElement'>Edit</button>"
    }
    html += "</div>"
    html += (event.info || "")

    if (event.letter) {
        html += "<iframe src='" + event.letter + "' style='width: 100%;height: 75vh;'></iframe>"
    }

    moreInfo.innerHTML = html

    await wait(0)


    let elm = document.getElementById("selectEvent")
    if (elm !== null) {
        elm.onclick = () => { selectEvent(index) }
    }
    let elm2 = document.getElementById("openElement")
    if (elm2 !== null) {
        elm2.onclick = () => { window.open("https://swanviewshs.schoolzineplus.com/event/" + event.eventId, '_blank'); }

    }
    let elm3 = document.getElementById("editElement")
    if (elm3 !== null) {
        elm3.onclick = () => {
            edit(index)
        }
    }
}


function closeElementInfo(index) {
    openSideBar()
    moreInfo.style.right = "-40vw"
    moreInfoIsOpen = false
}

async function selectEvent(index) {
    let event = allEvents[index]
    //                       


    closeElementInfo()
    closeSideBar()



    schoolEnds = event.timestamp
    schoolEndsString = event.name

    localStorage.setItem("timeTillTimestamp", schoolEnds)
    localStorage.setItem("timeTillSchoolEndsString", schoolEndsString)

}
async function selectGroup(key) {
    closeElementInfo()
    closeSideBar()

    localStorage.setItem("timeTillTimestamp", key)
    localStorage.setItem("timeTillSchoolEndsString", "Loading...")

}

setInterval(updateSidebarText, 60000)
update()