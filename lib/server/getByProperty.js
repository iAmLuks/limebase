const fs = require('fs')
const {
    databasePathGet,
    databaseStructureFindTable
} = require('./var.js');


module.exports = function (ret, database, table, property, propertyValue) {
    if (typeof database !== "string") return ret({error: "Bad database value"});
    if (typeof table !== "string") return ret({error: "Bad table value"});
    if (typeof property !== "string") return ret({error: "Bad Property"});

    const findTable = databaseStructureFindTable(database,table);
    if(findTable){
        const storage = Object.keys(findTable.storage)
        if(storage.length === 0) return ret({error : "Storage empty"});
        storage.forEach(store => {
            const length = findTable.storage[store];
            for (var index = 0; index <= length; index++) {
                const parse = JSON.parse(fs.readFileSync(`${databasePathGet()}/${database}/${table}/${store}/chunk_${index}.limebase`));
                Object.entries(parse).forEach( object => {
                    if(object[1][property] === propertyValue) return ret(object)
                })
            }
        });

        return ret({error : "does not exist"});
    } else {
        return ret({error : "Table does not exist"});
    }
}
