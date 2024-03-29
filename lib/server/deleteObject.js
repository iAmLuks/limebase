const fs = require('fs')
const {
    databasePathGet,
    databaseStructureFindTable
} = require('./var.js');


module.exports = function (ret, database, table, key) {
    if (typeof database !== "string") return ret({error: "Bad database value"});
    if (typeof table !== "string") return ret({error: "Bad table value"});
    if (typeof key !== "string") return ret({error: "Bad key value"});


    const findTable = databaseStructureFindTable(database,table);
    if(findTable){
        const startLetter = Array.from(key).splice(0, 1)[0];
        const storage = `${findTable.structure.key}_${startLetter}`
        if(findTable.storage[storage] === undefined) return ret({error : "Key storage does not exist"});
        const length = findTable.storage[storage];
        for (var index = 0; index <= length; index++) {
            const parse = JSON.parse(fs.readFileSync(`${databasePathGet()}/${database}/${table}/${storage}/chunk_${index}.limebase`));
            if(parse[key]) {
                delete parse[key];
                fs.writeFileSync(`${databasePathGet()}/${database}/${table}/${storage}/chunk_${index}.limebase`, JSON.stringify(parse, null, 2));
                return ret(null)
            }
        }
        return ret({error : "does not exist"});
    } else {
        return ret({error : "Table does not exist"});
    }
}