(function (root) {
    'use strict';
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,
        c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const listas = ['licitacoes','requisicoes','setores','modalidades','fluxos','dispensas'];
    function validarBackup(backup) {
        if (!backup || typeof backup !== 'object' || Array.isArray(backup)) throw new Error('Backup inválido.');
        const dados = backup.dados || backup;
        let total = 0;
        function verificar(v, depth) {
            if (++total > 1000000 || depth > 24) throw new Error('Backup excede os limites de estrutura.');
            if (typeof v === 'string' && v.length > 100000) throw new Error('Texto excessivamente longo.');
            if (v && typeof v === 'object') {
                for (const k of Object.keys(v)) {
                    if (['__proto__','constructor','prototype'].includes(k)) throw new Error('Chave não permitida no backup.');
                    verificar(v[k], depth + 1);
                }
            }
        }
        verificar(backup, 0);
        if (!listas.some(k => Array.isArray(dados[k]))) throw new Error('Backup sem listas de dados.');
        for (const k of listas) {
            if (dados[k] == null) continue;
            const itens = dados[k];
            if (!Array.isArray(itens) || itens.length > 20000) throw new Error(`Lista inválida: ${k}.`);
            const ids = new Set();
            for (const item of itens) {
                if (!item || typeof item !== 'object' || Array.isArray(item) ||
                    !Number.isSafeInteger(item.id) || item.id <= 0 || ids.has(item.id)) throw new Error(`ID inválido ou repetido em ${k}.`);
                ids.add(item.id);
                if (k === 'requisicoes' && !['RC','RS','RP'].includes(item.tipo)) throw new Error('Tipo de requisição inválido.');
                if (item.prioridade != null && !['','baixa','media','alta','urgente'].includes(item.prioridade)) throw new Error('Prioridade inválida.');
                for (const campo of ['numero','numeroLicitacao','numeroProcesso','nome','objeto','setorOrigem','setorAtual','responsavel','observacoes','status','situacao','condicao','proximo']) {
                    if (item[campo] != null && typeof item[campo] !== 'string') throw new Error(`Campo inválido: ${k}.${campo}.`);
                }
                for (const campo of ['workflow','sequencia']) {
                    if (item[campo] != null && (!Array.isArray(item[campo]) || item[campo].length > 100 || item[campo].some(x => typeof x !== 'string'))) throw new Error('Fluxo inválido.');
                }
            }
        }
        return backup;
    }
    function limparDadosLocais(storage) {
        const remover = new Set([...listas,'usuario_logado','auth_token','supa_session_saude_v33','backup_completo']);
        for (let i=0; i<storage.length; i++) {
            const key = storage.key(i);
            if (key && key.startsWith('backup_')) remover.add(key);
        }
        remover.forEach(k => storage.removeItem(k));
    }
    async function imagemSegura(file) {
        if (!file || file.size > 2*1024*1024 || !['image/png','image/jpeg'].includes(file.type)) throw new Error('Envie PNG ou JPEG de até 2 MB.');
        const bytes = new Uint8Array(await file.slice(0,8).arrayBuffer());
        const png = [137,80,78,71,13,10,26,10].every((v,i)=>bytes[i]===v);
        const jpeg = bytes[0]===255 && bytes[1]===216 && bytes[2]===255;
        if (!png && !jpeg) throw new Error('Conteúdo da imagem inválido.');
        const bitmap = await createImageBitmap(file);
        try {
            if (bitmap.width > 2048 || bitmap.height > 2048 || bitmap.width*bitmap.height > 4000000) throw new Error('Imagem muito grande: use até 2048 pixels por lado.');
            const canvas = document.createElement('canvas');
            canvas.width=bitmap.width; canvas.height=bitmap.height;
            canvas.getContext('2d').drawImage(bitmap,0,0);
            return canvas.toDataURL('image/png');
        } finally { bitmap.close(); }
    }
    root.SecurityCore = {escapeHTML,validarBackup,limparDadosLocais,imagemSegura};
    if (typeof module !== 'undefined' && module.exports) module.exports=root.SecurityCore;
})(typeof window !== 'undefined' ? window : globalThis);
