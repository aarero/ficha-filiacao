// Monta o PDF da Ficha de Filiação no layout da ficha original da AARE-RO.
// JsPDF: construtor do jsPDF; d: dados do formulário; img: logotipos em data URI.
function buildFichaPdf(JsPDF, d, img) {
  var doc = new JsPDF({ unit: 'mm', format: 'a4' });
  var W = 210, M = 15, CW = W - 2 * M, y = 0;
  doc.setProperties({ title: 'Ficha de Filiação AARE-RO - ' + (d.nome || ''), subject: 'Ficha de Filiação', author: d.nome || '' });

  function header() {
    doc.addImage(img.rondonia, 'JPEG', M, 9.5, 26.6, 25);
    doc.addImage(img.banner, 'JPEG', (W - 88) / 2, 10.3, 88, 23.3);
    doc.addImage(img.brasil, 'JPEG', W - M - 25, 9.5, 25, 25);
    y = 40;
  }
  function footer(n) {
    doc.setDrawColor(0); doc.setLineWidth(0.3); doc.line(M, 278, W - M, 278);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9); doc.setTextColor(0);
    doc.text('Sede Estadual Rondônia', W / 2, 283, { align: 'center' });
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
    doc.text('Rua Oswaldo Lacerda, 5572 - Bairro Flodoaldo Pontes Pinto - CEP 76820-574 - Porto Velho/RO', W / 2, 287.5, { align: 'center' });
    doc.setFontSize(7.5); doc.setTextColor(110);
    doc.text('Página ' + n + ' de 2', W - M, 292, { align: 'right' });
    doc.setTextColor(0);
  }
  function section(t) {
    doc.setFillColor(0); doc.rect(M, y, CW, 7, 'F');
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.setTextColor(255);
    doc.text(t, M + 3, y + 4.9);
    doc.setTextColor(0); y += 12.5;
  }
  function fitText(txt, maxW, size) {
    txt = String(txt == null ? '' : txt);
    doc.setFontSize(size);
    while (size > 7.5 && doc.getTextWidth(txt) > maxW) { size -= 0.5; doc.setFontSize(size); }
    if (doc.getTextWidth(txt) > maxW) {
      while (txt.length > 1 && doc.getTextWidth(txt + '...') > maxW) txt = txt.slice(0, -1);
      txt += '...';
    }
    return txt;
  }
  function row(fields) {
    var x = M;
    fields.forEach(function (f) {
      var w = CW * f.w;
      doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(95);
      doc.text(f.l.toUpperCase(), x, y);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(0);
      doc.text(fitText(f.v, w - 5, 11), x, y + 5);
      doc.setDrawColor(150); doc.setLineWidth(0.2); doc.line(x, y + 6.6, x + w - 3, y + 6.6);
      x += w;
    });
    y += 12;
  }
  function check(on, text) {
    doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(M, y - 3.2, 3.8, 3.8);
    if (on) { doc.setLineWidth(0.6); doc.line(M + 0.7, y - 2.5, M + 3.1, y - 0.1); doc.line(M + 3.1, y - 2.5, M + 0.7, y - 0.1); }
    doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
    var lines = doc.splitTextToSize(text, CW - 7);
    doc.text(lines, M + 6.5, y);
    y += lines.length * 4.6 + 2.2;
  }
  function para(text, size) {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(size || 10);
    var lines = doc.splitTextToSize(text, CW);
    doc.text(lines, M, y, { align: 'left' });
    y += lines.length * 4.6 + 3;
  }
  function heading(t) {
    doc.setFont('helvetica', 'bold'); doc.setFontSize(10.5); doc.text(t, M, y); y += 5.5;
  }

  // ---------- Página 1 ----------
  header();
  doc.setFont('helvetica', 'bold'); doc.setFontSize(16);
  doc.text('FICHA DE FILIAÇÃO', W / 2, 45, { align: 'center' });

  var top = 50, ph = 40, pw = 30;
  doc.setDrawColor(0); doc.setLineWidth(0.3);
  doc.rect(M, top, pw, ph);
  if (d.foto) {
    doc.addImage(d.foto, 'JPEG', M + 0.4, top + 0.4, pw - 0.8, ph - 0.8);
  } else {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9); doc.setTextColor(120);
    doc.text('FOTO 3X4', M + pw / 2, top + ph / 2 + 1, { align: 'center' });
    doc.setTextColor(0);
  }
  var bx = M + pw + 5, bw = CW - pw - 5;
  doc.rect(bx, top, bw, ph);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(95);
  doc.text('USO EXCLUSIVO DA DIRETORIA', bx + 4, top + 6);
  doc.setTextColor(0); doc.setFont('helvetica', 'normal'); doc.setFontSize(10.5);
  doc.text('Nº Matrícula: ______________________', bx + 4, top + 15);
  doc.text('Data da Filiação: ____/____/________', bx + 4, top + 24);
  doc.text('Data de Desligamento: ____/____/________', bx + 4, top + 33);
  y = top + ph + 8;

  section('DADOS PESSOAIS');
  row([{ l: 'Nome Completo', v: d.nome, w: 1 }]);
  row([{ l: 'Apelido/Nome de Guerra', v: d.apelido, w: 0.4 }, { l: 'Data de Nascimento', v: d.nascimento, w: 0.27 }, { l: 'CPF', v: d.cpf, w: 0.33 }]);
  row([{ l: 'RG', v: d.rg, w: 0.3 }, { l: 'Órgão Exp.', v: d.orgao, w: 0.22 }, { l: 'CNH', v: d.cnh, w: 0.3 }, { l: 'Categoria', v: d.categoria, w: 0.18 }]);
  row([{ l: 'Estado Civil', v: d.estadoCivil, w: 0.4 }, { l: 'Profissão', v: d.profissao, w: 0.6 }]);
  row([{ l: 'Celular', v: d.celular, w: 0.4 }, { l: 'E-mail', v: d.email, w: 0.6 }]);
  y += 1;

  section('ENDEREÇO');
  row([{ l: 'Rua/Av.', v: d.rua, w: 0.8 }, { l: 'Nº', v: d.numero, w: 0.2 }]);
  row([{ l: 'Bairro', v: d.bairro, w: 0.4 }, { l: 'Cidade', v: d.cidade, w: 0.45 }, { l: 'UF', v: d.uf, w: 0.15 }]);
  row([{ l: 'CEP', v: d.cep, w: 0.3 }, { l: 'Ponto de Referência', v: d.referencia, w: 0.7 }]);
  y += 1;

  section('CONTATOS DE EMERGÊNCIA');
  row([{ l: 'Telefone Principal', v: d.emTel1, w: 0.5 }, { l: 'Grau de Parentesco', v: d.emPar1, w: 0.5 }]);
  row([{ l: 'Telefone Secundário', v: d.emTel2, w: 0.5 }, { l: 'Grau de Parentesco', v: d.emPar2, w: 0.5 }]);
  row([{ l: 'E-mail', v: d.emEmail, w: 1 }]);
  footer(1);

  // ---------- Página 2 ----------
  doc.addPage();
  header();
  y = 42;
  section('DADOS DA MOTOCICLETA');
  row([{ l: 'Marca', v: d.motoMarca, w: 0.5 }, { l: 'Modelo', v: d.motoModelo, w: 0.5 }]);
  row([{ l: 'Ano', v: d.motoAno, w: 0.25 }, { l: 'Cor', v: d.motoCor, w: 0.4 }, { l: 'Placa', v: d.motoPlaca, w: 0.35 }]);
  y += 1;

  section('DECLARAÇÕES');
  check(d.decEstatuto, 'Li e concordo com o Estatuto da AARE-RO.');
  check(d.decDados, 'Autorizo o uso dos meus dados para fins administrativos.');
  check(d.decVerdade, 'As informações prestadas são verdadeiras.');
  check(d.decImagem, 'Autorizo a utilização da minha imagem em fotografias, vídeos e materiais institucionais da AARE-RO para divulgação de eventos e atividades associativas.');
  y += 3;

  heading('TERMO DE CONSENTIMENTO PARA TRATAMENTO DE DADOS PESSOAIS');
  para('Em conformidade com a Lei nº 13.709/2018 (Lei Geral de Proteção de Dados Pessoais - LGPD), autorizo a AARE-RO a coletar, armazenar, utilizar e processar meus dados pessoais constantes nesta ficha de associação, exclusivamente para finalidades administrativas, cadastrais, estatutárias, financeiras, comunicação institucional e demais atividades relacionadas à gestão da associação.');
  y += 2;
  heading('TERMO DE FILIAÇÃO');
  para('Declaro que solicito minha filiação à AARE-RO, comprometendo-me a respeitar o estatuto, regulamentos e princípios da associação.');
  y += 2;

  // Assinatura
  var sh = 30;
  doc.setDrawColor(0); doc.setLineWidth(0.3); doc.rect(M, y, CW, sh);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); doc.setTextColor(95);
  doc.text('ASSINATURA DO FILIADO', M + 4, y + 6);
  doc.text('DATA', M + CW - 42, y + 6);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8); doc.setTextColor(140);
  doc.text('Posicione aqui a assinatura eletrônica gov.br', M + 4, y + sh - 4);
  doc.setTextColor(0); doc.setFontSize(11);
  doc.text(d.data || '', M + CW - 42, y + 12);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.text(fitText(d.nome, CW - 60, 9), M + 4, y + 12);
  doc.text('CPF ' + (d.cpf || ''), M + 4, y + 16.5);
  y += sh + 9;

  row([{ l: 'Padrinho', v: d.padrinho, w: 0.65 }, { l: 'Patente', v: d.patente, w: 0.35 }]);
  y += 1;

  section('PARECER DA DIRETORIA');
  row([{ l: 'Responsável pela Filiação', v: '', w: 0.5 }, { l: 'Patente', v: '', w: 0.25 }, { l: 'Cargo', v: '', w: 0.25 }]);
  footer(2);
  return doc;
}
if (typeof module !== 'undefined') module.exports = buildFichaPdf;
