let colorSchemeTemplate = JSON.parse(localStorage.colorSchemeTemplate || '[[255, 255, 255],"N","N","N","N"]')

let darktheme = (localStorage.getItem("darktheme") == "true");


let customEvents = []
let allEvents = []
let toDo = []
let toDoAnimOff = []









window.addEventListener('load', function() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('./service-worker.js')
    }
});





























var wait = ms => new Promise((r, j) => setTimeout(r, ms))

let schoolEnds = -2
let schoolEndsString = "Loading..."

let schoolEndsReplace = {
    p1: new Date(),
    p2: new Date(),
    form: new Date(),
    recess: new Date(),
    p3: new Date(),
    p4: new Date(),
    lunch: new Date(),
    p5: new Date(),
    home: new Date()
}
schoolEndsReplace.p1.setHours(8, 35)
schoolEndsReplace.p2.setHours(9, 39)
schoolEndsReplace.form.setHours(10, 43)
schoolEndsReplace.recess.setHours(10, 53)
schoolEndsReplace.p3.setHours(11, 18)
schoolEndsReplace.p4.setHours(12, 22)
schoolEndsReplace.lunch.setHours(13, 26)
schoolEndsReplace.p5.setHours(13, 51)
schoolEndsReplace.home.setHours(14, 55)

let schoolEndsGroups = {
    Next_period: ["p1", "p2", "form", "recess", "p3", "p4", "lunch", "p5", "home"],
    Recess_lunch_home: ["recess", "lunch", "home"]
}
let schoolEndNames = {
    "p1": "Period 1",
    "p2": "Period 2",
    "form": "Form",
    "recess": "Recess",
    "p3": "Period 3",
    "p4": "Period 4",
    "lunch": "Lunch",
    "p5": "Period 5",
    "home": "Home"
}


            Object.values(schoolEndsReplace).forEach(a=>a.setSeconds(0))
            Object.values(schoolEndsReplace).forEach(a=>a.setMilliseconds(0))
let lastsettingStr = localStorage.generalSettings
setInterval(() => {
    if (darktheme !== (localStorage.getItem("darktheme") == "true")) {
        darktheme = (localStorage.getItem("darktheme") == "true")
        randomColorScheme(colorSchemeTemplate)
        colorSchemeUpdated()
    }
	if(localStorage.generalSettings !== lastsettingStr){
		lastsettingStr = localStorage.generalSettings
		settingsChanged()
	}
    schoolEnds = parseInt(localStorage.getItem("timeTillTimestamp")) || -1
    schoolEndsString = localStorage.getItem("timeTillSchoolEndsString") || "Event not selected!"

    if (schoolEndsGroups[localStorage.getItem("timeTillTimestamp")] !== undefined) {
        let group = schoolEndsGroups[localStorage.getItem("timeTillTimestamp")]

        let now = new Date().getTime()

        let item = group.filter((a) => {
            return (schoolEndsReplace[a].getTime() - now > 1)
        })[0]

        if (item === undefined) {
            schoolEndsString = "No events left today"
            schoolEnds = -1
        } else {
            schoolEndsString = schoolEndNames[item]
            schoolEnds = schoolEndsReplace[item]
        }

    }

    if ((localStorage.customEvents || "[]")!== JSON.stringify(customEvents || []) && globalThis.updateSidebarText) {
        customEvents = JSON.parse(localStorage.customEvents || "[]")
        updateSidebarText()
    }
    if (localStorage.toDo !== JSON.stringify(toDo) && globalThis.updateToDoContents) {
        toDo = JSON.parse(localStorage.toDo || "[]")
        updateToDoContents()
    }

}, 100)

let lengthOfDay = 1000 * 60 * 60 * 24
let lengthOfHour = 1000 * 60 * 60
let lengthOfMin = 1000 * 60
let lengthOfSec = 1000

function getTimeTill(timestamp) {
    let time = timestamp - new Date().getTime()

    let days = Math.floor(time / lengthOfDay)
    time = time % lengthOfDay

    let hours = Math.floor(time / lengthOfHour)
    time = time % lengthOfHour

    let min = Math.floor(time / lengthOfMin)
    time = time % lengthOfMin

    return (days > 0 ? (days + " day") + (days === 1 ? " " : "s ") : "") + hours + " hour" + (hours === 1 ? "" : "s") + " " + min + " min" + (min === 1 ? "" : "s")

}

