const PackDB = require('../PackDB');

const {data} = new PackDB(`db.json`);

// Set some defaults if your JSON file is empty
if(!data.posts) data.posts = [];
if(!data.user) data.user = {};

// Add a post
data.posts.push({id: 1, title: 'packdb is awesome'});

// Set a user
data.user = {name: 'mpen'};