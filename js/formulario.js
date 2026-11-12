(function(){
'use strict';

/* As configurações (e-mail, idade mínima) ficam em js/config.js */
/* Logotipos: arquivos da pasta img/. Para trocar um logotipo, substitua o arquivo mantendo o mesmo nome (JPG). */
var LOGOS = { banner: 'img/logo-aare-ro.jpg', brasil: 'img/brasao-brasil.jpg', rondonia: 'img/brasao-rondonia.jpg' };
var logosProntos = null;
function carregarLogos(){
  if(logosProntos) return logosProntos;
  var nomes = Object.keys(LOGOS);
  logosProntos = Promise.all(nomes.map(function(n){
    return fetch(LOGOS[n]).then(function(r){ if(!r.ok) throw new Error(LOGOS[n]); return r.blob(); }).then(function(b){
      return new Promise(function(ok, falha){ var rd=new FileReader(); rd.onload=function(){ ok(rd.result); }; rd.onerror=falha; rd.readAsDataURL(b); });
    });
  })).then(function(lista){ var o={}; nomes.forEach(function(n,i){ o[n]=lista[i]; }); return o; });
  logosProntos.catch(function(){ logosProntos = null; });
  return logosProntos;
}
try{ carregarLogos().catch(function(){}); }catch(e){}

/* ======= Máscaras ======= */
function digits(v){ return String(v||'').replace(/\D/g,''); }
var MASK = {
  cpf: function(v){ v=digits(v).slice(0,11); return v.replace(/(\d{3})(\d)/,'$1.$2').replace(/(\d{3})\.(\d{3})(\d)/,'$1.$2.$3').replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/,'$1.$2.$3-$4'); },
  fone: function(v){ v=digits(v).slice(0,11); if(v.length<3) return v; if(v.length<7) return '('+v.slice(0,2)+') '+v.slice(2); if(v.length<11) return '('+v.slice(0,2)+') '+v.slice(2,6)+'-'+v.slice(6); return '('+v.slice(0,2)+') '+v.slice(2,7)+'-'+v.slice(7); },
  cep: function(v){ v=digits(v).slice(0,8); return v.length>5 ? v.slice(0,5)+'-'+v.slice(5) : v; },
  data: function(v){ v=digits(v).slice(0,8); if(v.length>4) return v.slice(0,2)+'/'+v.slice(2,4)+'/'+v.slice(4); if(v.length>2) return v.slice(0,2)+'/'+v.slice(2); return v; },
  num: function(v){ return digits(v); },
  ano: function(v){ return digits(v).slice(0,4); },
  placa: function(v){ return String(v||'').toUpperCase().replace(/[^A-Z0-9]/g,'').slice(0,7); },
  upper: function(v){ return String(v||'').toUpperCase(); },
  lower: function(v){ return String(v||'').toLowerCase().replace(/\s/g,''); }
};

/* ======= Validações (retornam '' quando está certo) ======= */
function cpfValido(c){
  c=digits(c); if(c.length!==11 || /^(\d)\1{10}$/.test(c)) return false;
  for(var t=9;t<11;t++){ var s=0; for(var i=0;i<t;i++) s+= +c[i]*(t+1-i); var dv=(s*10)%11%10; if(dv!== +c[t]) return false; }
  return true;
}
function foneErro(v){
  var d=digits(v);
  if(d.length!==10 && d.length!==11) return 'Informe o telefone com DDD, por exemplo (69) 99999-9999.';
  if(+d.slice(0,2)<11) return 'O DDD informado não existe.';
  if(d.length===11 && d[2]!=='9') return 'Celular com 9 dígitos deve começar com 9 após o DDD.';
  if(/^(\d)\1+$/.test(d.slice(2))) return 'Esse número não parece válido.';
  return '';
}
function emailErro(v){ return /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(v) ? '' : 'Informe um e-mail válido, por exemplo nome@email.com.'; }
function dataErro(v){
  var m=/^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v); if(!m) return 'Use o formato dia/mês/ano, por exemplo 05/09/1985.';
  var d=+m[1], mo=+m[2], y=+m[3], dt=new Date(y,mo-1,d);
  if(dt.getFullYear()!==y || dt.getMonth()!==mo-1 || dt.getDate()!==d) return 'Essa data não existe. Confira dia e mês.';
  var hoje=new Date(); if(dt>hoje) return 'A data de nascimento não pode estar no futuro.';
  var idade=hoje.getFullYear()-y-((hoje.getMonth()<mo-1 || (hoje.getMonth()===mo-1 && hoje.getDate()<d))?1:0);
  if(idade>110) return 'Confira o ano de nascimento.';
  if(idade<CONFIG.idadeMinima) return 'É preciso ter pelo menos '+CONFIG.idadeMinima+' anos para se filiar.';
  return '';
}
var V = {
  nome: function(v){ return /^[A-Za-zÀ-ÿ'´.\- ]+$/.test(v) && v.trim().split(/\s+/).length>=2 ? '' : 'Informe nome e sobrenome, sem abreviações nem números.'; },
  data: dataErro,
  cpf: function(v){ return cpfValido(v) ? '' : 'CPF inválido. Confira os 11 números.'; },
  rg: function(v){ return /^[0-9A-Za-z.\-\/ ]{4,15}$/.test(v) ? '' : 'Informe o número do RG como está no documento.'; },
  orgao: function(v){ return /^[A-Za-z]{2,10}[\/\- ]?[A-Za-z]{0,2}$/.test(v) ? '' : 'Informe o órgão e a UF, por exemplo SSP/RO.'; },
  cnh: function(v){ return digits(v).length===11 ? '' : 'O número de registro da CNH tem 11 dígitos.'; },
  fone: foneErro,
  email: emailErro,
  cep: function(v){ return digits(v).length===8 ? '' : 'O CEP tem 8 números, por exemplo 76820-574.'; },
  numero: function(v){ return /^(\d{1,6}[A-Za-z]?|S\/?N)$/i.test(v.trim()) ? '' : 'Informe o número ou S/N se não houver.'; },
  texto: function(v){ return v.trim().length>=2 ? '' : 'Preencha este campo.'; },
  ano: function(v){ var a=+v, max=new Date().getFullYear()+1; return (/^\d{4}$/.test(v) && a>=1930 && a<=max) ? '' : 'Informe o ano com 4 dígitos, entre 1930 e '+max+'.'; },
  placa: function(v){ return /^[A-Z]{3}\d{4}$/.test(v) || /^[A-Z]{3}\d[A-Z]\d{2}$/.test(v) ? '' : 'Placa inválida. Use ABC1234 ou o padrão Mercosul ABC1D23.'; }
};

var UFS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
function motoIniciada(d){ return !!(d.motoMarca||d.motoModelo||d.motoAno||d.motoCor||d.motoPlaca); }

/* ======= Passos e campos (espelham a ficha original) ======= */
var STEPS = [
 { name:'Dados pessoais', hint:'Preencha como consta nos seus documentos.', fields:[
   {id:'nome',label:'Nome completo',req:1,v:'nome',ac:'name',max:80},
   {id:'apelido',label:'Apelido / Nome de guerra',s:3,max:40},
   {id:'nascimento',label:'Data de nascimento',req:1,s:3,mask:'data',v:'data',im:'numeric',ph:'dd/mm/aaaa',ac:'bday'},
   {id:'cpf',label:'CPF',req:1,s:3,mask:'cpf',v:'cpf',im:'numeric',ph:'000.000.000-00'},
   {id:'rg',label:'RG',req:1,s:3,v:'rg',max:15},
   {id:'orgao',label:'Órgão expedidor',req:1,s:2,mask:'upper',v:'orgao',ph:'SSP/RO',max:12},
   {id:'cnh',label:'CNH (nº de registro)',s:2,mask:'num',v:'cnh',im:'numeric',max:11,tip:'11 dígitos. Deixe em branco se não tiver.'},
   {id:'categoria',label:'Categoria da CNH',s:2,opts:['','A','AB','AC','AD','AE','B','C','D','E','ACC'],reqIf:function(d){return !!d.cnh;},reqMsg:'Selecione a categoria da sua CNH.'},
   {id:'estadoCivil',label:'Estado civil',req:1,s:3,opts:['','Solteiro(a)','Casado(a)','União estável','Divorciado(a)','Separado(a)','Viúvo(a)']},
   {id:'profissao',label:'Profissão',req:1,s:3,v:'texto',max:50},
   {id:'celular',label:'Celular (com DDD)',req:1,s:3,mask:'fone',v:'fone',im:'tel',type:'tel',ph:'(69) 99999-9999',ac:'tel-national'},
   {id:'email',label:'E-mail',req:1,s:3,mask:'lower',v:'email',type:'email',im:'email',ph:'nome@email.com',ac:'email',max:80}
 ]},
 { name:'Endereço', hint:'Endereço onde você mora atualmente.', fields:[
   {id:'cep',label:'CEP',req:1,s:2,mask:'cep',v:'cep',im:'numeric',ph:'00000-000',ac:'postal-code'},
   {id:'rua',label:'Rua / Avenida',req:1,s:4,v:'texto',max:80,ac:'address-line1'},
   {id:'numero',label:'Número',req:1,s:2,mask:'upper',v:'numero',ph:'ou S/N',max:8,cls:'h'},
   {id:'bairro',label:'Bairro',req:1,s:4,v:'texto',max:50},
   {id:'cidade',label:'Cidade',req:1,s:4,v:'texto',max:50,ac:'address-level2'},
   {id:'uf',label:'UF',req:1,s:2,opts:[''].concat(UFS),cls:'h'},
   {id:'referencia',label:'Ponto de referência',max:80}
 ]},
 { name:'Contatos de emergência', hint:'Quem a associação deve avisar em caso de emergência.', fields:[
   {id:'emTel1',label:'Telefone principal (com DDD)',req:1,s:3,mask:'fone',v:'fone',im:'tel',type:'tel',ph:'(69) 99999-9999',
     also:function(v,d){ return digits(v)===digits(d.celular) ? 'Informe o telefone de outra pessoa, diferente do seu celular.' : ''; }},
   {id:'emPar1',label:'Grau de parentesco',req:1,s:3,v:'texto',ph:'Ex.: esposa, pai, irmão',max:30},
   {id:'emTel2',label:'Telefone secundário (com DDD)',s:3,mask:'fone',v:'fone',im:'tel',type:'tel',
     also:function(v,d){ return digits(v)===digits(d.emTel1) ? 'Este número é igual ao telefone principal.' : ''; }},
   {id:'emPar2',label:'Grau de parentesco',s:3,v:'texto',max:30,reqIf:function(d){return !!d.emTel2;},reqMsg:'Informe o parentesco do segundo contato.'},
   {id:'emEmail',label:'E-mail do contato',mask:'lower',v:'email',type:'email',im:'email',max:80}
 ]},
 { name:'Motocicleta', hint:'Dados da sua moto. Se ainda não tiver, deixe tudo em branco e continue.', fields:[
   {id:'motoMarca',label:'Marca',s:3,v:'texto',ph:'Ex.: Honda',max:30,reqIf:motoIniciada,reqMsg:'Informe a marca da moto.'},
   {id:'motoModelo',label:'Modelo',s:3,v:'texto',ph:'Ex.: CB 500',max:40,reqIf:motoIniciada,reqMsg:'Informe o modelo da moto.'},
   {id:'motoAno',label:'Ano',s:2,mask:'ano',v:'ano',im:'numeric',ph:'aaaa',cls:'h',reqIf:motoIniciada,reqMsg:'Informe o ano da moto.'},
   {id:'motoCor',label:'Cor',s:2,v:'texto',max:20,cls:'h',reqIf:motoIniciada,reqMsg:'Informe a cor da moto.'},
   {id:'motoPlaca',label:'Placa',s:2,mask:'placa',v:'placa',ph:'ABC1D23',reqIf:motoIniciada,reqMsg:'Informe a placa da moto.'}
 ]},
 { name:'Foto e padrinho', hint:'Itens opcionais. A foto 3x4 sai impressa na ficha.', custom:'foto', fields:[
   {id:'padrinho',label:'Padrinho',s:4,max:60,tip:'Nome do membro que está indicando você, se houver.'},
   {id:'patente',label:'Patente do padrinho',s:2,max:30}
 ]},
 { name:'Declarações', hint:'Leia com atenção e marque para confirmar.', custom:'declaracoes', fields:[] },
 { name:'Revisar e gerar a ficha', hint:'Confira tudo antes de gerar o PDF. Para corrigir, toque em Editar.', custom:'revisao', fields:[] }
];
var CHECKS = [
  {id:'decEstatuto',req:1,t:'Li e concordo com o Estatuto da AARE-RO.'},
  {id:'decDados',req:1,t:'Autorizo o uso dos meus dados para fins administrativos.'},
  {id:'decVerdade',req:1,t:'As informações prestadas são verdadeiras.'},
  {id:'decImagem',req:0,t:'Autorizo a utilização da minha imagem em fotografias, vídeos e materiais institucionais da AARE-RO para divulgação de eventos e atividades associativas.',small:'Opcional'},
  {id:'lgpd',req:1,t:'Li e aceito o Termo de Consentimento para Tratamento de Dados Pessoais.'},
  {id:'termo',req:1,t:'Li e aceito o Termo de Filiação.'}
];

var data = {}, cur = 0, reached = 0, pdfBlob = null, pdfName = '';
var $ = function(id){ return document.getElementById(id); };
function esc(s){ return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];}); }
function allFields(){ var a=[]; STEPS.forEach(function(s){ s.fields.forEach(function(f){ a.push(f); }); }); return a; }

