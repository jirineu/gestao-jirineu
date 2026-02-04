const API_URL = window.location.hostname === 'localhost' 
   ? "http://localhost:3000/api" 
   : "https://SUA-URL-DO-RENDER.onrender.com/api";

// DADOS DE BACKUP INTEGRADOS (CUSTO KG) - MANTIDOS ORIGINAIS
const backupInicial = [
    { "id": 101, "nome": "Paparica picante", "custo": 12.00, "gramas": 100, "venda": 5.00, "estoque": 0, "obs": "" },
    { "id": 102, "nome": "Paparica doce", "custo": 12.00, "gramas": 100, "venda": 5.00, "estoque": 0, "obs": "" },
    { "id": 103, "nome": "Paparica defumada", "custo": 12.00, "gramas": 100, "venda": 5.00, "estoque": 1, "obs": "" },
    { "id": 104, "nome": "Colorau", "custo": 25.00, "gramas": 50, "venda": 3.50, "estoque": 10, "obs": "" },
    { "id": 105, "nome": "Chimi - churi", "custo": 28.20, "gramas": 50, "venda": 3.50, "estoque": 3, "obs": "" },
    { "id": 106, "nome": "Edu Guedes", "custo": 26.70, "gramas": 50, "venda": 3.50, "estoque": 1, "obs": "" },
    { "id": 107, "nome": "Ana Maria", "custo": 19.90, "gramas": 50, "venda": 3.50, "estoque": 6, "obs": "" },
    { "id": 108, "nome": "Lemon Pepper", "custo": 24.00, "gramas": 50, "venda": 3.50, "estoque": 4, "obs": "" },
    { "id": 109, "nome": "Alho frito", "custo": 25.50, "gramas": 100, "venda": 6.00, "estoque": 5, "obs": "" },
    { "id": 110, "nome": "Têmpera tudo", "custo": 27.00, "gramas": 50, "venda": 3.50, "estoque": 0, "obs": "" },
    { "id": 111, "nome": "Tempero baiano", "custo": 26.50, "gramas": 100, "venda": 5.00, "estoque": 4, "obs": "" },
    { "id": 112, "nome": "Tempero baiano S/", "custo": 20.00, "gramas": 100, "venda": 5.00, "estoque": 2, "obs": "" },
    { "id": 113, "nome": "Tempero mineiro", "custo": 21.00, "gramas": 50, "venda": 3.50, "estoque": 4, "obs": "" },
    { "id": 114, "nome": "Vinagrete", "custo": 34.70, "gramas": 50, "venda": 3.50, "estoque": 5, "obs": "" },
    { "id": 115, "nome": "Salsa cebola e alho", "custo": 31.60, "gramas": 50, "venda": 3.50, "estoque": 4, "obs": "" },
    { "id": 116, "nome": "Coentro inteiro", "custo": 9.00, "gramas": 50, "venda": 2.00, "estoque": 3, "obs": "" },
    { "id": 117, "nome": "Orégano", "custo": 0, "gramas": 25, "venda": 2.00, "estoque": 0, "obs": "" },
    { "id": 118, "nome": "Folhas de Louro", "custo": 36.50, "gramas": 25, "venda": 3.50, "estoque": 0, "obs": "" },
    { "id": 119, "nome": "Chá de especiarias", "custo": 29.90, "gramas": 100, "venda": 7.00, "estoque": 0, "obs": "" },
    { "id": 120, "nome": "Chá camomila", "custo": 34.90, "gramas": 100, "venda": 7.00, "estoque": 0, "obs": "" },
    { "id": 121, "nome": "Chá erva doce", "custo": 24.99, "gramas": 50, "venda": 5.00, "estoque": 0, "obs": "" },
    { "id": 122, "nome": "Chá capim", "custo": 0, "gramas": 100, "venda": 5.00, "estoque": 0, "obs": "" },
    { "id": 123, "nome": "Castanhas", "custo": 61.00, "gramas": 100, "venda": 9.99, "estoque": 0, "obs": "" }
];

