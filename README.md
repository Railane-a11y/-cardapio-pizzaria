# Cardápio digital - Casa das Pizzas

Site de pedidos com **painel de administração**: preços, sabores, fotos do banner, ofertas, avisos, horário e
contatos são editados em `seusite.netlify.app/admin`, sem mexer em código.

## Ativar o painel (uma vez só)

1. No Netlify, abra o site e vá em **Site configuration > Environment variables**.
2. Clique em **Add a variable** e crie:
   - **Key:** `ADMIN_PASSWORD`
   - **Value:** a senha que você vai usar para entrar (mínimo 8 caracteres, quanto maior melhor)
3. Vá em **Deploys > Trigger deploy > Deploy site** para o Netlify ler a senha.
4. Acesse `seusite.netlify.app/admin` e entre com a senha.

Para trocar a senha, mude o valor da variável e faça um novo deploy. Quem estava logado precisa entrar de novo.

## Como funciona

- O que você salva no painel fica guardado no **Netlify Blobs** (armazenamento do próprio Netlify) e aparece no site na hora.
- As fotos enviadas pelo painel também ficam lá. Cada foto tem no máximo 1,5 MB (o painel reduz sozinho).
- Se o painel ficar fora do ar, o site mostra o último conteúdo guardado no aparelho do cliente, ou o conteúdo
  inicial de `js/config.js`.
- O botão **Voltar para a versão anterior** (aba Geral) desfaz a última publicação.

## Segurança

- A senha nunca fica no código: só na variável do Netlify.
- Depois de 5 senhas erradas, o acesso é bloqueado por 15 minutos.
- O painel não aparece em buscas do Google.

## Arquivos

| Arquivo | Para que serve |
| --- | --- |
| `index.html`, `css/`, `js/app.js` | O site que o cliente vê |
| `js/config.js` | Conteúdo inicial (plano B) |
| `admin/` | O painel |
| `netlify/functions/api.mjs` | Servidor do painel (senha, salvar, fotos) |
| `sw.js`, `manifest.json` | App instalável (PWA) |