function fieldError(f){
  var v = (data[f.id]||'').trim();
  if(!v){
    if(f.req) return 'Campo obrigatório.';
    if(f.reqIf && f.reqIf(data)) return f.reqMsg || 'Campo obrigatório.';
    return '';
  }
  var e = f.v ? V[f.v](v) : '';
  if(!e && f.also) e = f.also(v, data);
  return e;
}
function showFieldState(f, force){
  var box = $('f_'+f.id); if(!box) return '';
  var e = fieldError(f), v=(data[f.id]||'').trim();
  box.classList.toggle('bad', !!e && (force || !!v));
  box.classList.toggle('good', !e && !!v);
  $('e_'+f.id).textContent = (e && (force || v)) ? e : '';
  return e;
}

function fieldHtml(f){
  var val = esc(data[f.id]||''), cls='f'+(f.s?' s'+f.s:'')+(f.cls?' '+f.cls:'');
  var lab = '<label class="l" for="'+f.id+'">'+esc(f.label)+(f.req?'':' <span class="opt">(opcional)</span>')+'</label>';
  var ctl;
  if(f.opts){
    ctl = '<select id="'+f.id+'" name="'+f.id+'">'+f.opts.map(function(o){ return '<option value="'+esc(o)+'"'+(o===(data[f.id]||'')?' selected':'')+'>'+(o?esc(o):'Selecione')+'</option>'; }).join('')+'</select>';
  } else {
    ctl = '<input id="'+f.id+'" name="'+f.id+'" type="'+(f.type||'text')+'" value="'+val+'"'+
      (f.im?' inputmode="'+f.im+'"':'')+(f.ph?' placeholder="'+esc(f.ph)+'"':'')+(f.max?' maxlength="'+f.max+'"':'')+
      ' autocomplete="'+(f.ac||'off')+'" aria-describedby="e_'+f.id+'">';
  }
  return '<div class="'+cls+'" id="f_'+f.id+'">'+lab+ctl+(f.tip?'<span class="tip">'+esc(f.tip)+'</span>':'')+'<span class="err" id="e_'+f.id+'" role="alert"></span></div>';
}

