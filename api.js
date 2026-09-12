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
    var busca = await sb.from('usuarios')
      .select('email')
      .eq('login', emailOuLogin)
      .eq('situacao_ativo', true)
      .single();
    if (busca.error || !busca.data) {
      return _err('Usuário não encontrado.', 401);
    }
    emailFinal = busca.data.email;
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

// =============================================================================
// ALUNOS
// =============================================================================

async function _alunosListar(sb, dados) {
  var query = sb.from('alunos')
    .select('id, external_id, nome_completo, nome_social, nascimento, nascimento_uf, nascimento_municipio, genero, raca, estado_civil, estrangeiro, telefone, email, municipio, uf, bairro, pcd, pcd_tipo, situacao_ativo, inscricao_data_hora')
    .order('nome_completo');
  if (dados && dados.somenteAtivos) query = query.eq('situacao_ativo', true);
  var res = await query;
  if (res.error) return _err(res.error.message);

  // Normalizar para formato esperado pelos módulos HTML existentes (PascalCase + campos legados)
  var lista = (res.data || []).map(_normalizarAluno);
  return _ok({ dados: lista, totalRegistros: lista.length, totalPaginas: 1 });
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
  return _ok((res.data || []).map(_normalizarAluno));
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

  // Inserir dados sensíveis via Edge Function (se houver)
  if (dados.cpf_ou_cin || dados.cep || dados.endereco || dados.pcd_laudo_url) {
    await _salvarSensiveis(sb, res.data.id, dados);
  }
  return _ok(res.data, 'Aluno cadastrado com sucesso.');
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
    await _salvarSensiveis(sb, dados.id, camposSensiveis);
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

// Salvar dados sensíveis — placeholder até Edge Function estar pronta
// Por ora usa service_role via função RPC segura (a ser criada no banco)
async function _salvarSensiveis(sb, alunoId, dados) {
  // TODO semana 3: implementar via Edge Function get-aluno-sensivel
  console.warn('_salvarSensiveis: Edge Function não implementada ainda. Dados sensíveis não foram salvos.');
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
// TURMAS
// =============================================================================

async function _turmasListar(sb, dados) {
  var query = sb.from('turmas')
    .select('*, semestres(rotulo), cursos(nome, sigla, external_id), professor:usuarios!professor_id(id, nome, external_id)')
    .order('external_id');
  if (dados && dados.semestre_id) query = query.eq('semestre_id', dados.semestre_id);
  if (dados && dados.professor_id) query = query.eq('professor_id', dados.professor_id);
  if (dados && dados.situacao)     query = query.eq('situacao', dados.situacao);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
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
    .select('*, alunos(external_id, nome_completo, nome_social, pcd), turmas(id, external_id, estagio, curso_id)')
    .order('data_matricula', { ascending: false, nullsFirst: false });
  if (dados && dados.turma_id)    query = query.eq('turma_id', dados.turma_id);
  if (dados && dados.aluno_id)    query = query.eq('aluno_id', dados.aluno_id);
  if (dados && dados.semestre_id) query = query.eq('semestre_id', dados.semestre_id);
  if (dados && dados.situacao)    query = query.eq('situacao', dados.situacao);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
}

async function _matriculasCriar(sb, dados) {
  if (!dados.aluno_id || !dados.turma_id || !dados.semestre_id) {
    return _err('Aluno, turma e semestre são obrigatórios.', 400);
  }
  // Verificar semestre aberto
  var sem = await sb.from('semestres').select('edicao_ativa').eq('id', dados.semestre_id).single();
  if (sem.error || !sem.data.edicao_ativa) return _err('Semestre fechado para edição.', 403);

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

async function _matriculasAtualizarSituacao(sb, dados) {
  if (!dados.id || !dados.situacao) return _err('ID e situação são obrigatórios.', 400);
  var campos = { situacao: dados.situacao };
  if (dados.motivo_cancelamento) campos.motivo_cancelamento = dados.motivo_cancelamento;
  if (dados.situacao === 'CANCELADA') campos.data_cancelamento = new Date().toISOString();
  var res = await sb.from('matriculas').update(campos).eq('id', dados.id);
  if (res.error) return _err(res.error.message);
  return _ok(null, 'Situação da matrícula atualizada.');
}

async function _matriculasTransferir(sb, dados) {
  if (!dados.matricula_origem_id || !dados.turma_destino_id) {
    return _err('Matrícula de origem e turma de destino são obrigatórias.', 400);
  }
  // Buscar matrícula original
  var orig = await sb.from('matriculas').select('*').eq('id', dados.matricula_origem_id).single();
  if (orig.error || !orig.data) return _err('Matrícula de origem não encontrada.', 404);

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
  var query = sb.from('frequencias').select('*, alunos(nome_completo, nome_social)');
  if (dados && dados.turma_id)    query = query.eq('turma_id', dados.turma_id);
  if (dados && dados.matricula_id) query = query.eq('matricula_id', dados.matricula_id);
  if (dados && dados.data_aula)   query = query.eq('data_aula', dados.data_aula);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
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
    .select('*, alunos(nome_completo, nome_social), usuarios!criado_por_id(nome), ocorrencia_destinatarios(usuario_id), ocorrencia_respostas(id, texto, criado_em, autor:usuarios!autor_id(nome))')
    .order('criado_em', { ascending: false });
  if (dados && dados.aluno_id)     query = query.eq('aluno_id', dados.aluno_id);
  if (dados && dados.status)       query = query.eq('status', dados.status);
  if (dados && dados.semestre_id)  query = query.eq('semestre_ref_id', dados.semestre_id);
  var res = await query;
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
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

  // Inserir destinatários
  if (dados.destinatarios && dados.destinatarios.length) {
    var dests = dados.destinatarios.map(function(uid) {
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
    .select('*, autor:usuarios!autor_id(nome)')
    .eq('ocorrencia_id', dados.ocorrenciaId)
    .order('criado_em');
  if (res.error) return _err(res.error.message);
  return _ok(res.data);
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
    .select('turma_id, turmas(professor_id, estagio, curso_id, cursos(sigla), professor:usuarios!professor_id(id, nome))')
    .eq('aluno_id', dados.alunoId)
    .eq('semestre_id', semAtual.data.id)
    .eq('situacao', 'ATIVA');
  if (mats.error) return _err(mats.error.message);
  var profs = [];
  var vistos = {};
  (mats.data || []).forEach(function(m) {
    var t = m.turmas;
    if (!t || !t.professor) return;
    var uid = t.professor.id;
    if (vistos[uid]) return;
    vistos[uid] = true;
    profs.push({ UsuarioID: uid, Nome: t.professor.nome, Turma: m.turma_id, Estagio: t.estagio, CursoID: t.curso_id });
  });
  return _ok(profs);
}

async function _ocorrenciasTurmasAtivasDoAluno(sb, dados) {
  if (!dados.alunoId) return _err('alunoId é obrigatório.', 400);
  var semAtual = await sb.from('semestres').select('id').eq('semestre_atual', true).single();
  if (semAtual.error || !semAtual.data) return _ok([]);
  var mats = await sb.from('matriculas')
    .select('turma_id, turmas(id, external_id, estagio, curso_id, professor_id, cursos(sigla), professor:usuarios!professor_id(nome))')
    .eq('aluno_id', dados.alunoId)
    .eq('semestre_id', semAtual.data.id)
    .eq('situacao', 'ATIVA');
  if (mats.error) return _err(mats.error.message);
  var usuario = Auth.getUsuario();
  var turmas = (mats.data || []).map(function(m) {
    var t = m.turmas;
    return {
      TurmaID:       t.external_id || t.id,
      id:            t.id,
      ProfessorID:   t.professor_id,
      ProfessorNome: t.professor ? t.professor.nome : '',
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
