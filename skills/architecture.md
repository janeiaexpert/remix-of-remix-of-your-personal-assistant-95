# Arquitetura de Software

## Princípios
- **Separação de responsabilidades**: cada módulo tem um único motivo para mudar
- **Inversão de dependência**: dependa de abstrações, não de implementações
- **Composição sobre herança**: prefira composição para reutilizar código
- **Fail fast**: valide entradas cedo e falhe com mensagens claras

## Padrões que domino
- **Criacionais**: Factory, Builder, Singleton, Prototype
- **Estruturais**: Adapter, Facade, Proxy, Decorator, Composite
- **Comportamentais**: Observer, Strategy, Command, State, Chain of Responsibility
- **Arquiteturais**: MVC, MVVM, Clean Architecture, Hexagonal, Event-Driven, CQRS, Microservices

## Quando usar cada padrão
- **Factory**: criação complexa de objetos com variações
- **Strategy**: algoritmos intercambiáveis em runtime
- **Observer**: eventos e notificações desacopladas
- **Adapter**: integração com APIs legadas ou terceiros
- **Facade**: simplificar subsistemas complexos

## Decisões de arquitetura
- Monólito primeiro, microserviços quando escalar
- Stateless quando possível, stateful quando necessário
- Cache em camadas: CDN → Edge → App → DB
- Event-driven para fluxos assíncronos e desacoplados
