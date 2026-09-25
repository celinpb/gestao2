// =============================================================================
// api.js — Comunicação com o Supabase (substitui Apps Script)
// SGE · CELINPB — GitHub Pages
// =============================================================================
// MUDANÇAS EM RELAÇÃO À VERSÃO ANTERIOR:
//   • Sem URL do Apps Script — chamadas diretas ao Supabase JS SDK
//   • Autenticação via Supabase Auth (email + senha) em vez de token manual
//   • Permissões aplicadas pelo RLS do banco — não mais pelo M3_Permissoes.gs
//   • Formato de resposta mantido: { sucesso, dados, mensagem } para
//     compatibilidade com todos os módulos HTML existentes (f2 a f9)
//   • Função postApi() mantida como wrapper para facilitar migração gradual
//     de cada módulo HTML sem reescrever tudo de uma vez
// =============================================================================

// ── Configuração do Supabase ─────────────────────────────────────────────────
var SUPABASE_URL  = 'https://kolomiisespdgaoukvbj.supabase.co';
var SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtvbG9taWlzZXNwZGdhb3VrdmJqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODkxNDEyMTQsImV4cCI6MjEwNDcxNzIxNH0.CTCd_cdbubaQ6ei2tf-tqeokpPfVW9Qft7BfHI6yB34';

// Inicializar cliente Supabase (SDK carregado via CDN no index.html)
// window._supabase é o cliente global acessível por todos os módulos
function _initSupabase() {
  if (!window._supabase) {
    window._supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON, {
      auth: {
        persistSession:    true,
        autoRefreshToken:  true,
        detectSessionInUrl: false,
      }
    });
  }
  return window._supabase;
}

// ── Resposta padronizada (compatível com formato anterior do Apps Script) ────
function _ok(dados, mensagem) {
  Auth.renovar();
  return { sucesso: true,  dados: dados || null, mensagem: mensagem || '' };
}
function _err(mensagem, codigo) {
  return { sucesso: false, dados: null, mensagem: mensagem || 'Erro desconhecido', codigo: codigo || 500 };
}

// =============================================================================
// postApi() — wrapper principal (mantém assinatura idêntica ao sistema anterior)
// Todos os módulos HTML chamam postApi(acao, dados) e recebem { sucesso, dados, mensagem }
// =============================================================================
async function postApi(acao, dados) {
  try {
    var sb = _initSupabase();
    dados = dados || {};

    // ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────
    if (acao === 'auth.login') {
      return await _login(sb, dados);
    }
    if (acao === 'auth.logout') {
      return await _logout(sb);
    }
    if (acao === 'auth.verificarSessao') {
      return await _verificarSessao(sb);
    }
    if (acao === 'auth.definirNovaSenha') {
      return await _definirNovaSenha(sb, dados);
    }

    // ── VERIFICAR SESSÃO ANTES DE QUALQUER OPERAÇÃO ───────────────────────────
    var sessao = await sb.auth.getSession();
    if (!sessao.data || !sessao.data.session) {
      return _err('Sessão expirada. Faça login novamente.', 401);
    }

    // ── USUÁRIOS ──────────────────────────────────────────────────────────────
    if (acao === 'usuarios.listar')     return await _usuariosListar(sb, dados);
    if (acao === 'usuarios.criar')      return await _usuariosCriar(sb, dados);
    if (acao === 'usuarios.atualizar')  return await _usuariosAtualizar(sb, dados);
    if (acao === 'usuarios.inativar')   return await _usuariosInativar(sb, dados);
    if (acao === 'usuarios.deletar')    return await _usuariosDeletar(sb, dados);
    if (acao === 'usuarios.redefinirSenha') return await _usuariosRedefinirSenha(sb, dados);

    // ── ALUNOS ────────────────────────────────────────────────────────────────
    if (acao === 'alunos.listar')    return await _alunosListar(sb, dados);
    if (acao === 'alunos.buscar')    return await _alunosBuscar(sb, dados);
    if (acao === 'alunos.criar')     return await _alunosCriar(sb, dados);
    if (acao === 'alunos.atualizar') return await _alunosAtualizar(sb, dados);
    if (acao === 'alunos.inativar')  return await _alunosInativar(sb, dados);
    if (acao === 'alunos.ativar')    return await _alunosAtivar(sb, dados);
    if (acao === 'alunos.inativarAluno') return await _alunosInativar(sb, dados);
    if (acao === 'alunos.ativarAluno')   return await _alunosAtivar(sb, dados);
    if (acao === 'alunos.buscarSensiveis') return await _alunosSensiveisBuscar(sb, dados);

    // ── CURSOS ────────────────────────────────────────────────────────────────
    if (acao === 'cursos.listar')    return await _cursosListar(sb, dados);
    if (acao === 'cursos.criar')     return await _cursosCriar(sb, dados);
    if (acao === 'cursos.atualizar') return await _cursosAtualizar(sb, dados);

    // ── AVALIAÇÕES ────────────────────────────────────────────────────────────
    if (acao === 'avaliacoes.listar')    return await _avaliacoesListar(sb);
    if (acao === 'avaliacoes.criar')     return await _avaliacoesCriar(sb, dados);
    if (acao === 'avaliacoes.atualizar') return await _avaliacoesAtualizar(sb, dados);

    // ── SEMESTRES ─────────────────────────────────────────────────────────────
    if (acao === 'semestres.listar')     return await _semestresListar(sb);
    if (acao === 'semestres.registrar')  return await _semestresRegistrar(sb, dados);
    if (acao === 'semestres.atualizar')  return await _semestresAtualizar(sb, dados);
    if (acao === 'semestres.getAtual')   return await _semestresGetAtual(sb);

    // ── CALENDÁRIO LETIVO ─────────────────────────────────────────────────────
    if (acao === 'calendario.listar')  return await _calendarioListar(sb, dados);
    if (acao === 'calendario.salvar')  return await _calendarioSalvar(sb, dados);

    // ── TURMAS ────────────────────────────────────────────────────────────────
    if (acao === 'turmas.listar')    return await _turmasListar(sb, dados);
    if (acao === 'turmas.criar')     return await _turmasCriar(sb, dados);
    if (acao === 'turmas.atualizar') return await _turmasAtualizar(sb, dados);

    // ── MATRÍCULAS ────────────────────────────────────────────────────────────
    if (acao === 'matriculas.listar')            return await _matriculasListar(sb, dados);
    if (acao === 'matriculas.criar')             return await _matriculasCriar(sb, dados);
    if (acao === 'matriculas.atualizarSituacao') return await _matriculasAtualizarSituacao(sb, dados);
    if (acao === 'matriculas.transferir')        return await _matriculasTransferir(sb, dados);

    // ── FREQUÊNCIAS ───────────────────────────────────────────────────────────
    if (acao === 'frequencias.listar')   return await _frequenciasListar(sb, dados);
    if (acao === 'frequencias.salvar')   return await _frequenciasSalvar(sb, dados);

    // ── CONTEÚDO ──────────────────────────────────────────────────────────────
    if (acao === 'conteudo.listar')  return await _conteudoListar(sb, dados);
    if (acao === 'conteudo.salvar')  return await _conteudoSalvar(sb, dados);

    // ── NOTAS ─────────────────────────────────────────────────────────────────
    if (acao === 'notas.listar')  return await _notasListar(sb, dados);
    if (acao === 'notas.salvar')  return await _notasSalvar(sb, dados);

    // ── OCORRÊNCIAS ───────────────────────────────────────────────────────────
    if (acao === 'ocorrencias.listar')   return await _ocorrenciasListar(sb, dados);
    if (acao === 'ocorrencias.criar')    return await _ocorrenciasCriar(sb, dados);
    if (acao === 'ocorrencias.responder') return await _ocorrenciasResponder(sb, dados);
    if (acao === 'ocorrencias.resolverStatus') return await _ocorrenciasResolverStatus(sb, dados);

    // ── CONFIG ────────────────────────────────────────────────────────────────
    if (acao === 'config.get')   return await _configGet(sb);
    if (acao === 'config.salvar') return await _configSalvar(sb, dados);

    // ── PÚBLICO-ALVO (tipos) ──────────────────────────────────────────────────
    if (acao === 'publicoAlvo.listar') return await _publicoAlvoListar(sb, dados);
    if (acao === 'publicoAlvo.salvar') return await _publicoAlvoSalvar(sb, dados);

    // ── RELATÓRIOS ────────────────────────────────────────────────────────────
    // ── COMENTÁRIOS ───────────────────────────────────────────────────────────
    if (acao === 'comentarios.listar') return await _comentariosListar(sb, dados);
    if (acao === 'comentarios.salvar') return await _comentariosSalvar(sb, dados);

    if (acao === 'relatorios.frequencia')  return await _relatoriosFrequencia(sb, dados);
    if (acao === 'relatorios.boletim')     return await _relatoriosBoletim(sb, dados);

    // ── ALIASES DE COMPATIBILIDADE (ações do sistema Apps Script) ───────────────
    if (acao === 'sistema.semestreAtual') return await _semestresGetAtual(sb);
    if (acao === 'sistema.config')        return await _configGet(sb);
    if (acao === 'sistema.menu')          return _ok([]);

    // ── ALIASES OCORRÊNCIAS ────────────────────────────────────────────────────
    if (acao === 'ocorrencias.listarRespostas')      return await _ocorrenciasListarRespostas(sb, dados);
    if (acao === 'ocorrencias.adicionarResposta')    return await _ocorrenciasResponder(sb, dados);
    if (acao === 'ocorrencias.atualizarStatus')      return await _ocorrenciasResolverStatus(sb, Object.assign({}, dados, { id: dados.ocorrenciaId, status: dados.novoStatus }));
    if (acao === 'ocorrencias.excluir')              return await _ocorrenciasExcluir(sb, dados);
    if (acao === 'ocorrencias.professoresDasTurmas') return await _ocorrenciasProfessoresDasTurmas(sb, dados);
    if (acao === 'ocorrencias.turmasAtivasDoAluno')  return await _ocorrenciasTurmasAtivasDoAluno(sb, dados);

    // ── ALIASES ALUNOS ────────────────────────────────────────────────────────
    if (acao === 'alunos.inativarCadastro') return await _alunosInativar(sb, Object.assign({}, dados, { id: dados.alunoId }));
    if (acao === 'alunos.ativarCadastro')   return await _alunosAtivar(sb, Object.assign({}, dados, { id: dados.alunoId }));
    if (acao === 'alunos.atualizar')        return await _alunosAtualizar(sb, Object.assign({}, dados, { id: dados.alunoId || dados.id }));

    return _err('Ação desconhecida: ' + acao, 404);

  } catch (e) {
    console.error('postApi erro [' + acao + ']:', e);
    return _err(e.message || 'Erro interno', 500);
  }
}

