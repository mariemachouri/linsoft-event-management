FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent POM
COPY pom.xml /build/pom.xml

# Copy service pom.xml and source
COPY services/users-service/pom.xml /build/services/users-service/pom.xml
COPY services/users-service/src /build/services/users-service/src

# Build the application
RUN cd /build/services/users-service && mvn clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built artifact
COPY --from=build /build/services/users-service/target/quarkus-app/lib/ /app/lib/
COPY --from=build /build/services/users-service/target/quarkus-app/*.jar /app/
COPY --from=build /build/services/users-service/target/quarkus-app/app/ /app/app/
COPY --from=build /build/services/users-service/target/quarkus-app/quarkus/ /app/quarkus/

# Expose the service port
EXPOSE 8083

# Run the application
ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]
