# Configuration Guide for Eureka Integration with Quarkus Services

## Option 1: Using Quarkus Consul Extension (Recommended for Quarkus)

For production Quarkus applications, it's recommended to use Consul or Kubernetes service discovery.
However, if you need Eureka integration, you can use the SmallRye Stork extension.

## Option 2: Manual Eureka Registration

Add the following dependencies to each Quarkus service `pom.xml`:

```xml
<dependency>
    <groupId>com.netflix.eureka</groupId>
    <artifactId>eureka-client</artifactId>
    <version>2.0.3</version>
</dependency>
```

## Option 3: Native registration through application.properties

For each Quarkus service, you can configure the port in `application.properties`:

### Events Service (services/events-service/src/main/resources/application.properties)
```properties
quarkus.http.port=8081
quarkus.application.name=events-service
```

### Registrations Service (services/registrations-service/src/main/resources/application.properties)
```properties
quarkus.http.port=8082
quarkus.application.name=registrations-service
```

### Users Service (services/users-service/src/main/resources/application.properties)
```properties
quarkus.http.port=8083
quarkus.application.name=users-service
```

### Notifications Service (services/notifications-service/src/main/resources/application.properties)
```properties
quarkus.http.port=8084
quarkus.application.name=notifications-service
```

### Dashboard Service (services/dashboard-service/src/main/resources/application.properties)
```properties
quarkus.http.port=8085
quarkus.application.name=dashboard-service
```

### Charges Service (services/charges-service/src/main/resources/application.properties)
```properties
quarkus.http.port=8086
quarkus.application.name=charges-service
```

## Hybrid Architecture Note

This project uses a hybrid architecture:
- **Spring Boot Services**: Eureka Server, Config Server, Gateway (native Eureka support)
- **Quarkus Services**: Business services (can register manually or use service mesh)

For development, the Gateway can route to services by direct URL configuration.
For production, consider:
1. Using Kubernetes with native service discovery
2. Implementing a service mesh (Istio, Linkerd)
3. Using Consul for both Spring Boot and Quarkus services
