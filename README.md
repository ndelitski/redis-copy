# redis-copy
Just copy keys and values between redis servers

## Configuration with a local `./config.json` file
```json
{
  "concurrency": 10,
  "chunkSize": 100,
  "source": {
    "host": "redis1",
    "port": 6379
  },
  "destination": {
    "host": "redis2",
    "port": 6378,
    "password": "you-know-nothing-john",
    "tls": true
  }
}
```


## install
todo