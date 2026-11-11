# Backend Laravel

A documentação de execução do projeto completo, credenciais locais, regras de carrinho/pedidos, testes e Docker está no [README da raiz](../README.md).

Endpoints da API: `routes/api.php`. A interface Swagger UI está disponível em
`http://localhost:8081/api/docs` e o contrato OpenAPI em
`http://localhost:8081/api/docs/openapi.yaml` durante a execução local.

Os testes podem ser executados com `docker compose exec api php artisan test` a partir da raiz do repositório.
