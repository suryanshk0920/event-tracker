const redis = require('redis');
const axios = require('axios');

class RedisMonitor {
  constructor() {
    this.client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379
    });
    
    this.stats = {
      cacheHits: 0,
      cacheMisses: 0,
      totalRequests: 0,
      avgResponseTime: 0,
      redisMemoryUsage: 0
    };
    
    this.startTime = Date.now();
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Connected to Redis for monitoring');
    } catch (error) {
      console.error('❌ Redis connection failed:', error.message);
      throw error;
    }
  }

  async getRedisInfo() {
    try {
      const info = await this.client.info('memory');
      const lines = info.split('\r\n');
      const memoryInfo = {};
      
      lines.forEach(line => {
        if (line.includes(':')) {
          const [key, value] = line.split(':');
          memoryInfo[key] = value;
        }
      });
      
      return {
        usedMemory: parseInt(memoryInfo.used_memory || 0),
        usedMemoryHuman: memoryInfo.used_memory_human || 'N/A',
        connectedClients: parseInt(memoryInfo.connected_clients || 0),
        totalCommandsProcessed: parseInt(memoryInfo.total_commands_processed || 0),
        keyspaceHits: parseInt(memoryInfo.keyspace_hits || 0),
        keyspaceMisses: parseInt(memoryInfo.keyspace_misses || 0)
      };
    } catch (error) {
      console.error('Error getting Redis info:', error);
      return {};
    }
  }

  async testCachePerformance() {
    console.log('\n🧪 Testing Redis Cache Performance...\n');
    
    const testEndpoints = [
      '/api/events',
      '/api/users?role=STUDENT',
      '/api/events/1',
      '/api/events/2'
    ];

    const results = [];

    for (const endpoint of testEndpoints) {
      console.log(`Testing endpoint: ${endpoint}`);
      
      // First request (should miss cache)
      const start1 = Date.now();
      try {
        await axios.get(`http://localhost:5000${endpoint}`, {
          headers: { Authorization: 'Bearer test-token' }
        });
      } catch (error) {
        // Ignore auth errors for this test
      }
      const time1 = Date.now() - start1;
      
      // Second request (should hit cache)
      const start2 = Date.now();
      try {
        await axios.get(`http://localhost:5000${endpoint}`, {
          headers: { Authorization: 'Bearer test-token' }
        });
      } catch (error) {
        // Ignore auth errors for this test
      }
      const time2 = Date.now() - start2;
      
      results.push({
        endpoint,
        firstRequest: time1,
        secondRequest: time2,
        improvement: time1 > 0 ? ((time1 - time2) / time1 * 100).toFixed(2) : 0
      });
      
      // Small delay between tests
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    console.log('\n📊 Cache Performance Results:');
    console.log('================================');
    results.forEach(result => {
      console.log(`${result.endpoint}:`);
      console.log(`  First request (cache miss): ${result.firstRequest}ms`);
      console.log(`  Second request (cache hit): ${result.secondRequest}ms`);
      console.log(`  Performance improvement: ${result.improvement}%\n`);
    });
  }

  async monitorDuringLoad() {
    console.log('\n📈 Starting Redis monitoring during load test...\n');
    
    const monitoring = setInterval(async () => {
      const redisInfo = await this.getRedisInfo();
      const currentTime = new Date().toISOString();
      
      console.log(`[${currentTime}] Redis Stats:`);
      console.log(`  Memory Usage: ${redisInfo.usedMemoryHuman}`);
      console.log(`  Connected Clients: ${redisInfo.connectedClients}`);
      console.log(`  Cache Hits: ${redisInfo.keyspaceHits}`);
      console.log(`  Cache Misses: ${redisInfo.keyspaceMisses}`);
      console.log(`  Hit Ratio: ${redisInfo.keyspaceHits + redisInfo.keyspaceMisses > 0 
        ? ((redisInfo.keyspaceHits / (redisInfo.keyspaceHits + redisInfo.keyspaceMisses)) * 100).toFixed(2)
        : 0}%`);
      console.log('  ─────────────────────────────');
    }, 5000);

    // Stop monitoring after 10 minutes
    setTimeout(() => {
      clearInterval(monitoring);
      console.log('\n✅ Redis monitoring completed');
    }, 600000);
  }

  async generateReport() {
    const redisInfo = await this.getRedisInfo();
    const totalTime = Date.now() - this.startTime;
    
    console.log('\n📋 Final Redis Performance Report');
    console.log('==================================');
    console.log(`Test Duration: ${(totalTime / 1000).toFixed(2)} seconds`);
    console.log(`Final Memory Usage: ${redisInfo.usedMemoryHuman}`);
    console.log(`Total Cache Hits: ${redisInfo.keyspaceHits}`);
    console.log(`Total Cache Misses: ${redisInfo.keyspaceMisses}`);
    console.log(`Overall Hit Ratio: ${redisInfo.keyspaceHits + redisInfo.keyspaceMisses > 0 
      ? ((redisInfo.keyspaceHits / (redisInfo.keyspaceHits + redisInfo.keyspaceMisses)) * 100).toFixed(2)
      : 0}%`);
    console.log(`Connected Clients: ${redisInfo.connectedClients}`);
    console.log('==================================\n');
  }

  async disconnect() {
    await this.client.disconnect();
    console.log('✅ Disconnected from Redis');
  }
}

// CLI usage
if (require.main === module) {
  const monitor = new RedisMonitor();
  
  const command = process.argv[2];
  
  switch (command) {
    case 'test':
      monitor.connect()
        .then(() => monitor.testCachePerformance())
        .then(() => monitor.disconnect())
        .catch(console.error);
      break;
      
    case 'monitor':
      monitor.connect()
        .then(() => monitor.monitorDuringLoad())
        .catch(console.error);
      break;
      
    case 'report':
      monitor.connect()
        .then(() => monitor.generateReport())
        .then(() => monitor.disconnect())
        .catch(console.error);
      break;
      
    default:
      console.log('Usage: node redis-monitor.js [test|monitor|report]');
      console.log('  test    - Run cache performance test');
      console.log('  monitor - Monitor Redis during load test');
      console.log('  report  - Generate performance report');
  }
}

module.exports = RedisMonitor;