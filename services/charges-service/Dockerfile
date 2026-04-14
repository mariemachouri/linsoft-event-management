# ====================================================================
# Dockerfile for Charges Service (Quarkus)
# ====================================================================

# Stage 1: Build with Maven
FROM maven:3.9.6-eclipse-temurin-21-alpine AS build
WORKDIR /build

# Copy parent POM first
COPY pom.xml /build/pom.xml

# Copy service pom.xml
COPY services/charges-service/pom.xml /build/services/charges-service/pom.xml

# Download dependencies
RUN cd /build/services/charges-service && mvn dependency:go-offline -B || true

# Copy source code and build
COPY services/charges-service/src /build/services/charges-service/src
RUN cd /build/services/charges-service && mvn clean package -DskipTests

# Stage 2: Runtime with JRE
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy Quarkus application from build stage
COPY --from=build /build/services/charges-service/target/quarkus-app/lib/ /app/lib/
COPY --from=build /build/services/charges-service/target/quarkus-app/*.jar /app/
COPY --from=build /build/services/charges-service/target/quarkus-app/app/ /app/app/
COPY --from=build /build/services/charges-service/target/quarkus-app/quarkus/ /app/quarkus/

# Expose port
EXPOSE 8086

# Run the application
CMD ["java", "-jar", "/app/quarkus-run.jar"]
