var AWS = require('aws-sdk');
var Chance = require('chance');


//Kinesis store data blobs (hexadecimal) base64 values, this function converts hex to ascii strings.
function hex2string(hexx) {
    var str = '';
    for (var i = 0; i < hexx.length; i++)
        str += String.fromCharCode(hexx[i], 10)[0];
    return str;
}

//This is the consumer, so the dynamodDB is local for this test we asume Virginia
var dynamodbconfig = {
    accessKeyId: 'XXXXXXXXXXXX',
    secretAccessKey: 'XXXXXXXXXXXXXXXXXXXXX',
    region: 'us-east-1',
    endpoint: 'https://dynamodb.us-east-1.amazonaws.com'
};

var dynamodb = new AWS.DynamoDB(dynamodbconfig);


//Since we can to consume from another Kinesis from another region we use Ireland.
var kinesisconf = {
    accessKeyId: 'XXXXXXXXXXXXXXXXX',
    secretAccessKey: 'XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
    region: 'eu-west-1',
    endpoint: 'https://kinesis.eu-west-1.amazonaws.com'
};

var kinesis = new AWS.Kinesis(kinesisconf);

var chance = new Chance((new Date()).getMilliseconds()); // initializing the seed

//this application is run in Virginia, but we want to read Ireland Stream
var params = {
    StreamName: 'stream-ireland',
    Limit: 10
};

kinesis.describeStream(params, function(err, data) {
    if (err) {
        console.log(err, err.stack); // an error occurred
        updateDynamo();
    } else {
        console.log(JSON.stringify(data.StreamDescription.Shards[0], null, 3)); // successful response
        var params = {
            ShardId: data.StreamDescription.Shards[0].ShardId,
            ShardIteratorType: 'AT_SEQUENCE_NUMBER',
            StreamName: 'stream-ireland',
            StartingSequenceNumber: data.StreamDescription.Shards[0].SequenceNumberRange.StartingSequenceNumber
        };
        kinesis.getShardIterator(params, function(err, data) {
            if (err) {
                console.log(err, err.stack); // an error occurred
                updateDynamo();
            } else {
                console.log("ITERATOR", data);
                console.log("=================================================")
                updateDynamo(data.ShardIterator);
            }
        });
    }
});

function updateDynamo(paramdata) {
    //paramdata is the iterator we want to read from...
    console.log("getting records...", paramdata.substring(paramdata.length - 10))
    var params = {
        ShardIterator: paramdata
    };
    kinesis.getRecords(params, function(err, data) {
        if (err) {
            console.log(err, err.stack); // an error occurred
            updateDynamo(paramdata);
        } else {
            //if we find new items in the foreign Kinesis, we put them on the local dynamodb
            console.log("found ", data.Records.length, "new records...");
            for (j = 0; j < data.Records.length; j++) {
                //console.log(j, JSON.parse(hex2string(data.Records[j].Data)))
                dynamoparams = JSON.parse(hex2string(data.Records[j].Data));
                dynamoparams.TableName = "table-replica";
                dynamodb.putItem(dynamoparams, function(err, data) {
                    if (err) {
                        console.log(err); // an error occurred
                    } else {
                        //console.log("Item are succesfully intest in table");
                    }
                });
            }
            updateDynamo(data.NextShardIterator);
        }
    });
}
