# 🍱 Rango - Controle Semanal de Marmitas

Projeto de página única (SPA), 100% frontend, sem backend e sem necessidade de login. Todos os dados são salvos diretamente no **LocalStorage** do navegador.

---

## 🚀 Como Iniciar o Projeto

### Opção 1: Via Servidor Embutido do PHP (Recomendado)
Execute no terminal dentro da pasta do projeto:

cd /Users/marcossilveira/projetos-web/rango
php -S localhost:4400

http://localhost:4400

---

## Repositório
https://github.com/marcos-silveira/Rango

### Opção 2: Abrir Diretamente no Navegador
Você pode simplesmente dar dois cliques no arquivo `index.html` ou abri-lo com qualquer navegador (Chrome, Safari, Edge, Firefox).

---

## 💡 Recursos Implementados
- **Lançar Marmita**: Modal prático com seleção de tamanho (**M** ou **P**).
  - O tamanho **M** já vem selecionado por padrão com **R$ 18,00**.
  - Ao alternar para o tamanho **P**, recalcula automaticamente para **R$ 9,00**.
  - O campo de **Dia da Semana** já nasce preenchido com o dia atual, mas permite alterar livremente.
  - Permite adicionar observação opcional (ex: refeição do dia).
- **Atalhos Rápidos**: Botões no painel para lançar com 1 clique uma marmita M ou P para o dia de hoje.
- **Configuração de Preços Padrão**: Botão ⚙️ para alterar os valores padrão da M e da P (salvo no LocalStorage).
- **Marcar como Pago**: Botão geral com confirmação que exibe o total e zera a lista para a próxima semana.
- **Exclusão Individual**: Botão de lixeira 🗑️ em cada marmita para remover lançamentos avulsos.
