// =============================================================================
// auth.js — Gerenciamento de sessão com Supabase Auth
// SGE · CELINPB — GitHub Pages
// =============================================================================
// MUDANÇAS EM RELAÇÃO À VERSÃO ANTERIOR (Apps Script):
//   • Token JWT gerenciado pelo Supabase Auth (não mais pelo CacheService)
//   • Sessão persiste automaticamente via Supabase JS SDK
//   • Sem sliding window manual — JWT tem expiração fixa renovada pelo SDK
//   • Cronômetro de sessão mantido para UX (contador regressivo no header)
//   • Dados do perfil SGE (papel, nome, external_id) carregados da tabela usuarios
// =============================================================================

var Auth = (function () {
  var CHAVE_USUARIO  = 'sge_usuario';   // perfil SGE do usuário logado
  var CHAVE_DURACAO  = 'sge_sessao_duracao_seg';
  var CHAVE_EXPIRA   = 'sge_sessao_expira_em';
  var SESSAO_MINUTOS = 120; // duração padrão exibida no contador (2h)

  return {

    // ── Salvar perfil SGE após login ────────────────────────────────────────
    salvar: function (usuario) {
      try {
        localStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
        this.definirDuracao(SESSAO_MINUTOS * 60);
      } catch (e) {
        console.error('Auth.salvar erro:', e);
      }
    },

    // ── Retorna o perfil SGE salvo (papel, nome, id, etc.) ─────────────────
    getUsuario: function () {
      try {
        var json = localStorage.getItem(CHAVE_USUARIO);
        return json ? JSON.parse(json) : null;
      } catch (e) {
        return null;
      }
    },

    // ── Retorna o papel do usuário logado ───────────────────────────────────
    getPapel: function () {
      var u = this.getUsuario();
      return u ? u.papel : null;
    },

    // ── Verifica se há sessão Supabase ativa ────────────────────────────────
    // Assíncrono — usa o SDK para verificar o JWT atual
    temSessao: async function () {
      try {
        var sb = window._supabase;
        if (!sb) return false;
        var res = await sb.auth.getSession();
        return !!(res.data && res.data.session);
      } catch (e) {
        return false;
      }
    },

    // ── Limpa sessão local (logout) ─────────────────────────────────────────
    limpar: function () {
      try {
        localStorage.removeItem(CHAVE_USUARIO);
        localStorage.removeItem(CHAVE_DURACAO);
        localStorage.removeItem(CHAVE_EXPIRA);
      } catch (e) {}
    },

    // ── Cronômetro de sessão (UX — contador regressivo no header) ───────────
    definirDuracao: function (segundos) {
      if (!segundos || segundos <= 0) return;
      try {
        localStorage.setItem(CHAVE_DURACAO, String(segundos));
      } catch (e) {}
      this.renovar();
    },

    renovar: function () {
      try {
        var duracao = Number(localStorage.getItem(CHAVE_DURACAO));
        if (!duracao || duracao <= 0) return;
        localStorage.setItem(CHAVE_EXPIRA, String(Date.now() + duracao * 1000));
      } catch (e) {}
    },

    getSegundosRestantes: function () {
      try {
        var expiraEm = Number(localStorage.getItem(CHAVE_EXPIRA));
        if (!expiraEm) return null;
        var restante = Math.round((expiraEm - Date.now()) / 1000);
        return restante > 0 ? restante : 0;
      } catch (e) {
        return null;
      }
    },
  };
}());
