const fs = require('fs')
const {
    databasePathGet,
    databaseStructureFindTable
} = require('./var.js');


module.exports = function (ret, database, table, value) {
    if (typeof database !== "string") return ret({error: "Bad database value"});
    if (typeof table !== "string") return ret({error: "Bad table value"});
    if (typeof value !== "string") return ret({error: "Bad lookup value"});

    const findTable = databaseStructureFindTable(database,table);
    if(findTable){
        const key = findTable.structure.key;
        const startLetter = Array.from(value).splice(0, 1)[0];
        const storage = `${key}_${startLetter.toUpperCase()}`
        if(findTable.storage[storage] === undefined) return ret({error : "Key storage does not exist"});
        const length = findTable.storage[storage];
        for (var index = 0; index <= length; index++) {
            const parse = JSON.parse(fs.readFileSync(`${databasePathGet()}/${database}/${table}/${storage}/chunk_${index}.limebase`));
            if(parse[value]) return ret(parse[value])
        }
        return ret({error : "does not exist"});
    } else {
        return ret({error : "Table does not exist"});
    }
}
