const fs = require('fs')
const {
    databasePathGet,
    databaseStructureInsert
} = require('./var.js');



module.exports = function (ret, database) {
    if (typeof database !== "string") return ret({error : "Bad database value" });

    const findDatabase = fs.existsSync(`${databasePathGet()}/${database}`);

    // Creating Database
    if (!findDatabase) {
        const createStruct = {
            database: database,
            tables: []
        };
        fs.mkdirSync(`${databasePathGet()}/${database}`)
        databaseStructureInsert(createStruct)
        return ret("success")
    }

    // Database already exists
    if (findDatabase) return ret({error : "Database already exists"})
}