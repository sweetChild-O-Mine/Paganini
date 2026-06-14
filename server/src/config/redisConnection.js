import IORedis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const connection = new IORedis(process.env.UPSTASH_REDIS_URL, {
    // enable TLS for the rediss:// protocol
    tls: {},
    
    // This is about what the IORedis client does when it loses the connection mid-command.
    maxRetriesPerRequest: null  //BullMQ requiers it to be null or it will fkin cash
})

export { connection }


// jobs survive because Redis persists them. Worker survives because maxRetriesPerRequest: null keeps it patiently waiting.