// Memory database used for type 1
var database = [];
// Database structure - what databases exist and what tables
var structure = [];
// Where is database located
var databasePath;


/* Database Option Types 
   1 - Memory Database
    Loads database solely in memory
    Lookups happen only from the memory
   2 - Hybrid Database ( default option )
    Loads objects in memory only if they're looked up
    Lookups happen in the memory first, if object does not exist in memory we look up on disk and save it in memory.
   3 - Normal Database
    Lookups happen only using disk read
*/
var databaseType;



//  -- Database Path Functions -- 


// Update database path
function databasePathUpdate(path) {
    databasePath = path;
}
// Get database path
function databasePathGet() {
    return databasePath;
}


//  ** Database Path Functions ** END




//  -- Database Structure Functions --
// -- ALL OF THOSE FUNCTIONS ARE USED INTERNALLY --


/*
 *  Retrieve whole database structure
 *  what databases and tables are stored in memory.
*/
function databaseStructureGet() {
    return structure
}

/*
 *  Insert new database into structure
 *  We use this function when initializing database 
 *  at start to load all of the existing databases in memory
 *  and also when running createDatabase function
*/
function databaseStructureInsert(database) {
    structure.push(database);
}

/*
 *  Structure database name lookup in the structure
 *  Retrieves existing database
*/
function databaseStructureFindDatabase(database) {
    if (!database) return;
    for (var i = 0; i < structure.length; i++) {
        if (structure[i].database === database) {
            return structure[i];
        }
    }
}


/*
 *  Structure database table lookup
 *  Retrieves table that exists in specified database
*/
function databaseStructureFindTable(database, table) {
    if (!database && !table) return;
    for (var i = 0; i < structure.length; i++) {
        if (structure[i].database === database) {
            for (var x = 0; x < structure[i].tables.length; x++) {
                if (structure[i].tables[x].table === table) {
                    return structure[i].tables[x]
                }
            }
        }
    }
}

/*
 *  Structure creating new table
 *  Creates new table for specified database.
*/
function databaseStructureCreateTable(database, table, struct) {
    if (!database && !table && !struct) return;
    for (var i = 0; i < structure.length; i++) {
        if (structure[i].database === database) {
            structure[i].tables.push(struct)
        }
    }
}

/*
 *  We use this function to create new keyFolder for starting letter
 *  Structuring inserts with first letter = faster lookups
*/
function databaseStructureKeyFolder(database, table, keyFolder) {
    if (!database && !database) return;
    for (var i = 0; i < structure.length; i++) {
        if (structure[i].database === database) {
            for (var x = 0; x < structure[i].tables.length; x++) {
                if (structure[i].tables[x].table === table) {
                    return structure[i].tables[x].storage[keyFolder] = -1;
                }
            }
        }
    }
}

/*
 *  We update what's the latest chunk file number 
 *  for specified key storage
*/
function databaseStructureLatestChunkUpdate(database, table, keyFolder, latestChunk) {
    if (!database && !database) return;
    for (var i = 0; i < structure.length; i++) {
        if (structure[i].database === database) {
            for (var x = 0; x < structure[i].tables.length; x++) {
                if (structure[i].tables[x].table === table) {
                    return structure[i].tables[x].storage[keyFolder] = latestChunk;
                }
            }
        }
    }
}

//  ** Database Structure Functions ** END




module.exports = {
    databasePathGet,
    databasePathUpdate,
    databaseStructureInsert,
    databaseStructureCreateTable,
    databaseStructureGet,
    databaseStructureFindDatabase,
    databaseStructureFindTable,
    databaseStructureKeyFolder,
    databaseStructureLatestChunkUpdate
};


let obj = 


{
    postID : "uniqueID",
    author : "authorID",
    comments : [],
    likes : [],
    lastComment : Date.now(),
    lastLike : Date.now(),
    postCreated : Date.now(),
    engagementRate : 0.2,
    score : 95
}