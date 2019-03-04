const express = require('express')
const router = express.Router()

// Add your routes here - above the module.exports line

var _myData = {
    "manuals":
    {
        "providers-manual-original": require(__dirname + '/data/providers-manual-original.json'),
        "providers-manual-2": require(__dirname + '/data/providers-manual-2.json'),
        "providers-manual-3": require(__dirname + '/data/providers-manual-3.json'),
        "employers-manual-original": require(__dirname + '/data/employers-manual-original.json'),
        "employers-manual-2": require(__dirname + '/data/employers-manual-2.json'),
        "employer-providers-manual-1": require(__dirname + '/data/employer-providers-manual-1.json')
    },
    "latestEmployerManual": "employers-manual-2",
    "latestProviderManual": "providers-manual-3",
    "latestEmployerproviderManual": "employer-providers-manual-1"
}

require('./routes/3-0/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/4-0/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/5-0/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/6-0/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/7-0/routes.js')(router,JSON.parse(JSON.stringify(_myData)));
require('./routes/8-0/routes.js')(router,JSON.parse(JSON.stringify(_myData)));

module.exports = router