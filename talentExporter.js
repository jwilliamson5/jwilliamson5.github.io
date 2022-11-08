$(function () {
    const apiUrl = "https://www.warcraftlogs.com:443"
    const apiKey = "a993aa50faaadd8a43229fa590153105"
    let fightList = []
    let memberList = []
    let logCode = ""
    let bitWidthRanksPurchased = 6

    // let logLink = new URL("https://www.warcraftlogs.com/reports/h4mb3zXWwgNGPD2r#fight=13")
    // let logLink = new URL("https://www.warcraftlogs.com/reports/B9QwnVjZzPm24vkp")
    // $("#LogLinkTextBox").val("https://www.warcraftlogs.com/reports/B9QwnVjZzPm24vkp")

    let fightListDiv = $("#fightListDiv")
    fightListDiv.hide()
    let fightListSelect = $("#fightList")

    let memberListDiv = $("#memberListDiv")
    memberListDiv.hide()
    let memberListSelect = $("#memberList")

    let outputDiv = $("#outputDiv")
    outputDiv.hide()
    let outputPTag = $("#output")

    function FindFight(id) {
        if (fightList.length === 0) return;
        for (let fight of fightList) {
            if (("" + fight["id"]) === id) {
                return fight
            }
        }
    }

    fightListSelect.on("change", function (e) {
        memberListDiv.hide()
        memberListSelect.html("")
        memberListSelect.append($("<option disabled selected value>Select a boss/dungeon</option>"))
        memberList = []
        outputDiv.hide()
        outputPTag.text("")
        GetPlayers(FindFight($(this).val()))
    })

    memberListSelect.on("change", function (e) {
        for (let member of memberList) {
            if (member.name === $(this).val()) {
                GetPlayerData(member)
                break
            }
        }
    })

    function GetFights(logLink) {
        $("#StatusDisplay").text("Retrieving log...")

        logLink = new URL(logLink)
        logCode = logLink.pathname.replace("/reports/", "")

        let reqUrl = new URL(apiUrl)
        reqUrl.pathname = "/v1/report/fights/" + logCode
        reqUrl.search = "?api_key=" + apiKey

        fetch(reqUrl.href)
            .then((response) => response.json())
            .then((data) => {
                $("#StatusDisplay").text("Parsing data...")

                // TODO This is just here for a visual reference cause the IDE highlights it
                // console.log(data)

                for (let [key, fightData] of Object.entries(data.fights)) {
                    if (fightData.boss !== 0) {
                        // console.log(fightData)
                        let parsedFight = {
                            id: fightData["id"],
                            name: fightData["name"],
                            start_time: fightData["start_time"],
                            end_time: fightData["end_time"],
                            kill: fightData["kill"]
                        }
                        if (fightData["keystoneLevel"]) {
                            parsedFight["keystoneLevel"] = fightData["keystoneLevel"]
                        }
                        fightList.push(parsedFight)
                    }
                }
            }).then(() => {
            for (let fight of fightList) {
                let option = $("<option></option>")
                option.val(fight["id"])

                let optionText = fight["name"]
                if (fight["keystoneLevel"]) {
                    optionText += ` (+${fight["keystoneLevel"]}, `
                    if (fight["kill"]) {
                        optionText += `timed)`
                    } else {
                        optionText += `not timed)`
                    }
                } else {
                    let fightLen = fight["end_time"] - fight["start_time"]
                    let fightSecondsTotal = Math.floor(fightLen / 1000)
                    let fightMins = Math.floor(fightSecondsTotal / 60)
                    let fightSeconds = fightSecondsTotal - (60 * fightMins)
                    fightSeconds = "" + fightSeconds
                    if (fightSeconds.length === 1) {
                        fightSeconds = "0" + fightSeconds
                    }

                    optionText += ` (${fight["kill"] ? "kill, " : "not kill, "}
                        ${fightMins}:${fightSeconds})`

                }
                option.text(optionText)
                fightListSelect.append(option)
            }
            fightListDiv.show()
            $("#StatusDisplay").text("Done! Please select a boss/dungeon")
        })
    }

    function GetPlayers(fight) {
        // console.log(fight)

        let reqUrl = new URL(apiUrl)
        reqUrl.pathname = "/v1/report/tables/summary/" + logCode
        reqUrl.search = `?api_key=${apiKey}&start=${fight.start_time}&end=${fight.end_time}`

        fetch(reqUrl.href)
            .then((response) => response.json())
            .then((data) => {
                for (let memberData of data.composition) {
                    // console.log(memberData)
                    // console.log(`${memberData.name}, ${memberData.type}, ${memberData.specs[0].spec}`)
                    if (memberData.specs.length > 1) {
                        console.log("Found someone with more then 1 spec?")
                        console.log(memberData)
                    }
                    memberList.push({
                        id: memberData.id,
                        name: memberData.name,
                        classType: memberData.type,
                        spec: memberData.specs[0].spec
                    })
                }
                memberList.sort((a, b) => {
                    if (a.classType < b.classType) return -1
                    if (a.classType > b.classType) return 1
                    if (a.classType === b.classType) {
                        if (a.spec < b.spec) return -1
                        if (a.spec > b.spec) return 1
                        if (a.spec === b.spec) {
                            if (a.name < b.name) return -1
                            if (a.name > b.name) return 1
                            if (a.name === b.name) return 0
                        }
                    }
                })
                for (let member of memberList) {
                    let option = $("<option></option>")
                    option.val(member.name)
                    option.text(`(${member.classType}, ${member.spec}) ${member.name}`)
                    memberListSelect.append(option)
                }
                // console.log(memberList)
                memberListDiv.show()
            })

    }

    function GetPlayerData(player) {
        let fight = FindFight(fightListSelect.val())

        let reqUrl = new URL(apiUrl)
        reqUrl.pathname = "/v1/report/tables/summary/" + logCode
        reqUrl.search = `?api_key=${apiKey}&start=${fight.start_time}&end=${fight.end_time}&sourceid=${player.id}`

        fetch(reqUrl.href)
            .then((response) => response.json())
            .then((data) => {
                console.log(data)
                GetTalentExport(data.combatantInfo.specIDs[0], data.combatantInfo.talentTree)
            })

    }


    function GetTalentExport(spec, talents) {
        // console.log(spec)
        // console.log(talents)

        let talentData = []
        fetch(`/TalentDataExports/${spec}.json`)
            .then((response) => response.json())
            .then((data) => {
                talentData = data

                fetch('/TalentDataExports/DefaultTalents.json')
                    .then((response) => response.json())
                    .then((defaultTalentData) => {
                        let talentsToSkip = []
                        let defaultTalents = defaultTalentData["" + spec]

                        let bitData = []

                        let verifiedTalents = 0

                        for (let treeNode of talentData) {
                            if (talentsToSkip.includes(treeNode.spellID)) continue
                            let isNodeSelectedBit = [1, 0]
                            bitData.push(isNodeSelectedBit)
                            if (defaultTalents.includes(treeNode.spellName)) continue
                            if (treeNode.deadTalent) continue;
                            // TODO re-code to remove this loop since nodeID is included in WCL data now
                            for (let playerTalent of talents) {
                                let isChoice = treeNode.type === 2
                                let isPicked = false
                                if (isChoice) {
                                    for (let treeNode2 of talentData) {
                                        if (treeNode.nodeID === treeNode2.nodeID) {
                                            talentsToSkip.push(treeNode2.spellID)
                                            if (treeNode2.spellID === playerTalent.spellID) {
                                                isPicked = true
                                            }
                                        }
                                    }
                                }
                                if (treeNode.spellID === playerTalent.spellID || isPicked) {
                                    verifiedTalents += 1
                                    isNodeSelectedBit[1] = 1

                                    let isPartiallyRanked = (treeNode.maxRanks !== playerTalent.rank)
                                    bitData.push([1, (isPartiallyRanked ? 1 : 0)])
                                    if (isPartiallyRanked) {
                                        bitData.push([bitWidthRanksPurchased, playerTalent.rank])
                                    }
                                    let isChoiceNode = treeNode["type"] === 2 // 2 = choice type node
                                    bitData.push([1, (isChoiceNode ? 1 : 0)])
                                    if (isChoiceNode) {
                                        let choiceIndex = -1
                                        for (let treeNode2 of talentData) {
                                            if (treeNode.nodeID === treeNode2.nodeID) {
                                                choiceIndex += 1
                                                if (playerTalent.spellID === treeNode2.spellID) {
                                                    break
                                                }
                                            }
                                        }
                                        bitData.push([2, choiceIndex])
                                    }

                                    break
                                }
                            }
                        }
                        outputPTag.text(CreateExportString(spec, bitData))
                        outputDiv.show()
                    })
            })

    }

    function resetSelectLists() {
        fightListDiv.hide()
        memberListDiv.hide()
        outputDiv.hide()
        fightListSelect.html("")
        fightListSelect.append($("<option disabled selected value>Select a boss/dungeon</option>"))
        memberListSelect.html("")
        memberListSelect.append($("<option disabled selected value>Select a boss/dungeon</option>"))
        fightList = []
        memberList = []
        outputPTag.text("")
    }

    $("#LogSubmitButton").on("click", function (e) {
        resetSelectLists()

        let logLink = $("#LogLinkTextBox").val()

        try {
            GetFights(logLink)
        } catch (e) {
            if (e.name === "TypeError") {
                $("#StatusDisplay").text("Error retrieving log (TypeError, probably invalid link)")
            } else {
                $("#StatusDisplay").text(`Error retrieving log (${e.name})`)
                console.log(e)
            }
            resetSelectLists()
        }
    })
})
