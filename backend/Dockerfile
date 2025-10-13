# Use the official Rust image as the base
FROM rust:1.90

# Set the working directory inside the container
WORKDIR /app

# Copy the workspace configuration and source code
COPY . .

# Build all services in release mode
RUN cargo build --release --all

# Create a lightweight runtime image
FROM debian:bookworm-slim

# Install necessary runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /app

# Copy the built binaries from the builder stage
COPY --from=0 /app/target/release/auth_service ./bin/
COPY --from=0 /app/target/release/exercise_service ./bin/
COPY --from=0 /app/target/release/appointment_service ./bin/
COPY --from=0 /app/target/release/forum_service ./bin/
COPY --from=0 /app/target/release/chat_notification_service ./bin/

# Create startup script
RUN echo '#!/bin/bash\n\
echo "Starting all FisioNet services..."\n\
\n\
# Start auth service in background\n\
echo "Starting auth service on port 8001..."\n\
./bin/auth_service &\n\
AUTH_PID=$!\n\
\n\
# Start exercise service in background\n\
echo "Starting exercise service on port 8002..."\n\
./bin/exercise_service &\n\
EXERCISE_PID=$!\n\
\n\
# Start appointment service in background\n\
echo "Starting appointment service on port 8003..."\n\
./bin/appointment_service &\n\
APPOINTMENT_PID=$!\n\
\n\
# Start forum service in background\n\
echo "Starting forum service on port 8004..."\n\
./bin/forum_service &\n\
FORUM_PID=$!\n\
\n\
# Start chat notification service in background\n\
echo "Starting chat notification service on port 8005..."\n\
./bin/chat_notification_service &\n\
CHAT_PID=$!\n\
\n\
echo "All services started successfully!"\n\
echo "Services running with PIDs:"\n\
echo "  Auth Service: $AUTH_PID (port 8001)"\n\
echo "  Exercise Service: $EXERCISE_PID (port 8002)"\n\
echo "  Appointment Service: $APPOINTMENT_PID (port 8003)"\n\
echo "  Forum Service: $FORUM_PID (port 8004)"\n\
echo "  Chat Notification Service: $CHAT_PID (port 8005)"\n\
\n\
# Function to handle shutdown\n\
shutdown() {\n\
    echo "Shutting down services..."\n\
    kill $AUTH_PID $EXERCISE_PID $APPOINTMENT_PID $FORUM_PID $CHAT_PID 2>/dev/null\n\
    exit 0\n\
}\n\
\n\
# Trap SIGTERM and SIGINT\n\
trap shutdown SIGTERM SIGINT\n\
\n\
# Wait for all background processes\n\
wait' > /app/start_all.sh

RUN chmod +x /app/start_all.sh

# Expose all service ports
EXPOSE 8001 8002 8003 8004 8005

# Start all services
CMD ["./start_all.sh"]