// =============================================================================
// AUTENTICAÇÃO
// =============================================================================

async function _login(sb, dados) {
  // Aceita tanto { email, senha } quanto { loginOuEmail, senha } (compatibilidade com f2-login.html)
  var emailOuLogin = dados.email || dados.loginOuEmail || '';
  var senha = dados.senha || '';
  if (!emailOuLogin || !senha) {
    return _err('E-mail e senha são obrigatórios.', 400);
  }

  // Se não parece ser e-mail, buscar e-mail pelo campo login na tabela usuarios
  var emailFinal = emailOuLogin;
  if (!emailOuLogin.includes('@')) {
    // Antes do login não existe sessão (chamada como anon) — a tabela
    // `usuarios` está travada para admin/coordenação, então essa resolução
    // login→e-mail passa por uma function SECURITY DEFINER dedicada, que só
    // devolve o e-mail (nunca o restante do cadastro) de uma conta ativa.
    var busca = await sb.rpc('login_para_email', { login_busca: emailOuLogin });
    if (busca.error || !busca.data) {
      return _err('Usuário não encontrado.', 401);
    }
    emailFinal = busca.data;
  }

  var res = await sb.auth.signInWithPassword({
    email:    emailFinal,
    password: senha,
  });
  if (res.error) {
    // Supabase retorna mensagem em inglês — traduzir as mais comuns
    var msg = res.error.message || '';
    if (msg.includes('Invalid login') || msg.includes('invalid_credentials')) {
      return _err('E-mail ou senha incorretos.', 401);
    }
    if (msg.includes('Email not confirmed')) {
      return _err('Conta ainda não confirmada. Verifique seu e-mail.', 401);
    }
    return _err(msg, 401);
  }

  // Buscar perfil SGE do usuário na tabela usuarios
  var perfil = await sb
    .from('usuarios')
    .select('id, external_id, login, nome, email, papel, situacao_ativo')
    .eq('auth_user_id', res.data.user.id)
    .single();

  if (perfil.error || !perfil.data) {
    await sb.auth.signOut();
    return _err('Usuário não encontrado no sistema. Contate o administrador.', 403);
  }
  if (!perfil.data.situacao_ativo) {
    await sb.auth.signOut();
    return _err('Usuário inativo. Contate o administrador.', 403);
  }

  Auth.salvar(perfil.data);
  return _ok({
    usuario:          perfil.data,
    primeiroacesso:   false, // Supabase Auth gerencia reset de senha via email
    duracaoSegundos:  7200,
  }, 'Login realizado com sucesso.');
}

async function _logout(sb) {
  await sb.auth.signOut();
  Auth.limpar();
  return _ok(null, 'Logout realizado.');
}

async function _verificarSessao(sb) {
  var res = await sb.auth.getSession();
  if (!res.data || !res.data.session) {
    return _err('Sessão inválida ou expirada.', 401);
  }
  var usuario = Auth.getUsuario();
  if (!usuario) {
    // Sessão existe mas perfil local foi limpo — recarregar da tabela
    var perfil = await sb
      .from('usuarios')
      .select('id, external_id, login, nome, email, papel, situacao_ativo')
      .eq('auth_user_id', res.data.session.user.id)
      .single();
    if (perfil.error || !perfil.data) return _err('Perfil não encontrado.', 403);
    Auth.salvar(perfil.data);
    usuario = perfil.data;
  }
  return _ok({ usuario: usuario, duracaoSegundos: 7200 });
}

async function _definirNovaSenha(sb, dados) {
  if (!dados.novaSenha) return _err('Nova senha é obrigatória.', 400);
  var res = await sb.auth.updateUser({ password: dados.novaSenha });
  if (res.error) return _err(res.error.message, 400);
  return _ok(null, 'Senha atualizada com sucesso.');
}

// =============================================================================
// USUÁRIOS
// =============================================================================

async function _usuariosListar(sb) {
  var res = await sb
    .from('usuarios')
    .select('id, external_id, login, nome, email, papel, situacao_ativo, criado_em')
    .order('nome');
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _usuariosCriar(sb, dados) {
  if (!dados.email || !dados.nome || !dados.papel) {
    return _err('Nome, e-mail e papel são obrigatórios.', 400);
  }
  // Criar conta no Supabase Auth via convite (envia e-mail ao usuário)
  var invite = await sb.auth.admin.inviteUserByEmail(dados.email);
  if (invite.error) return _err(invite.error.message);

  var res = await sb.from('usuarios').insert({
    auth_user_id:   invite.data.user.id,
    login:          dados.login || dados.email,
    nome:           dados.nome,
    email:          dados.email,
    papel:          dados.papel,
    situacao_ativo: true,
  }).select().single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data, 'Usuário criado. Convite enviado para ' + dados.email);
}

async function _usuariosAtualizar(sb, dados) {
  if (!dados.id) return _err('ID do usuário é obrigatório.', 400);
  var campos = {};
  if (dados.nome)  campos.nome  = dados.nome;
  if (dados.papel) campos.papel = dados.papel;
  if (dados.email) campos.email = dados.email;
  if (dados.login) campos.login = dados.login;
  var res = await sb.from('usuarios').update(campos).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Usuário atualizado.');
}

async function _usuariosInativar(sb, dados) {
  if (!dados.id) return _err('ID do usuário é obrigatório.', 400);
  var res = await sb.from('usuarios').update({ situacao_ativo: false }).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Usuário inativado.');
}

