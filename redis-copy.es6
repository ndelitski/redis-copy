import _ from 'lodash';
import redis from 'redis';
import B from 'bluebird';

B.promisifyAll(redis.RedisClient.prototype);
B.promisifyAll(redis.Multi.prototype);

(async () => {
    const {
        chunkSize,
        concurrency,
        source: sourceOptions,
        destination: destOptions
    } = require('./config.json');

    const sourceClient = redis.createClient(sourceOptions);
    const destClient = redis.createClient(destOptions);
    const keys = await sourceClient.keysAsync('*');
    console.time('copy completed in');
    await B
        .all(_.chunk(keys, chunkSize))
        .map(async (chunk) => {
            // get values
            let multi = sourceClient.multi();
            chunk.forEach((k) => multi.get(k));
            const values = await multi.execAsync();

            multi = destClient.multi();
            for (let [k,v] of _.zip(chunk, values)) {
                multi.set(k,v);
            }
            await multi.execAsync();
        }, {concurrency});
    console.timeEnd('copy completed in');
})().catch((err) => {
    console.error(err);
    console.error(err.stack);
    process.exit(1);
}).then(() => {
    process.exit(0);
});