function renderBar(){
  $('stepName').textContent = STEPS[cur].name;
  $('stepCount').textContent = 'Passo '+(cur+1)+' de '+STEPS.length;
  $('bar').innerHTML = STEPS.map(function(s,i){
    var c = i===cur ? 'now' : (i<=reached ? 'done' : '');
    return '<button type="button" class="'+c+'" data-go="'+i+'" aria-label="'+esc(s.name)+'"'+(i<=reached && i!==cur?'':' tabindex="-1"')+'></button>';
  }).join('');
}

function render(focus){
  var s = STEPS[cur];
  renderBar();
  $('title').textContent = s.name;
  $('hint').textContent = s.hint;
  $('alert').textContent = '';
  var h = '';
  if(s.custom==='foto') h += fotoHtml();
  if(s.fields.length) h += '<div class="grid">'+s.fields.map(fieldHtml).join('')+'</div>';
  if(s.custom==='declaracoes') h += declHtml();
  if(s.custom==='revisao') h += revisaoHtml();
  $('body').innerHTML = h;
  $('progress').hidden = false; $('actions').hidden = false;
  $('back').hidden = cur===0;
  $('next').textContent = cur===STEPS.length-1 ? 'Gerar ficha em PDF' : 'Continuar';
  $('next').className = 'btn' + (cur===STEPS.length-1 ? ' accent' : '');
  s.fields.forEach(function(f){ if(data[f.id]) showFieldState(f,false); });
  if(s.custom==='foto') bindFoto();
  if(focus){ $('title').focus(); window.scrollTo(0,0); }
}

