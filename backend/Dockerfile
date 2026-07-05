# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /source

# Copy solution and project files
COPY *.slnx .
COPY src/PMP.API/*.csproj src/PMP.API/
COPY src/PMP.Application/*.csproj src/PMP.Application/
COPY src/PMP.Domain/*.csproj src/PMP.Domain/
COPY src/PMP.Infrastructure/*.csproj src/PMP.Infrastructure/
COPY src/PMP.Shared/*.csproj src/PMP.Shared/

# Restore dependencies
RUN dotnet restore src/PMP.API/PMP.API.csproj

# Copy everything else and build
COPY . .
WORKDIR /source/src/PMP.API
RUN dotnet publish -c Release -o /app

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /app .

# Create uploads directory if needed
RUN mkdir -p /app/wwwroot/uploads

ENTRYPOINT ["dotnet", "PMP.API.dll"]