function getTimeTill2sig(timestamp) {
    let time = timestamp - new Date().getTime()
    let end = ""
    if (time < 0) {
        end = " <small>ago</small>"
        time *= -1
    }

    let retStr = ""
    let retSig = 0
    let days = Math.floor(time / lengthOfDay)
    time = time % lengthOfDay
    if (days > 0) {
        retStr += (days + " day") + ((days === 1 || days === -1) ? " " : "s ")
        retSig++
        if (retSig == 2) {
            return retStr.trim() + end
        }
    }

    let hours = Math.floor(time / lengthOfHour)
    time = time % lengthOfHour
    if (hours > 0) {
        retStr += (hours + " hour") + ((hours === 1 || hours === -1) ? " " : "s ")
        retSig++
        if (retSig == 2) {
            return retStr.trim() + end
        }
    }

    let min = Math.floor(time / lengthOfMin)
    time = time % lengthOfMin
    if (min > 0) {
        retStr += (min + " min") + ((min === 1 || min === -1) ? " " : "s ")
		retSig++
        if (retSig == 2) {
            return retStr.trim() + end
        }
    }
	
    let sec = Math.floor(time / lengthOfSec)
    time = time % lengthOfSec
    if (sec > 0) {
        retStr += (sec + " second") + ((sec === 1 || sec === -1) ? " " : "s ")
		retSig++
        if (retSig == 2) {
            return retStr.trim() + end
        }
    }

    return retStr.trim() + end

}

function update() {
    //update time till school
    document.getElementById("title1").innerHTML = schoolEndsString
    if (schoolEnds === -1) {
        document.getElementById("d").innerHTML = ""
        document.getElementById("h").innerHTML = ""
        document.getElementById("m").innerHTML = ""
        document.getElementById("s").innerHTML = ""
        document.getElementById("ms").innerHTML = ""
        document.getElementById("title").innerHTML = "Event not selected!"

		window.parent.postMessage(JSON.stringify({"title":title.innerHTML}), "*")
        setTimeout(update, 100)
        return;
    }

    if (schoolEnds === -2) {
        document.getElementById("d").innerHTML = "Loading..."
        document.getElementById("h").innerHTML = ""
        document.getElementById("m").innerHTML = ""
        document.getElementById("s").innerHTML = ""
        document.getElementById("ms").innerHTML = ""
        document.getElementById("title").innerHTML = "Loading..."

		window.parent.postMessage(JSON.stringify({"title":title.innerHTML}), "*")
        setTimeout(update, 100)
        return;
    }
    document.getElementById("title1").innerHTML = "Time " + (new Date().getTime() > schoolEnds ? "since" : "till") + ": " + schoolEndsString

    let time = schoolEnds - new Date().getTime()
    if (time < 0) {
        time = 0 - time
    }

    let days = Math.floor(time / lengthOfDay)
    time = time % lengthOfDay

    let hours = Math.floor(time / lengthOfHour)
    time = time % lengthOfHour

    let min = Math.floor(time / lengthOfMin)
    time = time % lengthOfMin

    let sec = Math.floor(time / lengthOfSec)
    time = time % lengthOfSec

    document.getElementById("d").innerHTML = days + " day" + (days === 1 ? "" : "s")
    document.getElementById("h").innerHTML = hours + " hour" + (hours === 1 ? "" : "s")
    document.getElementById("m").innerHTML = min + " minute" + (min === 1 ? "" : "s")
    document.getElementById("s").innerHTML = sec + " second" + (sec === 1 ? "" : "s")
    document.getElementById("ms").innerHTML = time + " ms"
    document.getElementById("title").innerHTML = days + " day" + (days === 1 ? "" : "s") + " " + hours + " hour" + (hours === 1 ? "" : "s") + " " + min + " min" + (min === 1 ? "" : "s") + " " + sec + " sec" + (sec === 1 ? "" : "s")

	let disText = ""
	
	if(generalSettings.ShowTimeTillNextPeriodAlways){
	
	
        let group = schoolEndsGroups[generalSettings.SelectedPeriodSetting]

        let now = new Date().getTime()

        let item = group.filter((a) => {
            return (schoolEndsReplace[a].getTime() - now > 1)
        })[0]

        if (item === undefined) {
			disText = "No events left today"
        } else {
			disText = `${schoolEndNames[item]} is in ${getTimeTill2sig(schoolEndsReplace[item])}`
        }

	}
		document.getElementById("Randomfact").innerHTML = disText

    window.parent.postMessage(JSON.stringify({"title":title.innerHTML}), "*")
    setTimeout(update, 1000 / 60)
}

colorSchemeUpdated()

