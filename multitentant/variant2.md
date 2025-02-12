Implementation to handle dynamic tenant data sources with connection details stored in a separate database.



```java
// TenantDataSourceConfig.java
@Data
@Entity
@Table(name = "tenant_datasources")
public class TenantDataSourceConfig {
    @Id
    private String tenantId;
    private String url;
    private String username;
    private String password;
    private String driverClassName;
    
    // Additional properties like pool size, timeout etc.
    private int maxPoolSize = 10;
    private int minIdle = 5;
    private int idleTimeout = 300000;
}

// TenantDataSourceConfigRepository.java
@Repository
public interface TenantDataSourceConfigRepository extends JpaRepository<TenantDataSourceConfig, String> {
}

// DataSourceFactory.java
@Component
@Slf4j
public class DataSourceFactory {
    public DataSource createDataSource(TenantDataSourceConfig config) {
        HikariDataSource ds = new HikariDataSource();
        ds.setJdbcUrl(config.getUrl());
        ds.setUsername(config.getUsername());
        ds.setPassword(config.getPassword());
        ds.setDriverClassName(config.getDriverClassName());
        ds.setMaximumPoolSize(config.getMaxPoolSize());
        ds.setMinimumIdle(config.getMinIdle());
        ds.setIdleTimeout(config.getIdleTimeout());
        return ds;
    }
}

// DynamicTenantDataSourceProvider.java
@Component
@Slf4j
public class DynamicTenantDataSourceProvider {
    private final Map<String, DataSource> dataSourceMap = new ConcurrentHashMap<>();
    
    @Autowired
    private TenantDataSourceConfigRepository configRepository;
    
    @Autowired
    private DataSourceFactory dataSourceFactory;
    
    public DataSource getDataSource(String tenantId) {
        return dataSourceMap.computeIfAbsent(tenantId, this::createDataSource);
    }
    
    private DataSource createDataSource(String tenantId) {
        TenantDataSourceConfig config = configRepository.findById(tenantId)
            .orElseThrow(() -> new TenantNotFoundException("Tenant not found: " + tenantId));
        return dataSourceFactory.createDataSource(config);
    }
    
    public void refreshDataSource(String tenantId) {
        DataSource oldDs = dataSourceMap.remove(tenantId);
        if (oldDs instanceof HikariDataSource) {
            ((HikariDataSource) oldDs).close();
        }
        // The next getDataSource call will create a new data source
    }
}

// MultiTenantDataSource.java
@Component
public class MultiTenantDataSource extends AbstractRoutingDataSource {
    
    @Autowired
    private DynamicTenantDataSourceProvider dataSourceProvider;
    
    @Override
    protected Object determineCurrentLookupKey() {
        return TenantContext.getTenant();
    }
    
    @Override
    protected DataSource determineTargetDataSource() {
        String tenantId = (String) determineCurrentLookupKey();
        if (tenantId == null) {
            throw new TenantNotFoundException("No tenant specified");
        }
        return dataSourceProvider.getDataSource(tenantId);
    }
}

// DataSourceConfig.java
@Configuration
@EnableJpaRepositories(
    basePackages = "com.example.config.repository",
    // Configure EntityManager for the config database
    entityManagerFactoryRef = "configEntityManagerFactory",
    transactionManagerRef = "configTransactionManager"
)
public class DataSourceConfig {
    
    @Bean
    @ConfigurationProperties(prefix = "config.datasource")
    public DataSource configDataSource() {
        return DataSourceBuilder.create().build();
    }
    
    @Bean
    public LocalContainerEntityManagerFactoryBean configEntityManagerFactory(
            EntityManagerFactoryBuilder builder,
            @Qualifier("configDataSource") DataSource dataSource) {
        return builder
            .dataSource(dataSource)
            .packages(TenantDataSourceConfig.class)
            .build();
    }
    
    @Bean
    public PlatformTransactionManager configTransactionManager(
            @Qualifier("configEntityManagerFactory") EntityManagerFactory entityManagerFactory) {
        return new JpaTransactionManager(entityManagerFactory);
    }
    
    @Bean
    public DataSource multiTenantDataSource() {
        return new MultiTenantDataSource();
    }
}

// application.yml
config:
  datasource:
    url: jdbc:postgresql://localhost:5432/tenant_config
    username: config_user
    password: config_password
    driver-class-name: org.postgresql.Driver

# SQL for tenant_datasources table
/*
CREATE TABLE tenant_datasources (
    tenant_id VARCHAR(50) PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    username VARCHAR(100) NOT NULL,
    password VARCHAR(100) NOT NULL,
    driver_class_name VARCHAR(100) NOT NULL,
    max_pool_size INT DEFAULT 10,
    min_idle INT DEFAULT 5,
    idle_timeout INT DEFAULT 300000
);
*/

```

Key changes and improvements in this version:

1. **Dynamic Data Source Management**:
   - Tenant database configurations are stored in a separate config database
   - Data sources are created on-demand and cached
   - Uses ConcurrentHashMap for thread-safe data source management

2. **Connection Pool Management**:
   - Each tenant gets its own connection pool
   - Pool settings are configurable per tenant
   - Proper cleanup of unused connections

3. **Configuration Database**:
   - Separate EntityManager for config database
   - JPA repository for easy CRUD operations on tenant configs
   - Configurable through application.yml

4. **Performance Optimizations**:
   - Lazy initialization of data sources
   - Connection pooling per tenant
   - Caching of DataSource instances

To use this implementation:

1. Create the config database and tenant_datasources table
2. Configure the config database connection in application.yml
3. Add tenant configurations to the tenant_datasources table
4. Use the existing TenantContext and TenantInterceptor from the previous implementation

Example of adding a new tenant configuration:
```java
@Service
public class TenantManagementService {
    @Autowired
    private TenantDataSourceConfigRepository repository;
    @Autowired
    private DynamicTenantDataSourceProvider dataSourceProvider;
    
    public void addTenant(String tenantId, String url, String username, String password) {
        TenantDataSourceConfig config = new TenantDataSourceConfig();
        config.setTenantId(tenantId);
        config.setUrl(url);
        config.setUsername(username);
        config.setPassword(password);
        config.setDriverClassName("org.postgresql.Driver");
        repository.save(config);
    }
    
    public void refreshTenantConnection(String tenantId) {
        dataSourceProvider.refreshDataSource(tenantId);
    }
}
```

Would you like me to explain any specific part in more detail or show how to implement additional features like:
- Connection pool monitoring
- Tenant configuration encryption
- Automatic tenant data source cleanup
- Health checks for tenant databases?