async function _usuariosDeletar(sb, dados) {
  if (!dados.id) return _err('ID do usuário é obrigatório.', 400);
  var res = await sb.from('usuarios').delete().eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Usuário removido.');
}

async function _usuariosRedefinirSenha(sb, dados) {
  if (!dados.email) return _err('E-mail é obrigatório.', 400);
  var res = await sb.auth.resetPasswordForEmail(dados.email);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'E-mail de redefinição enviado para ' + dados.email);
}

// -----------------------------------------------------------------------------
// _nomesPublicos() — resolve nomes de usuários via a view `usuarios_publico`
// (id, nome, external_id), que qualquer autenticado pode ler mesmo com a
// tabela `usuarios` travada para admin/coordenação. Usada em todo lugar que
// antes fazia join direto com `usuarios!fk(nome)` — esse join deixou de
// funcionar para professor/secretaria depois que a leitura de `usuarios` foi
// restrita (etapa 4 do plano de migração — revisão de RLS por papel).
// -----------------------------------------------------------------------------
async function _nomesPublicos(sb, ids) {
  var unicos = (ids || []).filter(function(v) { return !!v; })
    .filter(function(v, i, arr) { return arr.indexOf(v) === i; });
  if (!unicos.length) return {};
  // `usuarios_publico` é uma function (não uma view — o Supabase Advisor
  // bloqueia views SECURITY DEFINER), então a chamada é via rpc().
  var res = await sb.rpc('usuarios_publico', { ids: unicos });
  if (res.error) {
    console.error('_nomesPublicos erro:', res.error);
    return {};
  }
  var mapa = {};
  (res.data || []).forEach(function(u) { mapa[u.id] = u; });
  return mapa;
}

// =============================================================================
// ALUNOS
// =============================================================================

async function _alunosListar(sb, dados) {
  dados = dados || {};
  var pagina = parseInt(dados.pagina, 10) || 1;
  var tamanhoPagina = parseInt(dados.tamanhoPagina, 10) || 20;
  var de = (pagina - 1) * tamanhoPagina;
  var ate = de + tamanhoPagina - 1;

  var query = sb.from('alunos')
    .select('id, external_id, nome_completo, nome_social, nascimento, nascimento_uf, nascimento_municipio, genero, raca, estado_civil, estrangeiro, telefone, email, municipio, uf, bairro, pcd, pcd_tipo, situacao_ativo, inscricao_data_hora', { count: 'exact' })
    .order('nome_completo');
  if (dados.somenteAtivos) query = query.eq('situacao_ativo', true);
  if (dados.busca) query = query.or('nome_completo.ilike.%' + dados.busca + '%,nome_social.ilike.%' + dados.busca + '%');
  query = query.range(de, ate);

  var res = await query;
  if (res.error) return _err(res.error.message);
  var totalRegistros = typeof res.count === 'number' ? res.count : (res.data || []).length;
  var totalPaginas = Math.max(1, Math.ceil(totalRegistros / tamanhoPagina));
  return _ok({ dados: res.data || [], totalRegistros: totalRegistros, totalPaginas: totalPaginas });
}

// Normaliza um registro de aluno do banco (snake_case) para o formato dos módulos HTML (PascalCase)
function _normalizarAluno(a) {
  if (!a) return a;
  var nomeSocial = a.nome_social || '';
  var nomeExibicao = nomeSocial || a.nome_completo || '';
  return {
    // IDs
    AlunoID:            a.external_id || a.id,
    id:                 a.id,
    external_id:        a.external_id,
    // Nomes
    NomeCompleto:       a.nome_completo || '',
    NomeSocial:         nomeSocial,
    NomeSocialBoolean:  !!nomeSocial,
    NomeExibicao:       nomeExibicao,
    // Dados pessoais
    Nascimento:         a.nascimento || '',
    NascimentoUF:       a.nascimento_uf || '',
    NascimentoMunicipio: a.nascimento_municipio || '',
    Genero:             a.genero || '',
    Raca:               a.raca || '',
    EstadoCivil:        a.estado_civil || '',
    Estrangeiro:        a.estrangeiro || false,
    // Contato
    Telefone:           a.telefone || '',
    email:              a.email || '',
    // Endereço
    Municipio:          a.municipio || '',
    UF:                 a.uf || '',
    Bairro:             a.bairro || '',
    // PcD
    PcDBoolean:         a.pcd || false,
    PcDTipo:            a.pcd_tipo || '',
    // Situação
    SituacaoAluno:      a.situacao_ativo !== false,
    InscricaoDataHora:  a.inscricao_data_hora || '',
    // snake_case também (para compatibilidade futura)
    nome_completo:      a.nome_completo,
    nome_social:        a.nome_social,
    situacao_ativo:     a.situacao_ativo,
    pcd:                a.pcd,
    pcd_tipo:           a.pcd_tipo,
  };
}

async function _alunosBuscar(sb, dados) {
  if (!dados.termo) return _err('Termo de busca é obrigatório.', 400);
  var res = await sb.from('alunos')
    .select('id, external_id, nome_completo, nome_social, telefone, email, municipio, uf, bairro, pcd, pcd_tipo, situacao_ativo, nascimento, nascimento_uf, nascimento_municipio, genero, raca, estado_civil, estrangeiro, inscricao_data_hora')
    .or('nome_completo.ilike.%' + dados.termo + '%,nome_social.ilike.%' + dados.termo + '%')
    .order('nome_completo')
    .limit(100);
  if (res.error) return _err(res.error.message);
  return _ok(res.data || []);
}

async function _alunosCriar(sb, dados) {
  if (!dados.nome_completo) return _err('Nome completo é obrigatório.', 400);
  // Separar campos sensíveis dos campos públicos
  var camposPublicos = {
    nome_completo:        dados.nome_completo,
    nome_social:          dados.nome_social || null,
    nascimento:           dados.nascimento || null,
    nascimento_uf:        dados.nascimento_uf || null,
    nascimento_municipio: dados.nascimento_municipio || null,
    genero:               dados.genero || null,
    raca:                 dados.raca || null,
    estado_civil:         dados.estado_civil || null,
    estrangeiro:          dados.estrangeiro || false,
    telefone:             dados.telefone || null,
    email:                dados.email || null,
    municipio:            dados.municipio || null,
    uf:                   dados.uf || null,
    bairro:               dados.bairro || null,
    pcd:                  dados.pcd || false,
    pcd_tipo:             dados.pcd_tipo || null,
    situacao_ativo:       true,
  };
  var res = await sb.from('alunos').insert(camposPublicos).select().single();
  if (res.error) return _err(res.error.message);

  // Inserir dados sensíveis via Edge Function (alunos-sensiveis)
  var avisoSensiveis = '';
  var temCamposSensiveis = dados.cpf_ou_cin || dados.cep || dados.endereco || dados.pcd_laudo_url ||
    dados.menor || dados.responsavel1_nome || dados.publico_alvo || dados.povo_tradicional;
  if (temCamposSensiveis) {
    var resSens = await _salvarSensiveis(sb, res.data.id, dados);
    if (!resSens.sucesso) {
      avisoSensiveis = ' Atenção: dados sensíveis (CPF/endereço/responsável) NÃO foram salvos — ' + resSens.mensagem;
    }
  }
  return _ok(res.data, 'Aluno cadastrado com sucesso.' + avisoSensiveis);
}

