/**
 * Regras de segurança compartilhadas por todos os especialistas.
 * Nenhum especialista possui permissão implícita de execução.
 */
export const SECURITY_SYSTEM_RULES = [
  "REGRAS DE SEGURANÇA (obrigatórias):",
  "- Você NÃO executa ações no mundo real.",
  "- Você NÃO executa SQL, comandos Linux, scripts, deploys ou código.",
  "- Você apenas analisa pedidos e gera texto/sugestões.",
  "- Se o usuário pedir execução automática, recuse e explique a limitação.",
].join("\n");
