# limeDB
![limedbbanner2](https://user-images.githubusercontent.com/43921069/161803890-d6a54d73-d7fb-4959-9171-a7aae7126837.png)


## What is LimeDB

LimeDB is object-oriented NoSQL database (OOD)
system that can work with complex data objects
that is, objects that mirror those used in object-oriented programming languages.
everything is an object, and many objects are quite complex.





## Quick Start

Creating LimeDB Server

It is preferred to have serverside of database in seperate project and only use LimeDB Client in your main project.

```js
const limedb = require('limeDB')
const limedb_server = new limedb.Server();

limedb_server.run({
    type    :   'tcp',
    port    :   9160,
    auth    :   'password'
});
```

Using LimeDB Server with specific database name

```js
var limedb = require('limeDB')
var limedb_server = new limedb.Server();

limedb_server.run({
    type    :   'tcp',
    port    :   9160,
    auth    :   'password'
}, "mydb.limedb");

```

Connecting to LimeDB Server ( Client )

```js
var limeDB = require('limeDB')
var client = new limeDB.Client();

client.tryConnect({
    type    :   'tcp',
    host    :   '127.0.0.1',
    port    :   9160,
    auth    :   'password'
});


client.event.on('connected', function() {
    console.log('connected'); // Connection to database
});

client.event.on('disconnected', function() {
    console.log('disconnected'); // Disconnected from database
});
```


Client Examples

```js
// Insert object example - Success returns null

client.event.on('ready', function() {
    let insertObject = { name : "Test"}
    client.insert(function(err, result) {
        if ( err ) {
            console.log(err);
        } else {
            console.log(result);
        }
    }, insertObject);

})



```

```JS
// Get object example - Success returns null

client.event.on('ready', function() {
    client.get(function(err, result) {
        if ( err ) {
            console.log(err);
        } else {
            console.log(result)
        }
    }, "name", "Test"); // We can replace "name" with any object property name.

})
```

```JS
// Delete object example - Success returns null
client.delete(function(err, result) {
    if ( err ) return;
    console.log(result)
}, "name", "Test"); // Deletes all objects with this property
```

```JS
// Updating existing object example - Success returns null

client.event.on('ready', function() {

// Get the object we want to update
client.get(function(err, result) {
    if ( err ) return;
    let updatedObject = result;
    updatedObject[0].name = "Changed Name"; // Change value of retrieved object
    // Send changed object back to server
    client.update(function(err, result) {
            if ( err ) return;
            console.log(result);
    }, "name", "Test", updatedObject);
}, "name", "Test");
    })
})

```

    
