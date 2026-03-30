FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

# Copy parent pom first
COPY ../../pom.xml parent-pom.xml

# Copy service pom and source
COPY pom.xml .
COPY src ./src

# Build the application
RUN mvn clean package -DskipTests -f pom.xml

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the built artifact
COPY --from=build /build/target/quarkus-app/lib/ /app/lib/
COPY --from=build /build/target/quarkus-app/*.jar /app/
COPY --from=build /build/target/quarkus-app/app/ /app/app/
COPY --from=build /build/target/quarkus-app/quarkus/ /app/quarkus/

# Expose the service port
EXPOSE 8083

# Run the application
ENTRYPOINT ["java", "-jar", "/app/quarkus-run.jar"]
