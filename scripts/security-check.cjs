const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const core = require('./security-core.js');
test('escape protege texto e atributos com ambas as aspas', () => {
  assert.equal(core.escapeHTML('<>&"\''), '&lt;&gt;&amp;&quot;&#39;');
});
test('backup aceita RC sem processo e rejeita IDs executáveis e duplicados', () => {
  const ok={dados:{requisicoes:[{id:1,tipo:'RC',numero:'12',numeroProcesso:''}]}};
  assert.equal(core.validarBackup(ok),ok);
  assert.throws(()=>core.validarBackup({requisicoes:[{id:'1);invalid(',tipo:'RC'}]}));
  assert.throws(()=>core.validarBackup({requisicoes:[{id:1,tipo:'RC'},{id:1,tipo:'RS'}]}));
  assert.throws(()=>core.validarBackup({requisicoes:[{id:1,tipo:'<invalid>'}]}));
});
test('backup rejeita chaves perigosas e estrutura excessiva', () => {
  assert.throws(()=>core.validarBackup(JSON.parse('{"licitacoes":[],"__proto__":{}}')));
  assert.throws(()=>core.validarBackup({licitacoes:[],extra:'x'.repeat(100001)}));
});
test('logout remove tokens, dados e backups preservando preferências', () => {
  const m=new Map([['licitacoes','[]'],['backup_123','{}'],['supa_session_saude_v33','token'],['tema','escuro']]);
  core.limparDadosLocais({get length(){return m.size},key:i=>[...m.keys()][i],removeItem:k=>m.delete(k)});
  assert.deepEqual([...m], [['tema','escuro']]);
});
test('imagem rejeita SVG e arquivo excessivo antes da decodificação',async()=>{
  await assert.rejects(core.imagemSegura({size:100,type:'image/svg+xml'}));
  await assert.rejects(core.imagemSegura({size:3000000,type:'image/png'}));
});
test('todas as dependências estáticas têm integridade e CORS',()=>{
  const html=fs.readFileSync('index.html','utf8');
  for(const [tag] of html.matchAll(/<script\b[^>]*src="https:[^>]*>/g)) {
    assert.match(tag,/integrity="sha384-[^"]+"/);
    assert.match(tag,/crossorigin="anonymous"/);
  }
});
