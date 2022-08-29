const tables = require('./tables');

const getRendomTables = (players) => {
    let array = {

    };
    for (let i = 0; i < players; i++) {
       

        array[i + 1] = tables[i+1];
    }
    return array
}


function shuffle(array) {
    let currentIndex = array.length, randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex != 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
            array[randomIndex], array[currentIndex]];
    }

    return array;
}

const randomTables2D = []
const randomTables = getRendomTables(50)
const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10
    , 11, 12, 13, 14, 15, 16, 17, 18, 19, 20
    , 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
    31, 32, 33, 34, 35, 36, 37, 38, 39, 40,
    41, 42, 43, 44, 45, 46, 47, 48, 49, 50,
                 51,52,53,54,55,56,57,58,59,60
    61,62,63,64,65,66,67,68,69,70,
    71,72,73,74,75
] 

for (let i = 1; i <= 75; i++) {

    const newArr = [];
    while (randomTables[i + ""]?.length) newArr.push(randomTables[i + ""]?.splice(0, 5));
    randomTables2D.push(newArr);

}

module.exports = {
    random: randomTables2D,
    numbers: numbers
}
