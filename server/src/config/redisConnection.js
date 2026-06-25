import IORedis from 'ioredis'
import dotenv from 'dotenv'

dotenv.config()

const redisUrl = process.env.UPSTASH_REDIS_URL

const connection = new IORedis(redisUrl, {
    // Only enable TLS if connecting to Upstash or using a secure protocol
    ...(redisUrl && redisUrl.includes('upstash') ? { tls: {} } : {}),
    
    // This is about what the IORedis client does when it loses the connection mid-command.
    maxRetriesPerRequest: null  //BullMQ requiers it to be null or it will fkin cash
})

export { connection }


// jobs survive because Redis persists them. Worker survives because maxRetriesPerRequest: null keeps it patiently waiting.