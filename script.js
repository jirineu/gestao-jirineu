const API_URL = window.location.hostname === 'localhost' 
   ? "http://localhost:3000/api" 
   : "https://gestao-jirineu.onrender.com/api";
// No topo do script.js
let usuarioLogado = null; // Inicia vazio

window.onload = async () => {
    const sessaoSalva = localStorage.getItem('sessao_jirineu');

    if (sessaoSalva) {
        usuarioLogado = JSON.parse(sessaoSalva);
        document.getElementById('modalLogin').style.display = 'none';
        
        await carregarDadosReais();

        // Se recarregar a página e for visitante, bloqueia tudo de novo
        if (usuarioLogado.isGuest) {
            bloquearFuncoesVisita();
        } else if (usuarioLogado.tipo === "restrito") {
            aplicarRestricoes(usuarioLogado.permissoes);
        }
    }
};
// --- FUNÇÃO PARA APLICAR AS RESTRIÇÕES VISUAIS ---
function aplicarRestricoes(permissoes) {
    const botoesNav = document.querySelectorAll('.nav-item');
    
    botoesNav.forEach(btn => {
        // Extrai o nome da tela do atributo onclick
        const onclickAttr = btn.getAttribute('onclick');
        if (onclickAttr) {
            const telaNome = onclickAttr.split("'")[1];
            
            // Se a tela não estiver na lista de permissões, remove o botão
            if (!permissoes.includes(telaNome)) {
                btn.style.display = 'none';
            }
        }
    });

    // Se o usuário cair numa tela proibida por erro, joga ele para a primeira permitida
    if (!permissoes.includes('dash')) {
        showScreen(permissoes[0]);
    }
}


   

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
// --- FUNÇÃO DE SINCRONIZAÇÃO (ADICIONADA/ATUALIZADA) ---
async function sincronizar() {
    // TRAVA MESTRE: Impede qualquer alteração no banco de dados
    if (usuarioLogado && usuarioLogado.isGuest) {
        console.warn("Modo Visita: Sincronização bloqueada para proteger o banco de dados.");
        return; 
    }

    // Código original para usuários autorizados
    localStorage.setItem('sp_prods', JSON.stringify(produtos));
    localStorage.setItem('sp_vendas', JSON.stringify(vendas));
    localStorage.setItem('sp_cfgs', JSON.stringify(configs));
    localStorage.setItem('sp_lista', JSON.stringify(listaCompras));

    try {
        await fetch(`${API_URL}/save/principal`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ produtos, vendas, configs, listaCompras })
        });
    } catch (e) {
        console.error("Erro na sincronização:", e);
    }
}
async function salvarDados() {
    // Se o usuário for um visitante (guest), não tenta salvar no banco
    if (usuarioLogado && usuarioLogado.isGuest) return;

    try {
        const response = await fetch(`${API_URL}/salvar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                estoque: produtos, // envia o estoque atualizado
                listaCompras: listaCompras // envia a lista de compras atualizada
            })
        });

        if (!response.ok) {
            console.error("Erro ao salvar dados no servidor");
        } else {
            console.log("Dados sincronizados com o MongoDB");
        }
    } catch (error) {
        console.error("Erro na requisição de salvamento:", error);
    }
}
// --- NAVEGAÇÃO ---
function notify(title, text, icon) {
    Swal.fire({ title, text, icon, confirmButtonColor: '#e67e22' });
}

function showScreen(id, btn) {
    // 1. Esconde todas as telas e remove destaques do menu
    document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
    
    // 2. Localiza a tela correta (ajustado para aceitar config ou configs)
    const realId = (id === 'configs' || id === 'config') ? 'screen-config' : 'screen-' + id;
    const targetScreen = document.getElementById(realId);
    
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    // 3. Destaca o botão no menu inferior
    if(!btn) {
        // Mapeamos os dois nomes possíveis para a engrenagem (índice 4)
        const map = { 'dash':0, 'lista':1, 'estoque':2, 'vendas':3, 'config':4, 'configs':4 };
        btn = document.querySelectorAll('.nav-item')[map[id]];
    }
    if(btn) btn.classList.add('active');

    // 4. Gatilhos de carregamento
    if(id === 'add') aplicarPrecoPadrao();
    if(id === 'estoque') listarEstoque();
    if(id === 'vendas') listarVendas();
    if(id === 'dash') atualizarDash();
    if(id === 'lista') abrirListaCompras();

    // 5. Lógica da tela de CONFIGURAÇÕES
    if(id === 'config' || id === 'configs') {
        // Preenche o valor do lucro/preço fixo
        if (configs) document.getElementById('cfg-valor-fixo').value = configs.valorFixo || 0;

        // GESTÃO DE USUÁRIOS
        const areaAdmin = document.getElementById('area-admin-usuarios');
        if (usuarioLogado && usuarioLogado.tipo === 'admin') {
            if (areaAdmin) {
                areaAdmin.style.display = 'block'; // Garante que a div fique visível
                renderizarGestaoUsuarios(); // Chama a sua função que busca os usuários
            }
        } else {
            if (areaAdmin) areaAdmin.style.display = 'none';
        }
    }

    // Trava de visitantes
    if (usuarioLogado && usuarioLogado.isGuest) {
        setTimeout(() => { bloquearFuncoesVisita(); }, 100);
    }
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
    const select = document.getElementById('li-produto-select');
    const qtdInput = document.getElementById('li-qtd-gramas');
    const destInput = document.getElementById('li-destinatario');

    if (!select.value || !qtdInput.value) {
        return notify("Atenção", "Selecione um produto e insira as gramas!", "warning");
    }

    const idProd = parseInt(select.value);
    const gramasInformadas = parseFloat(qtdInput.value);
    const p = produtos.find(x => x.id === idProd);

    if (!p) return;

    // Calcula a conversão para potes baseada na gramagem do produto
    const unidadesConvertidas = gramasInformadas / p.gramas;

    const novoItem = { 
        idLista: Date.now(), 
        idProd: idProd, 
        nome: p.nome, 
        destinatario: destInput.value || "Manual",
        gramasPedidas: gramasInformadas,
        qtdUnidades: unidadesConvertidas 
    };

    // Adiciona ao array original do seu script
    listaCompras.push(novoItem);
    
    // Usa as funções que já existem no seu script.js para salvar e mostrar
    salvarLista(); 
    
    // Limpa os campos
    qtdInput.value = '';
    destInput.value = '';

    Swal.fire({
        icon: 'success',
        title: 'Adicionado!',
        timer: 1000,
        showConfirmButton: false
    });
}
function renderizarLista() {
    const cont = document.getElementById('lista-compras-pendentes');
    if (!cont) return;
    
    cont.innerHTML = '';

    if (listaCompras.length === 0) {
        cont.innerHTML = '<p style="text-align:center; color:#95a5a6; margin-top:20px;">Nenhum item pendente.</p>';
        return;
    }

   listaCompras.forEach((i, index) => { // Adicionei o 'index' aqui para facilitar
    const infoDestinatario = i.destinatario ? `<br><small style="color:#e67e22;">👤 Para: ${i.destinatario}</small>` : "";
    
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.style.cssText = `
        display: flex; justify-content: space-between; align-items: center;
        background: white; margin-bottom: 10px; padding: 15px;
        border-radius: 12px; border-left: 5px solid #e67e22;
        box-shadow: 0 2px 5px rgba(0,0,0,0.05);
    `;

    itemRow.innerHTML = `
        <div style="flex: 1;">
            <div style="color: #2c3e50; font-weight: bold; font-size: 1.1rem;">${i.nome}</div>
            
            <div style="display: flex; align-items: center; gap: 8px; margin: 8px 0;">
                <button class="btn-mini" style="background:#bdc3c7; width:25px; height:25px; padding:0; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="ajustarQtdLista(${index}, -0.5)">-</button>
                <span style="font-weight:bold; color:#2c3e50; min-width:60px; text-align:center;">${i.qtdUnidades.toFixed(2)} potes</span>
                <button class="btn-mini" style="background:#bdc3c7; width:25px; height:25px; padding:0; border:none; border-radius:4px; font-weight:bold; cursor:pointer;" onclick="ajustarQtdLista(${index}, 0.5)">+</button>
            </div>

            <div style="color: #7f8c8d; font-size: 0.8rem;">
                ${i.gramasPedidas}g total ${infoDestinatario}
            </div>
        </div>
        <div style="display:flex; gap:10px;">
            <button class="btn-mini" style="background:#27ae60; border:none; border-radius:5px; padding:8px; cursor:pointer;" onclick="confirmarCompra(${i.idLista})">✅</button>
            <button class="btn-mini" style="background:#e74c3c; border:none; border-radius:5px; padding:8px; cursor:pointer;" onclick="removerLista(${i.idLista})">✕</button>
        </div>
    `;
    cont.appendChild(itemRow);
});
}

// Certifique-se de que estas funções auxiliares também existam:
function toggleItemLista(index) {
    listaCompras[index].completado = !listaCompras[index].completado;
    renderizarListaCompras();
    salvarDados();
}

function removerItemLista(index) {
    listaCompras.splice(index, 1);
    renderizarListaCompras();
    salvarDados();
}

function renderizarLista() {
    const cont = document.getElementById('lista-compras-pendentes');
    if (!cont) return;
    cont.innerHTML = '';

    if (listaCompras.length === 0) {
        cont.innerHTML = '<p style="text-align:center; color:#95a5a6; margin-top:20px;">Nenhum item pendente.</p>';
        return;
    }

    listaCompras.forEach((i, index) => { // Adicionado o index aqui
    const unidades = parseFloat(i.qtdUnidades) || 0;
    const gramas = i.gramasPedidas || 0;
    const infoDestinatario = i.destinatario ? `<br><small style="color:#e67e22;">👤 Para: ${i.destinatario}</small>` : "";
    
    const itemRow = document.createElement('div');
    itemRow.className = 'item-row';
    itemRow.style.cssText = "display: flex; justify-content: space-between; align-items: center; background: white; margin-bottom: 10px; padding: 15px; border-radius: 12px; border-left: 5px solid #e67e22; box-shadow: 0 2px 5px rgba(0,0,0,0.05);";
    
    itemRow.innerHTML = `
        <div style="flex: 1;">
            <div style="color: #2c3e50; font-weight: bold; font-size: 1.1rem;">${i.nome}</div>
            
            <div style="display: flex; align-items: center; gap: 10px; margin: 5px 0;">
                <button class="btn-mini" style="background:#bdc3c7; width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:none; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="ajustarQtdLista(${index}, -1)">-</button>
                <span style="color: #7f8c8d; font-size: 0.9rem;">
                    ${gramas}g → <b>${unidades.toFixed(2)} potes</b>
                </span>
                <button class="btn-mini" style="background:#bdc3c7; width:26px; height:26px; display:flex; align-items:center; justify-content:center; border:none; border-radius:4px; cursor:pointer; font-weight:bold;" onclick="ajustarQtdLista(${index}, 1)">+</button>
            </div>
            
            ${infoDestinatario}
        </div>
        <div style="display:flex; gap:10px;">
            <button class="btn-mini" style="background:#27ae60; border:none; border-radius:5px; padding:8px; cursor:pointer;" onclick="confirmarCompra(${i.idLista})">✅</button>
            <button class="btn-mini" style="background:#e74c3c; border:none; border-radius:5px; padding:8px; cursor:pointer;" onclick="removerLista(${i.idLista})">✕</button>
        </div>`;
    cont.appendChild(itemRow);
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
    if (!cont) return;
    cont.innerHTML = '';
    let total = 0;

    carrinho.forEach((c, index) => {
        // PROTEÇÃO: Garante que preco e qtd sejam números
        const preco = parseFloat(c.preco) || 0;
        const qtd = parseFloat(c.qtd) || 1;
        const sub = qtd * preco;
        total += sub;

        cont.innerHTML += `
            <div class="item-row">
                <span>${qtd}x ${c.nome}</span>
                <span>R$ ${sub.toFixed(2)} 
                    <button onclick="removerDoCarrinho(${index})" style="color:var(--danger); background:none; border:none; cursor:pointer">✕</button>
                </span>
            </div>`;
    });

    const totalEl = document.getElementById('v-total-carrinho');
    if (totalEl) totalEl.innerText = `R$ ${total.toFixed(2)}`;
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
    atualizarIndicadoresDevedores()
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

async function importarBackup(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const d = JSON.parse(e.target.result);
            
            // Atualiza as variáveis globais com os dados do arquivo
            produtos = d.produtos || [];
            vendas = d.vendas || [];
            configs = d.configs || { valorFixo: 0 };
            listaCompras = d.listaCompras || [];

            // FORÇA a sincronização com o Render/MongoDB
            await sincronizar();

            notify("Sucesso!", "Dados importados e salvos na nuvem.", "success");
            
            // Pequena pausa para garantir que o banco de dados recebeu tudo antes de recarregar
            setTimeout(() => {
                location.reload();
            }, 1000);

        } catch (err) { 
            console.error("Erro na importação:", err);
            notify("Erro", "Arquivo de backup inválido.", "error"); 
        }
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



async // --- FUNÇÃO DE LOGIN DO ADMIN ---
async function validarAdmin() {
    const senha = document.getElementById('senhaAdmin').value;
    
    // Senha Mestra
    if (senha === "Freego123@") {
        // Define o objeto do utilizador com tipo ADMIN para permitir criar outros
        usuarioLogado = { 
            user: "Admin Principal", 
            tipo: "admin", 
            permissoes: ['dash', 'lista', 'estoque', 'vendas', 'config'] 
        };
        
        // Guarda a sessão para não sair ao dar F5
        localStorage.setItem('sessao_jirineu', JSON.stringify(usuarioLogado));
        
        document.getElementById('modalLogin').style.display = 'none';
        
        // Agora a função existe abaixo!
        await carregarDadosReais(); 
        
        if(typeof notify === "function") notify("Admin", "Acesso total liberado", "success");
    } else {
        alert("Senha incorreta!");
    }
}

// --- FUNÇÃO QUE BUSCA DADOS NO RENDER (BANCO ONLINE) ---
async function carregarDadosReais() {
    try {
        const res = await fetch(`${API_URL}/data`); 
        const data = await res.json();
        
        if (data) {
            produtos = data.produtos || [];
            vendas = data.vendas || [];
            listaCompras = data.listaCompras || [];
            configs = data.configs || { valorFixo: 0 };
            
            // Se o banco também trouxer a lista de utilizadores cadastrados
            usuariosCadastrados = data.usuarios || [];

            renderizarTudo();
            console.log("Dados do MongoDB carregados com sucesso.");
        }
    } catch (e) {
        console.error("Erro ao conectar com o banco online:", e);
        // Fallback: tenta carregar do localStorage se o banco falhar
        produtos = JSON.parse(localStorage.getItem('sp_prods')) || [];
    }
    atualizarIndicadoresDevedores()
}
function confirmarLoginVisita() {
    // 1. Define o objeto de segurança
    usuarioLogado = { 
        user: "Visitante", 
        tipo: "visita", 
        isGuest: true // A flag mestre de bloqueio
    };

    document.getElementById('modalLogin').style.display = 'none';
    
    // 2. Isolamento de dados: Criamos cópias que não linkam com o banco real
    if (typeof dadosFicticios !== 'undefined') {
        produtos = JSON.parse(JSON.stringify(dadosFicticios.produtos || []));
        vendas = JSON.parse(JSON.stringify(dadosFicticios.vendas || []));
        listaCompras = JSON.parse(JSON.stringify(dadosFicticios.listaCompras || []));
        configs = JSON.parse(JSON.stringify(dadosFicticios.configs || {}));
    }

    // 3. Persistência apenas local (Sessão)
    localStorage.setItem('sessao_jirineu', JSON.stringify(usuarioLogado));

    // 4. Ativação da interface e bloqueio total
    renderizarTudo();
    bloquearFuncoesVisita();
    
    if(typeof notify === "function") {
        notify("Modo Visita", "BLOQUEIO ATIVO: Nenhuma alteração será salva.", "info");
    }
}

function renderizarTudo() {
    // Chama a atualização do gráfico e das tabelas
    if (typeof atualizarDash === "function") atualizarDash(); 
    if (typeof listarEstoque === "function") listarEstoque();
    if (typeof listarVendas === "function") listarVendas();
}

function bloquearFuncoesVisita() {
    // Desativa TODOS os inputs, botões e seletores
    const elementosParaBloquear = document.querySelectorAll('button, input, select, textarea');
    
    elementosParaBloquear.forEach(el => {
        // Exceção: Botões de navegação e logout devem funcionar
        const onclickAttr = el.getAttribute('onclick') || "";
        if (onclickAttr.includes('showScreen') || onclickAttr.includes('efetuarLogout')) {
            return; 
        }

        // Bloqueio físico e visual
        el.disabled = true;
        el.style.opacity = '0.4';
        el.style.cursor = 'not-allowed';
        
        // Remove qualquer evento de clique que possa estar pendurado
        el.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
    });

    // Esconde seções sensíveis como gestão de usuários
    const areaAdmin = document.getElementById('area-admin-usuarios');
    if (areaAdmin) areaAdmin.style.display = 'none';
}


// --- FUNÇÕES DE NAVEGAÇÃO DO MODAL (LIGAM AOS BOTÕES DO INDEX.HTML) ---

// 1. Mostra os campos de senha quando clica em "Acesso Administrador"
function mostrarCamposAdmin() {
    document.getElementById('loginOpcoes').style.display = 'none';
    document.getElementById('msgVisita').style.display = 'none';
    document.getElementById('loginAdminCampos').style.display = 'block';
    document.getElementById('senhaAdmin').focus();
}

// 2. Volta para a tela inicial do modal
function voltarOpcoes() {
    document.getElementById('loginAdminCampos').style.display = 'none';
    document.getElementById('loginOpcoes').style.display = 'block';
    document.getElementById('msgVisita').style.display = 'none';
}

// 3. Mostra o aviso do modo visita
function mostrarInfoVisita() {
    document.getElementById('loginAdminCampos').style.display = 'none';
    document.getElementById('loginOpcoes').style.display = 'none';
    document.getElementById('msgVisita').style.display = 'block';
}

// 4. Valida a senha do Admin e carrega dados reais
async function validarAdmin() {
    const passIn = document.getElementById('senhaAdmin').value;

    // 1. Verificação da Senha Mestra (Acesso Total Garantido)
    if (passIn === "Freego123@") {
        usuarioLogado = { user: "Admin", tipo: "admin", permissoes: ['dash', 'lista', 'estoque', 'vendas', 'config'] };
        
        // Salva no navegador para não precisar logar de novo ao dar F5
        localStorage.setItem('sessao_jirineu', JSON.stringify(usuarioLogado));
        
        document.getElementById('modalLogin').style.display = 'none';
        
        // Carrega os dados reais do Render
        if (typeof carregarDadosReais === "function") await carregarDadosReais();
        
        notify("Bem-vindo", "Acesso Administrador liberado", "success");
        return; // Para a execução aqui pois já logou
    }

    // 2. Se não for a senha mestra, tenta procurar utilizadores cadastrados no banco
    try {
        const res = await fetch(`${API_URL}/usuarios`); // Rota que busca utilizadores no banco
        const usuarios = await res.json();
        
        const userEncontrado = usuarios.find(u => u.pass === passIn);

        if (userEncontrado) {
            usuarioLogado = userEncontrado;
            localStorage.setItem('sessao_jirineu', JSON.stringify(usuarioLogado));
            document.getElementById('modalLogin').style.display = 'none';
            
            await carregarDadosReais();
            
            if (usuarioLogado.tipo === "restrito") {
                aplicarRestricoes(usuarioLogado.permissoes);
            }
            
            notify("Olá", `Bem-vindo, ${usuarioLogado.user}`, "success");
        } else {
            alert("Acesso negado: Senha incorreta.");
        }
    } catch (e) {
        console.error("Erro ao validar no banco:", e);
        alert("Acesso negado: Senha incorreta ou erro de conexão.");
    }
}
async function confirmarLoginVisita() {
    usuarioLogado = { 
        user: "Visitante", 
        tipo: "visita", 
        isGuest: true 
    };

    document.getElementById('modalLogin').style.display = 'none';
    localStorage.setItem('sessao_jirineu', JSON.stringify(usuarioLogado));

    // Carrega os dados da partição "visita" do MongoDB
    await carregarDadosReais(); 
    
    // Trava a interface
    bloquearFuncoesVisita();

    if(typeof Swal !== 'undefined') {
        Swal.fire("Modo Visita", "Acesso apenas para visualização. Alterações não são permitidas.", "info");
    }
}
async function cadastrarNovoUsuario(nome, senha, permissoes) {
    try {
        // Objeto com os dados para o servidor
        const dadosParaEnviar = {
            user: nome,
            pass: senha,
            tipo: "restrito",
            permissoes: permissoes
        };

        // Faz a chamada para o servidor (Render)
        const response = await fetch(`${API_URL}/save-user`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dadosParaEnviar)
        });

        // Tenta ler a resposta do servidor
        const resultado = await response.json();

        if (response.ok) {
            Swal.fire("Sucesso!", "Utilizador criado com sucesso no banco de dados!", "success");
            
            // Limpa os campos após o sucesso
            document.getElementById('novo-user-login').value = "";
            document.getElementById('novo-user-senha').value = "";
            document.querySelectorAll('.perm-check').forEach(c => c.checked = false);
        } else {
            // Se o servidor retornar erro (ex: utilizador já existe)
            Swal.fire("Erro", resultado.message || "Erro ao salvar", "error");
        }

    } catch (error) {
        console.error("Erro na comunicação com o servidor:", error);
        Swal.fire("Erro de Conexão", "Não foi possível contactar o servidor. Verifique se o backend está online.", "error");
    }
}
function aplicarRestricoes(permissoes) {
    // Mapeamento dos botões da nav
    const botoesNav = document.querySelectorAll('.nav-item');
    
    botoesNav.forEach(btn => {
        // Pega o nome da tela no onclick, ex: showScreen('estoque', this) -> 'estoque'
        const telaNome = btn.getAttribute('onclick').split("'")[1];
        
        if (!permissoes.includes(telaNome)) {
            btn.style.display = 'none'; // Esconde a aba se não tiver permissão
        }
    });
    
    // Redireciona para a primeira tela permitida
    showScreen(permissoes[0], botoesNav[0]);
}
function prepararCadastro() {
    const nome = document.getElementById('novo-user-login').value;
    const senha = document.getElementById('novo-user-senha').value;
    const checks = document.querySelectorAll('.perm-check:checked');
    const permissoes = Array.from(checks).map(c => c.value);

    // Validação com alerta educativo
    if (!nome.trim() || !senha.trim()) {
        Swal.fire({
            icon: 'warning',
            title: 'Campos Incompletos',
            text: 'Por favor, digite um nome de utilizador e uma senha para continuar.',
            confirmButtonColor: '#e67e22'
        });
        return;
    }

    if (permissoes.length === 0) {
        Swal.fire({
            icon: 'info',
            title: 'Defina as Permissões',
            text: 'Um novo utilizador precisa de acesso a pelo menos uma aba do sistema.',
            confirmButtonColor: '#e67e22'
        });
        return;
    }

    // Se passou nas validações, chama o envio
    cadastrarNovoUsuario(nome, senha, permissoes);
}
window.onload = () => {
    const sessaoSalva = localStorage.getItem('sessao_jirineu');
    
    if (sessaoSalva) {
        usuarioLogado = JSON.parse(sessaoSalva);
        document.getElementById('modalLogin').style.display = 'none';
        
        carregarDadosReais().then(() => {
            if (usuarioLogado.tipo === "restrito") {
                aplicarRestricoes(usuarioLogado.permissoes);
            }
        });
    } else {
        console.log("Nenhum utilizador logado. Aguardando...");
    }
};
function efetuarLogout() {
    localStorage.removeItem('sessao_jirineu');
    location.reload(); // Recarrega a página e o Modal de login aparecerá
}
// --- FUNÇÃO PARA CARREGAR DADOS (ADMIN) ---
async function carregarDadosReais() {
    // 1. Identifica qual chave buscar (visita ou principal)
    const chave = (usuarioLogado && usuarioLogado.isGuest) ? "visita" : "principal";
    
    try {
        // 2. Faz a chamada para a nova rota parametrizada
        const res = await fetch(`${API_URL}/load/${chave}`);
        const dados = await res.json();

        if (dados) {
            // Alimenta as variáveis globais com os dados do banco
            produtos = dados.produtos || [];
            vendas = dados.vendas || [];
            listaCompras = dados.listaCompras || [];
            configs = dados.config || {};
            
            renderizarTudo();
        }
    } catch (e) {
        console.error("Erro ao carregar dados do MongoDB:", e);
        if(typeof notify === "function") notify("Erro", "Não foi possível carregar os dados.", "danger");
    }
    atualizarIndicadoresDevedores()
}

// --- FUNÇÃO PARA CRIAR UTILIZADOR (CHAMADA PELO BOTÃO) ---
async function cadastrarNovoUsuario(nome, senha, permissoes) {
    // Exibe um alerta de "Carregando" para dar feedback ao usuário
    Swal.fire({
        title: 'A guardar...',
        text: 'A registar o novo utilizador no banco de dados.',
        allowOutsideClick: false,
        didOpen: () => { Swal.showLoading(); }
    });

    try {
        const dadosParaEnviar = {
            user: nome,
            pass: senha,
            tipo: "restrito",
            permissoes: permissoes
        };

        const response = await fetch(`${API_URL}/save-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosParaEnviar)
        });

        const resultado = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: 'Utilizador Criado!',
                text: `O acesso para "${nome}" foi configurado com sucesso.`,
                timer: 3000,
                showConfirmButton: false
            });
            
            // Limpeza de campos
            document.getElementById('novo-user-login').value = "";
            document.getElementById('novo-user-senha').value = "";
            document.querySelectorAll('.perm-check').forEach(c => c.checked = false);
        } else {
            // Caso o servidor responda erro (ex: Usuário já existe)
            Swal.fire({
                icon: 'error',
                title: 'Não foi possível salvar',
                text: resultado.message || 'Ocorreu um erro inesperado.',
                confirmButtonColor: '#d33'
            });
        }

    } catch (error) {
        console.error("Erro na comunicação:", error);
        Swal.fire({
            icon: 'error',
            title: 'Falha na Conexão',
            text: 'Não conseguimos contactar o servidor. Verifique a sua internet ou se o backend está online.',
            confirmButtonColor: '#d33'
        });
    }
}
// Mostra os inputs de login
function mostrarCamposAdmin() {
    document.getElementById('loginOpcoes').style.display = 'none';
    document.getElementById('loginAdminCampos').style.display = 'block';
    document.getElementById('userLogin').focus();
}
async function cadastrarNovoUsuario(nome, senha, permissoes) {
    try {
        // O corpo (body) deve ter os nomes que o servidor espera: user, pass, tipo, permissoes
        const dados = {
            user: nome,
            pass: senha,
            tipo: "restrito",
            permissoes: permissoes
        };

        const response = await fetch(`${API_URL}/save-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dados)
        });

        const resultado = await response.json();

        if (response.ok) {
            Swal.fire("Sucesso!", "Novo utilizador cadastrado no banco de dados!", "success");
            
            // Limpa o formulário após o sucesso
            document.getElementById('novo-user-nome').value = "";
            document.getElementById('novo-user-senha').value = "";
            document.querySelectorAll('.perm-check').forEach(c => c.checked = false);
        } else {
            Swal.fire("Erro", resultado.message || "Erro ao cadastrar", "error");
        }
    } catch (error) {
        console.error("Erro na requisição:", error);
        Swal.fire("Erro", "Não foi possível conectar ao servidor.", "error");
    }
}
// Volta para os botões de Admin/Visita
function voltarOpcoes() {
    document.getElementById('loginAdminCampos').style.display = 'none';
    document.getElementById('loginOpcoes').style.display = 'block';
}

// A sua função validarAdmin deve ser atualizada para ler também o campo 'userLogin'
async function validarAdmin() {
    const usuarioDigitado = document.getElementById('userLogin').value.toLowerCase().trim();
    const senhaDigitada = document.getElementById('senhaAdmin').value;

    // 1. Atalho para Super Admin
    if (senhaDigitada === "Freego123@" && (usuarioDigitado === "admin" || usuarioDigitado === "")) {
        usuarioLogado = { user: "Admin", tipo: "admin", permissoes: ['dash', 'lista', 'estoque', 'vendas', 'config'] };
        finalizarLogin();
        return;
    }

    // 2. Busca no banco de dados para outros utilizadores
    try {
        const res = await fetch(`${API_URL}/usuarios`);
        const usuarios = await res.json();
        const encontrado = usuarios.find(u => u.user === usuarioDigitado && u.pass === senhaDigitada);

        if (encontrado) {
            usuarioLogado = encontrado;
            finalizarLogin();
        } else {
            alert("Utilizador ou senha incorretos.");
        }
    } catch (e) {
        alert("Erro ao conectar com o servidor.");
    }
}

function finalizarLogin() {
    localStorage.setItem('sessao_jirineu', JSON.stringify(usuarioLogado));
    document.getElementById('modalLogin').style.display = 'none';
    carregarDadosReais();
    if (usuarioLogado.tipo === "restrito") aplicarRestricoes(usuarioLogado.permissoes);
}

function bloquearFuncoesVisita() {
    // Seleciona todos os elementos de interação
    const elementosParaBloquear = document.querySelectorAll('button, input, select, textarea');
    
    elementosParaBloquear.forEach(el => {
        // Exceção: Permite apenas botões de navegar entre telas e o de Sair (Logout)
        const onclickAttr = el.getAttribute('onclick') || "";
        if (onclickAttr.includes('showScreen') || onclickAttr.includes('efetuarLogout')) {
            return; 
        }

        // Desativa o elemento
        el.disabled = true;
        el.style.opacity = '0.5';
        el.style.cursor = 'not-allowed';
        
        // Remove cliques acidentais
        el.onclick = (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        };
    });

    // Esconde especificamente a área de gestão de usuários nas configurações
    const areaAdmin = document.getElementById('area-admin-usuarios');
    if (areaAdmin) areaAdmin.style.display = 'none';
}
function bloquearFuncoesVisita() {
    // 1. Desativa elementos estáticos
    const elementos = document.querySelectorAll('button, input, select');
    elementos.forEach(el => {
        const acao = el.getAttribute('onclick') || "";
        // Se NÃO for botão de trocar tela ou logout, trava.
        if (!acao.includes('showScreen') && !acao.includes('efetuarLogout')) {
            el.disabled = true;
            el.style.opacity = '0.5';
            el.style.cursor = 'not-allowed';
        }
    });

    // 2. Trava específica para os botões de + e - do estoque e botões de lixeira
    const botoesAcao = document.querySelectorAll('.btn-qty, .btn-del, .btn-save');
    botoesAcao.forEach(btn => {
        btn.disabled = true;
        btn.style.pointerEvents = 'none'; // Impede qualquer clique
        btn.style.filter = 'grayscale(100%)'; // Fica cinza
    });
}
function salvarLista() {
    // Salva no LocalStorage do navegador
    localStorage.setItem('sp_lista', JSON.stringify(listaCompras));
    
    // Sincroniza com o servidor/nuvem (se não for visitante)
    if (typeof sincronizar === "function") {
        sincronizar();
    }
    
    // Atualiza a visualização na tela
    renderizarLista();
}

function gerarListaPorEstoque(minimo) {
    // 1. Limpamos a lista atual para não duplicar se o usuário clicar várias vezes
    listaCompras = [];

    // 2. Filtramos os produtos que estão abaixo do mínimo
    produtos.forEach(p => {
        const estoqueAtual = parseFloat(p.estoque) || 0;
        
        if (estoqueAtual < minimo) {
            // Calculamos quanto falta para chegar no mínimo
            const diferenca = minimo - estoqueAtual;
            
            // Criamos o item para a lista no formato que o seu sistema já usa
            const novoItem = {
                idLista: Date.now() + Math.random(), // ID único
                idProd: p.id,
                nome: p.nome,
                destinatario: "Reposição de Estoque",
                gramasPedidas: diferenca * p.gramas, // Ex: faltam 2 potes de 100g = 200g
                qtdUnidades: diferenca // Quantidade de potes necessários
            };
            
            listaCompras.push(novoItem);
        }
    });

    // 3. Salvamos e mostramos na tela
    salvarLista(); 

    // Feedback para o usuário
    if (listaCompras.length > 0) {
        Swal.fire({
            icon: 'success',
            title: 'Lista Gerada!',
            text: `${listaCompras.length} itens precisam de reposição.`,
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        Swal.fire({
            icon: 'info',
            title: 'Estoque em dia!',
            text: 'Nenhum produto está abaixo do limite informado.',
            confirmButtonColor: '#e67e22'
        });
    }
}
async function abrirModalGerarLista() {
    const { value: estoqueMinimo } = await Swal.fire({
        title: 'Gerar por Estoque',
        text: 'Produtos abaixo deste valor serão adicionados à lista.',
        input: 'number',
        inputLabel: 'Qual o estoque mínimo desejado?',
        inputValue: 5, // Valor padrão sugerido
        showCancelButton: true,
        confirmButtonText: 'Gerar Lista',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#27ae60',
        inputValidator: (value) => {
            if (!value || value <= 0) {
                return 'Por favor, insira um número maior que zero!';
            }
        }
    });

    if (estoqueMinimo) {
        gerarListaPorEstoque(parseFloat(estoqueMinimo));
    }
}
async function menuListaAutomatizada() {
    const { value: acao } = await Swal.fire({
        title: 'Gestão de Produção',
        text: 'O que deseja fazer?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: '🚀 Gerar por Estoque',
        denyButtonText: '📄 Baixar PDF',
        showDenyButton: true,
        confirmButtonColor: '#27ae60',
        denyButtonColor: '#e67e22'
    });

    if (acao === true) {
        abrirModalGerarLista();
    } else if (acao === false) {
        gerarPDFListaCompras(); // Sua função de PDF existente
    }
}
function gerarPDFListaCompras() {
    if (listaCompras.length === 0) {
        return Swal.fire("Lista Vazia", "Não há itens para gerar o PDF.", "info");
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Título do Documento
    doc.setFontSize(18);
    doc.setTextColor(230, 126, 34); // Cor Laranja SpiceManager
    doc.text("Lista de Compras - Produção", 14, 20);
    
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 28);

    // Preparação dos dados: Nome e Gramas
    // Aqui somamos as gramas caso o mesmo produto apareça mais de uma vez na lista
    const resumo = {};
   listaCompras.forEach (item => {
        if (resumo[item.nome]) {
            resumo[item.nome] += (parseFloat(item.gramasPedidas) || 0);
        } else {
            resumo[item.nome] = (parseFloat(item.gramasPedidas) || 0);
        }
    });

    const rows = Object.keys(resumo).map(nome => [
        nome, 
        `${resumo[nome]}g`
    ]);

    // Gerar a Tabela (Apenas Nome e Gramas)
    doc.autoTable({
        startY: 35,
        head: [['Produto', 'Total para Compra (Gramas)']],
        body: rows,
        headStyles: { fillColor: [230, 126, 34] }, // Cabeçalho Laranja
        styles: { fontSize: 12, cellPadding: 5 },
        columnStyles: {
            0: { cellWidth: 120 }, // Nome mais largo
            1: { cellWidth: 60, halign: 'right' } // Gramas à direita
        }
    });

    // Salvar o arquivo
    doc.save(`Lista_de_Compras_${Date.now()}.pdf`);
}
function atualizarIndicadoresDevedores() {
    // Filtra vendas com status diferente de 'pago' (ajuste o nome do status se necessário)
    const totalDevedores = vendas
        .filter(v => v.status !== 'pago') 
        .reduce((acc, v) => acc + (parseFloat(v.total) || 0), 0);

    const valorFormatado = `R$ ${totalDevedores.toFixed(2)}`;

    // Atualiza no Dashboard
    const elDash = document.getElementById('indicador-devedores-dash');
    if (elDash) elDash.innerText = valorFormatado;

    // Atualiza na Área de Vendas
    const elVendas = document.getElementById('indicador-devedores-vendas');
    if (elVendas) elVendas.innerText = `Devedores: ${valorFormatado}`;
}


// Função para carregar e mostrar a lista de usuários
async function renderizarGestaoUsuarios() {
    // Verifica se é admin antes de tentar carregar
    if (!usuarioLogado || usuarioLogado.tipo !== 'admin') return;

    const cont = document.getElementById('lista-usuarios-gestao');
    if (!cont) return;

    try {
        const res = await fetch(`${API_URL}/usuarios`);
        const usuarios = await res.json();

        cont.innerHTML = ''; // Limpa a lista antes de renderizar

        usuarios.forEach(u => {
            // Evita que o admin principal exclua a si mesmo por aqui
            const isAdminPrincipal = u.user === 'admin';

            const card = document.createElement('div');
            card.className = 'item-row';
            card.style.cssText = `
                background: white; 
                padding: 12px; 
                border-radius: 10px; 
                margin-bottom: 10px; 
                display: flex; 
                justify-content: space-between; 
                align-items: center;
                border: 1px solid #eee;
                box-shadow: 0 2px 4px rgba(0,0,0,0.02);
            `;

            card.innerHTML = `
                <div>
                    <div style="font-weight: bold; color: var(--dark);">${u.user.toUpperCase()}</div>
                    <div style="font-size: 0.75rem; color: #7f8c8d;">
                        Tipo: ${u.tipo} | Permissões: ${u.permissoes.length > 0 ? u.permissoes.join(', ') : 'Nenhuma'}
                    </div>
                </div>
                ${!isAdminPrincipal ? `
                    <button onclick="deletarUsuario('${u._id}')" style="background: #fff5f5; border: 1px solid #feb2b2; color: #c53030; padding: 5px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
                        Excluir
                    </button>
                ` : '<span style="font-size: 0.7rem; color: #95a5a6;">(Mestre)</span>'}
            `;
            cont.appendChild(card);
        });
    } catch (e) {
        console.error("Erro ao carregar lista de usuários:", e);
        cont.innerHTML = '<p style="color:red;">Erro ao carregar usuários.</p>';
    }
}

// Função para deletar usuário
async function deletarUsuario(id) {
    const confirmacao = await Swal.fire({
        title: 'Tem certeza?',
        text: "O usuário perderá o acesso imediatamente!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Sim, excluir!',
        cancelButtonText: 'Cancelar'
    });

    if (confirmacao.isConfirmed) {
        try {
            const res = await fetch(`${API_URL}/usuarios/${id}`, { method: 'DELETE' });
            if (res.ok) {
                Swal.fire('Excluído!', 'Usuário removido com sucesso.', 'success');
                renderizarGestaoUsuarios(); // Recarrega a lista
            }
        } catch (e) {
            Swal.fire('Erro', 'Não foi possível excluir o usuário.', 'error');
        }
    }
}
async function salvarNovoUsuario() {
    const user = document.getElementById('new-user-name').value;
    const pass = document.getElementById('new-user-pass').value;
    const checks = document.querySelectorAll('.perm-check:checked');
    const permissoes = Array.from(checks).map(c => c.value);

    if (!user || !pass) {
        return Swal.fire("Ops", "Nome e senha são obrigatórios", "warning");
    }

    try {
        const res = await fetch(`${API_URL}/save-user`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user, pass, tipo: 'restrito', permissoes })
        });

        if (res.ok) {
            Swal.fire("Sucesso", "Novo usuário cadastrado!", "success");
            // Limpa os campos
            document.getElementById('new-user-name').value = '';
            document.getElementById('new-user-pass').value = '';
            renderizarGestaoUsuarios(); // Atualiza a lista na tela
        } else {
            const erro = await res.json();
            Swal.fire("Erro", erro.message, "error");
        }
    } catch (e) {
        Swal.fire("Erro", "Falha na comunicação com o servidor", "error");
    }
} 
function alterarQuantidade(index, delta) {
    // Altera a quantidade baseada no delta (+1 ou -1)
    listaCompras[index].qtd += delta;

    // Impede que a quantidade seja menor que 1
    if (listaCompras[index].qtd < 1) {
        listaCompras[index].qtd = 1;
    }

    // Atualiza a visualização e os totais
    renderizarListaCompras();
    atualizarTotalPedido(); // se você tiver uma função de soma total
}
function ajustarQtdLista(index, delta) {
    const item = listaCompras[index];
    const p = produtos.find(x => x.id === item.idProd);
    
    // Altera a quantidade (mínimo de 0.5 potes)
    item.qtdUnidades = Math.max(0.5, (parseFloat(item.qtdUnidades) || 0) + delta);
    
    // Recalcula o peso em gramas baseado no peso original do produto
    if (p) {
        item.gramasPedidas = item.qtdUnidades * p.gramas;
    }

    sincronizar(); // Salva as alterações no banco/nuvem
    renderizarLista(); // Atualiza a lista na tela para mostrar o novo valor
}
