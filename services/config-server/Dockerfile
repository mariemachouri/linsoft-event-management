# Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent POM
COPY pom.xml /build/pom.xml

# Copy service pom.xml and source
COPY services/config-server/pom.xml /build/services/config-server/pom.xml
COPY services/config-server/src /build/services/config-server/src

# Build
RUN cd /build/services/config-server && mvn clean package -DskipTests

# Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /build/services/config-server/target/*.jar app.jar

EXPOSE 8888

ENTRYPOINT ["java", "-jar", "app.jar"]
