import {Queue} from 'bullmq'
import { connection } from '../config/redisConnection.js'

const myQueue = new Queue("video-processing", {
    connection,
    defaultJobOptions: {
        attempts: 3,
        backoff:{
            type: 'exponential',
            delay: 5000
        },
        removeOnComplete: {
            count: 100
        },
        removeOnFail: {
            count: 50
        }
    }
})

export { myQueue }