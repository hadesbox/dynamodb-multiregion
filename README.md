# Update

Now you should really try DynamoDB Streams which is a similar approach to this PoC but done "the right way" (HA, faultolerance, ...s)

http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html

# DynamoDB multiregion replication

This is a POC for replicating a DynamoDB table, over different regions. In this case between Ireland and Virginia.

For this POC, I created a DynamoDB table on Ireland, with a key string "id" and a range key "field1", I create another table in Virginia with this same structure, also I provisioned a Kinesis shard in Ireland. 


![image](https://raw.githubusercontent.com/hadesbox/dynamodb-multiregion/master/foo.png)

The idea is that we wanted to replicate in one direction all the putItem operations from a DynamoDB table in one region to another. To prevent loss of data on server or network failure, we store the put object in Kinesis (but we could use Kafka, SQS, MQ ...). When the application is writing to the DynamoDB table on his region it will save the same put request on the Kinesis on his region. A worker node/consumer on the other region reads the Kinesis, and performs the put operations locally so the table is replicated almost instantly.

This POC doesnt cover updateItem operations but it should not be very complex to adapt it for that regard. Also it was not considered bidirectional replication, but this can be easly achieved by creatinga Kinesis shard on each region, and consumer on every "other" region so whenever an items is wrote to a local DynamoDB, its also replicated to the rest of regions.
