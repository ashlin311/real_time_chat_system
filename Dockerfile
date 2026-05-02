# ---- Stage 1: Build the frontend ----
FROM node:20-alpine AS frontend-build
WORKDIR /app/cipher-slate
COPY cipher-slate/package.json cipher-slate/package-lock.json ./
RUN npm ci
COPY cipher-slate/ ./
RUN npm run build

# ---- Stage 2: Build the backend ----
FROM maven:3.9-eclipse-temurin-21 AS backend-build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (cached unless pom.xml changes)
RUN mvn dependency:go-offline -B
COPY src ./src
# Copy the built frontend into Spring Boot's static folder
COPY --from=frontend-build /app/cipher-slate/dist ./src/main/resources/static
RUN mvn clean package -DskipTests -B

# ---- Stage 3: Run the app ----
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Copy the compiled JAR from the build stage
COPY --from=backend-build /app/target/*.jar app.jar

# Expose the port the app runs on
EXPOSE 8080

# Start the application
ENTRYPOINT ["java", "-Xmx256m", "-Xms128m", "-jar", "app.jar"]