/* ----- Foto 3x4 ----- */
function fotoHtml(){
  return '<div class="photo" style="margin-bottom:18px"><div class="frame" id="fotoFrame">'+(data.foto?'<img alt="Sua foto 3x4" src="'+data.foto+'">':'Foto 3x4')+'</div>'+
    '<div class="side"><label class="l" for="fotoIn">Foto 3x4 <span class="opt">(opcional)</span></label>'+
    '<input id="fotoIn" type="file" accept="image/*">'+
    '<span class="tip">Foto de rosto, de frente, com fundo claro. Ela é recortada automaticamente no formato 3x4.</span>'+
    '<span class="err" id="fotoErr" role="alert"></span>'+
    (data.foto?'<div><button type="button" class="btn ghost" id="fotoDel">Remover foto</button></div>':'')+'</div></div>';
}
function bindFoto(){
  $('fotoIn').addEventListener('change', function(){
    var file = this.files && this.files[0]; if(!file) return;
    if(!/^image\//.test(file.type)){ $('fotoErr').textContent='Escolha um arquivo de imagem (JPG ou PNG).'; return; }
    var rd = new FileReader();
    rd.onload = function(){
      var im = new Image();
      im.onload = function(){
        var cw=450, ch=600, c=document.createElement('canvas'); c.width=cw; c.height=ch;
        var sc=Math.max(cw/im.width, ch/im.height), w=im.width*sc, h=im.height*sc, g=c.getContext('2d');
        g.fillStyle='#fff'; g.fillRect(0,0,cw,ch); g.drawImage(im,(cw-w)/2,(ch-h)/2,w,h);
        data.foto = c.toDataURL('image/jpeg',0.88); render(false);
      };
      im.onerror = function(){ $('fotoErr').textContent='Não foi possível ler essa imagem. Tente outra foto.'; };
      im.src = rd.result;
    };
    rd.readAsDataURL(file);
  });
  var del=$('fotoDel'); if(del) del.addEventListener('click', function(){ delete data.foto; render(false); });
}

/* ----- Declarações ----- */
function ckHtml(c){
  return '<label class="ck" id="k_'+c.id+'"><input type="checkbox" id="'+c.id+'"'+(data[c.id]?' checked':'')+'><span>'+esc(c.t)+(c.small?'<small>'+c.small+'</small>':'')+'</span></label>';
}
function declHtml(){
  return '<div class="checks">'+CHECKS.slice(0,4).map(ckHtml).join('')+
    '<div class="term"><h3>Termo de Consentimento para Tratamento de Dados Pessoais</h3><p>Em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD), autorizo a AARE-RO a coletar, armazenar, utilizar e processar meus dados pessoais constantes nesta ficha de associação, exclusivamente para finalidades administrativas, cadastrais, estatutárias, financeiras, comunicação institucional e demais atividades relacionadas à gestão da associação.</p></div>'+
    ckHtml(CHECKS[4])+
    '<div class="term"><h3>Termo de Filiação</h3><p>Declaro que solicito minha filiação à AARE-RO, comprometendo-me a respeitar o estatuto, regulamentos e princípios da associação.</p></div>'+
    ckHtml(CHECKS[5])+'</div>';
}

/* ----- Revisão ----- */
function revisaoHtml(){
  var h='<div class="review">';
  STEPS.slice(0,5).forEach(function(s,i){
    var rows = s.fields.map(function(f){ return '<dt>'+esc(f.label)+'</dt><dd>'+(data[f.id]?esc(data[f.id]):'<span style="font-weight:400;color:var(--muted)">não informado</span>')+'</dd>'; }).join('');
    if(s.custom==='foto') rows = '<dt>Foto 3x4</dt><dd>'+(data.foto?'Anexada':'<span style="font-weight:400;color:var(--muted)">não enviada</span>')+'</dd>'+rows;
    h += '<section class="rv"><header><span>'+esc(s.name)+'</span><button type="button" data-go="'+i+'">Editar</button></header><dl>'+rows+'</dl></section>';
  });
  h += '<section class="rv"><header><span>Declarações</span><button type="button" data-go="5">Editar</button></header><dl>'+
    '<dt>Estatuto, uso de dados, veracidade, LGPD e Termo de Filiação</dt><dd>Aceitos</dd><dt>Uso de imagem</dt><dd>'+(data.decImagem?'Autorizado':'Não autorizado')+'</dd></dl></section>';
  return h+'</div>';
}

/* ----- Navegação ----- */
function validateStep(i){
  var s=STEPS[i], first=null;
  s.fields.forEach(function(f){ var e = (i===cur) ? showFieldState(f,true) : fieldError(f); if(e && !first) first=f.id; });
  if(s.custom==='declaracoes'){
    CHECKS.forEach(function(c){ var bad = c.req && !data[c.id]; var k=$('k_'+c.id); if(k) k.classList.toggle('bad',!!bad); if(bad && !first) first=c.id; });
  }
  return first;
}
function go(i){ cur=i; if(i>reached) reached=i; render(true); }

$('card').addEventListener('submit', function(ev){
  ev.preventDefault();
  var bad = validateStep(cur);
  if(bad){
    $('alert').textContent = STEPS[cur].custom==='declaracoes' ? 'Marque as declarações obrigatórias destacadas para continuar.' : 'Corrija os campos destacados para continuar.';
    var el=$(bad); if(el) el.focus();
    return;
  }
  if(cur < STEPS.length-1){ go(cur+1); return; }
  for(var i=0;i<STEPS.length-1;i++){ var prev=cur; cur=-1; var b=validateStep(i); cur=prev; if(b){ go(i); validateStep(i); $('alert').textContent='Há campos pendentes neste passo.'; return; } }
  gerar();
});
$('back').addEventListener('click', function(){ if(cur>0) go(cur-1); });
document.addEventListener('click', function(ev){
  var t = ev.target.closest && ev.target.closest('[data-go]'); if(!t) return;
  var i = +t.getAttribute('data-go'); if(i<=reached && i!==cur) go(i);
});
$('body').addEventListener('input', function(ev){
  var el=ev.target, id=el.id; if(!id || el.type==='file') return;
  if(el.type==='checkbox'){ data[id]=el.checked; var k=$('k_'+id); if(k && el.checked) k.classList.remove('bad'); return; }
  var f = STEPS[cur].fields.filter(function(x){return x.id===id;})[0]; if(!f) return;
  if(f.mask){ var m=MASK[f.mask](el.value); if(m!==el.value) el.value=m; }
  data[id]=el.value;
  if($('f_'+id).classList.contains('bad') || !fieldError(f)) showFieldState(f,false);
});
$('body').addEventListener('change', function(ev){
  var el=ev.target; if(el.tagName==='SELECT'){ data[el.id]=el.value; var f=STEPS[cur].fields.filter(function(x){return x.id===el.id;})[0]; if(f) showFieldState(f,false); }
});
$('body').addEventListener('focusout', function(ev){
  var el=ev.target, f = STEPS[cur].fields.filter(function(x){return x.id===el.id;})[0]; if(!f) return;
  if(el.tagName!=='SELECT'){ el.value = el.value.replace(/\s+/g,' ').trim(); data[f.id]=el.value; }
  showFieldState(f,false);
});

/* ----- PDF e envio ----- */
var dlCap = null;
try{ if(window.claude && window.claude.use){ window.claude.use('downloads').then(function(d){ dlCap=d; }, function(){}); } }catch(e){}

function hoje(){ var d=new Date(), p=function(n){return (n<10?'0':'')+n;}; return p(d.getDate())+'/'+p(d.getMonth()+1)+'/'+d.getFullYear(); }
function slug(s){ return String(s).normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^A-Za-z0-9]+/g,'-').replace(/^-|-$/g,''); }