async function _alunosAtualizar(sb, dados) {
  if (!dados.id) return _err('ID do aluno é obrigatório.', 400);
  var camposPublicos = {};
  var camposSensiveis = {};
  var publicosKeys = ['nome_completo','nome_social','nascimento','nascimento_uf',
    'nascimento_municipio','genero','raca','estado_civil','estrangeiro',
    'telefone','email','municipio','uf','bairro','pcd','pcd_tipo'];
  var sensiveisKeys = ['cpf_ou_cin','passaporte','cep','endereco','numero',
    'complemento','pcd_laudo_url','povo_tradicional','povo_tradicional_nome',
    'menor','responsavel1_nome','responsavel1_telefone','responsavel1_email',
    'responsavel1_parentesco','responsavel2_nome','responsavel2_parentesco',
    'responsavel2_telefone','publico_alvo','publico_comprovante_url'];
  publicosKeys.forEach(function(k) { if (k in dados) camposPublicos[k] = dados[k]; });
  sensiveisKeys.forEach(function(k) { if (k in dados) camposSensiveis[k] = dados[k]; });

  if (Object.keys(camposPublicos).length > 0) {
    var res = await sb.from('alunos').update(camposPublicos).eq('id', dados.id);
    if (res.error) return _err(res.error.message);
  }
  if (Object.keys(camposSensiveis).length > 0) {
    var resSens = await _salvarSensiveis(sb, dados.id, camposSensiveis);
    if (!resSens.sucesso) {
      return _err('Aluno atualizado, mas os dados sensíveis (CPF/endereço/responsável) NÃO foram salvos: ' + resSens.mensagem);
    }
  }
  return _ok(null, 'Aluno atualizado.');
}

async function _alunosInativar(sb, dados) {
  if (!dados.id) return _err('ID é obrigatório.', 400);
  var res = await sb.from('alunos').update({ situacao_ativo: false }).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Aluno inativado.');
}

async function _alunosAtivar(sb, dados) {
  if (!dados.id) return _err('ID é obrigatório.', 400);
  var res = await sb.from('alunos').update({ situacao_ativo: true }).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Aluno reativado.');
}

// Salvar dados sensíveis via Edge Function `alunos-sensiveis` (service_role
// no servidor, RLS de alunos_sensiveis continua bloqueando tudo no cliente).
// Retorna sempre { sucesso, mensagem } — nunca lança.
async function _salvarSensiveis(sb, alunoId, dados) {
  try {
    var res = await sb.functions.invoke('alunos-sensiveis', {
      body: { acao: 'salvar', aluno_id: alunoId, dados: dados },
    });
    if (res.error) {
      console.error('_salvarSensiveis erro:', res.error);
      return { sucesso: false, mensagem: res.error.message || 'Erro ao chamar a Edge Function.' };
    }
    if (res.data && res.data.sucesso === false) {
      return { sucesso: false, mensagem: res.data.mensagem || 'Falha ao salvar dados sensíveis.' };
    }
    return { sucesso: true };
  } catch (e) {
    console.error('_salvarSensiveis exceção:', e);
    return { sucesso: false, mensagem: e.message || 'Erro ao salvar dados sensíveis.' };
  }
}

// Buscar dados sensíveis via Edge Function `alunos-sensiveis`.
// Só retorna dados se o papel do usuário logado tiver permissão
// (checado no próprio servidor da Edge Function).
async function _alunosSensiveisBuscar(sb, dados) {
  if (!dados.aluno_id) return _err('aluno_id é obrigatório.', 400);
  try {
    var res = await sb.functions.invoke('alunos-sensiveis', {
      body: { acao: 'buscar', aluno_id: dados.aluno_id },
    });
    if (res.error) {
      return _err(res.error.message || 'Erro ao buscar dados sensíveis.', 500);
    }
    if (res.data && res.data.sucesso === false) {
      return _err(res.data.mensagem || 'Sem permissão para ver dados sensíveis.', 403);
    }
    return _ok((res.data && res.data.dados) || {});
  } catch (e) {
    return _err(e.message || 'Erro ao buscar dados sensíveis.', 500);
  }
}

// =============================================================================
// CURSOS
// =============================================================================

async function _cursosListar(sb, dados) {
  var query = sb.from('cursos')
    .select('id, external_id, nome, sigla, idade_minima_meses, idade_maxima_meses, ativo, idioma_id, idiomas(id, nome), curso_avaliacoes(avaliacao_id, ordem)')
    .order('sigla');
  if (dados && dados.idioma) {
    query = query.eq('idiomas.nome', dados.idioma);
  }
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _cursosCriar(sb, dados) {
  if (!dados.nome || !dados.sigla || !dados.idioma_id) {
    return _err('Nome, sigla e idioma são obrigatórios.', 400);
  }
  var res = await sb.from('cursos').insert(dados).select().single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data, 'Curso criado.');
}

async function _cursosAtualizar(sb, dados) {
  if (!dados.id) return _err('ID é obrigatório.', 400);
  var res = await sb.from('cursos').update(dados).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Curso atualizado.');
}

// =============================================================================
// AVALIAÇÕES
// =============================================================================

async function _avaliacoesListar(sb) {
  var res = await sb.from('avaliacoes').select('*').order('componente_nota');
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _avaliacoesCriar(sb, dados) {
  var res = await sb.from('avaliacoes').insert(dados).select().single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data, 'Avaliação criada.');
}

async function _avaliacoesAtualizar(sb, dados) {
  if (!dados.id) return _err('ID é obrigatório.', 400);
  var res = await sb.from('avaliacoes').update(dados).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Avaliação atualizada.');
}

// =============================================================================
// SEMESTRES
// =============================================================================

