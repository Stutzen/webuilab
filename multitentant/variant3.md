Implementation to use MyBatis exclusively without any JPA dependencies.



```java
// Model for tenant database configuration
public class TenantDataSource {
    private String tenantId;
    private String url;
    private String username;
    private String password;
    private String driverClassName;
    // Getters and Setters
}

// Mapper interface for tenant configuration
@Mapper
public interface TenantConfigMapper {
    @Select("SELECT tenant_id, url, username, password, driver_class_name FROM tenant_configs WHERE tenant_id = #{tenantId}")
    TenantDataSource getTenantConfig(String tenantId);
}

// Service to manage tenant configurations
@Service
@Slf4j
public class TenantDataSourceService {
    private final TenantConfigMapper tenantConfigMapper;
    
    public TenantDataSourceService(TenantConfigMapper tenantConfigMapper) {
        this.tenantConfigMapper = tenantConfigMapper;
    }
    
    public TenantDataSource getTenantConfig(String tenantId) {
        return tenantConfigMapper.getTenantConfig(tenantId);
    }
}

// Tenant context holder
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

// Dynamic routing datasource
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

// Request interceptor for tenant identification
@Component
public class TenantInterceptor implements HandlerInterceptor {
    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) {
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
        // Customize based on your requirements
        String tenantId = request.getParameter("tenantId");
        if (tenantId == null) {
            String domain = request.getServerName();
            // Implement domain to tenant ID mapping logic
        }
        return tenantId;
    }
}

// Configuration class
@Configuration
public class MultiTenantConfiguration {
    @Bean
    @ConfigurationProperties(prefix = "spring.datasource.central")
    public DataSource centralDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    public SqlSessionFactory centralSqlSessionFactory(@Qualifier("centralDataSource") DataSource dataSource) 
            throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(dataSource);
        
        // Configure MyBatis for central database
        org.apache.ibatis.session.Configuration configuration = 
            new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        sessionFactory.setConfiguration(configuration);
        
        // Set type aliases package if needed
        sessionFactory.setTypeAliasesPackage("com.yourcompany.model");
        
        return sessionFactory.getObject();
    }
    
    @Bean
    public DataSource multiTenantDataSource(TenantDataSourceService tenantDataSourceService) {
        MultiTenantRoutingDataSource dataSource = new MultiTenantRoutingDataSource(tenantDataSourceService);
        dataSource.setTargetDataSources(new HashMap<>());
        dataSource.afterPropertiesSet();
        return dataSource;
    }
    
    @Bean
    public SqlSessionFactory tenantSqlSessionFactory(
            @Qualifier("multiTenantDataSource") DataSource multiTenantDataSource) throws Exception {
        SqlSessionFactoryBean sessionFactory = new SqlSessionFactoryBean();
        sessionFactory.setDataSource(multiTenantDataSource);
        
        // Configure MyBatis for tenant databases
        org.apache.ibatis.session.Configuration configuration = 
            new org.apache.ibatis.session.Configuration();
        configuration.setMapUnderscoreToCamelCase(true);
        sessionFactory.setConfiguration(configuration);
        
        // Set mapper locations for tenant-specific queries
        PathMatchingResourcePatternResolver resolver = new PathMatchingResourcePatternResolver();
        sessionFactory.setMapperLocations(resolver.getResources("classpath:mappers/*.xml"));
        
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

// Example mapper for tenant-specific operations
@Mapper
public interface UserMapper {
    @Select("SELECT * FROM users WHERE id = #{id}")
    User getUserById(@Param("id") Long id);
    
    // Other tenant-specific database operations
}

```

Key changes in this MyBatis-only implementation:

1. **Configuration Changes**:
   - Removed JPA dependencies
   - Added separate `SqlSessionFactory` beans for central and tenant databases
   - Configured MyBatis settings like `mapUnderscoreToCamelCase`

2. **Data Access**:
   - Using MyBatis `@Mapper` interfaces instead of JPA repositories
   - Added example mapper with SQL queries
   - Support for both annotation-based and XML-based mapper configurations

To use this implementation:

1. Add MyBatis dependencies to your `pom.xml`:
```xml
<dependencies>
    <dependency>
        <groupId>org.mybatis.spring.boot</groupId>
        <artifactId>mybatis-spring-boot-starter</artifactId>
        <version>2.3.1</version>
    </dependency>
</dependencies>
```

2. Create mapper XML files in `src/main/resources/mappers/` for complex queries:
```xml
<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" 
    "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.yourcompany.mapper.UserMapper">
    <!-- Define complex queries here -->
</mapper>
```

3. Configure the central database in `application.properties`:
```properties
spring.datasource.central.url=jdbc:postgresql://localhost:5432/central_db
spring.datasource.central.username=admin
spring.datasource.central.password=password
mybatis.configuration.map-underscore-to-camel-case=true
```

Would you like me to explain any specific part or help you with the mapper implementations?
