# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent POM
COPY pom.xml /build/pom.xml

# Copy service pom.xml and source
COPY services/eureka-server/pom.xml /build/services/eureka-server/pom.xml
COPY services/eureka-server/src /build/services/eureka-server/src

# Build
RUN cd /build/services/eureka-server && mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/services/eureka-server/target/*.jar app.jar

EXPOSE 8761

ENTRYPOINT ["java", "-jar", "app.jar"]
