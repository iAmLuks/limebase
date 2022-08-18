const _Identifier = require('../network/identifier');
const fs = require('fs')
const {
    databasePathGet,
    databaseStructureFindTable,
    databaseStructureLatestChunkUpdate,
    databaseStructureKeyFolder
} = require('./var.js');

module.exports = async function (ret, table, database, object) {
    if (typeof object !== 'object') return ret({error : "Not an Object"});
    if (typeof table !== "string") return ret({error : "Bad table value"});
    if (typeof database !== "string") return ret({error : "Bad database value"});
    if (object.uid) return ret({error : "Object can't have existing UID"});

    // Assign Unique ID
    object.uid = _Identifier.generator();
    const databasePath = databasePathGet()
    // Find table 
    const findTable = databaseStructureFindTable(database, table);
    if (findTable) {

        // Read table structure
        const structure = findTable.structure;
        const key = structure.key;

        // Check if received object has matching key with table structure
        if (!object[key]) return ret({error : "Object has no key"});
        const startLetter = Array.from(object[key]).splice(0, 1)[0];
        const keyFolder = key + "_" + startLetter;

        // First letter key folder management
        if (findTable.storage[keyFolder] === undefined) {
            fs.mkdirSync(`${databasePath}/${database}/${table}/${keyFolder}`)
            databaseStructureKeyFolder(database, table, keyFolder);
        };
        // Get chunklist from storage
        var latestChunk = findTable.storage[keyFolder];

        //First ever chunk file
        if (latestChunk <= -1) {
            ++latestChunk;
            databaseStructureLatestChunkUpdate(database, table, keyFolder, latestChunk)
            try {
                fs.writeFileSync(`${databasePathGet()}/${database}/${table}/${keyFolder}/chunk_${latestChunk}.limebase`, JSON.stringify({}, null, 2));
            } catch (err) {
                console.error(err)
            }
        }

        // File size Limit
        const fileSize = fs.statSync(`${databasePath}/${database}/${table}/${keyFolder}/chunk_${latestChunk}.limebase`).size / 1000;
        if (fileSize >= 51) {
            ++latestChunk;
            databaseStructureLatestChunkUpdate(database, table, keyFolder, latestChunk)
            const firstInsert = {};
            const keyValue = object[key];
            delete object[key];
            firstInsert[keyValue] = object;
            try {
                fs.writeFileSync(`${databasePathGet()}/${database}/${table}/${keyFolder}/chunk_${latestChunk}.limebase`, JSON.stringify(firstInsert))
                return ret(null);
            } catch (err) {
                console.error(err)
            }
        } else {
            const parse = JSON.parse(fs.readFileSync(`${databasePath}/${database}/${table}/${keyFolder}/chunk_${latestChunk}.limebase`));
            const keyValue = object[key];
            delete object[key];
            parse[keyValue] = object;
            try {
                fs.writeFileSync(`${databasePathGet()}/${database}/${table}/${keyFolder}/chunk_${latestChunk}.limebase`, JSON.stringify(parse, null, 2));
                return ret(null);
            } catch (err) {
                console.error(err);
            }
        }
    } else {
        return ret({error :"Table does not exist"});
    }
}