function gerar(){
  var btn=$('next');
  if(!(window.jspdf && window.jspdf.jsPDF)){ $('alert').textContent='Não foi possível carregar o gerador de PDF. Verifique sua internet, recarregue a página e tente de novo.'; return; }
  btn.disabled=true;
  carregarLogos().then(function(logos){
    try{
      var d = {}; Object.keys(data).forEach(function(k){ d[k]=data[k]; }); d.data = hoje();
      var doc = buildFichaPdf(window.jspdf.jsPDF, d, logos);
      pdfBlob = doc.output('blob');
      pdfName = 'Ficha-Filiacao-AARE-RO-'+slug(data.nome)+'.pdf';
      final();
      salvar();
    }catch(e){
      $('alert').textContent='Ocorreu um erro ao gerar o PDF. Tente novamente.';
    }
  }, function(){
    $('alert').textContent='Não foi possível carregar os logotipos da ficha. Verifique sua internet, recarregue a página e tente de novo.';
  }).then(function(){ btn.disabled=false; });
}

function salvar(){
  var msg=$('saveMsg'); if(!msg) return;
  msg.className='okmsg'; msg.textContent='';
  function falha(t){ msg.className='err'; msg.textContent=t; }
  if(window.claude && window.claude.use){
    var p = dlCap ? Promise.resolve(dlCap) : window.claude.use('downloads');
    msg.textContent='Preparando o download...';
    p.then(function(dl){
      if(!dl) return falha('Não foi possível baixar o arquivo nesta tela. Abra este link direto no navegador do celular ou do computador e gere a ficha novamente.');
      dlCap=dl;
      return dl.save({filename:pdfName, data:pdfBlob}).then(function(){ msg.textContent='PDF salvo: '+pdfName; },
        function(e){ falha(e && e.code==='declined' ? 'O download foi cancelado. Toque em "Baixar o PDF" e confirme para salvar.' : 'Não foi possível salvar o arquivo. Toque em "Baixar o PDF" para tentar de novo.'); });
    }, function(){ falha('Não foi possível salvar o arquivo. Tente novamente.'); });
    return;
  }
  try{
    var a=document.createElement('a'); a.href=URL.createObjectURL(pdfBlob); a.download=pdfName; document.body.appendChild(a); a.click(); a.remove();
    msg.textContent='Download iniciado: '+pdfName;
  }catch(e){ falha('Não foi possível baixar o arquivo. Tente em outro navegador.'); }
}

