package com.eventmgmt.gateway.config;

import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.annotation.Order;
import reactor.core.publisher.Mono;

@Configuration
public class GatewayConfig {

    @Bean
    @Order(1)
    public GlobalFilter requestLoggingFilter() {
        return (exchange, chain) -> {
            String path = exchange.getRequest().getPath().toString();
            String method = exchange.getRequest().getMethod().toString();
            
            System.out.println("Request: " + method + " " + path);
            
            return chain.filter(exchange).then(Mono.fromRunnable(() -> {
                System.out.println("Response status: " + exchange.getResponse().getStatusCode());
            }));
        };
    }
}
