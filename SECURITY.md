# Segurança

Não publique senhas, tokens, arquivos `.env`, dumps ou dados pessoais em issues, exemplos ou commits. A chave pública do cliente Supabase não substitui a autorização no banco.

## Validação das alterações

Execute `node scripts/quality-check.cjs` e `node --test scripts/security-check.cjs`.
Teste também as exportações PDF/Excel e autenticação antes da publicação.

## Proteções do cliente

Textos e atributos HTML são escapados nas rotinas corrigidas. IDs interpolados em comandos são convertidos para números. Backups têm limites e validação de estrutura; o brasão aceita somente PNG/JPEG validado e reencodificado.

Tokens são armazenados por aba em sessionStorage, e o encerramento da sessão remove os caches internos. Isso reduz persistência, mas não torna tokens imunes a XSS: scripts da mesma origem ainda podem acessá-los. A publicação exige novo login para sessões antigas.

Dependências externas têm versões fixas e integridade SRI, incluindo os carregamentos alternativos. As restrições CSP atuais são parciais; uma política estrita de scripts exige retirar scripts e handlers inline.

## Banco

A leitura de `public.sistema_dados` deve ser concedida somente a usuários autenticados cujo perfil ativo seja admin ou gestor, usando `public.usuario_pode_editar()`. Visitantes e perfis de consulta não podem ler essa tabela. O sincronizador conserva acesso de serviço. Reaplicar configurações antigas com `using(true)` para leitura anônima reabre a exposição.

## Pendências operacionais

- Credenciais que já estiveram públicas devem ser consideradas comprometidas: revogue/rotacione nos serviços onde foram usadas, inclusive em casos de reutilização. Remover código não invalida a credencial.
- Após a rotação, limpar o histórico com git-filter-repo ou BFG em clone isolado, conferir todas as referências e coordenar a substituição do histórico remoto e dos clones. Não colocar os valores expostos em comandos registrados, issues ou no arquivo de instruções. Reescrever histórico não remove cópias de terceiros; nunca substitui rotação.
- Revisar os campos publicados nos snapshots JSON e definir minimização/retenção antes de publicar dados pessoais ou sensíveis.
- O transporte atual do Consulta Compras foi mantido por decisão do responsável; a correção depende de HTTPS válido e de nova autorização para mudar esse comportamento.
- Configurar proteção de branch, secret scanning, push protection, revisão de dependências e 2FA conforme permissões e disponibilidade do repositório.
- Cabeçalhos como frame-ancestors, nosniff e CSP completa dependem da hospedagem e da remoção de scripts inline; a meta CSP não fornece todas essas proteções.

Estas medidas não representam uma certificação de ausência de vulnerabilidades. Continuar a revisão dos demais pontos de renderização e dos controles no servidor.