function final(){
  $('progress').hidden=true; $('actions').hidden=true; $('alert').textContent='';
  $('title').textContent='Ficha gerada. Faltam 2 passos.';
  $('hint').textContent='Sua filiação só é analisada depois que a associação receber o PDF assinado.';
  var assunto='Ficha de Filiação - '+data.nome;
  var envio='<p>Escreva um e-mail para a Secretaria da AARE-RO, anexe o PDF assinado e envie para:</p>'+
    '<div class="copybox"><span class="contact" id="mailTxt">'+esc(CONFIG.email)+'</span><button type="button" class="btn" id="copyMail">Copiar</button></div>'+
    '<span id="copyMsg" class="okmsg" role="status"></span>'+
    '<p style="margin-top:10px">Sugestão de assunto: <strong>'+esc(assunto)+'</strong></p>'+
    '<p style="margin-top:8px">Confira se o PDF assinado está anexado antes de enviar.</p>';
  $('body').innerHTML =
    '<ol class="steps3">'+
    '<li><div><h3>Baixe a ficha em PDF</h3><p>Guarde o arquivo no seu aparelho.</p><div class="row"><button type="button" class="btn" id="dl">Baixar o PDF</button><span id="saveMsg" class="okmsg" role="status"></span></div></div></li>'+
    '<li><div><h3>Assine pelo gov.br</h3><p>Entre no Portal de Assinatura Eletrônica com sua conta gov.br (nível prata ou ouro), escolha o PDF baixado, posicione a assinatura no quadro "Assinatura do Filiado" da página 2, confirme com o código do aplicativo gov.br e baixe o arquivo assinado.</p><div class="row"><a class="btn ghost" target="_blank" rel="noopener" href="https://assinador.iti.br/">Abrir assinador.iti.br</a></div></div></li>'+
    '<li><div><h3>Envie o PDF assinado por e-mail</h3>'+envio+'</div></li>'+
    '</ol><div class="actions"><button type="button" class="btn ghost" id="edit">Corrigir dados e gerar de novo</button></div>';
  $('dl').addEventListener('click', salvar);
  $('copyMail').addEventListener('click', function(){
    var btn=this, msg=$('copyMsg');
    function ok(){ msg.className='okmsg'; msg.textContent='E-mail copiado. Cole no campo "Para" da sua mensagem.'; btn.textContent='Copiado'; setTimeout(function(){ btn.textContent='Copiar'; }, 2500); }
    function manual(){
      try{
        var t=document.createElement('textarea'); t.value=CONFIG.email; t.setAttribute('readonly',''); t.style.position='fixed'; t.style.opacity='0';
        document.body.appendChild(t); t.select(); var done=document.execCommand('copy'); t.remove();
        if(done) return ok();
      }catch(e){}
      msg.className='err'; msg.textContent='Não foi possível copiar automaticamente. Selecione o endereço e copie manualmente.';
    }
    if(navigator.clipboard && navigator.clipboard.writeText){ navigator.clipboard.writeText(CONFIG.email).then(ok, manual); } else { manual(); }
  });
  $('edit').addEventListener('click', function(){ go(STEPS.length-1); });
  $('title').focus(); window.scrollTo(0,0);
}

render(false);
})();