// VARIÁVEIS GLOBAIS
let produtos = JSON.parse(localStorage.getItem('sp_prods')) || backupInicial;
let vendas = JSON.parse(localStorage.getItem('sp_vendas')) || [];
let configs = JSON.parse(localStorage.getItem('sp_cfgs')) || { valorFixo: 0 };
let listaCompras = JSON.parse(localStorage.getItem('sp_lista')) || [];
let carrinho = [];
let chart = null;


// --- FUNÇÃO DE SINCRONIZAÇÃO (ADICIONADA) ---
async function sincronizar() {
    localStorage.setItem('sp_prods', JSON.stringify(produtos));
    localStorage.setItem('sp_vendas', JSON.stringify(vendas));
    localStorage.setItem('sp_cfgs', JSON.stringify(configs));
    localStorage.setItem('sp_lista', JSON.stringify(listaCompras));

    try {
        await fetch(`${API_URL}/save`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produtos, vendas, configs, listaCompras })
        });
    } catch (e) { console.warn("Offline: Node não sincronizou."); }
}

// --- NAVEGAÇÃO ---
function notify(title, text, icon) {
    Swal.fire({ title, text, icon, confirmButtonColor: '#e67e22' });
}

function showScreen(id, btn) {
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    document.getElementById('screen-' + id).classList.add('active');
    
    if(!btn) {
        const map = { 'dash':0, 'lista':1, 'estoque':2, 'vendas':3, 'config':4 };
        btn = document.querySelectorAll('.nav-item')[map[id]];
    }
    if(btn) btn.classList.add('active');

    if(id === 'add') aplicarPrecoPadrao();
    if(id === 'estoque') listarEstoque();
    if(id === 'vendas') listarVendas();
    if(id === 'dash') atualizarDash();
    if(id === 'lista') abrirListaCompras();
    if(id === 'config') document.getElementById('cfg-valor-fixo').value = configs.valorFixo;
}

// --- CONFIGURAÇÕES ---
function salvarConfig() {
    configs.valorFixo = document.getElementById('cfg-valor-fixo').value;
    sincronizar(); // SALVAMENTO CENTRALIZADO
    notify("Sucesso!", "Preço padrão de venda atualizado!", "success");
}

function aplicarPrecoPadrao() {
    if(!document.getElementById('p-id').value) {
        const v = parseFloat(configs.valorFixo) || 0;
        document.getElementById('p-venda').value = v.toFixed(2);
        document.getElementById('p-sugerido').innerText = `R$ ${v.toFixed(2)}`;
    }
}

// --- LISTA DE ENTRADA (MANTIDA ORIGINAL) ---
function abrirListaCompras() {
    const sel = document.getElementById('li-produto-select');
    sel.innerHTML = produtos.map(p => `<option value="${p.id}">${p.nome} (${p.gramas}g/un)</option>`).join('');
    renderizarLista();
}

function adicionarNaLista() {
    const id = parseInt(document.getElementById('li-produto-select').value);
    const gramasInformadas = parseFloat(document.getElementById('li-qtd-gramas').value);
    const destinatario = document.getElementById('li-destinatario').value || "";
    
    if(!gramasInformadas) return notify("Atenção", "Insira a quantidade total em gramas!", "warning");
    
    const p = produtos.find(x => x.id === id);
    const unidadesConvertidas = gramasInformadas / p.gramas; 

    listaCompras.push({ 
        idLista: Date.now(), 
        idProd: id, 
        nome: p.nome, 
        destinatario: destinatario,
        gramasPedidas: gramasInformadas,
        qtdUnidades: unidadesConvertidas 
    });
    
    sincronizar();
    document.getElementById('li-qtd-gramas').value = '';
    document.getElementById('li-destinatario').value = '';
    renderizarLista();
}

function renderizarLista() {
    const cont = document.getElementById('lista-compras-pendentes');
    cont.innerHTML = '';
    if(listaCompras.length === 0) {
        cont.innerHTML = '<p style="text-align:center; color:#95a5a6; margin-top:20px;">Nenhum item pendente.</p>';
        return;
    }
    listaCompras.forEach(i => {
        const infoDestinatario = i.destinatario ? `<br><small>👤 Para: ${i.destinatario}</small>` : "";
        cont.innerHTML += `<div class="item-row">
            <div>
                <div class="info-main">${i.nome}${infoDestinatario}</div>
                <div class="info-sub">${i.gramasPedidas}g → <b>${i.qtdUnidades.toFixed(2)} potes</b></div>
            </div>
            <div style="display:flex; gap:5px;">
                <button class="btn-mini" style="background:var(--success)" onclick="confirmarCompra(${i.idLista})">✅</button>
                <button class="btn-mini" style="background:var(--danger)" onclick="removerLista(${i.idLista})">✕</button>
            </div>
        </div>`;
    });
}

