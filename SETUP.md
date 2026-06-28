# CAT Store — Guia de Instalação

## Pré-requisitos

1. **Node.js 18+** — Baixe em https://nodejs.org (LTS recomendado)
2. **PostgreSQL** — Baixe em https://www.postgresql.org/download/windows/

Após instalar, abra um novo terminal para o PATH ser atualizado.

## 1. Instalar dependências

```bash
cd cat-store
npm install
```

## 2. Configurar banco de dados

Edite o arquivo `.env` com as suas credenciais do PostgreSQL:

```
DATABASE_URL="postgresql://SEU_USUARIO:SUA_SENHA@localhost:5432/catstore"
NEXTAUTH_SECRET="cat-store-secret-key-2024"
NEXTAUTH_URL="http://localhost:3000"
```

## 3. Criar banco e executar migrações

```bash
# Gerar o client Prisma
npm run db:generate

# Criar as tabelas
npm run db:push

# Popular com dados de exemplo
npm run db:seed
```

## 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Acesse:
- **Loja**: http://localhost:3000
- **Admin**: http://localhost:3000/admin

## Credenciais padrão

| Tipo    | Email                   | Senha       |
|---------|-------------------------|-------------|
| Admin   | admin@catstore.com      | admin123    |
| Cliente | cliente@exemplo.com     | cliente123  |

## Estrutura do projeto

```
src/
├── app/
│   ├── (store)/         # Loja pública
│   ├── (admin)/         # Painel administrativo
│   └── api/             # API routes
├── components/
│   ├── store/           # Componentes da loja
│   ├── admin/           # Componentes do admin
│   └── ui/              # Componentes base (shadcn)
├── lib/                 # Utilitários e configurações
├── hooks/               # React hooks
└── types/               # Tipos TypeScript
```

## Funcionalidades V1

### Loja
- Home com hero banner (carousel)
- Listagem de produtos com filtros
- Página de detalhe do produto
- Carrinho (localStorage)
- Checkout
- Área do cliente (login/cadastro)
- Histórico e rastreamento de pedidos

### Admin
- Dashboard com métricas
- CRUD de produtos com variantes e imagens
- Gerenciamento de categorias
- Gestão de pedidos com status e rastreio
- Lista de clientes
- Controle de estoque com alerta de baixo estoque
- Importação CSV de produtos
- Exportação CSV de produtos

### Editor Visual
- Gerenciamento de banners
- Edição de menus (cabeçalho e rodapé)
- Personalização de cores
- Reordenação de produtos

## Importação CSV

Formato esperado:
```csv
name,slug,sku,price,comparePrice,category,description,sizes,colors,stock,isFeatured,tags
"Bota Exemplo","bota-exemplo","CAT-001","599.90","","Botas","Descrição","38;39;40","Preto","10;8;6","false","bota"
```

- `sizes` separados por `;`
- `colors` separados por `;`  
- `stock` separado por `;`, mapeado pela posição com `sizes`
