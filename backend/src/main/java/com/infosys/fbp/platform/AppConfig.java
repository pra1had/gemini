package com.infosys.fbp.platform;

import net.sf.log4jdbc.sql.jdbcapi.DataSourceSpy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.jdbc.DataSourceBuilder; // Updated import
import org.springframework.boot.autoconfigure.jdbc.DataSourceProperties;
// import org.springframework.boot.context.properties.ConfigurationProperties; // No longer needed here
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
// import org.springframework.web.client.RestTemplate; // Removed import

import javax.sql.DataSource;

@Configuration
public class AppConfig {
    @Autowired
    DataSourceProperties dataSourceProperties;

    @Bean
    // @ConfigurationProperties removed - properties injected via DataSourceProperties
    DataSource realDataSource() {
        DataSource dataSource = DataSourceBuilder
                .create(this.dataSourceProperties.getClassLoader()) // ClassLoader might not be needed if type is inferred
                .driverClassName(this.dataSourceProperties.determineDriverClassName()) // Determine driver
                .url(this.dataSourceProperties.determineUrl()) // Determine URL
                .username(this.dataSourceProperties.determineUsername()) // Determine username
                .password(this.dataSourceProperties.getPassword())
                .build();
        return dataSource;
    }

    @Bean
    @Primary
    DataSource dataSource() {
        return new DataSourceSpy(realDataSource());
    }

    // RestTemplate bean moved to RestClientConfig.java
}