function confirmarCompra(idL) {
    const idx = listaCompras.findIndex(l => l.idLista === idL);
    const item = listaCompras[idx];
    const pIdx = produtos.findIndex(p => p.id === item.idProd);
    
    if(pIdx !== -1) {
        produtos[pIdx].estoque = (parseFloat(produtos[pIdx].estoque) || 0) + item.qtdUnidades;
        listaCompras.splice(idx, 1);
        sincronizar();
        renderizarLista();
        notify("Estoque Atualizado", `${item.nome}: +${item.qtdUnidades.toFixed(2)} unidades adicionadas.`, "success");
    }
}

function removerLista(idL) {
    listaCompras = listaCompras.filter(l => l.idLista !== idL);
    sincronizar();
    renderizarLista();
}

// --- GESTÃO DE PRODUTOS ---
function excluirProduto(id) {
    Swal.fire({
        title: 'Excluir Produto?',
        text: "Esta ação é irreversível!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e74c3c',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            produtos = produtos.filter(p => p.id != id);
            sincronizar();
            notify("Excluído!", "O produto foi removido.", "success");
            limparForm();
            showScreen('estoque');
        }
    });
}

function salvarProduto() {
    const id = document.getElementById('p-id').value;
    const nome = document.getElementById('p-nome').value;
    const custo = parseFloat(document.getElementById('p-custo').value) || 0;
    const gramas = parseFloat(document.getElementById('p-gramas').value) || 1;
    const venda = parseFloat(document.getElementById('p-venda').value) || 0;
    const obs = document.getElementById('p-obs').value;

    if(!nome) return notify("Erro", "O nome do produto é obrigatório!", "error");

    if(id) {
        const i = produtos.findIndex(p => p.id == id);
        produtos[i] = {...produtos[i], nome, custo, gramas, venda, obs};
    } else {
        produtos.push({ id: Date.now(), nome, custo, gramas, venda, estoque: 0, obs });
    }

    sincronizar();
    limparForm();
    showScreen('estoque');
    notify("Sucesso", "Produto salvo!", "success");
}

function listarEstoque() {
    const cont = document.getElementById('lista-estoque');
    const busca = document.getElementById('busca-estoque').value.toLowerCase();
    cont.innerHTML = '';

    const filtrados = produtos.filter(p => p.nome.toLowerCase().includes(busca));
    
    if(filtrados.length === 0) {
        cont.innerHTML = '<p style="text-align:center; padding:20px;">Nenhum produto encontrado.</p>';
        return;
    }

    filtrados.forEach(p => {
        const statusCor = p.estoque < 1 ? 'color:var(--danger); font-weight:bold;' : '';
        cont.innerHTML += `
            <div class="item-row" style="${p.estoque < 1 ? 'border-left: 4px solid var(--danger)' : ''}">
                <div>
                    <div class="info-main">${p.nome}</div>
                    <div class="info-sub" style="${statusCor}">Qtd: ${parseFloat(p.estoque).toFixed(2)} un | R$ ${p.venda.toFixed(2)}</div>
                </div>
                <div style="display: flex; gap: 5px;">
                    <button onclick="movEstoque(${p.id}, -1)" class="btn-mini" style="background:var(--danger)">-1</button>
                    <button onclick="movEstoque(${p.id}, 1)" class="btn-mini" style="background:var(--success)">+1</button>
                    <button onclick="editarProduto(${p.id})" class="btn-mini" style="background:var(--dark)">✎</button>
                </div>
            </div>`;
    });
}

function movEstoque(id, qtd) {
    const i = produtos.findIndex(p => p.id == id);
    produtos[i].estoque = Math.max(0, (parseFloat(produtos[i].estoque) || 0) + qtd);
    sincronizar();
    listarEstoque();
}

