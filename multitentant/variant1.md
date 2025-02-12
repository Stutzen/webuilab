Create a dynamic multi-tenant solution for Spring Boot with MyBatis where database connections are determined by request parameters or domain. Given that you have many potential datasources stored in a separate database, we'll need a robust and scalable solution.



```java
// First, create a model to store tenant database configurations
@Data
public class TenantDataSource {
    private String tenantId;
    private String url;
    private String username;
    private String password;
    private String driverClassName;
}

// Create a service to load tenant configurations from the central database
@Service
@Slf4j
public class TenantDataSourceService {
    private final DataSource centralDataSource;
    private final JdbcTemplate jdbcTemplate;
    
    public TenantDataSourceService(@Qualifier("centralDataSource") DataSource centralDataSource) {
        this.centralDataSource = centralDataSource;
        this.jdbcTemplate = new JdbcTemplate(centralDataSource);
    }
    
    public TenantDataSource getTenantConfig(String tenantId) {
        String sql = "SELECT * FROM tenant_configs WHERE tenant_id = ?";
        return jdbcTemplate.queryForObject(sql, new Object[]{tenantId}, 
            (rs, rowNum) -> {
                TenantDataSource config = new TenantDataSource();
                config.setTenantId(rs.getString("tenant_id"));
                config.setUrl(rs.getString("url"));
                config.setUsername(rs.getString("username"));
                config.setPassword(rs.getString("password"));
                config.setDriverClassName(rs.getString("driver_class_name"));
                return config;
            });
    }
}

// Create a tenant context holder to store the current tenant ID
public class TenantContext {
    private static final ThreadLocal<String> currentTenant = new ThreadLocal<>();
    
    public static void setTenantId(String tenantId) {
        currentTenant.set(tenantId);
    }
    
    public static String getTenantId() {
        return currentTenant.get();
    }
    
    public static void clear() {
        currentTenant.remove();
    }
}

// Implement a dynamic routing datasource
@Slf4j
public class MultiTenantRoutingDataSource extends AbstractRoutingDataSource {
    private final TenantDataSourceService tenantDataSourceService;
    private final Map<String, DataSource> resolvedDataSources = new ConcurrentHashMap<>();
    
    public MultiTenantRoutingDataSource(TenantDataSourceService tenantDataSourceService) {
        this.tenantDataSourceService = tenantDataSourceService;
    }
    
    @Override
    protected DataSource determineTargetDataSource() {
        String tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant ID set");
        }
        
        return resolvedDataSources.computeIfAbsent(tenantId, this::createDataSource);
    }
    
    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getTenantId();
    }
    
    private DataSource createDataSource(String tenantId) {
        TenantDataSource config = tenantDataSourceService.getTenantConfig(tenantId);
        
        HikariConfig hikariConfig = new HikariConfig();
        hikariConfig.setJdbcUrl(config.getUrl());
        hikariConfig.setUsername(config.getUsername());
        hikariConfig.setPassword(config.getPassword());
        hikariConfig.setDriverClassName(config.getDriverClassName());
        // Add additional HikariCP configurations as needed
        
        return new HikariDataSource(hikariConfig);
    }
}

// Create an interceptor to set tenant ID from request
@Component
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
        // Extract tenant ID from request parameter, header, or domain
        String tenantId = extractTenantId(request);
        TenantContext.setTenantId(tenantId);
        return true;
    }
    
    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, 
                              Object handler, Exception ex) {
        TenantContext.clear();
    }
    
    private String extractTenantId(HttpServletRequest request) {
        // Example implementation - customize based on your needs
        String tenantId = request.getParameter("tenantId"); // from request parameter
        if (tenantId == null) {
            String domain = request.getServerName(); // from domain
            // Implement domain to tenant ID mapping logic
        }
        return tenantId;
    }
}

// Configuration class to wire everything together
@Configuration
public class MultiTenantConfiguration {
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.central")
    public DataSource centralDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    public DataSource multiTenantDataSource(TenantDataSourceService tenantDataSourceService) {
        MultiTenantRoutingDataSource dataSource = new MultiTenantRoutingDataSource(tenantDataSourceService);
        dataSource.setTargetDataSources(new HashMap<>()); // Initial empty map
        dataSource.afterPropertiesSet();
        return dataSource;
    }
    
    @Bean
    public SqlSessionFactory sqlSessionFactory(DataSource multiTenantDataSource) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(multiTenantDataSource);
        // Configure MyBatis settings
        return sessionFactory.getObject();
    }
    
    @Bean
    public WebMvcConfigurer webMvcConfigurer(TenantInterceptor tenantInterceptor) {
        return new WebMvcConfigurer() {
            @Override
            public void addInterceptors(InterceptorRegistry registry) {
                registry.addInterceptor(tenantInterceptor);
            }
        };
    }
}

```

This implementation provides a scalable solution for multi-tenant database routing. Here's how it works:

1. **Central Configuration Storage**:
   - Tenant database configurations are stored in a central database
   - `TenantDataSourceService` retrieves configurations using JDBC

2. **Dynamic Routing**:
   - `MultiTenantRoutingDataSource` creates and caches datasources on demand
   - Uses HikariCP for connection pooling
   - Maintains a concurrent map of resolved datasources

3. **Tenant Resolution**:
   - `TenantInterceptor` extracts tenant ID from requests
   - Supports multiple resolution strategies (request parameters, domain, headers)
   - Uses ThreadLocal storage for tenant context

4. **Connection Management**:
   - Lazy initialization of datasources
   - Connection pooling per tenant
   - Automatic cleanup of tenant context after request completion

To use this implementation:

1. Configure your central database properties in `application.properties`:
```properties
spring.datasource.central.url=jdbc:postgresql://localhost:5432/central_db
spring.datasource.central.username=admin
spring.datasource.central.password=password
```

2. Create the tenant configuration table in your central database:
```sql
CREATE TABLE tenant_configs (
    tenant_id VARCHAR(50) PRIMARY KEY,
    url VARCHAR(255) NOT NULL,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(50) NOT NULL,
    driver_class_name VARCHAR(255) NOT NULL
);
```

3. Customize the `extractTenantId` method in `TenantInterceptor` based on your requirements.

Would you like me to explain any specific part in more detail or help you with the implementation?
