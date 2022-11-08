let dataEntries_inGame = [[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,1],[2,1],[1,1],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,1],[1,0],[1,1],[2,0],[1,1],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,1],[2,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,1],[2,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,1],[2,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,1],[2,1],[1,1],[1,0],[1,1],[2,1],[1,1],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,1],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0],[1,0]]

function CreateExportString(
    specID, talentData, serializationVersion=[8, 1], treeHash=[128,0]
) {

    let dataEntries = []
    dataEntries.push(serializationVersion)
    dataEntries.push([16, specID])
    dataEntries.push(treeHash)
    for(let talent of talentData) {
        dataEntries.push(talent)
    }
    // console.log(dataEntries)


    let BitsPerChar = 6

    let base64ConversionTable = ["A"]

    for (let num = 1; num <= 25; num++) {
        base64ConversionTable.push(String.fromCharCode(65 + num))
    }

    for (let num = 0; num <= 25; num++) {
        base64ConversionTable.push(String.fromCharCode(97 + num))
    }

    for (let num = 0; num <= 9; num++) {
        base64ConversionTable.push(num)
    }

    base64ConversionTable.push('+')
    base64ConversionTable.push('/')

    let exportString = ""
    let currentValue = 0
    let currentReservedBits = 0
    let totalBits = 0

    for (let i in dataEntries) {
        let dataEntry = dataEntries[i]
        let remainingValue = dataEntry[1]
        let remainingRequiredBits = dataEntry[0]

        let maxValue = 1 << remainingRequiredBits
        if (remainingValue >= maxValue) {
            console.log('ERROR: not enough bits for given number')
            console.log(maxValue)
            console.log(remainingValue)
            break
        }

        totalBits += remainingRequiredBits
        while (remainingRequiredBits > 0) {
            let spaceInCurrentValue = (BitsPerChar - currentReservedBits)
            let maxStorableValue = 1 << spaceInCurrentValue
            let remainder = remainingValue % maxStorableValue

            remainingValue = remainingValue >> spaceInCurrentValue
            currentValue += remainder << currentReservedBits

            if (spaceInCurrentValue > remainingRequiredBits) {
                currentReservedBits = (currentReservedBits + remainingRequiredBits) % BitsPerChar
                remainingRequiredBits = 0
            } else {
                exportString += base64ConversionTable[currentValue]
                currentValue = 0
                currentReservedBits = 0
                remainingRequiredBits -= spaceInCurrentValue
            }

        }
    }

    if (currentReservedBits > 0) {
        exportString += base64ConversionTable[currentValue]
    }
    return exportString
}

// console.log(CreateExportString(258, dataEntries_inGame))
