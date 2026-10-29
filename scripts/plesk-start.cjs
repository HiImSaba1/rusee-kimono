// Plesk/Passenger entry point. The application must be built first.
// Plesk supplies PORT, HOSTNAME and all production environment variables.
void import("../.next/standalone/server.js");
