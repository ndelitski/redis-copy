import _ from 'lodash';
import redis from 'redis';
import B from 'bluebird';

B.promisifyAll(redis.RedisClient.prototype);
B.promisifyAll(redis.Multi.prototype);
const CONSOLE_TIME_LABEL = 'copy completed in';

(async () => {
    const {
        chunkSize = 100,
        concurrency = 8,
        source: sourceOptions,
        destination: destOptions
    } = require('./config.json');

    const sourceClient = redis.createClient(sourceOptions);
    const destClient = redis.createClient(destOptions);
    const keys = await sourceClient.keysAsync('*');
    console.time(CONSOLE_TIME_LABEL);
    await B
        .all(_.chunk(keys, chunkSize))
        .map(async (chunk) => {
            // get values from source server
            let multi = sourceClient.multi();
            chunk.forEach((k) => multi.get(k));
            const values = await multi.execAsync();

            // push keys/values to dest server
            multi = destClient.multi();
            for (let [k,v] of _.zip(chunk, values)) {
                multi.set(k,v);
            }
            await multi.execAsync();
        }, {concurrency});
    console.timeEnd(CONSOLE_TIME_LABEL);
})().catch((err) => {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
}).then(() => {
    process.exit(0);
});