function editarProduto(id) {
    const p = produtos.find(p => p.id == id);
    if (!p) return;

    document.getElementById('p-id').value = p.id;
    document.getElementById('p-nome').value = p.nome;
    document.getElementById('p-custo').value = p.custo;
    document.getElementById('p-gramas').value = p.gramas;
    document.getElementById('p-venda').value = p.venda;
    document.getElementById('p-obs').value = p.obs || '';
    document.getElementById('titulo-form').innerText = "✎ Editar Produto";
    document.getElementById('btn-cancelar').style.display = 'block';

    let btnExcluir = document.getElementById('btn-excluir-dinamico');
    if (!btnExcluir) {
        btnExcluir = document.createElement('button');
        btnExcluir.id = 'btn-excluir-dinamico';
        btnExcluir.className = 'btn';
        btnExcluir.style.backgroundColor = 'var(--danger)';
        btnExcluir.style.color = 'white';
        btnExcluir.style.marginTop = '10px';
        document.querySelector('.form-card').appendChild(btnExcluir);
    }
    
    btnExcluir.style.display = 'block';
    btnExcluir.innerHTML = `🗑️ Excluir ${p.nome}`;
    btnExcluir.onclick = () => excluirProduto(p.id);

    showScreen('add');
}

function limparForm() {
    document.getElementById('p-id').value = '';
    document.getElementById('p-nome').value = '';
    document.getElementById('p-custo').value = '';
    document.getElementById('p-gramas').value = '';
    document.getElementById('p-venda').value = '';
    document.getElementById('p-obs').value = '';
    document.getElementById('titulo-form').innerText = "➕ Novo Produto";
    document.getElementById('btn-cancelar').style.display = 'none';

    const btnExcluir = document.getElementById('btn-excluir-dinamico');
    if (btnExcluir) btnExcluir.style.display = 'none';
}

function cancelarEdicao() {
    limparForm();
    showScreen('estoque');
}

// --- INVENTÁRIO PESADO ---
function abrirPainelInventario() {
    const sel = document.getElementById('inv-produto-select');
    sel.innerHTML = produtos.map(p => `<option value="${p.id}">${p.nome}</option>`).join('');
    showScreen('inventario');
}

function salvarInventario() {
    const id = parseInt(document.getElementById('inv-produto-select').value);
    const gramasReais = parseFloat(document.getElementById('inv-nova-qtd-gramas').value);
    
    if(isNaN(gramasReais)) return notify("Ops", "Informe o peso total em gramas", "info");
    
    const i = produtos.findIndex(p => p.id === id);
    const p = produtos[i];
    const novaQtdUnidades = gramasReais / p.gramas;
    
    produtos[i].estoque = parseFloat(novaQtdUnidades.toFixed(2));
    
    sincronizar();
    document.getElementById('inv-nova-qtd-gramas').value = '';
    showScreen('estoque');
    notify("Inventário Atualizado", `${p.nome}: ${novaQtdUnidades.toFixed(2)} unidades.`, "success");
}

// --- PDF ---
function gerarRelatorioPDF() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    const dataRef = new Date().toLocaleString('pt-BR');

    doc.setFontSize(18);
    doc.setTextColor(44, 62, 80);
    doc.text("Relatório Geral de Estoque - SpiceManager", 14, 20);
    doc.setFontSize(10);
    doc.text(`Data de Emissão: ${dataRef}`, 14, 28);

    let totalCustoGeral = 0;
    let totalVendaGeral = 0;

    const corpoTabela = produtos.map(p => {
        const custoUnit = (p.custo / 1000) * p.gramas;
        const custoTotal = custoUnit * p.estoque;
        const vendaTotal = p.venda * p.estoque;
        totalCustoGeral += custoTotal;
        totalVendaGeral += vendaTotal;

        return [
            p.nome,
            parseFloat(p.estoque).toFixed(2),
            `R$ ${custoUnit.toFixed(2)}`,
            `R$ ${custoTotal.toFixed(2)}`,
            `R$ ${p.venda.toFixed(2)}`,
            `R$ ${vendaTotal.toFixed(2)}`
        ];
    });

    doc.autoTable({
        startY: 35,
        head: [['Produto', 'Qtd', 'Custo Un.', 'Total Custo', 'Venda Un.', 'Total Venda']],
        body: corpoTabela,
        theme: 'striped',
        styles: { fontSize: 8, halign: 'center' },
        headStyles: { fillColor: [230, 126, 34] }
    });

    let finalY = doc.lastAutoTable.finalY + 15;
    doc.setFontSize(11);
    doc.text(`Total Investido (Custo): R$ ${totalCustoGeral.toFixed(2)}`, 14, finalY);
    doc.text(`Expectativa de Receita (Venda): R$ ${totalVendaGeral.toFixed(2)}`, 14, finalY + 7);
    doc.setTextColor(39, 174, 96);
    doc.text(`Lucro Estimado: R$ ${(totalVendaGeral - totalCustoGeral).toFixed(2)}`, 14, finalY + 14);

    doc.save(`relatorio_${new Date().getTime()}.pdf`);
}

