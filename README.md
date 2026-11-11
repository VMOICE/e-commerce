# MobileStore — loja virtual

Loja virtual acadêmica com frontend em HTML/CSS/JavaScript e API REST Laravel. O pagamento é simulado: a aplicação não solicita nem armazena dados de cartão. O frete é grátis.

## Executar localmente

Requer Docker Desktop e Docker Compose:

```powershell
if (-not (Test-Path backend\.env)) {
    Copy-Item backend\.env.example backend\.env
}
docker compose up -d --build
if (-not (Select-String -Path backend\.env -Pattern '^APP_KEY=base64:.+' -Quiet)) {
    docker compose exec api php artisan key:generate
}
docker compose exec api php artisan migrate --force
docker compose exec api php artisan db:seed
```

- Frontend: http://localhost:5173
- API: http://localhost:8081/api
- Swagger UI: http://localhost:8081/api/docs
- OpenAPI: http://localhost:8081/api/docs/openapi.yaml

O bloco gera o `APP_KEY` apenas quando ele ainda não está configurado. Evite
trocar essa chave depois de usar a aplicação, pois isso invalida os dados de
sessão criptografados com a chave anterior.

O volume `postgres_data` persiste o banco; `product_storage` persiste as imagens enviadas para `storage/app/public`. Os produtos de demonstração usam ilustrações SVG locais por categoria até que uma imagem de produto seja enviada. Para expor imagens enviadas, execute uma vez:

```powershell
docker compose exec api php artisan storage:link
```

### Contas de demonstração

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@loja.test` | `Admin123!` |
| Cliente | `cliente1@loja.test` | `Cliente123!` |
| Cliente | `cliente2@loja.test` | `Cliente123!` |
| Cliente | `cliente3@loja.test` | `Cliente123!` |

O seeder inclui três categorias, 30 produtos, produto sem estoque e produto inativo, carrinho de cliente e pedidos com os cinco status.

## Fluxos e regras

- O catálogo é público e oferece busca, categoria, ordenação e paginação.
- Carrinhos anônimos são associados à sessão Laravel do visitante; o cookie de sessão identifica o carrinho e o banco guarda somente o hash do identificador da sessão. No login/registro, itens são somados, limitados ao estoque e o carrinho visitante é descartado.
- Checkout exige um endereço salvo, congela endereço e preços no pedido e baixa estoque dentro de transação.
- A criação do pedido usa status `pending`; o cliente confirma o pagamento simulado para `paid`. O administrador avança `paid → shipped → delivered`. O pedido `pending` pode ser cancelado, com devolução do estoque.
- Valores são `decimal(10,2)` no banco; totais são calculados no servidor usando centavos inteiros.

## Organização do frontend

- `frontend/src/api/` concentra as chamadas HTTP; `app/handlers/` organiza os fluxos por funcionalidade e atualiza o estado em `app/state.js`.
- `domain/` mantém regras de apresentação do domínio, como contagem de itens e status.
- `ui/` separa as telas em módulos por fluxo (`catalog-view`, `cart-view`, `auth-view`, `account-view`, `checkout-view`, `orders-view` e `admin-view`). `routes.js` centraliza as rotas, a identificação dos acessos autenticados e a associação de cada rota à sua tela; `render.js` monta a aplicação e vincula os eventos.
- `ui/format.js` reúne formatação e utilitários compartilhados pelas telas.

## Testes

```powershell
docker compose exec api php artisan test
Set-Location frontend
npm run build
```

Os testes do Laravel são isolados em SQLite em memória, sem alterar o PostgreSQL usado pela loja local.

## Configuração

O Compose atual é para desenvolvimento e injeta credenciais locais do PostgreSQL. Não reutilize essas credenciais em produção. O frontend permite configurar `VITE_API_BASE_URL` e `VITE_STORAGE_BASE_URL`; ao criar a imagem, passe os valores como build args. O backend usa `backend/.env.example` como referência para variáveis de ambiente e requer uma `APP_KEY` gerada para cada ambiente.

O Dockerfile de produção do frontend serve a build estática com Nginx; o Dockerfile do backend executa PHP-FPM e precisa ser colocado atrás de um servidor HTTP FastCGI (como o Nginx de `docker/nginx/api.conf`). Configure cookies de sessão, CORS, domínios Sanctum, banco PostgreSQL e armazenamento persistente conforme o domínio implantado.

Exemplo de build para domínios separados:

```powershell
docker build --build-arg VITE_API_BASE_URL=https://api.exemplo.com/api --build-arg VITE_STORAGE_BASE_URL=https://api.exemplo.com/storage -t mobilestore-frontend ./frontend
docker build -t mobilestore-api ./backend
```
