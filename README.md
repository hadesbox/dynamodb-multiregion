# Update

Now you should really try DynamoDB Streams which is a similar approach to this PoC but done "the right way" (HA, faultolerance, ...s)

http://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Streams.html

# DynamoDB multiregion replication

This is a POC for replicating a DynamoDB table, over different regions. In this case between Ireland and Virginia.

For this POC, I created a DynamoDB table on Ireland, with a key string "id" and a range key "field1", I create another table in Virginia with this same structure, also I provisioned a Kinesis shard in Ireland. 


![image](https://.png)

The idea is that we wanted to replicate in one direction all the putItem operations from one dynamod to the other.

To prevent loss of data on server or network failure, we store the put object in Kinesis (but we could use Kafka, SQS, MQ ...). So locally when the application is writing to the dynamo on his region, the application also writes to the kinesis on his reagion. A worker node or consumer on another region where we want to replicate the dynamo table, reads the Kinesis, and performs the put operations so the table is replicated almost instantly.

This POC doesnt cover updateItem operations but should not be very complex to adapt for that regard.

Also here was not considered bidirectional replication, but this can be easly achieved by creatinga Kinesis shard on each region, and consumer on every "other" region so whenever an items is wrote to a local DynamoDB, its also replicated to the rest of regions.