// --- VENDAS ---
function abrirNovaVenda() {
    carrinho = [];
    document.getElementById('v-cliente-nome').value = '';
    const sel = document.getElementById('v-produto-select');
    sel.innerHTML = produtos.map(p => `<option value="${p.id}">${p.nome} (Disponível: ${p.estoque})</option>`).join('');
    atualizarCarrinhoUI();
    showScreen('nova-venda');
}

function adicionarAoCarrinho() {
    const id = parseInt(document.getElementById('v-produto-select').value);
    const qtd = parseInt(document.getElementById('v-qtd').value);
    const p = produtos.find(p => p.id === id);

    if(!p || qtd <= 0) return;
    if(qtd > p.estoque) return notify("Estoque insuficiente", `Você só tem ${p.estoque} unidades.`, "error");
    
    const itemExistente = carrinho.find(c => c.id === id);
    if(itemExistente) {
        if((itemExistente.qtd + qtd) > p.estoque) return notify("Erro", "Soma excede o estoque.", "error");
        itemExistente.qtd += qtd;
    } else {
        carrinho.push({ id: p.id, nome: p.nome, qtd, preco: p.venda });
    }
    
    atualizarCarrinhoUI();
}

function atualizarCarrinhoUI() {
    const cont = document.getElementById('carrinho-itens');
    cont.innerHTML = '';
    let total = 0;
    carrinho.forEach((c, index) => {
        const sub = c.qtd * c.preco;
        total += sub;
        cont.innerHTML += `
            <div class="item-row">
                <span>${c.qtd}x ${c.nome}</span>
                <span>R$ ${sub.toFixed(2)} <button onclick="removerDoCarrinho(${index})" style="color:var(--danger); background:none; border:none; margin-left:10px; cursor:pointer">✕</button></span>
            </div>`;
    });
    document.getElementById('v-total-carrinho').innerText = `R$ ${total.toFixed(2)}`;
}

function removerDoCarrinho(index) {
    carrinho.splice(index, 1);
    atualizarCarrinhoUI();
}

function finalizarVenda() {
    if(carrinho.length === 0) return notify("Aviso", "Carrinho vazio.", "warning");
    const status = document.getElementById('v-status-pagamento').value;
    const total = carrinho.reduce((a, b) => a + (b.qtd * b.preco), 0);
    
    const venda = {
        id: Date.now(),
        dataISO: new Date().toISOString(),
        cliente: document.getElementById('v-cliente-nome').value || "Cliente Geral",
        itens: [...carrinho],
        total: total,
        status: status
    };

    carrinho.forEach(item => {
        const pIdx = produtos.findIndex(p => p.id === item.id);
        if(pIdx !== -1) produtos[pIdx].estoque -= item.qtd;
    });

    vendas.push(venda);
    sincronizar();
    notify("Sucesso", status === 'pago' ? "Venda finalizada!" : "Registrada como devedor!", "success");
    showScreen('vendas');
}

