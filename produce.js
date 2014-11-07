var AWS = require('aws-sdk');
var Chance = require('chance');

var dynamodbconfig = {
    accessKeyId: 'XXXXXXXXXXXXXXXX',
    secretAccessKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    region: 'eu-west-1',
    endpoint: 'https://dynamodb.eu-west-1.amazonaws.com'
};

var dynamodb = new AWS.DynamoDB(dynamodbconfig);

var kinesisconf = {
    accessKeyId: 'XXXXXXXXXXXXXXXXXX',
    secretAccessKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    region: 'eu-west-1',
    endpoint: 'https://kinesis.eu-west-1.amazonaws.com'
};

var kinesis = new AWS.Kinesis(kinesisconf);

//chance library is used to create "random" documents
var chance = new Chance((new Date()).getMilliseconds()); // initializing the seed

//we produce items in batch of 5, we insert them on both dynamodb and in kinesis, so the consumer replicates them.

for (i = 0; i < 5; i++) {

    item = {
        "result": {
            "code": 200,
            "info": "OK"
        },
        "data": {
            "age": chance.age(),
            "size": "1",
            "fullname": chance.first(),
            "email": chance.email(),
            "ip": chance.ip(),
            "address": chance.address(),
            "city": chance.city(),
            "stats": [{
                "date": chance.integer({
                    min: 1,
                    max: 20
                }),
                "histogram": chance.floating()
            }]
        }
    };

    params = {
        //dynamodb local table to update the documents
        "TableName": "table-master",
        "Item": {
            "id": {
                "S": chance.hash()
            },
            "field1": {
                "S": JSON.stringify(item)
            }
        },
        "ReturnConsumedCapacity": 'TOTAL',
        "ReturnItemCollectionMetrics": 'SIZE',
        "ReturnValues": 'ALL_OLD'
    }

    //the document gets inserted into ireland dynamod
    dynamodb.putItem(params, function(err, data) {

        if (err) {
            console.log(err); // an error occurred
        } else {
            val = chance.integer({
                min: 1,
                max: 1000
            });
            console.log(i, "Item are succesfully intest in table");
        }
    });

    var parKinesis = {
        Data: JSON.stringify(params),
        PartitionKey: item.data.email, //we use email as partition for no reason, but if you have multiple dynamo tables you want to update you could use this field to send further metadata to the consumers
        StreamName: 'stream-ireland'
    };

    //but also into kinesis stream in ireland (item object)
    kinesis.putRecord(parKinesis, function(err, data) {
        if (err) console.log(err, err.stack); // an error occurred
        else console.log(data); // successful response
    });

}
