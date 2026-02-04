window.addEventListener('load', async () => {
    const sessaoSativa = localStorage.getItem('sessao_jirineu');
    
    if (sessaoSativa) {
        usuarioLogado = JSON.parse(sessaoSativa);
        console.log("Sessão recuperada:", usuarioLogado.user);

        // Esconde o login imediatamente
        const modal = document.getElementById('modalLogin');
        if (modal) modal.style.display = 'none';

        // Carrega os dados reais
        if (typeof carregarDadosReais === "function") {
            await carregarDadosReais();
        }