async function _semestresListar(sb) {
  var res = await sb.from('semestres').select('*').order('criado_em', { ascending: false });
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _semestresGetAtual(sb) {
  var res = await sb.from('semestres').select('*').eq('semestre_atual', true).single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _semestresRegistrar(sb, dados) {
  if (!dados.rotulo) return _err('Rótulo do semestre é obrigatório.', 400);
  // Se for marcar como atual, desmarcar o anterior
  if (dados.semestre_atual) {
    await sb.from('semestres').update({ semestre_atual: false }).eq('semestre_atual', true);
  }
  var res = await sb.from('semestres').insert(dados).select().single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data, 'Semestre registrado.');
}

async function _semestresAtualizar(sb, dados) {
  if (!dados.id) return _err('ID é obrigatório.', 400);
  if (dados.semestre_atual) {
    await sb.from('semestres').update({ semestre_atual: false }).eq('semestre_atual', true);
  }
  var res = await sb.from('semestres').update(dados).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Semestre atualizado.');
}

// =============================================================================
// CALENDÁRIO LETIVO
// =============================================================================
// Tabela `calendario` (schema Supabase): id, semestre_id, data_aula, tipo
// ('LETIVO'/'NAO_LETIVO'), descricao (motivo — feriado, ponto facultativo,
// "Aulas ONLINE" etc., pode acompanhar tanto dias letivos quanto não
// letivos), criado_em. A tabela já existia no schema mas nunca tinha sido
// populada nem exposta aqui — o calendário letivo do Apps Script nunca foi
// migrado (ver claude/technical-learnings.md e claude/etapa6-calendario-letivo.sql
// para a importação dos dados do semestre atual).
// -----------------------------------------------------------------------------

async function _calendarioListar(sb, dados) {
  var query = sb.from('calendario').select('*').order('data_aula');
  if (dados && dados.semestre_id) query = query.eq('semestre_id', dados.semestre_id);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _calendarioSalvar(sb, dados) {
  // dados.registros = [{ semestre_id, data_aula, tipo, descricao }, ...]
  // Upsert por (semestre_id, data_aula) — permite tanto a importação inicial
  // em lote quanto reenviar/corrigir um dia específico depois, sem duplicar
  // linha. Exige a constraint única criada em
  // claude/etapa6-calendario-letivo.sql.
  if (!dados.registros || !dados.registros.length) return _err('Nenhum registro enviado.', 400);
  var res = await sb.from('calendario').upsert(dados.registros, { onConflict: 'semestre_id,data_aula' });
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Calendário salvo.');
}

// =============================================================================
// TURMAS
// =============================================================================

async function _turmasListar(sb, dados) {
  var query = sb.from('turmas')
    .select('*, semestres(rotulo), cursos(nome, sigla, external_id)')
    .order('external_id');
  if (dados && dados.semestre_id) query = query.eq('semestre_id', dados.semestre_id);
  if (dados && dados.professor_id) query = query.eq('professor_id', dados.professor_id);
  if (dados && dados.situacao)     query = query.eq('situacao', dados.situacao);
  var res = await query;
  if (res.error) return _err(res.error.message);
  var linhas = res.data || [];
  // O join direto com `usuarios` não é mais possível para professor/secretaria
  // (tabela travada a admin/coordenação) — nome do professor vem da view pública.
  var mapaNomes = await _nomesPublicos(sb, linhas.map(function(t) { return t.professor_id; }));
  // Vagas restantes = vagas_totais - matrículas ATIVAS na turma. Calculado
  // aqui (uma única query leve, sem embed) em vez de via view `turmas_vagas`
  // (que existe no banco mas cujas colunas não estão documentadas em lugar
  // nenhum do projeto) — usado para exibir e filtrar candidatas de
  // transferência/matrícula por vaga disponível (f5-turmas.html / f5-matriculas.html).
  var mapaVagas = await _matriculasAtivasPorTurma(sb, linhas.map(function(t) { return t.id; }));
  linhas.forEach(function(t) {
    var info = t.professor_id ? mapaNomes[t.professor_id] : null;
    t.professor = info ? { id: info.id, nome: info.nome, external_id: info.external_id } : (t.professor_id ? { id: t.professor_id, nome: '', external_id: null } : null);
    var ocupadas = mapaVagas[t.id] || 0;
    t.vagas_ocupadas = ocupadas;
    t.vagas_restantes = (typeof t.vagas_totais === 'number') ? Math.max(0, t.vagas_totais - ocupadas) : null;
  });
  return _ok(linhas);
}

// -----------------------------------------------------------------------------
// _matriculasAtivasPorTurma() — conta quantas matrículas ATIVA cada turma tem,
// para calcular vagas restantes. Usado por _turmasListar (exibição/filtro) e
// pelos checks de vaga em _matriculasCriar / _matriculasTransferir.
// -----------------------------------------------------------------------------
async function _matriculasAtivasPorTurma(sb, turmaIds) {
  var unicos = (turmaIds || []).filter(function(v) { return !!v; })
    .filter(function(v, i, arr) { return arr.indexOf(v) === i; });
  if (!unicos.length) return {};
  var res = await sb.from('matriculas').select('turma_id').eq('situacao', 'ATIVA').in('turma_id', unicos);
  if (res.error) {
    console.error('_matriculasAtivasPorTurma erro:', res.error);
    return {};
  }
  var mapa = {};
  (res.data || []).forEach(function(m) { mapa[m.turma_id] = (mapa[m.turma_id] || 0) + 1; });
  return mapa;
}

async function _turmasCriar(sb, dados) {
  if (!dados.semestre_id || !dados.curso_id || !dados.professor_id || !dados.estagio) {
    return _err('Semestre, curso, professor e estágio são obrigatórios.', 400);
  }
  var res = await sb.from('turmas').insert(dados).select().single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data, 'Turma criada.');
}

async function _turmasAtualizar(sb, dados) {
  if (!dados.id) return _err('ID é obrigatório.', 400);
  var res = await sb.from('turmas').update(dados).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Turma atualizada.');
}

// =============================================================================
// MATRÍCULAS
// =============================================================================

async function _matriculasListar(sb, dados) {
  var query = sb.from('matriculas')
    .select('*, alunos(external_id, nome_completo, nome_social, pcd), turmas!matriculas_turma_id_fkey(id, external_id, estagio, curso_id)')
    .order('data_matricula', { ascending: false, nullsFirst: false });
  if (dados && dados.turma_id)    query = query.eq('turma_id', dados.turma_id);
  if (dados && dados.aluno_id)    query = query.eq('aluno_id', dados.aluno_id);
  if (dados && dados.semestre_id) query = query.eq('semestre_id', dados.semestre_id);
  if (dados && dados.situacao)    query = query.eq('situacao', dados.situacao);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

// Papéis que podem matricular/transferir além da capacidade de vagas de uma
// turma (equivalente ao "forçar vaga" que existia em M5_Semestre.gs, nunca
// portado ao migrar para o Supabase). Secretaria e professor NUNCA podem —
// só admin/coordenação, decisão pedagógica.
var PAPEIS_PODEM_FORCAR_VAGA = ['admin', 'coordenacao'];

async function _matriculasCriar(sb, dados) {
  if (!dados.aluno_id || !dados.turma_id || !dados.semestre_id) {
    return _err('Aluno, turma e semestre são obrigatórios.', 400);
  }
  // Verificar semestre aberto
  var sem = await sb.from('semestres').select('edicao_ativa').eq('id', dados.semestre_id).single();
  if (sem.error || !sem.data.edicao_ativa) return _err('Semestre fechado para edição.', 403);

  // Checagem de vaga — espelha o comportamento antigo de m5_criarMatricula
  // (M5_Semestre.gs): sem vaga, secretaria/professor são bloqueados; admin/
  // coordenação recebem confirmacaoNecessaria e só prosseguem reenviando com
  // forcar_vaga:true.
  var checagem = await _checarVagaTurma(sb, dados.turma_id, dados.forcar_vaga);
  if (checagem) return checagem;

  var res = await sb.from('matriculas').insert({
    aluno_id:    dados.aluno_id,
    turma_id:    dados.turma_id,
    semestre_id: dados.semestre_id,
    situacao:    'ATIVA',
  }).select().single();
  if (res.error) {
    if (res.error.code === '23505') return _err('Aluno já matriculado nesta turma.', 409);
    return _err(res.error.message);
  }
  return _ok(res.data, 'Matrícula realizada.');
}

// -----------------------------------------------------------------------------
// _checarVagaTurma() — verifica se a turma de destino tem vaga disponível.
// Retorna null quando pode prosseguir (tem vaga, ou não tem mas foi forçado
// por quem pode). Retorna um objeto de resposta { sucesso:false, ... } quando
// a operação deve parar ali: bloqueio definitivo (papel sem permissão de
// forçar) ou pedido de confirmação (admin/coordenação, ainda sem forcar_vaga).
// -----------------------------------------------------------------------------
async function _checarVagaTurma(sb, turmaId, forcarVaga) {
  var turma = await sb.from('turmas').select('vagas_totais').eq('id', turmaId).single();
  if (turma.error || !turma.data || typeof turma.data.vagas_totais !== 'number') {
    return null; // turma sem vagas_totais definido — não dá para checar, segue.
  }
  var mapaVagas = await _matriculasAtivasPorTurma(sb, [turmaId]);
  var matriculasAtivas = mapaVagas[turmaId] || 0;
  var temVaga = matriculasAtivas < turma.data.vagas_totais;
  if (temVaga) return null;

  var usuario = Auth.getUsuario();
  var papel = usuario ? usuario.papel : '';
  var podeForcar = PAPEIS_PODEM_FORCAR_VAGA.indexOf(papel) !== -1;

  if (!podeForcar) {
    return _err('Turma sem vagas disponíveis (' + matriculasAtivas + '/' + turma.data.vagas_totais + ').', 409);
  }
  if (!forcarVaga) {
    return {
      sucesso: false,
      dados: {
        confirmacaoNecessaria: true,
        vagasTotais:      turma.data.vagas_totais,
        matriculasAtivas: matriculasAtivas,
      },
      mensagem: 'Turma sem vagas disponíveis (' + matriculasAtivas + '/' + turma.data.vagas_totais + '). Confirme para prosseguir mesmo assim.',
      codigo: 409,
    };
  }
  return null; // forcarVaga === true e o papel pode — segue com a operação.
}

async function _matriculasAtualizarSituacao(sb, dados) {
  if (!dados.id || !dados.situacao) return _err('ID e situação são obrigatórios.', 400);
  var campos = { situacao: dados.situacao };
  if (dados.motivo_cancelamento) campos.motivo_cancelamento = dados.motivo_cancelamento;
  if (dados.situacao === 'CANCELADA') campos.data_cancelamento = new Date().toISOString();

  // Buscar a matrícula ANTES de atualizar — a cascata de inativação do aluno
  // (abaixo) só se aplica quando ela estava ATIVA antes deste cancelamento
  // (cancelar uma matrícula já TRANCADA/CONCLUIDA não deve disparar nada).
  var atual = await sb.from('matriculas').select('id, aluno_id, semestre_id, situacao').eq('id', dados.id).single();
  if (atual.error || !atual.data) return _err('Matrícula não encontrada.', 404);

  var res = await sb.from('matriculas').update(campos).eq('id', dados.id);
  if (res.error) return _err(res.error.message);

  // CASCATA: cancelamento da ÚNICA matrícula ATIVA do aluno no semestre —
  // porta a regra de m5_atualizarSituacaoMatricula (M5_Semestre.gs, sistema
  // antigo): ao cancelar uma matrícula, se essa era a última matrícula ATIVA
  // do aluno NAQUELE SEMESTRE, o cadastro do aluno também é inativado,
  // reaproveitando o motivo do cancelamento. Se o aluno ainda tiver outra
  // matrícula ATIVA no mesmo semestre, nada além do cancelamento desta
  // matrícula acontece. Escopo deliberadamente por semestre (não olha outros
  // semestres) — diferente do botão manual "Inativar" (`alunos.inativar`),
  // que é sempre uma ação explícita e não olha matrículas.
  var aviso = '';
  if (dados.situacao === 'CANCELADA' && atual.data.situacao === 'ATIVA') {
    aviso = await _inativarAlunoSeSemMatriculaAtiva(sb, atual.data.aluno_id, atual.data.semestre_id, dados.id);
  }
  return _ok(null, 'Situação da matrícula atualizada.' + aviso);
}

// -----------------------------------------------------------------------------
// _inativarAlunoSeSemMatriculaAtiva() — ver comentário acima em
// _matriculasAtualizarSituacao. Conta as matrículas ATIVA do aluno no mesmo
// semestre (excluindo a que acabou de ser cancelada); se não sobrar nenhuma,
// inativa `alunos.situacao_ativo`. Nunca lança — no pior caso (ex.: papel sem
// permissão de UPDATE em `alunos`), devolve um aviso e a matrícula já
// cancelada continua válida.
// -----------------------------------------------------------------------------
async function _inativarAlunoSeSemMatriculaAtiva(sb, alunoId, semestreId, matriculaExcluidaId) {
  var outras = await sb.from('matriculas').select('id', { count: 'exact', head: true })
    .eq('aluno_id', alunoId).eq('semestre_id', semestreId).eq('situacao', 'ATIVA')
    .neq('id', matriculaExcluidaId);
  if (outras.error) {
    console.error('_inativarAlunoSeSemMatriculaAtiva erro ao contar outras matrículas:', outras.error);
    return '';
  }
  if ((outras.count || 0) > 0) return ''; // aluno ainda tem outra matrícula ATIVA neste semestre — não inativa.

  var upd = await sb.from('alunos').update({ situacao_ativo: false }).eq('id', alunoId);
  if (upd.error) {
    console.error('_inativarAlunoSeSemMatriculaAtiva erro ao inativar aluno:', upd.error);
    return ' Atenção: não foi possível inativar automaticamente o cadastro do aluno — ' + upd.error.message;
  }
  return ' O cadastro do aluno foi inativado automaticamente (esta era sua última matrícula ativa no semestre).';
}

async function _matriculasTransferir(sb, dados) {
  if (!dados.matricula_origem_id || !dados.turma_destino_id) {
    return _err('Matrícula de origem e turma de destino são obrigatórias.', 400);
  }
  // Buscar matrícula original
  var orig = await sb.from('matriculas').select('*').eq('id', dados.matricula_origem_id).single();
  if (orig.error || !orig.data) return _err('Matrícula de origem não encontrada.', 404);

  // Mesma checagem de vaga da criação de matrícula, agora sobre a turma de
  // destino da transferência.
  var checagem = await _checarVagaTurma(sb, dados.turma_destino_id, dados.forcar_vaga);
  if (checagem) return checagem;

  // Criar nova matrícula na turma destino
  var nova = await sb.from('matriculas').insert({
    aluno_id:           orig.data.aluno_id,
    turma_id:           dados.turma_destino_id,
    semestre_id:        orig.data.semestre_id,
    situacao:           'ATIVA',
    turma_origem_id:    orig.data.turma_id,
    matricula_origem_id: orig.data.id,
  }).select().single();
  if (nova.error) {
    if (nova.error.code === '23505') return _err('Aluno já matriculado na turma de destino.', 409);
    return _err(nova.error.message);
  }
  // Marcar original como TRANSFERIDA
  await sb.from('matriculas').update({
    situacao:            'TRANSFERIDA',
    turma_destino_id:    dados.turma_destino_id,
    matricula_destino_id: nova.data.id,
  }).eq('id', dados.matricula_origem_id);

  return _ok(nova.data, 'Transferência realizada.');
}

// =============================================================================
// FREQUÊNCIAS
// =============================================================================

async function _frequenciasListar(sb, dados) {
  // Sem embed de `alunos` aqui de propósito: `frequencias` não tem uma FK
  // direta para `alunos` (só `matricula_id`), então `select('*, alunos(...)')`
  // fazia a consulta INTEIRA falhar sem erro visível na tela — parecia que a
  // gravação anterior tinha "sumido" ao reabrir a mesma aula, quando na
  // verdade a LEITURA é que nunca voltava com dado nenhum. Os nomes já vêm
  // por outro caminho (matriculas.listar) em todas as telas que usam isto.
  //
  // Paginação interna (2026-09-25): sem `.range()`, o PostgREST/Supabase
  // aplica um teto padrão de linhas por consulta (tipicamente 1000) e
  // trunca silenciosamente — sem erro — qualquer resultado maior, o que é
  // um risco real aqui: `frequencias.listar({})` sem filtro (usado pelo
  // relatório condensado em f8-relatorios.html) pode facilmente passar de
  // 1000 linhas. Em vez de expor `pagina`/`tamanhoPagina` na API pública
  // (como `_alunosListar` faz) — o que quebraria todo mundo que já chama
  // esta ação esperando `dados` como array simples (f6-diario.html e
  // vários pontos de f8-relatorios.html) — a paginação acontece aqui
  // dentro, de forma transparente: busca em lotes via `.range()` até não
  // haver mais linhas, e devolve o array completo acumulado. O contrato
  // externo (`{sucesso, dados: [...]}`) não muda para ninguém.
  //
  // TAMANHO_LOTE precisa ser MENOR OU IGUAL ao teto real configurado no
  // projeto Supabase (Settings → API → "Max Rows"), senão o próprio lote
  // pode vir truncado sem a gente perceber, reproduzindo o mesmo bug de
  // outra forma. 500 é uma estimativa conservadora (o padrão de fábrica do
  // Supabase é 1000) — ainda não confirmamos o valor real deste projeto
  // especificamente, então isso fica sinalizado como pendência.
  var TAMANHO_LOTE = 500;

  function construirQuery() {
    var q = sb.from('frequencias').select('*');
    if (dados && dados.turma_id)    q = q.eq('turma_id', dados.turma_id);
    if (dados && dados.matricula_id) q = q.eq('matricula_id', dados.matricula_id);
    if (dados && dados.data_aula)   q = q.eq('data_aula', dados.data_aula);
    return q;
  }

  var acumulado = [];
  var pagina = 0;
  while (true) {
    var de = pagina * TAMANHO_LOTE;
    var ate = de + TAMANHO_LOTE - 1;
    var res = await construirQuery().range(de, ate);
    if (res.error) return _err(res.error.message);
    var lote = res.data || [];
    acumulado = acumulado.concat(lote);
    if (lote.length < TAMANHO_LOTE) break;
    pagina++;
  }
  return _ok(acumulado);
}

async function _frequenciasSalvar(sb, dados) {
  // dados.registros = [{ matricula_id, turma_id, semestre_id, data_aula, frequencia, anotacao }]
  if (!dados.registros || !dados.registros.length) return _err('Nenhum registro enviado.', 400);
  var usuario = Auth.getUsuario();
  var registros = dados.registros.map(function(r) {
    return Object.assign({}, r, { registrado_por: usuario ? usuario.id : null });
  });
  var res = await sb.from('frequencias').upsert(registros, { onConflict: 'matricula_id,data_aula' });
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Frequências salvas.');
}

// =============================================================================
// CONTEÚDO
// =============================================================================

async function _conteudoListar(sb, dados) {
  var query = sb.from('conteudo').select('*').order('data_aula', { ascending: false });
  if (dados && dados.turma_id) query = query.eq('turma_id', dados.turma_id);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _conteudoSalvar(sb, dados) {
  if (!dados.turma_id || !dados.data_aula || !dados.conteudo_ministrado) {
    return _err('Turma, data e conteúdo são obrigatórios.', 400);
  }
  var usuario = Auth.getUsuario();
  var res = await sb.from('conteudo').upsert({
    turma_id:            dados.turma_id,
    semestre_id:         dados.semestre_id,
    data_aula:           dados.data_aula,
    conteudo_ministrado: dados.conteudo_ministrado,
    registrado_por:      usuario ? usuario.id : null,
  }, { onConflict: 'turma_id,data_aula' });
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Conteúdo salvo.');
}

// =============================================================================
// NOTAS
// =============================================================================

async function _notasListar(sb, dados) {
  var query = sb.from('notas').select('*, avaliacoes(componente_nota, tipo)');
  if (dados && dados.matricula_id) query = query.eq('matricula_id', dados.matricula_id);
  if (dados && dados.semestre_id)  query = query.eq('semestre_id', dados.semestre_id);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _notasSalvar(sb, dados) {
  // dados.notas = [{ matricula_id, semestre_id, avaliacao_id, componente_nota, subcomponente_nota, valor_nota }]
  if (!dados.notas || !dados.notas.length) return _err('Nenhuma nota enviada.', 400);
  var usuario = Auth.getUsuario();
  var notas = dados.notas.map(function(n) {
    return Object.assign({}, n, { registrado_por: usuario ? usuario.id : null });
  });
  var res = await sb.from('notas').upsert(notas, { onConflict: 'matricula_id,componente_nota,subcomponente_nota' });
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Notas salvas.');
}

// =============================================================================
// OCORRÊNCIAS
// =============================================================================

async function _ocorrenciasListar(sb, dados) {
  var query = sb.from('ocorrencias')
    .select('*, alunos(nome_completo, nome_social), ocorrencia_destinatarios(usuario_id), ocorrencia_respostas(id, texto, criado_em, autor_id)')
    .order('criado_em', { ascending: false });
  if (dados && dados.aluno_id)     query = query.eq('aluno_id', dados.aluno_id);
  if (dados && dados.status)       query = query.eq('status', dados.status);
  if (dados && dados.tipo)         query = query.eq('tipo', dados.tipo);
  if (dados && dados.semestre_id)  query = query.eq('semestre_ref_id', dados.semestre_id);
  var res = await query;
  if (res.error) return _err(res.error.message);
  var linhas = res.data || [];
  // Nomes resolvidos à parte via usuarios_publico (join direto com `usuarios`
  // não funciona mais para quem não é admin/coordenação).
  var ids = [];
  linhas.forEach(function(o) {
    if (o.criado_por_id) ids.push(o.criado_por_id);
    (o.ocorrencia_respostas || []).forEach(function(r) { if (r.autor_id) ids.push(r.autor_id); });
  });
  var mapaNomes = await _nomesPublicos(sb, ids);
  linhas.forEach(function(o) {
    o.usuarios = o.criado_por_id ? { nome: (mapaNomes[o.criado_por_id] || {}).nome || '' } : null;
    (o.ocorrencia_respostas || []).forEach(function(r) {
      r.autor = r.autor_id ? { nome: (mapaNomes[r.autor_id] || {}).nome || '' } : null;
    });
  });
  return _ok(linhas);
}

// Papéis que podem ser usados como "destinatário" de uma ocorrência em vez
// de um usuário específico (ex.: notificar toda a coordenação, não uma
// pessoa só). O front-end manda o nome do papel sufixado com "-role"
// (ex.: 'coordenacao-role'); aqui resolvemos para os IDs de todos os
// usuários ativos com aquele papel.
var PAPEIS_DESTINATARIO_VALIDOS = ['coordenacao', 'secretaria', 'admin'];

async function _resolverDestinatarios(sb, destinatarios) {
  destinatarios = destinatarios || [];
  var usuarioIds = destinatarios.filter(function(d) { return typeof d === 'string' && !d.endsWith('-role'); });
  var papeis = destinatarios
    .filter(function(d) { return typeof d === 'string' && d.endsWith('-role'); })
    .map(function(d) { return d.slice(0, -('-role'.length)); })
    .filter(function(p) { return PAPEIS_DESTINATARIO_VALIDOS.indexOf(p) !== -1; });

  if (papeis.length) {
    // Não dá mais para consultar `usuarios` diretamente (tabela travada a
    // admin/coordenação) — a resolução por papel passa por uma function
    // SECURITY DEFINER que só devolve o id, nunca o restante do cadastro.
    var res = await sb.rpc('usuarios_ids_por_papel', { papeis: papeis });
    if (!res.error && res.data) {
      res.data.forEach(function(u) { usuarioIds.push(u.id); });
    }
  }
  // Remove duplicados (ex.: um usuário específico que também caiu no papel)
  return usuarioIds.filter(function(id, i) { return usuarioIds.indexOf(id) === i; });
}

async function _ocorrenciasCriar(sb, dados) {
  if (!dados.aluno_id || !dados.tipo || !dados.titulo || !dados.descricao) {
    return _err('Aluno, tipo, título e descrição são obrigatórios.', 400);
  }
  var usuario = Auth.getUsuario();
  var res = await sb.from('ocorrencias').insert({
    aluno_id:       dados.aluno_id,
    semestre_ref_id: dados.semestre_ref_id || null,
    turma_id:       dados.turma_id || null,
    tipo:           dados.tipo,
    titulo:         dados.titulo,
    descricao:      dados.descricao,
    status:         'PENDENTE',
    criado_por_id:  usuario ? usuario.id : null,
  }).select().single();
  if (res.error) return _err(res.error.message);

  // Inserir destinatários — usuarios específicos e/ou papéis inteiros
  // (ex.: 'coordenacao-role' notifica todos os usuários com papel=coordenacao)
  var usuarioIds = await _resolverDestinatarios(sb, dados.destinatarios);
  if (usuarioIds.length) {
    var dests = usuarioIds.map(function(uid) {
      return { ocorrencia_id: res.data.id, usuario_id: uid };
    });
    await sb.from('ocorrencia_destinatarios').insert(dests);
  }
  return _ok(res.data, 'Ocorrência registrada.');
}

async function _ocorrenciasResponder(sb, dados) {
  if (!dados.ocorrencia_id || !dados.texto) return _err('ID e texto são obrigatórios.', 400);
  var usuario = Auth.getUsuario();
  var res = await sb.from('ocorrencia_respostas').insert({
    ocorrencia_id: dados.ocorrencia_id,
    aluno_id:      dados.aluno_id || null,
    autor_id:      usuario ? usuario.id : null,
    texto:         dados.texto,
  }).select().single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data, 'Resposta registrada.');
}

async function _ocorrenciasResolverStatus(sb, dados) {
  if (!dados.id || !dados.status) return _err('ID e status são obrigatórios.', 400);
  var res = await sb.from('ocorrencias').update({ status: dados.status }).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Status atualizado.');
}

// =============================================================================
// CONFIG
// =============================================================================

async function _configGet(sb) {
  var res = await sb.from('config_escola').select('*').single();
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _configSalvar(sb, dados) {
  var res = await sb.from('config_escola').update(dados).neq('id', '00000000-0000-0000-0000-000000000000');
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Configurações salvas.');
}

// =============================================================================
// PÚBLICO-ALVO (tipos)
// =============================================================================
// Tabela `publico_alvo_tipos` (claude/etapa8-publico-alvo.sql): id, nome,
// prioritario, ativo, ordem, criado_em, atualizado_em.
//   • Leitura: qualquer autenticado (o select do cadastro de alunos precisa).
//   • Escrita: só admin (RLS). Não existe exclusão — tipo que sai de uso é
//     inativado (ativo = false), para não deixar aluno apontando para nada.
//   • alunos_sensiveis.publico_alvo guarda o TEXTO de `nome`, não o id. Ao
//     renomear um tipo, um trigger no banco atualiza o texto em todos os
//     alunos que o usam — não é preciso fazer nada aqui para isso.
// -----------------------------------------------------------------------------

async function _publicoAlvoListar(sb, dados) {
  var query = sb.from('publico_alvo_tipos')
    .select('id, nome, prioritario, ativo, ordem')
    .order('ordem')
    .order('nome');
  if (dados && dados.somenteAtivos) query = query.eq('ativo', true);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data || []);
}

async function _publicoAlvoSalvar(sb, dados) {
  dados = dados || {};
  var campos = {};
  if ('nome' in dados) {
    var nome = String(dados.nome || '').trim();
    if (!nome) return _err('Informe o nome do tipo.', 400);
    campos.nome = nome;
  }
  if ('prioritario' in dados) campos.prioritario = !!dados.prioritario;
  if ('ativo' in dados)       campos.ativo = !!dados.ativo;
  if ('ordem' in dados) {
    var ordem = parseInt(dados.ordem, 10);
    if (isNaN(ordem)) return _err('Ordem inválida.', 400);
    campos.ordem = ordem;
  }

  var res;
  if (dados.id) {
    // .select() para saber se alguma linha foi realmente alterada: quando o
    // RLS barra um UPDATE, o Supabase não devolve erro — só zero linhas.
    res = await sb.from('publico_alvo_tipos').update(campos).eq('id', dados.id).select();
  } else {
    if (!campos.nome) return _err('Informe o nome do tipo.', 400);
    res = await sb.from('publico_alvo_tipos').insert(campos).select();
  }
  if (res.error) {
    if (res.error.code === '23505') return _err('Já existe um tipo com esse nome.', 409);
    if (res.error.code === '42501') return _err('Somente o administrador pode alterar os tipos de público-alvo.', 403);
    return _err(res.error.message);
  }
  if (!res.data || !res.data.length) {
    return _err('Nenhuma alteração gravada. Somente o administrador pode alterar os tipos de público-alvo.', 403);
  }
  return _ok(res.data[0], dados.id ? 'Tipo atualizado.' : 'Tipo criado.');
}

// =============================================================================
// COMENTÁRIOS
// =============================================================================

async function _comentariosListar(sb, dados) {
  var query = sb.from('comentarios').select('*').order('etapa');
  if (dados && dados.matricula_id) query = query.eq('matricula_id', dados.matricula_id);
  if (dados && dados.turma_id)     query = query.eq('turma_id', dados.turma_id);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _comentariosSalvar(sb, dados) {
  if (!dados.matricula_id || !dados.etapa || !dados.comentario) {
    return _err('matricula_id, etapa e comentario são obrigatórios.', 400);
  }
  var usuario = Auth.getUsuario();
  var res = await sb.from('comentarios').upsert({
    matricula_id: dados.matricula_id,
    semestre_id:  dados.semestre_id,
    turma_id:     dados.turma_id,
    etapa:        dados.etapa,
    comentario:   dados.comentario,
    autor_id:     usuario ? usuario.id : null,
  }, { onConflict: 'matricula_id,etapa' });
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Comentário salvo.');
}

// =============================================================================
// RELATÓRIOS
// =============================================================================

async function _relatoriosFrequencia(sb, dados) {
  var query = sb.from('frequencia_resumo').select('*');
  if (dados && dados.turma_id)    query = query.eq('turma_id', dados.turma_id);
  if (dados && dados.semestre_id) query = query.eq('semestre_id', dados.semestre_id);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

// Funções auxiliares de ocorrências adicionais
async function _ocorrenciasListarRespostas(sb, dados) {
  if (!dados.ocorrenciaId) return _err('ocorrenciaId é obrigatório.', 400);
  var res = await sb.from('ocorrencia_respostas')
    .select('*')
    .eq('ocorrencia_id', dados.ocorrenciaId)
    .order('criado_em');
  if (res.error) return _err(res.error.message);
  var linhas = res.data || [];
  var mapaNomes = await _nomesPublicos(sb, linhas.map(function(r) { return r.autor_id; }));
  linhas.forEach(function(r) {
    r.autor = r.autor_id ? { nome: (mapaNomes[r.autor_id] || {}).nome || '' } : null;
  });
  return _ok(linhas);
}

async function _ocorrenciasExcluir(sb, dados) {
  var id = dados.ocorrenciaId || dados.id;
  if (!id) return _err('ID é obrigatório.', 400);
  var res = await sb.from('ocorrencias').delete().eq('id', id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Ocorrência excluída.');
}

async function _ocorrenciasProfessoresDasTurmas(sb, dados) {
  if (!dados.alunoId) return _err('alunoId é obrigatório.', 400);
  // Buscar turmas ativas do aluno no semestre atual
  var semAtual = await sb.from('semestres').select('id').eq('semestre_atual', true).single();
  if (semAtual.error || !semAtual.data) return _ok([]);
  var mats = await sb.from('matriculas')
    .select('turma_id, turmas!matriculas_turma_id_fkey(professor_id, estagio, curso_id, cursos(sigla))')
    .eq('aluno_id', dados.alunoId)
    .eq('semestre_id', semAtual.data.id)
    .eq('situacao', 'ATIVA');
  if (mats.error) return _err(mats.error.message);
  var linhas = mats.data || [];
  var mapaNomes = await _nomesPublicos(sb, linhas.map(function(m) { return m.turmas && m.turmas.professor_id; }));
  var profs = [];
  var vistos = {};
  linhas.forEach(function(m) {
    var t = m.turmas;
    if (!t || !t.professor_id) return;
    var uid = t.professor_id;
    if (vistos[uid]) return;
    vistos[uid] = true;
    profs.push({ UsuarioID: uid, Nome: (mapaNomes[uid] || {}).nome || '', Turma: m.turma_id, Estagio: t.estagio, CursoID: t.curso_id });
  });
  return _ok(profs);
}

async function _ocorrenciasTurmasAtivasDoAluno(sb, dados) {
  if (!dados.alunoId) return _err('alunoId é obrigatório.', 400);
  var semAtual = await sb.from('semestres').select('id').eq('semestre_atual', true).single();
  if (semAtual.error || !semAtual.data) return _ok([]);
  var mats = await sb.from('matriculas')
    .select('turma_id, turmas!matriculas_turma_id_fkey(id, external_id, estagio, curso_id, professor_id, cursos(sigla))')
    .eq('aluno_id', dados.alunoId)
    .eq('semestre_id', semAtual.data.id)
    .eq('situacao', 'ATIVA');
  if (mats.error) return _err(mats.error.message);
  var linhas = mats.data || [];
  var mapaNomes = await _nomesPublicos(sb, linhas.map(function(m) { return m.turmas && m.turmas.professor_id; }));
  var usuario = Auth.getUsuario();
  var turmas = linhas.map(function(m) {
    var t = m.turmas;
    return {
      TurmaID:       t.external_id || t.id,
      id:            t.id,
      ProfessorID:   t.professor_id,
      ProfessorNome: t.professor_id ? ((mapaNomes[t.professor_id] || {}).nome || '') : '',
      Estagio:       t.estagio,
      CursoID:       t.curso_id,
    };
  }).filter(function(t) {
    if (!usuario || usuario.papel !== 'professor') return true;
    return t.ProfessorID === usuario.id;
  });
  return _ok(turmas);
}

async function _relatoriosBoletim(sb, dados) {
  if (!dados.matricula_id) return _err('ID da matrícula é obrigatório.', 400);
  var notas = await sb.from('notas')
    .select('*, avaliacoes(componente_nota, tipo, nota_aprovacao)')
    .eq('matricula_id', dados.matricula_id);
  var freq = await sb.from('frequencia_resumo')
    .select('*')
    .eq('matricula_id', dados.matricula_id)
    .single();
  if (notas.error) return _err(notas.error.message);
  return _ok({ notas: notas.data, frequencia: freq.data || null });
}
