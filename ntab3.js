openElementInfo = async function (index) {
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
    html += "<button id='displayEvent'>Show on display</button>"
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
    } let elm4 = document.getElementById("displayEvent")
    if (elm4 !== null) {
        elm4.onclick = () => {
            fetch("https://soopymc.my.to/display/setCountDown.json?name=" + encodeURIComponent(allEvents[index].name) + "&timestamp=" + allEvents[index].timestamp)
        }
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