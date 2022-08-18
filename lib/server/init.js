const fs = require('fs')
const {
    databasePathUpdate,
    databasePathGet,
    databaseStructureInsert,
    databaseStructureFindTable
} = require('./var.js');

module.exports = function () {
    if (fs.existsSync("../limebase")) {
        console.log("Running Existing Database")
        databasePathUpdate("../limebase");
    } else {
        console.log("Creating new Database")
        databasePathUpdate("../limebase");
        fs.mkdirSync("../limebase");
    }
    const databases = fs.readdirSync(databasePathGet());

    databases.forEach(database => {
        const tables = fs.readdirSync(`${databasePathGet()}/${database}`);
        const createStruct = {
            database: database,
            tables: []
        };
        tables.forEach(table => {
            const tableStructure = fs.readFileSync(`${databasePathGet()}/${database}/${table}/structure.JSON`);
            const tableStructureParsed = JSON.parse(tableStructure);
            // Check if received object has matching key with table structure
            if (!tableStructureParsed.key) return ret("No key specified");
            // Database chunks
            const folderList = fs.readdirSync(`${databasePathGet()}/${database}/${table}`, {
                    withFileTypes: true
                })
                .filter(item => item.isDirectory())
                .filter(item => item.name.startsWith(tableStructureParsed.key))
                .map(item => item.name)
            const insertObject = {
                table: table,
                structure: tableStructureParsed,
                storage: []
            }
            if (folderList.length > 0) {
                insertObject.storage = {}
                for (var index = 0; index < folderList.length; index++) {
                    const chunkList = fs.readdirSync(`${databasePathGet()}/${database}/${table}/${folderList[index]}`, {
                            withFileTypes: true
                        })
                        .filter(item => !item.isDirectory())
                        .filter(item => item.name.endsWith(".limebase"))
                        .map(item => item.name);
                    insertObject.storage[folderList[index]] = -1;
                    chunkList.forEach(chunk => {
                        const number = parseInt(chunk.replace(/[^0-9]/g, ""))
                        if (number >= insertObject.storage[folderList[index]]) insertObject.storage[folderList[index]] = number;
                    })
                }
            }
            createStruct.tables.push(insertObject)
        })
        databaseStructureInsert(createStruct)
    });
}