function listarVendas() {
    const cont = document.getElementById('lista-vendas-realizadas');
    cont.innerHTML = '';

    vendas.slice().reverse().forEach(v => {
        const dataF = new Date(v.dataISO).toLocaleString('pt-BR');
        const isPago = v.status === 'pago';
        const corStatus = isPago ? '#27ae60' : '#e67e22';
        const labelStatus = isPago ? 'PAGO' : 'DEVEDOR';

        const botaoBaixa = !isPago ? `<button class="btn-mini" style="background:#27ae60" onclick="darBaixaVenda(${v.id})">Baixa</button>` : '';

        cont.innerHTML += `
            <div class="item-row" style="border-left: 5px solid ${corStatus}">
                <div style="flex-grow: 1;">
                    <div class="info-main">${v.cliente} <small style="color:${corStatus}">(${labelStatus})</small></div>
                    <div class="info-sub">${dataF} | <b>Total: R$ ${v.total.toFixed(2)}</b></div>
                </div>
                <div style="display:flex; gap:12px; align-items: center;">
                    ${botaoBaixa}
                    <button onclick="verDetalhesVenda(${v.id})" style="background:none; border:none; text-decoration:underline;">Itens</button>
                    <button onclick="estornarVenda(${v.id})" style="color:var(--danger); border:none; background:none; font-weight:bold;">Estornar</button>
                </div>
            </div>`;
    });
}

function darBaixaVenda(id) {
    const idx = vendas.findIndex(v => v.id === id);
    if (idx !== -1) {
        vendas[idx].status = 'pago';
        sincronizar();
        listarVendas();
        notify("Sucesso", "Pagamento recebido!", "success");
    }
}

function estornarVenda(id) {
    Swal.fire({
        title: 'Estornar Venda?',
        text: "O estoque será devolvido.",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#e67e22',
        confirmButtonText: 'Sim, estornar!',
    }).then((result) => {
        if (result.isConfirmed) {
            const idx = vendas.findIndex(v => v.id === id);
            if(idx !== -1) {
                vendas[idx].itens.forEach(i => {
                    const pIdx = produtos.findIndex(p => p.id === i.id);
                    if(pIdx !== -1) produtos[pIdx].estoque += i.qtd;
                });
                vendas.splice(idx, 1);
                sincronizar();
                listarVendas();
                notify("Estornado", "Venda removida e estoque devolvido.", "success");
            }
        }
    });
}