function colorSchemeUpdated() {

    if (darktheme) {
        document.getElementById("body").style.transition = "0.25s"
        document.getElementById("body").style.backgroundColor = "black"
        document.getElementById("sidebarButton").style.filter = "invert(1)"

        document.getElementById("reload").style.filter = ""
    } else {
        document.getElementById("reload").style.filter = "invert(1)"


        document.getElementById("sidebarButton").style.filter = ""
        document.getElementById("body").style.transition = "0.25s"
        document.getElementById("body").style.backgroundColor = "white"
    }

    let elm = document.getElementById("themeChange")
    if (elm) {
        elm.innerHTML = `Switch to ${darktheme?"Light":"Dark"} theme`
    }
}

let firstrun = true
async function randomColorScheme(input) {
    //let r = Math.random() * 255
    //let b = Math.random() * 255
    //let g = Math.random() * 255
    var url = "https://soopymc.my.to/api/colormind.json";
    var data = {
        model: "default",
        input: input
    }


    if (darktheme && firstrun) {
        (["d1", "d2", "d3", "d4", "d5"]).forEach((e) => {
            document.getElementById(e).style.transition = "0s"
            document.getElementById(e).style.backgroundColor = "black"
        })
    }

    let colorData
    // console.log(firstrun)
    if(firstrun && localStorage.lastColorData){
        colorData = JSON.parse(localStorage.lastColorData)
    }else{
        let fetchData = await(await fetch(url,{method: 'POST',headers: {
            'Content-Type': 'application/json'
            // 'Content-Type': 'application/x-www-form-urlencoded',
          },body: JSON.stringify(data)})).json()
    
        colorData = fetchData.result;
        // console.log(colorData)
    }

    localStorage.lastColorData = JSON.stringify(colorData)

    if (Math.max(...colorData[1]) < 40) {
        firstrun = false
        randomColorScheme(input)
        return;
    }

    if (darktheme) {
        colorData.reverse();

        if (firstrun) {
            let i = 0;
            (["d1", "d2", "d3", "d4", "d5"]).forEach((e) => {
                i++
                document.getElementById(e).style.transition = (i * 2 / 10) + "s"
            })
            await wait(0)
        }
    }

    document.getElementById("d1").style.setProperty('background-color', 'rgb(' + colorData[0].join(",") + ')');
    document.getElementById("d2").style.setProperty('background-color', 'rgb(' + colorData[1].join(",") + ')');
    document.getElementById("d3").style.setProperty('background-color', 'rgb(' + colorData[2].join(",") + ')');
    document.getElementById("d4").style.setProperty('background-color', 'rgb(' + colorData[3].join(",") + ')');
    document.getElementById("d5").style.setProperty('background-color', 'rgb(' + colorData[4].join(",") + ')');
    document.getElementById("d1").style.setProperty('width', '100vw');
    document.getElementById("d2").style.setProperty('width', '100vw');
    document.getElementById("d3").style.setProperty('width', '100vw');
    document.getElementById("d4").style.setProperty('width', '100vw');
    document.getElementById("d5").style.setProperty('width', '100vw');

    let ids = ["title1", "d", "h", "m", "s", "ms", "Randomfact"]

    ids.forEach((id) => {
        document.getElementById(id).style.setProperty('color', 'rgb(' + colorData[4].join(",") + ')');
    })

    firstrun = false
}

let randomFactFound = false


randomColorScheme(colorSchemeTemplate)

let rotating = false
document.getElementById("reload").onclick = function() {
    if (rotating) { return; }
    randomColorScheme(colorSchemeTemplate);
    animateButton()
}

async function animateButton() {
    rotating = true
    document.getElementById("reload").style.transition = "1s"
    await wait(0)
    document.getElementById("reload").style.transform = "rotate(180deg)"
    await wait(1000)
    document.getElementById("reload").style.transition = "0s"
    await wait(0)
    document.getElementById("reload").style.transform = "rotate(0deg)"
    rotating = false
}

let events = []
let eventsDataTemp
function loadCalender() {
    if(!eventsDataTemp){
        
downLoadCalender()
return
    }
    events = []

    eventsDataTemp.events.forEach((e) => {
        e.info = "<div style='padding: 10px;padding-left: 20px;'><span class=\"event-summary user-content\">" + e.info + "</span>"
        events.push(e)
    })
    genAllEvents()
}

async function downLoadCalender() {
    let data = await fetch("https://soopymc.my.to/api/school/getEvents.json")
    data = await data.json()
    eventsDataTemp = { timestamp: new Date().getTime(), events: data.data,loaded: data.loaded }
    loadCalender()
}
