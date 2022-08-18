const fs = require('fs')
const {
    databasePathGet,
    databaseStructureCreateTable
} = require('./var.js');


module.exports = function (ret, database, table, structure) {
    if (typeof table !== "string") return ret({error : "Bad table value"});
    if (typeof database !== "string") return ret({error : "Bad database value"});
    // Organize structure file
    const tableStructure = {
        table: table,
        structure: {
            key: 'uid'
        },
        storage: {}
    };
    if (typeof structure === 'object') tableStructure.structure.key = structure.key;


    if (!fs.existsSync(`${databasePathGet()}/${database}`)) return ret({error : "Database does not exist"})
    if (fs.existsSync(`${databasePathGet()}/${database}/${table}`)) {
        return ret("Table already exists")
    } else {
        fs.mkdirSync(`${databasePathGet()}/${database}/${table}`)
        fs.writeFileSync(`${databasePathGet()}/${database}/${table}/structure.JSON`, JSON.stringify(tableStructure.structure))
        databaseStructureCreateTable(database, table, tableStructure);
    }
    ret("success")
}