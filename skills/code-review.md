# Code Review e Qualidade

## Checklist de revisão
1. **Corretitude**: o código faz o que deveria? Edge cases cobertos?
2. **Legibilidade**: outro desenvolvedor entende em 30 segundos?
3. **Testes**: há testes? Cobrem os casos principais e edge cases?
4. **Segurança**: inputs validados? Segredos protegidos? SQL injection?
5. **Performance**: N+1? Loop desnecessário? Memory leak?
6. **Manutenibilidade**: código duplicado? Acoplamento alto? Nomes ruins?

## Métricas de qualidade
- **Complexidade ciclomática**: < 10 por função
- **Cobertura de testes**: > 80% para código crítico
- **Duplicação**: < 3% do codebase
- **Tamanho de função**: < 50 linhas idealmente
- **Tamanho de arquivo**: < 400 linhas idealmente

## Code smells a evitar
- Funções longas demais
- Classes com muitas responsabilidades
- Código duplicado
- Nomes genéricos (data, info, temp)
- Comentários que explicam "o quê" em vez de "por quê"
- Números mágicos sem constante
- Tratamento de erro vazio (catch sem ação)

## Refatoração
- Extrair método quando função > 20 linhas
- Extrair classe quando arquivo > 400 linhas
- Substituir condicionais por polimorfismo
- Eliminar código morto sem medo