// --- DASHBOARD (CÁLCULOS COMPLETOS) ---
function atualizarDash() {
    const periodo = parseInt(document.getElementById('dash-periodo').value);
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() - periodo);

    const vendasPeriodo = vendas.filter(v => new Date(v.dataISO) >= dataLimite && v.status === 'pago');
    const totalVendasPeriodo = vendasPeriodo.reduce((a, b) => a + b.total, 0);
    
    document.getElementById('dash-vendas-total').innerText = `R$ ${totalVendasPeriodo.toFixed(2)}`;
    document.getElementById('dash-itens-total').innerText = produtos.length;

    let totalCustoEstoque = 0;
    let totalVendaEstoque = 0;

    produtos.forEach(p => {
        const custoUnitario = (p.custo / 1000) * p.gramas; 
        totalCustoEstoque += custoUnitario * (p.estoque || 0);
        totalVendaEstoque += p.venda * (p.estoque || 0);
    });

    document.getElementById('dash-custo-estoque').innerText = `R$ ${totalCustoEstoque.toFixed(2)}`;
    document.getElementById('dash-venda-estoque').innerText = `R$ ${totalVendaEstoque.toFixed(2)}`;
    document.getElementById('dash-lucro-previsto').innerText = `R$ ${(totalVendaEstoque - totalCustoEstoque).toFixed(2)}`;

    const rankingProdutos = {};
    vendasPeriodo.forEach(v => {
        v.itens.forEach(item => {
            rankingProdutos[item.nome] = (rankingProdutos[item.nome] || 0) + item.qtd;
        });
    });
    const topProd = Object.entries(rankingProdutos).sort((a,b) => b[1] - a[1])[0];
    document.getElementById('dash-prod-top').innerText = topProd ? `${topProd[0]} (${topProd[1]} un)` : "-";

    const rankingClientes = {};
    vendas.forEach(v => { rankingClientes[v.cliente] = (rankingClientes[v.cliente] || 0) + v.total; });
    const topCliente = Object.entries(rankingClientes).sort((a,b) => b[1] - a[1])[0];
    document.getElementById('dash-cliente-top').innerText = topCliente ? `${topCliente[0]} (R$ ${topCliente[1].toFixed(2)})` : "-";

    const abaixoDeUm = produtos.filter(p => p.estoque < 1).length;
    document.getElementById('dash-estoque-critico').innerText = `${abaixoDeUm} produtos`;

    const movimentacao = produtos.map(p => {
        const vProd = vendasPeriodo.reduce((acc, v) => acc + (v.itens.find(i => i.id === p.id)?.qtd || 0), 0);
        return { nome: p.nome, qtd: vProd, estoque: p.estoque || 0 };
    });

    const top10Menos = movimentacao.sort((a,b) => a.qtd - b.qtd).slice(0, 10);
    document.getElementById('dash-menos-movimentados').innerHTML = top10Menos.map(m => 
        `• ${m.nome} <br> <small>(Vendas: ${m.qtd} | <b>Estoque: ${parseFloat(m.estoque).toFixed(2)}</b>)</small>`
    ).join('<br>');

    const ctx = document.getElementById('meuGrafico').getContext('2d');
    if(chart) chart.destroy();
    
    const labelsDias = [];
    const valoresDias = [];
    for(let i = periodo; i >= 0; i--) {
        const d = new Date(); d.setDate(d.getDate() - i);
        labelsDias.push(d.toLocaleDateString('pt-BR', {day:'2-digit', month:'2-digit'}));
        valoresDias.push(vendasPeriodo.filter(v => new Date(v.dataISO).toLocaleDateString() === d.toLocaleDateString()).reduce((a,b) => a + b.total, 0));
    }

    chart = new Chart(ctx, {
        type: 'line',
        data: { labels: labelsDias, datasets: [{ label: 'Vendas (R$)', data: valoresDias, borderColor: '#e67e22', fill: true, tension: 0.3 }] },
        options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
}

// --- BACKUP ---
function exportarBackup() {
    const dados = { produtos, vendas, configs, listaCompras, data: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `backup_${new Date().getTime()}.json`;
    a.click();
}

function importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const d = JSON.parse(e.target.result);
            produtos = d.produtos; vendas = d.vendas; configs = d.configs || { valorFixo: 0 };
            sincronizar();
            notify("Sucesso!", "Dados importados.", "success");
            location.reload();
        } catch (err) { notify("Erro", "Arquivo inválido.", "error"); }
    };
    reader.readAsText(file);
}

// --- DETALHES ---
function verDetalhesVenda(id) {
    const venda = vendas.find(v => v.id === id);
    if(!venda) return;

    let listaItens = venda.itens.map(i => 
        `<div style="display:flex; justify-content:space-between; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">
            <span>${i.qtd.toFixed(2)}x ${i.nome}</span>
            <span>R$ ${(i.qtd * i.preco).toFixed(2)}</span>
        </div>`
    ).join('');

    Swal.fire({
        title: `Detalhes do Pedido`,
        html: `
            <div style="text-align: left; font-size: 0.9rem; color: #2c3e50;">
                <p><b>Cliente:</b> ${venda.cliente}</p>
                <p><b>Data:</b> ${new Date(venda.dataISO).toLocaleString()}</p>
                <p><b>Status:</b> <span style="color: ${venda.status === 'pago' ? '#27ae60' : '#e67e22'}">${venda.status.toUpperCase()}</span></p>
                <hr style="margin: 10px 0; border: 0; border-top: 1px solid #eee;">
                ${listaItens}
                <div style="text-align: right; margin-top: 15px; font-weight: bold; font-size: 1.1rem; color: #e67e22;">
                    Total: R$ ${venda.total.toFixed(2)}
                </div>
            </div>`
    });
}

// INICIALIZAÇÃO
window.onload = async () => {
    try {
        // VERIFIQUE SE ESTA LINHA ABAIXO USA ${API_URL}
        const res = await fetch(`${API_URL}/data`); 
        
        const data = await res.json();
        if (data.produtos) {
            produtos = data.produtos;
            vendas = data.vendas || [];
            configs = data.configs || { valorFixo: 0 };
            listaCompras = data.listaCompras || [];
        }
    } catch (e) { 
        console.log("Carregado do LocalStorage ou erro de conexão."); 
    }
    
    atualizarDash();
};