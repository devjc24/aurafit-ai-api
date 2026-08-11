process.env.NODE_ENV = process.env.NODE_ENV || "test";
process.env.PORT = process.env.PORT || "3000";
process.env.OLLAMA_URL = process.env.OLLAMA_URL || "http://127.0.0.1:11434";
process.env.MODEL = process.env.MODEL || "test-model";
process.env.LOG_LEVEL = process.env.LOG_LEVEL || "error";
process.env.AURA_HUB_M2M_API_KEY =
  process.env.AURA_HUB_M2M_API_KEY || "test-aura-hub-m2m-key";
process.env.M2M_AUTH_REQUIRED = process.env.M2M_AUTH_REQUIRED || "false";
