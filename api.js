// api.js - Centralizador de chamadas para o Backend Spring Boot

const API_BASE_URL = 'https://controlefinanceiroapi-1o7j.onrender.com';

// Utilitários de Autenticação e Sessão
function getAuthToken() {
    return localStorage.getItem('porkito_token');
}

function getUsuarioLogado() {
    const userStr = localStorage.getItem('porkito_user');
    return userStr ? JSON.parse(userStr) : null;
}

function salvarAutenticacao(loginResponse) {
    localStorage.setItem('porkito_token', loginResponse.token);
    localStorage.setItem('porkito_user', JSON.stringify({
        id: loginResponse.usuarioId,
        email: loginResponse.email,
        nome: loginResponse.nome
    }));
}

function encerrarSessao() {
    localStorage.removeItem('porkito_token');
    localStorage.removeItem('porkito_user');
    const isInsidePages = window.location.pathname.includes('/pages/');
    window.location.href = isInsidePages ? '../../login.html' : './login.html';
}

function verificarAutenticacao() {
    const token = getAuthToken();
    if (!token) {
        const isInsidePages = window.location.pathname.includes('/pages/');
        window.location.href = isInsidePages ? '../../login.html' : './login.html';
        return false;
    }
    return true;
}

// Wrapper para requisições autenticadas
async function authFetch(endpoint, options = {}) {
    const token = getAuthToken();
    const headers = {
        'Content-Type': 'application/json',
        ...(options.headers || {})
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            encerrarSessao();
            throw new Error('Sessão expirada. Faça login novamente.');
        }

        if (response.status === 204) {
            return null;
        }

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.erro || data.message || `Erro ${response.status}: Falha na requisição`);
        }

        return data;
    } catch (error) {
        console.error(`Erro na requisição ${endpoint}:`, error);
        throw error;
    }
}

// Funções de API
const API = {
    // Autenticação
    async login(email, senha) {
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.erro || 'Falha ao realizar login. Verifique suas credenciais.');
        }
        salvarAutenticacao(data);
        return data;
    },

    async cadastrar(nome, email, senha) {
        const response = await fetch(`${API_BASE_URL}/usuarios`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha })
        });
        const data = await response.json();
        if (!response.ok) {
            throw new Error(data.erro || 'Falha ao cadastrar usuário.');
        }
        return data;
    },

    // Movimentações (substituiu Gastos)
    async getMovimentacoes() {
        return await authFetch('/movimentacoes');
    },

    async getMovimentacaoPorId(id) {
        return await authFetch(`/movimentacoes/${id}`);
    },

    async criarMovimentacao(movimentacao) {
        return await authFetch('/movimentacoes', {
            method: 'POST',
            body: JSON.stringify(movimentacao)
        });
    },

    async editarMovimentacao(id, movimentacao) {
        return await authFetch(`/movimentacoes/${id}`, {
            method: 'PUT',
            body: JSON.stringify(movimentacao)
        });
    },

    async excluirMovimentacao(id) {
        return await authFetch(`/movimentacoes/${id}`, {
            method: 'DELETE'
        });
    },

    // Categorias
    async getCategorias() {
        return await authFetch('/categorias');
    },

    async criarCategoria(nome) {
        return await authFetch('/categorias', {
            method: 'POST',
            body: JSON.stringify({ nome })
        });
    },

    async excluirCategoria(id) {
        return await authFetch(`/categorias/${id}`, {
            method: 'DELETE'
        });
    }
};

// Formatação monetária e de datas
function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
}

function formatarData(dataStr) {
    if (!dataStr) return '';
    const [ano, mes, dia] = dataStr.split('-');
    return `${dia}/${mes}/${ano}`;
}
