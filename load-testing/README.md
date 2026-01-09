# 🚀 Event Tracker MVP Load Testing Suite

This comprehensive load testing suite is designed to test your Event Tracker MVP under heavy load conditions and verify that Redis caching is working effectively.

## 📋 What This Suite Tests

### 🎯 **Performance Metrics**
- **Response Times**: P50, P95, P99 percentiles
- **Throughput**: Requests per second
- **Error Rates**: Success/failure ratios
- **Concurrent Users**: Up to 100 simultaneous users
- **System Stability**: Under sustained load

### 🔄 **Redis Caching Verification**
- **Cache Hit Ratios**: Percentage of requests served from cache
- **Memory Usage**: Redis memory consumption
- **Performance Improvements**: Before/after caching comparison
- **Cache Effectiveness**: Real-time monitoring

### 🌐 **API Endpoints Tested**
- **Authentication**: Registration and login flows
- **Events API**: Listing, creation, and details (heavily cached)
- **Users API**: User listings with filtering (cached)
- **QR Code Generation**: Event QR codes
- **Check-in Process**: Student event check-ins

## 🛠️ **Setup Instructions**

### **Prerequisites**
1. **Node.js** (v16 or higher)
2. **Redis Server** running locally or remotely
3. **PowerShell** (for Windows automation)
4. **Your Event Tracker backend** running on port 5000

### **Installation**
```bash
# Navigate to load testing directory
cd load-testing

# Install dependencies and tools
npm run setup

# Or manually:
npm install
npm install -g artillery
```

## 🚀 **Running Load Tests**

### **Method 1: Full Automated Suite (Recommended)**
```powershell
# Run complete load testing suite with Redis monitoring
npm run load-test

# Or directly:
powershell -ExecutionPolicy Bypass -File ./run-load-test.ps1
```

### **Method 2: Individual Tests**
```bash
# Test Redis cache performance
npm run test-cache

# Start Redis monitoring
npm run monitor

# Run quick load test
npm run load-test-quick

# Generate Redis report
npm run report
```

### **Method 3: Custom Configuration**
```powershell
# Custom target and duration
./run-load-test.ps1 -Target "http://your-server:5000" -Duration 600
```

## 📊 **Test Phases**

### **Phase 1: Cache Performance Test** (30 seconds)
- Tests individual endpoints for caching effectiveness
- Measures performance improvement from Redis
- Establishes baseline metrics

### **Phase 2: Load Ramp-Up** (5 minutes)
```
Warm-up:    5 users/sec for 30s
Ramp-up:    10-50 users/sec over 60s
Sustained:  50 users/sec for 120s
Peak:       100 users/sec for 60s
Cool-down:  10 users/sec for 30s
```

### **Phase 3: Real-time Monitoring**
- Redis memory usage tracking
- Cache hit/miss ratios
- Connection monitoring
- Performance metrics

## 📈 **Understanding Results**

### **Good Performance Indicators**
✅ **Response Times**
- P95 < 2 seconds
- P99 < 5 seconds
- Consistent across load phases

✅ **Cache Performance**
- Hit ratio > 70% after warm-up
- Significant response time improvement
- Memory usage stable

✅ **System Stability**
- Error rate < 5%
- No memory leaks
- Graceful handling of peak load

### **Red Flags**
❌ **Performance Issues**
- P95 > 5 seconds
- Increasing response times
- High error rates (>10%)

❌ **Cache Problems**
- Low hit ratios (<30%)
- No performance improvement
- Excessive memory usage

❌ **System Issues**
- Frequent timeouts
- Database connection errors
- Server crashes

## 🔍 **Redis Monitoring Commands**

### **Manual Redis Inspection**
```bash
# Connect to Redis CLI
redis-cli

# Check memory usage
redis-cli info memory

# Monitor real-time commands
redis-cli monitor

# Check cache keys
redis-cli keys "*"

# Get cache statistics
redis-cli info stats
```

### **Key Redis Metrics**
- **used_memory_human**: Human-readable memory usage
- **keyspace_hits**: Total cache hits
- **keyspace_misses**: Total cache misses
- **connected_clients**: Active connections

## 📁 **Report Analysis**

### **Artillery Reports**
- **JSON Report**: Raw data and metrics
- **HTML Report**: Visual charts and graphs
- **Console Output**: Real-time progress

### **Redis Reports**
- **Cache Performance**: Hit/miss ratios
- **Memory Usage**: Growth over time
- **Connection Stats**: Client connections

## 🛡️ **Troubleshooting**

### **Common Issues**

**Backend Not Responding**
```bash
# Check if backend is running
curl http://localhost:5000/api/health

# Check backend logs
# Restart backend if necessary
```

**Redis Connection Failed**
```bash
# Check Redis status
redis-cli ping

# Start Redis server
redis-server

# Check Redis configuration
redis-cli info server
```

**High Error Rates**
- Check rate limiting settings
- Verify database connections
- Monitor server resources

**Low Cache Hit Ratios**
- Verify caching middleware is enabled
- Check cache TTL settings
- Ensure proper cache key generation

## 🎯 **Optimization Tips**

### **Improving Performance**
1. **Database Indexing**: Add indexes on frequently queried columns
2. **Connection Pooling**: Optimize database connection pools
3. **Caching Strategy**: Implement more aggressive caching
4. **Rate Limiting**: Fine-tune rate limiting rules

### **Redis Optimization**
1. **Memory Management**: Set appropriate maxmemory policies
2. **Persistence**: Configure appropriate persistence settings
3. **Eviction Policies**: Use LRU eviction for cache data
4. **Connection Pooling**: Implement Redis connection pooling

## 📝 **Custom Test Scenarios**

### **Creating Custom Tests**
Modify `artillery-config.yml` to add custom scenarios:

```yaml
scenarios:
  - name: "Custom Scenario"
    weight: 10
    flow:
      - post:
          url: "/api/custom-endpoint"
          json:
            customData: "test"
```

### **Adding Test Data**
Update `test-data.csv` with relevant test data for your scenarios.

## 🔧 **Advanced Configuration**

### **Environment Variables**
```bash
export REDIS_HOST=localhost
export REDIS_PORT=6379
export API_TARGET=http://localhost:5000
```

### **Custom Thresholds**
Modify performance thresholds in `artillery-config.yml`:
```yaml
ensure:
  maxErrorRate: 2    # Stricter error rate
  p95: 1000         # Faster response time requirement
  p99: 3000         # Stricter P99 requirement
```

## 🎉 **Success Criteria**

Your Event Tracker MVP passes load testing if:

✅ **Performance**
- Handles 100+ concurrent users
- Maintains sub-2s response times
- Error rate below 5%

✅ **Scalability**
- Linear performance scaling
- No memory leaks
- Stable under sustained load

✅ **Caching**
- Redis hit ratio > 70%
- 40%+ performance improvement
- Efficient memory usage

✅ **Reliability**
- Graceful degradation
- Proper error handling
- Quick recovery from peak load

---

## 🆘 **Support**

If you encounter issues:
1. Check the troubleshooting section
2. Review the generated reports
3. Monitor Redis and backend logs
4. Adjust test parameters if needed

Happy load testing! 🚀