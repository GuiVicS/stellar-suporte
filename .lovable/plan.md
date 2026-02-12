
# Importacao de Clientes via Planilha

## O que sera feito

Adicionar um botao "Importar Clientes" na pagina de Clientes que permite ao usuario:

1. **Fazer upload de uma planilha** (CSV, XLS, XLSX)
2. **Visualizar as colunas detectadas** na planilha
3. **Mapear cada coluna da planilha** para os campos do sistema (Nome, CPF/CNPJ, Contato, Telefone, Email, Rua, Numero, Cidade, Estado, CEP)
4. **Pre-visualizar os dados** antes de confirmar
5. **Importar em lote** para o banco de dados

## Fluxo do usuario

1. Clica em "Importar" ao lado do botao "Novo Cliente"
2. Arrasta ou seleciona o arquivo (CSV, XLS, XLSX)
3. O sistema le o arquivo e mostra as colunas encontradas
4. O usuario mapeia cada coluna para o campo correspondente (ou ignora)
5. Mostra uma tabela de preview com as primeiras linhas
6. Clica em "Importar X clientes"
7. Os dados sao inseridos no banco e a lista atualiza

## Detalhes tecnicos

### Novo arquivo: `src/components/ImportCustomersDialog.tsx`

- Dialog com 3 etapas: Upload -> Mapeamento -> Preview/Importacao
- Usa a biblioteca **SheetJS (xlsx)** para ler qualquer formato de planilha (CSV, XLS, XLSX) diretamente no navegador
- Campos mapeáveis: `name`, `cpf_cnpj`, `main_contact_name`, `phone`, `email`, `street`, `number`, `city`, `state`, `zip`
- Auto-deteccao de colunas com nomes similares (ex: "Nome" -> `name`, "CNPJ" -> `cpf_cnpj`)
- Preview mostra as primeiras 5 linhas com os dados ja mapeados
- Importacao usa batch insert no Supabase (clientes + enderecos quando mapeados)
- Feedback com contagem de sucesso/erros via toast

### Alteracao: `src/pages/manager/CustomersPage.tsx`

- Adicionar botao "Importar" com icone `Upload` no header, ao lado do "Novo Cliente"
- Estado `importOpen` para controlar o dialog

### Nova dependencia

- **xlsx** (SheetJS) — leitura de planilhas no browser sem backend

### Validacoes

- Campo `name` e obrigatorio para importar — linhas sem nome serao ignoradas
- Linhas duplicadas (mesmo CPF/CNPJ) serao sinalizadas no preview
- Limite de 500 linhas por importacao para evitar sobrecarga
