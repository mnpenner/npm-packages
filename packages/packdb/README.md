# PackDB

> A simple single-file object-based database powered by your imagination

Similar to [lowdb](https://github.com/typicode/lowdb), but even simpler.

```js
const PackDB = require('../PackDB');

const {data} = new PackDB(`db.json`);

// Set some defaults if your JSON file is empty
if(!data.posts) data.posts = [];
if(!data.user) data.user = {};

// Add a post
data.posts.push({id: 1, title: 'packdb is awesome'});

// Set a user
data.user = {name: 'mpen'};
```

Data is automatically saved to `db.json` whenever<sup>1</sup> you mutate `data`:

```json
{
    "posts": [
        {
            "id": 1,
            "title": "packdb is awesome"
        }
    ],
    "user": {
        "name": "mpen"
    }
}
```



You can use any library you like (or none at all) to manipulate `data` -- it's just a plain old JavaScript object<sup>2</sup>.


## Why PackDB?

- It doesn't get any simpler than this
- It's like, really simple
- Seriously, that's it's only selling point

## API

**`new PackDB(filename, [options])`**

- `filename` string -- where to load/save data
- `options` object
  - `serialize` function used to serialize data. Is passed root `data` object whenever a write occurs. Should return a string or Buffer. Defaults to `JSON.stringify`
  - `deserialize` function used to deserialize data after it's read from disk. Is passed a `Buffer`. Should return an `object`. Defaults to `JSON.parse`
  - `minWait` number. "Debounce" time, measured in milliseconds (ms). i.e., the amount of time it will wait for more mutations to occur before writing the data back to disk. Defaults to `10`.
  - `maxWait` number. The maximum amount of time to wait between writes if a mutation has occurred. Defaults to `5000`.
  
  
**`PackDB.write()`**

- Queue up a write if you don't think the Proxy is doing its job (please [file an issue](https://bitbucket.org/mnpenner/packdb/issues) if this is the case).

**`PackDB.writeNow()`**

- Write right now. Skip the debounce. You can call this at the end of your script to save a few ms (it will cancel the debounce timer), or if you're really paranoid about data loss<sup>3</sup>.

**`PackDB.data`**

- Your access point to all the data. It's a [getter](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get) -- you can't reassign it, but you can read and write to it as you please.

## Future

With some slight modifications, PackDB could be made to work with [localStorage](https://developer.mozilla.org/en/docs/Web/API/Window/localStorage) or other storage mechanisms. For now, it's Node only. 

---

<sup>1</sup> It's debounced by 10ms up to a maximum of 5s to avoid excessive disk writes.  
<sup>2</sup> Okay, it's actually a [Proxy](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/Proxy), but that shouldn't get in your way.  
<sup>3</sup> If you're that paranoid, you might want to use a professional-grade database.