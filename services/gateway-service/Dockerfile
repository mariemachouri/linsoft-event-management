# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent POM
COPY pom.xml /build/pom.xml

# Copy service pom.xml and source
COPY services/gateway-service/pom.xml /build/services/gateway-service/pom.xml
COPY services/gateway-service/src /build/services/gateway-service/src

# Build
RUN cd /build/services/gateway-service && mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/services/gateway-service/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
