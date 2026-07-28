FROM maven:3.9-eclipse-temurin-17-alpine AS builder

WORKDIR /workspace

COPY pom.xml .
RUN mvn -B -DskipTests dependency:go-offline

COPY src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:17-jre-alpine

RUN addgroup -S fitcha && adduser -S fitcha -G fitcha

WORKDIR /app

COPY --from=builder --chown=fitcha:fitcha /workspace/target/fitchaadmin-*.jar app.jar

USER fitcha

EXPOSE 8081

ENTRYPOINT ["java", "-XX:MaxRAMPercentage=75.0", "-jar", "/app/app.jar"]
